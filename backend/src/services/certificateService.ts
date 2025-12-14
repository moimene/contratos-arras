/**
 * Certificate Service
 * 
 * Genera el Certificado de Eventos del expediente.
 * Incluye todos los eventos, comunicaciones y documentos con sellado QTSP.
 */

import { createHash } from 'crypto';
import { supabase } from '../config/supabase.js';
import { requestQualifiedTimestamp } from '../qtsp/eadTrustClient.js';
import { getRolCertificateLabel, getMandatoCertificateLabel } from '../domain/mandatos/index.js';

interface EventoCompleto {
    id: string;
    tipo: string;
    payload: any;
    created_at: string;
    sello_id: string | null;
}

interface ComunicacionResumen {
    id: string;
    tipo_comunicacion: string;
    canal: string;
    es_externa: boolean;
    fecha_comunicacion: string;
    remitente: string;
    destinatarios: string;
    asunto: string | null;
    hash_contenido: string | null;
    sello_qtsp_id: string | null;
}

interface DocumentoResumen {
    id: string;
    tipo: string;
    nombre_original: string;
    estado: string;
    hash_sha256: string | null;
    created_at: string;
}

interface IntervinienteResumen {
    id: string;
    nombre: string;
    email: string | null;
    rol: string;
    rolLabel: string;
    mandatoTipo: string | null;
    mandatoLabel: string | null;
    fechaAltaMandato: string | null;
}

export interface CertificadoEventos {
    contratoId: string;
    numeroExpediente: string;
    fechaGeneracion: string;
    hashCertificado: string;
    selloQtspId: string | null;

    resumen: {
        totalEventos: number;
        totalComunicaciones: number;
        comunicacionesInternas: number;
        comunicacionesExternas: number;
        totalDocumentos: number;
    };

    eventos: EventoCompleto[];
    comunicaciones: ComunicacionResumen[];
    documentos: DocumentoResumen[];

    contenidoHtml: string;
}

/**
 * Genera el Certificado de Eventos completo para un contrato
 */
