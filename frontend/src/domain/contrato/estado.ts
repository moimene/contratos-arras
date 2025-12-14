/**
 * Domain: Estado del Contrato
 * 
 * Fuente única de verdad para estados del contrato y su representación UI.
 * Centraliza la lógica que antes estaba dispersa en EstadoBadge, ProximasAcciones, etc.
 */

// ============================================================================
// TIPOS
// ============================================================================

export type EstadoContrato =
    | 'BORRADOR'
    | 'INICIADO'
    | 'EN_NEGOCIACION'
    | 'TERMINOS_ESENCIALES_ACEPTADOS'
    | 'BORRADOR_GENERADO'
    | 'EN_FIRMA'
    | 'FIRMADO'
    | 'DECLARADO_PAGO'
    | 'ARRAS_ACREDITADAS'
    | 'INTERIM'
    | 'CONVOCATORIA_NOTARIAL'
    | 'CONVOCATORIA_ESCRITURA'
    | 'NOTARIA'
    | 'ESCRITURA_OTORGADA'
    | 'NO_COMPARECENCIA'
    | 'ACTA_NO_COMPARECENCIA'
    | 'LITIGIO'
    | 'RESUELTO'
    | 'TERMINADO'
    | 'CERRADO';

export type TonoBadge = 'info' | 'ok' | 'warn' | 'danger';

export type FaseContrato = 'WIZARD' | 'EJECUCION' | 'CIERRE' | 'LITIGIO';

export interface EstadoUIConfig {
    label: string;
    icon: string;
    tono: TonoBadge;
    className: string;
    aliasOf?: EstadoContrato;
    alertMessage?: string;
}

// ============================================================================
// CONFIGURACIÓN DE ESTADOS
// ============================================================================

