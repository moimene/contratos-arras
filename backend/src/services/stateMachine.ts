/**
 * State Machine for Contract Status - Blueprint v1.0
 * 
 * Estado flow (Macro):
 * INICIADO → BORRADOR → EN_FIRMA → FIRMADO → NOTARIA → TERMINADO
 *                                      ↓          ↓
 *                                   LITIGIO ← ────┘
 *                                      ↓
 *                                   TERMINADO
 * 
 * CERRADO es un estado administrativo (puede entrar desde cualquier estado)
 */

import type { EstadoContrato } from '../types/models.js';
import type { EstadoMacro, EstadoMicro, AllowedCommand } from '../domain/ArrasDecision.js';

// ============================================
// TIPOS
// ============================================

type CommandName = AllowedCommand;

// ============================================
// MÁQUINA DE ESTADOS (MACRO)
// ============================================

/**
 * Transiciones válidas entre estados macro (governance)
 */
const STATE_MACHINE_MACRO: Record<EstadoMacro, EstadoMacro[]> = {
    // Alta inicial: puede avanzar a borrador o cerrar
    INICIADO: ['BORRADOR', 'CERRADO'],

    // Términos en negociación: puede avanzar a firma o cerrar
    BORRADOR: ['EN_FIRMA', 'CERRADO'],

    // Pendiente de firmas: puede firmarse, volver a borrador o cerrar
    EN_FIRMA: ['FIRMADO', 'BORRADOR', 'CERRADO'],

    // Firmado: puede ir a notaría, litigio o cerrar
    FIRMADO: ['NOTARIA', 'LITIGIO', 'CERRADO'],

    // En notaría: puede terminar, litigio o cerrar
    NOTARIA: ['TERMINADO', 'LITIGIO', 'CERRADO'],

    // Litigio: solo puede terminar (blocking state)
    LITIGIO: ['TERMINADO'],

    // Terminado: estado final exitoso
    TERMINADO: [],

    // Cerrado: estado final administrativo
    CERRADO: [],
};

// ============================================
// COMANDOS PERMITIDOS POR ESTADO
// ============================================

/**
 * Comandos permitidos en cada estado macro
 */
const COMMANDS_BY_STATE: Record<EstadoMacro, CommandName[]> = {
    INICIADO: [
        'UPSERT_TERMS',
        'UPLOAD_DOCUMENT',
        'CLOSE_CONTRACT',
    ],

    BORRADOR: [
        'UPSERT_TERMS',
        'ACCEPT_TERMS',
        'GENERATE_DRAFT',
        'UPLOAD_DOCUMENT',
        'VALIDATE_DOCUMENT',
        'REJECT_DOCUMENT',
        'DELETE_DOCUMENT',
        'CLOSE_CONTRACT',
    ],

    EN_FIRMA: [
        'REGISTER_SIGNATURE',
        'UPLOAD_DOCUMENT',
        'SEND_COMMUNICATION',
        'CLOSE_CONTRACT',
    ],

    FIRMADO: [
        'SCHEDULE_NOTARY',
        'REGISTER_PAYMENT',
        'UPLOAD_DOCUMENT',
        'SEND_COMMUNICATION',
        'GENERATE_CERTIFICATE',
        'CLOSE_CONTRACT',
    ],

    NOTARIA: [
        'REGISTER_NO_SHOW',
        'SUBMIT_ALLEGATION',
        'SEND_COMMUNICATION',
        'GENERATE_CERTIFICATE',
        'CLOSE_CONTRACT',
    ],

    LITIGIO: [
        // BLOCKING STATE - solo acciones de comunicación y resolución
        'SEND_COMMUNICATION',
        'SUBMIT_ALLEGATION',
        'GENERATE_CERTIFICATE',
        'REGISTER_RESOLUTION',
    ],

    TERMINADO: [
        'GENERATE_CERTIFICATE',
    ],

    CERRADO: [],
};

// ============================================
// COMANDOS BLOQUEADOS EN LITIGIO
// ============================================

/**
 * Comandos prohibidos cuando estado_macro === 'LITIGIO'
 */
const LITIGIO_BLOCKED_COMMANDS: CommandName[] = [
    'UPSERT_TERMS',
    'GENERATE_DRAFT',
    'REGISTER_SIGNATURE',
    'DELETE_DOCUMENT',
    'SCHEDULE_NOTARY',
    'REGISTER_PAYMENT',
];

