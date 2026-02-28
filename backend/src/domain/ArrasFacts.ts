/**
 * ArrasFacts - Input Data Schema
 * 
 * Blueprint v1.0 - Contrato de datos de entrada para el kernel normativo
 * 
 * REGLA: ArrasFacts debe poder reconstruirse 100% desde DB para auditoría.
 * Es la fuente canónica que Catala/Rules evalúa y que TemplateData consume.
 */

import type { TipoArras, FormaPagoArras, ViaResolucion } from '../types/models.js';

// ============================================
// TIPOS AUXILIARES
// ============================================

export interface ArrasInmueble {
    id: string;
    direccion_completa: string;
    ciudad: string;
    provincia: string;
    codigo_postal?: string;
    referencia_catastral?: string;
    datos_registrales?: string;
}

export interface ArrasParte {
    parte_id: string;
    rol_en_contrato: 'COMPRADOR' | 'VENDEDOR' | 'INTERMEDIARIO' | 'OTRO';
    nombre_completo: string;
    tipo_documento: string;
    numero_documento: string;
    email: string;
    obligado_aceptar: boolean;
    obligado_firmar: boolean;
    porcentaje_propiedad?: number;
}

// ============================================
// CONTRATO PRINCIPAL
// ============================================

export interface ArrasFacts {
    // ──────────────────────────────────────────
    // IDENTIDAD
    // ──────────────────────────────────────────
    contrato_id: string;
    version_numero: number;
    version_hash: string;
    created_at: string; // ISO UTC

    // ──────────────────────────────────────────
    // OBJETO
    // ──────────────────────────────────────────
    inmueble: ArrasInmueble;

    // ──────────────────────────────────────────
    // PARTES
    // ──────────────────────────────────────────
    partes: ArrasParte[];

    // ──────────────────────────────────────────
    // TÉRMINOS ESENCIALES (disparan re-aceptación)
    // ──────────────────────────────────────────
    tipo_arras: TipoArras;
    precio_total: number; // Decimal 2 decimales
    importe_arras: number; // Decimal 2 decimales
    fecha_limite_firma_escritura: string; // ISO UTC
    forma_pago_arras: FormaPagoArras;
    via_resolucion: ViaResolucion;

    // ──────────────────────────────────────────
    // NOTARÍA (opcional)
    // ──────────────────────────────────────────
    notario?: {
        nombre: string;
        direccion: string;
    };

    // ──────────────────────────────────────────
    // PREFERENCIAS
    // ──────────────────────────────────────────
    firma_preferida: 'ELECTRONICA' | 'MANUSCRITA';

    // ──────────────────────────────────────────
    // CAMPOS MODULARES (cláusulas opcionales)
    // ──────────────────────────────────────────
    objeto?: 'VIVIENDA' | 'LOCAL' | 'OFICINA' | 'GARAJE' | 'SOLAR' | 'OTRO';
    sinHipoteca?: boolean;
    sinArrendatarios?: boolean;
    derecho?: 'COMUN' | 'FORAL_NAVARRA' | 'FORAL_EUSKADI' | 'FORAL_ARAGON';
    escrow?: {
        activo: boolean;
        depositario?: string;
        condiciones?: string;
    };
    retenciones?: {
        activa: boolean;
        importe?: number;
        concepto?: string;
    };
}

// ============================================
// CAMPOS ESENCIALES (para hash)
// ============================================

/**
 * Lista de campos que disparan re-aceptación si cambian
 */
export const ESSENTIAL_FIELDS: (keyof Pick<ArrasFacts,
    'tipo_arras' | 'precio_total' | 'importe_arras' |
    'fecha_limite_firma_escritura' | 'via_resolucion' | 'forma_pago_arras'
>)[] = [
        'tipo_arras',
        'precio_total',
        'importe_arras',
        'fecha_limite_firma_escritura',
        'via_resolucion',
        'forma_pago_arras',
    ];

/**
 * Campos de inmueble que son esenciales
 */
export const ESSENTIAL_INMUEBLE_FIELDS: (keyof ArrasInmueble)[] = [
    'direccion_completa',
];

/**
 * Campos de partes que son esenciales
 */
export const ESSENTIAL_PARTE_FIELDS: (keyof ArrasParte)[] = [
    'parte_id',
    'rol_en_contrato',
    'obligado_aceptar',
    'obligado_firmar',
];
