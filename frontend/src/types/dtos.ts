/**
 * DTOs de Contrato (Espejo de Backend)
 * 
 * Estos tipos deben mantenerse sincronizados con backend/src/schemas/contratoParams.ts
 * Idealmente, en un monorepo, se importan directamente.
 */

export interface CreateContratoDTO {
    inmueble: {
        direccion_completa: string;
        ciudad: string;
        provincia: string;
        codigo_postal?: string;
        referencia_catastral?: string;
    };
    precio_total: number;
    tipo_arras?: 'PENITENCIALES' | 'CONFIRMATORIAS' | 'PENALES';
    importe_arras?: number;
    plazo_maximo_fecha?: string;
}

export interface UpdateContratoDTO {
    contrato?: {
        precio_total?: number;
        tipo_arras?: 'PENITENCIALES' | 'CONFIRMATORIAS' | 'PENALES';
        importe_arras?: number;
        fecha_limite_firma_escritura?: string;
    };
    inmueble?: {
        direccion_completa?: string;
        ciudad?: string;
        provincia?: string;
        codigo_postal?: string;
        referencia_catastral?: string;
    };
}
