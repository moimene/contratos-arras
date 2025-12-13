/**
 * Storage API Routes
 * 
 * Rutas para subida y descarga de archivos usando Supabase Storage.
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { guardarArchivo, leerArchivo, obtenerUrlDescarga } from '../services/storageService.js';

const router = Router();

// Configurar multer con memoria (luego subimos a Supabase)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50 MB (límite Supabase free)
    },
    fileFilter: (_req, file, cb) => {
        const allowedMimes = [
            'application/pdf',
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
        ];

        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido. Solo PDF e imágenes.'));
        }
    },
});

/**
 * POST /api/storage/upload
 * Sube un archivo a Supabase Storage
 * 
 * Form-data:
 * - file: File (required)
 * - contrato_id: string (required)
 * - tipo: string (optional, default: 'documento')
 */
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No se recibió ningún archivo',
            });
        }

        const contratoId = req.body.contrato_id || 'general';
        const tipo = req.body.tipo || 'documento';

        const result = await guardarArchivo(
            req.file.buffer,
            req.file.originalname,
            contratoId,
            tipo
        );

        res.json({
            success: true,
            path: result.path,
            url: result.publicUrl,
            hash: result.hash,
            filename: req.file.originalname,
            mimeType: req.file.mimetype,
            size: result.size,
        });

    } catch (error: any) {
        console.error('Error al subir archivo:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error al subir archivo',
        });
    }
});

/**
 * GET /api/storage/:path(*)
 * Descarga un archivo de Supabase Storage
 */
router.get('/*', async (req: Request, res: Response) => {
    try {
        // El path viene después de /api/storage/
        const storagePath = req.params[0] || req.path.substring(1);

        if (!storagePath) {
            return res.status(400).json({
                success: false,
                error: 'Path del archivo requerido',
            });
        }

        // Opción 1: Redirigir a URL signada (más eficiente)
        if (req.query.redirect !== 'false') {
            const signedUrl = await obtenerUrlDescarga(storagePath, 3600);
            return res.redirect(signedUrl);
        }

        // Opción 2: Servir el archivo directamente (si redirect=false)
        const buffer = await leerArchivo(storagePath);

        // Determinar content-type basado en extensión
        const ext = storagePath.split('.').pop()?.toLowerCase();
        let contentType = 'application/octet-stream';

        switch (ext) {
            case 'pdf':
                contentType = 'application/pdf';
                break;
            case 'jpg':
            case 'jpeg':
                contentType = 'image/jpeg';
                break;
            case 'png':
                contentType = 'image/png';
                break;
            case 'webp':
                contentType = 'image/webp';
                break;
        }

        const filename = storagePath.split('/').pop() || 'file';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        res.send(buffer);

    } catch (error: any) {
        console.error('Error al servir archivo:', error);
        res.status(404).json({
            success: false,
            error: 'Archivo no encontrado',
        });
    }
});

export default router;
