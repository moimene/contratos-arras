/**
 * Mandate Attestation Service
 * 
 * Servicio principal para sellado cualificado (QTSP) de mandatos y autorizaciones.
 * 
 * Implementa:
 * - Construcción de payloads canónicos según schema chrono-flare.mandate_attestation.v1
 * - Sellado QTSP obligatorio (sin sello → sin mandato)
 * - Persistencia de eventos con contexto completo
 * 
 * Regla estricta: Si el sellado QTSP falla, el mandato NO se crea.
 */

import { v4 as uuid } from 'uuid';
import { supabase } from '../config/supabase.js';
import { canonicalize } from '../utils/canonical.js';
import { hashSha256 } from '../utils/hash.js';
import { nowIso } from '../utils/time.js';
import { requestQualifiedTimestamp } from '../qtsp/eadTrustClient.js';
import {
    hashNormalizedText,
    hashEmail,
    hashDocNumber,
    getDocNumberLast4,
    hashIp,
    hashUserAgent,
    TEXT_NORMALIZATION_VERSION
} from '../utils/textNormalization.js';
import {
    getLegalText,
    renderLegalText,
    getTextIdForMandatoTipo,
    type LegalTextId
} from '../domain/legalTexts.js';
import type { TipoRolUsuario } from '../types/models.js';

// ============================================
// TYPES
// ============================================

const SCHEMA_VERSION = 'chrono-flare.mandate_attestation.v1';

/** Tipos de mandato que pueden ser sellados con QTSP (tienen texto legal asociado) */
export type SealableMandatoTipo =
    | 'PARTE_COMPRADORA'
    | 'PARTE_VENDEDORA'
    | 'AMBAS_PARTES'
    | 'NOTARIA';

export type MandateEventType =
    | 'MANDATO_OTORGADO'
    | 'MANDATO_REVOCADO'
    | 'MANDATO_DUAL_ACEPTADO'
    | 'AUTORIZACION_NOTARIA_OTORGADA'
    | 'AUTORIZACION_NOTARIA_REVOCADA';

export interface AttestationContext {
    ip?: string;
    userAgent?: string;
    idempotencyKey?: string;
    requestId?: string;
    uiSurface?: string;
}

export interface OtorganteInfo {
    usuarioId: string;
    rolSistema: TipoRolUsuario;
    displayName?: string;
    docType?: string;
    docNumber?: string;
}

export interface MandatarioInfo {
    usuarioId?: string;
    email?: string;
    displayName?: string;
    rolSistema: 'TERCERO' | 'NOTARIO';
}

export interface MandatoPermissions {
    puedeSubirDocumentos: boolean;
    puedeInvitar: boolean;
    puedeValidarDocumentos: boolean;
    puedeFirmar: boolean;
    puedeEnviarComunicaciones?: boolean;
}

export interface MandateAttestationParams {
    contratoId: string;
    mandatoId: string;
    mandatoTipo: SealableMandatoTipo;
    eventType: MandateEventType;
    permissions: MandatoPermissions;
    otorgante: OtorganteInfo;
    mandatario: MandatarioInfo;
    invitacionId?: string;
    context: AttestationContext;
    dualAcceptingParty?: 'COMPRADOR' | 'VENDEDOR';
    dualAcceptanceIndex?: number;
}

export interface AttestationResult {
    eventoId: string;
    mandatoId: string;
    hashSha256: string;
    qtspProvider: string;
    qtspTime: string;
    qtspToken: string;
}

// ============================================
// PAYLOAD BUILDER
// ============================================

/**
 * Construye el payload canónico para mandate attestation
 */
