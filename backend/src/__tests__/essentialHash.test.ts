/**
 * Essential Hash Tests
 * 
 * Blueprint v1.0 - Verificar hash determinista
 */

import { describe, expect, test } from '@jest/globals';
import {
    buildEssentialPayload,
    computeEssentialHash,
    compareEssentialTerms,
    shouldInvalidateSignatures,
    getStateAfterInvalidation
} from '../domain/essentialHash.js';
import type { ArrasFacts } from '../domain/ArrasFacts.js';

// ============================================
// FIXTURES
// ============================================

const baseFacts: ArrasFacts = {
    contrato_id: 'test-123',
    version_numero: 1,
    version_hash: 'abc123',
    created_at: '2026-01-01T10:00:00.000Z',

    inmueble: {
        id: 'inmueble-1',
        direccion_completa: 'Calle Mayor, 1, 28001 Madrid',
        ciudad: 'Madrid',
        provincia: 'Madrid',
        referencia_catastral: '1234567',
    },

    partes: [
        {
            parte_id: 'comprador-1',
            rol_en_contrato: 'COMPRADOR',
            nombre_completo: 'Juan García',
            tipo_documento: 'DNI',
            numero_documento: '12345678A',
            email: 'juan@example.com',
            obligado_aceptar: true,
            obligado_firmar: true,
        },
        {
            parte_id: 'vendedor-1',
            rol_en_contrato: 'VENDEDOR',
            nombre_completo: 'María López',
            tipo_documento: 'DNI',
            numero_documento: '87654321B',
            email: 'maria@example.com',
            obligado_aceptar: true,
            obligado_firmar: true,
        },
    ],

    tipo_arras: 'PENITENCIALES',
    precio_total: 150000.00,
    importe_arras: 15000.00,
    fecha_limite_firma_escritura: '2026-03-01T10:00:00.000Z',
    forma_pago_arras: 'AL_FIRMAR',
    via_resolucion: 'JUZGADOS',
    firma_preferida: 'ELECTRONICA',
};

// ============================================
// TESTS
// ============================================

describe('Essential Hash Service', () => {

    describe('buildEssentialPayload', () => {
        test('normaliza precios con 2 decimales y EUR', () => {
            const payload = buildEssentialPayload(baseFacts);

            expect(payload.precio_total).toBe('150000.00 EUR');
            expect(payload.importe_arras).toBe('15000.00 EUR');
        });

        test('ordena partes lexicográficamente por parte_id', () => {
            const factsDesordenadas: ArrasFacts = {
                ...baseFacts,
                partes: [
                    { ...baseFacts.partes[1], parte_id: 'zzz-vendedor' },
                    { ...baseFacts.partes[0], parte_id: 'aaa-comprador' },
                ],
            };

            const payload = buildEssentialPayload(factsDesordenadas);

            expect(payload.partes[0].parte_id).toBe('aaa-comprador');
            expect(payload.partes[1].parte_id).toBe('zzz-vendedor');
        });

        test('normaliza dirección a lowercase', () => {
            const payload = buildEssentialPayload(baseFacts);

            expect(payload.inmueble_direccion).toBe('calle mayor, 1, 28001 madrid');
        });
    });

    describe('computeEssentialHash', () => {
        test('produce hash SHA-256 de 64 caracteres', () => {
            const hash = computeEssentialHash(baseFacts);

            expect(hash).toHaveLength(64);
            expect(hash).toMatch(/^[a-f0-9]{64}$/);
        });

        test('mismo input produce mismo hash (determinista)', () => {
            const hash1 = computeEssentialHash(baseFacts);
            const hash2 = computeEssentialHash(baseFacts);

            expect(hash1).toBe(hash2);
        });

        test('partes en diferente orden producen mismo hash', () => {
            const factsOrdenInverso: ArrasFacts = {
                ...baseFacts,
                partes: [baseFacts.partes[1], baseFacts.partes[0]],
            };

            const hash1 = computeEssentialHash(baseFacts);
            const hash2 = computeEssentialHash(factsOrdenInverso);

            expect(hash1).toBe(hash2);
        });

        test('cambio en precio produce hash diferente', () => {
            const factsModificadas: ArrasFacts = {
                ...baseFacts,
                precio_total: 151000.00,
            };

            const hash1 = computeEssentialHash(baseFacts);
            const hash2 = computeEssentialHash(factsModificadas);

            expect(hash1).not.toBe(hash2);
        });
    });

    describe('compareEssentialTerms', () => {
        test('detecta cambio en precio_total', () => {
            const modified: ArrasFacts = {
                ...baseFacts,
                precio_total: 160000.00,
            };

            const result = compareEssentialTerms(baseFacts, modified);

            expect(result.changed).toBe(true);
            expect(result.changed_fields).toContain('precio_total');
        });

        test('detecta cambio en tipo_arras', () => {
            const modified: ArrasFacts = {
                ...baseFacts,
                tipo_arras: 'CONFIRMATORIAS',
            };

            const result = compareEssentialTerms(baseFacts, modified);

            expect(result.changed).toBe(true);
            expect(result.changed_fields).toContain('tipo_arras');
        });

        test('no detecta cambio si son iguales', () => {
            const result = compareEssentialTerms(baseFacts, baseFacts);

            expect(result.changed).toBe(false);
            expect(result.changed_fields).toHaveLength(0);
        });

        test('no detecta cambio en campos no-esenciales', () => {
            const modified: ArrasFacts = {
                ...baseFacts,
                firma_preferida: 'MANUSCRITA', // No esencial
                version_numero: 99,
            };

            const result = compareEssentialTerms(baseFacts, modified);

            expect(result.changed).toBe(false);
        });
    });

    describe('shouldInvalidateSignatures', () => {
        test('devuelve true si hay cambio', () => {
            const comparison = {
                changed: true,
                old_hash: 'abc',
                new_hash: 'def',
                changed_fields: ['precio_total'],
            };

            expect(shouldInvalidateSignatures(comparison)).toBe(true);
        });

        test('devuelve false si no hay cambio', () => {
            const comparison = {
                changed: false,
                old_hash: 'abc',
                new_hash: 'abc',
                changed_fields: [],
            };

            expect(shouldInvalidateSignatures(comparison)).toBe(false);
        });
    });

    describe('getStateAfterInvalidation', () => {
        test('devuelve estado BORRADOR', () => {
            const result = getStateAfterInvalidation();

            expect(result.estado_macro).toBe('BORRADOR');
            expect(result.estado_micro).toBe('EN_NEGOCIACION');
            expect(result.mensaje).toContain('re-aceptación');
        });
    });
});
