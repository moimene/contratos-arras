/**
 * Role Endpoint - GET /api/contracts/:id/role
 * 
 * Determines the effective role of the current user for a specific contract.
 * Uses the unified authorization logic from middleware/authorization.ts
 */

import { Router, Request, Response } from 'express';
import { resolveAuthContext } from '../middleware/authorization.js';
import type { TipoRolUsuario } from '../types/models.js';

const router = Router();

/**
 * GET /api/contracts/:id/role
 * 
 * Returns the effective role and permissions for the authenticated user on this contract.
 */
router.get('/:id/role', async (req: Request, res: Response): Promise<void> => {
    try {
        const contratoId = req.params.id;
        const userId = req.headers['x-user-id'] as string;
        const userEmail = req.headers['x-user-email'] as string;
        const mandatoId = req.headers['x-mandato-id'] as string;

        // Use unified auth resolution
        const authContext = await resolveAuthContext(userId, userEmail, contratoId, mandatoId);

        res.json({
            success: true,
            data: {
                role: authContext.tipoRol,
                source: authContext.source,
                parteId: authContext.miembro?.id, // Or map to legacy parteId if needed, but memberId is better for new system
                permissions: authContext.permisos,
                mandato: authContext.mandatoActivo ? {
                    id: authContext.mandatoActivo.id,
                    tipo: authContext.mandatoActivo.tipo_mandato
                } : null
            }
        });

    } catch (error) {
        console.error('[role] Error:', error);
        res.status(500).json({
            success: false,
            error: 'Error al determinar rol'
        });
    }
});

export default router;
