/**
 * CertifiedEventBus - Motor QTSP de Evidencias Certificadas
 * 
 * Servicio central para logging de eventos con integridad criptográfica.
 * Implementa hash chain (blockchain-lite) para inversión de carga de prueba.
 * 
 * IMPORTANTE: Usa json-stable-stringify para JSON determinista (evita 
 * problemas de orden de claves en verificación legal futura).
 * 
 * @module CertifiedEventBus
 * @version 1.0.0
 * @license MIT
 */

import { createHash } from 'crypto';
import stringify from 'json-stable-stringify';
import { supabase } from '../config/supabase.js';
import { v4 as uuidv4 } from 'uuid';

// =====================================================
// TIPOS
// =====================================================

export type TipoEventoCertificado =
    | 'CONTRATO_CREADO'
    | 'CONTRATO_ACTUALIZADO'
    | 'TERMINOS_ACEPTADOS'
    | 'FIRMA_REGISTRADA'
    | 'FIRMA_INVALIDADA'
    | 'DOCUMENTO_SUBIDO'
    | 'DOCUMENTO_VERIFICADO'
    | 'CITA_NOTARIAL_CREADA'
    | 'CONVOCATORIA_ENVIADA'
    | 'ACTA_GENERADA'
    | 'PAGO_DECLARADO'
    | 'PAGO_ACREDITADO'
    | 'ESTADO_CAMBIADO'
    | 'COMUNICACION_ENVIADA'
    | 'COMUNICACION_ENTREGADA'
    | 'COMUNICACION_LEIDA'
    | 'CONTRATO_RECLAMADO';

export interface EventoPayload {
    [key: string]: unknown;
}

export interface RegistrarEventoParams {
    contratoId: string;
    tipo: TipoEventoCertificado;
    payload: EventoPayload;
    actorParteId?: string;      // Parte (legacy)
    actorUsuarioId?: string;    // Usuario autenticado (SaaS)
    ipAddress?: string;
    userAgent?: string;
}

export interface EventoCertificado {
    id: string;
    contrato_id: string;
    tipo: string;
    actor_parte_id: string | null;
    actor_usuario_id: string | null;
    payload_json: EventoPayload;
    hash_sha256: string;
    prev_hash_sha256: string | null;
    fecha_hora: string;
    sello_id: string | null;
}

export interface EvidenciaQTSP {
    id: string;
    evento_id: string;
    algoritmo_hash: string;
    hash_calculado: string;
    tst_raw: Buffer | null;
    tst_base64: string | null;
    authority_name: string | null;
    estado: 'PENDIENTE' | 'SELLADO' | 'ERROR' | 'VERIFICADO';
    created_at: string;
}

// =====================================================
// INTERFAZ QTSP (Strategy Pattern para inyección)
// =====================================================

export interface ITimestampAuthority {
    name: string;
    requestTimestamp(hash: string): Promise<{
        tst_base64: string;
        tst_serial_number?: string;
        authority_key_id?: string;
        policy_oid?: string;
        fecha_sello: Date;
    }>;
}

// =====================================================
// STUB QTSP (Desarrollo)
// =====================================================

export class StubQTSP implements ITimestampAuthority {
    name = 'STUB_DEV_QTSP';

    async requestTimestamp(hash: string): Promise<{
        tst_base64: string;
        tst_serial_number?: string;
        authority_key_id?: string;
        policy_oid?: string;
        fecha_sello: Date;
    }> {
        // Simular delay de red
        await new Promise(resolve => setTimeout(resolve, 100));

        // Generar TST simulado (hash firmado con timestamp)
        const timestamp = new Date();
        const tstData = {
            hash,
            timestamp: timestamp.toISOString(),
            authority: this.name,
            serial: uuidv4().replace(/-/g, '').substring(0, 16).toUpperCase()
        };

        const tstBase64 = Buffer.from(JSON.stringify(tstData)).toString('base64');

        return {
            tst_base64: tstBase64,
            tst_serial_number: tstData.serial,
            authority_key_id: 'STUB-DEV-001',
            policy_oid: '1.2.3.4.5.6.7.8.9.0',
            fecha_sello: timestamp
        };
    }
}

// =====================================================
// CERTIFIED EVENT BUS
// =====================================================

class CertifiedEventBusService {
    private qtspProvider: ITimestampAuthority;

    constructor(qtspProvider?: ITimestampAuthority) {
        // Por defecto usar Stub (desarrollo)
        this.qtspProvider = qtspProvider || new StubQTSP();
    }