export async function generateEventsCertificate(contratoId: string): Promise<CertificadoEventos> {
    // 1. Obtener datos del contrato
    const { data: contrato, error: contratoError } = await supabase
        .from('contratos_arras')
        .select('numero_expediente, estado, created_at')
        .eq('id', contratoId)
        .single();

    if (contratoError || !contrato) {
        throw new Error('Contrato no encontrado');
    }

    // 2. Obtener eventos
    const { data: eventos } = await supabase
        .from('eventos')
        .select('*')
        .eq('contrato_id', contratoId)
        .order('created_at', { ascending: true });

    // 3. Obtener comunicaciones
    const { data: comunicaciones } = await supabase
        .from('comunicaciones')
        .select('*')
        .eq('contrato_id', contratoId)
        .order('fecha_comunicacion', { ascending: true });

    // 4. Obtener documentos
    const { data: documentos } = await supabase
        .from('archivos')
        .select('*')
        .eq('contrato_id', contratoId)
        .order('created_at', { ascending: true });

    // 5. Obtener miembros con mandatos
    const { data: miembros } = await supabase
        .from('miembros_expediente')
        .select(`
            *,
            usuario:perfiles(id, email, nombre_completo),
            mandatos:mandatos_expediente(id, tipo_mandato, estado_mandato, created_at)
        `)
        .eq('contrato_id', contratoId)
        .eq('estado_acceso', 'ACTIVO');

    // 5. Formatear datos
    const eventosFormateados: EventoCompleto[] = (eventos || []).map(e => ({
        id: e.id,
        tipo: e.tipo,
        payload: e.payload || {},
        created_at: e.created_at,
        sello_id: e.sello_id
    }));

    const comunicacionesFormateadas: ComunicacionResumen[] = (comunicaciones || []).map(c => ({
        id: c.id,
        tipo_comunicacion: c.tipo_comunicacion,
        canal: c.canal,
        es_externa: c.es_externa,
        fecha_comunicacion: c.fecha_comunicacion,
        remitente: c.es_externa ? c.remitente_externo : c.remitente_rol,
        destinatarios: c.es_externa
            ? c.destinatarios_externos
            : (c.destinatarios_roles || []).join(', '),
        asunto: c.asunto,
        hash_contenido: c.hash_contenido,
        sello_qtsp_id: c.sello_qtsp_id
    }));

    const documentosFormateados: DocumentoResumen[] = (documentos || []).map(d => ({
        id: d.id,
        tipo: d.tipo,
        nombre_original: d.nombre_original,
        estado: d.estado,
        hash_sha256: d.hash_sha256,
        created_at: d.created_at
    }));

    // Formatear intervinientes
    const intervinientesFormateados: IntervinienteResumen[] = (miembros || []).map((m: any) => {
        const mandatoActivo = m.mandatos?.find((ma: any) => ma.estado_mandato === 'ACTIVO');
        return {
            id: m.id,
            nombre: m.usuario?.nombre_completo || m.usuario?.email || 'Usuario',
            email: m.usuario?.email || null,
            rol: m.tipo_rol_usuario,
            rolLabel: getRolCertificateLabel(m.tipo_rol_usuario),
            mandatoTipo: mandatoActivo?.tipo_mandato || null,
            mandatoLabel: mandatoActivo ? getMandatoCertificateLabel(mandatoActivo.tipo_mandato) : null,
            fechaAltaMandato: mandatoActivo?.created_at || null
        };
    });

    // 7. Generar contenido HTML
    const fechaGeneracion = new Date().toISOString();
    const contenidoHtml = generateCertificateHtml({
        contrato,
        eventos: eventosFormateados,
        comunicaciones: comunicacionesFormateadas,
        documentos: documentosFormateados,
        intervinientes: intervinientesFormateados,
        fechaGeneracion
    });

    // 7. Calcular hash del certificado
    const hashCertificado = createHash('sha256')
        .update(contenidoHtml)
        .digest('hex');

    // 8. Sellar con QTSP
    let selloQtspId: string | null = null;
    try {
        const qtspResponse = await requestQualifiedTimestamp(hashCertificado);

        const { data: sello } = await supabase
            .from('sellos_tiempo')
            .insert({
                proveedor: qtspResponse.proveedor,
                marca: qtspResponse.marca,
                hash_sha256: hashCertificado,
                rfc3161_tst_base64: qtspResponse.rfc3161TstBase64,
                fecha_sello: qtspResponse.fechaSello,
                estado: 'EMITIDO',
                metadata_json: JSON.stringify({
                    tipo: 'CERTIFICADO_EVENTOS',
                    contrato_id: contratoId,
                    numero_expediente: contrato.numero_expediente
                })
            })
            .select('id')
            .single();

        selloQtspId = sello?.id || null;
    } catch (err) {
        console.error('Error sellando certificado:', err);
    }

    // 9. Registrar evento
    await supabase
        .from('eventos')
        .insert({
            contrato_id: contratoId,
            tipo: 'CERTIFICADO_GENERADO',
            payload: {
                hash_certificado: hashCertificado,
                sello_qtsp_id: selloQtspId,
                total_eventos: eventosFormateados.length,
                total_comunicaciones: comunicacionesFormateadas.length,
                total_documentos: documentosFormateados.length
            }
        });

    return {
        contratoId,
        numeroExpediente: contrato.numero_expediente,
        fechaGeneracion,
        hashCertificado,
        selloQtspId,
        resumen: {
            totalEventos: eventosFormateados.length,
            totalComunicaciones: comunicacionesFormateadas.length,
            comunicacionesInternas: comunicacionesFormateadas.filter(c => !c.es_externa).length,
            comunicacionesExternas: comunicacionesFormateadas.filter(c => c.es_externa).length,
            totalDocumentos: documentosFormateados.length
        },
        eventos: eventosFormateados,
        comunicaciones: comunicacionesFormateadas,
        documentos: documentosFormateados,
        contenidoHtml
    };
}

/**
 * Genera el HTML del certificado
 */
