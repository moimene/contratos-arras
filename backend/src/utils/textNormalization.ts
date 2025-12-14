/**
 * Text Normalization Utility (cf-textnorm-v1)
 * 
 * Normalización determinista de texto legal para hash reproducible.
 * Usado para rendered_text_sha256 en mandate attestations.
 * 
 * Algoritmo:
 * 1. Convertir finales de línea: \r\n y \r → \n
 * 2. Eliminar espacios finales por línea (trim right)
 * 3. trim() global al principio/fin
 * 4. No colapsar espacios internos
 */

import { createHash } from 'crypto';

/**
 * Normaliza texto según cf-textnorm-v1
 */
export function normalizeText(text: string): string {
    return text
        // 1. Normalizar finales de línea
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        // 2. Trim right por línea
        .split('\n')
        .map(line => line.trimEnd())
        .join('\n')
        // 3. Trim global
        .trim();
}

/**
 * Calcula SHA-256 del texto normalizado
 */
export function hashNormalizedText(text: string): string {
    const normalized = normalizeText(text);
    return createHash('sha256').update(normalized, 'utf8').digest('hex');
}

/**
 * Calcula SHA-256 de cualquier string
 */
export function hashString(value: string): string {
    return createHash('sha256').update(value, 'utf8').digest('hex');
}

/**
 * Normaliza email para hash (lowercase + trim)
 */
export function normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
}

/**
 * Hash de email normalizado
 */
export function hashEmail(email: string): string {
    return hashString(normalizeEmail(email));
}

/**
 * Normaliza documento de identidad para hash
 * Uppercase, sin espacios ni guiones
 */
export function normalizeDocNumber(docNumber: string): string {
    return docNumber.toUpperCase().replace(/[\s-]/g, '');
}

/**
 * Hash de documento normalizado
 */
export function hashDocNumber(docNumber: string): string {
    return hashString(normalizeDocNumber(docNumber));
}

/**
 * Obtiene últimos 4 caracteres de documento
 */
export function getDocNumberLast4(docNumber: string): string {
    const normalized = normalizeDocNumber(docNumber);
    return normalized.slice(-4);
}

/**
 * Normaliza IP para hash
 */
export function normalizeIp(ip: string): string {
    return ip.trim().toLowerCase();
}

/**
 * Hash de IP normalizada
 */
export function hashIp(ip: string): string | null {
    if (!ip) return null;
    return hashString(normalizeIp(ip));
}

/**
 * Hash de User-Agent normalizado
 */
export function hashUserAgent(ua: string): string | null {
    if (!ua) return null;
    return hashString(ua.trim());
}

export const TEXT_NORMALIZATION_VERSION = 'cf-textnorm-v1';
