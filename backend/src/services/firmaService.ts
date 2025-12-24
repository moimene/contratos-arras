/**
 * Servicio de Firma Electrónica
 * 
 * Gestiona firmas electrónicas simples en plataforma y
 * documentos firmados subidos externamente.
 */

import { supabase } from '../config/supabase.js';
import { qtspService, calcularHash } from './qtspService.js';
import { guardarArchivo } from './storageService.js';

// ================================================
// TIPOS
// ================================================

export interface FirmaElectronicaData {
    contratoId: string;
    parteId: string;
    versionHash: string;
    documentoHash: string;
    userId?: string;      // Usuario autenticado para auditoría
    ipAddress?: string;
    userAgent?: string;
}

export interface DocumentoFirmadoData {
    contratoId: string;
    archivoPdf: Buffer;
    tipoFirma: 'MANUSCRITA' | 'AVANZADA' | 'CUALIFICADA';
    fechaFirma: Date;
    firmantes: Array<{ parteId: string; nombre: string }>;
}

export interface EstadoFirmas {
    contratoId: string;
    firmasRequeridas: number;
    firmasCompletadas: number;
    firmasPlataforma: number;
    documentosFirmados: number;
    todasFirmasCompletas: boolean;
    detalles: Array<{
        parteId: string;
        nombre: string;
        obligadoFirmar: boolean;
        firmado: boolean;
        fechaFirma?: Date;
        metodo?: 'PLATAFORMA' | 'DOCUMENTO_SUBIDO';
    }>;
}

// ================================================
// SERVICIO PRINCIPAL
// ================================================

class FirmaService {

    /**
     * Registra una firma electrónica simple en plataforma
     */
    async registrarFirmaElectronica(data: FirmaElectronicaData): Promise<{ firmaId: string; tst: any }> {
        const {
            contratoId,
            parteId,
            versionHash,
            documentoHash,
            ipAddress,
            userAgent,
        } = data;

        // 1. Verificar que el contrato existe y está en estado válido para firmar
        const { data: contrato, error: contratoError } = await supabase
            .from('contratos_arras')
            .select('id, estado, numero_expediente')
            .eq('id', contratoId)
            .single();

        if (contratoError || !contrato) {
            throw new Error('Contrato no encontrado');
        }

        if (!['BORRADOR_GENERADO', 'EN_FIRMA'].includes(contrato.estado)) {
            throw new Error(`Contrato en estado ${contrato.estado} no permite firmas`);
        }

        // 2. Verificar que la parte está autorizada a firmar
        const { data: parte, error: parteError } = await supabase
            .from('contratos_partes')
            .select('parte_id, obligado_firmar')
            .eq('contrato_id', contratoId)
            .eq('parte_id', parteId)
            .single();

        if (parteError || !parte) {
            throw new Error('Parte no vinculada al contrato');
        }

        if (!parte.obligado_firmar) {
            throw new Error('Parte no está obligada a firmar');
        }

        // 3. Verificar que no haya firmado ya
        const { data: firmaExistente } = await supabase
            .from('firmas_electronicas')
            .select('id')
            .eq('contrato_id', contratoId)
            .eq('parte_id', parteId)
            .eq('valida', true)
            .single();

        if (firmaExistente) {
            throw new Error('Parte ya ha firmado este contrato');
        }

        // 4. Obtener sello de tiempo cualificado (QTSP)
        const hashEvento = calcularHash(`${documentoHash}|${parteId}|${new Date().toISOString()}`);
        const tst = await qtspService.obtenerSelloTiempo(hashEvento);

        // 5. Registrar firma en BD
        const { data: firma, error: firmaError } = await supabase
            .from('firmas_electronicas')
            .insert({
                contrato_id: contratoId,
                parte_id: parteId,
                version_hash: versionHash,
                documento_hash: documentoHash,
                timestamp_utc: new Date().toISOString(),
                ip_address: ipAddress,
                user_agent: userAgent,
                tst_token: tst.token,
                tst_fecha: tst.fecha.toISOString(),
                tst_proveedor: tst.proveedor,
                valida: true,
            })
            .select()
            .single();

        if (firmaError) {
            console.error('Error al registrar firma:', firmaError);
            throw new Error('Error al registrar firma electrónica');
        }

        // 6. Crear evento en timeline
        await this.crearEventoFirma(contratoId, parteId, tst, data.userId);

        // 7. Verificar si todas las firmas están completas
        const estadoFirmas = await this.obtenerEstadoFirmas(contratoId);

        if (estadoFirmas.todasFirmasCompletas) {
            // Actualizar estado del contrato a FIRMADO
            await supabase
                .from('contratos_arras')
                .update({
                    estado: 'FIRMADO',
                    firmado_plataforma_at: new Date().toISOString(),
                })
                .eq('id', contratoId);
        } else {
            // Marcar como EN_FIRMA si es la primera firma
            await supabase
                .from('contratos_arras')
                .update({ estado: 'EN_FIRMA' })
                .eq('id', contratoId);
        }

        return {
            firmaId: firma.id,
            tst,
        };
    }

