/**
 * Communication Service
 * 
 * Servicio central para gestión de comunicaciones del expediente.
 * Maneja: comunicaciones internas estructuradas, importación de externas, QTSP.
 */

import { createHash } from 'crypto';
import { supabase } from '../config/supabase.js';
import { registerEvent } from './eventService.js';
import { requestQualifiedTimestamp } from '../qtsp/eadTrustClient.js';
import { triggerCommunicationWebhook } from './notificationService.js';

// ============================================
// TIPOS
// ============================================

export type TipoComunicacion =
    | 'RECLAMACION'
    | 'SOLICITUD_DOCUMENTACION'
    | 'SOLICITUD_MODIFICACION_TERMINOS'
    | 'NOTIFICACION_GENERAL'
    | 'CONVOCATORIA_NOTARIA'
    | 'NOTIFICACION_NO_COMPARECENCIA'
    | 'ALEGACION'
    | 'RESPUESTA'
    | 'COMUNICACION_EXTERNA_IMPORTADA';

export type CanalComunicacion =
    | 'PLATAFORMA'
    | 'EMAIL'
    | 'BUROFAX'
    | 'CARTA_CERTIFICADA'
    | 'CARTA_SIMPLE'
    | 'WHATSAPP'
    | 'TELEFONO'
    | 'OTRO';

export type EstadoComunicacion =
    | 'BORRADOR'
    | 'ENVIADA'
    | 'ENTREGADA'
    | 'LEIDA'
    | 'RESPONDIDA';

export interface CreateCommunicationParams {
    contratoId: string;
    tipoComunicacion: TipoComunicacion;
    canal?: CanalComunicacion;
    remitenteRol: string;
    remitenteUsuarioId?: string;
    destinatariosRoles?: string[];
    asunto?: string;
    contenido: string;
    contenidoHtml?: string;
    metadatos?: Record<string, any>;
    adjuntosArchivoIds?: string[];
    enviarInmediatamente?: boolean;
}

export interface ImportExternalParams {
    contratoId: string;
    canal: CanalComunicacion;
    fechaComunicacion: string; // ISO date de cuando ocurrió realmente
    remitenteExterno: string;
    destinatariosExternos?: string;
    resumenContenido: string;
    tipoFuncion?: string;
    adjuntosArchivoIds?: string[];
    comunicacionPadreId?: string;
    metadatos?: Record<string, any>;
    registradoPorRol: string;
    registradoPorUsuarioId?: string;
}

export interface CommunicationResult {
    id: string;
    hashContenido: string;
    selloQtspId?: string;
    estado: EstadoComunicacion;
}

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

/**
 * Calcula hash SHA-256 del contenido de una comunicación
 */
export function calculateContentHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
}

/**
 * Crea una nueva comunicación interna
 */
