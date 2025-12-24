import PDFDocument from 'pdfkit';
import { ContratoFull } from '../types/models.js';
import * as TEMPLATES from '../templates/contract-templates.js';

/**
 * Genera el PDF del contrato según la plantilla ICADE
 * Incluye: Portada + Términos Estándar
 */
export async function generateDraftPDF(full: ContratoFull): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 60, bottom: 60, left: 72, right: 72 },
            });

            const chunks: Buffer[] = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Extraer datos del objeto ContratoFull con fallbacks
            const contrato = full.contrato;
            const inmueble = full.inmueble || contrato?.inmueble;
            const partes = full.partes || [];

            // Validación básica - si no hay contrato, no podemos continuar
            if (!contrato) {
                doc.fontSize(14).font('Helvetica-Bold')
                    .text('Error: No se encontraron datos del contrato', { align: 'center' });
                doc.end();
                return;
            }

            // PORTADA
            // ============================================

            // Header naranja
            doc.rect(0, 0, 595, 50).fillColor('#FF6B35').fill();

            doc.fillColor('#000000');
            doc.moveDown(2);

            // Título
            doc
                .fontSize(18)
                .font('Helvetica-Bold')
                .text('Contrato de compraventa con arras penitenciales', { align: 'center' });

            doc.moveDown(1.5);

            // Disclaimer de uso
            doc.fontSize(9).font('Helvetica-Bold').text('UTILIZACIÓN DE ESTE CONTRATO');
            doc.fontSize(8).font('Helvetica').text(
                'Este es un contrato entre dos personas físicas para la compraventa de una vivienda sujeta a arras penitenciales, que desplegará todos sus efectos cuando las partes otorguen ante notario la correspondiente escritura de compraventa. Las arras penitenciales permiten a las partes desistir libremente del contrato antes de formalizar la compraventa: si desiste el comprador, pierde las arras; si desiste el vendedor, las devuelve duplicadas.',
                { align: 'justify', lineGap: 2 }
            );

            doc.moveDown();

            // Sección Portada
            doc.fontSize(11).font('Helvetica-Bold').text('Portada', { underline: true });
            doc.moveDown(0.5);

            // Vendedor
            const vendedores = partes.filter((p: any) => p.rol_en_contrato === 'VENDEDOR');
            doc.fontSize(9).font('Helvetica-Bold').text('Vendedor');
            if (vendedores.length === 1) {
                doc.fontSize(8).font('Helvetica').text('[X] Vendedor único');
            } else if (vendedores.length > 1) {
                doc.fontSize(8).font('Helvetica').text('[X] Varios vendedores en proindiviso');
            }
            doc.moveDown(0.5);

            // Comprador
            const compradores = partes.filter((p: any) => p.rol_en_contrato === 'COMPRADOR');
            doc.fontSize(9).font('Helvetica-Bold').text('Comprador');
            if (compradores.length === 1) {
                doc.fontSize(8).font('Helvetica').text('[X] Comprador único');
            } else if (compradores.length > 1) {
                doc.fontSize(8).font('Helvetica').text('[X] Varios compradores en proindiviso');
            }
            doc.moveDown(0.5);

            // Vivienda
            doc.fontSize(9).font('Helvetica-Bold').text('Vivienda');
            doc.fontSize(8).font('Helvetica');

            if (!inmueble) {
                doc.text('Dirección: (Inmueble no especificado)');
            } else {
                doc.text(`Dirección: ${inmueble.direccion_completa}, ${inmueble.codigo_postal || ''} ${inmueble.ciudad}, ${inmueble.provincia}`);

                if (inmueble.titulo_adquisicion_vendedor) {
                    doc.text(`Título de adquisición del Vendedor: ${inmueble.titulo_adquisicion_vendedor}`);
                }

                if (inmueble.datos_registrales) {
                    doc.text(`Datos registrales: ${inmueble.datos_registrales}`);
                }

                if (inmueble.nota_simple_fecha && inmueble.nota_simple_csv) {
                    doc.text(`Nota Simple: Fecha ${new Date(inmueble.nota_simple_fecha).toLocaleDateString('es-ES')}, CSV: ${inmueble.nota_simple_csv}`);
                }

                if (inmueble.referencia_catastral) {
                    doc.text(`Referencia catastral: ${inmueble.referencia_catastral}`);
                }

                doc.moveDown(0.5);

                // Precio de Compra
                doc.fontSize(9).font('Helvetica-Bold').text('Precio de Compra');
                doc.fontSize(8).font('Helvetica').text(`${contrato.precio_total.toLocaleString('es-ES')} ${contrato.moneda}`);
                doc.moveDown(0.5);

                // Importe de las Arras
                doc.fontSize(9).font('Helvetica-Bold').text('Importe de las Arras');
                doc.fontSize(8).font('Helvetica').text(`${contrato.importe_arras.toLocaleString('es-ES')} ${contrato.moneda} (${contrato.porcentaje_arras_calculado}%)`);
                doc.moveDown(0.5);

                // Forma de Pago
                doc.fontSize(9).font('Helvetica-Bold').text('Forma de Pago de las Arras');
                doc.fontSize(8).font('Helvetica');
                if (contrato.forma_pago_arras === 'AL_FIRMAR') {
                    doc.text('[X] El pago de las arras se realiza en el momento de la firma del Contrato de Compraventa');
                } else {
                    doc.text('[X] El pago de las arras se realizará después de la firma del Contrato de Compraventa');
                    if (contrato.plazo_pago_arras_dias) {
                        doc.text(`    Plazo de Pago: ${contrato.plazo_pago_arras_dias} días desde la firma`);
                    }
                    if (contrato.fecha_limite_pago_arras) {
                        doc.text(`    Fecha Límite: ${new Date(contrato.fecha_limite_pago_arras).toLocaleDateString('es-ES')}`);
                    }
                }
                doc.moveDown(0.5);

                // IBAN y Banco
                if (contrato.iban_vendedor) {
                    doc.fontSize(9).font('Helvetica-Bold').text('IBAN');
                    doc.fontSize(8).font('Helvetica').text(contrato.iban_vendedor);
                    doc.moveDown(0.3);
                }

                if (contrato.banco_vendedor) {
                    doc.fontSize(9).font('Helvetica-Bold').text('Banco');
                    doc.fontSize(8).font('Helvetica').text(contrato.banco_vendedor);
                    doc.moveDown(0.5);
                }

                // Escritura de Compraventa
                doc.fontSize(9).font('Helvetica-Bold').text('Escritura de Compraventa');
                doc.fontSize(8).font('Helvetica');
                doc.text(`Fecha Límite para Otorgar la Escritura: ${new Date(contrato.fecha_limite_firma_escritura).toLocaleDateString('es-ES')}`);
                if (contrato.notario_designado_nombre) {
                    doc.text(`Notario: ${contrato.notario_designado_nombre}`);
                    if (contrato.notario_designado_direccion) {
                        doc.text(`         ${contrato.notario_designado_direccion}`);
                    }
                }
                doc.moveDown(0.5);

                // Pago de Gastos
                doc.fontSize(9).font('Helvetica-Bold').text('Pago de Gastos');
                doc.fontSize(8).font('Helvetica');
                if (contrato.gastos_quien === 'LEY') {
                    doc.text('[X] El Vendedor asumirá los gastos de la escritura, y el comprador los de la primera copia, conforme a la ley');
                } else {
                    doc.text('[X] Por el Comprador');
                }
                doc.moveDown(0.5);

                // Vía Resolución de Conflictos
                doc.fontSize(9).font('Helvetica-Bold').text('Vía Resolución de Conflictos');
                doc.fontSize(8).font('Helvetica');
                if (contrato.via_resolucion === 'JUZGADOS') {
                    doc.text('[X] Juzgados y tribunales del lugar donde se encuentra la vivienda');
                } else {
                    doc.text('[X] Arbitraje notarial de derecho');
                }
                doc.moveDown(0.5);

                // Firma
                doc.fontSize(9).font('Helvetica-Bold').text('Firma');
                doc.fontSize(8).font('Helvetica');
                if (contrato.firma_preferida === 'ELECTRONICA') {
                    doc.text('[X] Electrónica');
                } else {
                    doc.text('[X] Manuscrita');
                }
                doc.moveDown(0.5);

                // Condición suspensiva
                if (contrato.condicion_suspensiva_texto) {
                    doc.fontSize(9).font('Helvetica-Bold').text('Condición Suspensiva');
                    doc.fontSize(8).font('Helvetica').text(contrato.condicion_suspensiva_texto, { align: 'justify' });
                    doc.moveDown(0.5);
                }

                // Observaciones
                if (contrato.observaciones) {
                    doc.fontSize(9).font('Helvetica-Bold').text('Observaciones');
                    doc.fontSize(8).font('Helvetica').text(contrato.observaciones, { align: 'justify' });
                    doc.moveDown(0.5);
                }

                // Cambios a Términos Estándar
                if (contrato.cambios_terminos_estandar) {
                    doc.fontSize(9).font('Helvetica-Bold').text('Otros cambios a los Términos Estándar');
                    doc.fontSize(8).font('Helvetica').text(contrato.cambios_terminos_estandar, { align: 'justify' });
                    doc.moveDown();
                }

                // ============================================
                // TABLAS DE PARTES
                // ============================================
                doc.addPage();

                // Vendedores
                vendedores.forEach((vp: any, index: number) => {
                    const parte = vp.parte;
                    doc.fontSize(10).font('Helvetica-Bold').text(`VENDEDOR ${index + 1}`);
                    doc.moveDown(0.3);

                    doc.fontSize(8).font('Helvetica');
                    doc.text(`Nombre: ${parte.nombre} ${parte.apellidos}`);
                    doc.text(`DNI/NIE/Pasaporte: ${parte.numero_documento}`);
                    if (parte.estado_civil) doc.text(`Estado civil: ${parte.estado_civil}`);
                    if (parte.domicilio) doc.text(`Domicilio: ${parte.domicilio}`);
                    if (parte.email) doc.text(`Correo electrónico: ${parte.email}`);
                    if (vp.porcentaje_propiedad) doc.text(`% de la vivienda: ${vp.porcentaje_propiedad}%`);
                    doc.text(`Firma: _______________________`);
                    doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`);
                    doc.moveDown();
                });

                // Compradores
                compradores.forEach((cp: any, index: number) => {
                    const parte = cp.parte;
                    doc.fontSize(10).font('Helvetica-Bold').text(`COMPRADOR ${index + 1}`);
                    doc.moveDown(0.3);

                    doc.fontSize(8).font('Helvetica');
                    doc.text(`Nombre: ${parte.nombre} ${parte.apellidos}`);
                    doc.text(`DNI/NIE/Pasaporte: ${parte.numero_documento}`);
                    if (parte.estado_civil) doc.text(`Estado civil: ${parte.estado_civil}`);
                    if (parte.domicilio) doc.text(`Domicilio: ${parte.domicilio}`);
                    if (parte.email) doc.text(`Correo electrónico: ${parte.email}`);
                    if (cp.porcentaje_propiedad) doc.text(`% de la vivienda: ${cp.porcentaje_propiedad}%`);
                    doc.text(`Firma: _______________________`);
                    doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`);
                    doc.moveDown();
                });

                // ============================================
                // TÉRMINOS ESTÁNDAR (MODULAR)
                // ============================================
                doc.addPage();

                // Header naranja
                doc.rect(0, 0, 595, 40).fillColor('#FF6B35').fill();
                doc.fillColor('#FFFFFF').fontSize(14).font('Helvetica-Bold');
                doc.text('TÉRMINOS ESTÁNDAR', 72, 15, { align: 'right' });

                doc.fillColor('#000000').moveDown(2);

                doc.fontSize(12).font('Helvetica-Bold').text('Términos estándar');
                doc.moveDown();

                // ============================================
                // DETERMINAR CONDICIONES DEL CONTRATO
                // ============================================
                const tipoArras = contrato.tipo_arras || 'PENITENCIALES';
                const objeto = contrato.objeto || 'VIVIENDA';
                const sinHipoteca = contrato.sinHipoteca !== false; // default true
                const formaPagoArras = contrato.forma_pago_arras || 'AL_FIRMAR';
                const usaEscrow = formaPagoArras === 'ESCROW' || contrato.escrow?.activo;
                const tieneRetenciones = contrato.retenciones?.activa;
                const tieneMobiliario = contrato.mobiliarioEquipamiento;
                const provincia = inmueble?.provincia || '';
                const esForal = TEMPLATES.isTerritoryForal(provincia);
                const viaResolucion = contrato.via_resolucion || 'JUZGADOS';
                const tipoFirma = contrato.firma_preferida || 'ELECTRONICA';

                // ============================================
                // 1. OBJETO
                // ============================================
                doc.fontSize(10).font('Helvetica-Bold').text('1. OBJETO');
                doc.moveDown(0.3);

                // 1.1 Objeto (según tipo de arras)
                const texto1_1 = TEMPLATES.CLAUSULA_1_1_TEXTO[tipoArras as keyof typeof TEMPLATES.CLAUSULA_1_1_TEXTO]
                    || TEMPLATES.CLAUSULA_1_1_TEXTO.PENITENCIALES;
                doc.fontSize(8).font('Helvetica-Bold').text('1.1 Objeto.');
                doc.font('Helvetica').text(` ${texto1_1}`, { align: 'justify' });
                doc.moveDown(0.5);

                // 1.2 Finalización
                doc.fontSize(8).font('Helvetica-Bold').text('1.2 Finalización de la compraventa.');
                doc.font('Helvetica').text(
                    ' La entrega de la Vivienda y la transmisión de su propiedad al Comprador se harán en el momento de otorgar la escritura pública de compraventa.',
                    { align: 'justify' }
                );
                doc.moveDown(0.5);

                // 1.3 Estado (varía según objeto)
                if (objeto !== 'VIVIENDA') {
                    doc.fontSize(8).font('Helvetica-Bold').text(TEMPLATES.CLAUSULA_1_3_NO_VIVIENDA.titulo);
                    TEMPLATES.CLAUSULA_1_3_NO_VIVIENDA.parrafos.forEach(p => {
                        doc.fontSize(7).font('Helvetica-Bold').text(`    ${p.subtitulo}`);
                        doc.font('Helvetica').text(`        ${p.texto}`, { align: 'justify' });
                        doc.moveDown(0.3);
                    });
                } else {
                    doc.fontSize(8).font('Helvetica-Bold').text('1.3 Estado de la Vivienda.');
                    doc.font('Helvetica').text(' El Vendedor manifiesta:', { align: 'justify' });
                    doc.moveDown(0.3);
                    TEMPLATES.CLAUSULA_1_3_VIVIENDA_ITEMS.forEach(item => {
                        doc.fontSize(7).font('Helvetica-Bold').text(`    (${item.title.charAt(0).toLowerCase()}) ${item.title}`);
                        doc.font('Helvetica').text(`        ${item.text}`, { align: 'justify' });
                        doc.moveDown(0.3);
                    });
                }

                // 1.X Mobiliario (si aplica)
                if (tieneMobiliario) {
                    doc.moveDown(0.3);
                    doc.fontSize(8).font('Helvetica-Bold').text(TEMPLATES.CLAUSULA_1_X_MOBILIARIO.titulo);
                    doc.font('Helvetica').text(` ${TEMPLATES.CLAUSULA_1_X_MOBILIARIO.texto}`, { align: 'justify' });
                }

                doc.moveDown(0.5);
                if (doc.y > 650) doc.addPage();

                // ============================================
                // 2. OBLIGACIONES DEL COMPRADOR
                // ============================================
                doc.fontSize(10).font('Helvetica-Bold').text('2. OBLIGACIONES DEL COMPRADOR');
                doc.moveDown(0.3);

                doc.fontSize(8).font('Helvetica-Bold').text('2.1 Pago de la Vivienda.');
                doc.font('Helvetica').text(
                    ' El Comprador pagará el Precio de Compra de la Vivienda (restándole el Importe de las Arras) al Vendedor mediante transferencia bancaria cuando se otorgue la escritura de compraventa.',
                    { align: 'justify' }
                );
                doc.moveDown(0.5);

                // 2.2 Pago de arras (ESCROW o normal según forma de pago)
                if (usaEscrow) {
                    doc.fontSize(8).font('Helvetica-Bold').text(TEMPLATES.CLAUSULA_2_2_ESCROW.titulo);
                    doc.font('Helvetica').text(` ${TEMPLATES.CLAUSULA_2_2_ESCROW.texto}`, { align: 'justify' });
                } else {
                    doc.fontSize(8).font('Helvetica-Bold').text(TEMPLATES.CLAUSULA_2_2_NORMAL.titulo);
                    doc.font('Helvetica').text(` ${TEMPLATES.CLAUSULA_2_2_NORMAL.intro}`, { align: 'justify' });
                    doc.moveDown(0.3);

                    // Opción según forma de pago y tipo de arras
                    let opcionPago = '';
                    if (formaPagoArras === 'AL_FIRMAR') {
                        opcionPago = TEMPLATES.CLAUSULA_2_2_NORMAL.opcion_AL_FIRMAR;
                    } else {
                        const key = `opcion_POSTERIOR_${tipoArras}` as keyof typeof TEMPLATES.CLAUSULA_2_2_NORMAL;
                        opcionPago = TEMPLATES.CLAUSULA_2_2_NORMAL[key] || TEMPLATES.CLAUSULA_2_2_NORMAL.opcion_POSTERIOR_PENITENCIALES;
                    }
                    doc.text(` ${opcionPago}`, { align: 'justify' });
                }
                doc.moveDown(0.5);

                doc.fontSize(8).font('Helvetica-Bold').text('2.3 Notificar la cita con la Notaría.');
                doc.font('Helvetica').text(
                    ' El Comprador comunicará al Vendedor la fecha del otorgamiento de la escritura de compraventa con 10 días de antelación.',
                    { align: 'justify' }
                );
                doc.moveDown();

                // ============================================
                // 3. OBLIGACIONES DEL VENDEDOR
                // ============================================
                if (doc.y > 600) doc.addPage();

                doc.fontSize(10).font('Helvetica-Bold').text('3. OBLIGACIONES DEL VENDEDOR');
                doc.moveDown(0.3);

                doc.fontSize(8).font('Helvetica-Bold').text('3.1 Entrega de la Vivienda.');
                doc.font('Helvetica').text(
                    ' El Vendedor entregará al Comprador la propiedad de la Vivienda mediante la entrega de las llaves cuando se firme la escritura de compraventa.',
                    { align: 'justify' }
                );
                doc.moveDown(0.5);

                doc.fontSize(8).font('Helvetica-Bold').text('3.2 Periodo intermedio.');
                doc.font('Helvetica').text(
                    ' Desde la firma de este Contrato hasta la escritura de compraventa, el Vendedor se compromete a mantener la Vivienda en buen estado y no constituir cargas sin autorización del Comprador.',
                    { align: 'justify' }
                );
                doc.moveDown(0.5);

                // 3.X Hipoteca (si sinHipoteca = false)
                if (!sinHipoteca) {
                    doc.fontSize(8).font('Helvetica-Bold').text(TEMPLATES.CLAUSULA_3_X_HIPOTECA.titulo);
                    doc.font('Helvetica').text(` ${TEMPLATES.CLAUSULA_3_X_HIPOTECA.texto}`, { align: 'justify' });
                    doc.moveDown(0.5);
                }
                doc.moveDown();

                // ============================================
                // 4. OTRAS OBLIGACIONES
                // ============================================
                doc.fontSize(10).font('Helvetica-Bold').text('4. OTRAS OBLIGACIONES (GASTOS, IMPUESTOS Y SUMINISTROS)');
                doc.moveDown(0.3);

                doc.fontSize(8).font('Helvetica-Bold').text('4.1 Impuestos.');
                doc.font('Helvetica').text(
                    ' El Vendedor pagará la plusvalía municipal. El IBI se dividirá proporcionalmente.',
                    { align: 'justify' }
                );
                doc.moveDown(0.5);

                // 4.2 Régimen fiscal (varía según objeto)
                if (objeto !== 'VIVIENDA') {
                    doc.fontSize(8).font('Helvetica-Bold').text(TEMPLATES.CLAUSULA_4_2_NO_VIVIENDA.titulo);
                    TEMPLATES.CLAUSULA_4_2_NO_VIVIENDA.parrafos.forEach(p => {
                        doc.fontSize(7).font('Helvetica-Bold').text(`    ${p.subtitulo}`);
                        doc.font('Helvetica').text(`        ${p.texto}`, { align: 'justify' });
                        doc.moveDown(0.3);
                    });
                }

                // 4.X Retenciones (si aplica)
                if (tieneRetenciones) {
                    doc.fontSize(8).font('Helvetica-Bold').text(TEMPLATES.CLAUSULA_4_X_RETENCIONES.titulo);
                    doc.font('Helvetica').text(` ${TEMPLATES.CLAUSULA_4_X_RETENCIONES.texto}`, { align: 'justify' });
                    doc.moveDown(0.5);
                }
                doc.moveDown();

                // ============================================
                // 5. DESISTIMIENTO/INCUMPLIMIENTO (según tipo arras)
                // ============================================
                if (doc.y > 550) doc.addPage();

                const clausula5 = TEMPLATES.CLAUSULA_5[tipoArras as keyof typeof TEMPLATES.CLAUSULA_5]
                    || TEMPLATES.CLAUSULA_5.PENITENCIALES;

                doc.fontSize(10).font('Helvetica-Bold').text(clausula5.titulo);
                doc.moveDown(0.3);

                clausula5.clausulas.forEach(c => {
                    doc.fontSize(8).font('Helvetica-Bold').text(`${c.num} ${c.titulo}`);
                    doc.font('Helvetica').text(` ${c.texto}`, { align: 'justify' });
                    doc.moveDown(0.5);
                });

                // ============================================
                // 6-10: Secciones restantes
                // ============================================
                if (doc.y > 600) doc.addPage();

                // 6. NOTIFICACIONES
                doc.fontSize(10).font('Helvetica-Bold').text('6. NOTIFICACIONES');
                doc.fontSize(8).font('Helvetica').text(
                    ' Las comunicaciones entre las partes se realizarán por escrito a las direcciones indicadas. El cambio de dirección deberá notificarse fehacientemente.',
                    { align: 'justify' }
                );
                doc.moveDown(0.5);

                // 7. CESIÓN
                doc.fontSize(10).font('Helvetica-Bold').text('7. CESIÓN');
                doc.fontSize(8).font('Helvetica').text(
                    ' Ninguna de las partes podrá ceder los derechos y obligaciones del presente contrato sin el consentimiento escrito de la otra parte.',
                    { align: 'justify' }
                );
                doc.moveDown(0.5);

                // 8. RESOLUCIÓN DE CONFLICTOS
                if (doc.y > 680) doc.addPage();
                doc.fontSize(10).font('Helvetica-Bold').text('8. RESOLUCIÓN DE CONFLICTOS');
                const textoConflictos = viaResolucion === 'ARBITRAJE_NOTARIAL'
                    ? TEMPLATES.CLAUSULA_8.ARBITRAJE
                    : TEMPLATES.CLAUSULA_8.JUZGADOS;
                doc.fontSize(8).font('Helvetica').text(` ${textoConflictos}`, { align: 'justify' });
                doc.moveDown(0.5);

                // 9. LEY APLICABLE
                doc.fontSize(10).font('Helvetica-Bold').text('9. LEY APLICABLE');
                const textoLey = esForal ? TEMPLATES.CLAUSULA_9.FORAL : TEMPLATES.CLAUSULA_9.COMUN;
                doc.fontSize(8).font('Helvetica').text(` ${textoLey}`, { align: 'justify' });
                doc.moveDown(0.5);

                // 10. FIRMA
                doc.fontSize(10).font('Helvetica-Bold').text('10. FIRMA');
                const textoFirma = tipoFirma === 'MANUSCRITA'
                    ? TEMPLATES.CLAUSULA_10.MANUSCRITA
                    : TEMPLATES.CLAUSULA_10.ELECTRONICA;
                doc.fontSize(8).font('Helvetica').text(` ${textoFirma}`, { align: 'justify' });
                doc.moveDown();

                // Footer
                doc.fontSize(7).font('Helvetica').text(
                    `Generado el: ${new Date().toLocaleString('es-ES')} | Hash: ${contrato.version_hash?.substring(0, 16) || 'N/A'}...`,
                    { align: 'center' }
                );

            }

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Genera el PDF firmado (versión completa con firmas certificadas)
 */
