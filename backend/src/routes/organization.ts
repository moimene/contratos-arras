/**
 * Organization Routes - Organization & Team Management
 * 
 * Endpoints for managing organizations and team members
 */

import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

/**
 * GET /api/organization
 * Obtener organización actual del usuario
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const userId = req.headers['x-user-id'] as string;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'No autorizado'
            });
        }

        // Obtener organización del usuario
        const { data: perfil, error: perfilError } = await supabase
            .from('perfiles')
            .select('organizacion_id, rol_organizacion')
            .eq('id', userId)
            .single();

        if (perfilError || !perfil?.organizacion_id) {
            return res.status(404).json({
                success: false,
                error: 'No perteneces a ninguna organización'
            });
        }

        const { data: org, error } = await supabase
            .from('organizaciones')
            .select('*')
            .eq('id', perfil.organizacion_id)
            .single();

        if (error) {
            return res.status(500).json({
                success: false,
                error: 'Error al obtener organización'
            });
        }

        return res.json({
            success: true,
            data: {
                ...org,
                mi_rol: perfil.rol_organizacion
            }
        });

    } catch (error) {
        console.error('[Organization] Exception:', error);
        return res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * PUT /api/organization
 * Actualizar organización (solo OWNER o ADMIN)
 */
router.put('/', async (req: Request, res: Response) => {
    try {
        const userId = req.headers['x-user-id'] as string;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'No autorizado'
            });
        }

        // Verificar permisos
        const { data: perfil, error: perfilError } = await supabase
            .from('perfiles')
            .select('organizacion_id, rol_organizacion')
            .eq('id', userId)
            .single();

        if (perfilError || !perfil?.organizacion_id) {
            return res.status(404).json({
                success: false,
                error: 'No perteneces a ninguna organización'
            });
        }

        if (!['OWNER', 'ADMIN'].includes(perfil.rol_organizacion)) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permisos para editar la organización'
            });
        }

        const { nombre, nif, tipo, config } = req.body;

        const updateData: any = {
            updated_at: new Date().toISOString()
        };

        if (nombre !== undefined) updateData.nombre = nombre;
        if (nif !== undefined) updateData.nif = nif;
        if (tipo !== undefined) updateData.tipo = tipo;
        if (config !== undefined) updateData.config = config;

        const { data, error } = await supabase
            .from('organizaciones')
            .update(updateData)
            .eq('id', perfil.organizacion_id)
            .select()
            .single();

        if (error) {
            console.error('[Organization] Update error:', error);
            return res.status(500).json({
                success: false,
                error: 'Error al actualizar organización'
            });
        }

        return res.json({
            success: true,
            data,
            message: 'Organización actualizada'
        });

    } catch (error) {
        console.error('[Organization] Exception:', error);
        return res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/organization/members
 * Listar miembros de la organización
 */
router.get('/members', async (req: Request, res: Response) => {
    try {
        const userId = req.headers['x-user-id'] as string;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'No autorizado'
            });
        }

        const { data: perfil, error: perfilError } = await supabase
            .from('perfiles')
            .select('organizacion_id')
            .eq('id', userId)
            .single();

        if (perfilError || !perfil?.organizacion_id) {
            return res.status(404).json({
                success: false,
                error: 'No perteneces a ninguna organización'
            });
        }

        const { data: members, error } = await supabase
            .from('perfiles')
            .select('id, email, nombre_completo, avatar_url, rol_organizacion, created_at')
            .eq('organizacion_id', perfil.organizacion_id)
            .order('created_at', { ascending: true });

        if (error) {
            return res.status(500).json({
                success: false,
                error: 'Error al obtener miembros'
            });
        }

        return res.json({
            success: true,
            data: members
        });

    } catch (error) {
        console.error('[Organization] Exception:', error);
        return res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/organization/invite
 * Invitar nuevo miembro a la organización
 */
router.post('/invite', async (req: Request, res: Response) => {
    try {
        const userId = req.headers['x-user-id'] as string;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'No autorizado'
            });
        }

        // Verificar permisos OWNER o ADMIN
        const { data: perfil, error: perfilError } = await supabase
            .from('perfiles')
            .select('organizacion_id, rol_organizacion')
            .eq('id', userId)
            .single();

        if (perfilError || !perfil?.organizacion_id) {
            return res.status(404).json({
                success: false,
                error: 'No perteneces a ninguna organización'
            });
        }

        if (!['OWNER', 'ADMIN'].includes(perfil.rol_organizacion)) {
            return res.status(403).json({
                success: false,
                error: 'Solo OWNER o ADMIN pueden invitar miembros'
            });
        }

        const { email, rol } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email es requerido'
            });
        }

        const rolAsignado = rol || 'MEMBER';

        // Verificar si ya es miembro
        const { data: existente } = await supabase
            .from('perfiles')
            .select('id')
            .eq('email', email)
            .eq('organizacion_id', perfil.organizacion_id)
            .single();

        if (existente) {
            return res.status(400).json({
                success: false,
                error: 'Este usuario ya es miembro de la organización'
            });
        }

        // TODO: Enviar email de invitación real
        // Por ahora, simular invitación pendiente

        return res.json({
            success: true,
            message: `Invitación enviada a ${email} con rol ${rolAsignado}`,
            data: {
                email,
                rol: rolAsignado,
                estado: 'PENDIENTE'
            }
        });

    } catch (error) {
        console.error('[Organization] Exception:', error);
        return res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * PUT /api/organization/members/:memberId/role
 * Cambiar rol de un miembro (solo OWNER)
 */
router.put('/members/:memberId/role', async (req: Request, res: Response) => {
    try {
        const userId = req.headers['x-user-id'] as string;
        const { memberId } = req.params;
        const { rol } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'No autorizado'
            });
        }

        // Verificar que es OWNER
        const { data: perfil, error: perfilError } = await supabase
            .from('perfiles')
            .select('organizacion_id, rol_organizacion')
            .eq('id', userId)
            .single();

        if (perfilError || perfil.rol_organizacion !== 'OWNER') {
            return res.status(403).json({
                success: false,
                error: 'Solo el OWNER puede cambiar roles'
            });
        }

        // No permitir cambiar el propio rol
        if (memberId === userId) {
            return res.status(400).json({
                success: false,
                error: 'No puedes cambiar tu propio rol'
            });
        }

        // Verificar que el miembro pertenece a la misma org
        const { data: miembro, error: miembroError } = await supabase
            .from('perfiles')
            .select('organizacion_id')
            .eq('id', memberId)
            .single();

        if (miembroError || miembro.organizacion_id !== perfil.organizacion_id) {
            return res.status(404).json({
                success: false,
                error: 'Miembro no encontrado en tu organización'
            });
        }

        const { data, error } = await supabase
            .from('perfiles')
            .update({
                rol_organizacion: rol,
                updated_at: new Date().toISOString()
            })
            .eq('id', memberId)
            .select()
            .single();

        if (error) {
            return res.status(500).json({
                success: false,
                error: 'Error al actualizar rol'
            });
        }

        return res.json({
            success: true,
            data,
            message: `Rol actualizado a ${rol}`
        });

    } catch (error) {
        console.error('[Organization] Exception:', error);
        return res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * DELETE /api/organization/members/:memberId
 * Eliminar miembro de la organización (solo OWNER)
 */
router.delete('/members/:memberId', async (req: Request, res: Response) => {
    try {
        const userId = req.headers['x-user-id'] as string;
        const { memberId } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'No autorizado'
            });
        }

        // Verificar que es OWNER
        const { data: perfil, error: perfilError } = await supabase
            .from('perfiles')
            .select('organizacion_id, rol_organizacion')
            .eq('id', userId)
            .single();

        if (perfilError || perfil.rol_organizacion !== 'OWNER') {
            return res.status(403).json({
                success: false,
                error: 'Solo el OWNER puede eliminar miembros'
            });
        }

        // No permitir eliminarse a sí mismo
        if (memberId === userId) {
            return res.status(400).json({
                success: false,
                error: 'No puedes eliminarte a ti mismo'
            });
        }

        // Desvincular de la organización (no eliminar el usuario)
        const { error } = await supabase
            .from('perfiles')
            .update({
                organizacion_id: null,
                rol_organizacion: null,
                updated_at: new Date().toISOString()
            })
            .eq('id', memberId)
            .eq('organizacion_id', perfil.organizacion_id);

        if (error) {
            return res.status(500).json({
                success: false,
                error: 'Error al eliminar miembro'
            });
        }

        return res.json({
            success: true,
            message: 'Miembro eliminado de la organización'
        });

    } catch (error) {
        console.error('[Organization] Exception:', error);
        return res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

export default router;