export async function createCommunication(params: CreateCommunicationParams): Promise<CommunicationResult> {
    const {
        contratoId,
        tipoComunicacion,
        canal = 'PLATAFORMA',
        remitenteRol,
        remitenteUsuarioId,
        destinatariosRoles = [],
        asunto,
        contenido,
        contenidoHtml,
        metadatos = {},
        adjuntosArchivoIds = [],
        enviarInmediatamente = false
    } = params;

    // 1. Calcular hash del contenido
    const hashContenido = calculateContentHash(contenido);

    // 2. Determinar estado inicial
    const estado: EstadoComunicacion = enviarInmediatamente ? 'ENVIADA' : 'BORRADOR';

    // 3. Crear registro
    const comunicacionId = crypto.randomUUID();
    const now = new Date().toISOString();

    const { error } = await supabase
        .from('comunicaciones')
        .insert({
            id: comunicacionId,
            contrato_id: contratoId,
            tipo_comunicacion: tipoComunicacion,
            canal,
            remitente_rol: remitenteRol,
            remitente_usuario_id: remitenteUsuarioId,
            destinatarios_roles: destinatariosRoles,
            asunto,
            contenido,
            contenido_html: contenidoHtml,
            fecha_comunicacion: now,
            fecha_envio: enviarInmediatamente ? now : null,
            estado,
            es_externa: false,
            adjuntos_archivo_ids: adjuntosArchivoIds,
            hash_contenido: hashContenido,
            metadatos,
            registrado_por_rol: remitenteRol,
            registrado_por_usuario_id: remitenteUsuarioId
        });

    if (error) {
        throw new Error(`Error creando comunicación: ${error.message}`);
    }

    // 4. Si se envía inmediatamente, sellar con QTSP
    let selloQtspId: string | undefined;
    if (enviarInmediatamente) {
        selloQtspId = await sealCommunication(comunicacionId, hashContenido, contratoId);
    }

    // 5. Registrar evento
    await registerEvent({
        contratoId,
        tipo: 'COMUNICACION_ENVIADA',
        payload: {
            comunicacion_id: comunicacionId,
            tipo: tipoComunicacion,
            canal,
            remitente_rol: remitenteRol,
            destinatarios: destinatariosRoles,
            hash_contenido: hashContenido,
            sello_qtsp_id: selloQtspId
        }
    });

    // 6. Disparar webhook de notificación (async, no bloqueante)
    if (enviarInmediatamente) {
        triggerCommunicationWebhook(comunicacionId, 'COMUNICACION_ENVIADA').catch(err => {
            console.warn('[Notifications] Webhook failed:', err.message);
        });
    }

    return {
        id: comunicacionId,
        hashContenido,
        selloQtspId,
        estado
    };
}

/**
 * Importa una comunicación externa al expediente
 */
export async function importExternalCommunication(params: ImportExternalParams): Promise<CommunicationResult> {
    const {
        contratoId,
        canal,
        fechaComunicacion,
        remitenteExterno,
        destinatariosExternos,
        resumenContenido,
        tipoFuncion,
        adjuntosArchivoIds = [],
        comunicacionPadreId,
        metadatos = {},
        registradoPorRol,
        registradoPorUsuarioId
    } = params;

    // 1. Validaciones
    if (!resumenContenido || resumenContenido.length < 10) {
        throw new Error('El resumen del contenido debe tener al menos 10 caracteres');
    }

    // 2. Calcular hash del contenido canónico
    const contenidoCanonico = JSON.stringify({
        tipo: 'COMUNICACION_EXTERNA_IMPORTADA',
        canal,
        fecha_comunicacion: fechaComunicacion,
        remitente_externo: remitenteExterno,
        resumen: resumenContenido,
        adjuntos: adjuntosArchivoIds,
        fecha_registro: new Date().toISOString()
    });
    const hashContenido = calculateContentHash(contenidoCanonico);

    // 3. Crear registro
    const comunicacionId = crypto.randomUUID();
    const now = new Date().toISOString();

    const { error } = await supabase
        .from('comunicaciones')
        .insert({
            id: comunicacionId,
            contrato_id: contratoId,
            tipo_comunicacion: 'COMUNICACION_EXTERNA_IMPORTADA',
            tipo_funcion: tipoFuncion,
            canal,
            remitente_externo: remitenteExterno,
            destinatarios_externos: destinatariosExternos,
            resumen_externo: resumenContenido,
            contenido: resumenContenido, // También guardamos en contenido para búsquedas
            fecha_comunicacion: fechaComunicacion, // Fecha original
            fecha_registro: now, // Fecha de importación
            estado: 'ENVIADA', // Externas siempre están "enviadas"
            es_externa: true,
            comunicacion_padre_id: comunicacionPadreId,
            adjuntos_archivo_ids: adjuntosArchivoIds,
            hash_contenido: hashContenido,
            metadatos: {
                ...metadatos,
                fecha_importacion: now,
                importado_por_rol: registradoPorRol
            },
            registrado_por_rol: registradoPorRol,
            registrado_por_usuario_id: registradoPorUsuarioId
        });

    if (error) {
        throw new Error(`Error importando comunicación externa: ${error.message}`);
    }

    // 4. Sellar con QTSP (siempre para externas)
    const selloQtspId = await sealCommunication(comunicacionId, hashContenido, contratoId);

    // 5. Registrar evento específico
    await registerEvent({
        contratoId,
        tipo: 'COMUNICACION_EXTERNA_IMPORTADA',
        payload: {
            comunicacion_id: comunicacionId,
            canal,
            fecha_original: fechaComunicacion,
            remitente_externo: remitenteExterno,
            resumen: resumenContenido.substring(0, 200),
            adjuntos_count: adjuntosArchivoIds.length,
            hash_contenido: hashContenido,
            sello_qtsp_id: selloQtspId
        }
    });

    // 6. Disparar webhook de notificación para externas importadas
    triggerCommunicationWebhook(comunicacionId, 'COMUNICACION_EXTERNA_IMPORTADA').catch(err => {
        console.warn('[Notifications] Webhook failed:', err.message);
    });

    return {
        id: comunicacionId,
        hashContenido,
        selloQtspId,
        estado: 'ENVIADA'
    };
}