export function buildMandateAttestationPayload(
    params: MandateAttestationParams,
    renderedTextHash: string
): Record<string, any> {
    const {
        contratoId,
        mandatoId,
        mandatoTipo,
        eventType,
        permissions,
        otorgante,
        mandatario,
        invitacionId,
        context,
        dualAcceptingParty,
        dualAcceptanceIndex
    } = params;

    const textId = getTextIdForMandatoTipo(mandatoTipo);
    const legalText = getLegalText(textId);
    const acceptedAt = nowIso();

    const payload: Record<string, any> = {
        schema: SCHEMA_VERSION,
        event_type: eventType,
        contrato_id: contratoId,
    };

    // Mandato o autorización
    if (mandatoTipo === 'NOTARIA') {
        payload.autorizacion = {
            autorizacion_id: mandatoId,
            autorizacion_tipo: 'NOTARIA'
        };
    } else {
        payload.mandato = {
            mandato_id: mandatoId,
            mandato_tipo: mandatoTipo
        };
    }

    // Dual mandate info
    if (mandatoTipo === 'AMBAS_PARTES' && dualAcceptingParty) {
        payload.dual = {
            accepting_party: dualAcceptingParty,
            requires_counterparty_acceptance: true,
            acceptance_index: dualAcceptanceIndex || 1
        };
    }

    // Permissions
    payload.permissions = {
        puede_subir_documentos: permissions.puedeSubirDocumentos,
        puede_invitar: permissions.puedeInvitar,
        puede_validar_documentos: permissions.puedeValidarDocumentos,
        puede_firmar: permissions.puedeFirmar
    };

    // Otorgante
    payload.otorgante = {
        usuario_id: otorgante.usuarioId,
        rol_sistema: otorgante.rolSistema,
        snapshot: {
            display_name: otorgante.displayName || null
        }
    };

    if (otorgante.docType && otorgante.docNumber) {
        payload.otorgante.snapshot.identity = {
            doc_type: otorgante.docType,
            doc_number_last4: getDocNumberLast4(otorgante.docNumber),
            doc_number_sha256: hashDocNumber(otorgante.docNumber)
        };
    }

    // Mandatario
    if (mandatoTipo === 'NOTARIA') {
        payload.notaria = {
            rol_sistema: 'NOTARIO',
            usuario_id: mandatario.usuarioId || null,
            email_hash_sha256: mandatario.email ? hashEmail(mandatario.email) : null,
            snapshot: {
                nombre_notaria: mandatario.displayName || null
            }
        };
    } else {
        payload.mandatario = {
            rol_sistema: mandatario.rolSistema,
            usuario_id: mandatario.usuarioId || null,
            email_hash_sha256: mandatario.email ? hashEmail(mandatario.email) : null,
            snapshot: {
                display_name: mandatario.displayName || null
            }
        };
    }

    // Legal text
    payload.legal_text = {
        text_id: legalText.text_id,
        text_version: legalText.version,
        rendered_language: legalText.language,
        rendered_text_normalization: TEXT_NORMALIZATION_VERSION,
        rendered_text_sha256: renderedTextHash
    };

    // UI acceptance
    payload.ui_acceptance = {
        accepted_checkbox: true,
        accepted_at_server: acceptedAt,
        ui_surface: context.uiSurface || 'InviteModal',
        idempotency_key: context.idempotencyKey || null,
        request_id: context.requestId || uuid()
    };

    // Context
    payload.context = {
        ip_hash_sha256: hashIp(context.ip || '') || null,
        user_agent_hash_sha256: hashUserAgent(context.userAgent || '') || null
    };

    // Invitation
    payload.invitation = {
        invitacion_id: invitacionId || null,
        token_id: null
    };

    return payload;
}

// ============================================
// MAIN SERVICE
// ============================================

/**
 * Sella un mandato con QTSP y lo persiste
 * 
 * REGLA ESTRICTA: Si el sellado falla, lanza error y no crea el mandato.
 * El caller debe manejar el error y NO persistir el mandato.
 */
