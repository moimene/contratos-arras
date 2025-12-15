import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { v4 as uuid } from 'uuid';
import { nowIso } from '../utils/time.js';
import { registerEvent } from '../services/eventService.js';
import { setEstado } from '../repositories/contratos.repo.js';

const router = Router();

interface RatificacionBody {
    documentoId: string;
    documentoSha256: string;
    textId?: string;
    textVersion?: string;
}

/**
 * GET /api/contratos/:contratoId/ratificaciones
 * Lista las ratificaciones de un contrato externamente firmado
 */
router.get('/:contratoId/ratificaciones', async (req: Request, res: Response) => {
    try {
        const { contratoId } = req.params;

        const { data, error } = await supabase
            .from('ratificaciones_contrato')
            .select(`
                id,
                contrato_id,
                documento_id,
                documento_sha256,
                rol_parte,
                usuario_id,
                text_id,
                text_version,
                sello_id,
                fecha_ratificacion,
                perfiles:usuario_id (
                    email,
                    nombre_completo
                )
            `)
            .eq('contrato_id', contratoId)
            .order('fecha_ratificacion', { ascending: true });

        if (error) throw error;

        // Count ratifications
        const ratificacionesPorRol = {
            COMPRADOR: data?.find(r => r.rol_parte === 'COMPRADOR') || null,
            VENDEDOR: data?.find(r => r.rol_parte === 'VENDEDOR') || null
        };

        const completadas = [ratificacionesPorRol.COMPRADOR, ratificacionesPorRol.VENDEDOR]
            .filter(Boolean).length;

        res.json({
            success: true,
            data: {
                ratificaciones: data || [],
                resumen: {
                    completadas,
                    requeridas: 2,
                    todasCompletas: completadas >= 2,
                    ...ratificacionesPorRol
                }
            }
        });
    } catch (error: any) {
        console.error('Error listando ratificaciones:', error);
        res.status(400).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/contratos/:contratoId/ratificaciones
 * Registra la ratificación de un documento firmado externamente
 * 
 * Validaciones:
 * 1. Actor es COMPRADOR o VENDEDOR en el expediente
 * 2. documentoSha256 coincide con el documento vigente CONTRATO_ARRAS_FIRMADO externo
 * 3. No existe ya ratificación del mismo rol
 * 
 * Acciones:
 * 1. Verificar permisos del usuario
 * 2. Insertar ratificación + sello QTSP
 * 3. Registrar evento CONTRATO_FIRMADO_EXTERNO_RATIFICADO
 * 4. Si 2/2 → transición a FIRMADO + evento CONTRATO_FIRMADO_FINALIZADO
 */
router.post('/:contratoId/ratificaciones', async (req: Request, res: Response) => {
    try {
        const { contratoId } = req.params;
        const { documentoId, documentoSha256, textId, textVersion } = req.body as RatificacionBody;
        const currentUserId = req.headers['x-user-id'] as string;

        // 1. Verificar autenticación
        if (!currentUserId) {
            return res.status(401).json({
                success: false,
                error: 'Usuario no autenticado. Se requiere header x-user-id.'
            });
        }

        // 2. Verificar campos requeridos
        if (!documentoId || !documentoSha256) {
            return res.status(400).json({
                success: false,
                error: 'Faltan campos requeridos: documentoId, documentoSha256'
            });
        }

        // 3. Verificar que el usuario es miembro con rol COMPRADOR o VENDEDOR
        const { data: miembro, error: miembroError } = await supabase
            .from('miembros_expediente')
            .select('*, mandatos:mandatos_expediente(*)')
            .eq('contrato_id', contratoId)
            .eq('usuario_id', currentUserId)
            .eq('estado_acceso', 'ACTIVO')
            .maybeSingle();

        if (miembroError) {
            console.error('Error buscando miembro:', miembroError);
            return res.status(500).json({
                success: false,
                error: 'Error verificando permisos'
            });
        }

        if (!miembro) {
            return res.status(403).json({
                success: false,
                error: 'No eres miembro activo de este expediente'
            });
        }

        // Solo COMPRADOR o VENDEDOR pueden ratificar
        const rolUsuario = miembro.tipo_rol_usuario;
        if (!['COMPRADOR', 'VENDEDOR'].includes(rolUsuario)) {
            // Check if has mandate from buyer or seller
            const mandatoActivo = miembro.mandatos?.find(
                (m: any) => m.estado_mandato === 'ACTIVO' &&
                    ['PARTE_COMPRADORA', 'PARTE_VENDEDORA'].includes(m.tipo_mandato)
            );

            if (!mandatoActivo) {
                return res.status(403).json({
                    success: false,
                    error: 'Solo COMPRADOR o VENDEDOR (o sus mandatarios autorizados) pueden ratificar'
                });
            }
        }

        // Determine which role is ratifying
        let rolRatificando = rolUsuario;
        if (!['COMPRADOR', 'VENDEDOR'].includes(rolUsuario)) {
            // Acting via mandate
            const mandato = miembro.mandatos?.find(
                (m: any) => m.estado_mandato === 'ACTIVO' &&
                    ['PARTE_COMPRADORA', 'PARTE_VENDEDORA'].includes(m.tipo_mandato)
            );
            rolRatificando = mandato?.tipo_mandato === 'PARTE_COMPRADORA' ? 'COMPRADOR' : 'VENDEDOR';
        }

        // 4. Verificar que no existe ya ratificación para este rol
        const { data: existente } = await supabase
            .from('ratificaciones_contrato')
            .select('id')
            .eq('contrato_id', contratoId)
            .eq('rol_parte', rolRatificando)
            .maybeSingle();

        if (existente) {
            return res.status(400).json({
                success: false,
                error: `Ya existe una ratificación para ${rolRatificando}`
            });
        }

        // 5. Verificar que el documento existe y el hash coincide
        const { data: documento, error: docError } = await supabase
            .from('archivos')
            .select('id, hash_sha256, tipo_documento')
            .eq('id', documentoId)
            .eq('contrato_id', contratoId)
            .maybeSingle();

        if (docError || !documento) {
            return res.status(404).json({
                success: false,
                error: 'Documento no encontrado en el inventario del expediente'
            });
        }

        // Verify hash matches (fail-closed)
        if (documento.hash_sha256 !== documentoSha256) {
            return res.status(400).json({
                success: false,
                error: 'El hash del documento no coincide. El documento puede haber sido modificado.'
            });
        }

        // 6. Insertar ratificación con evento certificado
        const ratificacionId = uuid();

        // Register event with QTSP seal
        const eventResult = await registerEvent({
            contratoId,
            tipo: 'CONTRATO_FIRMADO_EXTERNO_RATIFICADO',
            payload: {
                ratificacion_id: ratificacionId,
                documento_id: documentoId,
                documento_sha256: documentoSha256,
                rol_parte: rolRatificando,
                text_id: textId || 'DEFAULT_RATIFICATION_TEXT',
                text_version: textVersion || '1.0'
            },
            actorUsuarioId: currentUserId
        });

        // Insert ratification record
        const { error: insertError } = await supabase
            .from('ratificaciones_contrato')
            .insert({
                id: ratificacionId,
                contrato_id: contratoId,
                documento_id: documentoId,
                documento_sha256: documentoSha256,
                rol_parte: rolRatificando,
                usuario_id: currentUserId,
                text_id: textId || 'DEFAULT_RATIFICATION_TEXT',
                text_version: textVersion || '1.0',
                sello_id: eventResult.selloId,
                fecha_ratificacion: nowIso()
            });

        if (insertError) throw insertError;

        // 7. Check if all ratifications complete (2/2)
        const { data: allRatificaciones } = await supabase
            .from('ratificaciones_contrato')
            .select('rol_parte')
            .eq('contrato_id', contratoId);

        const rolesRatificados = new Set((allRatificaciones || []).map(r => r.rol_parte));
        const todasCompletas = rolesRatificados.has('COMPRADOR') && rolesRatificados.has('VENDEDOR');

        if (todasCompletas) {
            // Transition to FIRMADO
            await setEstado(contratoId, 'FIRMADO');

            // Register finalization event
            await registerEvent({
                contratoId,
                tipo: 'CONTRATO_FIRMADO_FINALIZADO',
                payload: {
                    origen: 'EXTERNO',
                    documento_id: documentoId,
                    ratificaciones_count: 2
                }
            });
        }

        res.json({
            success: true,
            data: {
                ratificacionId,
                rol: rolRatificando,
                selloId: eventResult.selloId,
                todasCompletas,
                mensaje: todasCompletas
                    ? 'Ratificación registrada. Todas las partes han ratificado. Contrato FIRMADO.'
                    : `Ratificación registrada como ${rolRatificando}. Pendiente: ${rolRatificando === 'COMPRADOR' ? 'VENDEDOR' : 'COMPRADOR'}`
            }
        });

    } catch (error: any) {
        console.error('Error registrando ratificación:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
