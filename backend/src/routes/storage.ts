import { Router, Request, Response } from 'express';
import multer from 'multer';
import { guardarArchivo, leerArchivo, obtenerUrlPublica } from '../services/storageService.js';

const router = Router();

// Configurar multer
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB
    },
    fileFilter: (_req, file, cb) => {
        // Aceptar PDFs y imágenes comunes
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
 * Sube un archivo al storage
 * 
 * Form-data:
 * - file: File (required)
 * - type: 'pdf' | 'documento' | 'acta' (optional, default: 'documento')
 */
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No se recibió ningún archivo',
            });
        }

        const type = (req.body.type as 'pdf' | 'documento' | 'acta') || 'documento';

        const relativePath = await guardarArchivo(
            req.file.buffer,
            req.file.originalname,
            type
        );

        const publicUrl = obtenerUrlPublica(relativePath);

        res.json({
            success: true,
            path: relativePath,
            url: publicUrl,
            filename: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
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
 * GET /api/storage/:subdir/:filename
 * Descarga un archivo del storage
 */
router.get('/:subdir/:filename', async (req: Request, res: Response) => {
    try {
        const { subdir, filename } = req.params;
        const relativePath = `${subdir}/${filename}`;

        const buffer = await leerArchivo(relativePath);

        // Determinar content-type basado en extensión
        const ext = filename.split('.').pop()?.toLowerCase();
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

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        res.send(buffer);

    } catch (error: any) {
        console.error('Error al servir archivo:', error);

        if (error.code === 'ENOENT') {
            return res.status(404).json({
                success: false,
                error: 'Archivo no encontrado',
            });
        }

        res.status(500).json({
            success: false,
            error: 'Error al servir archivo',
        });
    }
});

export default router;
