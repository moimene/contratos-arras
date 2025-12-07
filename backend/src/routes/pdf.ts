import { Router, Request, Response } from 'express';
import { getContratoFull, setEstado } from '../repositories/contratos.repo.js';
import { generateDraftPDF, generateSignedPDF } from '../services/pdfService.js';
import { registerEvent } from '../services/eventService.js';
import { canGenerateDraft } from '../services/stateMachine.js';

const router = Router();

/**
 * POST /api/pdf/:contratoId/generar-borrador
 * Genera el PDF borrador del contrato
 */
router.post('/:contratoId/generar-borrador', async (req: Request, res: Response) => {
    try {
        const full = await getContratoFull(req.params.contratoId);

        // Validar que el contrato está en estado correcto
        if (!canGenerateDraft(full.contrato.estado as any)) {
            return res.status(400).json({
                error: `No se puede generar borrador. Estado actual: ${full.contrato.estado}. Requiere: TERMINOS_ESENCIALES_ACEPTADOS`,
            });
        }

        // Generar PDF
        const pdfBuffer = await generateDraftPDF(full);

        // Cambiar estado
        await setEstado(req.params.contratoId, 'BORRADOR_GENERADO');

        // Registrar evento
        await registerEvent({
            contratoId: req.params.contratoId,
            tipo: 'BORRADOR_GENERADO',
            payload: {
                timestamp: new Date().toISOString(),
                pdf_size: pdfBuffer.length,
            },
        });

        // Enviar PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="borrador-${full.contrato.identificador_unico}.pdf"`
        );
        res.send(pdfBuffer);
    } catch (error: any) {
        console.error('Error generando borrador:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * GET /api/pdf/:contratoId/borrador
 * Descarga el PDF borrador (regenerado)
 */
router.get('/:contratoId/borrador', async (req: Request, res: Response) => {
    try {
        const full = await getContratoFull(req.params.contratoId);

        // Generar PDF (siempre regeneramos para tener la última versión)
        const pdfBuffer = await generateDraftPDF(full);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `inline; filename="borrador-${full.contrato.identificador_unico}.pdf"`
        );
        res.send(pdfBuffer);
    } catch (error: any) {
        console.error('Error obteniendo borrador:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * GET /api/pdf/:contratoId/firmado
 * Descarga el PDF firmado del contrato
 */
router.get('/:contratoId/firmado', async (req: Request, res: Response) => {
    try {
        const full = await getContratoFull(req.params.contratoId);

        // Validar que el contrato está firmado
        if (full.contrato.estado !== 'FIRMADO') {
            return res.status(400).json({
                error: `El contrato no está firmado. Estado actual: ${full.contrato.estado}`,
            });
        }

        // Generar PDF firmado
        const pdfBuffer = await generateSignedPDF(full);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="contrato-firmado-${full.contrato.identificador_unico}.pdf"`
        );
        res.send(pdfBuffer);
    } catch (error: any) {
        console.error('Error obteniendo PDF firmado:', error);
        res.status(400).json({ error: error.message });
    }
});

export default router;
