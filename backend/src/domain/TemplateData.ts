/**
 * TemplateData - View-Model para Templates
 * 
 * Blueprint v1.0 - Modelo de consumo para plantillas documentales
 * 
 * REGLA: TemplateData NO calcula "Derecho"; solo PRESENTA.
 * Combina ArrasFacts + ArrasDecision para renderizar documentos.
 */

import type { ArrasFacts, ArrasInmueble, ArrasParte } from './ArrasFacts.js';
import type { ArrasDecision } from './ArrasDecision.js';

// ============================================
// CAMPOS DERIVADOS
// ============================================

export interface TemplateParteFormateada {
    nombre_completo: string;
    nombre_documento_formateado: string; // "D. Juan García Pérez, con DNI 12345678A"
    rol_formateado: string; // "parte compradora" | "parte vendedora"
    email: string;
    obligaciones: string[]; // ["Aceptar términos", "Firmar contrato"]
}

export interface TemplateImportes {
    precio_total_formateado: string; // "150.000,00 €"
    importe_arras_formateado: string; // "15.000,00 €"
    porcentaje_arras: number; // 10
    porcentaje_arras_formateado: string; // "10%"
    resto_precio: number; // 135000
    resto_precio_formateado: string; // "135.000,00 €"
}

export interface TemplateFechas {
    fecha_creacion_formateada: string; // "15 de enero de 2026"
    fecha_limite_escritura_formateada: string; // "15 de marzo de 2026"
    dias_restantes_escritura: number;
}

// ============================================
// TEMPLATE DATA PRINCIPAL
// ============================================

export interface TemplateData {
    // ──────────────────────────────────────────
    // DATOS CRUDOS (de ArrasFacts)
    // ──────────────────────────────────────────
    facts: ArrasFacts;

    // ──────────────────────────────────────────
    // DECISIÓN NORMATIVA (de ArrasDecision)
    // ──────────────────────────────────────────
    decision: ArrasDecision;

    // ──────────────────────────────────────────
    // CAMPOS DERIVADOS (para presentación)
    // ──────────────────────────────────────────

    /** Partes formateadas para documento */
    partes_formateadas: {
        compradores: TemplateParteFormateada[];
        vendedores: TemplateParteFormateada[];
        otros: TemplateParteFormateada[];
    };

    /** Importes calculados y formateados */
    importes: TemplateImportes;

    /** Fechas formateadas */
    fechas: TemplateFechas;

    /** Texto del tipo de arras */
    tipo_arras_texto: string; // "arras confirmatorias" | "arras penitenciales" | "arras penales"

    /** Texto de la vía de resolución */
    via_resolucion_texto: string; // "los Juzgados y Tribunales de..." | "arbitraje notarial"

    /** Texto de la forma de pago */
    forma_pago_texto: string; // "al momento de la firma" | "en el plazo de X días" | "mediante depósito en cuenta escrow"

    // ──────────────────────────────────────────
    // CONSECUENCIAS (si hay normative)
    // ──────────────────────────────────────────
    consecuencia_texto?: string;
    fundamento_legal?: string;

    // ──────────────────────────────────────────
    // METADATA
    // ──────────────────────────────────────────
    generated_at: string;
    template_version: string;
}

// ============================================
// FACTORY FUNCTIONS
// ============================================

const MESES = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

/**
 * Formatea un número como moneda EUR
 */
function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
    }).format(amount);
}

/**
 * Formatea una fecha en formato largo español
 */
function formatDateLong(isoDate: string): string {
    const date = new Date(isoDate);
    return `${date.getDate()} de ${MESES[date.getMonth()]} de ${date.getFullYear()}`;
}

/**
 * Calcula días entre dos fechas
 */
