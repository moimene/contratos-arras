/**
 * Claim Routes - Adopción de Contratos Huérfanos
 * 
 * Permite a usuarios registrados reclamar contratos creados
 * antes de tener cuenta (flujo Freemium → Premium).
 * 
 * @module claimRoutes
 */

import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { certifiedEventBus } from '../services/CertifiedEventBus.js';

const router = Router();

/**
 * POST /api/contracts/claim
 * 
 * Reclama un contrato huérfano usando el claim token.
 * 
 * Body:
 * - contratoId: UUID del contrato
 * - claimToken: UUID token de adopción (secreto)
 * 
 * El usuario debe estar autenticado (userId en headers o session).
 * 
 * Flujo:
 * 1. Validar claimToken
 * 2. Verificar que el contrato no tiene organizacion_id
 * 3. Asignar organizacion_id del usuario actual
 * 4. Invalidar claim_token (SET NULL)
 * 5. Registrar evento certificado
 */
router.post('/claim', async (req: Request, res: Response) => {
    try {
        const { contratoId, claimToken } = req.body;

        // Validación básica
        if (!contratoId || !claimToken) {
            return res.status(400).json({
                success: false,
                error: 'contratoId and claimToken are required'
            });
        }

        // Obtener userId del header (en producción vendría de auth middleware)
        // Por ahora aceptamos userId en el body o header para desarrollo
        const userId = req.body.userId || req.headers['x-user-id'] as string;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required. Provide userId in body or x-user-id header.'
            });
        }

        // 1. Buscar contrato con ese claim_token
        const { data: contrato, error: fetchError } = await supabase
            .from('contratos_arras')
            .select('id, organizacion_id, claim_token, numero_expediente')
            .eq('id', contratoId)
            .single();

        if (fetchError || !contrato) {
            return res.status(404).json({
                success: false,
                error: 'Contract not found'
            });
        }

        // 2. Verificar claim_token
        if (contrato.claim_token !== claimToken) {
            return res.status(403).json({
                success: false,
                error: 'Invalid claim token'
            });
        }

        // 3. Verificar que no está ya reclamado
        if (contrato.organizacion_id !== null) {
            return res.status(409).json({
                success: false,
                error: 'Contract already claimed by another organization'
            });
        }

        // 4. Obtener organizacion_id del perfil del usuario
        const { data: perfil, error: perfilError } = await supabase
            .from('perfiles')
            .select('organizacion_id, email, nombre_completo')
            .eq('id', userId)
            .single();

        if (perfilError || !perfil) {
            return res.status(404).json({
                success: false,
                error: 'User profile not found. User must be fully registered.'
            });
        }

        if (!perfil.organizacion_id) {
            return res.status(400).json({
                success: false,
                error: 'User has no organization. Profile incomplete.'
            });
        }

        // 5. Actualizar contrato: asignar org, created_by, invalidar token
        const { error: updateError } = await supabase
            .from('contratos_arras')
            .update({
                organizacion_id: perfil.organizacion_id,
                created_by: userId,
                claim_token: null // Invalidar token
            })
            .eq('id', contratoId);

        if (updateError) {
            console.error('[Claim] Update error:', updateError);
            return res.status(500).json({
                success: false,
                error: 'Failed to claim contract'
            });
        }

        // 6. Registrar evento certificado
        await certifiedEventBus.registrarEvento({
            contratoId,
            tipo: 'CONTRATO_RECLAMADO',
            payload: {
                organizacion_id: perfil.organizacion_id,
                usuario_email: perfil.email,
                usuario_nombre: perfil.nombre_completo,
                numero_expediente: contrato.numero_expediente
            },
            actorUsuarioId: userId,
            ipAddress: req.ip || req.headers['x-forwarded-for'] as string,
            userAgent: req.headers['user-agent']
        });

        // 7. (Opcional) Añadir al usuario como participante ADMIN
        const { error: participantError } = await supabase
            .from('participantes_contrato')
            .upsert({
                contrato_id: contratoId,
                usuario_id: userId,
                email_invitado: perfil.email,
                rol: 'ADMIN',
                estado_invitacion: 'ACEPTADA',
                fecha_respuesta: new Date().toISOString()
            }, {
                onConflict: 'contrato_id,email_invitado',
                ignoreDuplicates: true
            });

        console.log(`[Claim] Contract ${contratoId} claimed by user ${userId}`);

        return res.json({
            success: true,
            data: {
                contratoId,
                organizacionId: perfil.organizacion_id,
                message: 'Contract successfully claimed and linked to your organization'
            }
        });

    } catch (error) {
        console.error('[Claim] Error:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});

/**
 * GET /api/contracts/:id/claim-status
 * 
 * Verifica si un contrato puede ser reclamado (huérfano con token válido)
 */
router.get('/:id/claim-status', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const { data: contrato, error } = await supabase
            .from('contratos_arras')
            .select('id, organizacion_id, claim_token, numero_expediente, created_at')
            .eq('id', id)
            .single();

        if (error || !contrato) {
            return res.status(404).json({
                success: false,
                error: 'Contract not found'
            });
        }

        const isClaimable = contrato.organizacion_id === null && contrato.claim_token !== null;

        return res.json({
            success: true,
            data: {
                contratoId: contrato.id,
                numeroExpediente: contrato.numero_expediente,
                isClaimable,
                isClaimed: contrato.organizacion_id !== null,
                createdAt: contrato.created_at
            }
        });

    } catch (error) {
        console.error('[Claim Status] Error:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});

export default router;
