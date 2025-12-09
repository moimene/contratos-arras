/**
 * Inbound Communications API Routes
 * 
 * Endpoints para recibir comunicaciones entrantes (emails, webhooks)
 * y certificarlas automáticamente con QTSP.
 */

import { Router, Request, Response } from 'express';
import {
    processInboundEmail,
    processInboundWebhook,
    generateContractEmail
} from '../services/inboundService.js';

const router = Router();

// Secreto para validar webhooks entrantes
const INBOUND_WEBHOOK_SECRET = process.env.INBOUND_WEBHOOK_SECRET || '';

/**
 * Middleware para validar webhook secret
 */
function validateWebhookSecret(req: Request, res: Response, next: Function) {
    const secret = req.headers['x-webhook-secret'] || req.query.secret;

    if (INBOUND_WEBHOOK_SECRET && secret !== INBOUND_WEBHOOK_SECRET) {
        return res.status(401).json({
            success: false,
            error: 'Webhook secret inválido'
        });
    }

    next();
}

/**
 * POST /api/inbound/email
 * Recibe emails entrantes (desde n8n, Zapier, o directamente del mail server)
 * 
 * Este endpoint debe ser llamado por n8n cuando recibe un email
 * destinado a la plataforma (ej: expediente+ARR-2024-001@plataforma.com)
 */
router.post('/email', validateWebhookSecret, async (req: Request, res: Response) => {
    try {
        const payload = req.body;

        // Validaciones básicas
        if (!payload.from || !payload.subject) {
            return res.status(400).json({
                success: false,
                error: 'Payload incompleto: se requiere from y subject'
            });
        }

        if (!payload.messageId) {
            payload.messageId = `generated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }

        if (!payload.receivedAt) {
            payload.receivedAt = new Date().toISOString();
        }

        const result = await processInboundEmail({
            contratoId: payload.contratoId,
            numeroExpediente: payload.numeroExpediente,
            emailDestinatario: payload.to?.[0] || payload.emailDestinatario || '',
            from: payload.from,
            to: Array.isArray(payload.to) ? payload.to : [payload.to],
            cc: payload.cc,
            subject: payload.subject,
            bodyText: payload.bodyText || payload.text || payload.body || '',
            bodyHtml: payload.bodyHtml || payload.html,
            messageId: payload.messageId,
            receivedAt: payload.receivedAt,
            headers: payload.headers,
            attachments: payload.attachments
        });

        res.json({
            success: true,
            message: 'Email recibido y certificado con QTSP',
            data: result
        });

    } catch (error: any) {
        console.error('[Inbound] Error procesando email:', error.message);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/inbound/webhook
 * Recibe comunicaciones de sistemas externos (burofax digital, notificaciones, etc.)
 */
router.post('/webhook', validateWebhookSecret, async (req: Request, res: Response) => {
    try {
        const { contratoId, source, sender, content, receivedAt, referenceId, metadata, attachments } = req.body;

        if (!contratoId || !source || !content) {
            return res.status(400).json({
                success: false,
                error: 'Se requiere contratoId, source y content'
            });
        }

        const result = await processInboundWebhook({
            contratoId,
            source,
            sender: sender || 'Desconocido',
            content,
            receivedAt: receivedAt || new Date().toISOString(),
            referenceId,
            metadata,
            attachments
        });

        res.json({
            success: true,
            message: `Comunicación ${source} recibida y certificada`,
            data: result
        });

    } catch (error: any) {
        console.error('[Inbound] Error procesando webhook:', error.message);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/inbound/n8n/email-parsed
 * Endpoint específico para n8n Email Trigger con parsing automático
 * Formato esperado del nodo Email Read / IMAP de n8n
 */
router.post('/n8n/email-parsed', validateWebhookSecret, async (req: Request, res: Response) => {
    try {
        const email = req.body;

        // Mapear formato n8n al nuestro
        const payload = {
            contratoId: email.contratoId,
            numeroExpediente: email.numeroExpediente,
            emailDestinatario: email.to?.text || email.to,
            from: email.from?.text || email.from?.value?.[0]?.address || email.from,
            to: email.to?.value?.map((t: any) => t.address) || [email.to],
            cc: email.cc?.value?.map((c: any) => c.address),
            subject: email.subject,
            bodyText: email.text || email.textAsHtml,
            bodyHtml: email.html,
            messageId: email.messageId || email.headers?.['message-id'],
            receivedAt: email.date || new Date().toISOString(),
            headers: email.headers,
            attachments: email.attachments?.map((a: any) => ({
                filename: a.filename,
                contentType: a.contentType || a.mimeType,
                size: a.size,
                content: a.content?.toString('base64')
            }))
        };

        const result = await processInboundEmail(payload);

        res.json({
            success: true,
            message: 'Email procesado desde n8n',
            data: result
        });

    } catch (error: any) {
        console.error('[Inbound/n8n] Error:', error.message);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/inbound/email-address/:contratoId
 * Genera el email de recepción para un contrato específico
 */
router.get('/email-address/:contratoId', async (req: Request, res: Response) => {
    try {
        const { contratoId } = req.params;
        const { supabase } = await import('../config/supabase.js');

        const { data: contrato } = await supabase
            .from('contratos_arras')
            .select('numero_expediente')
            .eq('id', contratoId)
            .single();

        if (!contrato) {
            return res.status(404).json({
                success: false,
                error: 'Contrato no encontrado'
            });
        }

        const emailDomain = process.env.INBOUND_EMAIL_DOMAIN || 'expediente.chronoflare.com';
        const email = generateContractEmail(contrato.numero_expediente, emailDomain);

        res.json({
            success: true,
            data: {
                email,
                numeroExpediente: contrato.numero_expediente,
                instrucciones: 'Los emails enviados a esta dirección serán automáticamente certificados con QTSP y asociados al expediente.'
            }
        });

    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/inbound/stats/:contratoId
 * Estadísticas de comunicaciones recibidas para un contrato
 */
router.get('/stats/:contratoId', async (req: Request, res: Response) => {
    try {
        const { contratoId } = req.params;
        const { supabase } = await import('../config/supabase.js');

        const { data, count } = await supabase
            .from('comunicaciones')
            .select('canal, tipo_funcion, fecha_registro', { count: 'exact' })
            .eq('contrato_id', contratoId)
            .eq('es_externa', true)
            .not('sello_qtsp_id', 'is', null);

        // Agrupar por canal
        const porCanal: Record<string, number> = {};
        data?.forEach(c => {
            porCanal[c.canal] = (porCanal[c.canal] || 0) + 1;
        });

        res.json({
            success: true,
            data: {
                totalRecibidas: count || 0,
                certificadas: count || 0, // Todas las externas con sello
                porCanal,
                ultimaRecepcion: data?.[0]?.fecha_registro
            }
        });

    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
