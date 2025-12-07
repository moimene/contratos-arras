import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { registerEvent } from '../services/eventService.js';

const router = Router();

/**
 * POST /api/actas/:contratoId/crear
 * Crea un acta de no comparecencia cuando una parte no se presenta
 */
router.post('/:contratoId/crear', async (req: Request, res: Response) => {
    try {
        const { contratoId } = req.params;
        const {
            compareciente_parte_id,
            incompareciente_parte_id,
            fecha_hora_cita,
            notaria_nombre,
            notaria_direccion,
            resumen_hechos,
        } = req.body;

        // Validar que el contrato existe y está en estado FIRMADO
        const { data: contrato, error: contratoError } = await supabase
            .from('contratos')
            .select('*')
            .eq('id', contratoId)
            .single();

        if (contratoError || !contrato) {
            return res.status(404).json({ error: 'Contrato no encontrado' });
        }

        if (contrato.estado !== 'FIRMADO') {
            return res.status(400).json({
                error: 'El contrato debe estar en estado FIRMADO para generar actas de no comparecencia',
            });
        }

        // Calcular ventana de cierre (10 días hábiles desde fecha de cita)
        const fechaCita = new Date(fecha_hora_cita);
        const ventanaCierre = new Date(fechaCita);
        ventanaCierre.setDate(ventanaCierre.getDate() + 14); // 10 días hábiles ≈ 14 días naturales

        // Crear acta
        const { data: acta, error: actaError } = await supabase
            .from('actas_no_comparecencia')
            .insert({
                contrato_id: contratoId,
                compareciente_parte_id,
                incompareciente_parte_id,
                fecha_hora_cita,
                notaria_nombre,
                notaria_direccion,
                resumen_hechos,
                estado: 'GENERADA',
                respuesta_valida: false,
                ventana_cierre_iso: ventanaCierre.toISOString(),
            })
            .select()
            .single();

        if (actaError) {
            throw actaError;
        }

        // Determinar tipo de evento según quién no compareció
        const { data: incompareciente } = await supabase
            .from('contratos_partes')
            .select('rol_en_contrato')
            .eq('parte_id', incompareciente_parte_id)
            .eq('contrato_id', contratoId)
            .single();

        const tipoEvento =
            incompareciente?.rol_en_contrato === 'COMPRADOR'
                ? 'NO_COMPARECENCIA_COMPRADOR'
                : 'NO_COMPARECENCIA_VENDEDOR';

        // Registrar evento
        await registerEvent({
            contratoId,
            tipo: tipoEvento as any,
            payload: {
                acta_id: acta.id,
                compareciente_parte_id,
                incompareciente_parte_id,
                fecha_hora_cita,
                ventana_cierre: ventanaCierre.toISOString(),
            },
        });

        res.json({
            message: 'Acta de no comparecencia creada',
            acta,
            ventana_cierre: ventanaCierre.toISOString(),
        });
    } catch (error: any) {
        console.error('Error creando acta:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/actas/:actaId/responder
 * Permite al no compareciente responder al acta
 */
router.post('/:actaId/responder', async (req: Request, res: Response) => {
    try {
        const { actaId } = req.params;
        const { respuesta_tipo, respuesta_texto } = req.body;

        // Validar tipo de respuesta
        const tiposValidos = ['CONFORMIDAD', 'SOMETIMIENTO', 'ALEGACIONES'];
        if (!tiposValidos.includes(respuesta_tipo)) {
            return res.status(400).json({
                error: `Tipo de respuesta inválido. Debe ser: ${tiposValidos.join(', ')}`,
            });
        }

        // Obtener acta
        const { data: acta, error: actaError } = await supabase
            .from('actas_no_comparecencia')
            .select('*')
            .eq('id', actaId)
            .single();

        if (actaError || !acta) {
            return res.status(404).json({ error: 'Acta no encontrada' });
        }

        // Verificar que está dentro de la ventana de cierre
        const ahora = new Date();
        const ventanaCierre = new Date(acta.ventana_cierre_iso);

        if (ahora > ventanaCierre) {
            return res.status(400).json({
                error: 'La ventana de respuesta ha expirado',
                ventana_cierre: acta.ventana_cierre_iso,
            });
        }

        // Verificar que no haya respondido ya
        if (acta.respuesta_tipo) {
            return res.status(400).json({
                error: 'Ya existe una respuesta registrada para esta acta',
            });
        }

        // Actualizar acta con respuesta
        const { data: actaActualizada, error: updateError } = await supabase
            .from('actas_no_comparecencia')
            .update({
                respuesta_tipo,
                respuesta_texto,
                fecha_hora_respuesta: new Date().toISOString(),
                respuesta_valida: true,
            })
            .eq('id', actaId)
            .select()
            .single();

        if (updateError) {
            throw updateError;
        }

        // Registrar evento
        await registerEvent({
            contratoId: acta.contrato_id,
            tipo: 'RESPUESTA_NO_COMPARECIENTE',
            payload: {
                acta_id: actaId,
                respuesta_tipo,
                incompareciente_parte_id: acta.incompareciente_parte_id,
            },
        });

        // Si es conformidad, actualizar contrato a CERRADO
        if (respuesta_tipo === 'CONFORMIDAD') {
            await supabase
                .from('contratos')
                .update({
                    estado: 'CERRADO',
                    motivo_cierre: 'No comparecencia - Conformidad del no compareciente',
                })
                .eq('id', acta.contrato_id);

            await registerEvent({
                contratoId: acta.contrato_id,
                tipo: 'CONTRATO_RESUELTO',
                payload: {
                    motivo: 'No comparecencia con conformidad',
                    acta_id: actaId,
                },
            });
        }

        res.json({
            message: 'Respuesta registrada correctamente',
            acta: actaActualizada,
        });
    } catch (error: any) {
        console.error('Error registrando respuesta:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/actas/:contratoId
 * Obtiene las actas de no comparecencia de un contrato
 */
router.get('/:contratoId', async (req: Request, res: Response) => {
    try {
        const { contratoId } = req.params;

        const { data: actas, error } = await supabase
            .from('actas_no_comparecencia')
            .select(`
        *,
        compareciente:partes!actas_no_comparecencia_compareciente_parte_id_fkey(id, nombre, apellidos),
        incompareciente:partes!actas_no_comparecencia_incompareciente_parte_id_fkey(id, nombre, apellidos)
      `)
            .eq('contrato_id', contratoId)
            .order('fecha_hora_creacion', { ascending: false });

        if (error) {
            throw error;
        }

        // Calcular si la ventana está activa
        const ahora = new Date();
        const actasConEstado = actas?.map((acta) => ({
            ...acta,
            ventana_activa: new Date(acta.ventana_cierre_iso) > ahora,
            dias_restantes: Math.max(
                0,
                Math.ceil((new Date(acta.ventana_cierre_iso).getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24))
            ),
        }));

        res.json(actasConEstado || []);
    } catch (error: any) {
        console.error('Error obteniendo actas:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/actas/:actaId/notificar-retencion
 * Notifica la retención o entrega de arras tras no comparecencia
 */
router.post('/:actaId/notificar-retencion', async (req: Request, res: Response) => {
    try {
        const { actaId } = req.params;
        const { accion, importe, beneficiario_parte_id } = req.body;

        // Obtener acta
        const { data: acta, error: actaError } = await supabase
            .from('actas_no_comparecencia')
            .select('*')
            .eq('id', actaId)
            .single();

        if (actaError || !acta) {
            return res.status(404).json({ error: 'Acta no encontrada' });
        }

        // Verificar que haya pasado la ventana de cierre
        const ahora = new Date();
        const ventanaCierre = new Date(acta.ventana_cierre_iso);

        if (ahora < ventanaCierre && !acta.respuesta_tipo) {
            return res.status(400).json({
                error: 'Debe esperar a que expire la ventana de respuesta',
                ventana_cierre: acta.ventana_cierre_iso,
            });
        }

        // Registrar evento
        await registerEvent({
            contratoId: acta.contrato_id,
            tipo: 'RETENCION_COMUNICADA',
            payload: {
                acta_id: actaId,
                accion,
                importe,
                beneficiario_parte_id,
            },
        });

        // Cerrar contrato
        await supabase
            .from('contratos')
            .update({
                estado: 'CERRADO',
                motivo_cierre: `No comparecencia - ${accion}`,
            })
            .eq('id', acta.contrato_id);

        res.json({
            message: '  Retención/Entrega notificada correctamente',
            accion,
        });
    } catch (error: any) {
        console.error('Error notificando retención:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
