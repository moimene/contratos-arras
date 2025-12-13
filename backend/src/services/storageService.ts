/**
 * Storage Service - Supabase Storage
 * 
 * Almacenamiento de documentos en Supabase Storage para persistencia.
 * Organiza archivos por contrato: {contratoId}/{tipo}/{archivo}
 */

import { supabase } from '../config/supabase.js';
import crypto from 'crypto';

// Nombre del bucket en Supabase Storage
const BUCKET_NAME = 'documentos';

/**
 * Inicializa el bucket de documentos si no existe
 * Se ejecuta al importar el módulo
 */
async function initializeBucket(): Promise<void> {
    try {
        // Verificar si el bucket existe
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();

        if (listError) {
            console.warn('⚠ No se pudo verificar buckets:', listError.message);
            return;
        }

        const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);

        if (!bucketExists) {
            // Crear bucket (necesita permisos de service_role en producción)
            const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
                public: false,
                fileSizeLimit: 52428800, // 50MB máximo por archivo
                allowedMimeTypes: [
                    'application/pdf',
                    'image/jpeg',
                    'image/png',
                    'image/webp',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                ]
            });

            if (createError) {
                console.warn('⚠ No se pudo crear bucket (crear manualmente en Supabase Dashboard):', createError.message);
            } else {
                console.log('✓ Bucket "documentos" creado en Supabase Storage');
            }
        } else {
            console.log('✓ Bucket "documentos" ya existe en Supabase Storage');
        }
    } catch (err) {
        console.warn('⚠ Error inicializando storage:', err);
    }
}

// Inicializar bucket al cargar el módulo
initializeBucket();

/**
 * Calcula hash SHA-256 de un buffer
 */
export function calcularHashArchivo(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Guarda un archivo en Supabase Storage
 * 
 * @param buffer - Buffer del archivo
 * @param filename - Nombre original del archivo
 * @param contratoId - ID del contrato asociado
 * @param tipo - Tipo de documento (ej: NOTA_SIMPLE, DNI_COMPRADOR)
 * @returns Objeto con path, url pública y hash
 */
export async function guardarArchivo(
    buffer: Buffer,
    filename: string,
    contratoId: string,
    tipo: string = 'documento'
): Promise<{
    path: string;
    publicUrl: string;
    hash: string;
    size: number;
}> {
    // Generar nombre único preservando extensión
    const ext = filename.substring(filename.lastIndexOf('.'));
    const uniqueId = crypto.randomUUID();
    const safeName = `${uniqueId}${ext}`;

    // Path organizado: contratoId/tipo/archivo
    const storagePath = `${contratoId}/${tipo}/${safeName}`;

    // Calcular hash para integridad
    const hash = calcularHashArchivo(buffer);

    // Subir a Supabase Storage
    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, buffer, {
            contentType: getMimeType(ext),
            cacheControl: '3600',
            upsert: false
        });

    if (error) {
        console.error('Error subiendo a Supabase Storage:', error);
        throw new Error(`Error al guardar archivo: ${error.message}`);
    }

    // Obtener URL signada (válida por 1 año)
    const { data: signedData } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(storagePath, 31536000); // 1 año en segundos

    console.log(`✓ Archivo guardado en Supabase Storage: ${storagePath}`);

    return {
        path: storagePath,
        publicUrl: signedData?.signedUrl || '',
        hash,
        size: buffer.length
    };
}

/**
 * Lee un archivo de Supabase Storage
 * 
 * @param storagePath - Path del archivo en storage
 * @returns Buffer del archivo
 */
export async function leerArchivo(storagePath: string): Promise<Buffer> {
    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .download(storagePath);

    if (error || !data) {
        throw new Error(`Error al leer archivo: ${error?.message || 'No encontrado'}`);
    }

    // Convertir Blob a Buffer
    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

/**
 * Elimina un archivo de Supabase Storage
 * 
 * @param storagePath - Path del archivo en storage
 */
export async function eliminarArchivo(storagePath: string): Promise<void> {
    const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([storagePath]);

    if (error) {
        throw new Error(`Error al eliminar archivo: ${error.message}`);
    }

    console.log(`✓ Archivo eliminado de Supabase Storage: ${storagePath}`);
}

/**
 * Obtiene URL signada para descarga directa
 * 
 * @param storagePath - Path del archivo
 * @param expiresIn - Segundos de validez (default: 1 hora)
 * @returns URL signada para descarga
 */
export async function obtenerUrlDescarga(storagePath: string, expiresIn: number = 3600): Promise<string> {
    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(storagePath, expiresIn);

    if (error || !data?.signedUrl) {
        throw new Error(`Error obteniendo URL: ${error?.message || 'No disponible'}`);
    }

    return data.signedUrl;
}

/**
 * Lista archivos de un contrato
 * 
 * @param contratoId - ID del contrato
 * @returns Lista de archivos
 */
export async function listarArchivosContrato(contratoId: string): Promise<any[]> {
    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list(contratoId, {
            limit: 100,
            sortBy: { column: 'created_at', order: 'desc' }
        });

    if (error) {
        console.warn('Error listando archivos:', error);
        return [];
    }

    return data || [];
}

/**
 * Determina MIME type por extensión
 */
function getMimeType(ext: string): string {
    const mimeTypes: Record<string, string> = {
        '.pdf': 'application/pdf',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
}

console.log('✓ Supabase Storage service initialized');