export const ESTADO_UI: Record<EstadoContrato, EstadoUIConfig> = {
    // Fase WIZARD
    BORRADOR: {
        label: 'Borrador',
        icon: '📝',
        tono: 'info',
        className: 'estado-borrador'
    },
    INICIADO: {
        label: 'Iniciado',
        icon: '🚀',
        tono: 'info',
        className: 'estado-iniciado'
    },
    EN_NEGOCIACION: {
        label: 'En Negociación',
        icon: '💬',
        tono: 'info',
        className: 'estado-en-negociacion'
    },
    TERMINOS_ESENCIALES_ACEPTADOS: {
        label: 'Términos Aceptados',
        icon: '✅',
        tono: 'ok',
        className: 'estado-terminos-aceptados'
    },
    BORRADOR_GENERADO: {
        label: 'Borrador Generado',
        icon: '📄',
        tono: 'info',
        className: 'estado-borrador-generado'
    },
    EN_FIRMA: {
        label: 'Pendiente de Firmas',
        icon: '✍️',
        tono: 'warn',
        className: 'estado-en-firma',
        alertMessage: 'Esperando firmas de las partes'
    },

    // Fase EJECUCION
    FIRMADO: {
        label: 'Firmado',
        icon: '✍️',
        tono: 'ok',
        className: 'estado-firmado',
        alertMessage: '¡Contrato firmado por todas las partes!'
    },
    DECLARADO_PAGO: {
        label: 'Pago Declarado',
        icon: '💳',
        tono: 'warn',
        className: 'estado-declarado-pago',
        alertMessage: 'Pago pendiente de validación'
    },
    ARRAS_ACREDITADAS: {
        label: 'Arras Acreditadas',
        icon: '💰',
        tono: 'ok',
        className: 'estado-arras-acreditadas'
    },
    INTERIM: {
        label: 'Periodo Interim',
        icon: '⏳',
        tono: 'info',
        className: 'estado-interim'
    },
    CONVOCATORIA_NOTARIAL: {
        label: 'Convocatoria Notarial',
        icon: '📅',
        tono: 'warn',
        className: 'estado-convocatoria',
        alertMessage: 'Cita notarial programada'
    },
    CONVOCATORIA_ESCRITURA: {
        label: 'Convocatoria Escritura',
        icon: '📅',
        tono: 'warn',
        className: 'estado-convocatoria',
        aliasOf: 'CONVOCATORIA_NOTARIAL'
    },
    NOTARIA: {
        label: 'En Notaría',
        icon: '⚖️',
        tono: 'info',
        className: 'estado-notaria'
    },

    // Fase CIERRE
    ESCRITURA_OTORGADA: {
        label: 'Escritura Otorgada',
        icon: '🎉',
        tono: 'ok',
        className: 'estado-escritura-otorgada',
        alertMessage: '¡Compraventa completada!'
    },
    TERMINADO: {
        label: 'Terminado',
        icon: '🔒',
        tono: 'info',
        className: 'estado-terminado'
    },
    CERRADO: {
        label: 'Cerrado',
        icon: '🔒',
        tono: 'info',
        className: 'estado-cerrado',
        aliasOf: 'TERMINADO'
    },

    // Fase LITIGIO
    NO_COMPARECENCIA: {
        label: 'No Comparecencia',
        icon: '⚠️',
        tono: 'danger',
        className: 'estado-no-comparecencia',
        alertMessage: 'Periodo de alegaciones: 48 horas'
    },
    ACTA_NO_COMPARECENCIA: {
        label: 'Acta No Comparecencia',
        icon: '⚠️',
        tono: 'danger',
        className: 'estado-no-comparecencia',
        aliasOf: 'NO_COMPARECENCIA'
    },
    LITIGIO: {
        label: 'Litigio',
        icon: '⚖️',
        tono: 'danger',
        className: 'estado-litigio',
        alertMessage: 'Expediente en disputa legal'
    },
    RESUELTO: {
        label: 'Resuelto',
        icon: '⚠️',
        tono: 'warn',
        className: 'estado-resuelto'
    }
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Obtiene la configuración UI de un estado, con fallback robusto
 */
export function getEstadoConfig(estado: string): EstadoUIConfig {
    const config = ESTADO_UI[estado as EstadoContrato];

    if (!config) {
        console.warn(`[Domain] Estado desconocido: "${estado}". Usando fallback.`);
        return {
            label: estado,
            icon: '❓',
            tono: 'info',
            className: 'estado-desconocido'
        };
    }

    return config;
}

/**
 * Resuelve aliases de estados
 */
export function resolveEstadoAlias(estado: string): EstadoContrato {
    const config = ESTADO_UI[estado as EstadoContrato];
    if (config?.aliasOf) {
        return config.aliasOf;
    }
    return estado as EstadoContrato;
}

/**
 * Determina la fase del contrato basándose en su estado
 */
export function getFase(estado: string): FaseContrato {
    const resolved = resolveEstadoAlias(estado);

    // Litigio
    if (['NO_COMPARECENCIA', 'ACTA_NO_COMPARECENCIA', 'LITIGIO'].includes(resolved)) {
        return 'LITIGIO';
    }

    // Cierre
    if (['ESCRITURA_OTORGADA', 'TERMINADO', 'CERRADO', 'RESUELTO'].includes(resolved)) {
        return 'CIERRE';
    }

    // Ejecución (post-firma)
    if ([
        'FIRMADO', 'DECLARADO_PAGO', 'ARRAS_ACREDITADAS',
        'INTERIM', 'CONVOCATORIA_NOTARIAL', 'CONVOCATORIA_ESCRITURA', 'NOTARIA'
    ].includes(resolved)) {
        return 'EJECUCION';
    }

    // Por defecto: Wizard
    return 'WIZARD';
}

// ============================================================================
// PREDICADOS DE VISIBILIDAD
// ============================================================================

const ESTADOS_POST_FIRMA: EstadoContrato[] = [
    'FIRMADO', 'DECLARADO_PAGO', 'ARRAS_ACREDITADAS', 'INTERIM',
    'CONVOCATORIA_NOTARIAL', 'CONVOCATORIA_ESCRITURA', 'NOTARIA',
    'ESCRITURA_OTORGADA', 'NO_COMPARECENCIA', 'ACTA_NO_COMPARECENCIA',
    'LITIGIO', 'RESUELTO', 'TERMINADO', 'CERRADO'
];

const ESTADOS_SHOW_FIRMA: EstadoContrato[] = [
    'INICIADO', 'BORRADOR', 'BORRADOR_GENERADO', 'EN_FIRMA'
];

const ESTADOS_SHOW_NOTARIA: EstadoContrato[] = [
    'FIRMADO', 'CONVOCATORIA_NOTARIAL', 'CONVOCATORIA_ESCRITURA',
    'NOTARIA', 'ESCRITURA_OTORGADA', 'NO_COMPARECENCIA', 'ACTA_NO_COMPARECENCIA'
];

const ESTADOS_TERMINALES: EstadoContrato[] = [
    'TERMINADO', 'CERRADO', 'RESUELTO', 'LITIGIO'
];

/**
 * ¿El contrato está en fase post-firma?
 */
export function isPostFirma(estado: string): boolean {
    return ESTADOS_POST_FIRMA.includes(resolveEstadoAlias(estado));
}

/**
 * ¿Mostrar panel de firma electrónica?
 */
export function showFirma(estado: string): boolean {
    return ESTADOS_SHOW_FIRMA.includes(resolveEstadoAlias(estado));
}

/**
 * ¿Mostrar sección de notaría?
 */
export function showNotaria(estado: string): boolean {
    return ESTADOS_SHOW_NOTARIA.includes(resolveEstadoAlias(estado));
}

/**
 * ¿El expediente está en estado terminal?
 */
export function isTerminal(estado: string): boolean {
    return ESTADOS_TERMINALES.includes(resolveEstadoAlias(estado));
}

/**
 * ¿Las firmas están completas?
 */
export function firmasCompletas(estado: string): boolean {
    return isPostFirma(estado);
}