    /**
     * Registra un documento PDF firmado subido externamente
     */
    async registrarDocumentoFirmado(data: DocumentoFirmadoData): Promise<{ documentoId: string }> {
        const {
            contratoId,
            archivoPdf,
            tipoFirma,
            fechaFirma,
            firmantes,
        } = data;

        // 1. Calcular hash del PDF
        const hashPdf = calcularHash(archivoPdf);

        // 2. Obtener TST del hash
        const tst = await qtspService.obtenerSelloTiempo(hashPdf);

        // 3. Subir PDF a storage
        const archivoId = crypto.randomUUID();
        const nombreArchivo = `firmado_${archivoId}.pdf`;

        const uploadResult = await guardarArchivo(
            archivoPdf,
            nombreArchivo,
            contratoId,
            'documentos_firmados'
        );

        // Crear registro en tabla archivos
        const { error: archivoError } = await supabase
            .from('archivos')
            .insert({
                id: archivoId,
                contrato_id: contratoId,
                nombre_original: nombreArchivo,
                mime_type: 'application/pdf',
                ruta: uploadResult.path,
                tamano: uploadResult.size,
                tipo: 'OTRO' // TODO: Definir tipo específico si existe
            });

        if (archivoError) {
            console.error('Error al registrar archivo:', archivoError);
            throw new Error('Error al registrar archivo del documento firmado');
        }

        // 4. Registrar documento firmado
        const { data: documento, error: documentoError } = await supabase
            .from('documentos_firmados')
            .insert({
                contrato_id: contratoId,
                archivo_id: archivoId,
                hash_pdf: hashPdf,
                tipo_firma: tipoFirma,
                fecha_firma: fechaFirma.toISOString(),
                firmantes: firmantes,
                tst_token: tst.token,
                tst_fecha: tst.fecha.toISOString(),
                tst_proveedor: tst.proveedor,
                verificado: false,
            })
            .select()
            .single();

        if (documentoError) {
            console.error('Error al registrar documento firmado:', documentoError);
            throw new Error('Error al registrar documento firmado');
        }

        // 5. Crear evento
        await this.crearEventoDocumentoFirmado(contratoId, documento.id, hashPdf, tst);

        // 6. Actualizar estado del contrato
        await supabase
            .from('contratos_arras')
            .update({
                estado: 'FIRMADO',
                firmado_documento_at: new Date().toISOString(),
            })
            .eq('id', contratoId);

        return {
            documentoId: documento.id,
        };
    }

