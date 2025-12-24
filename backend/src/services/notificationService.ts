/**
 * Notification Service
 * 
 * Envía webhooks a n8n para notificaciones por email/WhatsApp.
 */

import { supabase } from '../config/supabase.js';

interface Destinatario {
    rol: string;
    nombre?: string;
    email?: string;
    telefono?: string;
}

interface ComunicacionPayload {
    id: string;
    tipo: string;
    canal: string;
    asunto: string | null;
    contenido: string | null;
    remitenteRol: string | null;
    remitenteNombre?: string;
    destinatarios: Destinatario[];
}

interface ContratoInfo {
    id: string;
    numeroExpediente: string;
}

interface WebhookPayload {
    event: string;
    timestamp: string;
    comunicacion: ComunicacionPayload;
    contrato: ContratoInfo;
    notificarVia: string[];
    metadata?: Record<string, any>;
}

interface WebhookResult {
    success: boolean;
    statusCode?: number;
    response?: any;
    error?: string;
}

// Configuración
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || '';
const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET || '';
const N8N_ENABLED = process.env.N8N_ENABLED === 'true';

/**
 * Envía un webhook a n8n cuando se crea/envía una comunicación
 */
export async function triggerCommunicationWebhook(
    comunicacionId: string,
    event: 'COMUNICACION_CREADA' | 'COMUNICACION_ENVIADA' | 'COMUNICACION_EXTERNA_IMPORTADA'
): Promise<WebhookResult> {
    if (!N8N_ENABLED) {
        console.log('[Notifications] n8n webhooks disabled');
        return { success: true, error: 'n8n disabled' };
    }

    if (!N8N_WEBHOOK_URL) {
        console.warn('[Notifications] N8N_WEBHOOK_URL not configured');
        return { success: false, error: 'Webhook URL not configured' };
    }

    try {
        // 1. Obtener datos de la comunicación
        const { data: comunicacion, error: commError } = await supabase
            .from('comunicaciones')
            .select('*')
            .eq('id', comunicacionId)
            .single();

        if (commError || !comunicacion) {
            throw new Error('Comunicación no encontrada');
        }

        // 2. Obtener datos del contrato
        const { data: contrato } = await supabase
            .from('contratos_arras')
            .select('id, numero_expediente')
            .eq('id', comunicacion.contrato_id)
            .single();

        // 3. Obtener destinatarios con emails/teléfonos
        const destinatarios = await getDestinatariosConContacto(
            comunicacion.contrato_id,
            comunicacion.destinatarios_roles || []
        );

        // 4. Determinar canales de notificación
        const notificarVia = determineNotificationChannels(comunicacion, destinatarios);

        // 5. Construir payload
        const payload: WebhookPayload = {
            event,
            timestamp: new Date().toISOString(),
            comunicacion: {
                id: comunicacion.id,
                tipo: comunicacion.tipo_comunicacion,
                canal: comunicacion.canal,
                asunto: comunicacion.asunto,
                contenido: comunicacion.contenido || comunicacion.resumen_externo,
                remitenteRol: comunicacion.remitente_rol,
                destinatarios
            },
            contrato: {
                id: contrato?.id || comunicacion.contrato_id,
                numeroExpediente: contrato?.numero_expediente || 'N/A'
            },
            notificarVia,
            metadata: comunicacion.metadatos
        };

        // 6. Enviar webhook
        return await sendWebhook(event, payload, comunicacionId);

    } catch (error: any) {
        console.error('[Notifications] Webhook error:', error.message);

        await logWebhookResult(comunicacionId, event, 0, null, error.message);

        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Envía invitación a la organización
 */
export async function sendInvitationNotification(
    invitacion: {
        email: string;
        rol: string;
        token: string;
        organizacion: {
            id: string;
            nombre: string;
        };
        invitadoPor: {
            nombre: string;
            email: string;
        };
    }
): Promise<WebhookResult> {
    const event = 'INVITACION_ORGANIZACION';

    const payload = {
        event,
        timestamp: new Date().toISOString(),
        invitacion: {
            email: invitacion.email,
            rol: invitacion.rol,
            link: `${process.env.FRONTEND_URL || 'https://app.chrono-flare.com'}/accept-invite?token=${invitacion.token}`,
            token: invitacion.token
        },
        organizacion: invitacion.organizacion,
        remitente: invitacion.invitadoPor,
        notificarVia: ['EMAIL']
    };

    return await sendWebhook(event, payload);
}

/**
 * Función genérica para enviar webhooks a n8n
 */
async function sendWebhook(
    event: string,
    payload: any,
    referenceId: string | null = null
): Promise<WebhookResult> {
    if (!N8N_ENABLED) {
        console.log('[Notifications] n8n webhooks disabled');
        return { success: true, error: 'n8n disabled' };
    }

    if (!N8N_WEBHOOK_URL) {
        console.warn('[Notifications] N8N_WEBHOOK_URL not configured');
        return { success: false, error: 'Webhook URL not configured' };
    }

    try {
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Secret': N8N_WEBHOOK_SECRET,
                'X-Event-Type': event
            },
            body: JSON.stringify(payload)
        });

        const responseData = await response.text();

        // Registrar resultado si hay un ID de referencia (e.g. comunicacion_id)
        if (referenceId) {
            await logWebhookResult(referenceId, event, response.status, responseData);
        } else {
             // Si no hay ID de referencia, podemos loguear de forma genérica o saltar este paso
             // Por ahora solo log en consola
             if (!response.ok) {
                 console.error(`[Notifications] Webhook ${event} failed:`, responseData);
             }
        }

        if (!response.ok) {
            throw new Error(`Webhook failed with status ${response.status}: ${responseData}`);
        }

        console.log(`[Notifications] Webhook sent successfully for ${event}`);

        return {
            success: true,
            statusCode: response.status,
            response: responseData
        };
    } catch (error: any) {
        console.error(`[Notifications] Error sending webhook ${event}:`, error.message);

        if (referenceId) {
            await logWebhookResult(referenceId, event, 0, null, error.message);
        }

        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Obtiene los destinatarios con sus datos de contacto
 */
async function getDestinatariosConContacto(
    contratoId: string,
    roles: string[]
): Promise<Destinatario[]> {
    if (!roles || roles.length === 0) {
        return [];
    }

    const { data: partes } = await supabase
        .from('contratos_partes')
        .select(`
            rol_en_contrato,
            parte:partes(
                id,
                nombre,
                apellidos,
                email,
                telefono
            )
        `)
        .eq('contrato_id', contratoId)
        .in('rol_en_contrato', roles);

    if (!partes) return [];

    return partes.map((p: any) => ({
        rol: p.rol_en_contrato,
        nombre: p.parte ? `${p.parte.nombre} ${p.parte.apellidos || ''}`.trim() : undefined,
        email: p.parte?.email,
        telefono: p.parte?.telefono
    }));
}

/**
 * Determina por qué canales notificar según la comunicación y destinatarios
 */
function determineNotificationChannels(
    comunicacion: any,
    destinatarios: Destinatario[]
): string[] {
    const channels: string[] = [];

    // Siempre intentar email si hay destinatarios con email
    const hasEmails = destinatarios.some(d => d.email);
    if (hasEmails) {
        channels.push('EMAIL');
    }

    // WhatsApp solo para comunicaciones urgentes o convocatorias
    const hasPhones = destinatarios.some(d => d.telefono);
    const isUrgent = comunicacion.metadatos?.urgente === true;
    const isConvocatoria = comunicacion.tipo_comunicacion === 'CONVOCATORIA_NOTARIA';

    if (hasPhones && (isUrgent || isConvocatoria)) {
        channels.push('WHATSAPP');
    }

    return channels;
}

/**
 * Registra el resultado del webhook en la base de datos
 */
async function logWebhookResult(
    comunicacionId: string,
    event: string,
    statusCode: number,
    response: string | null,
    error?: string
) {
    try {
        await supabase
            .from('webhook_logs')
            .insert({
                comunicacion_id: comunicacionId,
                event_type: event,
                webhook_url: N8N_WEBHOOK_URL,
                status_code: statusCode,
                response_body: response?.substring(0, 1000), // Limitar tamaño
                error_message: error,
                created_at: new Date().toISOString()
            });
    } catch (err) {
        // Si la tabla no existe, solo loguear
        console.log('[Notifications] Could not log webhook result (table may not exist)');
    }
}

/**
 * Envía notificación de prueba
 */
export async function sendTestNotification(): Promise<WebhookResult> {
    if (!N8N_ENABLED || !N8N_WEBHOOK_URL) {
        return { success: false, error: 'n8n not configured' };
    }

    const testPayload = {
        event: 'TEST_NOTIFICATION',
        timestamp: new Date().toISOString(),
        message: 'Esta es una notificación de prueba desde ChronoFlare',
        comunicacion: {
            id: 'test-id',
            tipo: 'NOTIFICACION_GENERAL',
            canal: 'PLATAFORMA',
            asunto: 'Prueba de integración n8n',
            contenido: 'Este es un mensaje de prueba para verificar la integración con n8n.',
            remitenteRol: 'ADMIN',
            destinatarios: [
                { rol: 'TEST', nombre: 'Usuario de Prueba', email: 'test@example.com' }
            ]
        },
        contrato: {
            id: 'test-contrato',
            numeroExpediente: 'TEST-001'
        },
        notificarVia: ['EMAIL']
    };

    try {
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Secret': N8N_WEBHOOK_SECRET,
                'X-Event-Type': 'TEST_NOTIFICATION'
            },
            body: JSON.stringify(testPayload)
        });

        return {
            success: response.ok,
            statusCode: response.status,
            response: await response.text()
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Verifica la configuración de n8n
 */
export function getN8nStatus() {
    return {
        enabled: N8N_ENABLED,
        webhookConfigured: !!N8N_WEBHOOK_URL,
        webhookUrl: N8N_WEBHOOK_URL ? N8N_WEBHOOK_URL.replace(/\/[^\/]+$/, '/***') : null
    };
}
