/**
 * Estados válidos del contrato
 */
export type EstadoContrato =
    | 'BORRADOR'
    | 'EN_NEGOCIACION'
    | 'TERMINOS_ESENCIALES_ACEPTADOS'
    | 'BORRADOR_GENERADO'
    | 'FIRMADO'
    | 'CERRADO';

/**
 * Máquina de estados válida
 * Define qué transiciones son permitidas
 */
const STATE_MACHINE: Record<EstadoContrato, EstadoContrato[]> = {
    BORRADOR: ['EN_NEGOCIACION', 'TERMINOS_ESENCIALES_ACEPTADOS', 'CERRADO'],
    EN_NEGOCIACION: ['TERMINOS_ESENCIALES_ACEPTADOS', 'CERRADO'],
    TERMINOS_ESENCIALES_ACEPTADOS: [
        'EN_NEGOCIACION',
        'BORRADOR_GENERADO',
        'CERRADO',
    ],
    BORRADOR_GENERADO: ['EN_NEGOCIACION', 'FIRMADO', 'CERRADO'],
    FIRMADO: ['CERRADO'],
    CERRADO: [],
};

/**
 * Valida si una transición de estado es permitida
 */
export function isValidTransition(
    from: EstadoContrato,
    to: EstadoContrato
): boolean {
    const allowedStates = STATE_MACHINE[from];
    return allowedStates.includes(to);
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
            `Transición de estado inválida: ${from} → ${to}. Estados permitidos desde ${from}: ${STATE_MACHINE[from].join(', ')}`
        );
    }
}

/**
 * Obtiene los próximos estados válidos desde el estado actual
 */
export function getNextValidStates(current: EstadoContrato): EstadoContrato[] {
    return STATE_MACHINE[current];
}

/**
 * Verifica si un contrato puede generar borrador PDF
 */
export function canGenerateDraft(estado: EstadoContrato): boolean {
    return estado === 'TERMINOS_ESENCIALES_ACEPTADOS';
}

/**
 * Verifica si un contrato puede ser firmado
 */
export function canBeSigned(estado: EstadoContrato): boolean {
    return estado === 'BORRADOR_GENERADO';
}

/**
 * Verifica si un contrato puede ser cerrado
 */
export function canBeClosed(estado: EstadoContrato): boolean {
    return estado !== 'CERRADO';
}
