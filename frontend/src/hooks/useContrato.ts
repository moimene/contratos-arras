/**
 * Hook: useContrato
 * 
 * Hook para gestionar la carga de datos del contrato con:
 * - Cancelación automática con AbortController
 * - Manejo de errores centralizado
 * - Función refetch para actualizaciones manuales
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// TIPOS
// ============================================================================

export interface ContratoData {
    id: string;
    numero_expediente: string;
    estado: string;
    tipo_arras: string;
    precio_total: number;
    importe_arras: number;
    porcentaje_arras_calculado?: number;
    fecha_limite_firma_escritura: string;
    datos_wizard: any;
    eventos: any[];
    partes: Array<{
        rol_en_contrato: string;
        parte: {
            nombre: string;
            apellidos: string;
            numero_documento: string;
        };
    }>;
    documentos: any[];
    mensajes: any[];
    inmueble: {
        direccion_completa: string;
        ciudad: string;
        provincia: string;
        codigo_postal?: string;
        referencia_catastral?: string;
    };
    created_at: string;
}

export interface UseContratoResult {
    contrato: ContratoData | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useContrato(contratoId: string | undefined): UseContratoResult {
    const [contrato, setContrato] = useState<ContratoData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Ref para el AbortController actual
    const abortControllerRef = useRef<AbortController | null>(null);

    // Ref para evitar updates en componentes desmontados
    const isMountedRef = useRef(true);

    const fetchContrato = useCallback(async () => {
        // Si no hay contratoId, no intentar fetch
        if (!contratoId) {
            setError('ID de contrato no válido');
            setLoading(false);
            return;
        }

        // Cancelar request anterior si existe
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Crear nuevo AbortController
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        setLoading(true);
        setError(null);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/api/contracts/${contratoId}`, {
                signal: abortController.signal
            });

            // Verificar si el componente sigue montado
            if (!isMountedRef.current) return;

            if (!response.ok) {
                throw new Error('Contrato no encontrado');
            }

            const data = await response.json();

            // Verificar de nuevo antes de actualizar estado
            if (!isMountedRef.current) return;

            if (data.success) {
                setContrato(data.data);
                setError(null);
            } else {
                throw new Error(data.error || 'Error al cargar contrato');
            }
        } catch (err: any) {
            // Ignorar errores de abort (navegación rápida)
            if (err.name === 'AbortError') {
                return;
            }

            // Solo actualizar si el componente sigue montado
            if (!isMountedRef.current) return;

            console.error('Error al cargar contrato:', err);
            setError(err.message || 'Error al cargar el expediente');
            setContrato(null);
        } finally {
            // Solo actualizar loading si sigue montado y no fue abortado
            if (isMountedRef.current && !abortController.signal.aborted) {
                setLoading(false);
            }
        }
    }, [contratoId]);

    // Efecto para cargar datos cuando cambia el contratoId
    useEffect(() => {
        isMountedRef.current = true;
        fetchContrato();

        return () => {
            // Marcar como desmontado
            isMountedRef.current = false;

            // Cancelar request pendiente
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [fetchContrato]);

    // Función refetch para actualizaciones manuales
    const refetch = useCallback(async () => {
        await fetchContrato();
    }, [fetchContrato]);

    return {
        contrato,
        loading,
        error,
        refetch
    };
}