    /**
     * Configura el proveedor QTSP (para inyección en producción)
     */
    setQTSPProvider(provider: ITimestampAuthority): void {
        this.qtspProvider = provider;
        console.log(`[CertifiedEventBus] QTSP provider set: ${provider.name}`);
    }

    /**
     * Obtiene el hash del último evento de un contrato (para encadenamiento)
     */
    private async getLastEventHash(contratoId: string): Promise<string | null> {
        const { data, error } = await supabase
            .from('eventos')
            .select('hash_sha256')
            .eq('contrato_id', contratoId)
            .order('fecha_hora', { ascending: false })
            .limit(1)
            .single();

        if (error || !data) {
            return null; // Primer evento del contrato
        }

        return data.hash_sha256;
    }

    /**
     * Calcula hash SHA-256 de forma determinista
     * 
     * CRÍTICO: Usa json-stable-stringify para garantizar orden de claves
     * consistente en verificaciones futuras (juicio, auditoría, etc.)
     */
    private calculateHash(
        payload: EventoPayload,
        prevHash: string | null,
        actorId: string | null,
        timestamp: string
    ): string {
        const dataToHash = {
            payload: payload,
            prevHash: prevHash || 'GENESIS',
            actorId: actorId || 'SYSTEM',
            timestamp: timestamp
        };

        // stringify garantiza orden alfabético de claves
        const canonicalJson = stringify(dataToHash) || '';

        return createHash('sha256')
            .update(canonicalJson)
            .digest('hex');
    }

    /**
     * Registra un evento certificado con hash chain
     * 
     * Flujo:
     * 1. Obtener prev_hash del último evento
     * 2. Calcular hash del evento actual
     * 3. Insertar evento en BD
     * 4. (Async) Solicitar TST del QTSP
     * 5. Guardar evidencia en evidencias_qtsp
     */
    async registrarEvento(params: RegistrarEventoParams): Promise<EventoCertificado> {
        const {
            contratoId,
            tipo,
            payload,
            actorParteId,
            actorUsuarioId,
            ipAddress,
            userAgent
        } = params;

        const timestamp = new Date().toISOString();

        // 1. Obtener hash anterior para encadenamiento
        const prevHash = await this.getLastEventHash(contratoId);

        // 2. Calcular hash del evento actual
        const actorId = actorUsuarioId || actorParteId || null;
        const hash = this.calculateHash(payload, prevHash, actorId, timestamp);

        // 3. Preparar payload enriquecido
        const enrichedPayload: EventoPayload = {
            ...payload,
            _meta: {
                ipAddress: ipAddress || 'unknown',
                userAgent: userAgent || 'unknown',
                timestamp
            }
        };

        // 4. Insertar evento
        const { data: evento, error } = await supabase
            .from('eventos')
            .insert({
                id: uuidv4(),
                contrato_id: contratoId,
                tipo,
                actor_parte_id: actorParteId || null,
                actor_usuario_id: actorUsuarioId || null,
                payload_json: enrichedPayload,
                hash_sha256: hash,
                prev_hash_sha256: prevHash,
                fecha_hora: timestamp
            })
            .select()
            .single();

        if (error) {
            console.error('[CertifiedEventBus] Error inserting event:', error);
            throw new Error(`Failed to register certified event: ${error.message}`);
        }

        // 5. (Async) Solicitar sello de tiempo y guardar evidencia
        this.requestAndStoreTimestamp(evento.id, hash).catch(err => {
            console.error('[CertifiedEventBus] Async TST error:', err);
        });

        console.log(`[CertifiedEventBus] Event registered: ${tipo} for contract ${contratoId}`);
        console.log(`[CertifiedEventBus] Hash: ${hash.substring(0, 16)}... | PrevHash: ${prevHash?.substring(0, 16) || 'GENESIS'}...`);

        return evento as EventoCertificado;
    }

