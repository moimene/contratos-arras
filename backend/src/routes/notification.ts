/**
 * Notification API Routes
 * 
 * Endpoints para gestión de notificaciones y webhooks n8n.
 */

import { Router, Request, Response } from 'express';
import {
    getN8nStatus,
    sendTestNotification
} from '../services/notificationService.js';

const router = Router();

/**
 * GET /api/notifications/status
 * Estado de la configuración de n8n
 */
router.get('/status', async (_req: Request, res: Response) => {
    try {
        const status = getN8nStatus();
        res.json({
            success: true,
            data: status
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/notifications/test
 * Envía una notificación de prueba a n8n
 */
router.post('/test', async (_req: Request, res: Response) => {
    try {
        const result = await sendTestNotification();

        if (result.success) {
            res.json({
                success: true,
                message: 'Notificación de prueba enviada correctamente',
                data: {
                    statusCode: result.statusCode,
                    response: result.response
                }
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error
            });
        }
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/notifications/logs
 * Obtiene logs recientes de webhooks
 */
router.get('/logs', async (req: Request, res: Response) => {
    try {
        const { supabase } = await import('../config/supabase.js');
        const limit = parseInt(req.query.limit as string) || 20;

        const { data, error } = await supabase
            .from('webhook_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            // La tabla puede no existir
            return res.json({
                success: true,
                data: [],
                message: 'Tabla de logs no configurada'
            });
        }

        res.json({
            success: true,
            data: data || []
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
