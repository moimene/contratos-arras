/**
 * Inbound Communication Service
 * 
 * Recibe comunicaciones entrantes (emails, webhooks) y las certifica con QTSP.
 * La plataforma actúa como tercero de confianza certificando el momento de recepción.
 */

import { createHash } from 'crypto';
import { supabase } from '../config/supabase.js';
import { registerEvent } from './eventService.js';
import { requestQualifiedTimestamp } from '../qtsp/eadTrustClient.js';

// ============================================
// TIPOS
// ============================================

export interface InboundEmailPayload {
    // Identificación del contrato
    contratoId?: string;               // Si se conoce
    numeroExpediente?: string;         // Alternativa para identificar
    emailDestinatario: string;         // Email de la plataforma que recibió

    // Datos del email
    from: string;                      // Remitente
    to: string[];                      // Destinatarios
    cc?: string[];
    subject: string;
    bodyText: string;
    bodyHtml?: string;

    // Metadata del servidor de correo
    messageId: string;                 // ID único del mensaje
    receivedAt: string;                // Timestamp de recepción en servidor
    headers?: Record<string, string>;  // Headers relevantes

    // Adjuntos
    attachments?: Array<{
        filename: string;
        contentType: string;
        size: number;
        content?: string;              // Base64
    }>;
}

export interface InboundWebhookPayload {
    contratoId: string;
    source: string;                    // 'BUROFAX' | 'NOTIFICACION_HACIENDA' | 'API_EXTERNA' | etc
    sender: string;
    content: string;
    receivedAt: string;
    referenceId?: string;              // ID externo de referencia
    metadata?: Record<string, any>;
    attachments?: Array<{
        filename: string;
        url?: string;
        content?: string;
    }>;
}

export interface InboundResult {
    id: string;
    contratoId: string;
    hashContenido: string;
    selloQtspId: string;
    fechaRecepcionCertificada: string;
    advertencias: string[];
}

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

/**
 * Procesa un email entrante y lo certifica con QTSP
 */
