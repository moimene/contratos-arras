import crypto from 'crypto';

/**
 * Calcula el hash SHA-256 de cualquier input
 */
export function hashSha256(input: string | object): string {
    const text = typeof input === 'string' ? input : JSON.stringify(input);
    return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Calcula hash de términos esenciales para control de versión
 */
export function hashEssential(input: any): string {
    // Ordenar las claves para garantizar consistencia
    const json = JSON.stringify(input, Object.keys(input).sort());
    return crypto.createHash('sha256').update(json).digest('hex');
}