/**
 * Envía una comunicación que estaba en borrador
 */
export async function sendCommunication(comunicacionId: string): Promise<void> {
    const { data: comunicacion, error: fetchError } = await supabase
        .from('comunicaciones')
        .select('*')
        .eq('id', comunicacionId)
        .single();

    if (fetchError || !comunicacion) {
        throw new Error('Comunicación no encontrada');
    }

    if (comunicacion.estado !== 'BORRADOR') {
        throw new Error('Solo se pueden enviar comunicaciones en estado BORRADOR');
    }

    const now = new Date().toISOString();

    // Actualizar estado
    const { error: updateError } = await supabase
        .from('comunicaciones')
        .update({
            estado: 'ENVIADA',
            fecha_envio: now
        })
        .eq('id', comunicacionId);

    if (updateError) {
        throw new Error(`Error enviando comunicación: ${updateError.message}`);
    }

    // Sellar con QTSP
    const selloQtspId = await sealCommunication(
        comunicacionId,
        comunicacion.hash_contenido,
        comunicacion.contrato_id
    );

    // Registrar evento
    await registerEvent({
        contratoId: comunicacion.contrato_id,
        tipo: 'COMUNICACION_ENVIADA',
        payload: {
            comunicacion_id: comunicacionId,
            tipo: comunicacion.tipo_comunicacion,
            hash_contenido: comunicacion.hash_contenido,
            sello_qtsp_id: selloQtspId
        }
    });
}

/**
 * Responde a una comunicación existente
 */
export async function respondToCommunication(
    comunicacionPadreId: string,
    respuesta: Omit<CreateCommunicationParams, 'contratoId'>
): Promise<CommunicationResult> {
    // Obtener comunicación padre
    const { data: padre, error } = await supabase
        .from('comunicaciones')
        .select('contrato_id, remitente_rol, destinatarios_roles')
        .eq('id', comunicacionPadreId)
        .single();

    if (error || !padre) {
        throw new Error('Comunicación padre no encontrada');
    }

    // Crear respuesta
    const resultado = await createCommunication({
        ...respuesta,
        contratoId: padre.contrato_id,
        tipoComunicacion: 'RESPUESTA'
    });

    // Vincular a padre
    await supabase
        .from('comunicaciones')
        .update({ comunicacion_padre_id: comunicacionPadreId })
        .eq('id', resultado.id);

    // Marcar padre como respondida
    await supabase
        .from('comunicaciones')
        .update({ estado: 'RESPONDIDA' })
        .eq('id', comunicacionPadreId);

    return resultado;
}

/**
 * Marca una comunicación como entregada
 */
export async function markAsDelivered(comunicacionId: string): Promise<void> {
    const { error } = await supabase
        .from('comunicaciones')
        .update({
            estado: 'ENTREGADA',
            fecha_entrega: new Date().toISOString()
        })
        .eq('id', comunicacionId);

    if (error) {
        throw new Error(`Error marcando como entregada: ${error.message}`);
    }
}

/**
 * Marca una comunicación como leída
 */
