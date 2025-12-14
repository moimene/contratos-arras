/**
 * Health Check Routes
 * 
 * Endpoints para verificar el estado de los servicios críticos.
 * Usados para monitoring, load balancers, y deployments.
 */

import { Router, Request, Response } from 'express';
import { QTSP_MODE, QTSP_PROVIDER_URL, QTSP_TIMEOUT_MS } from '../config/constants.js';

const router = Router();

/**
 * GET /health
 * Health check básico del servidor
 */
router.get('/', async (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0'
    });
});

/**
 * GET /health/qtsp
 * Verifica el estado del servicio QTSP
 */
router.get('/qtsp', async (req: Request, res: Response) => {
    try {
        const qtspStatus = {
            mode: QTSP_MODE,
            providerUrl: QTSP_MODE === 'production' ? QTSP_PROVIDER_URL : 'N/A (stub)',
            timeout: QTSP_TIMEOUT_MS,
            ready: QTSP_MODE === 'stub' ? true : await checkQtspConnection()
        };

        if (!qtspStatus.ready) {
            return res.status(503).json({
                status: 'error',
                message: 'QTSP service unavailable',
                details: qtspStatus
            });
        }

        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            qtsp: qtspStatus
        });
    } catch (error: any) {
        res.status(503).json({
            status: 'error',
            message: 'QTSP health check failed',
            error: error.message
        });
    }
});

/**
 * GET /health/db
 * Verifica la conexión a la base de datos
 */
router.get('/db', async (req: Request, res: Response) => {
    try {
        const { supabase } = await import('../config/supabase.js');
        const start = Date.now();

        const { data, error } = await supabase
            .from('contratos')
            .select('id')
            .limit(1);

        const latency = Date.now() - start;

        if (error) {
            return res.status(503).json({
                status: 'error',
                message: 'Database connection failed',
                error: error.message
            });
        }

        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            database: {
                connected: true,
                latency: `${latency}ms`
            }
        });
    } catch (error: any) {
        res.status(503).json({
            status: 'error',
            message: 'Database health check failed',
            error: error.message
        });
    }
});

/**
 * Verifica conexión real al QTSP en modo producción
 */
async function checkQtspConnection(): Promise<boolean> {
    if (QTSP_MODE !== 'production') {
        return true;
    }

    try {
        // En producción, hacer ping al servicio QTSP
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), QTSP_TIMEOUT_MS);

        const response = await fetch(`${QTSP_PROVIDER_URL}/health`, {
            method: 'GET',
            signal: controller.signal
        });

        clearTimeout(timeout);
        return response.ok;
    } catch {
        return false;
    }
}

export default router;
