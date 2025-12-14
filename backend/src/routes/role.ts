/**
 * Role Endpoint - GET /api/contracts/:id/role
 * 
 * Determines the effective role of the current user for a specific contract.
 * Resolves: user.email → partes.email → contratos_partes.rol_en_contrato → TipoRolUsuario
 */

import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

// Valid role types
type TipoRolUsuario = 'ADMIN' | 'VENDEDOR' | 'COMPRADOR' | 'NOTARIO' | 'TERCERO' | 'OBSERVADOR';

// Admin emails (could be moved to env/config)
const ADMIN_EMAILS = [
    'admin@chronoflare.com',
    'moisesmenendez@example.com'
];

// Map RolParte → TipoRolUsuario
function mapRolParteToTipoRolUsuario(rolEnContrato: string): TipoRolUsuario {
    switch (rolEnContrato.toUpperCase()) {
        case 'COMPRADOR':
            return 'COMPRADOR';
        case 'VENDEDOR':
            return 'VENDEDOR';
        case 'INTERMEDIARIO':
            return 'TERCERO';
        default:
            return 'OBSERVADOR';
    }
}

/**
 * GET /api/contracts/:id/role
 * 
 * Returns the effective role and permissions for the authenticated user on this contract.
 */
router.get('/:id/role', async (req: Request, res: Response): Promise<void> => {
    try {
        const contratoId = req.params.id;
        const userId = req.headers['x-user-id'] as string;
        const userEmail = req.headers['x-user-email'] as string;

        // If no user context, return OBSERVADOR (anonymous)
        if (!userId && !userEmail) {
            res.json({
                success: true,
                data: {
                    role: 'OBSERVADOR' as TipoRolUsuario,
                    source: 'anonymous',
                    permissions: getPermissionsForRole('OBSERVADOR')
                }
            });
            return;
        }

        // Check if user is admin by email
        if (userEmail && ADMIN_EMAILS.includes(userEmail.toLowerCase())) {
            res.json({
                success: true,
                data: {
                    role: 'ADMIN' as TipoRolUsuario,
                    source: 'admin_list',
                    permissions: getPermissionsForRole('ADMIN')
                }
            });
            return;
        }

        // Check if user is linked to this contract via partes
        const { data: parteLink, error } = await supabase
            .from('contratos_partes')
            .select(`
                rol_en_contrato,
                parte:partes!inner(
                    id,
                    email,
                    usuario_id
                )
            `)
            .eq('contrato_id', contratoId)
            .or(`parte.email.eq.${userEmail},parte.usuario_id.eq.${userId || 'null'}`)
            .maybeSingle();

        if (error) {
            console.error('[role] Supabase error:', error);
            // On error, default to OBSERVADOR for safety
            res.json({
                success: true,
                data: {
                    role: 'OBSERVADOR' as TipoRolUsuario,
                    source: 'error_fallback',
                    permissions: getPermissionsForRole('OBSERVADOR')
                }
            });
            return;
        }

        if (parteLink) {
            const role = mapRolParteToTipoRolUsuario(parteLink.rol_en_contrato);
            res.json({
                success: true,
                data: {
                    role,
                    source: 'contratos_partes',
                    parteId: (parteLink.parte as any)?.id,
                    permissions: getPermissionsForRole(role)
                }
            });
            return;
        }

        // User not linked to this contract
        res.json({
            success: true,
            data: {
                role: 'OBSERVADOR' as TipoRolUsuario,
                source: 'not_participant',
                permissions: getPermissionsForRole('OBSERVADOR')
            }
        });

    } catch (error) {
        console.error('[role] Error:', error);
        res.status(500).json({
            success: false,
            error: 'Error al determinar rol'
        });
    }
});

/**
 * Get permissions for a role
 */
function getPermissionsForRole(role: TipoRolUsuario) {
    const basePermissions = {
        canView: true,
        canUploadDocs: false,
        canValidateDocs: false,
        canRejectDocs: false,
        canDeleteDocs: false,
        canSendCommunications: false,
        canGenerateCertificate: false,
        canCreateNotaryAppointment: false,
        canSign: false
    };

    switch (role) {
        case 'ADMIN':
            return {
                ...basePermissions,
                canUploadDocs: true,
                canValidateDocs: true,
                canRejectDocs: true,
                canDeleteDocs: true,
                canSendCommunications: true,
                canGenerateCertificate: true,
                canCreateNotaryAppointment: true,
                canSign: true
            };

        case 'VENDEDOR':
        case 'COMPRADOR':
            return {
                ...basePermissions,
                canUploadDocs: true,
                canSendCommunications: true,
                canSign: true
            };

        case 'NOTARIO':
            return {
                ...basePermissions,
                canValidateDocs: true,
                canRejectDocs: true,
                canSendCommunications: true,
                canGenerateCertificate: true,
                canCreateNotaryAppointment: true
            };

        case 'TERCERO':
            return {
                ...basePermissions,
                canUploadDocs: true,
                canSendCommunications: true
            };

        case 'OBSERVADOR':
        default:
            return basePermissions;
    }
}

export default router;
