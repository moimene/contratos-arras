/**
 * Profile Routes - User Profile Management
 * 
 * Endpoints for managing user profile and organization
 */

import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

/**
 * GET /api/profile
 * Obtener perfil del usuario actual
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const userId = req.headers['x-user-id'] as string;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'No autorizado - ID de usuario requerido'
            });
        }

        // Obtener perfil con organización
        const { data: perfil, error } = await supabase
            .from('perfiles')
            .select(`
                id,
                email,
                nombre_completo,
                avatar_url,
                rol_organizacion,
                preferencias,
                created_at,
                updated_at,
                organizacion:organizaciones (
                    id,
                    nombre,
                    nif,
                    tipo,
                    plan,
                    config
                )
            `)
            .eq('id', userId)
            .single();

        if (error) {
            console.error('[Profile] Error fetching profile:', error);

            // Si no existe el perfil, intentar crearlo
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    error: 'Perfil no encontrado. El perfil se crea automáticamente al registrarse.',
                    code: 'PROFILE_NOT_FOUND'
                });
            }

            return res.status(500).json({
                success: false,
                error: 'Error al obtener perfil'
            });
        }

        return res.json({
            success: true,
            data: perfil
        });

    } catch (error) {
        console.error('[Profile] Exception:', error);
        return res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * PUT /api/profile
 * Actualizar perfil del usuario actual
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

        const { nombre_completo, avatar_url, preferencias } = req.body;

        const updateData: any = {
            updated_at: new Date().toISOString()
        };

        if (nombre_completo !== undefined) updateData.nombre_completo = nombre_completo;
        if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
        if (preferencias !== undefined) updateData.preferencias = preferencias;

        const { data, error } = await supabase
            .from('perfiles')
            .update(updateData)
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            console.error('[Profile] Error updating:', error);
            return res.status(500).json({
                success: false,
                error: 'Error al actualizar perfil'
            });
        }

        return res.json({
            success: true,
            data,
            message: 'Perfil actualizado correctamente'
        });

    } catch (error) {
        console.error('[Profile] Exception:', error);
        return res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/profile/organization
 * Obtener organización del usuario actual
 */
router.get('/organization', async (req: Request, res: Response) => {
    try {
        const userId = req.headers['x-user-id'] as string;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'No autorizado'
            });
        }

        // Primero obtener el perfil para ver la organización
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

        // Obtener organización con miembros
        const { data: org, error: orgError } = await supabase
            .from('organizaciones')
            .select(`
                *,
                miembros:perfiles (
                    id,
                    email,
                    nombre_completo,
                    avatar_url,
                    rol_organizacion,
                    created_at
                )
            `)
            .eq('id', perfil.organizacion_id)
            .single();

        if (orgError) {
            console.error('[Profile] Error fetching org:', orgError);
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
        console.error('[Profile] Exception:', error);
        return res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

export default router;
