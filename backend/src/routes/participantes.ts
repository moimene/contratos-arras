/**
 * Participantes API Routes
 * 
 * Endpoints para gestión de miembros, mandatos e invitaciones de expediente.
 * Implementa el modelo de Roles + Mandatos definido en la especificación.
 */

import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { randomUUID } from 'crypto';
import type {
    MiembroExpediente,
    MandatoExpediente,
    InvitacionExpediente,
    TipoRolUsuario,
    TipoMandato,
    EstadoAcceso,
    EstadoMandato,
    EstadoInvitacion
} from '../types/models.js';
import {
    sealMandateAttestation,
    sealMandateRevocation,
    type SealableMandatoTipo,
    type AttestationResult
} from '../services/mandateAttestationService.js';

const router = Router();

// ============================================
// MIEMBROS DE EXPEDIENTE
// ============================================

/**
 * GET /api/contratos/:contratoId/miembros
 * Lista todos los miembros del expediente con sus mandatos
 */
router.get('/contratos/:contratoId/miembros', async (req: Request, res: Response) => {
    try {
        const { contratoId } = req.params;

        // Get members with user info
        const { data: miembros, error: miembrosError } = await supabase
            .from('miembros_expediente')
            .select(`
                *,
                usuario:perfiles!usuario_id(id, email, nombre_completo)
            `)
            .eq('contrato_id', contratoId)
            .order('created_at', { ascending: true });

        if (miembrosError) throw miembrosError;

        // Get mandates for all members
        const miembroIds = miembros?.map(m => m.id) || [];

        let mandatos: any[] = [];
        if (miembroIds.length > 0) {
            const { data: mandatosData, error: mandatosError } = await supabase
                .from('mandatos_expediente')
                .select('*')
                .in('miembro_expediente_id', miembroIds)
                .eq('estado_mandato', 'ACTIVO');

            if (mandatosError) throw mandatosError;
            mandatos = mandatosData || [];
        }

        // Combine members with their mandates
        const result = miembros?.map(m => ({
            id: m.id,
            usuario_id: m.usuario_id,
            contrato_id: m.contrato_id,
            tipo_rol_usuario: m.tipo_rol_usuario,
            estado_acceso: m.estado_acceso,
            created_at: m.created_at,
            updated_at: m.updated_at,
            usuario_email: m.usuario?.email || null,
            usuario_nombre: m.usuario?.nombre_completo || null,
            mandatos: mandatos.filter(ma => ma.miembro_expediente_id === m.id)
        })) || [];

        res.json({
            success: true,
            data: result,
            resumen: {
                total: result.length,
                activos: result.filter(m => m.estado_acceso === 'ACTIVO').length,
                pendientes: result.filter(m => m.estado_acceso === 'PENDIENTE_INVITACION').length
            }
        });
    } catch (error: any) {
        console.error('Error listando miembros:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/contratos/:contratoId/miembros
 * Añade un nuevo miembro al expediente (con mandato opcional)
 */
router.post('/contratos/:contratoId/miembros', async (req: Request, res: Response) => {
    try {
        const { contratoId } = req.params;
        const {
            usuarioId,
            tipoRolUsuario,
            estadoAcceso = 'ACTIVO',
            mandato
        } = req.body;

        const creadorId = req.headers['x-user-id'] as string | undefined;

        // Validate required fields
        if (!tipoRolUsuario) {
            return res.status(400).json({
                success: false,
                error: 'tipoRolUsuario es requerido'
            });
        }

        // Insert member
        const { data: miembro, error: miembroError } = await supabase
            .from('miembros_expediente')
            .insert({
                usuario_id: usuarioId || null,
                contrato_id: contratoId,
                tipo_rol_usuario: tipoRolUsuario,
                estado_acceso: estadoAcceso,
                creado_por_usuario_id: creadorId || null
            })
            .select()
            .single();

        if (miembroError) throw miembroError;

        // If TERCERO, create mandate
        let mandatoCreado = null;
        if (tipoRolUsuario === 'TERCERO' && mandato) {
            const { data: mandatoData, error: mandatoError } = await supabase
                .from('mandatos_expediente')
                .insert({
                    miembro_expediente_id: miembro.id,
                    tipo_mandato: mandato.tipoMandato,
                    puede_subir_documentos: mandato.puedeSubirDocumentos ?? true,
                    puede_invitar: mandato.puedeInvitar ?? false,
                    puede_validar_documentos: mandato.puedeValidarDocumentos ?? false,
                    puede_firmar: mandato.puedeFirmar ?? false,
                    puede_enviar_comunicaciones: mandato.puedeEnviarComunicaciones ?? true,
                    creado_por_usuario_id: creadorId || null
                })
                .select()
                .single();

            if (mandatoError) throw mandatoError;
            mandatoCreado = mandatoData;
        }

        // Register audit event
        try {
            const { registerEvent } = await import('../services/eventService.js');
            await registerEvent({
                contratoId,
                tipo: 'EVENTO_CUSTOM',
                payload: {
                    descripcion: `Miembro añadido: ${tipoRolUsuario}`,
                    miembro_id: miembro.id,
                    tipo_rol_usuario: tipoRolUsuario,
                    mandato: mandatoCreado ? {
                        id: mandatoCreado.id,
                        tipo: mandatoCreado.tipo_mandato
                    } : null
                },
                actorUsuarioId: creadorId
            });
        } catch (eventError) {
            console.warn('Error registrando evento de miembro:', eventError);
        }

        res.status(201).json({
            success: true,
            data: {
                miembro,
                mandato: mandatoCreado
            }
        });
    } catch (error: any) {
        console.error('Error añadiendo miembro:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PATCH /api/contratos/:contratoId/miembros/:miembroId
 * Actualiza estado de acceso de un miembro
 */
router.patch('/contratos/:contratoId/miembros/:miembroId', async (req: Request, res: Response) => {
    try {
        const { contratoId, miembroId } = req.params;
        const { estadoAcceso, motivo } = req.body;

        const actualizadorId = req.headers['x-user-id'] as string | undefined;

        const { data, error } = await supabase
            .from('miembros_expediente')
            .update({ estado_acceso: estadoAcceso })
            .eq('id', miembroId)
            .eq('contrato_id', contratoId)
            .select()
            .single();

        if (error) throw error;

        // Audit event
        try {
            const { registerEvent } = await import('../services/eventService.js');
            await registerEvent({
                contratoId,
                tipo: 'EVENTO_CUSTOM',
                payload: {
                    descripcion: `Acceso de miembro actualizado a ${estadoAcceso}`,
                    miembro_id: miembroId,
                    nuevo_estado: estadoAcceso,
                    motivo
                },
                actorUsuarioId: actualizadorId
            });
        } catch (eventError) {
            console.warn('Error registrando evento:', eventError);
        }

        res.json({ success: true, data });
    } catch (error: any) {
        console.error('Error actualizando miembro:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// MANDATOS
// ============================================

/**
 * POST /api/contratos/:contratoId/miembros/:miembroId/mandatos
 * Añade un mandato a un miembro existente
 */
router.post('/contratos/:contratoId/miembros/:miembroId/mandatos', async (req: Request, res: Response) => {
    try {
        const { contratoId, miembroId } = req.params;
        const {
            tipoMandato,
            puedeSubirDocumentos = false,
            puedeInvitar = false,
            puedeValidarDocumentos = false,
            puedeFirmar = false,
            puedeEnviarComunicaciones = true
        } = req.body;

        const creadorId = req.headers['x-user-id'] as string | undefined;

        if (!tipoMandato) {
            return res.status(400).json({
                success: false,
                error: 'tipoMandato es requerido'
            });
        }

        // Verify member exists and belongs to this contract
        const { data: miembro, error: miembroError } = await supabase
            .from('miembros_expediente')
            .select('id, tipo_rol_usuario')
            .eq('id', miembroId)
            .eq('contrato_id', contratoId)
            .single();

        if (miembroError || !miembro) {
            return res.status(404).json({
                success: false,
                error: 'Miembro no encontrado en este expediente'
            });
        }

        // Insert mandate
        const { data: mandato, error: mandatoError } = await supabase
            .from('mandatos_expediente')
            .insert({
                miembro_expediente_id: miembroId,
                tipo_mandato: tipoMandato,
                puede_subir_documentos: puedeSubirDocumentos,
                puede_invitar: puedeInvitar,
                puede_validar_documentos: puedeValidarDocumentos,
                puede_firmar: puedeFirmar,
                puede_enviar_comunicaciones: puedeEnviarComunicaciones,
                creado_por_usuario_id: creadorId || null
            })
            .select()
            .single();

        if (mandatoError) throw mandatoError;

        res.status(201).json({ success: true, data: mandato });
    } catch (error: any) {
        console.error('Error creando mandato:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PATCH /api/mandatos/:mandatoId/revocar
 * Revoca un mandato (con sellado QTSP)
 */
router.patch('/mandatos/:mandatoId/revocar', async (req: Request, res: Response) => {
    try {
        const { mandatoId } = req.params;
        const { motivo } = req.body;
        const revocadorId = req.headers['x-user-id'] as string | undefined;

        // First get the mandate to know contrato_id and tipo
        const { data: existingMandato, error: findError } = await supabase
            .from('mandatos_expediente')
            .select(`
                *,
                miembro:miembros_expediente(contrato_id, usuario_id, tipo_rol_usuario)
            `)
            .eq('id', mandatoId)
            .single();

        if (findError || !existingMandato) {
            return res.status(404).json({
                success: false,
                error: 'Mandato no encontrado'
            });
        }

        if (existingMandato.estado_mandato === 'REVOCADO') {
            return res.status(400).json({
                success: false,
                error: 'Este mandato ya está revocado'
            });
        }

        const contratoId = existingMandato.miembro?.contrato_id;
        const mandatoTipo = existingMandato.tipo_mandato as SealableMandatoTipo;

        // STRICT RULE: Seal revocation with QTSP before persisting
        let attestationResult: AttestationResult | null = null;

        if (contratoId && ['PARTE_COMPRADORA', 'PARTE_VENDEDORA', 'AMBAS_PARTES', 'NOTARIA'].includes(mandatoTipo)) {
            try {
                // Get revoker info
                const { data: revocador } = await supabase
                    .from('perfiles')
                    .select('id, email, nombre_completo')
                    .eq('id', revocadorId)
                    .single();

                attestationResult = await sealMandateRevocation(
                    contratoId,
                    mandatoId,
                    mandatoTipo,
                    revocadorId || 'unknown',
                    existingMandato.miembro?.tipo_rol_usuario || 'COMPRADOR',
                    {
                        ip: req.ip,
                        userAgent: req.headers['user-agent'] as string
                    }
                );

                console.log(`✓ Mandate revocation sealed: ${attestationResult.qtspTime}`);
            } catch (sealError: any) {
                console.error('QTSP sealing failed for revocation:', sealError.message);
                return res.status(503).json({
                    success: false,
                    error: 'No se pudo emitir el sello cualificado para la revocación. Reintenta más tarde.',
                    qtspError: true
                });
            }
        }

        // Now persist the revocation
        const { data, error } = await supabase
            .from('mandatos_expediente')
            .update({
                estado_mandato: 'REVOCADO',
                revocado_por_usuario_id: revocadorId || null,
                fecha_revocacion: new Date().toISOString(),
                motivo_revocacion: motivo
            })
            .eq('id', mandatoId)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data,
            attestation: attestationResult ? {
                qtspProvider: attestationResult.qtspProvider,
                qtspTime: attestationResult.qtspTime,
                hashSha256: attestationResult.hashSha256
            } : null
        });
    } catch (error: any) {
        console.error('Error revocando mandato:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// INVITACIONES
// ============================================

/**
 * GET /api/contratos/:contratoId/invitaciones
 * Lista todas las invitaciones del expediente
 */
router.get('/contratos/:contratoId/invitaciones', async (req: Request, res: Response) => {
    try {
        const { contratoId } = req.params;

        const { data, error } = await supabase
            .from('invitaciones_expediente')
            .select(`
                *,
                creador:perfiles!creado_por_usuario_id(email, nombre_completo)
            `)
            .eq('contrato_id', contratoId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: data || [],
            resumen: {
                total: data?.length || 0,
                pendientes: data?.filter(i => ['CREADA', 'ENVIADA', 'VISTA'].includes(i.estado)).length || 0,
                aceptadas: data?.filter(i => i.estado === 'ACEPTADA').length || 0
            }
        });
    } catch (error: any) {
        console.error('Error listando invitaciones:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/contratos/:contratoId/invitaciones
 * Crea una nueva invitación
 */
router.post('/contratos/:contratoId/invitaciones', async (req: Request, res: Response) => {
    try {
        const { contratoId } = req.params;
        const {
            emailDestino,
            rolInvitado,
            tipoMandato,
            permisosMandato,
            fechaCaducidad,
            mensajeOpcional
        } = req.body;

        const creadorId = req.headers['x-user-id'] as string | undefined;

        if (!rolInvitado) {
            return res.status(400).json({
                success: false,
                error: 'rolInvitado es requerido'
            });
        }

        // TERCERO requires tipoMandato
        if (rolInvitado === 'TERCERO' && !tipoMandato) {
            return res.status(400).json({
                success: false,
                error: 'tipoMandato es requerido para rol TERCERO'
            });
        }

        const token = randomUUID();

        const { data: invitacion, error } = await supabase
            .from('invitaciones_expediente')
            .insert({
                contrato_id: contratoId,
                email_destino: emailDestino || null,
                rol_invitado: rolInvitado,
                tipo_mandato: tipoMandato || null,
                permisos_mandato: permisosMandato || {},
                token,
                fecha_caducidad: fechaCaducidad || null,
                estado: 'CREADA',
                mensaje_opcional: mensajeOpcional || null,
                creado_por_usuario_id: creadorId || null
            })
            .select()
            .single();

        if (error) throw error;

        // Generate invitation URL
        const invitationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invitacion/${token}`;

        res.status(201).json({
            success: true,
            data: {
                ...invitacion,
                invitationUrl
            }
        });
    } catch (error: any) {
        console.error('Error creando invitación:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/invitaciones/:token/aceptar
 * Acepta una invitación con token
 */
router.post('/invitaciones/:token/aceptar', async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        const usuarioId = req.headers['x-user-id'] as string | undefined;

        if (!usuarioId) {
            return res.status(401).json({
                success: false,
                error: 'Debes estar autenticado para aceptar una invitación'
            });
        }

        // Find invitation
        const { data: invitacion, error: findError } = await supabase
            .from('invitaciones_expediente')
            .select('*')
            .eq('token', token)
            .single();

        if (findError || !invitacion) {
            return res.status(404).json({
                success: false,
                error: 'Invitación no encontrada'
            });
        }

        // Check state
        if (invitacion.estado === 'ACEPTADA') {
            return res.status(400).json({
                success: false,
                error: 'Esta invitación ya fue aceptada'
            });
        }

        if (['EXPIRADA', 'REVOCADA'].includes(invitacion.estado)) {
            return res.status(400).json({
                success: false,
                error: `Esta invitación está ${invitacion.estado.toLowerCase()}`
            });
        }

        // Check expiration
        if (invitacion.fecha_caducidad && new Date(invitacion.fecha_caducidad) < new Date()) {
            await supabase
                .from('invitaciones_expediente')
                .update({ estado: 'EXPIRADA' })
                .eq('id', invitacion.id);

            return res.status(400).json({
                success: false,
                error: 'Esta invitación ha expirado'
            });
        }

        // Create member
        const { data: miembro, error: miembroError } = await supabase
            .from('miembros_expediente')
            .insert({
                usuario_id: usuarioId,
                contrato_id: invitacion.contrato_id,
                tipo_rol_usuario: invitacion.rol_invitado,
                estado_acceso: 'ACTIVO',
                creado_por_usuario_id: invitacion.creado_por_usuario_id
            })
            .select()
            .single();

        if (miembroError) {
            // Check if user is already a member
            if (miembroError.code === '23505') {
                return res.status(400).json({
                    success: false,
                    error: 'Ya eres miembro de este expediente'
                });
            }
            throw miembroError;
        }

        // Create mandate if TERCERO (with QTSP sealing)
        let mandato = null;
        let attestationResult: AttestationResult | null = null;

        if (invitacion.rol_invitado === 'TERCERO' && invitacion.tipo_mandato) {
            const permisos = invitacion.permisos_mandato || {};
            const mandatoId = randomUUID();

            // STRICT RULE: Seal mandate with QTSP before persisting
            // If sealing fails, mandate is NOT created
            const sealableTipo = invitacion.tipo_mandato as SealableMandatoTipo;

            if (['PARTE_COMPRADORA', 'PARTE_VENDEDORA', 'AMBAS_PARTES', 'NOTARIA'].includes(invitacion.tipo_mandato)) {
                try {
                    // Get otorgante info (the invitation creator)
                    const { data: creador } = await supabase
                        .from('perfiles')
                        .select('id, email, nombre_completo')
                        .eq('id', invitacion.creado_por_usuario_id)
                        .single();

                    // Get mandatario info (accepting user)
                    const { data: mandatario } = await supabase
                        .from('perfiles')
                        .select('id, email, nombre_completo')
                        .eq('id', usuarioId)
                        .single();

                    // Get contrato info
                    const { data: contrato } = await supabase
                        .from('contratos')
                        .select('numero_expediente')
                        .eq('id', invitacion.contrato_id)
                        .single();

                    attestationResult = await sealMandateAttestation(
                        {
                            contratoId: invitacion.contrato_id,
                            mandatoId,
                            mandatoTipo: sealableTipo,
                            eventType: 'MANDATO_OTORGADO',
                            permissions: {
                                puedeSubirDocumentos: permisos.puedeSubirDocumentos ?? true,
                                puedeInvitar: permisos.puedeInvitar ?? false,
                                puedeValidarDocumentos: permisos.puedeValidarDocumentos ?? false,
                                puedeFirmar: permisos.puedeFirmar ?? false
                            },
                            otorgante: {
                                usuarioId: invitacion.creado_por_usuario_id,
                                rolSistema: 'VENDEDOR', // Default, should come from member lookup
                                displayName: creador?.nombre_completo || creador?.email
                            },
                            mandatario: {
                                usuarioId,
                                email: mandatario?.email,
                                displayName: mandatario?.nombre_completo,
                                rolSistema: 'TERCERO'
                            },
                            invitacionId: invitacion.id,
                            context: {
                                ip: req.ip,
                                userAgent: req.headers['user-agent'] as string,
                                uiSurface: 'InviteAcceptation'
                            }
                        },
                        {
                            NUMERO_EXPEDIENTE: contrato?.numero_expediente || invitacion.contrato_id,
                            NOMBRE_ASESOR: mandatario?.nombre_completo || 'Asesor',
                            SI_PUEDE_SUBIR_DOCS: (permisos.puedeSubirDocumentos ?? true) ? 'true' : 'false',
                            SI_PUEDE_INVITAR: (permisos.puedeInvitar ?? false) ? 'true' : 'false',
                            SI_PUEDE_VALIDAR: (permisos.puedeValidarDocumentos ?? false) ? 'true' : 'false',
                            SI_PUEDE_FIRMAR: (permisos.puedeFirmar ?? false) ? 'true' : 'false'
                        }
                    );

                    console.log(`✓ Mandate sealed with QTSP: ${attestationResult.qtspTime}`);
                } catch (sealError: any) {
                    console.error('QTSP sealing failed:', sealError.message);
                    return res.status(503).json({
                        success: false,
                        error: 'No se pudo emitir el sello cualificado. El mandato no ha sido creado. Reintenta más tarde.',
                        qtspError: true
                    });
                }
            }

            // Now persist the mandate (QTSP seal already captured)
            const { data: mandatoData, error: mandatoError } = await supabase
                .from('mandatos_expediente')
                .insert({
                    id: mandatoId,
                    miembro_expediente_id: miembro.id,
                    tipo_mandato: invitacion.tipo_mandato,
                    puede_subir_documentos: permisos.puedeSubirDocumentos ?? true,
                    puede_invitar: permisos.puedeInvitar ?? false,
                    puede_validar_documentos: permisos.puedeValidarDocumentos ?? false,
                    puede_firmar: permisos.puedeFirmar ?? false,
                    puede_enviar_comunicaciones: permisos.puedeEnviarComunicaciones ?? true,
                    creado_por_usuario_id: invitacion.creado_por_usuario_id
                })
                .select()
                .single();

            if (mandatoError) throw mandatoError;
            mandato = mandatoData;
        }

        // Update invitation state
        await supabase
            .from('invitaciones_expediente')
            .update({
                estado: 'ACEPTADA',
                aceptado_por_usuario_id: usuarioId,
                fecha_aceptacion: new Date().toISOString()
            })
            .eq('id', invitacion.id);

        res.json({
            success: true,
            data: {
                miembro,
                mandato,
                contratoId: invitacion.contrato_id,
                attestation: attestationResult ? {
                    qtspProvider: attestationResult.qtspProvider,
                    qtspTime: attestationResult.qtspTime,
                    hashSha256: attestationResult.hashSha256
                } : null
            },
            message: '¡Bienvenido al expediente!'
        });
    } catch (error: any) {
        console.error('Error aceptando invitación:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PATCH /api/invitaciones/:invitacionId/revocar
 * Revoca una invitación pendiente
 */
router.patch('/invitaciones/:invitacionId/revocar', async (req: Request, res: Response) => {
    try {
        const { invitacionId } = req.params;

        const { data, error } = await supabase
            .from('invitaciones_expediente')
            .update({ estado: 'REVOCADA' })
            .eq('id', invitacionId)
            .in('estado', ['CREADA', 'ENVIADA', 'VISTA'])
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error: any) {
        console.error('Error revocando invitación:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
