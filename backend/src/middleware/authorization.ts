/**
 * Authorization Middleware - Permission-based access control
 * 
 * Resolves permissions from miembros_expediente + mandatos_expediente.
 * Returns 403 Forbidden with clear message if not authorized.
 * 
 * Implements the new Roles + Mandatos model:
 * - TipoRolUsuario: system-level role (ADMIN, COMPRADOR, VENDEDOR, TERCERO, NOTARIO, OBSERVADOR)
 * - MandatoExpediente: delegation context with explicit permissions
 */

import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';
import type { TipoRolUsuario, TipoMandato, PermisosEfectivos, MiembroExpediente, MandatoExpediente } from '../types/models.js';

// ============================================
// PERMISSION TYPES
// ============================================

export type Permission = keyof PermisosEfectivos;

// Admin emails for fallback
const ADMIN_EMAILS = ['admin@chronoflare.com', 'moisesmenendez@example.com'];

// ============================================
// BASE PERMISSIONS BY ROLE
// ============================================

const BASE_PERMISSIONS: Record<TipoRolUsuario, PermisosEfectivos> = {
    ADMIN: {
        canView: true,
        canCreateContract: true,
        canInviteUsers: true,
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
        canCreateContract: true,
        canInviteUsers: true,
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
        canCreateContract: true,
        canInviteUsers: true,
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
        canCreateContract: false,
        canInviteUsers: true,
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
        canCreateContract: true,
        canInviteUsers: false, // Determined by mandate.puede_invitar
        canUploadDocs: false,  // Determined by mandate.puede_subir_documentos
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
        canCreateContract: false,
        canInviteUsers: false,
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

// ============================================
// MEMBER AND MANDATE RESOLUTION
// ============================================

export interface AuthContext {
    userId?: string;
    userEmail?: string;
    contratoId: string;
    miembro?: MiembroExpediente;
    mandatoActivo?: MandatoExpediente;
    tipoRol: TipoRolUsuario;
    permisos: PermisosEfectivos;
    source: 'miembros_expediente' | 'contratos_partes' | 'admin_list' | 'fallback';
}

/**
 * Resolve member from miembros_expediente (new system)
 */
async function resolveMiembro(
    userId: string | undefined,
    contratoId: string
): Promise<MiembroExpediente | null> {
    if (!userId) return null;

    try {
        const { data, error } = await supabase
            .from('miembros_expediente')
            .select('*')
            .eq('contrato_id', contratoId)
            .eq('usuario_id', userId)
            .eq('estado_acceso', 'ACTIVO')
            .maybeSingle();

        if (error) {
            console.warn('[auth] Error querying miembros_expediente:', error.message);
            return null;
        }

        return data;
    } catch (e) {
        console.warn('[auth] Exception querying miembros_expediente:', e);
        return null;
    }
}

/**
 * Get active mandates for a member
 */
async function getMandatosActivos(miembroId: string): Promise<MandatoExpediente[]> {
    try {
        const { data, error } = await supabase
            .from('mandatos_expediente')
            .select('*')
            .eq('miembro_expediente_id', miembroId)
            .eq('estado_mandato', 'ACTIVO');

        if (error) {
            console.warn('[auth] Error querying mandatos_expediente:', error.message);
            return [];
        }

        return data || [];
    } catch (e) {
        console.warn('[auth] Exception querying mandatos_expediente:', e);
        return [];
    }
}

/**
 * Fallback: resolve role from legacy contratos_partes
 */
async function resolveLegacyRole(
    userId: string | undefined,
    userEmail: string | undefined,
    contratoId: string
): Promise<TipoRolUsuario | null> {
    if (!userId && !userEmail) return null;

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
        console.warn('[auth] Error resolving legacy role:', error);
    }

    return null;
}

/**
 * Full authorization context resolution
 * 
 * Priority:
 * 1. Admin email list → ADMIN
 * 2. miembros_expediente (new system) → role + mandates
 * 3. contratos_partes (legacy) → basic role
 * 4. Fallback → OBSERVADOR
 */
export async function resolveAuthContext(
    userId: string | undefined,
    userEmail: string | undefined,
    contratoId: string,
    mandatoActivoId?: string
): Promise<AuthContext> {
    // 1. Check admin list
    if (userEmail && ADMIN_EMAILS.includes(userEmail.toLowerCase())) {
        return {
            userId,
            userEmail,
            contratoId,
            tipoRol: 'ADMIN',
            permisos: BASE_PERMISSIONS.ADMIN,
            source: 'admin_list'
        };
    }

    // 2. Try new miembros_expediente system
    const miembro = await resolveMiembro(userId, contratoId);

    if (miembro) {
        const mandatos = await getMandatosActivos(miembro.id);

        // Select active mandate (user-specified or first)
        let mandatoActivo: MandatoExpediente | undefined;
        if (mandatoActivoId) {
            mandatoActivo = mandatos.find(m => m.id === mandatoActivoId);
        }
        mandatoActivo = mandatoActivo || mandatos[0];

        // Calculate effective permissions
        const basePerms = { ...BASE_PERMISSIONS[miembro.tipo_rol_usuario as TipoRolUsuario] };

        // For TERCERO, overlay mandate permissions
        if (miembro.tipo_rol_usuario === 'TERCERO' && mandatoActivo) {
            basePerms.canUploadDocs = mandatoActivo.puede_subir_documentos;
            basePerms.canInviteUsers = mandatoActivo.puede_invitar;
            basePerms.canValidateDocs = mandatoActivo.puede_validar_documentos;
            basePerms.canSign = mandatoActivo.puede_firmar;
            basePerms.canSendCommunications = mandatoActivo.puede_enviar_comunicaciones;
        }

        return {
            userId,
            userEmail,
            contratoId,
            miembro,
            mandatoActivo,
            tipoRol: miembro.tipo_rol_usuario as TipoRolUsuario,
            permisos: basePerms,
            source: 'miembros_expediente'
        };
    }

    // 3. Fallback to legacy contratos_partes
    const legacyRole = await resolveLegacyRole(userId, userEmail, contratoId);
    if (legacyRole) {
        return {
            userId,
            userEmail,
            contratoId,
            tipoRol: legacyRole,
            permisos: BASE_PERMISSIONS[legacyRole],
            source: 'contratos_partes'
        };
    }

    // 4. Default to OBSERVADOR
    return {
        userId,
        userEmail,
        contratoId,
        tipoRol: 'OBSERVADOR',
        permisos: BASE_PERMISSIONS.OBSERVADOR,
        source: 'fallback'
    };
}

// ============================================
// MIDDLEWARE
// ============================================

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
        const mandatoActivoId = req.headers['x-mandato-id'] as string | undefined;
        const contratoId = req.params.contratoId || req.params.id;

        if (!contratoId) {
            res.status(400).json({
                success: false,
                error: 'Contrato ID requerido'
            });
            return;
        }

        // Resolve full auth context
        const authContext = await resolveAuthContext(userId, userEmail, contratoId, mandatoActivoId);

        // Check permission
        if (!authContext.permisos[permission]) {
            console.log(`[auth] 403 - User ${userEmail || userId || 'anonymous'} (${authContext.tipoRol}) lacks ${permission} for contract ${contratoId}`);

            res.status(403).json({
                success: false,
                error: 'No tienes permiso para realizar esta acción',
                details: {
                    requiredPermission: permission,
                    userRole: authContext.tipoRol,
                    mandato: authContext.mandatoActivo ? {
                        id: authContext.mandatoActivo.id,
                        tipo: authContext.mandatoActivo.tipo_mandato
                    } : null,
                    message: getPermissionDeniedMessage(permission, authContext.tipoRol)
                }
            });
            return;
        }

        // Attach auth context to request for downstream use
        (req as any).authContext = authContext;
        (req as any).userRole = authContext.tipoRol;
        (req as any).userPermissions = authContext.permisos;
        (req as any).userId = userId;
        (req as any).mandatoActivo = authContext.mandatoActivo;

        next();
    };
}