export async function generateSignedPDF(full: ContratoFull): Promise<Buffer> {
    // Por ahora usamos la misma estructura, luego se puede extender
    return generateDraftPDF(full);
}

// ============================================
// CERTIFICADOS DE EVENTOS
// ============================================

interface EventCertificateData {
    evento: {
        id: string;
        tipo: string;
        fecha_hora: string;
        hash_sha256: string;
        prev_hash_sha256?: string;
        actor_parte_id?: string;
        payload_json?: Record<string, any> | string;
    };
    contrato: {
        id: string;
        numero_expediente?: string;
        identificador_unico?: string;
        estado?: string;
    };
    actorNombre?: string;
    selloQTSP?: {
        proveedor?: string;
        fecha_sello?: string;
        rfc3161_tst_base64?: string;
    };
}

/**
 * Genera un PDF de certificado para un evento específico
 * Incluye datos del evento, hash para verificación y sello QTSP si existe
 */
export async function generateEventCertificatePDF(data: EventCertificateData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 60, bottom: 60, left: 72, right: 72 },
            });

            const chunks: Buffer[] = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const { evento, contrato, actorNombre, selloQTSP } = data;

            // ============================================
            // HEADER
            // ============================================
            doc.rect(0, 0, 595, 60).fillColor('#1a365d').fill();
            doc.fillColor('#ffffff')
                .fontSize(16)
                .font('Helvetica-Bold')
                .text('CERTIFICADO DE EVENTO', 72, 22);
            doc.fontSize(10)
                .font('Helvetica')
                .text('ChronoFlare Platform', 72, 40);

            // QTSP Badge si existe
            if (selloQTSP) {
                doc.fillColor('#48bb78')
                    .fontSize(9)
                    .text('✓ QTSP CERTIFIED', 450, 25, { align: 'right' });
            }

            doc.fillColor('#000000');
            doc.moveDown(3);

            // ============================================
            // INFO DEL EXPEDIENTE
            // ============================================
            doc.fontSize(11).font('Helvetica-Bold').text('Expediente');
            doc.fontSize(10).font('Helvetica');
            doc.text(`Número: ${contrato.numero_expediente || contrato.identificador_unico || contrato.id}`);
            doc.text(`Estado: ${contrato.estado || 'N/A'}`);
            doc.moveDown();

            // ============================================
            // DATOS DEL EVENTO
            // ============================================
            doc.fontSize(11).font('Helvetica-Bold').text('Datos del Evento');
            doc.fontSize(10).font('Helvetica');

            const fechaEvento = new Date(evento.fecha_hora);
            doc.text(`Tipo: ${formatEventType(evento.tipo)}`);
            doc.text(`Fecha y Hora: ${fechaEvento.toLocaleString('es-ES', {
                dateStyle: 'full',
                timeStyle: 'long'
            })}`);
            doc.text(`ID Evento: ${evento.id}`);

            if (actorNombre) {
                doc.text(`Actor: ${actorNombre}`);
            }
            doc.moveDown();

            // Payload del evento (si existe)
            let payload: Record<string, any> | null = null;
            if (evento.payload_json) {
                payload = typeof evento.payload_json === 'string'
                    ? JSON.parse(evento.payload_json)
                    : evento.payload_json;
            }

            if (payload && Object.keys(payload).length > 0) {
                doc.fontSize(11).font('Helvetica-Bold').text('Detalles');
                doc.fontSize(9).font('Helvetica');
                for (const [key, value] of Object.entries(payload)) {
                    if (value !== null && value !== undefined) {
                        doc.text(`${formatKey(key)}: ${typeof value === 'object' ? JSON.stringify(value) : value}`);
                    }
                }
                doc.moveDown();
            }

            // ============================================
            // VERIFICACIÓN CRIPTOGRÁFICA
            // ============================================
            doc.fontSize(11).font('Helvetica-Bold').text('Verificación Criptográfica');
            doc.fontSize(9).font('Helvetica');
            doc.text(`Hash SHA-256: ${evento.hash_sha256}`);
            if (evento.prev_hash_sha256) {
                doc.text(`Hash Anterior: ${evento.prev_hash_sha256}`);
            }
            doc.moveDown();

            // ============================================
            // SELLO QTSP (si existe)
            // ============================================
            if (selloQTSP) {
                doc.fontSize(11).font('Helvetica-Bold').text('Sello de Tiempo Cualificado (QTSP)');
                doc.fontSize(9).font('Helvetica');
                doc.text(`Proveedor: ${selloQTSP.proveedor || 'eadTrust'}`);
                if (selloQTSP.fecha_sello) {
                    doc.text(`Fecha del Sello: ${new Date(selloQTSP.fecha_sello).toLocaleString('es-ES')}`);
                }
                doc.moveDown();
            }

            // ============================================
            // FOOTER
            // ============================================
            doc.fontSize(8)
                .fillColor('#666666')
                .text(
                    'Este certificado ha sido generado automáticamente por la plataforma ChronoFlare. ' +
                    'La integridad del evento puede verificarse mediante el hash SHA-256 indicado.',
                    72, 720,
                    { width: 450, align: 'justify' }
                );

            doc.text(
                `Generado: ${new Date().toLocaleString('es-ES')}`,
                72, 760
            );

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

