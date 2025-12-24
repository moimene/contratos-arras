/**
 * Servicio de Actas de No Comparecencia
 * 
 * Genera actas automáticas cuando una parte no comparece a la cita notarial
 * Calcula consecuencias según tipo de arras (confirmatorias, penitenciales, penales)
 */

import { supabase } from '../config/supabase.js';
import { triggerCommunicationWebhook } from './notificationService.js';
import { qtspService, calcularHash } from './qtspService.js';

// ================================================
// TIPOS
// ================================================

export interface GenerarActaData {
    contratoId: string;
    citaNotarialId: string;
    parteComparecienteId?: string;  // Opcional: quien sí compareció
    parteNoComparecienteId: string;  // Obligatorio: quien NO compareció
    fechaHoraCita: Date;
    notaria: string;
    resumenHechos: string;
}

export interface ConsecuenciasArras {
    tipoArras: 'CONFIRMATORIAS' | 'PENITENCIALES' | 'PENALES';
    importeArras: number;
    precioTotal: number;
    parteIncumplidora: 'COMPRADOR' | 'VENDEDOR';
    consecuencia: string;
    importePenalizacion?: number;
    derechoResolucion: boolean;
}

// ================================================
// SERVICIO PRINCIPAL
// ================================================

class ActaService {

    /**
     * Genera un acta de no comparecencia automática
     */
    async generarActa(data: GenerarActaData): Promise<{ actaId: string; pdfPath: string }> {
        const {
            contratoId,
            citaNotarialId,
            parteComparecienteId,
            parteNoComparecienteId,
            fechaHoraCita,
            notaria,
            resumenHechos,
        } = data;

        // 1. Obtener datos completos del contrato
        const { data: contrato, error: contratoError } = await supabase
            .from('contratos_arras')
            .select(`
        *,
        inmueble:inmuebles(*),
        partes:contratos_partes(*, parte:partes(*))
      `)
            .eq('id', contratoId)
            .single();

        if (contratoError || !contrato) {
            throw new Error('Contrato no encontrado');
        }

        // 2. Identificar roles de las partes
        const parteNoCompareciente = contrato.partes.find(
            (p: any) => p.parte_id === parteNoComparecienteId
        );

        if (!parteNoCompareciente) {
            throw new Error('Parte no compareciente no encontrada');
        }

        const rolNoCompareciente = parteNoCompareciente.rol_en_contrato === 'COMPRADOR'
            ? 'COMPRADOR'
            : 'VENDEDOR';

        // 3. Calcular consecuencias según tipo de arras
        const consecuencias = this.calcularConsecuencias({
            tipoArras: contrato.tipo_arras,
            importeArras: contrato.importe_arras,
            precioTotal: contrato.precio_total,
            parteIncumplidora: rolNoCompareciente,
        });

        // 4. Generar contenido del acta
        const contenidoActa = this.generarContenidoActa({
            contrato,
            parteNoCompareciente,
            fechaHoraCita,
            notaria,
            resumenHechos,
            consecuencias,
        });

        // 5. Calcular hash del acta
        const hashActa = calcularHash(contenidoActa);

        // 6. Obtener TST del acta completa
        const tst = await qtspService.obtenerSelloTiempo(hashActa);

        // 7. TODO: Generar PDF (simplificado por ahora)
        const pdfPath = `/actas/acta_${contratoId}_${Date.now()}.pdf`;

        // 8. Registrar acta en BD
        const { data: acta, error: actaError } = await supabase
            .from('actas_no_comparecencia')
            .insert({
                contrato_id: contratoId,
                cita_notarial_id: citaNotarialId,
                parte_compareciente_id: parteComparecienteId,
                parte_no_compareciente_id: parteNoComparecienteId,
                fecha_hora_cita: fechaHoraCita.toISOString(),
                notaria,
                resumen_hechos: resumenHechos,
                consecuencias_declaradas: consecuencias.consecuencia,
                archivo_acta_id: null, // TODO: vincular con archivo real
                hash_acta: hashActa,
                tst_token: tst.token,
                tst_fecha: tst.fecha.toISOString(),
                tst_proveedor: tst.proveedor,
                notificacion_enviada: false,
            })
            .select()
            .single();

        if (actaError) {
            console.error('Error al registrar acta:', actaError);
            throw new Error('Error al registrar acta');
        }

        // 9. Crear evento en timeline
        await this.crearEventoActa(contratoId, acta.id, parteNoComparecienteId, tst);

        // 10. Actualizar estado del contrato
        await supabase
            .from('contratos_arras')
            .update({
                estado: 'NO_COMPARECENCIA',
                acta_no_comparecencia_at: new Date().toISOString(),
            })
            .eq('id', contratoId);

        // 11. Programar notificación para la parte no compareciente
        // Esto inicia la ventana de 48h para alegaciones
        await this.programarNotificacion(contratoId, acta.id, parteNoComparecienteId);

        return {
            actaId: acta.id,
            pdfPath,
        };
    }

