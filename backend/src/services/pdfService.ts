import PDFDocument from 'pdfkit';
import { ContratoFull } from '../types/models.js';

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

            const { contrato, inmueble, partes } = full;

            // ============================================
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
            // TÉRMINOS ESTÁNDAR
            // ============================================
            doc.addPage();

            // Header naranja
            doc.rect(0, 0, 595, 40).fillColor('#FF6B35').fill();
            doc.fillColor('#FFFFFF').fontSize(14).font('Helvetica-Bold');
            doc.text('TÉRMINOS ESTÁNDAR', 72, 15, { align: 'right' });

            doc.fillColor('#000000').moveDown(2);

            doc.fontSize(12).font('Helvetica-Bold').text('Términos estándar');
            doc.moveDown();

            // 1. OBJETO
            doc.fontSize(10).font('Helvetica-Bold').text('1. OBJETO');
            doc.moveDown(0.3);

            doc.fontSize(8).font('Helvetica-Bold').text('1.1 Objeto.');
            doc.font('Helvetica').text(
                ' El Vendedor vende la Vivienda al Comprador. La Vivienda se encuentra en buen estado de conservación y mantenimiento, y se vende con los derechos y accesorios que le pertenecen. Al firmar un contrato de compraventa con arras penitenciales, las partes pueden desistir de la compraventa con las consecuencias siguientes: si desiste el Comprador, pierde el Importe de las Arras; si desiste el Vendedor, tiene que devolver el Importe de las Arras multiplicado por dos.',
                { align: 'justify', continued: false }
            );
            doc.moveDown(0.5);

            doc.fontSize(8).font('Helvetica-Bold').text('1.2 Finalización de la compraventa.');
            doc.font('Helvetica').text(
                ' La entrega de la Vivienda y la transmisión de su propiedad al Comprador se harán en el momento de otorgar la escritura pública de compraventa.',
                { align: 'justify' }
            );
            doc.moveDown(0.5);

            doc.fontSize(8).font('Helvetica-Bold').text('1.3 Estado de la Vivienda.');
            doc.font('Helvetica').text(' El Vendedor manifiesta:', { align: 'justify' });
            doc.moveDown(0.3);

            // Subsecciones de Estado de la Vivienda
            const estadoItems = [
                {
                    title: 'Gastos e impuestos.',
                    text: 'La Vivienda se encuentra al corriente de pago de gastos e impuestos. En particular, se encuentra al corriente de pago del impuesto sobre bienes inmuebles (IBI), de los gastos de la comunidad de propietarios y de la tasa de recogida de residuos urbanos.'
                },
                {
                    title: 'Cargas.',
                    text: 'Las únicas cargas de la Vivienda son: (i) las normas y obligaciones de la comunidad de propietarios del edificio, y (ii) las afecciones fiscales. La Nota Simple donde constan las posibles cargas inscritas sobre la vivienda figura como Anexo 1.'
                },
                {
                    title: 'Arrendatarios y ocupantes.',
                    text: 'La Vivienda se entrega libre de inquilinos u ocupantes.'
                },
                {
                    title: 'Certificado de eficiencia energética.',
                    text: 'El Vendedor ha solicitado el certificado de eficiencia energética y entregará el original al Comprador a la vez que se firme la escritura de compraventa.'
                }
            ];

            estadoItems.forEach(item => {
                doc.fontSize(7).font('Helvetica-Bold').text(`    (${item.title.charAt(0).toLowerCase()}) ${item.title}`);
                doc.font('Helvetica').text(`        ${item.text}`, { align: 'justify' });
                doc.moveDown(0.3);
            });

            doc.moveDown(0.5);

            // Continúa en nueva página si es necesario
            if (doc.y > 650) doc.addPage();

            // 2. OBLIGACIONES DEL COMPRADOR
            doc.fontSize(10).font('Helvetica-Bold').text('2. OBLIGACIONES DEL COMPRADOR');
            doc.moveDown(0.3);

            doc.fontSize(8).font('Helvetica-Bold').text('2.1 Pago de la Vivienda.');
            doc.font('Helvetica').text(
                ' El Comprador pagará el Precio de Compra de la Vivienda (restándole el Importe de las Arras) al Vendedor mediante transferencia bancaria cuando se otorgue la escritura de compraventa.',
                { align: 'justify' }
            );
            doc.moveDown(0.5);

            doc.fontSize(8).font('Helvetica-Bold').text('2.2 Pago de las arras.');
            doc.font('Helvetica').text(
                ' Las arras son penitenciales y facultan al Comprador y al Vendedor para desistir del presente Contrato de Compraventa unilateralmente, de acuerdo con el artículo 1.454 del Código Civil.',
                { align: 'justify' }
            );
            doc.moveDown(0.5);

            doc.fontSize(8).font('Helvetica-Bold').text('2.3 Notificar la cita con la Notaría.');
            doc.font('Helvetica').text(
                ' El Comprador comunicará al Vendedor la fecha del otorgamiento de la escritura de compraventa con 10 días de antelación.',
                { align: 'justify' }
            );
            doc.moveDown();

            // 3. OBLIGACIONES DEL VENDEDOR
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
            doc.moveDown();

            // 4. OTRAS OBLIGACIONES
            doc.fontSize(10).font('Helvetica-Bold').text('4. OTRAS OBLIGACIONES (GASTOS, IMPUESTOS Y SUMINISTROS)');
            doc.moveDown(0.3);

            doc.fontSize(8).font('Helvetica-Bold').text('4.1 Impuestos.');
            doc.font('Helvetica').text(
                ' El Vendedor pagará la plusvalía municipal. El IBI se dividirá proporcionalmente.',
                { align: 'justify' }
            );
            doc.moveDown();

            // 5. DESISTIMIENTO
            if (doc.y > 550) doc.addPage();

            doc.fontSize(10).font('Helvetica-Bold').text('5. DESISTIMIENTO UNILATERAL DE LA COMPRAVENTA');
            doc.moveDown(0.3);

            doc.fontSize(8).font('Helvetica-Bold').text('5.1 Desistimiento del Comprador.');
            doc.font('Helvetica').text(
                ' El Comprador puede desistir unilateralmente del Contrato desde su firma hasta la escritura. Si lo hace, perderá el Importe de las Arras a favor del Vendedor.',
                { align: 'justify' }
            );
            doc.moveDown(0.5);

            doc.fontSize(8).font('Helvetica-Bold').text('5.2 Desistimiento del Vendedor.');
            doc.font('Helvetica').text(
                ' El Vendedor puede desistir unilateralmente de la compraventa. En este caso, deberá devolver al Comprador duplicado el Importe de las Arras recibido.',
                { align: 'justify' }
            );
            doc.moveDown();

            // Secciones restantes resumidas
            ['6. NOTIFICACIONES', '7. CESIÓN', '8. RESOLUCIÓN DE CONFLICTOS', '9. LEY APLICABLE', '10. FIRMA'].forEach((seccion, idx) => {
                if (doc.y > 680) doc.addPage();
                doc.fontSize(10).font('Helvetica-Bold').text(seccion);
                doc.fontSize(8).font('Helvetica').text(
                    'Ver términos estándar completos en contrato firmado.',
                    { align: 'justify' }
                );
                doc.moveDown(0.5);
            });

            // Footer
            doc.fontSize(7).font('Helvetica').text(
                `Generado el: ${new Date().toLocaleString('es-ES')} | Hash: ${contrato.version_hash.substring(0, 16)}...`,
                { align: 'center' }
            );

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