    /**
     * Obtiene el estado de firmas de un contrato
     */
    async obtenerEstadoFirmas(contratoId: string): Promise<EstadoFirmas> {
        // 1. Obtener partes que deben firmar
        const { data: partesObligadas } = await supabase
            .from('contratos_partes')
            .select(`
        parte_id,
        obligado_firmar,
        partes (
          nombre,
          apellidos
        )
      `)
            .eq('contrato_id', contratoId)
            .eq('obligado_firmar', true);

        if (!partesObligadas || partesObligadas.length === 0) {
            throw new Error('No hay partes obligadas a firmar en este contrato');
        }

        // 2. Obtener firmas electrónicas válidas
        const { data: firmasElectronicas } = await supabase
            .from('firmas_electronicas')
            .select('parte_id, timestamp_utc')
            .eq('contrato_id', contratoId)
            .eq('valida', true);

        // 2.b Obtener conteo de documentos firmados externamente
        const { count: documentosFirmadosCount } = await supabase
            .from('documentos_firmados')
            .select('id', { count: 'exact', head: true })
            .eq('contrato_id', contratoId);

        const firmasMap = new Map(
            (firmasElectronicas || []).map((f: any) => [
                f.parte_id,
                { fechaFirma: new Date(f.timestamp_utc), metodo: 'PLATAFORMA' as const }
            ])
        );

        // 3. Construir detalles
        const detalles = partesObligadas.map((p: any) => ({
            parteId: p.parte_id,
            nombre: `${p.partes.nombre} ${p.partes.apellidos || ''}`.trim(),
            obligadoFirmar: p.obligado_firmar,
            firmado: firmasMap.has(p.parte_id),
            fechaFirma: firmasMap.get(p.parte_id)?.fechaFirma,
            metodo: firmasMap.get(p.parte_id)?.metodo,
        }));

        const firmasCompletadas = detalles.filter((d: any) => d.firmado).length;
        const firmasRequeridas = detalles.length;

        return {
            contratoId,
            firmasRequeridas,
            firmasCompletadas,
            firmasPlataforma: firmasElectronicas?.length || 0,
            documentosFirmados: documentosFirmadosCount || 0,
            todasFirmasCompletas: firmasCompletadas === firmasRequeridas,
            detalles,
        };
    }

    /**
     * Invalida firmas si se modifican términos esenciales
     */
    async invalidarFirmasPorModificacion(contratoId: string, motivo: string): Promise<void> {
        await supabase
            .from('firmas_electronicas')
            .update({
                valida: false,
                motivo_invalidacion: motivo,
                invalidada_en: new Date().toISOString(),
            })
            .eq('contrato_id', contratoId)
            .eq('valida', true);

        // Volver estado a EN_NEGOCIACION
        await supabase
            .from('contratos_arras')
            .update({ estado: 'EN_NEGOCIACION' })
            .eq('id', contratoId);
    }

    // ================================================
    // MÉTODOS PRIVADOS
    // ================================================

    private async crearEventoFirma(contratoId: string, parteId: string, tst: any, userId?: string): Promise<void> {
        const payload = {
            tipo: 'FIRMA_REGISTRADA',
            parteId,
            tst_token: tst.token,
        };

        await supabase.from('eventos').insert({
            contrato_id: contratoId,
            tipo: 'FIRMA_REGISTRADA',
            payload_json: payload,
            hash_sha256: calcularHash(JSON.stringify(payload)),
            tst_fecha: tst.fecha.toISOString(),
            tst_token: tst.token,
            tst_proveedor: tst.proveedor,
            actor_tipo: 'COMPRADOR', // TODO: determinar desde el rol
            actor_usuario_id: userId || null,
        });
    }

    private async crearEventoDocumentoFirmado(
        contratoId: string,
        documentoId: string,
        hashPdf: string,
        tst: any
    ): Promise<void> {
        const payload = {
            tipo: 'DOCUMENTO_FIRMADO_SUBIDO',
            documentoId,
            hashPdf,
        };

        await supabase.from('eventos').insert({
            contrato_id: contratoId,
            tipo: 'DOCUMENTO_FIRMADO_SUBIDO',
            payload_json: payload,
            hash_sha256: calcularHash(JSON.stringify(payload)),
            tst_fecha: tst.fecha.toISOString(),
            tst_token: tst.token,
            tst_proveedor: tst.proveedor,
            actor_tipo: 'SISTEMA',
        });
    }
}

// ================================================
// EXPORTAR INSTANCIA SINGLETON
// ================================================

export const firmaService = new FirmaService();
export { FirmaService };