export async function sealMandateAttestation(
    params: MandateAttestationParams,
    textVariables: Record<string, string>
): Promise<AttestationResult> {
    const textId = getTextIdForMandatoTipo(params.mandatoTipo);

    // 1. Renderizar texto legal
    const renderedText = renderLegalText(textId, textVariables);
    const renderedTextHash = hashNormalizedText(renderedText);

    // 2. Construir payload canónico
    const payload = buildMandateAttestationPayload(params, renderedTextHash);

    // 3. Canonicalizar y calcular hash
    const canonicalJson = canonicalize(payload);
    const payloadHash = hashSha256(canonicalJson);

    // 4. Solicitar sello de tiempo cualificado al QTSP
    // REGLA ESTRICTA: Si falla, throw. El mandato NO se crea.
    let qtspResponse;
    try {
        qtspResponse = await requestQualifiedTimestamp(payloadHash);
    } catch (error: any) {
        console.error('[MandateAttestation] QTSP failed:', error.message);
        throw new Error(`QTSP sealing failed: ${error.message}. Mandate NOT created.`);
    }

    // 5. Guardar sello de tiempo
    const selloId = uuid();
    const { error: selloError } = await supabase
        .from('sellos_tiempo')
        .insert({
            id: selloId,
            proveedor: qtspResponse.proveedor,
            marca: qtspResponse.marca,
            hash_sha256: payloadHash,
            rfc3161_tst_base64: qtspResponse.rfc3161TstBase64,
            fecha_sello: qtspResponse.fechaSello,
            estado: 'EMITIDO',
            metadata_json: {
                ...qtspResponse.metadata,
                attestation_type: params.eventType,
                mandato_tipo: params.mandatoTipo
            }
        });

    if (selloError) {
        console.error('[MandateAttestation] Failed to save sello:', selloError);
        throw new Error(`Failed to persist QTSP seal: ${selloError.message}`);
    }

    // 6. Guardar evento con contexto completo
    const eventoId = uuid();
    const { error: eventoError } = await supabase
        .from('eventos')
        .insert({
            id: eventoId,
            contrato_id: params.contratoId,
            tipo: params.eventType,
            actor_parte_id: null,
            actor_usuario_id: params.otorgante.usuarioId,
            actor_tipo: params.otorgante.rolSistema,
            actor_mandato_id: params.mandatoId,
            actor_mandato_tipo: params.mandatoTipo,
            payload_json: payload,
            hash_sha256: payloadHash,
            prev_hash_sha256: null,
            fecha_hora: nowIso(),
            sello_id: selloId
        });

    if (eventoError) {
        console.error('[MandateAttestation] Failed to save evento:', eventoError);
        throw new Error(`Failed to persist event: ${eventoError.message}`);
    }

    console.log(`✓ Mandate attestation sealed: ${params.eventType} (${eventoId.slice(0, 8)}...)`);

    return {
        eventoId,
        mandatoId: params.mandatoId,
        hashSha256: payloadHash,
        qtspProvider: qtspResponse.proveedor,
        qtspTime: qtspResponse.fechaSello,
        qtspToken: qtspResponse.rfc3161TstBase64
    };
}

/**
 * Sella la revocación de un mandato
 */
export async function sealMandateRevocation(
    contratoId: string,
    mandatoId: string,
    mandatoTipo: SealableMandatoTipo,
    revocadorId: string,
    revocadorRol: TipoRolUsuario,
    context: AttestationContext
): Promise<AttestationResult> {
    const eventType: MandateEventType = mandatoTipo === 'NOTARIA'
        ? 'AUTORIZACION_NOTARIA_REVOCADA'
        : 'MANDATO_REVOCADO';

    const payload = {
        schema: SCHEMA_VERSION,
        event_type: eventType,
        contrato_id: contratoId,
        mandato_id: mandatoId,
        mandato_tipo: mandatoTipo,
        revocado_por: {
            usuario_id: revocadorId,
            rol_sistema: revocadorRol
        },
        revocado_at: nowIso(),
        context: {
            ip_hash_sha256: hashIp(context.ip || '') || null,
            user_agent_hash_sha256: hashUserAgent(context.userAgent || '') || null,
            idempotency_key: context.idempotencyKey || null
        }
    };

    const canonicalJson = canonicalize(payload);
    const payloadHash = hashSha256(canonicalJson);

    // QTSP seal
    let qtspResponse;
    try {
        qtspResponse = await requestQualifiedTimestamp(payloadHash);
    } catch (error: any) {
        throw new Error(`QTSP sealing failed for revocation: ${error.message}`);
    }

    // Save sello
    const selloId = uuid();
    await supabase.from('sellos_tiempo').insert({
        id: selloId,
        proveedor: qtspResponse.proveedor,
        marca: qtspResponse.marca,
        hash_sha256: payloadHash,
        rfc3161_tst_base64: qtspResponse.rfc3161TstBase64,
        fecha_sello: qtspResponse.fechaSello,
        estado: 'EMITIDO',
        metadata_json: { attestation_type: eventType }
    });

    // Save evento
    const eventoId = uuid();
    await supabase.from('eventos').insert({
        id: eventoId,
        contrato_id: contratoId,
        tipo: eventType,
        actor_usuario_id: revocadorId,
        actor_tipo: revocadorRol,
        actor_mandato_id: mandatoId,
        actor_mandato_tipo: mandatoTipo,
        payload_json: payload,
        hash_sha256: payloadHash,
        fecha_hora: nowIso(),
        sello_id: selloId
    });

    console.log(`✓ Mandate revocation sealed: ${eventType} (${eventoId.slice(0, 8)}...)`);

    return {
        eventoId,
        mandatoId,
        hashSha256: payloadHash,
        qtspProvider: qtspResponse.proveedor,
        qtspTime: qtspResponse.fechaSello,
        qtspToken: qtspResponse.rfc3161TstBase64
    };
}