function generateCertificateHtml(data: {
    contrato: any;
    eventos: EventoCompleto[];
    comunicaciones: ComunicacionResumen[];
    documentos: DocumentoResumen[];
    intervinientes: IntervinienteResumen[];
    fechaGeneracion: string;
}): string {
    const { contrato, eventos, comunicaciones, documentos, intervinientes, fechaGeneracion } = data;

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const tipoEventoLabel = (tipo: string) => {
        const labels: Record<string, string> = {
            'CONTRATO_CREADO': '📝 Contrato creado',
            'ACEPTACION_TERMINOS': '✅ Términos aceptados',
            'BORRADOR_GENERADO': '📄 Borrador generado',
            'FIRMA_ELECTRONICA': '✍️ Firma electrónica',
            'ARRAS_DECLARADAS': '💰 Arras declaradas',
            'PAGO_ARRAS_CONFIRMADO': '✅ Pago confirmado',
            'CONVOCATORIA_NOTARIAL': '⚖️ Convocatoria notarial',
            'ESCRITURA_OTORGADA': '📜 Escritura otorgada',
            'COMUNICACION_ENVIADA': '📨 Comunicación enviada',
            'COMUNICACION_EXTERNA_IMPORTADA': '📥 Comunicación externa',
            'DOCUMENTO_SUBIDO': '📎 Documento subido',
            'DOCUMENTO_VALIDADO': '✅ Documento validado',
            'CERTIFICADO_GENERADO': '📋 Certificado generado'
        };
        return labels[tipo] || `📌 ${tipo.replace(/_/g, ' ')}`;
    };

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificado de Eventos - ${contrato.numero_expediente}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f7fa;
            color: #2d3748;
            line-height: 1.6;
            padding: 2rem;
        }
        .certificate {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #4299e1, #3182ce);
            color: white;
            padding: 2rem;
            text-align: center;
        }
        .header h1 { font-size: 1.8rem; margin-bottom: 0.5rem; }
        .header .expediente { font-size: 1.2rem; opacity: 0.9; }
        .header .fecha { font-size: 0.9rem; opacity: 0.8; margin-top: 0.5rem; }
        .content { padding: 2rem; }
        .section { margin-bottom: 2rem; }
        .section h2 { 
            font-size: 1.2rem; 
            color: #4a5568;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 0.5rem;
            margin-bottom: 1rem;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        .summary-item {
            background: #f7fafc;
            padding: 1rem;
            border-radius: 8px;
            text-align: center;
        }
        .summary-item .number { font-size: 2rem; font-weight: bold; color: #4299e1; }
        .summary-item .label { font-size: 0.85rem; color: #718096; }
        .timeline { position: relative; padding-left: 2rem; }
        .timeline::before {
            content: '';
            position: absolute;
            left: 8px;
            top: 0;
            bottom: 0;
            width: 2px;
            background: #e2e8f0;
        }
        .event {
            position: relative;
            padding: 1rem;
            margin-bottom: 1rem;
            background: #f7fafc;
            border-radius: 8px;
            border-left: 3px solid #4299e1;
        }
        .event::before {
            content: '';
            position: absolute;
            left: -1.75rem;
            top: 1.25rem;
            width: 12px;
            height: 12px;
            background: #4299e1;
            border-radius: 50%;
            border: 2px solid white;
        }
        .event.externa { border-left-color: #48bb78; }
        .event.externa::before { background: #48bb78; }
        .event-date { font-size: 0.8rem; color: #718096; margin-bottom: 0.25rem; }
        .event-title { font-weight: 600; color: #2d3748; }
        .event-hash { font-size: 0.7rem; color: #a0aec0; font-family: monospace; margin-top: 0.5rem; }
        .document-list { list-style: none; }
        .document-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 0.75rem;
            background: #f7fafc;
            border-radius: 8px;
            margin-bottom: 0.5rem;
        }
        .document-icon { font-size: 1.5rem; }
        .document-info { flex: 1; }
        .document-name { font-weight: 500; }
        .document-meta { font-size: 0.8rem; color: #718096; }
        .footer {
            background: #2d3748;
            color: white;
            padding: 1.5rem 2rem;
            font-size: 0.85rem;
        }
        .footer-hash { 
            font-family: monospace; 
            font-size: 0.75rem; 
            background: rgba(255,255,255,0.1);
            padding: 0.5rem;
            border-radius: 4px;
            word-break: break-all;
            margin-top: 0.5rem;
        }
        .seal { display: inline-block; margin-left: 0.5rem; color: #f6ad55; }
    </style>
</head>
<body>
    <div class="certificate">
        <div class="header">
            <h1>📋 Certificado de Eventos del Expediente</h1>
            <div class="expediente">${contrato.numero_expediente}</div>
            <div class="fecha">Generado el ${formatDate(fechaGeneracion)}</div>
        </div>
        
        <div class="content">
            <div class="summary">
                <div class="summary-item">
                    <div class="number">${eventos.length}</div>
                    <div class="label">Eventos</div>
                </div>
                <div class="summary-item">
                    <div class="number">${comunicaciones.filter(c => !c.es_externa).length}</div>
                    <div class="label">Com. Internas</div>
                </div>
                <div class="summary-item">
                    <div class="number">${comunicaciones.filter(c => c.es_externa).length}</div>
                    <div class="label">Com. Externas</div>
                </div>
                <div class="summary-item">
                    <div class="number">${documentos.length}</div>
                    <div class="label">Documentos</div>
                </div>
            </div>

            <div class="section">
                <h2>👥 Intervinientes y Régimen de Actuación</h2>
                <table style="width: 100%; border-collapse: collapse; margin-top: 1rem;">
                    <thead>
                        <tr style="background: #f7fafc; text-align: left;">
                            <th style="padding: 0.75rem; border-bottom: 2px solid #e2e8f0;">Nombre</th>
                            <th style="padding: 0.75rem; border-bottom: 2px solid #e2e8f0;">Rol en Sistema</th>
                            <th style="padding: 0.75rem; border-bottom: 2px solid #e2e8f0;">Régimen de Actuación</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${intervinientes.map(i => `
                            <tr>
                                <td style="padding: 0.75rem; border-bottom: 1px solid #e2e8f0;">
                                    <strong>${i.nombre}</strong>
                                    ${i.email ? `<br><span style="font-size: 0.85rem; color: #718096;">${i.email}</span>` : ''}
                                </td>
                                <td style="padding: 0.75rem; border-bottom: 1px solid #e2e8f0;">${i.rolLabel}</td>
                                <td style="padding: 0.75rem; border-bottom: 1px solid #e2e8f0;">
                                    ${i.mandatoLabel ? `<span style="color: #2b6cb0;">${i.mandatoLabel}</span>` : '<span style="color: #a0aec0;">—</span>'}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ${intervinientes.length === 0 ? '<p style="color: #718096; margin-top: 1rem;">No hay intervinientes registrados en el expediente.</p>' : ''}
            </div>

            <div class="section">
                <h2>📅 Línea Temporal de Eventos</h2>
                <div class="timeline">
                    ${eventos.map(e => `
                        <div class="event">
                            <div class="event-date">${formatDate(e.created_at)}</div>
                            <div class="event-title">${tipoEventoLabel(e.tipo)}${e.sello_id ? '<span class="seal">🔐</span>' : ''}</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            ${comunicaciones.length > 0 ? `
            <div class="section">
                <h2>💬 Comunicaciones</h2>
                <div class="timeline">
                    ${comunicaciones.map(c => `
                        <div class="event ${c.es_externa ? 'externa' : ''}">
                            <div class="event-date">${formatDate(c.fecha_comunicacion)}</div>
                            <div class="event-title">
                                ${c.es_externa ? '📥 Externa' : c.tipo_comunicacion.replace(/_/g, ' ')}: 
                                ${c.asunto || 'Sin asunto'}
                                ${c.sello_qtsp_id ? '<span class="seal">🔐</span>' : ''}
                            </div>
                            <div class="event-meta">${c.remitente} → ${c.destinatarios}</div>
                            ${c.hash_contenido ? `<div class="event-hash">Hash: ${c.hash_contenido.substring(0, 32)}...</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            ${documentos.length > 0 ? `
            <div class="section">
                <h2>📎 Documentos</h2>
                <ul class="document-list">
                    ${documentos.map(d => `
                        <li class="document-item">
                            <span class="document-icon">📄</span>
                            <div class="document-info">
                                <div class="document-name">${d.nombre_original}</div>
                                <div class="document-meta">
                                    ${d.tipo} | ${d.estado}
                                    ${d.hash_sha256 ? ` | Hash: ${d.hash_sha256.substring(0, 16)}...` : ''}
                                </div>
                            </div>
                        </li>
                    `).join('')}
                </ul>
            </div>
            ` : ''}
        </div>

        <div class="footer">
            <p>
                <strong>🔐 Certificado sellado con marca de tiempo cualificada (QTSP)</strong>
            </p>
            <p>Este documento certifica la secuencia y contenido de los eventos registrados en el expediente.</p>
        </div>
    </div>
</body>
</html>
    `.trim();
}

/**
 * Obtiene certificado previo si existe
 */
export async function getExistingCertificate(contratoId: string) {
    const { data } = await supabase
        .from('eventos')
        .select('*')
        .eq('contrato_id', contratoId)
        .eq('tipo', 'CERTIFICADO_GENERADO')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    return data;
}
