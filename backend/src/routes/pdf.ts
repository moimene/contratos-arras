import { Router, Request, Response } from 'express';
import { getContratoFull, setEstado } from '../repositories/contratos.repo.js';
import { generateDraftPDF, generateSignedPDF, generateEventCertificatePDF, generateCommunicationPDF } from '../services/pdfService.js';
import { registerEvent } from '../services/eventService.js';
import { canGenerateDraft } from '../services/stateMachine.js';
import { supabase } from '../config/supabase.js';

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
                error: `No se puede generar borrador. Estado actual: ${full.contrato.estado}. Requiere: INICIADO`,
            });
        }

        // Generar PDF
        const pdfBuffer = await generateDraftPDF(full);

        // Cambiar estado
        await setEstado(req.params.contratoId, 'BORRADOR');

        // Registrar evento
        await registerEvent({
            contratoId: req.params.contratoId,
            tipo: 'BORRADOR_GENERADO',  // Evento type can stay for audit
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

/**
 * GET /api/pdf/:contratoId/evento/:eventoId/certificado
 * Genera un certificado PDF para un evento específico
 */
router.get('/:contratoId/evento/:eventoId/certificado', async (req: Request, res: Response) => {
    try {
        const { contratoId, eventoId } = req.params;

        // Obtener el evento
        const { data: evento, error: eventoError } = await supabase
            .from('eventos')
            .select('*')
            .eq('id', eventoId)
            .eq('contrato_id', contratoId)
            .single();

        if (eventoError || !evento) {
            return res.status(404).json({ error: 'Evento no encontrado' });
        }

        // Obtener datos básicos del contrato
        const { data: contrato, error: contratoError } = await supabase
            .from('contratos_arras')
            .select('id, numero_expediente, identificador_unico, estado')
            .eq('id', contratoId)
            .single();

        if (contratoError || !contrato) {
            return res.status(404).json({ error: 'Contrato no encontrado' });
        }

        // Obtener nombre del actor si existe
        let actorNombre: string | undefined;
        if (evento.actor_parte_id) {
            const { data: parte } = await supabase
                .from('partes')
                .select('nombre, apellidos')
                .eq('id', evento.actor_parte_id)
                .single();
            if (parte) {
                actorNombre = `${parte.nombre} ${parte.apellidos}`;
            }
        }

        // Obtener sello QTSP si existe
        let selloQTSP: any;
        if (evento.sello_id) {
            const { data: sello } = await supabase
                .from('sellos_tiempo')
                .select('proveedor, fecha_sello, rfc3161_tst_base64')
                .eq('id', evento.sello_id)
                .single();
            if (sello) {
                selloQTSP = sello;
            }
        }

        // Generar PDF
        const pdfBuffer = await generateEventCertificatePDF({
            evento,
            contrato,
            actorNombre,
            selloQTSP,
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="certificado-evento-${evento.tipo}-${eventoId.substring(0, 8)}.pdf"`
        );
        res.send(pdfBuffer);
    } catch (error: any) {
        console.error('Error generando certificado de evento:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/pdf/:contratoId/comunicacion/:comunicacionId
 * Genera una copia PDF de una comunicación
 */
router.get('/:contratoId/comunicacion/:comunicacionId', async (req: Request, res: Response) => {
    try {
        const { contratoId, comunicacionId } = req.params;

        // Obtener la comunicación
        const { data: comunicacion, error: comError } = await supabase
            .from('comunicaciones')
            .select('*')
            .eq('id', comunicacionId)
            .eq('contrato_id', contratoId)
            .single();

        if (comError || !comunicacion) {
            return res.status(404).json({ error: 'Comunicación no encontrada' });
        }

        // Obtener datos básicos del contrato
        const { data: contrato, error: contratoError } = await supabase
            .from('contratos_arras')
            .select('id, numero_expediente, identificador_unico')
            .eq('id', contratoId)
            .single();

        if (contratoError || !contrato) {
            return res.status(404).json({ error: 'Contrato no encontrado' });
        }

        // Obtener sello QTSP si existe
        let selloQTSP: any;
        if (comunicacion.sello_qtsp_id) {
            const { data: sello } = await supabase
                .from('sellos_tiempo')
                .select('proveedor, fecha_sello')
                .eq('id', comunicacion.sello_qtsp_id)
                .single();
            if (sello) {
                selloQTSP = sello;
            }
        }

        // Generar PDF
        const pdfBuffer = await generateCommunicationPDF({
            comunicacion,
            contrato,
            selloQTSP,
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="comunicacion-${comunicacion.tipo_comunicacion}-${comunicacionId.substring(0, 8)}.pdf"`
        );
        res.send(pdfBuffer);
    } catch (error: any) {
        console.error('Error generando copia de comunicación:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;

