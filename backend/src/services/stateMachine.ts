/**
 * State Machine for Contract Status
 * 
 * Estado flow:
 * INICIADO → BORRADOR → FIRMADO → NOTARIA → TERMINADO
 *                                    ↓
 *                                LITIGIO → TERMINADO
 */

import type { EstadoContrato } from '../types/models.js';

/**
 * Máquina de estados válida
 * Define qué transiciones son permitidas
 */
const STATE_MACHINE: Record<EstadoContrato, EstadoContrato[]> = {
    // Alta inicial: puede avanzar a borrador o cerrar
    INICIADO: ['BORRADOR', 'TERMINADO'],

    // Términos aceptados: puede firmarse o cerrar
    BORRADOR: ['FIRMADO', 'TERMINADO'],

    // Firmado: puede ir a notaría, litigio o terminar
    FIRMADO: ['NOTARIA', 'LITIGIO', 'TERMINADO'],

    // En notaría: puede terminar o entrar en litigio
    NOTARIA: ['TERMINADO', 'LITIGIO'],

    // Litigio: puede terminar cuando se resuelva
    LITIGIO: ['TERMINADO'],

    // Terminado: estado final
    TERMINADO: [],
};

/**
 * Valida si una transición de estado es permitida
 */
export function isValidTransition(
    from: EstadoContrato,
    to: EstadoContrato
): boolean {
    const allowedStates = STATE_MACHINE[from];
    return allowedStates?.includes(to) || false;
}

/**
 * Valida transición y lanza error si no es válida
 */
export function validateTransition(
    from: EstadoContrato,
    to: EstadoContrato
): void {
    if (!isValidTransition(from, to)) {
        throw new Error(
            `Transición de estado inválida: ${from} → ${to}. Estados permitidos desde ${from}: ${STATE_MACHINE[from]?.join(', ') || 'ninguno'}`
        );
    }
}

/**
 * Obtiene los próximos estados válidos desde el estado actual
 */
export function getNextValidStates(current: EstadoContrato): EstadoContrato[] {
    return STATE_MACHINE[current] || [];
}

/**
 * Verifica si un contrato puede generar borrador PDF
 * (cuando está en INICIADO y se aceptan los términos)
 */
export function canGenerateDraft(estado: EstadoContrato): boolean {
    return estado === 'INICIADO';
}

/**
 * Verifica si un contrato puede ser firmado
 */
export function canBeSigned(estado: EstadoContrato): boolean {
    return estado === 'BORRADOR';
}

/**
 * Verifica si un contrato puede pasar a notaría
 */
export function canGoToNotary(estado: EstadoContrato): boolean {
    return estado === 'FIRMADO';
}

/**
 * Verifica si un contrato puede terminar
 */
export function canBeTerminated(estado: EstadoContrato): boolean {
    return estado !== 'TERMINADO';
}

/**
 * Verifica si un contrato puede entrar en litigio
 */
export function canEnterLitigation(estado: EstadoContrato): boolean {
    return estado === 'FIRMADO' || estado === 'NOTARIA';
}

/**
 * Transición de estado con validación
 */
export async function transitionState(
    currentState: EstadoContrato,
    newState: EstadoContrato
): Promise<void> {
    validateTransition(currentState, newState);
}
