/**
 * MandatoContext - Contexto de mandato activo para el expediente
 * 
 * Gestiona qué mandato está activo cuando un usuario tiene múltiples mandatos
 * en un mismo expediente (típico caso de agencia).
 * 
 * Funcionalidades:
 * - Auto-selección si solo hay 1 mandato
 * - Persistencia en localStorage por contrato+usuario
 * - Selector en UI si hay múltiples mandatos
 * - Envío automático de X-Mandato-Id header
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

// ============================================
// TYPES
// ============================================

export interface MandatoExpediente {
    id: string;
    miembro_expediente_id: string;
    tipo_mandato: string;
    puede_subir_documentos: boolean;
    puede_invitar: boolean;
    puede_validar_documentos: boolean;
    puede_firmar: boolean;
    puede_enviar_comunicaciones: boolean;
    estado_mandato: string;
}

export interface MiembroConMandatos {
    id: string;
    usuario_id: string;
    contrato_id: string;
    tipo_rol_usuario: string;
    estado_acceso: string;
    mandatos: MandatoExpediente[];
}

interface MandatoContextValue {
    // Estado actual
    miembro: MiembroConMandatos | null;
    mandatoActivo: MandatoExpediente | null;
    mandatosDisponibles: MandatoExpediente[];

    // Helpers
    tieneMultiplesMandatos: boolean;
    necesitaSeleccion: boolean;

    // Acciones
    setMandatoActivoId: (id: string) => void;

    // Para requests
    getMandatoHeader: () => Record<string, string>;

    // Estado de carga
    loading: boolean;
    error: string | null;
}

const MandatoContext = createContext<MandatoContextValue | null>(null);

// ============================================
// STORAGE HELPERS
// ============================================

const STORAGE_KEY_PREFIX = 'mandato_activo_';

function getStorageKey(contratoId: string, usuarioId: string): string {
    return `${STORAGE_KEY_PREFIX}${contratoId}_${usuarioId}`;
}

function getStoredMandatoId(contratoId: string, usuarioId: string): string | null {
    try {
        const key = getStorageKey(contratoId, usuarioId);
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

function setStoredMandatoId(contratoId: string, usuarioId: string, mandatoId: string): void {
    try {
        const key = getStorageKey(contratoId, usuarioId);
        localStorage.setItem(key, mandatoId);
    } catch {
        // Silently fail if localStorage is unavailable
    }
}

// ============================================
// LABELS
// ============================================

export const MANDATO_TYPE_LABELS: Record<string, string> = {
    PARTE_COMPRADORA: 'Asesor de la parte compradora',
    PARTE_VENDEDORA: 'Asesor de la parte vendedora',
    AMBAS_PARTES: 'Agencia (ambas partes)',
    NOTARIA: 'Asistente notarial',
    OBSERVADOR_TECNICO: 'Observador técnico'
};

export const MANDATO_TYPE_ICONS: Record<string, string> = {
    PARTE_COMPRADORA: '🔑',
    PARTE_VENDEDORA: '🏠',
    AMBAS_PARTES: '🤝',
    NOTARIA: '⚖️',
    OBSERVADOR_TECNICO: '👁️'
};

export function getMandatoLabel(tipoMandato: string): string {
    return MANDATO_TYPE_LABELS[tipoMandato] || tipoMandato;
}

export function getMandatoIcon(tipoMandato: string): string {
    return MANDATO_TYPE_ICONS[tipoMandato] || '🧭';
}

// ============================================
// PROVIDER
// ============================================

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface MandatoProviderProps {
    contratoId: string;
    usuarioId: string;
    children: React.ReactNode;
}

export function MandatoProvider({ contratoId, usuarioId, children }: MandatoProviderProps) {
    const [miembro, setMiembro] = useState<MiembroConMandatos | null>(null);
    const [mandatoActivoId, setMandatoActivoIdState] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch miembro y mandatos
    useEffect(() => {
        async function fetchMiembro() {
            if (!contratoId || !usuarioId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const response = await fetch(
                    `${API_URL}/api/contratos/${contratoId}/miembros`,
                    {
                        headers: {
                            'x-user-id': usuarioId
                        }
                    }
                );

                if (!response.ok) {
                    throw new Error('Error fetching miembros');
                }

                const data = await response.json();

                if (data.success && data.data) {
                    // Find this user's membership
                    const miMiembro = data.data.find(
                        (m: MiembroConMandatos) => m.usuario_id === usuarioId
                    );

                    if (miMiembro) {
                        setMiembro(miMiembro);

                        // Auto-select mandato
                        const activeMandatos = miMiembro.mandatos.filter(
                            (m: MandatoExpediente) => m.estado_mandato === 'ACTIVO'
                        );

                        if (activeMandatos.length === 1) {
                            // Single mandate: auto-select
                            setMandatoActivoIdState(activeMandatos[0].id);
                            setStoredMandatoId(contratoId, usuarioId, activeMandatos[0].id);
                        } else if (activeMandatos.length > 1) {
                            // Multiple mandates: check localStorage
                            const storedId = getStoredMandatoId(contratoId, usuarioId);
                            if (storedId && activeMandatos.some((m: MandatoExpediente) => m.id === storedId)) {
                                setMandatoActivoIdState(storedId);
                            }
                            // If not in storage or invalid, leave null (force selection)
                        }
                    }
                }
            } catch (err: any) {
                console.error('[MandatoContext] Error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchMiembro();
    }, [contratoId, usuarioId]);

    // Derived state
    const mandatosDisponibles = useMemo(() => {
        if (!miembro) return [];
        return miembro.mandatos.filter(m => m.estado_mandato === 'ACTIVO');
    }, [miembro]);

    const mandatoActivo = useMemo(() => {
        if (!mandatoActivoId) return null;
        return mandatosDisponibles.find(m => m.id === mandatoActivoId) || null;
    }, [mandatosDisponibles, mandatoActivoId]);

    const tieneMultiplesMandatos = mandatosDisponibles.length > 1;
    const necesitaSeleccion = tieneMultiplesMandatos && !mandatoActivo;

    // Set mandato activo
    const setMandatoActivoId = useCallback((id: string) => {
        setMandatoActivoIdState(id);
        if (contratoId && usuarioId) {
            setStoredMandatoId(contratoId, usuarioId, id);
        }
    }, [contratoId, usuarioId]);

    // Header for API requests
    const getMandatoHeader = useCallback((): Record<string, string> => {
        if (!mandatoActivoId) return {};
        return { 'X-Mandato-Id': mandatoActivoId };
    }, [mandatoActivoId]);

    const value: MandatoContextValue = {
        miembro,
        mandatoActivo,
        mandatosDisponibles,
        tieneMultiplesMandatos,
        necesitaSeleccion,
        setMandatoActivoId,
        getMandatoHeader,
        loading,
        error
    };

    return (
        <MandatoContext.Provider value={value}>
            {children}
        </MandatoContext.Provider>
    );
}

// ============================================
// HOOK
// ============================================

export function useMandatoContext(): MandatoContextValue {
    const context = useContext(MandatoContext);
    if (!context) {
        throw new Error('useMandatoContext must be used within MandatoProvider');
    }
    return context;
}

// Optional hook that doesn't throw
export function useMandatoContextOptional(): MandatoContextValue | null {
    return useContext(MandatoContext);
}

export default MandatoContext;
