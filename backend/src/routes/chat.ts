/**
 * Chat API Routes
 * 
 * Gestión de mensajes del expediente.
 * Incluye marcado de mensajes probatoriamente relevantes.
 */

import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { registerEvent } from '../services/eventService.js';

const router = Router();

/**
 * GET /api/contratos/:contratoId/mensajes
 * Lista todos los mensajes de un expediente
 */
router.get('/:contratoId/mensajes', async (req: Request, res: Response) => {
    try {
        const { contratoId } = req.params;

        const { data, error } = await supabase
            .from('mensajes')
            .select('*')
            .eq('contrato_id', contratoId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        res.json({
            success: true,
            data: data || [],
            count: data?.length || 0
        });
    } catch (error: any) {
        console.error('Error obteniendo mensajes:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/contratos/:contratoId/mensajes
 * Envía un nuevo mensaje al expediente
 */
router.post('/:contratoId/mensajes', async (req: Request, res: Response) => {
    try {
        const { contratoId } = req.params;
        const {
            mensaje,
            remitente_id,
            remitente_nombre,
            es_sistema = false,
            metadatos = {}
        } = req.body;

        if (!mensaje && !es_sistema) {
            return res.status(400).json({
                success: false,
                error: 'El mensaje es requerido'
            });
        }

        const { data, error } = await supabase
            .from('mensajes')
            .insert({
                contrato_id: contratoId,
                mensaje,
                remitente_id,
                remitente_nombre: remitente_nombre || 'Usuario',
                es_sistema,
                metadatos,
                es_relevante_probatoriamente: false
            })
            .select()
            .single();

        if (error) throw error;

        // Registrar evento para mensajes importantes
        if (!es_sistema) {
            await registerEvent({
                contratoId,
                tipo: 'MENSAJE_ENVIADO',
                payload: {
                    mensaje_id: data.id,
                    remitente: remitente_nombre || 'Usuario',
                    preview: mensaje.substring(0, 100)
                }
            });
        }

        res.status(201).json({ success: true, data });
    } catch (error: any) {
        console.error('Error enviando mensaje:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PATCH /api/mensajes/:id
 * Actualiza un mensaje (marcar como relevante probatoriamente)
 */
router.patch('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { es_relevante_probatoriamente, motivo_relevancia } = req.body;

        const { data: mensaje, error: fetchError } = await supabase
            .from('mensajes')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !mensaje) {
            return res.status(404).json({
                success: false,
                error: 'Mensaje no encontrado'
            });
        }

        const updateData: Record<string, any> = {};

        if (es_relevante_probatoriamente !== undefined) {
            updateData.es_relevante_probatoriamente = es_relevante_probatoriamente;
            updateData.fecha_marcado_relevante = es_relevante_probatoriamente ? new Date().toISOString() : null;
            updateData.motivo_relevancia = motivo_relevancia || null;
        }

        const { data, error } = await supabase
            .from('mensajes')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Registrar evento si se marca como relevante
        if (es_relevante_probatoriamente) {
            await registerEvent({
                contratoId: mensaje.contrato_id,
                tipo: 'MENSAJE_MARCADO_RELEVANTE',
                payload: {
                    mensaje_id: id,
                    motivo: motivo_relevancia,
                    mensaje_preview: mensaje.mensaje?.substring(0, 50)
                }
            });
        }

        res.json({ success: true, data });
    } catch (error: any) {
        console.error('Error actualizando mensaje:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/contratos/:contratoId/mensajes/relevantes
 * Lista solo mensajes marcados como probatoriamente relevantes
 */
router.get('/:contratoId/mensajes/relevantes', async (req: Request, res: Response) => {
    try {
        const { contratoId } = req.params;

        const { data, error } = await supabase
            .from('mensajes')
            .select('*')
            .eq('contrato_id', contratoId)
            .eq('es_relevante_probatoriamente', true)
            .order('created_at', { ascending: true });

        if (error) throw error;

        res.json({
            success: true,
            data: data || [],
            count: data?.length || 0
        });
    } catch (error: any) {
        console.error('Error obteniendo mensajes relevantes:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