    /**
     * Envía notificación del acta a la parte no compareciente
     * Inicia la ventana de 48 horas para alegaciones
     */
    async enviarNotificacionActa(actaId: string): Promise<void> {
        // 1. Obtener acta
        const { data: acta } = await supabase
            .from('actas_no_comparecencia')
            .select('*')
            .eq('id', actaId)
            .single();

        if (!acta) {
            throw new Error('Acta no encontrada');
        }

        // 2. Calcular hash de la notificación
        const hashNotificacion = calcularHash(`${actaId}|${new Date().toISOString()}`);

        // 3. Obtener TST de la notificación
        const tst = await qtspService.obtenerSelloTiempo(hashNotificacion);

        // 4. Actualizar acta con datos de notificación
        await supabase
            .from('actas_no_comparecencia')
            .update({
                notificacion_enviada: true,
                notificacion_enviada_en: new Date().toISOString(),
                notificacion_hash: hashNotificacion,
                notificacion_tst: tst.token,
            })
            .eq('id', actaId);

        // 5. Crear evento de notificación
        const payload = {
            tipo: 'NOTIFICACION_NO_COMPARECENCIA_ENVIADA',
            actaId,
            parteId: acta.parte_no_compareciente_id,
            ventanaCierre: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // +48h
        };

        await supabase.from('eventos').insert({
            contrato_id: acta.contrato_id,
            tipo: 'NOTIFICACION_NO_COMPARECENCIA_ENVIADA',
            payload_json: payload,
            hash_sha256: calcularHash(JSON.stringify(payload)),
            tst_token: tst.token,
            tst_fecha: tst.fecha.toISOString(),
            tst_proveedor: tst.proveedor,
            actor_tipo: 'SISTEMA',
        });
    }

    /**
     * Obtiene actas de un contrato
     */
    async obtenerActasContrato(contratoId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('actas_no_comparecencia')
            .select(`
        *,
        parte_compareciente:partes!parte_compareciente_id(nombre, apellidos),
        parte_no_compareciente:partes!parte_no_compareciente_id(nombre, apellidos)
      `)
            .eq('contrato_id', contratoId)
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error('Error al obtener actas');
        }

