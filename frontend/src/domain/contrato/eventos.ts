/**
 * Domain: Eventos del Contrato
 * 
 * Configuración centralizada para tipos de eventos y su representación UI.
 * Antes estaba en TimelineEvento.tsx.
 */

// ============================================================================
// TIPOS
// ============================================================================

export type TipoEvento =
    | 'CREACION'
    | 'COMPARTIDO'
    | 'ACEPTACION_TERMINOS'
    | 'BORRADOR_GENERADO'
    | 'GENERACION_PDF'
    | 'FIRMA_COMPLETADA'
    | 'PAGO_DECLARADO'
    | 'PAGO_VALIDADO'
    | 'PAGO_RECHAZADO'
    | 'INICIO_INTERIM'
    | 'CONVOCATORIA_FIJADA'
    | 'ESCRITURA_SUBIDA'
    | 'ACTA_NO_COMPARECENCIA'
    | 'RESOLUCION'
    | 'CIERRE'
    | 'DOCUMENTO_SUBIDO'
    | 'DOCUMENTO_VALIDADO'
    | 'DOCUMENTO_RECHAZADO'
    | 'DOCUMENTO_ELIMINADO'
    | 'DOCUMENTO_ACCEDIDO'
    | 'FIRMA_INICIADA'
    | 'ALEGACION_PRESENTADA'
    | 'COMUNICACION_ENVIADA';

export interface EventoUIConfig {
    icon: string;
    label: string;
    color: string;
    description?: string;
}

// ============================================================================
// CONFIGURACIÓN DE EVENTOS
// ============================================================================

export const EVENTO_UI: Record<TipoEvento, EventoUIConfig> = {
    // Ciclo de vida del contrato
    CREACION: {
        icon: '🎬',
        label: 'Expediente Creado',
        color: '#3b82f6'
    },
    COMPARTIDO: {
        icon: '🔗',
        label: 'Link Compartido',
        color: '#8b5cf6'
    },
    ACEPTACION_TERMINOS: {
        icon: '✅',
        label: 'Términos Aceptados',
        color: '#10b981'
    },

    // Documentos
    BORRADOR_GENERADO: {
        icon: '📄',
        label: 'Borrador Generado',
        color: '#6366f1'
    },
    GENERACION_PDF: {
        icon: '📄',
        label: 'PDF Generado',
        color: '#6366f1'
    },
    DOCUMENTO_SUBIDO: {
        icon: '📤',
        label: 'Documento Subido',
        color: '#3b82f6'
    },
    DOCUMENTO_VALIDADO: {
        icon: '✅',
        label: 'Documento Validado',
        color: '#10b981'
    },
    DOCUMENTO_RECHAZADO: {
        icon: '❌',
        label: 'Documento Rechazado',
        color: '#ef4444'
    },
    DOCUMENTO_ELIMINADO: {
        icon: '🗑️',
        label: 'Documento Eliminado',
        color: '#6b7280'
    },
    DOCUMENTO_ACCEDIDO: {
        icon: '👁️',
        label: 'Documento Accedido',
        color: '#8b5cf6'
    },

    // Firmas
    FIRMA_INICIADA: {
        icon: '✍️',
        label: 'Firma Iniciada',
        color: '#f59e0b'
    },
    FIRMA_COMPLETADA: {
        icon: '✍️',
        label: 'Firma Completada',
        color: '#059669'
    },

    // Pagos
    PAGO_DECLARADO: {
        icon: '💳',
        label: 'Pago Declarado',
        color: '#f59e0b'
    },
    PAGO_VALIDADO: {
        icon: '💰',
        label: 'Pago Validado',
        color: '#10b981'
    },
    PAGO_RECHAZADO: {
        icon: '❌',
        label: 'Pago Rechazado',
        color: '#ef4444'
    },

    // Notaría
    INICIO_INTERIM: {
        icon: '⏳',
        label: 'Inicio Periodo Interim',
        color: '#f59e0b'
    },
    CONVOCATORIA_FIJADA: {
        icon: '📅',
        label: 'Convocatoria Fijada',
        color: '#8b5cf6'
    },
    ESCRITURA_SUBIDA: {
        icon: '📝',
        label: 'Escritura Subida',
        color: '#059669'
    },

    // Conflictos
    ACTA_NO_COMPARECENCIA: {
        icon: '⚠️',
        label: 'Acta de No Comparecencia',
        color: '#dc2626'
    },
    ALEGACION_PRESENTADA: {
        icon: '📋',
        label: 'Alegación Presentada',
        color: '#f59e0b'
    },
    RESOLUCION: {
        icon: '🔴',
        label: 'Resolución',
        color: '#b91c1c'
    },

    // Comunicaciones
    COMUNICACION_ENVIADA: {
        icon: '📧',
        label: 'Comunicación Enviada',
        color: '#3b82f6'
    },

    // Cierre
    CIERRE: {
        icon: '🔒',
        label: 'Expediente Cerrado',
        color: '#6b7280'
    }
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Obtiene la configuración UI de un evento, con fallback robusto
 */
export function getEventoConfig(tipo: string): EventoUIConfig {
    const config = EVENTO_UI[tipo as TipoEvento];

    if (!config) {
        console.warn(`[Domain] Evento desconocido: "${tipo}". Usando fallback.`);
        return {
            icon: '📌',
            label: tipo,
            color: '#6b7280'
        };
    }

    return config;
}

/**
 * Agrupa eventos por categoría para visualización
 */
export function getEventoCategoria(tipo: string): 'contrato' | 'documento' | 'firma' | 'pago' | 'notaria' | 'conflicto' | 'comunicacion' {
    if (['CREACION', 'COMPARTIDO', 'ACEPTACION_TERMINOS', 'CIERRE'].includes(tipo)) {
        return 'contrato';
    }
    if (tipo.startsWith('DOCUMENTO_') || tipo.includes('BORRADOR') || tipo.includes('PDF')) {
        return 'documento';
    }
    if (tipo.includes('FIRMA')) {
        return 'firma';
    }
    if (tipo.includes('PAGO')) {
        return 'pago';
    }
    if (['INICIO_INTERIM', 'CONVOCATORIA_FIJADA', 'ESCRITURA_SUBIDA'].includes(tipo)) {
        return 'notaria';
    }
    if (['ACTA_NO_COMPARECENCIA', 'ALEGACION_PRESENTADA', 'RESOLUCION'].includes(tipo)) {
        return 'conflicto';
    }
    return 'comunicacion';
}
