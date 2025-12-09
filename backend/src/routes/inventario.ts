/**
 * Inventario de Documentos API Routes
 * 
 * Gestión del checklist dinámico de documentos por expediente.
 * Según Directiva #003.
 */

import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { registerEvent } from '../services/eventService.js';

const router = Router();

/**
 * GET /api/contratos/:contratoId/inventario
 * Lista todos los ítems del inventario de un expediente
 * 
 * Query params:
 * - grupo: filtrar por grupo (INMUEBLE, PARTES, ARRAS, NOTARIA, CIERRE)
 * - estado: filtrar por estado (PENDIENTE, SUBIDO, VALIDADO, RECHAZADO)
 * - responsable_rol: filtrar por rol responsable
 */
router.get('/:contratoId/inventario', async (req: Request, res: Response) => {
    try {
        const { contratoId } = req.params;
        const { grupo, estado, responsable_rol } = req.query;

        let query = supabase
            .from('inventario_expediente')
            .select('*')
            .eq('contrato_id', contratoId)
            .order('grupo')
            .order('created_at');

        if (grupo) {
            query = query.eq('grupo', grupo);
        }
        if (estado) {
            query = query.eq('estado', estado);
        }
        if (responsable_rol) {
            query = query.eq('responsable_rol', responsable_rol);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Agrupar por bloque para UI
        const agrupado = {
            INMUEBLE: data?.filter(i => i.grupo === 'INMUEBLE') || [],
            PARTES: data?.filter(i => i.grupo === 'PARTES') || [],
            ARRAS: data?.filter(i => i.grupo === 'ARRAS') || [],
            NOTARIA: data?.filter(i => i.grupo === 'NOTARIA') || [],
            CIERRE: data?.filter(i => i.grupo === 'CIERRE') || [],
        };

        // Calcular resumen
        const resumen = {
            total: data?.length || 0,
            pendiente: data?.filter(i => i.estado === 'PENDIENTE').length || 0,
            subido: data?.filter(i => i.estado === 'SUBIDO').length || 0,
            validado: data?.filter(i => i.estado === 'VALIDADO').length || 0,
            rechazado: data?.filter(i => i.estado === 'RECHAZADO').length || 0,
        };

        res.json({
            success: true,
            data: {
                items: data || [],
                agrupado,
                resumen
            }
        });
    } catch (error: any) {
        console.error('Error obteniendo inventario:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/contratos/:contratoId/inventario
 * Crea un nuevo ítem en el inventario
 */
router.post('/:contratoId/inventario', async (req: Request, res: Response) => {
    try {
        const { contratoId } = req.params;
        const {
            tipo,
            titulo,
            descripcion,
            grupo,
            responsable_rol,
            obligatorio = true,
            metadatos_extra = {}
        } = req.body;

        // Validar campos requeridos
        if (!tipo || !titulo || !grupo || !responsable_rol) {
            return res.status(400).json({
                success: false,
                error: 'Campos requeridos: tipo, titulo, grupo, responsable_rol'
            });
        }

        const { data, error } = await supabase
            .from('inventario_expediente')
            .insert({
                contrato_id: contratoId,
                tipo,
                titulo,
                descripcion,
                grupo,
                responsable_rol,
                obligatorio,
                metadatos_extra,
                estado: 'PENDIENTE'
            })
            .select()
            .single();

        if (error) throw error;

        // Registrar evento
        await registerEvent({
            contratoId,
            tipo: 'INVENTARIO_ITEM_CREADO',
            payload: {
                item_id: data.id,
                tipo: data.tipo,
                titulo: data.titulo,
                responsable: data.responsable_rol
            }
        });

        res.status(201).json({ success: true, data });
    } catch (error: any) {
        console.error('Error creando ítem inventario:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PATCH /api/inventario/:id
 * Actualiza un ítem del inventario (estado, archivo, validación, rechazo)
 */
router.patch('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            estado,
            archivo_id,
            subido_por_rol,
            subido_por_usuario,
            validado_por_rol,
            validado_por_usuario,
            motivo_rechazo,
            metadatos_extra
        } = req.body;

        // Construir objeto de actualización
        const updateData: any = {};

        if (estado) {
            updateData.estado = estado;

            // Actualizar timestamps según estado
            if (estado === 'SUBIDO') {
                updateData.fecha_subida = new Date().toISOString();
                if (subido_por_rol) updateData.subido_por_rol = subido_por_rol;
                if (subido_por_usuario) updateData.subido_por_usuario = subido_por_usuario;
            } else if (estado === 'VALIDADO' || estado === 'RECHAZADO') {
                updateData.fecha_validacion = new Date().toISOString();
                if (validado_por_rol) updateData.validado_por_rol = validado_por_rol;
                if (validado_por_usuario) updateData.validado_por_usuario = validado_por_usuario;
                if (estado === 'RECHAZADO' && motivo_rechazo) {
                    updateData.motivo_rechazo = motivo_rechazo;
                }
            }
        }

        if (archivo_id) updateData.archivo_id = archivo_id;
        if (metadatos_extra) updateData.metadatos_extra = metadatos_extra;

        // Obtener ítem actual para logging
        const { data: itemActual } = await supabase
            .from('inventario_expediente')
            .select('*, contrato_id')
            .eq('id', id)
            .single();

        // Actualizar
        const { data, error } = await supabase
            .from('inventario_expediente')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Registrar evento
        if (itemActual) {
            let tipoEvento = 'INVENTARIO_ACTUALIZADO';
            if (estado === 'SUBIDO') tipoEvento = 'DOCUMENTO_SUBIDO';
            else if (estado === 'VALIDADO') tipoEvento = 'DOCUMENTO_VALIDADO';
            else if (estado === 'RECHAZADO') tipoEvento = 'DOCUMENTO_RECHAZADO';

            await registerEvent({
                contratoId: itemActual.contrato_id,
                tipo: tipoEvento as any,
                payload: {
                    item_id: id,
                    tipo: itemActual.tipo,
                    titulo: itemActual.titulo,
                    estado_anterior: itemActual.estado,
                    estado_nuevo: estado,
                    motivo_rechazo: motivo_rechazo || null
                }
            });
        }

        res.json({ success: true, data });
    } catch (error: any) {
        console.error('Error actualizando ítem inventario:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * DELETE /api/inventario/:id
 * Elimina un ítem del inventario (solo ADMIN)
 */
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // TODO: Verificar que el usuario sea ADMIN

        // Obtener ítem para logging
        const { data: item } = await supabase
            .from('inventario_expediente')
            .select('*')
            .eq('id', id)
            .single();

        const { error } = await supabase
            .from('inventario_expediente')
            .delete()
            .eq('id', id);

        if (error) throw error;

        // Registrar evento
        if (item) {
            await registerEvent({
                contratoId: item.contrato_id,
                tipo: 'INVENTARIO_ITEM_ELIMINADO',
                payload: {
                    item_id: id,
                    tipo: item.tipo,
                    titulo: item.titulo
                }
            });
        }

        res.json({ success: true, message: 'Ítem eliminado' });
    } catch (error: any) {
        console.error('Error eliminando ítem inventario:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/contratos/:contratoId/inventario/pendientes
 * Obtiene ítems pendientes para un rol específico
 */
router.get('/:contratoId/inventario/pendientes', async (req: Request, res: Response) => {
    try {
        const { contratoId } = req.params;
        const { rol } = req.query;

        let query = supabase
            .from('inventario_expediente')
            .select('*')
            .eq('contrato_id', contratoId)
            .in('estado', ['PENDIENTE', 'RECHAZADO'])
            .eq('obligatorio', true);

        if (rol) {
            query = query.eq('responsable_rol', rol);
        }

        const { data, error } = await query.order('created_at');

        if (error) throw error;

        res.json({
            success: true,
            data: data || [],
            count: data?.length || 0
        });
    } catch (error: any) {
        console.error('Error obteniendo pendientes:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
