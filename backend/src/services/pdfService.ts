import PDFDocument from 'pdfkit';
import { ContratoFull } from '../types/models.js';
import { nowIso } from '../utils/time.js';

/**
 * Genera el PDF del borrador del contrato de arras
 */
export async function generateDraftPDF(full: ContratoFull): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 50, bottom: 50, left: 50, right: 50 },
            });

            const chunks: Buffer[] = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const { contrato, inmueble, partes } = full;

            // Header
            doc
                .fontSize(20)
                .font('Helvetica-Bold')
                .text('CONTRATO DE ARRAS', { align: 'center' });
            doc.fontSize(10).text('BORRADOR - Documento no vinculante', {
                align: 'center',
            });
            doc.moveDown(2);

            // Identificación del contrato
            doc
                .fontSize(12)
                .font('Helvetica-Bold')
                .text('IDENTIFICACIÓN DEL CONTRATO');
            doc.fontSize(10).font('Helvetica');
            doc.text(`Número de contrato: ${contrato.identificador_unico}`);
            doc.text(`Tipo de arras: ${contrato.tipo_arras}`);
            doc.text(`Fecha de creación: ${new Date(contrato.created_at).toLocaleDateString('es-ES')}`);
            doc.text(`Versión: ${contrato.version_numero}`);
            doc.moveDown();

            // Inmueble
            doc.fontSize(12).font('Helvetica-Bold').text('INMUEBLE OBJETO DEL CONTRATO');
            doc.fontSize(10).font('Helvetica');
            doc.text(`Dirección: ${inmueble.direccion_completa}`);
            if (inmueble.codigo_postal) doc.text(`Código Postal: ${inmueble.codigo_postal}`);
            doc.text(`Ciudad: ${inmueble.ciudad}, ${inmueble.provincia}`);
            if (inmueble.referencia_catastral)
                doc.text(`Referencia catastral: ${inmueble.referencia_catastral}`);
            if (inmueble.datos_registrales)
                doc.text(`Registro: ${inmueble.datos_registrales}`);
            doc.moveDown();

            // Partes
            doc.fontSize(12).font('Helvetica-Bold').text('PARTES CONTRATANTES');
            doc.fontSize(10).font('Helvetica');

            const compradores = partes.filter((p: any) => p.rol_en_contrato === 'COMPRADOR');
            const vendedores = partes.filter((p: any) => p.rol_en_contrato === 'VENDEDOR');

            if (compradores.length > 0) {
                doc.font('Helvetica-Bold').text('Parte compradora:');
                doc.font('Helvetica');
                compradores.forEach((cp: any) => {
                    const parte = cp.parte;
                    doc.text(
                        `  - ${parte.nombre} ${parte.apellidos} (${parte.tipo_documento}: ${parte.numero_documento})`
                    );
                    if (parte.email) doc.text(`    Email: ${parte.email}`);
                    if (parte.telefono) doc.text(`    Teléfono: ${parte.telefono}`);
                });
                doc.moveDown(0.5);
            }

            if (vendedores.length > 0) {
                doc.font('Helvetica-Bold').text('Parte vendedora:');
                doc.font('Helvetica');
                vendedores.forEach((vp: any) => {
                    const parte = vp.parte;
                    doc.text(
                        `  - ${parte.nombre} ${parte.apellidos} (${parte.tipo_documento}: ${parte.numero_documento})`
                    );
                    if (parte.email) doc.text(`    Email: ${parte.email}`);
                    if (parte.telefono) doc.text(`    Teléfono: ${parte.telefono}`);
                });
                doc.moveDown(0.5);
            }

            doc.moveDown();

            // Condiciones económicas
            doc.fontSize(12).font('Helvetica-Bold').text('CONDICIONES ECONÓMICAS');
            doc.fontSize(10).font('Helvetica');
            doc.text(`Precio total de venta: ${contrato.precio_total.toLocaleString('es-ES')} ${contrato.moneda}`);
            doc.text(
                `Cantidad en concepto de arras: ${contrato.importe_arras.toLocaleString('es-ES')} ${contrato.moneda} (${contrato.porcentaje_arras_calculado}%)`
            );
            doc.text(`Forma de pago de arras: ${contrato.forma_pago_arras}`);
            if (contrato.fecha_limite_pago_arras) {
                doc.text(
                    `Fecha límite de pago: ${new Date(contrato.fecha_limite_pago_arras).toLocaleDateString('es-ES')}`
                );
            }
            doc.moveDown();

            // Plazos
            doc.fontSize(12).font('Helvetica-Bold').text('PLAZOS Y CONDICIONES');
            doc.fontSize(10).font('Helvetica');
            doc.text(
                `Fecha límite para firma de escritura: ${new Date(contrato.fecha_limite_firma_escritura).toLocaleDateString('es-ES')}`
            );
            doc.text(`Gastos e impuestos: A cargo de ${contrato.gastos_quien === 'LEY' ? 'lo dispuesto en ley' : contrato.gastos_quien}`);
            doc.text(`Vía de resolución de conflictos: ${contrato.via_resolucion === 'JUZGADOS' ? 'Tribunales ordinarios' : 'Arbitraje'}`);
            doc.text(`Tipo de firma: ${contrato.firma_preferida === 'ELECTRONICA' ? 'Electrónica' : 'Presencial'}`);
            doc.moveDown();

            // Naturaleza de las arras
            doc.fontSize(12).font('Helvetica-Bold').text('NATURALEZA DE LAS ARRAS');
            doc.fontSize(10).font('Helvetica');

            if (contrato.tipo_arras === 'CONFIRMATORIAS') {
                doc.text(
                    'ARRAS CONFIRMATORIAS: Las arras entregadas confirman el contrato. En caso de incumplimiento, se aplican las reglas generales del incumplimiento contractual.'
                );
            } else if (contrato.tipo_arras === 'PENITENCIALES') {
                doc.text(
                    'ARRAS PENITENCIALES: Las partes pueden desistir del contrato. Si desiste el comprador, pierde las arras entregadas. Si desiste el vendedor, debe devolverlas duplicadas.'
                );
            } else {
                doc.text(
                    'ARRAS PENALES: En caso de incumplimiento, la parte cumplidora puede exigir la ejecución del contrato o su resolución, reteniendo o exigiendo las arras como indemnización mínima.'
                );
            }

            doc.moveDown();

            // Disclaimer
            doc.addPage();
            doc
                .fontSize(14)
                .font('Helvetica-Bold')
                .text('ADVERTENCIAS LEGALES', { align: 'center' });
            doc.moveDown();
            doc.fontSize(9).font('Helvetica');
            doc.text(
                'Este documento es un BORRADOR informativo generado electrónicamente. NO constituye un contrato vinculante hasta que todas las partes hayan aceptado los términos esenciales y firmado electrónicamente el contrato definitivo.',
                { align: 'justify' }
            );
            doc.moveDown();
            doc.text(
                'La firma electrónica del contrato definitivo será realizada mediante procedimientos que garantizan la integridad y autenticidad del documento, con sello de tiempo cualificado proporcionado por un Prestador de Servicios de Confianza (QTSP).',
                { align: 'justify' }
            );
            doc.moveDown();
            doc.text(
                'Este sistema NO sustituye el asesoramiento legal profesional. Se recomienda consultar con un abogado especializado antes de proceder con la firma del contrato definitivo.',
                { align: 'justify' }
            );

            // Footer
            doc.fontSize(8).text(`Generado el: ${new Date().toLocaleString('es-ES')}`, {
                align: 'center',
            });
            doc.text(`Hash de versión: ${contrato.version_hash.substring(0, 16)}...`, {
                align: 'center',
            });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Genera el PDF firmado del contrato de arras
 */
