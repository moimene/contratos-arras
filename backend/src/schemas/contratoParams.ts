import { z } from 'zod';

/**
 * Esquema para crear un nuevo contrato
 */
export const createContratoSchema = z.object({
    body: z.object({
        inmueble: z.object({
            direccion_completa: z.string().min(5, 'Dirección requerida'),
            ciudad: z.string().min(2, 'Ciudad requerida'),
            provincia: z.string().min(2, 'Provincia requerida'),
            codigo_postal: z.string().optional(),
            referencia_catastral: z.string().optional(),
        }),
        precio_total: z.number().positive('El precio debe ser positivo'),
        tipo_arras: z.enum(['PENITENCIALES', 'CONFIRMATORIAS', 'PENALES']).default('PENITENCIALES'),
        importe_arras: z.number().positive('El importe de arras debe ser positivo').optional(),
        plazo_maximo_fecha: z.string().optional(),
    }),
});

export type CreateContratoDTO = z.infer<typeof createContratoSchema>['body'];

/**
 * Esquema para actualizar un contrato
 */
export const updateContratoSchema = z.object({
    params: z.object({
        id: z.string().uuid('ID de contrato inválido'),
    }),
    body: z.object({
        contrato: z.object({
            precio_total: z.number().positive().optional(),
            tipo_arras: z.enum(['PENITENCIALES', 'CONFIRMATORIAS', 'PENALES']).optional(),
            importe_arras: z.number().positive().optional(),
            fecha_limite_firma_escritura: z.string().optional(),
        }).optional(),
        inmueble: z.object({
            direccion_completa: z.string().min(5).optional(),
            ciudad: z.string().min(2).optional(),
            provincia: z.string().min(2).optional(),
            codigo_postal: z.string().optional(),
            referencia_catastral: z.string().optional(),
        }).optional(),
    }),
});

export type UpdateContratoDTO = z.infer<typeof updateContratoSchema>['body'];

/**
 * Esquema para vincular una parte
 */
export const linkParteSchema = z.object({
    params: z.object({
        id: z.string().uuid('ID de contrato inválido'),
    }),
    body: z.object({
        parteId: z.string().uuid('ID de parte inválido'),
        rolEnContrato: z.enum(['COMPRADOR', 'VENDEDOR', 'TERCERO', 'OBSERVADOR']),
        obligadoAceptar: z.boolean().default(true),
        obligadoFirmar: z.boolean().default(true),
        porcentajePropiedad: z.number().min(0).max(100).optional(),
    }),
});
