import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ContratoData } from '../../hooks/useContrato';

export interface UseContratoQueryResult {
    contrato: ContratoData | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function fetchContrato(contratoId: string): Promise<ContratoData> {
    const response = await fetch(`${apiUrl}/api/contracts/${contratoId}`);

    if (!response.ok) {
        throw new Error('Contrato no encontrado');
    }

    const json = await response.json();
    if (!json.success) {
        throw new Error(json.error || 'Error al cargar contrato');
    }
    return json.data;
}

/**
 * Hook useContratoQuery
 * Reemplazo moderno de useContrato usando TanStack Query.
 * Ofrece caché, deduplicación y reintentos automáticos.
 */
export function useContratoQuery(contratoId: string | undefined): UseContratoQueryResult {
    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['contrato', contratoId],
        queryFn: () => fetchContrato(contratoId!),
        enabled: !!contratoId,
        staleTime: 1000 * 60, // 1 minuto de frescura
        retry: 1,
    });

    return {
        contrato: data || null,
        loading: isLoading,
        error: isError ? (error as Error).message : null,
        refetch
    };
}