function daysBetween(from: Date, to: Date): number {
    const diff = to.getTime() - from.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Formatea una parte para documento
 */
function formatParte(parte: ArrasParte): TemplateParteFormateada {
    const titulo = parte.rol_en_contrato === 'COMPRADOR' || parte.rol_en_contrato === 'VENDEDOR'
        ? 'D./Dña.'
        : '';

    return {
        nombre_completo: parte.nombre_completo,
        nombre_documento_formateado: `${titulo} ${parte.nombre_completo}, con ${parte.tipo_documento} ${parte.numero_documento}`.trim(),
        rol_formateado: parte.rol_en_contrato === 'COMPRADOR'
            ? 'parte compradora'
            : parte.rol_en_contrato === 'VENDEDOR'
                ? 'parte vendedora'
                : 'tercero interviniente',
        email: parte.email,
        obligaciones: [
            ...(parte.obligado_aceptar ? ['Aceptar términos esenciales'] : []),
            ...(parte.obligado_firmar ? ['Firmar contrato'] : []),
        ],
    };
}

/**
 * Genera texto para tipo de arras
 */
function getTipoArrasTexto(tipo: string): string {
    switch (tipo) {
        case 'CONFIRMATORIAS': return 'arras confirmatorias';
        case 'PENITENCIALES': return 'arras penitenciales';
        case 'PENALES': return 'arras penales';
        default: return 'arras';
    }
}

/**
 * Genera texto para vía de resolución
 */
function getViaResolucionTexto(via: string, ciudad?: string): string {
    if (via === 'ARBITRAJE_NOTARIAL') {
        return 'arbitraje notarial conforme al Reglamento de la Junta de Decanos de los Colegios Notariales de España';
    }
    return `los Juzgados y Tribunales de ${ciudad || 'la localidad del inmueble'}`;
}

/**
 * Genera texto para forma de pago
 */
function getFormaPagoTexto(forma: string, plazo_dias?: number): string {
    switch (forma) {
        case 'AL_FIRMAR': return 'al momento de la firma del presente contrato';
        case 'POSTERIOR': return `en el plazo de ${plazo_dias || 'X'} días desde la firma del presente contrato`;
        case 'ESCROW': return 'mediante depósito en cuenta escrow gestionada por tercero de confianza';
        default: return 'según condiciones acordadas';
    }
}

/**
 * Construye TemplateData desde ArrasFacts + ArrasDecision
 */
export function buildTemplateData(
    facts: ArrasFacts,
    decision: ArrasDecision
): TemplateData {
    const compradores = facts.partes.filter(p => p.rol_en_contrato === 'COMPRADOR');
    const vendedores = facts.partes.filter(p => p.rol_en_contrato === 'VENDEDOR');
    const otros = facts.partes.filter(p => !['COMPRADOR', 'VENDEDOR'].includes(p.rol_en_contrato));

    const porcentaje = (facts.importe_arras / facts.precio_total) * 100;
    const resto = facts.precio_total - facts.importe_arras;

    return {
        facts,
        decision,

        partes_formateadas: {
            compradores: compradores.map(formatParte),
            vendedores: vendedores.map(formatParte),
            otros: otros.map(formatParte),
        },

        importes: {
            precio_total_formateado: formatCurrency(facts.precio_total),
            importe_arras_formateado: formatCurrency(facts.importe_arras),
            porcentaje_arras: Math.round(porcentaje * 100) / 100,
            porcentaje_arras_formateado: `${Math.round(porcentaje * 100) / 100}%`,
            resto_precio: resto,
            resto_precio_formateado: formatCurrency(resto),
        },

        fechas: {
            fecha_creacion_formateada: formatDateLong(facts.created_at),
            fecha_limite_escritura_formateada: formatDateLong(facts.fecha_limite_firma_escritura),
            dias_restantes_escritura: daysBetween(new Date(), new Date(facts.fecha_limite_firma_escritura)),
        },

        tipo_arras_texto: getTipoArrasTexto(facts.tipo_arras),
        via_resolucion_texto: getViaResolucionTexto(facts.via_resolucion, facts.inmueble.ciudad),
        forma_pago_texto: getFormaPagoTexto(facts.forma_pago_arras),

        consecuencia_texto: decision.normative?.consecuencia,
        fundamento_legal: decision.normative?.fundamento,

        generated_at: new Date().toISOString(),
        template_version: '1.0.0',
    };
}
