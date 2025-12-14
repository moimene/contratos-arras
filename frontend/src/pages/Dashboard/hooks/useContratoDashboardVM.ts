/**
 * Hook: useContratoDashboardVM
 * 
 * ViewModel para el Dashboard del contrato.
 * Centraliza toda la lógica de derivación de datos UI:
 * - Fase del contrato
 * - Acciones sugeridas
 * - Flags de visibilidad
 * - Contadores de documentos
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ContratoData } from '../../../hooks/useContrato';
import {
    getFase,
    showFirma,
    showNotaria,
    isTerminal,
    isPostFirma,
    type FaseContrato
} from '../../../domain/contrato';

// ============================================================================
// TIPOS
// ============================================================================

export interface AccionSugerida {
    id: string;
    icon: string;
    titulo: string;
    descripcion: string;
    accion: (() => void) | null;
    disabled: boolean;
    primary?: boolean;
}

export interface SeccionConfig {
    id: string;
    title: string;
    badgeCount?: number;
    defaultOpen: boolean;
    priority: number;
}

export interface ContratoDashboardVM {
    // Fase del contrato
    fase: FaseContrato;

    // Acciones sugeridas para el usuario
    accionesSugeridas: AccionSugerida[];

    // Flags de visibilidad de secciones
    flags: {
        showFirma: boolean;
        showNotaria: boolean;
        showTerminacion: boolean;
        isPostFirma: boolean;
    };

    // Contadores
    contadores: {
        docsPendientes: number;
        docsSubidos: number;
        docsValidados: number;
        docsRechazados: number;
        eventosTotal: number;
    };

    // Navegación
    onGoTo: (seccion: string) => void;

    // Configuración de secciones
    secciones: SeccionConfig[];
}

// ============================================================================
// HOOK
// ============================================================================

export function useContratoDashboardVM(contrato: ContratoData | null): ContratoDashboardVM {
    const navigate = useNavigate();

    // Memoizar toda la derivación de datos
    return useMemo(() => {
        // Valores por defecto si no hay contrato
        if (!contrato) {
            return getDefaultVM();
        }

        const estado = contrato.estado;
        const fase = getFase(estado);
        const contratoId = contrato.id;

        // Derivar flags de visibilidad
        const flags = {
            showFirma: showFirma(estado),
            showNotaria: showNotaria(estado),
            showTerminacion: isTerminal(estado),
            isPostFirma: isPostFirma(estado),
        };

        // Derivar contadores de documentos
        const contadores = deriveContadores(contrato);

        // Derivar acciones sugeridas según estado
        const accionesSugeridas = deriveAcciones(contrato, navigate);

        // Configuración de secciones
        const secciones = deriveSecciones(contrato, contadores);

        // Navegación a sección
        const onGoTo = (seccion: string) => {
            const element = document.getElementById(`seccion-${seccion}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        };

        return {
            fase,
            accionesSugeridas,
            flags,
            contadores,
            onGoTo,
            secciones,
        };
    }, [contrato, navigate]);
}

// ============================================================================
// FUNCIONES DE DERIVACIÓN
// ============================================================================

function getDefaultVM(): ContratoDashboardVM {
    return {
        fase: 'WIZARD',
        accionesSugeridas: [],
        flags: {
            showFirma: false,
            showNotaria: false,
            showTerminacion: false,
            isPostFirma: false,
        },
        contadores: {
            docsPendientes: 0,
            docsSubidos: 0,
            docsValidados: 0,
            docsRechazados: 0,
            eventosTotal: 0,
        },
        onGoTo: () => { },
        secciones: [],
    };
}

function deriveContadores(contrato: ContratoData) {
    const docs = contrato.documentos || [];

    return {
        docsPendientes: docs.filter((d: any) => d.estado === 'PENDIENTE').length,
        docsSubidos: docs.filter((d: any) => d.estado === 'SUBIDO').length,
        docsValidados: docs.filter((d: any) => d.estado === 'VALIDADO').length,
        docsRechazados: docs.filter((d: any) => d.estado === 'RECHAZADO').length,
        eventosTotal: (contrato.eventos || []).length,
    };
}

function deriveAcciones(contrato: ContratoData, navigate: ReturnType<typeof useNavigate>): AccionSugerida[] {
    const estado = contrato.estado;
    const contratoId = contrato.id;
    const firmasCompletas = isPostFirma(estado);

    // Si aún está en firma
    if (!firmasCompletas || estado === 'BORRADOR_GENERADO' || estado === 'EN_FIRMA') {
        return [
            {
                id: 'pendiente-firmas',
                icon: '✍️',
                titulo: 'Pendiente de Firmas',
                descripcion: 'Esperando a que todas las partes firmen el contrato',
                accion: null,
                disabled: true
            }
        ];
    }

    // Una vez firmado
    if (estado === 'FIRMADO') {
        return [
            {
                id: 'convocar-notaria',
                icon: '📅',
                titulo: 'Convocar a Notaría',
                descripcion: 'Crear cita notarial y convocar a las partes',
                accion: () => navigate(`/notaria/${contratoId}`),
                disabled: false,
                primary: true
            },
            {
                id: 'checklist-docs',
                icon: '📋',
                titulo: 'Checklist Documentos',
                descripcion: 'Gestionar documentación necesaria para la escritura',
                accion: () => navigate(`/notaria/${contratoId}`),
                disabled: false
            },
            {
                id: 'generar-certificado',
                icon: '📜',
                titulo: 'Generar Certificado',
                descripcion: 'Emitir certificado histórico del expediente',
                accion: () => navigate(`/certificado/${contratoId}/generar`),
                disabled: false
            }
        ];
    }

    // Convocatoria notarial creada
    if (estado === 'CONVOCATORIA_NOTARIAL' || estado === 'CONVOCATORIA_ESCRITURA') {
        return [
            {
                id: 'gestionar-docs',
                icon: '📄',
                titulo: 'Gestionar Documentos',
                descripcion: 'Subir documentación requerida para la escritura',
                accion: () => navigate(`/notaria/${contratoId}`),
                disabled: false,
                primary: true
            },
            {
                id: 'acta-no-comparecencia',
                icon: '❌',
                titulo: 'Acta de No Comparecencia',
                descripcion: 'Generar acta si alguna parte no comparece',
                accion: () => navigate(`/acta/${contratoId}/crear`),
                disabled: false
            }
        ];
    }

    // Acta de no comparecencia
    if (estado === 'ACTA_NO_COMPARECENCIA' || estado === 'NO_COMPARECENCIA') {
        return [
            {
                id: 'alegaciones',
                icon: '⏱️',
                titulo: 'Ventana de Alegaciones',
                descripcion: 'Periodo de 48h para alegaciones del no compareciente',
                accion: null,
                disabled: true
            },
            {
                id: 'certificado-final',
                icon: '📜',
                titulo: 'Certificado Final',
                descripcion: 'Emitir certificado con resultado del expediente',
                accion: () => navigate(`/certificado/${contratoId}/generar`),
                disabled: false
            }
        ];
    }

    // Default: opciones generales
    return [
        {
            id: 'ver-certificado',
            icon: '📜',
            titulo: 'Ver Certificado',
            descripcion: 'Consultar certificado del expediente',
            accion: () => navigate(`/certificado/${contratoId}`),
            disabled: false
        }
    ];
}

function deriveSecciones(contrato: ContratoData, contadores: ContratoDashboardVM['contadores']): SeccionConfig[] {
    const estado = contrato.estado;
    const secciones: SeccionConfig[] = [];

    // Documentos - siempre visible
    secciones.push({
        id: 'documentos',
        title: 'Documentos',
        badgeCount: contadores.docsPendientes > 0 ? contadores.docsPendientes : undefined,
        defaultOpen: contadores.docsPendientes > 0,
        priority: 1,
    });

    // Notaría - según estado
    if (showNotaria(estado)) {
        secciones.push({
            id: 'notaria',
            title: 'Notaría',
            defaultOpen: true,
            priority: 2,
        });
    }

    // Comunicaciones
    secciones.push({
        id: 'comunicaciones',
        title: 'Comunicaciones',
        defaultOpen: false,
        priority: 3,
    });

    // Timeline
    secciones.push({
        id: 'timeline',
        title: 'Timeline',
        badgeCount: contadores.eventosTotal,
        defaultOpen: false,
        priority: 4,
    });

    // Certificado
    secciones.push({
        id: 'certificado',
        title: 'Certificado',
        defaultOpen: false,
        priority: 5,
    });

    return secciones.sort((a, b) => a.priority - b.priority);
}