export async function processInboundEmail(payload: InboundEmailPayload): Promise<InboundResult> {
    const advertencias: string[] = [];
    const now = new Date().toISOString();

    // 1. Identificar el contrato asociado
    let contratoId = payload.contratoId;

    if (!contratoId && payload.numeroExpediente) {
        const { data } = await supabase
            .from('contratos_arras')
            .select('id')
            .eq('numero_expediente', payload.numeroExpediente)
            .single();
        contratoId = data?.id;
    }

    if (!contratoId) {
        // Intentar extraer del email destinatario (formato: expediente+ARR-2024-001@plataforma.com)
        const match = payload.emailDestinatario.match(/\+([A-Z]{3}-\d{4}-\d+)@/i);
        if (match) {
            const { data } = await supabase
                .from('contratos_arras')
                .select('id')
                .eq('numero_expediente', match[1])
                .single();
            contratoId = data?.id;
        }
    }

    if (!contratoId) {
        throw new Error('No se pudo identificar el contrato asociado al email');
    }

    // 2. Construir contenido canónico para hash
    const contenidoCanonico = JSON.stringify({
        tipo: 'EMAIL_RECIBIDO',
        message_id: payload.messageId,
        from: payload.from,
        to: payload.to,
        subject: payload.subject,
        body: payload.bodyText,
        received_at_server: payload.receivedAt,
        received_at_platform: now,
        attachments_count: payload.attachments?.length || 0
    });

    const hashContenido = createHash('sha256').update(contenidoCanonico).digest('hex');

    // 3. Sellar con QTSP INMEDIATAMENTE (crítico para valor probatorio)
    let selloQtspId: string;
    try {
        const qtspResponse = await requestQualifiedTimestamp(hashContenido);

        const { data: sello } = await supabase
            .from('sellos_tiempo')
            .insert({
                proveedor: qtspResponse.proveedor,
                marca: qtspResponse.marca,
                hash_sha256: hashContenido,
                rfc3161_tst_base64: qtspResponse.rfc3161TstBase64,
                fecha_sello: qtspResponse.fechaSello,
                estado: 'EMITIDO',
                metadata_json: JSON.stringify({
                    tipo: 'COMUNICACION_RECIBIDA',
                    message_id: payload.messageId,
                    from: payload.from,
                    contrato_id: contratoId
                })
            })
            .select('id')
            .single();

        selloQtspId = sello?.id || '';

        if (!selloQtspId) {
            throw new Error('No se pudo obtener ID del sello');
        }
    } catch (err: any) {
        // El sellado QTSP es CRÍTICO - si falla, no registramos sin certificación
        throw new Error(`Error crítico: No se pudo certificar la recepción (${err.message})`);
    }

    // 4. Crear registro de comunicación
    const comunicacionId = crypto.randomUUID();

    const { error: insertError } = await supabase
        .from('comunicaciones')
        .insert({
            id: comunicacionId,
            contrato_id: contratoId,
            tipo_comunicacion: 'COMUNICACION_EXTERNA_IMPORTADA',
            tipo_funcion: 'EMAIL_RECIBIDO',
            canal: 'EMAIL',
            remitente_externo: payload.from,
            destinatarios_externos: payload.to.join(', '),
            asunto: payload.subject,
            contenido: payload.bodyText,
            contenido_html: payload.bodyHtml,
            resumen_externo: `Email de ${payload.from}: ${payload.subject}`,
            fecha_comunicacion: payload.receivedAt, // Fecha del servidor de correo
            fecha_registro: now,                     // Fecha de registro en plataforma
            estado: 'ENTREGADA',                     // Ya fue entregada (la recibimos)
            es_externa: true,
            hash_contenido: hashContenido,
            sello_qtsp_id: selloQtspId,
            metadatos: {
                message_id: payload.messageId,
                headers: payload.headers,
                cc: payload.cc,
                attachments_info: payload.attachments?.map(a => ({
                    filename: a.filename,
                    contentType: a.contentType,
                    size: a.size
                })),
                recepcion_certificada: {
                    fecha_servidor_correo: payload.receivedAt,
                    fecha_plataforma: now,
                    sello_qtsp_id: selloQtspId,
                    hash_certificado: hashContenido
                }
            },
            registrado_por_rol: 'SISTEMA',
            notas_internas: 'Comunicación recibida y certificada automáticamente por la plataforma QTSP'
        });

    if (insertError) {
        throw new Error(`Error registrando comunicación: ${insertError.message}`);
    }

    // 5. Procesar adjuntos si los hay
    if (payload.attachments && payload.attachments.length > 0) {
        const adjuntosIds: string[] = [];

        for (const adjunto of payload.attachments) {
            if (adjunto.content) {
                const archivoId = crypto.randomUUID();
                const archivoHash = createHash('sha256')
                    .update(Buffer.from(adjunto.content, 'base64'))
                    .digest('hex');

                // Guardar referencia al archivo
                await supabase.from('archivos').insert({
                    id: archivoId,
                    contrato_id: contratoId,
                    nombre_original: adjunto.filename,
                    tipo: 'DOC_EXTERNO_CANAL',
                    estado: 'VALIDADO', // Recibido y certificado
                    hash_sha256: archivoHash,
                    metadata: {
                        comunicacion_id: comunicacionId,
                        content_type: adjunto.contentType,
                        size: adjunto.size,
                        recibido_por_email: true
                    }
                });

                adjuntosIds.push(archivoId);
            }
        }

        if (adjuntosIds.length > 0) {
            await supabase
                .from('comunicaciones')
                .update({ adjuntos_archivo_ids: adjuntosIds })
                .eq('id', comunicacionId);
        }
    }

    // 6. Registrar evento
    await registerEvent({
        contratoId,
        tipo: 'COMUNICACION_EXTERNA_IMPORTADA',
        payload: {
            comunicacion_id: comunicacionId,
            canal: 'EMAIL',
            tipo_funcion: 'EMAIL_RECIBIDO',
            from: payload.from,
            subject: payload.subject,
            message_id: payload.messageId,
            hash_contenido: hashContenido,
            sello_qtsp_id: selloQtspId,
            recepcion_certificada: true,
            advertencia: 'Certificación de recepción, no de envío original'
        }
    });

    // 7. Advertencia importante sobre limitaciones
    advertencias.push('La certificación QTSP acredita la recepción en plataforma, no el envío original del remitente');

    if (payload.attachments && payload.attachments.length > 0) {
        advertencias.push(`Se certificaron ${payload.attachments.length} adjunto(s) con la comunicación`);
    }

    return {
        id: comunicacionId,
        contratoId,
        hashContenido,
        selloQtspId,
        fechaRecepcionCertificada: now,
        advertencias
    };
}

