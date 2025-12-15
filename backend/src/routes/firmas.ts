import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { v4 as uuid } from 'uuid';
import { nowIso } from '../utils/time.js';
import { getContratoFull, setEstado } from '../repositories/contratos.repo.js';
import { registerEvent } from '../services/eventService.js';

const router = Router();

/**
 * GET /api/firmas/:contratoId
 * Lista todas las firmas de un contrato
 */
router.get('/:contratoId', async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('firmas_contrato')
            .select('*')
            .eq('contrato_id', req.params.contratoId)
            .order('fecha_hora_firma', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (error: any) {
        console.error('Error listando firmas:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * POST /api/firmas/:contratoId
 * Registra firma electrónica de un contrato
 * 
 * Validaciones:
 * 1. Contrato debe estar en estado BORRADOR
 * 2. La parte solicitada debe estar obligada a firmar
 * 3. El usuario actual debe ser miembro con rol correspondiente o tener mandato con puede_firmar
 */
router.post('/:contratoId', async (req: Request, res: Response) => {
    try {
        const { parteId } = req.body;
        const currentUserId = req.headers['x-user-id'] as string;

        // Verificar autenticación
        if (!currentUserId) {
            return res.status(401).json({
                error: 'Usuario no autenticado. Se requiere header x-user-id.',
            });
        }

        const full = await getContratoFull(req.params.contratoId);

        // Verificar que el borrador fue generado
        if (full.contrato.estado !== 'BORRADOR') {
            return res.status(400).json({
                error: 'Debe generarse el borrador antes de firmar',
            });
        }

        // Verificar que la parte está obligada a firmar
        const parteAFirmar = full.partes.find(
            (p: any) => p.parte_id === parteId && p.obligado_firmar
        );

        if (!parteAFirmar) {
            return res.status(400).json({
                error: 'La parte no está marcada como obligada a firmar',
            });
        }

        // ============================================
        // VALIDACIÓN DE ROL: ENTREGA B
        // ============================================
        // Verificar que el usuario actual tiene permiso para firmar por esta parte

        // 1. Buscar si el usuario es miembro del expediente
        const { data: miembro, error: miembroError } = await supabase
            .from('miembros_expediente')
            .select('*, mandatos:mandatos_expediente(*)')
            .eq('contrato_id', req.params.contratoId)
            .eq('usuario_id', currentUserId)
            .eq('estado_acceso', 'ACTIVO')
            .maybeSingle();

        if (miembroError) {
            console.error('Error buscando miembro:', miembroError);
            return res.status(500).json({
                error: 'Error verificando permisos de firma',
            });
        }

        if (!miembro) {
            return res.status(403).json({
                error: 'No eres miembro activo de este expediente',
            });
        }

        // 2. Verificar si puede firmar por esta parte
        const rolParte = parteAFirmar.rol_en_contrato || parteAFirmar.tipo_parte; // COMPRADOR o VENDEDOR

        // El usuario puede firmar si:
        // a) Su rol es el mismo que el de la parte (COMPRADOR firma como COMPRADOR)
        // b) Tiene un mandato activo con puede_firmar para esa parte
        const esMismoRol = miembro.tipo_rol_usuario === rolParte;
        const tieneMandatoFirma = miembro.mandatos?.some(
            (m: any) => m.puede_firmar && m.estado_mandato === 'ACTIVO'
        );

        if (!esMismoRol && !tieneMandatoFirma) {
            return res.status(403).json({
                error: `No tienes permisos para firmar como ${rolParte}. Solo puedes firmar por tu propio rol o con mandato autorizado.`,
            });
        }

        // Registrar firma
        const id = uuid();
        const ip =
            (req.headers['x-forwarded-for'] as string) ||
            req.socket.remoteAddress ||
            '0.0.0.0';
        const ua = req.headers['user-agent'] || '';

        const { error } = await supabase.from('firmas_contrato').insert({
            id,
            contrato_id: req.params.contratoId,
            parte_id: parteId,
            version_contrato: full.contrato.version_hash,
            fecha_hora_firma: nowIso(),
            direccion_ip: ip,
            user_agent: ua,
            valida: true,
        });

        if (error) throw error;

        // Registrar evento certificado
        await registerEvent({
            contratoId: req.params.contratoId,
            tipo: 'FIRMA_ELECTRONICA',
            payload: {
                parte_id: parteId,
                version_hash: full.contrato.version_hash,
                ip,
            },
            actorParteId: parteId,
        });

        // Verificar si todos firmaron
        const obligados = full.partes.filter((p: any) => p.obligado_firmar);

        const { data: firmasValidas } = await supabase
            .from('firmas_contrato')
            .select('parte_id')
            .eq('contrato_id', req.params.contratoId)
            .eq('valida', true)
            .eq('version_contrato', full.contrato.version_hash);

        const partesFirmadas = new Set(
            (firmasValidas || []).map((f: any) => f.parte_id)
        );
        const allSigned = obligados.every((p: any) =>
            partesFirmadas.has(p.parte_id)
        );

        if (allSigned) {
            await setEstado(req.params.contratoId, 'FIRMADO');
        }

        res.json({ ok: true, allSigned });
    } catch (error: any) {
        console.error('Error registrando firma:', error);
        res.status(400).json({ error: error.message });
    }
});

export default router;
