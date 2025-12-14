/**
 * Mandate Labels Module
 * 
 * Source of truth único para etiquetas de mandato.
 * Evita drift entre UI (chips, dropdown, timeline) y Certificado.
 * 
 * Tres niveles de label:
 * - shortLabel: chips, dropdown "Actuando como...", badges
 * - eventInlineLabel: timeline, eventos
 * - certificateLabel: Certificado de Eventos (formal)
 */

// ============================================
// TIPOS DE MANDATO
// ============================================

export type TipoMandato =
    | 'PARTE_COMPRADORA'
    | 'PARTE_VENDEDORA'
    | 'AMBAS_PARTES'
    | 'NOTARIA'
    | 'OBSERVADOR_TECNICO';

export interface MandatoLabelSet {
    shortLabel: string;
    eventInlineLabel: string;
    certificateLabel: string;
    icon: string;
}

// ============================================
// MAPPING MANDATO → LABELS
// ============================================

export const MANDATO_LABELS: Record<TipoMandato, MandatoLabelSet> = {
    PARTE_COMPRADORA: {
        shortLabel: 'Asesor de comprador',
        eventInlineLabel: 'Actuando en nombre de la parte compradora',
        certificateLabel: 'Actuó como asesor autorizado de la parte compradora',
        icon: '🔑'
    },
    PARTE_VENDEDORA: {
        shortLabel: 'Asesor de vendedor',
        eventInlineLabel: 'Actuando en nombre de la parte vendedora',
        certificateLabel: 'Actuó como asesor autorizado de la parte vendedora',
        icon: '🏠'
    },
    AMBAS_PARTES: {
        shortLabel: 'Asesor común',
        eventInlineLabel: 'Actuando como asesor común de ambas partes',
        certificateLabel: 'Actuó como asesor/gestor común de ambas partes',
        icon: '🤝'
    },
    NOTARIA: {
        shortLabel: 'Notaría',
        eventInlineLabel: 'Actuando como notaría interviniente',
        certificateLabel: 'Actuó como notaría interviniente y personal autorizado',
        icon: '⚖️'
    },
    OBSERVADOR_TECNICO: {
        shortLabel: 'Observación técnica',
        eventInlineLabel: 'Actuando en modo observación técnica (solo lectura)',
        certificateLabel: 'Acceso en modo observación técnica (solo lectura)',
        icon: '👁️'
    }
};

// ============================================
// TIPOS DE ROL USUARIO
// ============================================

export type TipoRolUsuario =
    | 'ADMIN'
    | 'COMPRADOR'
    | 'VENDEDOR'
    | 'TERCERO'
    | 'NOTARIO'
    | 'OBSERVADOR';

export interface RolLabelSet {
    labelUI: string;
    labelCertificate: string;
    icon: string;
}

export const ROL_LABELS: Record<TipoRolUsuario, RolLabelSet> = {
    ADMIN: {
        labelUI: 'Administrador',
        labelCertificate: 'Administrador de la plataforma',
        icon: '👑'
    },
    COMPRADOR: {
        labelUI: 'Comprador',
        labelCertificate: 'Parte compradora',
        icon: '🔑'
    },
    VENDEDOR: {
        labelUI: 'Vendedor',
        labelCertificate: 'Parte vendedora',
        icon: '🏠'
    },
    TERCERO: {
        labelUI: 'Tercero',
        labelCertificate: 'Tercero autorizado (asesor/agencia)',
        icon: '🧭'
    },
    NOTARIO: {
        labelUI: 'Notaría',
        labelCertificate: 'Notaría interviniente',
        icon: '⚖️'
    },
    OBSERVADOR: {
        labelUI: 'Observador',
        labelCertificate: 'Acceso en modo observación (solo lectura)',
        icon: '👁️'
    }
};

// ============================================
// FUNCIONES HELPER
// ============================================

/**
 * Obtiene las etiquetas de un tipo de mandato
 */
export function getMandatoLabels(tipo: TipoMandato | string | null | undefined): MandatoLabelSet | null {
    if (!tipo) return null;
    return MANDATO_LABELS[tipo as TipoMandato] || null;
}

/**
 * Obtiene solo el shortLabel de un mandato
 */
export function getMandatoShortLabel(tipo: TipoMandato | string | null | undefined): string {
    return getMandatoLabels(tipo)?.shortLabel || '';
}

/**
 * Obtiene el label para eventos/timeline
 */
export function getMandatoEventLabel(tipo: TipoMandato | string | null | undefined): string {
    return getMandatoLabels(tipo)?.eventInlineLabel || '';
}

/**
 * Obtiene el label formal para certificado
 */
export function getMandatoCertificateLabel(tipo: TipoMandato | string | null | undefined): string {
    return getMandatoLabels(tipo)?.certificateLabel || '';
}

/**
 * Obtiene el icono de un mandato
 */
export function getMandatoIcon(tipo: TipoMandato | string | null | undefined): string {
    return getMandatoLabels(tipo)?.icon || '🧭';
}

/**
 * Obtiene las etiquetas de un rol de usuario
 */
export function getRolLabels(rol: TipoRolUsuario | string | null | undefined): RolLabelSet | null {
    if (!rol) return null;
    return ROL_LABELS[rol as TipoRolUsuario] || null;
}

/**
 * Obtiene el label UI de un rol
 */
export function getRolUILabel(rol: TipoRolUsuario | string | null | undefined): string {
    return getRolLabels(rol)?.labelUI || rol || '';
}

/**
 * Obtiene el label de certificado de un rol
 */
export function getRolCertificateLabel(rol: TipoRolUsuario | string | null | undefined): string {
    return getRolLabels(rol)?.labelCertificate || rol || '';
}

/**
 * Obtiene el icono de un rol
 */
export function getRolIcon(rol: TipoRolUsuario | string | null | undefined): string {
    return getRolLabels(rol)?.icon || '👤';
}

/**
 * Formatea "Rol · Mandato" para UI
 * Ejemplo: "🧭 Tercero · Asesor de comprador"
 */
export function formatRolMandatoUI(
    rol: TipoRolUsuario | string | null | undefined,
    mandatoTipo: TipoMandato | string | null | undefined
): string {
    const rolIcon = getRolIcon(rol);
    const rolLabel = getRolUILabel(rol);
    const mandatoLabel = getMandatoShortLabel(mandatoTipo);

    if (mandatoLabel) {
        return `${rolIcon} ${rolLabel} · ${mandatoLabel}`;
    }
    return `${rolIcon} ${rolLabel}`;
}

/**
 * Formatea para certificado
 * Ejemplo: "Tercero autorizado — Actuó como asesor autorizado de la parte compradora"
 */
export function formatRolMandatoCertificate(
    rol: TipoRolUsuario | string | null | undefined,
    mandatoTipo: TipoMandato | string | null | undefined
): string {
    const rolLabel = getRolCertificateLabel(rol);
    const mandatoLabel = getMandatoCertificateLabel(mandatoTipo);

    if (mandatoLabel) {
        return `${rolLabel} — ${mandatoLabel}`;
    }
    return rolLabel;
}