/**
 * Procesa una comunicación entrante de webhook externo
 */
export async function processInboundWebhook(payload: InboundWebhookPayload): Promise<InboundResult> {
    const advertencias: string[] = [];
    const now = new Date().toISOString();

    // 1. Validar contrato
    const { data: contrato } = await supabase
        .from('contratos_arras')
        .select('id')
        .eq('id', payload.contratoId)
        .single();

    if (!contrato) {
        throw new Error('Contrato no encontrado');
    }

    // 2. Construir contenido canónico
    const contenidoCanonico = JSON.stringify({
        tipo: 'WEBHOOK_RECIBIDO',
        source: payload.source,
        sender: payload.sender,
        content: payload.content,
        reference_id: payload.referenceId,
        received_at: payload.receivedAt,
        platform_received_at: now
    });

    const hashContenido = createHash('sha256').update(contenidoCanonico).digest('hex');

    // 3. Sellar con QTSP
    let selloQtspId: string;
    try {
        const qtspResponse = await requestQualifiedTimestamp(hashContenido);

        const { data: sello } = await supabase
            .from('sellos_tiempo')
            .insert({
                proveedor: qtspResponse.proveedor,
                marca: qtspResponse.marca,
                hash_sha256: hashContenido,
                rfc3161_tst_base64: qtspResponse.rfc3161TstBase64,
                fecha_sello: qtspResponse.fechaSello,
                estado: 'EMITIDO',
                metadata_json: JSON.stringify({
                    tipo: 'WEBHOOK_RECIBIDO',
                    source: payload.source,
                    contrato_id: payload.contratoId
                })
            })
            .select('id')
            .single();

        selloQtspId = sello?.id || '';
    } catch (err: any) {
        throw new Error(`Error certificando recepción: ${err.message}`);
    }

    // 4. Determinar canal según source
    const canalMap: Record<string, string> = {
        'BUROFAX': 'BUROFAX',
        'CORREO_CERTIFICADO': 'CARTA_CERTIFICADA',
        'NOTIFICACION_HACIENDA': 'OTRO',
        'API_EXTERNA': 'OTRO'
    };

    const canal = canalMap[payload.source] || 'OTRO';

    // 5. Crear comunicación
    const comunicacionId = crypto.randomUUID();

    await supabase.from('comunicaciones').insert({
        id: comunicacionId,
        contrato_id: payload.contratoId,
        tipo_comunicacion: 'COMUNICACION_EXTERNA_IMPORTADA',
        tipo_funcion: payload.source,
        canal,
        remitente_externo: payload.sender,
        contenido: payload.content,
        resumen_externo: `${payload.source} de ${payload.sender}`,
        fecha_comunicacion: payload.receivedAt,
        fecha_registro: now,
        estado: 'ENTREGADA',
        es_externa: true,
        hash_contenido: hashContenido,
        sello_qtsp_id: selloQtspId,
        metadatos: {
            source: payload.source,
            reference_id: payload.referenceId,
            ...payload.metadata,
            recepcion_certificada: {
                fecha: now,
                sello_qtsp_id: selloQtspId,
                hash_certificado: hashContenido
            }
        },
        registrado_por_rol: 'SISTEMA'
    });

    // 6. Registrar evento
    await registerEvent({
        contratoId: payload.contratoId,
        tipo: 'COMUNICACION_EXTERNA_IMPORTADA',
        payload: {
            comunicacion_id: comunicacionId,
            source: payload.source,
            canal,
            sender: payload.sender,
            hash_contenido: hashContenido,
            sello_qtsp_id: selloQtspId,
            recepcion_certificada: true
        }
    });

    advertencias.push('Recepción certificada por QTSP - no se certifica el envío original');

    return {
        id: comunicacionId,
        contratoId: payload.contratoId,
        hashContenido,
        selloQtspId,
        fechaRecepcionCertificada: now,
        advertencias
    };
}

/**
 * Genera un email de recepción único para un contrato
 */
export function generateContractEmail(numeroExpediente: string, domainBase: string): string {
    // Formato: expediente+ARR-2024-001@plataforma.chronoflare.com
    const sanitized = numeroExpediente.replace(/[^A-Za-z0-9-]/g, '');
    return `expediente+${sanitized}@${domainBase}`;
}
