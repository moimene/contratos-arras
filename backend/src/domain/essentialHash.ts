/**
 * Essential Hash Service
 * 
 * Blueprint v1.0 - Hash determinista para términos esenciales
 * 
 * Algoritmo:
 * 1. Construir essential_payload solo con campos esenciales
 * 2. Normalizar: dinero (2 decimales), fechas (ISO UTC), arrays ordenados
 * 3. Canonical JSON (orden lexicográfico de claves)
 * 4. SHA-256 → version_hash
 * 
 * Efecto: Si cambia version_hash, se invalidan aceptaciones y firmas
 */

import crypto from 'crypto';
import stableStringify from 'json-stable-stringify';
import type { ArrasFacts, ArrasParte, ESSENTIAL_FIELDS } from './ArrasFacts.js';

// ============================================
// TIPOS
// ============================================

export interface EssentialPayload {
    tipo_arras: string;
    precio_total: string; // Normalizado como "150000.00 EUR"
    importe_arras: string;
    fecha_limite_firma_escritura: string; // ISO UTC
    via_resolucion: string;
    forma_pago_arras: string;
    inmueble_direccion: string;
    partes: Array<{
        parte_id: string;
        rol_en_contrato: string;
        obligado_aceptar: boolean;
        obligado_firmar: boolean;
    }>;
}

export interface HashComparisonResult {
    changed: boolean;
    old_hash: string;
    new_hash: string;
    changed_fields: string[];
}

// ============================================
// NORMALIZACIÓN
// ============================================

/**
 * Normaliza un valor monetario a string con 2 decimales + moneda
 */
function normalizeDecimal(value: number, currency: string = 'EUR'): string {
    return `${value.toFixed(2)} ${currency}`;
}

/**
 * Normaliza una fecha a ISO UTC (sin milisegundos)
 */
function normalizeDate(isoDateOrTimestamp: string): string {
    const date = new Date(isoDateOrTimestamp);
    // Truncar a segundos para consistencia
    date.setMilliseconds(0);
    return date.toISOString();
}

/**
 * Ordena array de partes por (parte_id, rol_en_contrato) lexicográficamente
 */
function sortPartes(partes: ArrasParte[]): ArrasParte[] {
    return [...partes].sort((a, b) => {
        const keyA = `${a.parte_id}|${a.rol_en_contrato}`;
        const keyB = `${b.parte_id}|${b.rol_en_contrato}`;
        return keyA.localeCompare(keyB);
    });
}

// ============================================
// CONSTRUCCIÓN DE PAYLOAD ESENCIAL
// ============================================

/**
 * Construye el payload esencial normalizado desde ArrasFacts
 */
export function buildEssentialPayload(facts: ArrasFacts): EssentialPayload {
    const sortedPartes = sortPartes(facts.partes);

    return {
        tipo_arras: facts.tipo_arras,
        precio_total: normalizeDecimal(facts.precio_total),
        importe_arras: normalizeDecimal(facts.importe_arras),
        fecha_limite_firma_escritura: normalizeDate(facts.fecha_limite_firma_escritura),
        via_resolucion: facts.via_resolucion,
        forma_pago_arras: facts.forma_pago_arras,
        inmueble_direccion: facts.inmueble.direccion_completa.trim().toLowerCase(),
        partes: sortedPartes.map(p => ({
            parte_id: p.parte_id,
            rol_en_contrato: p.rol_en_contrato,
            obligado_aceptar: p.obligado_aceptar,
            obligado_firmar: p.obligado_firmar,
        })),
    };
}

// ============================================
// HASH COMPUTATION
// ============================================

/**
 * Calcula el hash SHA-256 del payload esencial (canonicalizado)
 */
export function computeEssentialHash(facts: ArrasFacts): string {
    const payload = buildEssentialPayload(facts);

    // Canonical JSON: json-stable-stringify ordena claves lexicográficamente
    const canonicalJson = stableStringify(payload);

    // Guard contra undefined (stableStringify puede devolver undefined con cycle refs)
    if (!canonicalJson) {
        throw new Error('Failed to canonicalize essential payload: circular reference detected');
    }

    // SHA-256
    return crypto.createHash('sha256').update(canonicalJson).digest('hex');
}

/**
 * Compara dos ArrasFacts y determina si los términos esenciales han cambiado
 */
export function compareEssentialTerms(
    before: ArrasFacts,
    after: ArrasFacts
): HashComparisonResult {
    const oldHash = computeEssentialHash(before);
    const newHash = computeEssentialHash(after);

    const changedFields: string[] = [];

    if (before.tipo_arras !== after.tipo_arras) {
        changedFields.push('tipo_arras');
    }
    if (before.precio_total !== after.precio_total) {
        changedFields.push('precio_total');
    }
    if (before.importe_arras !== after.importe_arras) {
        changedFields.push('importe_arras');
    }
    if (normalizeDate(before.fecha_limite_firma_escritura) !== normalizeDate(after.fecha_limite_firma_escritura)) {
        changedFields.push('fecha_limite_firma_escritura');
    }
    if (before.via_resolucion !== after.via_resolucion) {
        changedFields.push('via_resolucion');
    }
    if (before.forma_pago_arras !== after.forma_pago_arras) {
        changedFields.push('forma_pago_arras');
    }
    if (before.inmueble.direccion_completa !== after.inmueble.direccion_completa) {
        changedFields.push('inmueble.direccion_completa');
    }

    // Comparar partes
    const beforePartesKey = sortPartes(before.partes)
        .map(p => `${p.parte_id}:${p.rol_en_contrato}:${p.obligado_aceptar}:${p.obligado_firmar}`)
        .join('|');
    const afterPartesKey = sortPartes(after.partes)
        .map(p => `${p.parte_id}:${p.rol_en_contrato}:${p.obligado_aceptar}:${p.obligado_firmar}`)
        .join('|');

    if (beforePartesKey !== afterPartesKey) {
        changedFields.push('partes');
    }

    return {
        changed: oldHash !== newHash,
        old_hash: oldHash,
        new_hash: newHash,
        changed_fields: changedFields,
    };
}

// ============================================
// INVALIDACIÓN DE ACEPTACIONES/FIRMAS
// ============================================

/**
 * Detecta si un cambio de hash requiere invalidar aceptaciones/firmas
 * 
 * INVARIANTE: Si cambia version_hash:
 * - Todas las aceptaciones_terminos_esenciales.valida → false
 * - Todas las firmas_contrato.valida → false
 * - El estado_macro vuelve como mínimo a BORRADOR
 */
export function shouldInvalidateSignatures(comparison: HashComparisonResult): boolean {
    return comparison.changed;
}

/**
 * Genera el nuevo estado después de una invalidación
 */
export function getStateAfterInvalidation(): {
    estado_macro: string;
    estado_micro: string;
    mensaje: string;
} {
    return {
        estado_macro: 'BORRADOR',
        estado_micro: 'EN_NEGOCIACION',
        mensaje: 'Términos esenciales modificados. Se requiere re-aceptación de todas las partes.',
    };
}

// ============================================
// EXPORT
// ============================================

export const essentialHashService = {
    buildEssentialPayload,
    computeEssentialHash,
    compareEssentialTerms,
    shouldInvalidateSignatures,
    getStateAfterInvalidation,
};
