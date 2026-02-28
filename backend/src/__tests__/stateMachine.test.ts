/**
 * State Machine & LITIGIO Blocking Tests
 * 
 * Blueprint v1.0 - Verificar transiciones y bloqueos
 */

import { describe, expect, test } from '@jest/globals';
import {
    isValidTransition,
    getAllowedCommands,
    getBlockedCommands,
    isCommandBlockedByLitigation,
    isCommandAllowed,
    getNextValidStates,
    canGenerateDraft,
    canBeSigned,
    canGoToNotary,
    canBeTerminated,
    canEnterLitigation,
    isBlockingState,
    isTerminalState,
} from '../services/stateMachine.js';

// ============================================
// STATE TRANSITIONS
// ============================================

describe('State Machine - Transitions', () => {
    test('INICIADO puede ir a BORRADOR', () => {
        expect(isValidTransition('INICIADO', 'BORRADOR')).toBe(true);
    });

    test('INICIADO NO puede ir directamente a FIRMADO', () => {
        expect(isValidTransition('INICIADO', 'FIRMADO')).toBe(false);
    });

    test('BORRADOR puede ir a EN_FIRMA', () => {
        expect(isValidTransition('BORRADOR', 'EN_FIRMA')).toBe(true);
    });

    test('EN_FIRMA puede ir a FIRMADO', () => {
        expect(isValidTransition('EN_FIRMA', 'FIRMADO')).toBe(true);
    });

    test('FIRMADO puede ir a NOTARIA o LITIGIO', () => {
        expect(isValidTransition('FIRMADO', 'NOTARIA')).toBe(true);
        expect(isValidTransition('FIRMADO', 'LITIGIO')).toBe(true);
    });

    test('TERMINADO no puede ir a ningún estado', () => {
        expect(getNextValidStates('TERMINADO')).toHaveLength(0);
    });

    test('CERRADO no puede ir a ningún estado', () => {
        expect(getNextValidStates('CERRADO')).toHaveLength(0);
    });

    test('LITIGIO solo puede ir a TERMINADO', () => {
        const next = getNextValidStates('LITIGIO');
        expect(next).toEqual(['TERMINADO']);
    });
});

// ============================================
// LITIGIO BLOCKING
// ============================================

describe('LITIGIO Blocking Rules', () => {
    test('LITIGIO es un estado bloqueante', () => {
        expect(isBlockingState('LITIGIO')).toBe(true);
    });

    test('FIRMADO no es un estado bloqueante', () => {
        expect(isBlockingState('FIRMADO')).toBe(false);
    });

    test('TERMINADO es un estado terminal', () => {
        expect(isTerminalState('TERMINADO')).toBe(true);
    });

    test('CERRADO es un estado terminal', () => {
        expect(isTerminalState('CERRADO')).toBe(true);
    });

    test('BORRADOR no es terminal', () => {
        expect(isTerminalState('BORRADOR')).toBe(false);
    });

    test('GENERATE_DRAFT está bloqueado en LITIGIO', () => {
        expect(isCommandBlockedByLitigation('LITIGIO', 'GENERATE_DRAFT')).toBe(true);
    });

    test('REGISTER_SIGNATURE está bloqueado en LITIGIO', () => {
        expect(isCommandBlockedByLitigation('LITIGIO', 'REGISTER_SIGNATURE')).toBe(true);
    });

    test('SEND_COMMUNICATION no está bloqueado en LITIGIO', () => {
        expect(isCommandBlockedByLitigation('LITIGIO', 'SEND_COMMUNICATION')).toBe(false);
    });

    test('REGISTER_RESOLUTION no está bloqueado en LITIGIO', () => {
        expect(isCommandBlockedByLitigation('LITIGIO', 'REGISTER_RESOLUTION')).toBe(false);
    });

    test('getBlockedCommands en LITIGIO devuelve comandos bloqueados', () => {
        const blocked = getBlockedCommands('LITIGIO');
        expect(blocked.length).toBeGreaterThan(0);
        expect(blocked).toContain('GENERATE_DRAFT');
        expect(blocked).toContain('REGISTER_SIGNATURE');
    });

    test('getBlockedCommands en BORRADOR devuelve vacío (no blocking)', () => {
        const blocked = getBlockedCommands('BORRADOR');
        expect(blocked).toHaveLength(0);
    });
});

// ============================================
// COMMAND PERMISSIONS BY STATE
// ============================================

describe('Command Permissions', () => {
    test('INICIADO permite UPSERT_TERMS', () => {
        const commands = getAllowedCommands('INICIADO');
        expect(commands).toContain('UPSERT_TERMS');
    });

    test('BORRADOR permite EDITAR_BORRADOR y GENERAR_BORRADOR', () => {
        const commands = getAllowedCommands('BORRADOR');
        expect(commands).toContain('UPSERT_TERMS');
        expect(commands).toContain('GENERATE_DRAFT');
    });

    test('EN_FIRMA permite REGISTER_SIGNATURE', () => {
        const commands = getAllowedCommands('EN_FIRMA');
        expect(commands).toContain('REGISTER_SIGNATURE');
    });

    test('LITIGIO solo permite comunicaciones y resoluciones', () => {
        const commands = getAllowedCommands('LITIGIO');
        expect(commands).toContain('SEND_COMMUNICATION');
        expect(commands).toContain('SUBMIT_ALLEGATION');
        // No debería permitir operaciones bloqueadas
        expect(commands).not.toContain('GENERATE_DRAFT');
        expect(commands).not.toContain('REGISTER_SIGNATURE');
    });

    test('isCommandAllowed verifica correctamente en BORRADOR', () => {
        expect(isCommandAllowed('BORRADOR', 'UPSERT_TERMS')).toBe(true);
        expect(isCommandAllowed('BORRADOR', 'REGISTER_SIGNATURE')).toBe(false);
    });

    test('isCommandAllowed bloquea todo en TERMINADO', () => {
        // TERMINADO solo debería permitir generar certificado
        const commands = getAllowedCommands('TERMINADO');
        expect(commands).toEqual(['GENERATE_CERTIFICATE']);
    });
});

// ============================================
// COMPATIBILITY HELPERS
// ============================================

describe('Compatibility Helpers', () => {
    test('canGenerateDraft solo en BORRADOR', () => {
        expect(canGenerateDraft('BORRADOR')).toBe(true);
        expect(canGenerateDraft('FIRMADO')).toBe(false);
        expect(canGenerateDraft('LITIGIO')).toBe(false);
    });

    test('canBeSigned solo en EN_FIRMA', () => {
        expect(canBeSigned('EN_FIRMA')).toBe(true);
        expect(canBeSigned('BORRADOR')).toBe(false);
        expect(canBeSigned('LITIGIO')).toBe(false);
    });

    test('canGoToNotary solo en FIRMADO', () => {
        expect(canGoToNotary('FIRMADO')).toBe(true);
        expect(canGoToNotary('BORRADOR')).toBe(false);
    });

    test('canEnterLitigation solo en FIRMADO o NOTARIA', () => {
        expect(canEnterLitigation('FIRMADO')).toBe(true);
        expect(canEnterLitigation('NOTARIA')).toBe(true);
        expect(canEnterLitigation('BORRADOR')).toBe(false);
        expect(canEnterLitigation('LITIGIO')).toBe(false);
    });

    test('canBeTerminated en estados no terminales', () => {
        expect(canBeTerminated('FIRMADO')).toBe(true);
        expect(canBeTerminated('TERMINADO')).toBe(false);
        expect(canBeTerminated('CERRADO')).toBe(false);
    });
});
