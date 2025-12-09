/**
 * Document Service
 * 
 * Servicio central para gestión de documentos del expediente.
 * Orquesta: hash SHA-256, versionado, QTSP, eventos.
 */

import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import { supabase } from '../config/supabase.js';
import { registerEvent } from './eventService.js';
import { requestQualifiedTimestamp } from '../qtsp/eadTrustClient.js';

// ============================================
// TIPOS
// ============================================

export interface RegisterDocumentParams {
    contratoId: string;
    filePath: string;
    fileName: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    tipoDocumento: string;
    categoria?: string;
    titulo?: string;
    notas?: string;
    subidoPorRol: string;
    subidoPorUsuario?: string;
    inventarioItemId?: string;
}

export interface DocumentResult {
    archivoId: string;
    hashSha256: string;
    version: number;
    selloQtspId?: string;
    inventarioActualizado: boolean;
}

export interface ReplaceDocumentParams {
    archivoIdOriginal: string;
    contratoId: string;
    filePath: string;
    fileName: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    subidoPorRol: string;
    subidoPorUsuario?: string;
}

export interface DocumentVersion {
    id: string;
    version: number;
    hashSha256: string;
    nombreOriginal: string;
    fechaSubida: string;
    esVigente: boolean;
    reemplazadoPor?: string;
}

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

/**
 * Calcula hash SHA-256 de un archivo
 */
export function calculateFileHash(filePath: string): string {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
}

/**
 * Registra un documento nuevo con hash y sellado QTSP
 */
export async function registerDocument(params: RegisterDocumentParams): Promise<DocumentResult> {
    const {
        contratoId,
        filePath,
        fileName,
        originalName,
        mimeType,
        sizeBytes,
        tipoDocumento,
        categoria = 'OTRO',
        titulo,
        notas,
        subidoPorRol,
        subidoPorUsuario,
        inventarioItemId
    } = params;

    // 1. Calcular hash SHA-256
    const hashSha256 = calculateFileHash(filePath);

    // 2. Solicitar sello QTSP
    let selloQtspId: string | undefined;
    try {
        const qtspResponse = await requestQualifiedTimestamp(hashSha256);

        // Guardar sello en DB
        const { data: sello, error: selloError } = await supabase
            .from('sellos_tiempo')
            .insert({
                proveedor: qtspResponse.proveedor,
                marca: qtspResponse.marca,
                hash_sha256: hashSha256,
                rfc3161_tst_base64: qtspResponse.rfc3161TstBase64,
                fecha_sello: qtspResponse.fechaSello,
                estado: 'EMITIDO',
                metadata_json: JSON.stringify(qtspResponse.metadata)
            })
            .select('id')
            .single();

        if (!selloError && sello) {
            selloQtspId = sello.id;
        }
    } catch (qtspError) {
        console.error('Error obteniendo sello QTSP:', qtspError);
        // Continuamos sin sello - el documento se registra igual
    }

    // 3. Registrar archivo en DB
    const archivoId = crypto.randomUUID();
    const { error: archivoError } = await supabase
        .from('archivos')
        .insert({
            id: archivoId,
            contrato_id: contratoId,
            nombre_original: originalName,
            nombre_almacenado: fileName,
            tipo_mime: mimeType,
            tamano_bytes: sizeBytes,
            ruta_local: filePath,
            tipo_documento: tipoDocumento,
            categoria,
            titulo: titulo || originalName,
            notas,
            hash_sha256: hashSha256,
            version: 1,
            es_vigente: true,
            sello_qtsp_id: selloQtspId,
            subido_por_rol: subidoPorRol,
            subido_por_usuario: subidoPorUsuario
        });

    if (archivoError) {
        throw new Error(`Error guardando archivo: ${archivoError.message}`);
    }

    // 4. Actualizar inventario si aplica
    let inventarioActualizado = false;
    if (inventarioItemId) {
        const { error: updateError } = await supabase
            .from('inventario_expediente')
            .update({
                estado: 'SUBIDO',
                archivo_id: archivoId,
                fecha_subida: new Date().toISOString(),
                subido_por_rol: subidoPorRol,
                subido_por_usuario: subidoPorUsuario
            })
            .eq('id', inventarioItemId);

        inventarioActualizado = !updateError;
    }

    // 5. Registrar evento
    await registerEvent({
        contratoId,
        tipo: 'DOCUMENTO_SUBIDO',
        payload: {
            descripcion: `Documento subido: ${originalName}`,
            archivo_id: archivoId,
            inventario_item_id: inventarioItemId,
            tipo_documento: tipoDocumento,
            hash_sha256: hashSha256,
            sello_qtsp_id: selloQtspId,
            tamano_bytes: sizeBytes
        }
    });

    return {
        archivoId,
        hashSha256,
        version: 1,
        selloQtspId,
        inventarioActualizado
    };
}

/**
 * Reemplaza un documento existente manteniendo historial
 */
