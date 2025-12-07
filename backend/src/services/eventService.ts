import { supabase } from '../config/supabase.js';
import { canonicalize } from '../utils/canonical.js';
import { hashSha256 } from '../utils/hash.js';
import { nowIso } from '../utils/time.js';
import { requestQualifiedTimestamp } from '../qtsp/eadTrustClient.js';
import { v4 as uuid } from 'uuid';
import type { TipoEvento } from '../types/models.js';

/**
 * Servicio para registro y certificación de eventos
 * Cada evento se convierte en documento electrónico, se calcula hash
 * y se solicita sello de tiempo cualificado al QTSP
 */

export interface RegisterEventParams {
    contratoId: string;
    tipo: TipoEvento;
    payload: Record<string, any>;
    actorParteId?: string;
}

export interface EventResult {
    eventoId: string;
    selloId: string;
    hashSha256: string;
    prevHashSha256?: string;
}

/**
 * Registra un evento y lo certifica con sello de tiempo
 */
export async function registerEvent(
    params: RegisterEventParams
): Promise<EventResult> {
    const { contratoId, tipo, payload, actorParteId } = params;

    // 1. Canonicalizar payload
    const canonical = canonicalize(payload);
    const hash = hashSha256(canonical);

    // 2. Recuperar hash del evento anterior para encadenamiento
    const { data: lastEvent } = await supabase
        .from('eventos')
        .select('hash_sha256')
        .eq('contrato_id', contratoId)
        .order('fecha_hora', { ascending: false })
        .limit(1)
        .single();

    const prevHashSha256 = lastEvent?.hash_sha256 || undefined;

    // 3. Solicitar sello de tiempo al QTSP
    const tstResponse = await requestQualifiedTimestamp(hash);

    // 4. Guardar sello de tiempo
    const selloId = uuid();
    const { error: selloError } = await supabase
        .from('sellos_tiempo')
        .insert({
            id: selloId,
            proveedor: tstResponse.proveedor,
            marca: tstResponse.marca,
            hash_sha256: hash,
            rfc3161_tst_base64: tstResponse.rfc3161TstBase64,
            fecha_sello: tstResponse.fechaSello,
            estado: 'EMITIDO',
            metadata_json: tstResponse.metadata,
        });

    if (selloError) throw selloError;

    // 5. Guardar evento
    const eventoId = uuid();
    const { error: eventoError } = await supabase
        .from('eventos')
        .insert({
            id: eventoId,
            contrato_id: contratoId,
            tipo,
            actor_parte_id: actorParteId || null,
            payload_json: JSON.parse(canonical),
            hash_sha256: hash,
            prev_hash_sha256: prevHashSha256 || null,
            fecha_hora: nowIso(),
            sello_id: selloId,
        });

    if (eventoError) throw eventoError;

    console.log(`✓ Evento certificado: ${tipo} (${eventoId.slice(0, 8)}...)`);

    return {
        eventoId,
        selloId,
        hashSha256: hash,
        prevHashSha256,
    };
}

/**
 * Verifica la cadena de eventos de un contrato
 */
export async function verifyEventChain(
    contratoId: string
): Promise<{ valid: boolean; errors: string[] }> {
    const { data: eventos } = await supabase
        .from('eventos')
        .select('id, hash_sha256, prev_hash_sha256, payload_json')
        .eq('contrato_id', contratoId)
        .order('fecha_hora', { ascending: true });

    if (!eventos || eventos.length === 0) {
        return { valid: true, errors: [] };
    }

    const errors: string[] = [];
    let prevHash: string | undefined;

    for (const evento of eventos) {
        // Verificar encadenamiento
        if (prevHash && evento.prev_hash_sha256 !== prevHash) {
            errors.push(
                `Evento ${evento.id}: hash anterior no coincide (esperado: ${prevHash}, encontrado: ${evento.prev_hash_sha256})`
            );
        }

        // Verificar hash del payload
        const canonical = canonicalize(evento.payload_json);
        const calculatedHash = hashSha256(canonical);
        if (calculatedHash !== evento.hash_sha256) {
            errors.push(
                `Evento ${evento.id}: hash del payload no coincide`
            );
        }

        prevHash = evento.hash_sha256;
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