/**
 * Get user-friendly message for permission denial
 */
function getPermissionDeniedMessage(permission: Permission, role: TipoRolUsuario): string {
    const messages: Record<Permission, string> = {
        canView: 'No tienes acceso a este expediente',
        canCreateContract: 'No tienes permiso para crear expedientes',
        canInviteUsers: 'No tienes permiso para invitar usuarios',
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
 * Attaches auth context to request without enforcing any permission.
 * Useful for routes that need to know the role but don't require a specific permission.
 */
export function attachRole() {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const userId = req.headers['x-user-id'] as string | undefined;
        const userEmail = req.headers['x-user-email'] as string | undefined;
        const mandatoActivoId = req.headers['x-mandato-id'] as string | undefined;
        const contratoId = req.params.contratoId || req.params.id;

        if (contratoId) {
            const authContext = await resolveAuthContext(userId, userEmail, contratoId, mandatoActivoId);
            (req as any).authContext = authContext;
            (req as any).userRole = authContext.tipoRol;
            (req as any).userPermissions = authContext.permisos;
            (req as any).mandatoActivo = authContext.mandatoActivo;
        }

        (req as any).userId = userId;
        next();
    };
}

// ============================================
// EXPORTS for backward compatibility
// ============================================

export function getPermissionsForRole(role: TipoRolUsuario): PermisosEfectivos {
    return BASE_PERMISSIONS[role] || BASE_PERMISSIONS.OBSERVADOR;
}

export function hasPermission(role: TipoRolUsuario, permission: Permission): boolean {
    return BASE_PERMISSIONS[role]?.[permission] ?? false;
}
