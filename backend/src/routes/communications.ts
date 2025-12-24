/**
 * Communications API Routes
 * 
 * Gestión de comunicaciones formales del expediente.
 * Incluye: internas estructuradas, externas importadas, hilos de conversación.
 */

import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import {
    createCommunication,
    importExternalCommunication,
    sendCommunication,
    respondToCommunication,
    markAsDelivered,
    markAsRead,
    getConversationThread,
    getCommunication,
    listCommunications,
    type TipoComunicacion,
    type CanalComunicacion,
    type EstadoComunicacion
} from '../services/communicationService.js';
import { requirePermission } from '../middleware/authorization.js';

const router = Router();

// ============================================
// LISTADO Y CONSULTA
// ============================================

/**
 * GET /api/contratos/:contratoId/comunicaciones
 * Lista todas las comunicaciones de un contrato
 */
router.get('/:contratoId/comunicaciones', async (req: Request, res: Response) => {
    try {
        const { contratoId } = req.params;
        const { tipo, canal, estado, esExterna, limit, offset } = req.query;

        const result = await listCommunications(contratoId, {
            tipo: tipo as TipoComunicacion | undefined,
            canal: canal as CanalComunicacion | undefined,
            estado: estado as EstadoComunicacion | undefined,
            esExterna: esExterna === 'true' ? true : esExterna === 'false' ? false : undefined,
            limit: limit ? parseInt(limit as string) : undefined,
            offset: offset ? parseInt(offset as string) : undefined
        });

        res.json({
            success: true,
            data: result.data,
            total: result.total,
            resumen: {
                total: result.total,
                internas: result.data.filter(c => !c.es_externa).length,
                externas: result.data.filter(c => c.es_externa).length
            }
        });
    } catch (error: any) {
        console.error('Error listando comunicaciones:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/comunicaciones/:id
 * Detalle de una comunicación específica
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const comunicacion = await getCommunication(id);
        if (!comunicacion) {
            return res.status(404).json({ success: false, error: 'Comunicación no encontrada' });
        }

        // Obtener adjuntos si existen
        let adjuntos: any[] = [];
        if (comunicacion.adjuntos_archivo_ids?.length > 0) {
            const { data: archivos } = await supabase
                .from('archivos')
                .select('id, nombre_original, tipo_mime, tamano_bytes')
                .in('id', comunicacion.adjuntos_archivo_ids);
            adjuntos = archivos || [];
        }

        // Obtener sello QTSP si existe
        let selloQtsp = null;
        if (comunicacion.sello_qtsp_id) {
            const { data: sello } = await supabase
                .from('sellos_tiempo')
                .select('*')
                .eq('id', comunicacion.sello_qtsp_id)
                .single();
            selloQtsp = sello;
        }

        res.json({
            success: true,
            data: {
                ...comunicacion,
                adjuntos,
                selloQtsp
            }
        });
    } catch (error: any) {
        console.error('Error obteniendo comunicación:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/comunicaciones/:id/hilo
 * Obtiene el hilo completo de una conversación
 */
router.get('/:id/hilo', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const hilo = await getConversationThread(id);

        res.json({
            success: true,
            data: hilo,
            count: hilo.length
        });
    } catch (error: any) {
        console.error('Error obteniendo hilo:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// CREACIÓN DE COMUNICACIONES
// ============================================

/**
 * POST /api/contratos/:contratoId/comunicaciones
 * Crea una nueva comunicación interna
 */
router.post('/:contratoId/comunicaciones', requirePermission('canSendCommunications'), async (req: Request, res: Response) => {
    try {
        const { contratoId } = req.params;
        const {
            tipoComunicacion,
            canal,
            remitenteRol,
            remitenteUsuarioId,
            destinatariosRoles,
            asunto,
            contenido,
            contenidoHtml,
            metadatos,
            adjuntosArchivoIds,
            enviarInmediatamente
        } = req.body;

        if (!tipoComunicacion || !contenido || !remitenteRol) {
            return res.status(400).json({
                success: false,
                error: 'tipoComunicacion, contenido y remitenteRol son requeridos'
            });
        }

        const result = await createCommunication({
            contratoId,
            tipoComunicacion,
            canal,
            remitenteRol,
            remitenteUsuarioId,
            destinatariosRoles,
            asunto,
            contenido,
            contenidoHtml,
            metadatos,
            adjuntosArchivoIds,
            enviarInmediatamente
        });

        res.status(201).json({
            success: true,
            data: result
        });
    } catch (error: any) {
        console.error('Error creando comunicación:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/contratos/:contratoId/comunicaciones/externas
 * Importa una comunicación externa al expediente
 */
router.post('/:contratoId/comunicaciones/externas', requirePermission('canUploadDocs'), async (req: Request, res: Response) => {
    try {
        const { contratoId } = req.params;
        const {
            canal,
            fechaComunicacion,
            remitenteExterno,
            destinatariosExternos,
            resumenContenido,
            tipoFuncion,
            adjuntosArchivoIds,
            comunicacionPadreId,
            metadatos,
            registradoPorRol,
            registradoPorUsuarioId
        } = req.body;

        // Validaciones
        if (!canal || !fechaComunicacion || !remitenteExterno || !resumenContenido || !registradoPorRol) {
            return res.status(400).json({
                success: false,
                error: 'canal, fechaComunicacion, remitenteExterno, resumenContenido y registradoPorRol son requeridos'
            });
        }

        const result = await importExternalCommunication({
            contratoId,
            canal,
            fechaComunicacion,
            remitenteExterno,
            destinatariosExternos,
            resumenContenido,
            tipoFuncion,
            adjuntosArchivoIds,
            comunicacionPadreId,
            metadatos,
            registradoPorRol,
            registradoPorUsuarioId
        });

        res.status(201).json({
            success: true,
            data: result,
            message: 'Comunicación externa importada y sellada con QTSP'
        });
    } catch (error: any) {
        console.error('Error importando comunicación externa:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// ACCIONES SOBRE COMUNICACIONES
// ============================================

/**
 * POST /api/comunicaciones/:id/enviar
 * Envía una comunicación que estaba en borrador
 */
router.post('/:id/enviar', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await sendCommunication(id);

        res.json({
            success: true,
            message: 'Comunicación enviada y sellada con QTSP'
        });
    } catch (error: any) {
        console.error('Error enviando comunicación:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/comunicaciones/:id/responder
 * Responde a una comunicación existente
 */
router.post('/:id/responder', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            remitenteRol,
            remitenteUsuarioId,
            contenido,
            contenidoHtml,
            adjuntosArchivoIds,
            enviarInmediatamente = true
        } = req.body;

        if (!contenido || !remitenteRol) {
            return res.status(400).json({
                success: false,
                error: 'contenido y remitenteRol son requeridos'
            });
        }

        const result = await respondToCommunication(id, {
            tipoComunicacion: 'RESPUESTA',
            remitenteRol,
            remitenteUsuarioId,
            contenido,
            contenidoHtml,
            adjuntosArchivoIds,
            enviarInmediatamente
        });

        res.status(201).json({
            success: true,
            data: result
        });
    } catch (error: any) {
        console.error('Error respondiendo comunicación:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/comunicaciones/:id/entregada
 * Marca una comunicación como entregada
 */
router.post('/:id/entregada', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await markAsDelivered(id);

        res.json({ success: true, message: 'Comunicación marcada como entregada' });
    } catch (error: any) {
        console.error('Error marcando entregada:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/comunicaciones/:id/leida
 * Marca una comunicación como leída
 */
router.post('/:id/leida', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await markAsRead(id);

        res.json({ success: true, message: 'Comunicación marcada como leída' });
    } catch (error: any) {
        console.error('Error marcando leída:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// FILTROS Y BÚSQUEDA
// ============================================

/**
 * GET /api/contratos/:contratoId/comunicaciones/filtrar
 * Filtra comunicaciones con múltiples criterios
 */
router.get('/:contratoId/comunicaciones/filtrar', async (req: Request, res: Response) => {
    try {
        const { contratoId } = req.params;
        const { tipo, canal, estado, esExterna, remitenteRol, desde, hasta } = req.query;

        let query = supabase
            .from('comunicaciones')
            .select('*')
            .eq('contrato_id', contratoId);

        if (tipo) query = query.eq('tipo_comunicacion', tipo);
        if (canal) query = query.eq('canal', canal);
        if (estado) query = query.eq('estado', estado);
        if (esExterna === 'true') query = query.eq('es_externa', true);
        if (esExterna === 'false') query = query.eq('es_externa', false);
        if (remitenteRol) query = query.eq('remitente_rol', remitenteRol);
        if (desde) query = query.gte('fecha_comunicacion', desde);
        if (hasta) query = query.lte('fecha_comunicacion', hasta);

        query = query.order('fecha_comunicacion', { ascending: false });

        const { data, error } = await query;

        if (error) throw error;

        res.json({
            success: true,
            data,
            count: data?.length || 0
        });
    } catch (error: any) {
        console.error('Error filtrando comunicaciones:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/contratos/:contratoId/comunicaciones/resumen
 * Resumen de comunicaciones por tipo y estado
 */
router.get('/:contratoId/comunicaciones/resumen', async (req: Request, res: Response) => {
    try {
        const { contratoId } = req.params;

        const { data, error } = await supabase
            .from('comunicaciones')
            .select('tipo_comunicacion, estado, es_externa')
            .eq('contrato_id', contratoId);

        if (error) throw error;

        // Calcular resumen
        const resumen = {
            total: data?.length || 0,
            porTipo: {} as Record<string, number>,
            porEstado: {} as Record<string, number>,
            internas: 0,
            externas: 0
        };

        data?.forEach(c => {
            resumen.porTipo[c.tipo_comunicacion] = (resumen.porTipo[c.tipo_comunicacion] || 0) + 1;
            resumen.porEstado[c.estado] = (resumen.porEstado[c.estado] || 0) + 1;
            if (c.es_externa) {
                resumen.externas++;
            } else {
                resumen.internas++;
            }
        });

        res.json({ success: true, data: resumen });
    } catch (error: any) {
        console.error('Error obteniendo resumen:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
