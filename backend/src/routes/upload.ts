/**
 * Upload API Routes
 * 
 * Gestión de subida de archivos para documentos del inventario.
 * Almacenamiento en Supabase Storage con registro en base de datos.
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { supabase } from '../config/supabase.js';
import { registerEvent } from '../services/eventService.js';
import { guardarArchivo, leerArchivo, eliminarArchivo, obtenerUrlDescarga, calcularHashArchivo } from '../services/storageService.js';

const router = Router();

// Configurar multer para almacenamiento en memoria (luego subimos a Supabase)
const storage = multer.memoryStorage();

// Filtrar tipos de archivo permitidos
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB máximo (límite Supabase free tier)
    }
});

/**
 * POST /api/upload
 * Sube un archivo a Supabase Storage y lo registra en la base de datos
 * 
 * Body (multipart/form-data):
 * - file: archivo a subir
 * - contrato_id: ID del contrato
 * - inventario_item_id: ID del ítem de inventario (opcional)
 * - tipo: tipo de documento (ej: DNI_VENDEDOR, NOTA_SIMPLE)
 */
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No se proporcionó archivo'
            });
        }

        const { contrato_id, inventario_item_id, tipo, subido_por_rol, subido_por_usuario, origen } = req.body;

        if (!contrato_id) {
            return res.status(400).json({
                success: false,
                error: 'contrato_id es requerido'
            });
        }

        // 1. Subir archivo a Supabase Storage
        const storageResult = await guardarArchivo(
            req.file.buffer,
            req.file.originalname,
            contrato_id,
            tipo || 'documento'
        );

        // 2. Registrar archivo en base de datos
        const archivoId = randomUUID();
        const archivoData = {
            id: archivoId,
            contrato_id,
            nombre_original: req.file.originalname,
            nombre_almacenado: storageResult.path,
            tipo_mime: req.file.mimetype,
            tamano_bytes: storageResult.size,
            hash_sha256: storageResult.hash,
            ruta_storage: storageResult.path,
            url_publica: storageResult.publicUrl,
            tipo_documento: tipo || 'OTRO',
            subido_por_rol: subido_por_rol || 'USUARIO',
            subido_por_usuario: subido_por_usuario || null,
            origen: origen || 'IN_PLATFORM'
        };

        const { data: archivo, error: archivoError } = await supabase
            .from('archivos')
            .insert(archivoData)
            .select()
            .single();

        if (archivoError) {
            console.error('Error guardando archivo en DB:', archivoError);
            // Intentar eliminar archivo de storage si falla DB
            try {
                await eliminarArchivo(storageResult.path);
            } catch (cleanupError) {
                console.warn('Error limpiando archivo:', cleanupError);
            }
            throw new Error('Error registrando archivo en base de datos');
        }

        // 3. Si se proporcionó inventario_item_id, actualizar el ítem
        if (inventario_item_id) {
            const { error: updateError } = await supabase
                .from('inventario_expediente')
                .update({
                    estado: 'SUBIDO',
                    archivo_id: archivo.id,
                    fecha_subida: new Date().toISOString(),
                    subido_por_rol: subido_por_rol || 'USUARIO',
                    subido_por_usuario: subido_por_usuario || null
                })
                .eq('id', inventario_item_id);

            if (updateError) {
                console.error('Error actualizando inventario:', updateError);
            }

            // 4. Registrar evento con TST
            await registerEvent({
                contratoId: contrato_id,
                tipo: 'DOCUMENTO_SUBIDO',
                payload: {
                    descripcion: `Documento subido: ${req.file.originalname}`,
                    archivo_id: archivo.id,
                    inventario_item_id,
                    nombre_original: req.file.originalname,
                    tipo_documento: tipo,
                    tamano_bytes: storageResult.size,
                    hash_sha256: storageResult.hash,
                    storage_path: storageResult.path
                }
            });
        }

        res.status(201).json({
            success: true,
            data: {
                archivo_id: archivo.id,
                nombre_original: req.file.originalname,
                storage_path: storageResult.path,
                hash_sha256: storageResult.hash,
                tipo_mime: req.file.mimetype,
                tamano_bytes: storageResult.size,
                url: storageResult.publicUrl
            }
        });
    } catch (error: any) {
        console.error('Error en upload:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/upload/:id
 * Descarga un archivo por su ID y registra evento de acceso con TST
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const accedido_por = req.query.rol as string || 'USUARIO';

        // 1. Obtener info del archivo de la DB
        const { data: archivo, error } = await supabase
            .from('archivos')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !archivo) {
            return res.status(404).json({
                success: false,
                error: 'Archivo no encontrado'
            });
        }

        // 2. Registrar evento de acceso con TST
        try {
            await registerEvent({
                contratoId: archivo.contrato_id,
                tipo: 'DOCUMENTO_ACCEDIDO',
                payload: {
                    descripcion: `Documento accedido: ${archivo.nombre_original}`,
                    archivo_id: id,
                    nombre_original: archivo.nombre_original,
                    tipo_documento: archivo.tipo_documento,
                    accedido_por_rol: accedido_por
                }
            });
        } catch (eventError) {
            console.warn('Error registrando evento de acceso:', eventError);
        }

        // 3. Obtener URL de descarga signada
        const downloadUrl = await obtenerUrlDescarga(archivo.ruta_storage || archivo.nombre_almacenado, 3600);

        // 4. Redirigir a la URL signada de Supabase
        res.redirect(downloadUrl);
    } catch (error: any) {
        console.error('Error descargando archivo:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/upload/:id/url
 * Obtiene URL signada para descarga directa (sin redirigir)
 */
router.get('/:id/url', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const expiresIn = parseInt(req.query.expires as string) || 3600;

        const { data: archivo, error } = await supabase
            .from('archivos')
            .select('ruta_storage, nombre_almacenado')
            .eq('id', id)
            .single();

        if (error || !archivo) {
            return res.status(404).json({
                success: false,
                error: 'Archivo no encontrado'
            });
        }

        const url = await obtenerUrlDescarga(archivo.ruta_storage || archivo.nombre_almacenado, expiresIn);

        res.json({
            success: true,
            url,
            expires_in: expiresIn
        });
    } catch (error: any) {
        console.error('Error obteniendo URL:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * DELETE /api/upload/:id
 * Elimina un archivo de Supabase Storage y la base de datos, registrando evento con TST
 */
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const eliminado_por = req.query.rol as string || 'USUARIO';

        // 1. Recuperar información del archivo
        const { data: archivo, error: fetchError } = await supabase
            .from('archivos')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !archivo) {
            return res.status(404).json({
                success: false,
                error: 'Archivo no encontrado'
            });
        }

        // 2. Eliminar archivo de Supabase Storage
        try {
            await eliminarArchivo(archivo.ruta_storage || archivo.nombre_almacenado);
            console.log(`✓ Archivo eliminado de Supabase Storage: ${archivo.ruta_storage}`);
        } catch (storageError: any) {
            console.warn('Error eliminando de storage:', storageError.message);
            // Continuar aunque falle el storage
        }

        // 3. Registrar evento de eliminación con TST
        try {
            await registerEvent({
                contratoId: archivo.contrato_id,
                tipo: 'DOCUMENTO_ELIMINADO',
                payload: {
                    descripcion: `Documento eliminado: ${archivo.nombre_original}`,
                    archivo_id: id,
                    nombre_original: archivo.nombre_original,
                    tipo_documento: archivo.tipo_documento,
                    tamano_bytes: archivo.tamano_bytes,
                    hash_sha256: archivo.hash_sha256,
                    eliminado_por_rol: eliminado_por
                }
            });
        } catch (eventError) {
            console.warn('Error registrando evento de eliminación:', eventError);
        }

        // 4. Eliminar de base de datos
        const { error: deleteError } = await supabase
            .from('archivos')
            .delete()
            .eq('id', id);

        if (deleteError) throw deleteError;

        // 5. Si había inventario asociado, actualizar estado a PENDIENTE
        if (archivo.inventario_item_id) {
            await supabase
                .from('inventario_expediente')
                .update({
                    estado: 'PENDIENTE',
                    archivo_id: null,
                    fecha_subida: null
                })
                .eq('archivo_id', id);
        }

        res.json({
            success: true,
            message: 'Archivo eliminado correctamente',
            archivo_id: id
        });
    } catch (error: any) {
        console.error('Error eliminando archivo:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