// ============================================
// COPIAS DE COMUNICACIONES
// ============================================

interface CommunicationCopyData {
    comunicacion: {
        id: string;
        tipo_comunicacion: string;
        canal: string;
        asunto?: string;
        contenido?: string;
        resumen_externo?: string;
        fecha_comunicacion?: string;
        fecha_registro: string;
        estado: string;
        es_externa: boolean;
        remitente_rol?: string;
        remitente_externo?: string;
        destinatarios_roles?: string[];
        destinatarios_externos?: string;
        hash_contenido?: string;
    };
    contrato: {
        id: string;
        numero_expediente?: string;
        identificador_unico?: string;
    };
    selloQTSP?: {
        proveedor?: string;
        fecha_sello?: string;
    };
}

/**
 * Genera un PDF con la copia de una comunicación
 * Incluye metadatos, contenido y certificación QTSP si existe
 */
export async function generateCommunicationPDF(data: CommunicationCopyData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 60, bottom: 60, left: 72, right: 72 },
            });

            const chunks: Buffer[] = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const { comunicacion, contrato, selloQTSP } = data;

            // ============================================
            // HEADER
            // ============================================
            const headerColor = comunicacion.es_externa ? '#744210' : '#1a365d';
            doc.rect(0, 0, 595, 60).fillColor(headerColor).fill();
            doc.fillColor('#ffffff')
                .fontSize(16)
                .font('Helvetica-Bold')
                .text('COPIA DE COMUNICACIÓN', 72, 22);
            doc.fontSize(10)
                .font('Helvetica')
                .text(comunicacion.es_externa ? 'Comunicación Externa Importada' : 'Comunicación de Plataforma', 72, 40);

            // QTSP Badge
            if (selloQTSP) {
                doc.fillColor('#48bb78')
                    .fontSize(9)
                    .text('✓ QTSP CERTIFIED', 450, 25, { align: 'right' });
            }

            doc.fillColor('#000000');
            doc.moveDown(3);

            // ============================================
            // INFO DEL EXPEDIENTE
            // ============================================
            doc.fontSize(11).font('Helvetica-Bold').text('Expediente');
            doc.fontSize(10).font('Helvetica');
            doc.text(`Número: ${contrato.numero_expediente || contrato.identificador_unico || contrato.id}`);
            doc.moveDown();

            // ============================================
            // METADATOS DE LA COMUNICACIÓN
            // ============================================
            doc.fontSize(11).font('Helvetica-Bold').text('Datos de la Comunicación');
            doc.fontSize(10).font('Helvetica');

            doc.text(`Tipo: ${formatCommunicationType(comunicacion.tipo_comunicacion)}`);
            doc.text(`Canal: ${formatChannel(comunicacion.canal)}`);
            doc.text(`Estado: ${comunicacion.estado}`);

            // Fechas
            if (comunicacion.fecha_comunicacion) {
                doc.text(`Fecha Comunicación: ${new Date(comunicacion.fecha_comunicacion).toLocaleString('es-ES')}`);
            }
            doc.text(`Fecha Registro: ${new Date(comunicacion.fecha_registro).toLocaleString('es-ES')}`);

            // Remitente
            if (comunicacion.remitente_rol) {
                doc.text(`Remitente: ${comunicacion.remitente_rol}`);
            } else if (comunicacion.remitente_externo) {
                doc.text(`Remitente Externo: ${comunicacion.remitente_externo}`);
            }

            // Destinatarios
            if (comunicacion.destinatarios_roles && comunicacion.destinatarios_roles.length > 0) {
                doc.text(`Destinatarios: ${comunicacion.destinatarios_roles.join(', ')}`);
            } else if (comunicacion.destinatarios_externos) {
                doc.text(`Destinatarios: ${comunicacion.destinatarios_externos}`);
            }

            doc.moveDown();

            // ============================================
            // CONTENIDO
            // ============================================
            doc.fontSize(11).font('Helvetica-Bold').text('Contenido');
            doc.moveDown(0.5);

            if (comunicacion.asunto) {
                doc.fontSize(10).font('Helvetica-Bold').text(`Asunto: ${comunicacion.asunto}`);
                doc.moveDown(0.5);
            }

            doc.fontSize(10).font('Helvetica');
            const contenido = comunicacion.contenido || comunicacion.resumen_externo || '(Sin contenido)';
            doc.text(contenido, { align: 'justify' });
            doc.moveDown();

            // ============================================
            // VERIFICACIÓN
            // ============================================
            if (comunicacion.hash_contenido) {
                doc.fontSize(11).font('Helvetica-Bold').text('Verificación');
                doc.fontSize(9).font('Helvetica');
                doc.text(`Hash SHA-256: ${comunicacion.hash_contenido}`);
                doc.moveDown();
            }

            // ============================================
            // SELLO QTSP
            // ============================================
            if (selloQTSP) {
                doc.fontSize(11).font('Helvetica-Bold').text('Sello de Tiempo Cualificado (QTSP)');
                doc.fontSize(9).font('Helvetica');
                doc.text(`Proveedor: ${selloQTSP.proveedor || 'eadTrust'}`);
                if (selloQTSP.fecha_sello) {
                    doc.text(`Fecha del Sello: ${new Date(selloQTSP.fecha_sello).toLocaleString('es-ES')}`);
                }

                if (comunicacion.es_externa) {
                    doc.moveDown(0.5);
                    doc.fontSize(8).fillColor('#b7791f');
                    doc.text(
                        '⚠️ NOTA: El sello QTSP certifica la recepción en la plataforma, ' +
                        'no la fecha de envío original de la comunicación externa.',
                        { align: 'left' }
                    );
                    doc.fillColor('#000000');
                }
                doc.moveDown();
            }

            // ============================================
            // FOOTER
            // ============================================
            doc.fontSize(8)
                .fillColor('#666666')
                .text(
                    'Esta copia ha sido generada automáticamente por la plataforma ChronoFlare. ' +
                    'La integridad puede verificarse mediante el hash SHA-256 indicado.',
                    72, 720,
                    { width: 450, align: 'justify' }
                );

            doc.text(
                `Generado: ${new Date().toLocaleString('es-ES')} | ID: ${comunicacion.id}`,
                72, 760
            );

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

