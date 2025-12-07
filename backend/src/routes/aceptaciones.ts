import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { v4 as uuid } from 'uuid';
import { nowIso } from '../utils/time.js';
import { getContratoFull, setEstado } from '../repositories/contratos.repo.js';
import { registerEvent } from '../services/eventService.js';

const router = Router();

/**
 * GET /api/aceptaciones/:contratoId
 * Lista todas las aceptaciones de un contrato
 */
router.get('/:contratoId', async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('aceptaciones_terminos_esenciales')
            .select('*')
            .eq('contrato_id', req.params.contratoId)
            .order('fecha_hora_aceptacion', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (error: any) {
        console.error('Error listando aceptaciones:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * POST /api/aceptaciones/:contratoId
 * Registra aceptación de términos esenciales
 */
router.post('/:contratoId', async (req: Request, res: Response) => {
    try {
        const { parteId } = req.body;
        const full = await getContratoFull(req.params.contratoId);

        // Verificar que la parte está obligada a aceptar
        const obligado = full.partes.find(
            (p: any) => p.parte_id === parteId && p.obligado_aceptar
        );

        if (!obligado) {
            return res.status(400).json({
                error: 'La parte no está marcada como obligada a aceptar',
            });
        }

        // Registrar aceptación
        const id = uuid();
        const ip =
            (req.headers['x-forwarded-for'] as string) ||
            req.socket.remoteAddress ||
            '0.0.0.0';
        const ua = req.headers['user-agent'] || '';

        const { error } = await supabase
            .from('aceptaciones_terminos_esenciales')
            .insert({
                id,
                contrato_id: req.params.contratoId,
                parte_id: parteId,
                version_contrato: full.contrato.version_hash,
                fecha_hora_aceptacion: nowIso(),
                direccion_ip: ip,
                user_agent: ua,
                valida: true,
            });

        if (error) throw error;

        // Registrar evento certificado
        await registerEvent({
            contratoId: req.params.contratoId,
            tipo: 'ACEPTACION_TERMINOS',
            payload: {
                parte_id: parteId,
                version_hash: full.contrato.version_hash,
                ip,
            },
            actorParteId: parteId,
        });

        // Verificar si todos aceptaron
        const obligados = full.partes.filter((p: any) => p.obligado_aceptar);

        const { data: aceptValidas } = await supabase
            .from('aceptaciones_terminos_esenciales')
            .select('parte_id')
            .eq('contrato_id', req.params.contratoId)
            .eq('valida', true)
            .eq('version_contrato', full.contrato.version_hash);

        const partesAceptadas = new Set(
            (aceptValidas || []).map((a: any) => a.parte_id)
        );
        const allAccepted = obligados.every((p: any) =>
            partesAceptadas.has(p.parte_id)
        );

        if (allAccepted) {
            await setEstado(req.params.contratoId, 'TERMINOS_ESENCIALES_ACEPTADOS');
        }

        res.json({ ok: true, allAccepted });
    } catch (error: any) {
        console.error('Error registrando aceptación:', error);
        res.status(400).json({ error: error.message });
    }
});

export default router;