        return data || [];
    }

    // ================================================
    // MÉTODOS PRIVADOS
    // ================================================

    /**
     * Calcula las consecuencias legales según tipo de arras
     */
    private calcularConsecuencias(params: {
        tipoArras: string;
        importeArras: number;
        precioTotal: number;
        parteIncumplidora: 'COMPRADOR' | 'VENDEDOR';
    }): ConsecuenciasArras {
        const { tipoArras, importeArras, precioTotal, parteIncumplidora } = params;

        const resultado: ConsecuenciasArras = {
            tipoArras: tipoArras as any,
            importeArras,
            precioTotal,
            parteIncumplidora,
            consecuencia: '',
            derechoResolucion: false,
        };

        switch (tipoArras) {
            case 'CONFIRMATORIAS':
                // Doble penalización
                if (parteIncumplidora === 'COMPRADOR') {
                    resultado.consecuencia = `El comprador pierde las arras entregadas (${importeArras.toLocaleString()} EUR). Además, el vendedor puede exigir el cumplimiento del contrato o su resolución con indemnización del doble de las arras (${(importeArras * 2).toLocaleString()} EUR).`;
                    resultado.importePenalizacion = importeArras * 2;
                } else {
                    resultado.consecuencia = `El vendedor debe devolver el doble de las arras recibidas (${(importeArras * 2).toLocaleString()} EUR) al comprador. El comprador puede además exigir el cumplimiento del contrato o indemnización de daños y perjuicios.`;
                    resultado.importePenalizacion = importeArras * 2;
                }
                resultado.derechoResolucion = true;
                break;

            case 'PENITENCIALES':
                // Pérdida de arras + derecho de resolución
                if (parteIncumplidora === 'COMPRADOR') {
                    resultado.consecuencia = `El comprador pierde las arras entregadas (${importeArras.toLocaleString()} EUR). El contrato queda resuelto de pleno derecho. El vendedor queda libre para disponer del inmueble.`;
                    resultado.importePenalizacion = importeArras;
                } else {
                    resultado.consecuencia = `El vendedor debe devolver el doble de las arras (${(importeArras * 2).toLocaleString()} EUR) al comprador. El contrato queda resuelto de pleno derecho. El comprador queda liberado de toda obligación.`;
                    resultado.importePenalizacion = importeArras * 2;
                }
                resultado.derechoResolucion = true;
                break;

            case 'PENALES':
                // Indemnización + opción de cumplimiento
                if (parteIncumplidora === 'COMPRADOR') {
                    resultado.consecuencia = `El vendedor tiene derecho a retener las arras (${importeArras.toLocaleString()} EUR) como indemnización mínima. Además, puede exigir el cumplimiento del contrato o reclamar daños y perjuicios adicionales si los hubiere.`;
                    resultado.importePenalizacion = importeArras;
                } else {
                    resultado.consecuencia = `El comprador tiene derecho a la devolución de las arras más una indemnización equivalente (total: ${(importeArras * 2).toLocaleString()} EUR). Puede además exigir el cumplimiento del contrato o reclamar daños y perjuicios adicionales.`;
                    resultado.importePenalizacion = importeArras * 2;
                }
                resultado.derechoResolucion = true;
                break;

            default:
                resultado.consecuencia = 'Tipo de arras no reconocido. Se aplican las normas generales del Código Civil.';
                resultado.derechoResolucion = true;
        }

        return resultado;
    }

    /**
     * Genera el contenido HTML del acta
     */
    private generarContenidoActa(params: {
        contrato: any;
        parteNoCompareciente: any;
        fechaHoraCita: Date;
        notaria: string;
        resumenHechos: string;
        consecuencias: ConsecuenciasArras;
    }): string {
        const { contrato, parteNoCompareciente, fechaHoraCita, notaria, resumenHechos, consecuencias } = params;

        const nombreCompleto = `${parteNoCompareciente.parte.nombre} ${parteNoCompareciente.parte.apellidos || ''}`.trim();

        return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Acta de No Comparecencia</title>
  <style>
    body { font-family: 'Times New Roman', serif; line-height: 1.8; margin: 40px; }
    h1 { text-align: center; font-size: 18pt; margin-bottom: 30px; }
    h2 { font-size: 14pt; margin-top: 25px; border-bottom: 1px solid #000; }
    .seccion { margin: 20px 0; text-align: justify; }
    .destacado { font-weight: bold; }
    .firma { margin-top: 60px; text-align: right; }
    .sello { margin-top: 40px; padding: 20px; border: 2px solid #000; }
  </style>
</head>
<body>
  <h1>ACTA DE NO COMPARECENCIA</h1>
  
  <div class="seccion">
    <p><span class="destacado">Expediente:</span> ${contrato.numero_expediente}</p>
    <p><span class="destacado">Fecha y hora de cita:</span> ${fechaHoraCita.toLocaleString('es-ES', {
            dateStyle: 'full',
            timeStyle: 'short'
        })}</p>
    <p><span class="destacado">Notaría:</span> ${notaria}</p>
  </div>

  <h2>I. HECHOS</h2>
  <div class="seccion">
    <p>${resumenHechos}</p>
    <p>En la fecha y hora indicadas, compareció/comparecieron la(s) parte(s) convocada(s), con excepción de:</p>
    <p class="destacado">${nombreCompleto}</p>
    <p>En calidad de: <span class="destacado">${parteNoCompareciente.rol_en_contrato}</span></p>
    <p>${parteNoCompareciente.parte.tipo_documento}: ${parteNoCompareciente.parte.numero_documento}</p>
  </div>

  <h2>II. OBJETO DEL CONTRATO</h2>
  <div class="seccion">
    <p>La comparecencia tenía por objeto la elevación a escritura pública del contrato privado de arras de fecha ${new Date(contrato.created_at).toLocaleDateString('es-ES')}, sobre el inmueble sito en:</p>
    <p class="destacado">${contrato.inmueble.direccion_completa}, ${contrato.inmueble.ciudad}</p>
    <p>Precio total: ${contrato.precio_total.toLocaleString('es-ES')} ${contrato.moneda}</p>
    <p>Arras entregadas: ${contrato.importe_arras.toLocaleString('es-ES')} ${contrato.moneda} (${contrato.tipo_arras})</p>
  </div>

  <h2>III. CONSECUENCIAS DE LA NO COMPARECENCIA</h2>
  <div class="seccion">
    <p>En virtud del artículo 1454 del Código Civil y la naturaleza <span class="destacado">${consecuencias.tipoArras}</span> de las arras pactadas:</p>
    <p>${consecuencias.consecuencia}</p>
  </div>

  <h2>IV. NOTIFICACIÓN Y PLAZO DE ALEGACIONES</h2>
  <div class="seccion">
    <p>La presente acta será notificada al obligado no compareciente conforme al artículo 48 LEC.</p>
    <p class="destacado">Se concede un plazo de CUARENTA Y OCHO (48) HORAS desde la notificación para formular alegaciones, someterse o manifestar conformidad con las consecuencias declaradas.</p>
    <p>Transcurrido dicho plazo sin respuesta, se entenderá definitiva la presente acta.</p>
  </div>

  <div class="sello">
    <p><span class="destacado">Hash SHA-256 del acta:</span></p>
    <p style="font-family: monospace; font-size: 8pt; word-break: break-all;">${calcularHash(resumenHechos)}</p>
    <p><span class="destacado">Sello de Tiempo Cualificado (TST):</span></p>
    <p>Proveedor: ${process.env.QTSP_PROVIDER || 'STUB_DEV'}</p>
    <p>Fecha: ${new Date().toISOString()}</p>
  </div>

  <div class="firma">
    <p>En ${contrato.inmueble.ciudad}, a ${new Date().toLocaleDateString('es-ES', { dateStyle: 'long' })}</p>
    <p style="margin-top: 80px;">_________________________</p>
    <p>Sistema LegalOps - Cron-Flare</p>
  </div>
</body>
</html>
    `.trim();
    }

    private async crearEventoActa(
        contratoId: string,
        actaId: string,
        parteNoComparecienteId: string,
        tst: any
    ): Promise<void> {
        const payload = {
            tipo: 'ACTA_GENERADA',
            actaId,
            parteNoComparecienteId,
        };

        await supabase.from('eventos').insert({
            contrato_id: contratoId,
            tipo: 'ACTA_GENERADA',
            payload_json: payload,
            hash_sha256: calcularHash(JSON.stringify(payload)),
            tst_token: tst.token,
            tst_fecha: tst.fecha.toISOString(),
            tst_proveedor: tst.proveedor,
            actor_tipo: 'SISTEMA',
        });
    }

    private async programarNotificacion(
        contratoId: string,
        actaId: string,
        parteId: string
    ): Promise<void> {
        console.log(`Programando notificación para acta ${actaId} a parte ${parteId}`);

        try {
            // 1. Obtener el rol de la parte destinataria
            const { data: parteContrato, error: parteError } = await supabase
                .from('contratos_partes')
                .select('rol_en_contrato')
                .eq('contrato_id', contratoId)
                .eq('parte_id', parteId)
                .single();

            if (parteError || !parteContrato) {
                console.error('Error al obtener rol de la parte:', parteError);
                throw new Error('No se pudo identificar el rol de la parte para la notificación');
            }

            // 2. Crear registro de comunicación
            const { data: comunicacion, error: commError } = await supabase
                .from('comunicaciones')
                .insert({
                    contrato_id: contratoId,
                    tipo_comunicacion: 'NOTIFICACION_ACTA_NO_COMPARECENCIA',
                    canal: 'EMAIL', // Prioridad Email, pero el sistema determina canales
                    asunto: 'IMPORTANTE: Acta de No Comparecencia y Apertura de Plazo de Alegaciones',
                    contenido: `Se le notifica que se ha generado un Acta de No Comparecencia referente al contrato ${contratoId}. Dispone de 48 horas para realizar alegaciones.`,
                    remitente_rol: 'SISTEMA',
                    destinatarios_roles: [parteContrato.rol_en_contrato],
                    metadatos: {
                        actaId,
                        urgente: true,
                        accionRequerida: 'REVISAR_ACTA'
                    }
                })
                .select()
                .single();

            if (commError) {
                console.error('Error al crear comunicación:', commError);
                throw new Error('Error al registrar la comunicación');
            }

            // 3. Disparar webhook de notificación (Email/SMS via n8n)
            const webhookResult = await triggerCommunicationWebhook(
                comunicacion.id,
                'COMUNICACION_CREADA'
            );

            if (!webhookResult.success) {
                console.warn('Alerta: El webhook de notificación falló, pero el proceso continúa.', webhookResult.error);
                // No lanzamos error para no abortar el proceso principal, pero logueamos
            }

            // 4. Registrar oficialmente que la notificación ha sido enviada (Legal/Blockchain)
            await this.enviarNotificacionActa(actaId);

            console.log(`Notificación programada y enviada correctamente para acta ${actaId}`);

        } catch (error) {
            console.error('Error en programarNotificacion:', error);
            // Dependiendo de la criticidad, podríamos lanzar el error o solo loguearlo
            // Dado que inicia un plazo legal, es crítico.
            throw error;
        }
    }
}

// ================================================
// EXPORTAR INSTANCIA SINGLETON
// ================================================

export const actaService = new ActaService();
export { ActaService };
