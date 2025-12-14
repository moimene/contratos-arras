/**
 * Hook: useTipoRolUsuario
 * 
 * Resuelve el rol del usuario actual con prioridad:
 * 1. Query param ?rol=XXX (para QA/demos)
 * 2. localStorage cf_role (mientras no hay auth)
 * 3. Fallback: OBSERVADOR
 * 
 * Preparado para integrar auth en el futuro.
 */

import { useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

// ============================================================================
// TIPOS - Re-exportamos TipoRolUsuario desde aquí como fuente de verdad
// ============================================================================

export type TipoRolUsuario =
    | 'ADMIN'
    | 'VENDEDOR'
    | 'COMPRADOR'
    | 'NOTARIO'
    | 'TERCERO'
    | 'OBSERVADOR';

export type RolSource = 'query' | 'localStorage' | 'fallback';

export interface UseTipoRolUsuarioResult {
    role: TipoRolUsuario;
    setRole: (r: TipoRolUsuario) => void;
    source: RolSource;
    isFromQuery: boolean;
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

// ============================================================================
// HELPERS
// ============================================================================

function isValidRole(value: string | null): value is TipoRolUsuario {
    return !!value && (VALID_ROLES as string[]).includes(value.toUpperCase());
}

function normalizeRole(value: string): TipoRolUsuario {
    return value.toUpperCase() as TipoRolUsuario;
}

// ============================================================================
// HOOK
// ============================================================================

export function useTipoRolUsuario(): UseTipoRolUsuarioResult {
    const location = useLocation();

    // Memoize role resolution
    const resolved = useMemo(() => {
        // 1. Check query param first (highest priority)
        const params = new URLSearchParams(location.search);
        const fromQuery = params.get('rol');

        if (isValidRole(fromQuery)) {
            return {
                role: normalizeRole(fromQuery),
                source: 'query' as const,
                isFromQuery: true
            };
        }

        // 2. Check localStorage (persistence while no auth)
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (isValidRole(saved)) {
                return {
                    role: normalizeRole(saved),
                    source: 'localStorage' as const,
                    isFromQuery: false
                };
            }
        } catch {
            // localStorage not available (SSR, private mode, etc.)
        }

        // 3. Fallback
        return {
            role: DEFAULT_ROLE,
            source: 'fallback' as const,
            isFromQuery: false
        };
    }, [location.search]);

    // Setter for manual role selection
    const setRole = useCallback((newRole: TipoRolUsuario) => {
        try {
            localStorage.setItem(STORAGE_KEY, newRole);
            // Force re-render by updating the URL without the rol param
            // This is a simple approach; could also use state
            window.dispatchEvent(new Event('storage'));
        } catch {
            // localStorage not available
            console.warn('[useTipoRolUsuario] localStorage not available');
        }
    }, []);

    return {
        role: resolved.role,
        setRole,
        source: resolved.source,
        isFromQuery: resolved.isFromQuery
    };
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Labels para mostrar en UI
 */
export const ROL_LABELS: Record<TipoRolUsuario, string> = {
    ADMIN: 'Administrador',
    VENDEDOR: 'Vendedor',
    COMPRADOR: 'Comprador',
    NOTARIO: 'Notario',
    TERCERO: 'Tercero',
    OBSERVADOR: 'Observador'
};

/**
 * Iconos para cada rol
 */
export const ROL_ICONS: Record<TipoRolUsuario, string> = {
    ADMIN: '👤',
    VENDEDOR: '🏠',
    COMPRADOR: '🔑',
    NOTARIO: '⚖️',
    TERCERO: '👥',
    OBSERVADOR: '👁️'
};

/**
 * Verifica si un rol puede ver todas las acciones (admin mode)
 */
export function isAdminRole(role: TipoRolUsuario): boolean {
    return role === 'ADMIN';
}

/**
 * Verifica si un rol es parte activa del contrato
 */
export function isParticipantRole(role: TipoRolUsuario): boolean {
    return ['VENDEDOR', 'COMPRADOR'].includes(role);
}
