/**
 * Document Manager API Routes
 * 
 * Endpoints para gestión completa de documentos del expediente.
 * Incluye: listado, filtrado, historial, validación, reemplazo, y creación ad-hoc.
 */

import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { supabase } from '../config/supabase.js';
import {
    registerDocument,
    replaceDocument,
    getDocumentHistory,
    validateDocument,
    rejectDocument,
    createAdhocInventoryItem,
    calculateFileHash
} from '../services/documentService.js';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import { requirePermission } from '../middleware/authorization.js';

const router = Router();

// Configurar directorio de archivos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, '../../files');

// Configurar multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const uniqueId = randomUUID();
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueId}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
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
    }
});

// ============================================
// LISTADO Y FILTRADO
// ============================================

/**
 * GET /api/contratos/:contratoId/documentos
 * Lista todos los documentos del expediente con información de inventario
 */
router.get('/contratos/:contratoId/documentos', async (req: Request, res: Response) => {
    try {
        const { contratoId } = req.params;

        // Obtener archivos del contrato (sin filtrar por es_vigente ya que puede no existir en todos)
        const { data: archivos, error: archivosError } = await supabase
            .from('archivos')
            .select('*')
            .eq('contrato_id', contratoId);

        if (archivosError) throw archivosError;

        // Obtener items de inventario
        const { data: inventario, error: inventarioError } = await supabase
            .from('inventario_expediente')
            .select('*')
            .eq('contrato_id', contratoId)
            .order('grupo', { ascending: true });

        if (inventarioError) throw inventarioError;

        // Combinar: cada ítem de inventario con su archivo asociado
        // Debug: Log what we're working with
        console.log(`[DEBUG] Contract ${contratoId}: ${archivos?.length || 0} archivos, ${inventario?.length || 0} inventario items`);
        if (archivos?.length) {
            console.log('[DEBUG] Archivo IDs:', archivos.map(a => a.id).join(', '));
        }
        const itemsWithArchivoId = inventario?.filter(i => i.archivo_id) || [];
        if (itemsWithArchivoId.length) {
            console.log('[DEBUG] Inventario archivo_ids:', itemsWithArchivoId.map(i => `${i.titulo}: ${i.archivo_id}`).join(', '));
        }

        const documentos = inventario?.map(item => {
            const archivo = archivos?.find(a => a.id === item.archivo_id);
            return {
                inventarioId: item.id,
                tipo: item.tipo,
                titulo: item.titulo,
                descripcion: item.descripcion,
                grupo: item.grupo,
                subtipo: item.subtipo,
                responsableRol: item.responsable_rol,
                estado: item.estado,
                obligatorio: item.obligatorio,
                esCritico: item.es_critico,
                archivo: archivo ? {
                    id: archivo.id,
                    nombreOriginal: archivo.nombre_original,
                    tipoMime: archivo.tipo_mime,
                    tamanoBytes: archivo.tamano,
                    hashSha256: archivo.hash_sha256,
                    version: archivo.version,
                    fechaSubida: archivo.fecha_hora_subida || archivo.created_at
                } : null,
                subidoPor: {
                    rol: item.subido_por_rol,
                    fecha: item.fecha_subida
                },
                validadoPor: item.estado === 'VALIDADO' || item.estado === 'RECHAZADO' ? {
                    rol: item.validado_por_rol,
                    fecha: item.fecha_validacion,
                    motivoRechazo: item.motivo_rechazo
                } : null
            };
        }) || [];

        // Añadir archivos sin inventario asociado
        const archivosIds = inventario?.map(i => i.archivo_id).filter(Boolean) || [];
        const archivosSinInventario = archivos?.filter(a => !archivosIds.includes(a.id)) || [];

        archivosSinInventario.forEach(archivo => {
            documentos.push({
                inventarioId: null,
                tipo: archivo.tipo_documento,
                titulo: archivo.titulo || archivo.nombre_original,
                descripcion: archivo.notas,
                grupo: archivo.categoria || 'GENERAL',
                subtipo: null,
                responsableRol: archivo.subido_por_rol,
                estado: 'SUBIDO',
                obligatorio: false,
                esCritico: false,
                archivo: {
                    id: archivo.id,
                    nombreOriginal: archivo.nombre_original,
                    tipoMime: archivo.tipo_mime,
                    tamanoBytes: archivo.tamano,
                    hashSha256: archivo.hash_sha256,
                    version: archivo.version,
                    fechaSubida: archivo.fecha_hora_subida || archivo.created_at
                },
                subidoPor: {
                    rol: archivo.subido_por_rol,
                    fecha: archivo.fecha_hora_subida || archivo.created_at
                },
                validadoPor: null
            });
        });

        res.json({
            success: true,
            data: documentos,
            resumen: {
                total: documentos.length,
                pendientes: documentos.filter(d => d.estado === 'PENDIENTE').length,
                subidos: documentos.filter(d => d.estado === 'SUBIDO').length,
                validados: documentos.filter(d => d.estado === 'VALIDADO').length,
                rechazados: documentos.filter(d => d.estado === 'RECHAZADO').length
            }
        });
    } catch (error: any) {
        console.error('Error listando documentos:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/contratos/:contratoId/documentos/filtrar
 * Filtra documentos por grupo, tipo, estado, rol
 */
router.get('/contratos/:contratoId/documentos/filtrar', async (req: Request, res: Response) => {
    try {
        const { contratoId } = req.params;
        const { grupo, tipo, estado, responsableRol } = req.query;

        let query = supabase
            .from('inventario_expediente')
            .select('*, archivos(*)')
            .eq('contrato_id', contratoId);

        if (grupo) query = query.eq('grupo', grupo);
        if (tipo) query = query.eq('tipo', tipo);
        if (estado) query = query.eq('estado', estado);
        if (responsableRol) query = query.eq('responsable_rol', responsableRol);

        const { data, error } = await query.order('grupo', { ascending: true });

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error: any) {
        console.error('Error filtrando documentos:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// DETALLE Y VERSIONES
// ============================================

/**
 * GET /api/archivos/:id
 * Detalle completo de un archivo con metadatos
 */
router.get('/archivos/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const { data: archivo, error } = await supabase
            .from('archivos')
            .select('*, sellos_tiempo(*)')
            .eq('id', id)
            .single();

        if (error || !archivo) {
            return res.status(404).json({ success: false, error: 'Archivo no encontrado' });
        }

        // Obtener ítem de inventario asociado
        const { data: inventarioItem } = await supabase
            .from('inventario_expediente')
            .select('*')
            .eq('archivo_id', id)
            .single();

        res.json({
            success: true,
            data: {
                ...archivo,
                inventario: inventarioItem || null
            }
        });
    } catch (error: any) {
        console.error('Error obteniendo archivo:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/archivos/:id/versiones
 * Historial de versiones de un documento
 */
router.get('/archivos/:id/versiones', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const versiones = await getDocumentHistory(id);
        res.json({ success: true, data: versiones });
    } catch (error: any) {
        console.error('Error obteniendo versiones:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/archivos/:id/descargar
 * Descarga segura de archivo usando Supabase Storage
 */
router.get('/archivos/:id/descargar', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        console.log(`[descargar] Request for archivo id=${id}`);

        const { data: archivo, error } = await supabase
            .from('archivos')
            .select('ruta, nombre_almacenado, nombre_original, tipo_mime, contrato_id')
            .eq('id', id)
            .single();

        if (error || !archivo) {
            console.log(`[descargar] DB query failed: error=${error?.message}, archivo=${JSON.stringify(archivo)}`);
            return res.status(404).json({ success: false, error: 'Archivo no encontrado' });
        }

        // Usar Supabase Storage para obtener URL firmada
        let storagePath = archivo.nombre_almacenado || archivo.ruta;
        console.log(`[descargar] Original storagePath=${storagePath}`);

        if (!storagePath) {
            console.log(`[descargar] No storage path found`);
            return res.status(404).json({ success: false, error: 'Ruta de archivo no encontrada' });
        }

        // Try to get signed URL - first with original path, then with prefix stripping as fallback
        // This handles both old seeding (files at exp##/...) and new seeding (files at documentos/exp##/...)
        const bucketPrefixes = ['documentos/', 'contratos-pdf/', 'justificantes/'];

        // Helper to strip prefix
        const stripPrefix = (path: string): string => {
            for (const prefix of bucketPrefixes) {
                if (path.startsWith(prefix)) {
                    return path.substring(prefix.length);
                }
            }
            return path;
        };

        // Try original path first
        console.log(`[descargar] Trying original storagePath=${storagePath}`);
        let { data: signedData, error: signError } = await supabase.storage
            .from('documentos')
            .createSignedUrl(storagePath, 3600);

        // If failed and path has prefix, try stripped version as fallback
        if ((signError || !signedData?.signedUrl) && bucketPrefixes.some(p => storagePath.startsWith(p))) {
            const strippedPath = stripPrefix(storagePath);
            console.log(`[descargar] Original failed, trying stripped storagePath=${strippedPath}`);
            const fallback = await supabase.storage
                .from('documentos')
                .createSignedUrl(strippedPath, 3600);
            signedData = fallback.data;
            signError = fallback.error;
            if (!signError && signedData?.signedUrl) {
                storagePath = strippedPath; // Update for logging
            }
        }

        if (signError || !signedData?.signedUrl) {
            console.error('[descargar] Error generando URL firmada:', signError);
            return res.status(500).json({
                success: false,
                error: 'Error al generar URL de descarga',
                details: signError?.message || 'No signedUrl returned',
                path: storagePath
            });
        }

        console.log(`[descargar] Success! Redirecting to signed URL`);

        // Registrar evento de acceso
        try {
            const { registerEvent } = await import('../services/eventService.js');
            await registerEvent({
                contratoId: archivo.contrato_id,
                tipo: 'DOCUMENTO_ACCEDIDO',
                payload: {
                    descripcion: `Documento descargado: ${archivo.nombre_original}`,
                    archivo_id: id,
                    nombre_original: archivo.nombre_original
                }
            });
        } catch (eventError) {
            console.warn('Error registrando evento de acceso:', eventError);
        }

        // Redirigir a la URL firmada
        res.redirect(signedData.signedUrl);
    } catch (error: any) {
        console.error('Error descargando archivo:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});


/**
 * GET /api/archivos/:id/preview
 * Preview de archivo usando Supabase Storage
 */
router.get('/archivos/:id/preview', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const { data: archivo, error } = await supabase
            .from('archivos')
            .select('ruta, nombre_almacenado, nombre_original, tipo_mime')
            .eq('id', id)
            .single();

        if (error || !archivo) {
            return res.status(404).json({ success: false, error: 'Archivo no encontrado' });
        }

        // Solo permitir preview de PDFs e imágenes
        const previewableTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
        if (!previewableTypes.includes(archivo.tipo_mime)) {
            return res.status(400).json({
                success: false,
                error: 'Este tipo de archivo no permite preview',
                downloadOnly: true
            });
        }

        // Usar Supabase Storage para obtener URL firmada
        let storagePath = archivo.nombre_almacenado || archivo.ruta;

        if (!storagePath) {
            return res.status(404).json({ success: false, error: 'Ruta de archivo no encontrada' });
        }

        // Try to get signed URL - first with original path, then with prefix stripping as fallback
        const bucketPrefixes = ['documentos/', 'contratos-pdf/', 'justificantes/'];

        // Helper to strip prefix
        const stripPrefix = (path: string): string => {
            for (const prefix of bucketPrefixes) {
                if (path.startsWith(prefix)) {
                    return path.substring(prefix.length);
                }
            }
            return path;
        };

        // Try original path first
        let { data: signedData, error: signError } = await supabase.storage
            .from('documentos')
            .createSignedUrl(storagePath, 3600);

        // If failed and path has prefix, try stripped version as fallback
        if ((signError || !signedData?.signedUrl) && bucketPrefixes.some(p => storagePath.startsWith(p))) {
            const strippedPath = stripPrefix(storagePath);
            const fallback = await supabase.storage
                .from('documentos')
                .createSignedUrl(strippedPath, 3600);
            signedData = fallback.data;
            signError = fallback.error;
        }

        if (signError || !signedData?.signedUrl) {
            console.error('Error generando URL firmada:', signError);
            return res.status(500).json({ success: false, error: 'Error al generar URL de preview' });
        }

        // Redirigir a la URL firmada para preview
        res.redirect(signedData.signedUrl);
    } catch (error: any) {
        console.error('Error en preview:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// VALIDACIÓN Y RECHAZO
// ============================================

/**
 * POST /api/inventario/:id/validar
 * Valida un documento del inventario
 * Requiere: canValidateDocs (ADMIN, NOTARIO)
 */
router.post('/inventario/:id/validar', requirePermission('canValidateDocs'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { validadorRol, validadorUsuario } = req.body;

        if (!validadorRol) {
            return res.status(400).json({ success: false, error: 'validadorRol es requerido' });
        }

        await validateDocument(id, validadorRol, validadorUsuario);

        res.json({ success: true, message: 'Documento validado correctamente' });
    } catch (error: any) {
        console.error('Error validando documento:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/inventario/:id/rechazar
 * Rechaza un documento del inventario
 * Requiere: canRejectDocs (ADMIN, NOTARIO)
 */
router.post('/inventario/:id/rechazar', requirePermission('canRejectDocs'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { motivo, validadorRol, validadorUsuario } = req.body;

        if (!motivo) {
            return res.status(400).json({ success: false, error: 'motivo es requerido' });
        }
        if (!validadorRol) {
            return res.status(400).json({ success: false, error: 'validadorRol es requerido' });
        }

        await rejectDocument(id, motivo, validadorRol, validadorUsuario);

        res.json({ success: true, message: 'Documento rechazado correctamente' });
    } catch (error: any) {
        console.error('Error rechazando documento:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// SUBIDA Y REEMPLAZO
// ============================================

/**
 * POST /api/archivos/:id/reemplazar
 * Sube una nueva versión de un archivo existente
 */
router.post('/archivos/:id/reemplazar', upload.single('file'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { subidoPorRol, subidoPorUsuario } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No se proporcionó archivo' });
        }

        // Obtener archivo original para contratoId
        const { data: archivoOriginal, error: fetchError } = await supabase
            .from('archivos')
            .select('contrato_id')
            .eq('id', id)
            .single();

        if (fetchError || !archivoOriginal) {
            return res.status(404).json({ success: false, error: 'Archivo original no encontrado' });
        }

        const result = await replaceDocument({
            archivoIdOriginal: id,
            contratoId: archivoOriginal.contrato_id,
            filePath: req.file.path,
            fileName: req.file.filename,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            sizeBytes: req.file.size,
            subidoPorRol: subidoPorRol || 'USUARIO',
            subidoPorUsuario
        });

        res.status(201).json({
            success: true,
            data: result
        });
    } catch (error: any) {
        console.error('Error reemplazando archivo:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// ITEMS AD-HOC
// ============================================

/**
 * POST /api/contratos/:contratoId/inventario/adhoc
 * Crea un requisito documental ad-hoc
 * Requiere: canUploadDocs (ADMIN, VENDEDOR, COMPRADOR, TERCERO)
 */
router.post('/contratos/:contratoId/inventario/adhoc', requirePermission('canUploadDocs'), async (req: Request, res: Response) => {
    try {
        const { contratoId } = req.params;
        const {
            tipo,
            titulo,
            descripcion,
            grupo,
            subtipo,
            responsableRol,
            metadatosExtra,
            esCritico,
            creadoPorRol,
            creadoPorUsuario
        } = req.body;

        if (!titulo || !grupo || !responsableRol || !creadoPorRol) {
            return res.status(400).json({
                success: false,
                error: 'titulo, grupo, responsableRol y creadoPorRol son requeridos'
            });
        }

        const itemId = await createAdhocInventoryItem({
            contratoId,
            tipo: tipo || 'OTRO',
            titulo,
            descripcion,
            grupo,
            subtipo,
            responsableRol,
            metadatosExtra,
            esCritico,
            creadoPorRol,
            creadoPorUsuario
        });

        res.status(201).json({
            success: true,
            data: { id: itemId }
        });
    } catch (error: any) {
        console.error('Error creando ítem ad-hoc:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
