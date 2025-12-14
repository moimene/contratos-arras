/**
 * Hook: useTipoRolUsuario
 * 
 * Resuelve el rol del usuario actual con prioridad según entorno:
 * 
 * PRODUCCIÓN:
 * 1. Si hay usuario autenticado → fetch desde API (fuente de verdad)
 * 2. Fallback → OBSERVADOR
 * 
 * DESARROLLO/QA:
 * 1. Query param ?rol=XXX (para QA/demos)
 * 2. localStorage cf_role (persistencia local)
 * 3. Si hay auth → fetch desde API
 * 4. Fallback → OBSERVADOR
 */

import { useMemo, useCallback, useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';

// ============================================================================
// TIPOS
// ============================================================================

export type TipoRolUsuario =
    | 'ADMIN'
    | 'VENDEDOR'
    | 'COMPRADOR'
    | 'NOTARIO'
    | 'TERCERO'
    | 'OBSERVADOR';

export type RolSource = 'query' | 'localStorage' | 'api' | 'fallback';

export interface RolePermissions {
    canView: boolean;
    canUploadDocs: boolean;
    canValidateDocs: boolean;
    canRejectDocs: boolean;
    canDeleteDocs: boolean;
    canSendCommunications: boolean;
    canGenerateCertificate: boolean;
    canCreateNotaryAppointment: boolean;
    canSign: boolean;
}

export interface UseTipoRolUsuarioResult {
    role: TipoRolUsuario;
    setRole: (r: TipoRolUsuario) => void;
    source: RolSource;
    isFromQuery: boolean;
    permissions: RolePermissions;
    loading: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const VALID_ROLES: TipoRolUsuario[] = [
    'ADMIN',
    'VENDEDOR',
    'COMPRADOR',
    'NOTARIO',
    'TERCERO',
    'OBSERVADOR'
];

const STORAGE_KEY = 'cf_role';
const DEFAULT_ROLE: TipoRolUsuario = 'OBSERVADOR';
const IS_PROD = import.meta.env.PROD;
const API_URL = import.meta.env.VITE_API_URL || '';

const DEFAULT_PERMISSIONS: RolePermissions = {
    canView: true,
    canUploadDocs: false,
    canValidateDocs: false,
    canRejectDocs: false,
    canDeleteDocs: false,
    canSendCommunications: false,
    canGenerateCertificate: false,
    canCreateNotaryAppointment: false,
    canSign: false
};

// ============================================================================
// HELPERS
// ============================================================================

function isValidRole(value: string | null): value is TipoRolUsuario {
    return !!value && (VALID_ROLES as string[]).includes(value.toUpperCase());
}

function normalizeRole(value: string): TipoRolUsuario {
    return value.toUpperCase() as TipoRolUsuario;
}

function getDevModeOverride(location: ReturnType<typeof useLocation>): { role: TipoRolUsuario; source: RolSource } | null {
    // In PROD, ignore query param and localStorage overrides
    if (IS_PROD) return null;

    // 1. Check query param
    const params = new URLSearchParams(location.search);
    const fromQuery = params.get('rol');
    if (isValidRole(fromQuery)) {
        return { role: normalizeRole(fromQuery), source: 'query' };
    }

    // 2. Check localStorage
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (isValidRole(saved)) {
            return { role: normalizeRole(saved), source: 'localStorage' };
        }
    } catch {
        // localStorage not available
    }

    return null;
}

// ============================================================================
// HOOK
// ============================================================================

export function useTipoRolUsuario(): UseTipoRolUsuarioResult {
    const location = useLocation();
    const { contratoId } = useParams<{ contratoId: string }>();
    const { user, loading: authLoading } = useAuth();

    const [apiRole, setApiRole] = useState<TipoRolUsuario | null>(null);
    const [apiPermissions, setApiPermissions] = useState<RolePermissions>(DEFAULT_PERMISSIONS);
    const [apiLoading, setApiLoading] = useState(false);

    // Fetch role from API when user is authenticated and we have a contratoId
    useEffect(() => {
        if (!contratoId || !user) {
            setApiRole(null);
            return;
        }

        const fetchRole = async () => {
            setApiLoading(true);
            try {
                const response = await fetch(`${API_URL}/api/contracts/${contratoId}/role`, {
                    headers: {
                        'x-user-id': user.id,
                        'x-user-email': user.email || ''
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.data?.role) {
                        setApiRole(data.data.role);
                        if (data.data.permissions) {
                            setApiPermissions(data.data.permissions);
                        }
                    }
                }
            } catch (error) {
                console.warn('[useTipoRolUsuario] Failed to fetch role from API:', error);
            } finally {
                setApiLoading(false);
            }
        };

        fetchRole();
    }, [contratoId, user]);

    // Resolve role with proper priority
    const resolved = useMemo(() => {
        // Check for dev mode override first (only in non-prod)
        const devOverride = getDevModeOverride(location);
        if (devOverride) {
            return {
                role: devOverride.role,
                source: devOverride.source,
                isFromQuery: devOverride.source === 'query'
            };
        }

        // Use API role if available
        if (apiRole) {
            return {
                role: apiRole,
                source: 'api' as const,
                isFromQuery: false
            };
        }

        // Fallback
        return {
            role: DEFAULT_ROLE,
            source: 'fallback' as const,
            isFromQuery: false
        };
    }, [location.search, apiRole]);

    // Setter for manual role selection (dev mode only)
    const setRole = useCallback((newRole: TipoRolUsuario) => {
        if (IS_PROD) {
            console.warn('[useTipoRolUsuario] Cannot override role in production');
            return;
        }
        try {
            localStorage.setItem(STORAGE_KEY, newRole);
            window.dispatchEvent(new Event('storage'));
        } catch {
            console.warn('[useTipoRolUsuario] localStorage not available');
        }
    }, []);

    return {
        role: resolved.role,
        setRole,
        source: resolved.source,
        isFromQuery: resolved.isFromQuery,
        permissions: apiPermissions,
        loading: authLoading || apiLoading
    };
}

// ============================================================================
// UTILITIES
// ============================================================================

export const ROL_LABELS: Record<TipoRolUsuario, string> = {
    ADMIN: 'Administrador',
    VENDEDOR: 'Vendedor',
    COMPRADOR: 'Comprador',
    NOTARIO: 'Notario',
    TERCERO: 'Tercero',
    OBSERVADOR: 'Observador'
};

export const ROL_ICONS: Record<TipoRolUsuario, string> = {
    ADMIN: '👤',
    VENDEDOR: '🏠',
    COMPRADOR: '🔑',
    NOTARIO: '⚖️',
    TERCERO: '👥',
    OBSERVADOR: '👁️'
};

export function isAdminRole(role: TipoRolUsuario): boolean {
    return role === 'ADMIN';
}

export function isParticipantRole(role: TipoRolUsuario): boolean {
    return ['VENDEDOR', 'COMPRADOR'].includes(role);
}
