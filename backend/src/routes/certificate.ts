/**
 * Certificate API Routes
 * 
 * Endpoints para generación y descarga del Certificado de Eventos.
 */

import { Router, Request, Response } from 'express';
import { generateEventsCertificate, getExistingCertificate } from '../services/certificateService.js';

const router = Router();

/**
 * POST /api/contratos/:contratoId/certificado
 * Genera el Certificado de Eventos del expediente
 */
router.post('/:contratoId/certificado', async (req: Request, res: Response) => {
    try {
        const { contratoId } = req.params;
        const { force } = req.query; // force=true para regenerar

        // Verificar si ya existe uno reciente (últimas 24h)
        if (!force) {
            const existing = await getExistingCertificate(contratoId);
            if (existing) {
                const createdAt = new Date(existing.created_at);
                const hoursAgo = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

                if (hoursAgo < 24) {
                    return res.json({
                        success: true,
                        cached: true,
                        message: 'Certificado generado recientemente',
                        data: {
                            hashCertificado: existing.payload?.hash_certificado,
                            selloQtspId: existing.payload?.sello_qtsp_id,
                            generadoEn: existing.created_at
                        }
                    });
                }
            }
        }

        const certificado = await generateEventsCertificate(contratoId);

        res.json({
            success: true,
            data: {
                contratoId: certificado.contratoId,
                numeroExpediente: certificado.numeroExpediente,
                fechaGeneracion: certificado.fechaGeneracion,
                hashCertificado: certificado.hashCertificado,
                selloQtspId: certificado.selloQtspId,
                resumen: certificado.resumen
            }
        });
    } catch (error: any) {
        console.error('Error generando certificado:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/contratos/:contratoId/certificado/html
 * Obtiene el HTML del Certificado de Eventos
 */
router.get('/:contratoId/certificado/html', async (req: Request, res: Response) => {
    try {
        const { contratoId } = req.params;
        const certificado = await generateEventsCertificate(contratoId);

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(certificado.contenidoHtml);
    } catch (error: any) {
        console.error('Error obteniendo certificado HTML:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/contratos/:contratoId/certificado/data
 * Obtiene los datos completos del Certificado
 */
router.get('/:contratoId/certificado/data', async (req: Request, res: Response) => {
    try {
        const { contratoId } = req.params;
        const certificado = await generateEventsCertificate(contratoId);

        res.json({
            success: true,
            data: certificado
        });
    } catch (error: any) {
        console.error('Error obteniendo datos del certificado:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