    /**
     * Solicita sello de tiempo al QTSP y guarda evidencia
     * (Ejecutado de forma asíncrona para no bloquear)
     */
    private async requestAndStoreTimestamp(eventoId: string, hash: string): Promise<void> {
        try {
            // Crear registro de evidencia en estado PENDIENTE
            const { data: evidencia, error: insertError } = await supabase
                .from('evidencias_qtsp')
                .insert({
                    id: uuidv4(),
                    evento_id: eventoId,
                    algoritmo_hash: 'SHA-256',
                    hash_calculado: hash,
                    estado: 'PENDIENTE'
                })
                .select()
                .single();

            if (insertError) {
                throw new Error(`Failed to create evidence record: ${insertError.message}`);
            }

            // Solicitar TST al QTSP
            const tst = await this.qtspProvider.requestTimestamp(hash);

            // Actualizar evidencia con TST
            const { error: updateError } = await supabase
                .from('evidencias_qtsp')
                .update({
                    tst_base64: tst.tst_base64,
                    tst_serial_number: tst.tst_serial_number,
                    authority_key_id: tst.authority_key_id,
                    authority_name: this.qtspProvider.name,
                    policy_oid: tst.policy_oid,
                    fecha_sello: tst.fecha_sello.toISOString(),
                    estado: 'SELLADO'
                })
                .eq('id', evidencia.id);

            if (updateError) {
                throw new Error(`Failed to update evidence with TST: ${updateError.message}`);
            }

            console.log(`[CertifiedEventBus] TST obtained from ${this.qtspProvider.name} for event ${eventoId}`);

        } catch (error) {
            // Marcar evidencia como ERROR
            await supabase
                .from('evidencias_qtsp')
                .update({
                    estado: 'ERROR',
                    error_message: error instanceof Error ? error.message : 'Unknown error'
                })
                .eq('evento_id', eventoId);

            throw error;
        }
    }

    /**
     * Verifica la integridad de la cadena de eventos de un contrato
     */
    async verificarCadena(contratoId: string): Promise<{
        valid: boolean;
        totalEvents: number;
        brokenAt?: number;
        message: string;
    }> {
        const { data: eventos, error } = await supabase
            .from('eventos')
            .select('*')
            .eq('contrato_id', contratoId)
            .order('fecha_hora', { ascending: true });

        if (error) {
            throw new Error(`Failed to fetch events: ${error.message}`);
        }

        if (!eventos || eventos.length === 0) {
            return {
                valid: true,
                totalEvents: 0,
                message: 'No events found for this contract'
            };
        }

        // Verificar cada evento
        for (let i = 0; i < eventos.length; i++) {
            const evento = eventos[i];
            const prevEvento = i > 0 ? eventos[i - 1] : null;

            // Verificar que prev_hash coincide con el hash del evento anterior
            const expectedPrevHash = prevEvento?.hash_sha256 || null;
            if (evento.prev_hash_sha256 !== expectedPrevHash) {
                return {
                    valid: false,
                    totalEvents: eventos.length,
                    brokenAt: i,
                    message: `Chain broken at event ${i}: prev_hash mismatch`
                };
            }

            // Recalcular hash y verificar
            const actorId = evento.actor_usuario_id || evento.actor_parte_id || null;
            const recalculatedHash = this.calculateHash(
                evento.payload_json,
                evento.prev_hash_sha256,
                actorId,
                evento.fecha_hora
            );

            if (recalculatedHash !== evento.hash_sha256) {
                return {
                    valid: false,
                    totalEvents: eventos.length,
                    brokenAt: i,
                    message: `Chain broken at event ${i}: hash mismatch (data tampered)`
                };
            }
        }

        return {
            valid: true,
            totalEvents: eventos.length,
            message: `Hash chain verified: ${eventos.length} events intact`
        };
    }

    /**
     * Obtiene el historial de eventos de un contrato con estado de evidencias
     */
    async getEventosConEvidencias(contratoId: string): Promise<Array<{
        evento: EventoCertificado;
        evidencia: EvidenciaQTSP | null;
    }>> {
        const { data, error } = await supabase
            .from('eventos')
            .select(`
        *,
        evidencias_qtsp (*)
      `)
            .eq('contrato_id', contratoId)
            .order('fecha_hora', { ascending: true });

        if (error) {
            throw new Error(`Failed to fetch events: ${error.message}`);
        }

        return (data || []).map(row => ({
            evento: {
                id: row.id,
                contrato_id: row.contrato_id,
                tipo: row.tipo,
                actor_parte_id: row.actor_parte_id,
                actor_usuario_id: row.actor_usuario_id,
                payload_json: row.payload_json,
                hash_sha256: row.hash_sha256,
                prev_hash_sha256: row.prev_hash_sha256,
                fecha_hora: row.fecha_hora,
                sello_id: row.sello_id
            },
            evidencia: row.evidencias_qtsp?.[0] || null
        }));
    }
}

// Singleton export
export const certifiedEventBus = new CertifiedEventBusService();

// Named export for testing/DI
export { CertifiedEventBusService };