export async function replaceDocument(params: ReplaceDocumentParams): Promise<DocumentResult> {
    const {
        archivoIdOriginal,
        contratoId,
        filePath,
        fileName,
        originalName,
        mimeType,
        sizeBytes,
        subidoPorRol,
        subidoPorUsuario
    } = params;

    // 1. Obtener archivo original
    const { data: archivoOriginal, error: fetchError } = await supabase
        .from('archivos')
        .select('*')
        .eq('id', archivoIdOriginal)
        .single();

    if (fetchError || !archivoOriginal) {
        throw new Error('Archivo original no encontrado');
    }

    // 2. Calcular hash y obtener sello QTSP
    const hashSha256 = calculateFileHash(filePath);

    let selloQtspId: string | undefined;
    try {
        const qtspResponse = await requestQualifiedTimestamp(hashSha256);
        const { data: sello } = await supabase
            .from('sellos_tiempo')
            .insert({
                proveedor: qtspResponse.proveedor,
                marca: qtspResponse.marca,
                hash_sha256: hashSha256,
                rfc3161_tst_base64: qtspResponse.rfc3161TstBase64,
                fecha_sello: qtspResponse.fechaSello,
                estado: 'EMITIDO',
                metadata_json: JSON.stringify(qtspResponse.metadata)
            })
            .select('id')
            .single();

        if (sello) selloQtspId = sello.id;
    } catch (qtspError) {
        console.error('Error obteniendo sello QTSP para reemplazo:', qtspError);
    }

    // 3. Determinar número de versión
    const versionOriginalId = archivoOriginal.version_original_id || archivoIdOriginal;
    const nuevoNumeroVersion = (archivoOriginal.version || 1) + 1;

    // 4. Crear nuevo archivo
    const nuevoArchivoId = crypto.randomUUID();
    const { error: insertError } = await supabase
        .from('archivos')
        .insert({
            id: nuevoArchivoId,
            contrato_id: contratoId,
            nombre_original: originalName,
            nombre_almacenado: fileName,
            tipo_mime: mimeType,
            tamano_bytes: sizeBytes,
            ruta_local: filePath,
            tipo_documento: archivoOriginal.tipo_documento,
            categoria: archivoOriginal.categoria,
            titulo: archivoOriginal.titulo,
            hash_sha256: hashSha256,
            version: nuevoNumeroVersion,
            version_original_id: versionOriginalId,
            es_vigente: true,
            sello_qtsp_id: selloQtspId,
            subido_por_rol: subidoPorRol,
            subido_por_usuario: subidoPorUsuario
        });

    if (insertError) {
        throw new Error(`Error creando nueva versión: ${insertError.message}`);
    }

    // 5. Marcar versión anterior como no vigente
    await supabase
        .from('archivos')
        .update({
            es_vigente: false,
            reemplazado_por: nuevoArchivoId
        })
        .eq('id', archivoIdOriginal);

    // 6. Actualizar inventario si había ítem vinculado
    const { data: inventarioItem } = await supabase
        .from('inventario_expediente')
        .select('id')
        .eq('archivo_id', archivoIdOriginal)
        .single();

    if (inventarioItem) {
        await supabase
            .from('inventario_expediente')
            .update({
                archivo_id: nuevoArchivoId,
                estado: 'SUBIDO', // Volver a SUBIDO para re-validación
                fecha_subida: new Date().toISOString(),
                subido_por_rol: subidoPorRol,
                subido_por_usuario: subidoPorUsuario,
                validado_por_rol: null,
                fecha_validacion: null
            })
            .eq('id', inventarioItem.id);
    }

    // 7. Registrar evento
    await registerEvent({
        contratoId,
        tipo: 'DOCUMENTO_SUBIDO',
        payload: {
            descripcion: `Documento reemplazado: ${originalName} (v${nuevoNumeroVersion})`,
            archivo_id: nuevoArchivoId,
            archivo_anterior_id: archivoIdOriginal,
            version: nuevoNumeroVersion,
            hash_sha256: hashSha256,
            sello_qtsp_id: selloQtspId
        }
    });

    return {
        archivoId: nuevoArchivoId,
        hashSha256,
        version: nuevoNumeroVersion,
        selloQtspId,
        inventarioActualizado: !!inventarioItem
    };
}

/**
 * Obtiene historial de versiones de un documento
 */
export async function getDocumentHistory(archivoId: string): Promise<DocumentVersion[]> {
    // Primero obtener el ID original
    const { data: archivo } = await supabase
        .from('archivos')
        .select('version_original_id')
        .eq('id', archivoId)
        .single();

    const originalId = archivo?.version_original_id || archivoId;

    // Obtener todas las versiones
    const { data: versiones, error } = await supabase
        .from('archivos')
        .select('id, version, hash_sha256, nombre_original, fecha_hora_subida, es_vigente, reemplazado_por')
        .or(`id.eq.${originalId},version_original_id.eq.${originalId}`)
        .order('version', { ascending: false });

    if (error || !versiones) {
        return [];
    }

    return versiones.map(v => ({
        id: v.id,
        version: v.version || 1,
        hashSha256: v.hash_sha256 || '',
        nombreOriginal: v.nombre_original,
        fechaSubida: v.fecha_hora_subida,
        esVigente: v.es_vigente ?? true,
        reemplazadoPor: v.reemplazado_por
    }));
}