export async function generateSignedPDF(full: ContratoFull): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 50, bottom: 50, left: 50, right: 50 },
            });

            const chunks: Buffer[] = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const { contrato, inmueble, partes, firmasValidas } = full;

            // Header
            doc
                .fontSize(20)
                .font('Helvetica-Bold')
                .text('CONTRATO DE ARRAS', { align: 'center' });
            doc.fontSize(12).font('Helvetica-Bold').text('DOCUMENTO FIRMADO ELECTRÓNICAMENTE', {
                align: 'center',
            });
            doc.moveDown(2);

            // Similar content to draft...
            doc.fontSize(12).font('Helvetica-Bold').text('IDENTIFICACIÓN');
            doc.fontSize(10).font('Helvetica');
            doc.text(`Contrato: ${contrato.identificador_unico}`);
            doc.text(`Tipo: ${contrato.tipo_arras}`);
            doc.text(`Fecha firma: ${new Date().toLocaleDateString('es-ES')}`);
            doc.moveDown();

            // Inmueble (abbreviated for signed version)
            doc.fontSize(12).font('Helvetica-Bold').text('INMUEBLE');
            doc.fontSize(10).font('Helvetica');
            doc.text(inmueble.direccion_completa);
            doc.text(`${inmueble.ciudad}, ${inmueble.provincia}`);
            doc.moveDown();

            // Condiciones económicas
            doc.fontSize(12).font('Helvetica-Bold').text('CONDICIONES ECONÓMICAS');
            doc.fontSize(10).font('Helvetica');
            doc.text(`Precio: ${contrato.precio_total.toLocaleString('es-ES')} ${contrato.moneda}`);
            doc.text(`Arras: ${contrato.importe_arras.toLocaleString('es-ES')} ${contrato.moneda} (${contrato.porcentaje_arras_calculado}%)`);
            doc.text(`Fecha límite escritura: ${new Date(contrato.fecha_limite_firma_escritura).toLocaleDateString('es-ES')}`);
            doc.moveDown();

            // Firmas
            doc.addPage();
            doc.fontSize(14).font('Helvetica-Bold').text('FIRMAS ELECTRÓNICAS', {
                align: 'center',
            });
            doc.moveDown();

            firmasValidas.forEach((firma: any, index: number) => {
                const parte = partes.find((p: any) => p.parte_id === firma.parte_id);
                if (parte) {
                    doc.fontSize(11).font('Helvetica-Bold');
                    doc.text(`Firmante ${index + 1}:`);
                    doc.fontSize(10).font('Helvetica');
                    doc.text(`${parte.parte.nombre} ${parte.parte.apellidos}`);
                    doc.text(`${parte.parte.tipo_documento}: ${parte.parte.numero_documento}`);
                    doc.text(`Fecha y hora: ${new Date(firma.fecha_hora_firma).toLocaleString('es-ES')}`);
                    doc.text(`IP: ${firma.direccion_ip}`);
                    doc.text(`Huella digital: ${firma.direccion_ip.replace(/\./g, '')}-${Date.parse(firma.fecha_hora_firma)}`);
                    doc.moveDown();
                }
            });

            // Certificación
            doc.addPage();
            doc.fontSize(14).font('Helvetica-Bold').text('CERTIFICACIÓN', { align: 'center' });
            doc.moveDown();
            doc.fontSize(10).font('Helvetica');
            doc.text(
                'Este documento ha sido firmado electrónicamente por todas las partes con sello de tiempo cualificado.',
                { align: 'justify' }
            );
            doc.moveDown();
            doc.text(
                `Hash del contrato: ${contrato.version_hash}`,
                { align: 'left' }
            );
            doc.moveDown();
            doc.text(`Generado: ${nowIso()}`, { align: 'center' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}
