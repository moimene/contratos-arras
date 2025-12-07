import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { registerEvent } from '../services/eventService.js';

const router = Router();

/**
 * POST /api/notaria/:contratoId/crear-cita
 * Crea una cita en la notaría y convoca a las partes
 */
router.post('/:contratoId/crear-cita', async (req: Request, res: Response) => {
    try {
        const { contratoId } = req.params;
        const {
            nombre_notaria,
            direccion_notaria,
            fecha_hora_propuesta,
            notas,
            lista_documentacion_texto,
        } = req.body;

        // Validar que el contrato está firmado
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
                error: 'El contrato debe estar firmado para crear cita en notaría',
            });
        }

        // Crear cita
        const { data: cita, error: citaError } = await supabase
            .from('citas_notaria')
            .insert({
                contrato_id: contratoId,
                nombre_notaria,
                direccion_notaria,
                fecha_hora_propuesta,
                notas,
                lista_documentacion_texto,
            })
            .select()
            .single();

        if (citaError) {
            throw citaError;
        }

        // Registrar evento
        await registerEvent({
            contratoId,
            tipo: 'CITA_NOTARIA_CREADA' as any,
            payload: {
                cita_id: cita.id,
                fecha_hora_propuesta,
                nombre_notaria,
            },
        });

        res.json({
            message: 'Cita en notaría creada correctamente',
            cita,
        });
    } catch (error: any) {
        console.error('Error creando cita:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/notaria/:contratoId/convocar-partes
 * Envía convocatoria a todas las partes para la cita
 */
router.post('/:contratoId/convocar-partes', async (req: Request, res: Response) => {
    try {
        const { contratoId } = req.params;
        const { cita_id, mensaje_adicional } = req.body;

        // Obtener cita
        const { data: cita, error: citaError } = await supabase
            .from('citas_notaria')
            .select('*')
            .eq('id', cita_id)
            .single();

        if (citaError || !cita) {
            return res.status(404).json({ error: 'Cita no encontrada' });
        }

        // Obtener todas las partes del contrato
        const { data: partes, error: partesError } = await supabase
            .from('contratos_partes')
            .select('*, parte:partes(*)')
            .eq('contrato_id', contratoId);

        if (partesError) {
            throw partesError;
        }

        // Crear notificaciones para cada parte
        const notificaciones = partes?.map((cp: any) => ({
            contrato_id: contratoId,
            destinatario_parte_id: cp.parte_id,
            asunto: `Convocatoria para firma de escritura - ${cita.nombre_notaria}`,
            mensaje: `Se le convoca a la firma de escritura pública el día ${new Date(cita.fecha_hora_propuesta).toLocaleString('es-ES')} en ${cita.nombre_notaria}, ${cita.direccion_notaria}.\n\nDocumentación a aportar:\n${cita.lista_documentacion_texto || 'Ver detalles en el contrato'}\n\n${mensaje_adicional || ''}`,
            tipo: 'CONVOCATORIA_NOTARIA',
        }));

        const { data: notifs, error: notifsError } = await supabase
            .from('notificaciones')
            .insert(notificaciones)
            .select();

        if (notifsError) {
            throw notifsError;
        }

        // Registrar evento
        await registerEvent({
            contratoId,
            tipo: 'PARTES_CONVOCADAS' as any,
            payload: {
                cita_id,
                num_partes: partes?.length,
                fecha_hora_cita: cita.fecha_hora_propuesta,
            },
        });

        res.json({
            message: 'Convocatoria enviada a todas las partes',
            notificaciones: notifs,
        });
    } catch (error: any) {
        console.error('Error convocando partes:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/notaria/:contratoId/generar-minuta
 * Genera la minuta de escritura de compraventa
 */
router.post('/:contratoId/generar-minuta', async (req: Request, res: Response) => {
    try {
        const { contratoId } = req.params;

        // Obtener contrato completo
        const { data: contrato, error } = await supabase
            .from('contratos')
            .select(`
        *,
        inmueble:inmuebles(*),
        partes:contratos_partes(*, parte:partes(*))
      `)
            .eq('id', contratoId)
            .single();

        if (error || !contrato) {
            return res.status(404).json({ error: 'Contrato no encontrado' });
        }

        // Generar contenido de la minuta (HTML simplificado)
        const minutaHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Minuta de Escritura de Compraventa</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
          h1 { text-align: center; color: #333; }
          h2 { color: #555; border-bottom: 2px solid #FF6B35; padding-bottom: 5px; }
          .seccion { margin: 20px 0; }
          .parte { background: #f5f5f5; padding: 10px; margin: 10px 0; border-left: 4px solid #FF6B35; }
        </style>
      </head>
      <body>
        <h1>MINUTA DE ESCRITURA PÚBLICA DE COMPRAVENTA</h1>
        
        <div class="seccion">
          <h2>I. COMPARECIENTES</h2>
          ${contrato.partes?.map((cp: any) => `
            <div class="parte">
              <strong>${cp.parte.nombre} ${cp.parte.apellidos}</strong> (${cp.rol_en_contrato})<br>
              ${cp.parte.tipo_documento}: ${cp.parte.numero_documento}<br>
              Estado civil: ${cp.parte.estado_civil || 'No especificado'}<br>
              Domicilio: ${cp.parte.domicilio || 'No especificado'}
            </div>
          `).join('')}
        </div>

        <div class="seccion">
          <h2>II. INTERVIENEN</h2>
          <p>En su propio nombre y derecho, según se acredita.</p>
        </div>

        <div class="seccion">
          <h2>III. EXPONEN</h2>
          <p>Que convienen en celebrar contrato de compraventa de la finca que a continuación se describe:</p>
        </div>

        <div class="seccion">
          <h2>IV. FINCA OBJETO DE COMPRAVENTA</h2>
          <p><strong>Dirección:</strong> ${contrato.inmueble.direccion_completa}, ${contrato.inmueble.ciudad}</p>
          ${contrato.inmueble.referencia_catastral ? `<p><strong>Referencia Catastral:</strong> ${contrato.inmueble.referencia_catastral}</p>` : ''}
          ${contrato.inmueble.datos_registrales ? `<p><strong>Datos Registrales:</strong> ${contrato.inmueble.datos_registrales}</p>` : ''}
          ${contrato.inmueble.m2 ? `<p><strong>Superficie:</strong> ${contrato.inmueble.m2} m²</p>` : ''}
        </div>

        <div class="seccion">
          <h2>V. PRECIO Y FORMA DE PAGO</h2>
          <p><strong>Precio Total:</strong> ${contrato.precio_total.toLocaleString('es-ES')} ${contrato.moneda}</p>
          <p><strong>Arras entregadas:</strong> ${contrato.importe_arras.toLocaleString('es-ES')} ${contrato.moneda} (${contrato.tipo_arras})</p>
          <p><strong>Resto a pagar:</strong> ${(contrato.precio_total - contrato.importe_arras).toLocaleString('es-ES')} ${contrato.moneda}</p>
        </div>

        <div class="seccion">
          <h2>VI. CONDICIONES</h2>
          <p><strong>Gastos:</strong> ${contrato.gastos_quien === 'LEY' ? 'Conforme a la Ley' : 'A cargo del comprador'}</p>
          ${contrato.condicion_suspensiva_texto ? `<p><strong>Condición Suspensiva:</strong> ${contrato.condicion_suspensiva_texto}</p>` : ''}
        </div>

        <div class="seccion">
          <h2>VII. DECLARACIONES</h2>
          <p>El vendedor declara que la finca se encuentra libre de cargas y gravámenes, salvo las que constan en la nota simple.</p>
          <p>El comprador declara conocer el estado de la finca tras haberla visitado.</p>
        </div>

        <div class="seccion">
          <h2>VIII. OTORGAMIENTO</h2>
          <p>Y en prueba de conformidad, otorgan la presente escritura en el lugar y fecha indicados.</p>
        </div>

        <p style="text-align: center; margin-top: 40px; color: #666;">
          Generado el ${new Date().toLocaleString('es-ES')}<br>
          Contrato ID: ${contrato.identificador_unico}
        </p>
      </body>
      </html>
    `;

        // Registrar evento
        await registerEvent({
            contratoId,
            tipo: 'MINUTA_GENERADA',
            payload: {
                fecha_generacion: new Date().toISOString(),
                num_partes: contrato.partes?.length,
            },
        });

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="minuta-${contrato.identificador_unico}.html"`);
        res.send(minutaHTML);
    } catch (error: any) {
        console.error('Error generando minuta:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/notaria/:contratoId/citas
 * Obtiene las citas programadas para un contrato
 */
router.get('/:contratoId/citas', async (req: Request, res: Response) => {
    try {
        const { contratoId } = req.params;

        const { data: citas, error } = await supabase
            .from('citas_notaria')
            .select('*')
            .eq('contrato_id', contratoId)
            .order('fecha_hora_creacion', { ascending: false });

        if (error) {
            throw error;
        }

        res.json(citas || []);
    } catch (error: any) {
        console.error('Error obteniendo citas:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/notaria/:contratoId/notificaciones
 * Obtiene las notificaciones enviadas a las partes
 */
router.get('/:contratoId/notificaciones', async (req: Request, res: Response) => {
    try {
        const { contratoId } = req.params;

        const { data: notificaciones, error } = await supabase
            .from('notificaciones')
            .select(`
        *,
        destinatario:partes(nombre, apellidos, email)
      `)
            .eq('contrato_id', contratoId)
            .order('fecha_hora_creacion', { ascending: false });

        if (error) {
            throw error;
        }

        res.json(notificaciones || []);
    } catch (error: any) {
        console.error('Error obteniendo notificaciones:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