// ============================================
// HELPERS
// ============================================

function formatEventType(tipo: string): string {
    const map: Record<string, string> = {
        'CONTRATO_CREADO': 'Contrato Creado',
        'TERMINOS_ACEPTADOS': 'Términos Aceptados',
        'BORRADOR_GENERADO': 'Borrador Generado',
        'FIRMA_REGISTRADA': 'Firma Registrada',
        'CONTRATO_FIRMADO': 'Contrato Firmado',
        'PAGO_ARRAS_CONFIRMADO': 'Pago de Arras Confirmado',
        'CONVOCATORIA_NOTARIAL': 'Convocatoria Notarial',
        'ESCRITURA_OTORGADA': 'Escritura Otorgada',
        'COMUNICACION_ENVIADA': 'Comunicación Enviada',
        'DOCUMENTO_SUBIDO': 'Documento Subido',
    };
    return map[tipo] || tipo.replace(/_/g, ' ');
}

function formatCommunicationType(tipo: string): string {
    const map: Record<string, string> = {
        'RECLAMACION': 'Reclamación',
        'SOLICITUD_DOCUMENTACION': 'Solicitud de Documentación',
        'SOLICITUD_MODIFICACION_TERMINOS': 'Solicitud de Modificación',
        'NOTIFICACION_GENERAL': 'Notificación General',
        'CONVOCATORIA_NOTARIA': 'Convocatoria a Notaría',
        'COMUNICACION_EXTERNA_IMPORTADA': 'Comunicación Externa',
        'ALEGACION': 'Alegación',
        'RESPUESTA': 'Respuesta',
    };
    return map[tipo] || tipo.replace(/_/g, ' ');
}