export async function markAsRead(comunicacionId: string): Promise<void> {
    const { data: comunicacion, error: fetchError } = await supabase
        .from('comunicaciones')
        .select('contrato_id, estado')
        .eq('id', comunicacionId)
        .single();

    if (fetchError || !comunicacion) {
        throw new Error('Comunicación no encontrada');
    }

    if (comunicacion.estado === 'LEIDA' || comunicacion.estado === 'RESPONDIDA') {
        return; // Ya está leída
    }

    const { error } = await supabase
        .from('comunicaciones')
        .update({
            estado: 'LEIDA',
            fecha_lectura: new Date().toISOString()
        })
        .eq('id', comunicacionId);

    if (error) {
        throw new Error(`Error marcando como leída: ${error.message}`);
    }

    // Registrar evento
    await registerEvent({
        contratoId: comunicacion.contrato_id,
        tipo: 'COMUNICACION_LEIDA',
        payload: { comunicacion_id: comunicacionId }
    });
}

/**
 * Obtiene el hilo de conversación de una comunicación
 */
export async function getConversationThread(comunicacionId: string): Promise<any[]> {
    // Primero encontrar la raíz
    let rootId = comunicacionId;
    let current = await getCommunication(comunicacionId);

    while (current?.comunicacion_padre_id) {
        rootId = current.comunicacion_padre_id;
        current = await getCommunication(rootId);
    }

    // Obtener todo el hilo
    const { data, error } = await supabase
        .from('comunicaciones')
        .select('*')
        .or(`id.eq.${rootId},comunicacion_padre_id.eq.${rootId}`)
        .order('fecha_comunicacion', { ascending: true });

    if (error) {
        throw new Error(`Error obteniendo hilo: ${error.message}`);
    }

    return data || [];
}

/**
 * Obtiene una comunicación por ID
 */
export async function getCommunication(id: string): Promise<any | null> {
    const { data, error } = await supabase
        .from('comunicaciones')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return null;
    return data;
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Sella una comunicación con QTSP
 */
async function sealCommunication(
    comunicacionId: string,
    hashContenido: string,
    contratoId: string
): Promise<string | undefined> {
    try {
        const qtspResponse = await requestQualifiedTimestamp(hashContenido);

        // Guardar sello en DB
        const { data: sello, error: selloError } = await supabase
            .from('sellos_tiempo')
            .insert({
                proveedor: qtspResponse.proveedor,
                marca: qtspResponse.marca,
                hash_sha256: hashContenido,
                rfc3161_tst_base64: qtspResponse.rfc3161TstBase64,
                fecha_sello: qtspResponse.fechaSello,
                estado: 'EMITIDO',
                metadata_json: JSON.stringify({
                    ...qtspResponse.metadata,
                    comunicacion_id: comunicacionId,
                    contrato_id: contratoId
                })
            })
            .select('id')
            .single();

        if (!selloError && sello) {
            // Vincular sello a la comunicación
            await supabase
                .from('comunicaciones')
                .update({ sello_qtsp_id: sello.id })
                .eq('id', comunicacionId);

            return sello.id;
        }
    } catch (err) {
        console.error('Error sellando comunicación con QTSP:', err);
    }

    return undefined;
}

/**
 * Lista comunicaciones de un contrato con filtros
 */
export async function listCommunications(
    contratoId: string,
    filters?: {
        tipo?: TipoComunicacion;
        canal?: CanalComunicacion;
        estado?: EstadoComunicacion;
        esExterna?: boolean;
        limit?: number;
        offset?: number;
    }
): Promise<{ data: any[]; total: number }> {
    let query = supabase
        .from('comunicaciones')
        .select('*', { count: 'exact' })
        .eq('contrato_id', contratoId);

    if (filters?.tipo) {
        query = query.eq('tipo_comunicacion', filters.tipo);
    }
    if (filters?.canal) {
        query = query.eq('canal', filters.canal);
    }
    if (filters?.estado) {
        query = query.eq('estado', filters.estado);
    }
    if (filters?.esExterna !== undefined) {
        query = query.eq('es_externa', filters.esExterna);
    }

    query = query.order('fecha_comunicacion', { ascending: false });

    if (filters?.limit) {
        query = query.limit(filters.limit);
    }
    if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
        throw new Error(`Error listando comunicaciones: ${error.message}`);
    }

    return {
        data: data || [],
        total: count || 0
    };
}
