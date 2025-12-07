import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { registerEvent } from '../services/eventService.js';
import multer from 'multer';
import { randomUUID } from 'crypto';

const router = Router();

// Configurar multer para manejo de archivos en memoria
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
    },
    fileFilter: (req, file, cb) => {
        // Aceptar solo imágenes y PDFs
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido. Solo se aceptan JPG, PNG y PDF.'));
        }
    },
});

/**
 * POST /api/pagos/:contratoId/confirmar
 * Registra que las arras han sido pagadas
 */
router.post('/:contratoId/confirmar', async (req: Request, res: Response) => {
    try {
        const { contratoId } = req.params;
        const { fecha_pago, metodo_pago } = req.body;

        // Obtener contrato
        const { data: contrato, error: contratoError } = await supabase
            .from('contratos')
            .select('*')
            .eq('id', contratoId)
            .single();

        if (contratoError || !contrato) {
            return res.status(404).json({ error: 'Contrato no encontrado' });
        }

        // Validar que no esté ya pagado
        if (contrato.arras_acreditadas_at) {
            return res.status(400).json({ error: 'Las arras ya han sido acreditadas' });
        }

        // Actualizar contrato
        const { data: updated, error: updateError } = await supabase
            .from('contratos')
            .update({
                arras_acreditadas_at: fecha_pago || new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', contratoId)
            .select()
            .single();

        if (updateError) {
            throw updateError;
        }

        // Registrar evento
        await registerEvent({
            contratoId,
            tipo: 'PAGO_ARRAS_CONFIRMADO',
            payload: {
                fecha_pago: fecha_pago || new Date().toISOString(),
                metodo_pago,
                importe: contrato.importe_arras,
            },
        });

        res.json({
            message: 'Pago de arras confirmado',
            contrato: updated,
        });
    } catch (error: any) {
        console.error('Error confirmando pago:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/pagos/:contratoId/justificante
 * Sube un justificante de pago a Supabase Storage
 */
router.post(
    '/:contratoId/justificante',
    upload.single('file'),
    async (req: Request, res: Response) => {
        try {
            const { contratoId } = req.params;
            const file = req.file;

            if (!file) {
                return res.status(400).json({ error: 'No se recibió ningún archivo' });
            }

            // Generar nombre único para el archivo
            const fileExt = file.originalname.split('.').pop();
            const fileName = `${contratoId}/${randomUUID()}.${fileExt}`;

            // Subir a Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('justificantes')
                .upload(fileName, file.buffer, {
                    contentType: file.mimetype,
                    upsert: false,
                });

            if (uploadError) {
                throw uploadError;
            }

            // Obtener URL pública
            const { data: urlData } = supabase.storage
                .from('justificantes')
                .getPublicUrl(fileName);

            // Registrar en la tabla de archivos (si existe)
            const { data: archivoData, error: archivoError } = await supabase
                .from('archivos')
                .insert({
                    contrato_id: contratoId,
                    tipo: 'JUSTIFICANTE_PAGO',
                    nombre_archivo: file.originalname,
                    ruta_storage: fileName,
                    url_publica: urlData.publicUrl,
                    tamano_bytes: file.size,
                    mime_type: file.mimetype,
                })
                .select()
                .single();

            if (archivoError) {
                console.error('Error registrando archivo:', archivoError);
            }

            // Registrar evento
            await registerEvent({
                contratoId,
                tipo: 'JUSTIFICANTE_SUBIDO',
                payload: {
                    archivo_id: archivoData?.id,
                    nombre_archivo: file.originalname,
                    tamano: file.size,
                },
            });

            res.json({
                message: 'Justificante subido correctamente',
                archivo: archivoData,
                url: urlData.publicUrl,
            });
        } catch (error: any) {
            console.error('Error subiendo justificante:', error);
            res.status(500).json({ error: error.message });
        }
    }
);

/**
 * GET /api/pagos/:contratoId
 * Obtiene el estado del pago de arras
 */
router.get('/:contratoId', async (req: Request, res: Response) => {
    try {
        const { contratoId } = req.params;

        const { data: contrato, error } = await supabase
            .from('contratos')
            .select('importe_arras, arras_acreditadas_at, forma_pago_arras, fecha_limite_pago_arras')
            .eq('id', contratoId)
            .single();

        if (error || !contrato) {
            return res.status(404).json({ error: 'Contrato no encontrado' });
        }

        // Obtener justificantes
        const { data: justificantes } = await supabase
            .from('archivos')
            .select('*')
            .eq('contrato_id', contratoId)
            .eq('tipo', 'JUSTIFICANTE_PAGO')
            .order('created_at', { ascending: false });

        const estado = {
            importe: contrato.importe_arras,
            pagado: !!contrato.arras_acreditadas_at,
            fecha_pago: contrato.arras_acreditadas_at,
            fecha_limite: contrato.fecha_limite_pago_arras,
            forma_pago: contrato.forma_pago_arras,
            justificantes: justificantes || [],
            vencido: contrato.fecha_limite_pago_arras
                ? new Date(contrato.fecha_limite_pago_arras) < new Date()
                : false,
        };

        res.json(estado);
    } catch (error: any) {
        console.error('Error obteniendo estado de pago:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/pagos/:contratoId/justificante/:archivoId
 * Elimina un justificante de pago
 */
router.delete('/:contratoId/justificante/:archivoId', async (req: Request, res: Response) => {
    try {
        const { archivoId } = req.params;

        // Obtener archivo
        const { data: archivo, error: getError } = await supabase
            .from('archivos')
            .select('*')
            .eq('id', archivoId)
            .single();

        if (getError || !archivo) {
            return res.status(404).json({ error: 'Archivo no encontrado' });
        }

        // Eliminar de Storage
        const { error: deleteStorageError } = await supabase.storage
            .from('justificantes')
            .remove([archivo.ruta_storage]);

        if (deleteStorageError) {
            console.error('Error eliminando de storage:', deleteStorageError);
        }

        // Eliminar registro
        const { error: deleteError } = await supabase
            .from('archivos')
            .delete()
            .eq('id', archivoId);

        if (deleteError) {
            throw deleteError;
        }

        res.json({ message: 'Justificante eliminado correctamente' });
    } catch (error: any) {
        console.error('Error eliminando justificante:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
