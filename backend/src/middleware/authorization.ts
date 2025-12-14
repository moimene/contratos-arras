/**
 * Authorization Middleware - Permission-based access control
 * 
 * Checks if the current user has the required permission for the action.
 * Returns 403 Forbidden with clear message if not authorized.
 */

import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';

// Permission types (from role.ts)
export type Permission =
    | 'canView'
    | 'canUploadDocs'
    | 'canValidateDocs'
    | 'canRejectDocs'
    | 'canDeleteDocs'
    | 'canSendCommunications'
    | 'canGenerateCertificate'
    | 'canCreateNotaryAppointment'
    | 'canSign';

export type TipoRolUsuario = 'ADMIN' | 'VENDEDOR' | 'COMPRADOR' | 'NOTARIO' | 'TERCERO' | 'OBSERVADOR';

// Admin emails (same as role.ts)
const ADMIN_EMAILS = ['admin@chronoflare.com', 'moisesmenendez@example.com'];

// Permission matrix by role
const ROLE_PERMISSIONS: Record<TipoRolUsuario, Record<Permission, boolean>> = {
    ADMIN: {
        canView: true,
        canUploadDocs: true,
        canValidateDocs: true,
        canRejectDocs: true,
        canDeleteDocs: true,
        canSendCommunications: true,
        canGenerateCertificate: true,
        canCreateNotaryAppointment: true,
        canSign: true
    },
    VENDEDOR: {
        canView: true,
        canUploadDocs: true,
        canValidateDocs: false,
        canRejectDocs: false,
        canDeleteDocs: false,
        canSendCommunications: true,
        canGenerateCertificate: false,
        canCreateNotaryAppointment: false,
        canSign: true
    },
    COMPRADOR: {
        canView: true,
        canUploadDocs: true,
        canValidateDocs: false,
        canRejectDocs: false,
        canDeleteDocs: false,
        canSendCommunications: true,
        canGenerateCertificate: false,
        canCreateNotaryAppointment: false,
        canSign: true
    },
    NOTARIO: {
        canView: true,
        canUploadDocs: false,
        canValidateDocs: true,
        canRejectDocs: true,
        canDeleteDocs: false,
        canSendCommunications: true,
        canGenerateCertificate: true,
        canCreateNotaryAppointment: true,
        canSign: false
    },
    TERCERO: {
        canView: true,
        canUploadDocs: true,
        canValidateDocs: false,
        canRejectDocs: false,
        canDeleteDocs: false,
        canSendCommunications: true,
        canGenerateCertificate: false,
        canCreateNotaryAppointment: false,
        canSign: false
    },
    OBSERVADOR: {
        canView: true,
        canUploadDocs: false,
        canValidateDocs: false,
        canRejectDocs: false,
        canDeleteDocs: false,
        canSendCommunications: false,
        canGenerateCertificate: false,
        canCreateNotaryAppointment: false,
        canSign: false
    }
};

/**
 * Resolve user role for a specific contract
 */
async function resolveUserRole(
    userId: string | undefined,
    userEmail: string | undefined,
    contratoId: string
): Promise<TipoRolUsuario> {
    // No user context = OBSERVADOR
    if (!userId && !userEmail) {
        return 'OBSERVADOR';
    }

    // Check admin list
    if (userEmail && ADMIN_EMAILS.includes(userEmail.toLowerCase())) {
        return 'ADMIN';
    }

    // Check if user is linked to this contract
    try {
        const { data: parteLink } = await supabase
            .from('contratos_partes')
            .select(`
                rol_en_contrato,
                parte:partes!inner(email, usuario_id)
            `)
            .eq('contrato_id', contratoId)
            .or(`parte.email.eq.${userEmail},parte.usuario_id.eq.${userId || 'null'}`)
            .maybeSingle();

        if (parteLink) {
            const rol = parteLink.rol_en_contrato.toUpperCase();
            if (rol === 'COMPRADOR') return 'COMPRADOR';
            if (rol === 'VENDEDOR') return 'VENDEDOR';
            if (rol === 'INTERMEDIARIO') return 'TERCERO';
        }
    } catch (error) {
        console.error('[auth] Error resolving role:', error);
    }

    return 'OBSERVADOR';
}

/**
 * Get permissions for a role
 */
export function getPermissionsForRole(role: TipoRolUsuario): Record<Permission, boolean> {
    return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.OBSERVADOR;
}

/**
 * Check if role has permission
 */
export function hasPermission(role: TipoRolUsuario, permission: Permission): boolean {
    return ROLE_PERMISSIONS[role]?.[permission] ?? false;
}

/**
 * Middleware factory: requirePermission
 * 
 * Creates a middleware that checks if the current user has the required permission.
 * Returns 403 with clear message if not authorized.
 * 
 * Usage:
 *   router.post('/documents', requirePermission('canUploadDocs'), handler);
 */
export function requirePermission(permission: Permission) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const userId = req.headers['x-user-id'] as string | undefined;
        const userEmail = req.headers['x-user-email'] as string | undefined;
        const contratoId = req.params.contratoId || req.params.id;

        if (!contratoId) {
            res.status(400).json({
                success: false,
                error: 'Contrato ID requerido'
            });
            return;
        }

        // Resolve role for this user/contract
        const role = await resolveUserRole(userId, userEmail, contratoId);
        const permissions = getPermissionsForRole(role);

        // Check permission
        if (!permissions[permission]) {
            console.log(`[auth] 403 - User ${userEmail || userId || 'anonymous'} (${role}) lacks ${permission} for contract ${contratoId}`);

            res.status(403).json({
                success: false,
                error: 'No tienes permiso para realizar esta acción',
                details: {
                    requiredPermission: permission,
                    userRole: role,
                    message: getPermissionDeniedMessage(permission, role)
                }
            });
            return;
        }

        // Attach role and permissions to request for downstream use
        (req as any).userRole = role;
        (req as any).userPermissions = permissions;
        (req as any).userId = userId;

        next();
    };
}

/**
 * Get user-friendly message for permission denial
 */
function getPermissionDeniedMessage(permission: Permission, role: TipoRolUsuario): string {
    const messages: Record<Permission, string> = {
        canView: 'No tienes acceso a este expediente',
        canUploadDocs: 'Solo participantes pueden subir documentos',
        canValidateDocs: 'Solo ADMIN o NOTARIO pueden validar documentos',
        canRejectDocs: 'Solo ADMIN o NOTARIO pueden rechazar documentos',
        canDeleteDocs: 'Solo ADMIN puede eliminar documentos',
        canSendCommunications: 'Solo participantes pueden enviar comunicaciones',
        canGenerateCertificate: 'Solo ADMIN o NOTARIO puede generar certificados',
        canCreateNotaryAppointment: 'Solo NOTARIO puede crear citas notariales',
        canSign: 'Solo las partes del contrato pueden firmar'
    };

    return messages[permission] || 'Acción no permitida para tu rol';
}

/**
 * Optional middleware: attachRole
 * 
 * Attaches role and permissions to request without enforcing any permission.
 * Useful for routes that need to know the role but don't require a specific permission.
 */
export function attachRole() {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const userId = req.headers['x-user-id'] as string | undefined;
        const userEmail = req.headers['x-user-email'] as string | undefined;
        const contratoId = req.params.contratoId || req.params.id;

        if (contratoId) {
            const role = await resolveUserRole(userId, userEmail, contratoId);
            (req as any).userRole = role;
            (req as any).userPermissions = getPermissionsForRole(role);
        }

        (req as any).userId = userId;
        next();
    };
}
