import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import {
    createContrato,
    getContratoFull,
    updateContrato,
    linkParteToContrato,
    updateContratoParte,
    unlinkParteFromContrato,
    setEstado,
} from '../repositories/contratos.repo.js';
import { updateInmueble } from '../repositories/inmuebles.repo.js';
import { registerEvent } from '../services/eventService.js';

const router = Router();

/**
 * GET /api/contratos
 * Lista todos los contratos
 */
router.get('/', async (_req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('contratos_arras')
            .select(`
                *,
                inmueble:inmuebles(*)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (error: any) {
        console.error('Error listando contratos:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * POST /api/contratos
 * Crea un nuevo contrato con inmueble
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        const created = await createContrato(req.body);

        // Registrar evento certificado
        await registerEvent({
            contratoId: created.id,
            tipo: 'CONTRATO_CREADO',
            payload: {
                inmueble: created.inmueble.direccion_completa,
                precio_total: created.precio_total,
                importe_arras: created.importe_arras,
                tipo_arras: created.tipo_arras,
            },
        });

        res.status(201).json(created);
    } catch (error: any) {
        console.error('Error creando contrato:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * GET /api/contratos/:id
 * Obtiene un contrato completo con relaciones
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const full = await getContratoFull(req.params.id);
        res.json(full);
    } catch (error: any) {
        console.error('Error obteniendo contrato:', error);
        res.status(404).json({ error: error.message });
    }
});

/**
 * PUT /api/contratos/:id
 * Actualiza datos de contrato e inmueble
 */
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { contrato: cPatch, inmueble: iPatch } = req.body || {};

        // Actualizar inmueble si se provee
        if (iPatch) {
            const full = await getContratoFull(req.params.id);
            await updateInmueble(full.contrato.inmueble_id, iPatch);
        }

        // Actualizar contrato si se provee
        let updated;
        if (cPatch) {
            updated = await updateContrato(req.params.id, cPatch);
        }

        // Obtener versión actualizada completa
        const result = await getContratoFull(req.params.id);
        res.json(result);
    } catch (error: any) {
        console.error('Error actualizando contrato:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * POST /api/contratos/:id/partes
 * Vincula una parte a un contrato
 */
router.post('/:id/partes', async (req: Request, res: Response) => {
    try {
        const {
            parteId,
            rolEnContrato,
            obligadoAceptar = true,
            obligadoFirmar = true,
            porcentajePropiedad,
        } = req.body;

        const link = await linkParteToContrato(
            req.params.id,
            parteId,
            rolEnContrato,
            obligadoAceptar,
            obligadoFirmar,
            porcentajePropiedad
        );

        res.status(201).json(link);
    } catch (error: any) {
        console.error('Error vinculando parte:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * PATCH /api/contratos/:id/partes/:contratoParteId
 * Actualiza relación contrato-parte
 */
router.patch(
    '/:id/partes/:contratoParteId',
    async (req: Request, res: Response) => {
        try {
            const updated = await updateContratoParte(
                req.params.contratoParteId,
                req.body
            );
            res.json(updated);
        } catch (error: any) {
            console.error('Error actualizando contrato-parte:', error);
            res.status(400).json({ error: error.message });
        }
    }
);

/**
 * DELETE /api/contratos/:id/partes/:contratoParteId
 * Elimina relación contrato-parte
 */
router.delete(
    '/:id/partes/:contratoParteId',
    async (req: Request, res: Response) => {
        try {
            await unlinkParteFromContrato(req.params.contratoParteId);
            res.json({ ok: true });
        } catch (error: any) {
            console.error('Error eliminando contrato-parte:', error);
            res.status(400).json({ error: error.message });
        }
    }
);

/**
 * GET /api/contratos/:id/estado
 * Obtiene estado y requisitos del contrato
 */
router.get('/:id/estado', async (req: Request, res: Response) => {
    try {
        const full = await getContratoFull(req.params.id);

        const obligadosAceptar = full.partes.filter(
            (p: any) => p.obligado_aceptar
        );
        const obligadosFirmar = full.partes.filter((p: any) => p.obligado_firmar);

        const allAccepted =
            obligadosAceptar.length > 0 &&
            obligadosAceptar.every((p: any) =>
                full.aceptacionesValidas.some((a: any) => a.parte_id === p.parte_id)
            );

        const allSigned =
            obligadosFirmar.length > 0 &&
            obligadosFirmar.every((p: any) =>
                full.firmasValidas.some((f: any) => f.parte_id === p.parte_id)
            );

        res.json({
            estado: full.contrato.estado,
            versionHash: full.contrato.version_hash,
            versionNumero: full.contrato.version_numero,
            requisitos: {
                tieneInmueble: !!full.inmueble,
                tienePartes: full.partes.length > 0,
                tieneObligadosAceptar: obligadosAceptar.length > 0,
                tieneObligadosFirmar: obligadosFirmar.length > 0,
                todosAceptaron: allAccepted,
                todosFirmaron: allSigned,
            },
        });
    } catch (error: any) {
        console.error('Error obteniendo estado:', error);
        res.status(400).json({ error: error.message });
    }
});

export default router;