// ============================================
// FUNCIONES PÚBLICAS
// ============================================

/**
 * Valida si una transición de estado macro es permitida
 */
export function isValidTransition(
    from: EstadoContrato | EstadoMacro,
    to: EstadoContrato | EstadoMacro
): boolean {
    const allowedStates = STATE_MACHINE_MACRO[from as EstadoMacro];
    return allowedStates?.includes(to as EstadoMacro) || false;
}

/**
 * Valida transición y lanza error si no es válida
 */
export function validateTransition(
    from: EstadoContrato | EstadoMacro,
    to: EstadoContrato | EstadoMacro
): void {
    if (!isValidTransition(from, to)) {
        throw new Error(
            `Transición de estado inválida: ${from} → ${to}. Estados permitidos desde ${from}: ${STATE_MACHINE_MACRO[from as EstadoMacro]?.join(', ') || 'ninguno'}`
        );
    }
}

/**
 * Obtiene los próximos estados válidos desde el estado actual
 */
export function getNextValidStates(current: EstadoContrato | EstadoMacro): EstadoMacro[] {
    return STATE_MACHINE_MACRO[current as EstadoMacro] || [];
}

/**
 * Obtiene los comandos permitidos para un estado macro
 */
export function getAllowedCommands(estado: EstadoMacro): CommandName[] {
    return COMMANDS_BY_STATE[estado] || [];
}

/**
 * Verifica si un comando está bloqueado por LITIGIO
 */
export function isCommandBlockedByLitigation(
    estado: EstadoContrato | EstadoMacro,
    command: CommandName
): boolean {
    return estado === 'LITIGIO' && LITIGIO_BLOCKED_COMMANDS.includes(command);
}

/**
 * Verifica si un comando es permitido en el estado actual
 */
export function isCommandAllowed(
    estado: EstadoMacro,
    command: CommandName
): boolean {
    // Si está en LITIGIO, verificar bloqueo específico
    if (isCommandBlockedByLitigation(estado, command)) {
        return false;
    }

    const allowed = COMMANDS_BY_STATE[estado] || [];
    return allowed.includes(command);
}

/**
 * Obtiene lista de comandos bloqueados para un estado
 */
export function getBlockedCommands(estado: EstadoMacro): CommandName[] {
    if (estado === 'LITIGIO') {
        return LITIGIO_BLOCKED_COMMANDS;
    }
    return [];
}

// ============================================
// HELPERS DE ESTADO (compatibilidad)
// ============================================

/**
 * Verifica si un contrato puede generar borrador PDF
 */
export function canGenerateDraft(estado: EstadoContrato | EstadoMacro): boolean {
    return estado === 'BORRADOR';
}

/**
 * Verifica si un contrato puede ser firmado
 */
export function canBeSigned(estado: EstadoContrato | EstadoMacro): boolean {
    return estado === 'EN_FIRMA';
}

/**
 * Verifica si un contrato puede pasar a notaría
 */
export function canGoToNotary(estado: EstadoContrato | EstadoMacro): boolean {
    return estado === 'FIRMADO';
}

/**
 * Verifica si un contrato puede terminar
 */
export function canBeTerminated(estado: EstadoContrato | EstadoMacro): boolean {
    return estado !== 'TERMINADO' && estado !== 'CERRADO';
}

/**
 * Verifica si un contrato puede entrar en litigio
 */
export function canEnterLitigation(estado: EstadoContrato | EstadoMacro): boolean {
    return estado === 'FIRMADO' || estado === 'NOTARIA';
}

/**
 * Verifica si el estado es un blocking state (no permite operaciones normales)
 */
export function isBlockingState(estado: EstadoContrato | EstadoMacro): boolean {
    return estado === 'LITIGIO';
}

/**
 * Verifica si el estado es terminal
 */
export function isTerminalState(estado: EstadoContrato | EstadoMacro): boolean {
    return estado === 'TERMINADO' || estado === 'CERRADO';
}

// ============================================
// TRANSICIÓN (legacy compatibility)
// ============================================

/**
 * Transición de estado con validación (legacy)
 */
export async function transitionState(
    currentState: EstadoContrato,
    newState: EstadoContrato
): Promise<void> {
    validateTransition(currentState, newState);
}

// ============================================
// EXPORT
// ============================================

export { LITIGIO_BLOCKED_COMMANDS };

