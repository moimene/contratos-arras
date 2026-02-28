/**
 * Decision Engine - gateCommand Tests
 * 
 * Blueprint v1.0 - Verificar Shadow/Advisory/Authority phases
 */

import { describe, expect, test } from '@jest/globals';
import { gateCommand } from '../domain/DecisionEngine.js';
import type { ArrasDecision } from '../domain/ArrasDecision.js';

// ============================================
// FIXTURES
// ============================================

function makeDecision(overrides: Partial<ArrasDecision> = {}): ArrasDecision {
    return {
        state_macro: 'BORRADOR',
        state_micro: 'EN_NEGOCIACION',
        blockers: [],
        allowed_commands: ['UPSERT_TERMS', 'GENERATE_DRAFT', 'UPLOAD_DOCUMENT', 'VALIDATE_DOCUMENT'],
        litigation_blocked_commands: [],
        required_evidence: [],
        open_windows: [],
        normative: undefined,
        computed_at: new Date().toISOString(),
        version_hash_evaluated: 'test-hash',
        ...overrides,
    };
}

function makeLitigioDecision(): ArrasDecision {
    return makeDecision({
        state_macro: 'LITIGIO',
        state_micro: 'ALEGACIONES_PENDIENTES',
        allowed_commands: ['SEND_COMMUNICATION', 'SUBMIT_ALLEGATION'],
        litigation_blocked_commands: ['UPSERT_TERMS', 'GENERATE_DRAFT', 'REGISTER_SIGNATURE', 'DELETE_DOCUMENT', 'SCHEDULE_NOTARY'],
    });
}

// ============================================
// SHADOW PHASE
// ============================================

describe('gateCommand - Shadow Phase', () => {
    test('siempre permite comandos, incluso bloqueados', () => {
        const decision = makeLitigioDecision();
        const result = gateCommand(decision, 'REGISTER_SIGNATURE', 'shadow');

        expect(result.allowed).toBe(true);
    });

    test('devuelve warnings incluso si permite', () => {
        const decision = makeLitigioDecision();
        const result = gateCommand(decision, 'REGISTER_SIGNATURE', 'shadow');

        expect(result.allowed).toBe(true);
        expect(result.warnings.length).toBeGreaterThan(0);
    });
});

// ============================================
// ADVISORY PHASE
// ============================================

describe('gateCommand - Advisory Phase', () => {
    test('permite comandos pero genera warning para bloqueados', () => {
        const decision = makeLitigioDecision();
        const result = gateCommand(decision, 'REGISTER_SIGNATURE', 'advisory');

        expect(result.allowed).toBe(true);
        expect(result.warnings.some(w => w.includes('bloqueado'))).toBe(true);
    });

    test('permite comandos válidos sin warnings extra', () => {
        const decision = makeDecision();
        const result = gateCommand(decision, 'UPSERT_TERMS', 'advisory');

        expect(result.allowed).toBe(true);
    });
});

// ============================================
// AUTHORITY PHASE
// ============================================

describe('gateCommand - Authority Phase', () => {
    test('bloquea comandos en LITIGIO', () => {
        const decision = makeLitigioDecision();
        const result = gateCommand(decision, 'REGISTER_SIGNATURE', 'authority');

        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('LITIGIO');
    });

    test('bloquea comandos no permitidos en estado actual', () => {
        const decision = makeDecision(); // BORRADOR
        const result = gateCommand(decision, 'REGISTER_SIGNATURE', 'authority');

        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('no permitido');
    });

    test('permite comandos válidos', () => {
        const decision = makeDecision(); // BORRADOR
        const result = gateCommand(decision, 'UPSERT_TERMS', 'authority');

        expect(result.allowed).toBe(true);
        expect(result.reason).toBeUndefined();
    });

    test('permite VER_ESTADO en LITIGIO', () => {
        const decision = makeLitigioDecision();
        const result = gateCommand(decision, 'SEND_COMMUNICATION', 'authority');

        expect(result.allowed).toBe(true);
    });
});

// ============================================
// WINDOWS & BLOCKERS
// ============================================

describe('gateCommand - Warnings Content', () => {
    test('incluye blockers como warnings', () => {
        const decision = makeDecision({
            blockers: ['Falta dirección del inmueble', 'No hay partes vinculadas'],
        });
        const result = gateCommand(decision, 'EDITAR_BORRADOR', 'advisory');

        expect(result.warnings.some(w => w.includes('dirección'))).toBe(true);
        expect(result.warnings.some(w => w.includes('partes'))).toBe(true);
    });

    test('incluye warning de ventana 48h abierta', () => {
        const closes = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h from now
        const decision = makeDecision({
            state_macro: 'NOTARIA',
            open_windows: [{
                type: 'ALEGACIONES_48H',
                opens_at: new Date().toISOString(),
                closes_at: closes.toISOString(),
                status: 'OPEN',
                acta_id: 'test-acta',
            }],
        });
        const result = gateCommand(decision, 'VER_ESTADO', 'advisory');

        expect(result.warnings.some(w => w.includes('alegaciones'))).toBe(true);
    });
});
