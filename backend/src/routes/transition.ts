/**
 * Transition API Routes
 * 
 * Endpoints para verificar y ejecutar transiciones de estado.
 */

import { Router, Request, Response } from 'express';
import { checkTransitionEligibility, getTransitionSummary } from '../services/transitionService.js';
import type { EstadoContrato } from '../types/models.js';

const router = Router();

/**
 * GET /api/contratos/:contratoId/transition/eligibility
 * Verifica si un contrato puede avanzar de estado
 */
router.get('/:contratoId/transition/eligibility', async (req: Request, res: Response) => {
    try {
        const { contratoId } = req.params;
        const { currentState, targetState } = req.query;

        if (!currentState) {
            return res.status(400).json({
                success: false,
                error: 'currentState es requerido'
            });
        }

        const eligibility = await checkTransitionEligibility(
            contratoId,
            currentState as EstadoContrato,
            targetState as EstadoContrato | undefined
        );

        res.json({ success: true, data: eligibility });
    } catch (error: any) {
        console.error('Error verificando elegibilidad:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/contratos/:contratoId/transition/summary
 * Obtiene resumen de todas las transiciones posibles
 */
router.get('/:contratoId/transition/summary', async (req: Request, res: Response) => {
    try {
        const { contratoId } = req.params;
        const { currentState } = req.query;

        if (!currentState) {
            return res.status(400).json({
                success: false,
                error: 'currentState es requerido'
            });
        }

        const summary = await getTransitionSummary(
            contratoId,
            currentState as EstadoContrato
        );

        res.json({ success: true, data: summary });
    } catch (error: any) {
        console.error('Error obteniendo resumen de transiciones:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
