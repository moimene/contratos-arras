/**
 * Upload API Routes
 * 
 * Gestión de subida de archivos para documentos del inventario.
 * Almacenamiento local en /files con registro en base de datos.
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import { supabase } from '../config/supabase.js';
import { registerEvent } from '../services/eventService.js';

const router = Router();

// Configurar directorio de archivos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, '../../files');

// Configurar multer para almacenamiento local
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueId = randomUUID();
        const ext = path.extname(file.originalname);
        const safeName = `${uniqueId}${ext}`;
        cb(null, safeName);
    }
});

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
        fileSize: 10 * 1024 * 1024 // 10MB máximo
    }
});

/**
 * POST /api/upload
 * Sube un archivo y lo registra en la base de datos
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

        const { contrato_id, inventario_item_id, tipo, subido_por_rol, subido_por_usuario } = req.body;

        if (!contrato_id) {
            return res.status(400).json({
                success: false,
                error: 'contrato_id es requerido'
            });
        }

        // Registrar archivo en base de datos
        const archivoData = {
            id: randomUUID(),
            contrato_id,
            nombre_original: req.file.originalname,
            nombre_almacenado: req.file.filename,
            tipo_mime: req.file.mimetype,
            tamano_bytes: req.file.size,
            ruta_local: req.file.path,
            tipo_documento: tipo || 'OTRO',
            subido_por_rol: subido_por_rol || 'USUARIO',
            subido_por_usuario: subido_por_usuario || null
        };

        const { data: archivo, error: archivoError } = await supabase
            .from('archivos')
            .insert(archivoData)
            .select()
            .single();

        if (archivoError) {
            console.error('Error guardando archivo en DB:', archivoError);
            // Si falla la DB, el archivo ya está subido - podríamos eliminarlo
            // pero por ahora continuamos con una respuesta parcial
        }

        // Si se proporcionó inventario_item_id, actualizar el ítem
        if (inventario_item_id) {
            const { error: updateError } = await supabase
                .from('inventario_expediente')
                .update({
                    estado: 'SUBIDO',
                    archivo_id: archivo?.id || archivoData.id,
                    fecha_subida: new Date().toISOString(),
                    subido_por_rol: subido_por_rol || 'USUARIO',
                    subido_por_usuario: subido_por_usuario || null
                })
                .eq('id', inventario_item_id);

            if (updateError) {
                console.error('Error actualizando inventario:', updateError);
            }

            // Registrar evento
            await registerEvent({
                contratoId: contrato_id,
                tipo: 'DOCUMENTO_SUBIDO',
                payload: {
                    descripcion: `Documento subido: ${req.file.originalname}`,
                    archivo_id: archivo?.id || archivoData.id,
                    inventario_item_id,
                    nombre_original: req.file.originalname,
                    tipo_documento: tipo,
                    tamano_bytes: req.file.size
                }
            });
        }

        res.status(201).json({
            success: true,
            data: {
                archivo_id: archivo?.id || archivoData.id,
                nombre_original: req.file.originalname,
                nombre_almacenado: req.file.filename,
                tipo_mime: req.file.mimetype,
                tamano_bytes: req.file.size
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

        // Registrar evento de acceso con TST
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
            // Continuar con la descarga aunque falle el evento
        }

        // Enviar archivo
        res.download(archivo.ruta_local, archivo.nombre_original);
    } catch (error: any) {
        console.error('Error descargando archivo:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * DELETE /api/upload/:id
 * Elimina un archivo del disco y la base de datos, registrando evento con TST
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

        // 2. Eliminar archivo físico del disco
        const fs = await import('fs/promises');
        try {
            await fs.unlink(archivo.ruta_local);
            console.log(`✓ Archivo físico eliminado: ${archivo.ruta_local}`);
        } catch (fsError: any) {
            if (fsError.code !== 'ENOENT') {
                console.warn('Error eliminando archivo físico:', fsError);
            }
            // Continuar aunque el archivo no exista en disco
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
