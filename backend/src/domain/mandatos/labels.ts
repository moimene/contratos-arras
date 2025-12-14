/**
 * Mandate Labels Module (Backend)
 * 
 * IDENTICAL to frontend/src/domain/mandatos/labels.ts
 * Source of truth único para etiquetas de mandato.
 * Usado en generación de certificados.
 * 
 * ⚠️ MANTENER SINCRONIZADO CON FRONTEND
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

export function getMandatoLabels(tipo: TipoMandato | string | null | undefined): MandatoLabelSet | null {
    if (!tipo) return null;
    return MANDATO_LABELS[tipo as TipoMandato] || null;
}

export function getMandatoShortLabel(tipo: TipoMandato | string | null | undefined): string {
    return getMandatoLabels(tipo)?.shortLabel || '';
}

export function getMandatoEventLabel(tipo: TipoMandato | string | null | undefined): string {
    return getMandatoLabels(tipo)?.eventInlineLabel || '';
}

export function getMandatoCertificateLabel(tipo: TipoMandato | string | null | undefined): string {
    return getMandatoLabels(tipo)?.certificateLabel || '';
}

export function getMandatoIcon(tipo: TipoMandato | string | null | undefined): string {
    return getMandatoLabels(tipo)?.icon || '🧭';
}

export function getRolLabels(rol: TipoRolUsuario | string | null | undefined): RolLabelSet | null {
    if (!rol) return null;
    return ROL_LABELS[rol as TipoRolUsuario] || null;
}

export function getRolUILabel(rol: TipoRolUsuario | string | null | undefined): string {
    return getRolLabels(rol)?.labelUI || rol || '';
}

export function getRolCertificateLabel(rol: TipoRolUsuario | string | null | undefined): string {
    return getRolLabels(rol)?.labelCertificate || rol || '';
}

export function getRolIcon(rol: TipoRolUsuario | string | null | undefined): string {
    return getRolLabels(rol)?.icon || '👤';
}

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