/**
 * Valida un documento del inventario
 */
export async function validateDocument(
    inventarioItemId: string,
    validadorRol: string,
    validadorUsuario?: string
): Promise<void> {
    const { data: item, error: fetchError } = await supabase
        .from('inventario_expediente')
        .select('*, archivos(*)')
        .eq('id', inventarioItemId)
        .single();

    if (fetchError || !item) {
        throw new Error('Item de inventario no encontrado');
    }

    // Actualizar estado
    const { error: updateError } = await supabase
        .from('inventario_expediente')
        .update({
            estado: 'VALIDADO',
            validado_por_rol: validadorRol,
            validado_por_usuario: validadorUsuario,
            fecha_validacion: new Date().toISOString(),
            motivo_rechazo: null
        })
        .eq('id', inventarioItemId);

    if (updateError) {
        throw new Error(`Error validando documento: ${updateError.message}`);
    }

    // Registrar evento con sello QTSP
    const hashEvento = createHash('sha256')
        .update(JSON.stringify({
            tipo: 'DOCUMENTO_VALIDADO',
            inventarioItemId,
            archivoId: item.archivo_id,
            validadorRol,
            timestamp: new Date().toISOString()
        }))
        .digest('hex');

    try {
        await requestQualifiedTimestamp(hashEvento);
    } catch (e) {
        console.error('Error sellando validación:', e);
    }

    await registerEvent({
        contratoId: item.contrato_id,
        tipo: 'DOCUMENTO_VALIDADO',
        payload: {
            descripcion: `Documento validado: ${item.titulo}`,
            inventario_item_id: inventarioItemId,
            archivo_id: item.archivo_id,
            validador_rol: validadorRol
        }
    });
}

/**
 * Rechaza un documento del inventario
 */
export async function rejectDocument(
    inventarioItemId: string,
    motivo: string,
    validadorRol: string,
    validadorUsuario?: string
): Promise<void> {
    const { data: item, error: fetchError } = await supabase
        .from('inventario_expediente')
        .select('contrato_id, titulo, archivo_id')
        .eq('id', inventarioItemId)
        .single();

    if (fetchError || !item) {
        throw new Error('Item de inventario no encontrado');
    }

    const { error: updateError } = await supabase
        .from('inventario_expediente')
        .update({
            estado: 'RECHAZADO',
            validado_por_rol: validadorRol,
            validado_por_usuario: validadorUsuario,
            fecha_validacion: new Date().toISOString(),
            motivo_rechazo: motivo
        })
        .eq('id', inventarioItemId);

    if (updateError) {
        throw new Error(`Error rechazando documento: ${updateError.message}`);
    }

    // Sellar rechazo
    const hashEvento = createHash('sha256')
        .update(JSON.stringify({
            tipo: 'DOCUMENTO_RECHAZADO',
            inventarioItemId,
            motivo,
            validadorRol,
            timestamp: new Date().toISOString()
        }))
        .digest('hex');

    try {
        await requestQualifiedTimestamp(hashEvento);
    } catch (e) {
        console.error('Error sellando rechazo:', e);
    }

    await registerEvent({
        contratoId: item.contrato_id,
        tipo: 'DOCUMENTO_RECHAZADO',
        payload: {
            descripcion: `Documento rechazado: ${item.titulo}`,
            inventario_item_id: inventarioItemId,
            archivo_id: item.archivo_id,
            motivo_rechazo: motivo,
            validador_rol: validadorRol
        }
    });
}

/**
 * Crea un ítem de inventario ad-hoc
 */
export async function createAdhocInventoryItem(params: {
    contratoId: string;
    tipo: string;
    titulo: string;
    descripcion?: string;
    grupo: string;
    subtipo?: string;
    responsableRol: string;
    metadatosExtra?: Record<string, any>;
    esCritico?: boolean;
    creadoPorRol: string;
    creadoPorUsuario?: string;
}): Promise<string> {
    const itemId = crypto.randomUUID();

    const { error } = await supabase
        .from('inventario_expediente')
        .insert({
            id: itemId,
            contrato_id: params.contratoId,
            tipo: params.tipo,
            titulo: params.titulo,
            descripcion: params.descripcion,
            grupo: params.grupo,
            subtipo: params.subtipo,
            responsable_rol: params.responsableRol,
            metadatos_extra: params.metadatosExtra || {},
            obligatorio: false, // Ad-hoc items no son obligatorios por defecto
            es_critico: params.esCritico || false,
            estado: 'PENDIENTE',
            creado_por_rol: params.creadoPorRol,
            creado_por_usuario: params.creadoPorUsuario
        });

    if (error) {
        throw new Error(`Error creando ítem ad-hoc: ${error.message}`);
    }

    // Registrar evento
    await registerEvent({
        contratoId: params.contratoId,
        tipo: 'INVENTARIO_ITEM_CREADO',
        payload: {
            descripcion: `Requisito documental creado: ${params.titulo}`,
            inventario_item_id: itemId,
            tipo: params.tipo,
            grupo: params.grupo,
            responsable_rol: params.responsableRol
        }
    });

    return itemId;
}
