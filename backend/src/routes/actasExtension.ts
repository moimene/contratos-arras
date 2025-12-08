/**
 * Routes: Actas de No Comparecencia (Extensión)
 * 
 * Endpoints adicionales para el nuevo actaService
 */

import express, { Request, Response } from 'express';
import { actaService } from '../services/actaService';

const router = express.Router();

/**
 * POST /api/contracts/:id/acta
 * Genera un acta de no comparecencia
 */
router.post('/:id/acta', async (req: Request, res: Response) => {
    try {
        const { id: contratoId } = req.params;
        const {
            citaNotarialId,
            parteComparecienteId,
            parteNoComparecienteId,
            fechaHoraCita,
            notaria,
            resumenHechos,
        } = req.body;

        if (!citaNotarialId || !parteNoComparecienteId || !fechaHoraCita || !notaria || !resumenHechos) {
            return res.status(400).json({
                success: false,
                error: 'Faltan campos requeridos',
            });
        }

        const resultado = await actaService.generarActa({
            contratoId,
            citaNotarialId,
            parteComparecienteId,
            parteNoComparecienteId,
            fechaHoraCita: new Date(fechaHoraCita),
            notaria,
            resumenHechos,
        });

        res.json({
            success: true,
            data: resultado,
            message: 'Acta generada exitosamente. Ventana de 48h iniciada.',
        });

    } catch (error: any) {
        console.error('Error al generar acta:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error al generar acta',
        });
    }
});

/**
 * POST /api/actas/:actaId/notificar
 * Envía notificación del acta e inicia ventana 48h
 */
router.post('/actas/:actaId/notificar', async (req: Request, res: Response) => {
    try {
        const { actaId } = req.params;

        await actaService.enviarNotificacionActa(actaId);

        res.json({
            success: true,
            message: 'Notificación enviada. Ventana de 48h iniciada.',
        });

    } catch (error: any) {
        console.error('Error al notificar:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error al enviar notificación',
        });
    }
});

/**
 * GET /api/contracts/:id/actas
 * Obtiene actas de un contrato
 */
router.get('/:id/actas', async (req: Request, res: Response) => {
    try {
        const { id: contratoId } = req.params;

        const actas = await actaService.obtenerActasContrato(contratoId);

        res.json({
            success: true,
            data: actas,
        });

    } catch (error: any) {
        console.error('Error al obtener actas:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error al obtener actas',
        });
    }
});

export default router;