function formatChannel(canal: string): string {
    const map: Record<string, string> = {
        'PLATAFORMA': 'Plataforma',
        'EMAIL': 'Email',
        'BUROFAX': 'Burofax',
        'CARTA_CERTIFICADA': 'Carta Certificada',
        'WHATSAPP': 'WhatsApp',
        'TELEFONO': 'Teléfono',
    };
    return map[canal] || canal;
}

function formatKey(key: string): string {
    return key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
}

// ============================================
// ACTAS DE NO COMPARECENCIA
// ============================================

export interface ActaPdfData {
    contrato: any;
    parteNoCompareciente: any;
    fechaHoraCita: Date;
    notaria: string;
    resumenHechos: string;
    consecuencias: {
        tipoArras: string;
        consecuencia: string;
    };
    hashActa: string;
    tst?: {
        token: string;
        fecha: Date;
        proveedor: string;
    };
}

/**
 * Genera el PDF del Acta de No Comparecencia
 */
export async function generateActaPDF(data: ActaPdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 60, bottom: 60, left: 72, right: 72 },
            });

            const chunks: Buffer[] = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const {
                contrato,
                parteNoCompareciente,
                fechaHoraCita,
                notaria,
                resumenHechos,
                consecuencias,
                hashActa,
                tst
            } = data;

            // Nombre completo de la parte no compareciente
            const nombreCompleto = `${parteNoCompareciente.parte.nombre} ${parteNoCompareciente.parte.apellidos || ''}`.trim();

            // ============================================
            // HEADER
            // ============================================
            doc.font('Times-Bold').fontSize(18).text('ACTA DE NO COMPARECENCIA', { align: 'center' });
            doc.moveDown(2);

            // ============================================
            // DATOS GENERALES
            // ============================================
            doc.font('Times-Roman').fontSize(12);

            doc.font('Times-Bold').text('Expediente: ', { continued: true })
               .font('Times-Roman').text(contrato.numero_expediente || contrato.id);

            doc.font('Times-Bold').text('Fecha y hora de cita: ', { continued: true })
               .font('Times-Roman').text(fechaHoraCita.toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' }));

            doc.font('Times-Bold').text('Notaría: ', { continued: true })
               .font('Times-Roman').text(notaria);

            doc.moveDown();

            // ============================================
            // I. HECHOS
            // ============================================
            doc.font('Times-Bold').fontSize(14).text('I. HECHOS');
            doc.moveDown(0.5);
            doc.rect(72, doc.y, 450, 1).stroke(); // Línea separadora
            doc.moveDown(0.5);

            doc.font('Times-Roman').fontSize(11).text(resumenHechos, { align: 'justify' });
            doc.moveDown();

            doc.text('En la fecha y hora indicadas, compareció/comparecieron la(s) parte(s) convocada(s), con excepción de:', { align: 'justify' });
            doc.moveDown(0.5);

            doc.font('Times-Bold').text(nombreCompleto, { align: 'center' });
            doc.moveDown(0.5);

            doc.font('Times-Roman').text('En calidad de: ', { continued: true })
               .font('Times-Bold').text(parteNoCompareciente.rol_en_contrato);

            doc.font('Times-Roman').text(`${parteNoCompareciente.parte.tipo_documento}: ${parteNoCompareciente.parte.numero_documento}`);
            doc.moveDown(1.5);

            // ============================================
            // II. OBJETO DEL CONTRATO
            // ============================================
            doc.font('Times-Bold').fontSize(14).text('II. OBJETO DEL CONTRATO');
            doc.moveDown(0.5);
            doc.rect(72, doc.y, 450, 1).stroke();
            doc.moveDown(0.5);

            const inmueble = contrato.inmueble || {};
            doc.font('Times-Roman').fontSize(11)
               .text(`La comparecencia tenía por objeto la elevación a escritura pública del contrato privado de arras de fecha ${new Date(contrato.created_at).toLocaleDateString('es-ES')}, sobre el inmueble sito en:`, { align: 'justify' });
            doc.moveDown(0.5);

            doc.font('Times-Bold').text(`${inmueble.direccion_completa || ''}, ${inmueble.ciudad || ''}`, { align: 'center' });
            doc.moveDown(0.5);

            doc.font('Times-Roman').text('Precio total: ', { continued: true })
               .text(`${(contrato.precio_total || 0).toLocaleString('es-ES')} ${contrato.moneda || 'EUR'}`);

            doc.text('Arras entregadas: ', { continued: true })
               .text(`${(contrato.importe_arras || 0).toLocaleString('es-ES')} ${contrato.moneda || 'EUR'} (${contrato.tipo_arras})`);

            doc.moveDown(1.5);

            // ============================================
            // III. CONSECUENCIAS
            // ============================================
            doc.font('Times-Bold').fontSize(14).text('III. CONSECUENCIAS DE LA NO COMPARECENCIA');
            doc.moveDown(0.5);
            doc.rect(72, doc.y, 450, 1).stroke();
            doc.moveDown(0.5);

            doc.font('Times-Roman').fontSize(11)
               .text('En virtud del artículo 1454 del Código Civil y la naturaleza ', { continued: true })
               .font('Times-Bold').text(consecuencias.tipoArras, { continued: true })
               .font('Times-Roman').text(' de las arras pactadas:', { align: 'justify' });
            doc.moveDown(0.5);

            doc.font('Times-Roman').text(consecuencias.consecuencia, { align: 'justify' });
            doc.moveDown(1.5);

            // ============================================
            // IV. NOTIFICACIÓN
            // ============================================
            doc.font('Times-Bold').fontSize(14).text('IV. NOTIFICACIÓN Y PLAZO DE ALEGACIONES');
            doc.moveDown(0.5);
            doc.rect(72, doc.y, 450, 1).stroke();
            doc.moveDown(0.5);

            doc.font('Times-Roman').fontSize(11)
               .text('La presente acta será notificada al obligado no compareciente conforme al artículo 48 LEC.', { align: 'justify' });
            doc.moveDown(0.5);

            doc.font('Times-Bold')
               .text('Se concede un plazo de CUARENTA Y OCHO (48) HORAS desde la notificación para formular alegaciones, someterse o manifestar conformidad con las consecuencias declaradas.', { align: 'justify' });
            doc.moveDown(0.5);

            doc.font('Times-Roman')
               .text('Transcurrido dicho plazo sin respuesta, se entenderá definitiva la presente acta.', { align: 'justify' });

            doc.moveDown(2);

            // ============================================
            // SELLO Y HASH (Box)
            // ============================================
            const startY = doc.y;
            doc.rect(72, startY, 450, 100).stroke();

            doc.fontSize(10).text('Hash SHA-256 del acta:', 82, startY + 10);
            doc.font('Courier').fontSize(8).text(hashActa, 82, startY + 25, { width: 430, lineBreak: true });

            doc.font('Times-Bold').fontSize(10).text('Sello de Tiempo Cualificado (TST):', 82, startY + 50);
            if (tst) {
                doc.font('Times-Roman').text(`Proveedor: ${tst.proveedor || 'N/A'}`, 82, startY + 65);
                doc.text(`Fecha: ${tst.fecha ? tst.fecha.toISOString() : 'N/A'}`, 82, startY + 80);
            } else {
                doc.font('Times-Roman').text('Pendiente de sellado', 82, startY + 65);
            }

            // ============================================
            // FIRMA
            // ============================================
            doc.y = startY + 120;

            doc.font('Times-Roman').fontSize(11)
               .text(`En ${inmueble.ciudad || 'la ciudad'}, a ${new Date().toLocaleDateString('es-ES', { dateStyle: 'long' })}`, { align: 'right' });

            doc.moveDown(3);
            doc.text('_________________________', { align: 'right' });
            doc.fontSize(9).text('Sistema LegalOps - Chron-Flare', { align: 'right' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}
