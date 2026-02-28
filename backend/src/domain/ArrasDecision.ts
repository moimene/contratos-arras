/**
 * ArrasDecision - Decision Object
 * 
 * Blueprint v1.0 - Output del kernel normativo
 * 
 * Reemplaza lógica dispersa entre estado.ts, transitionService.ts y actaService.ts
 * con un "decision object" único que gobierna la UI y los permisos.
 */

// ============================================
// TIPOS DE ESTADO
// ============================================

/**
 * Estado Macro - Controla permisos y freezing (governance)
 */
export type EstadoMacro =
    | 'INICIADO'    // Alta inicial
    | 'BORRADOR'    // Términos en negociación
    | 'EN_FIRMA'    // Pendiente de firmas
    | 'FIRMADO'     // Documento firmado
    | 'NOTARIA'     // En proceso notarial
    | 'TERMINADO'   // Completado exitosamente
    | 'LITIGIO'     // En disputa (blocking)
    | 'CERRADO';    // Cerrado administrativamente

/**
 * Estado Micro - Detalle operativo para UI
 */
export type EstadoMicro =
    | 'BORRADOR'
    | 'EN_NEGOCIACION'
    | 'TERMINOS_ESENCIALES_ACEPTADOS'
    | 'BORRADOR_GENERADO'
    | 'PENDIENTE_FIRMAS'
    | 'PARCIALMENTE_FIRMADO'
    | 'FIRMADO'
    | 'ARRAS_PENDIENTES'
    | 'ARRAS_ACREDITADAS'
    | 'CONVOCATORIA_ENVIADA'
    | 'CITA_CONFIRMADA'
    | 'NO_COMPARECENCIA'
    | 'ACTA_NO_COMPARECENCIA'
    | 'ALEGACIONES_PENDIENTES'
    | 'ESCRITURA_OTORGADA'
    | 'RESUELTO_INCUMPLIMIENTO'
    | 'CERRADO';

// ============================================
// VENTANAS TEMPORALES
// ============================================

export type WindowType = 'ALEGACIONES_48H';
export type WindowStatus = 'OPEN' | 'CLOSED_EXPIRED' | 'CLOSED_RESPONSE';

export interface OpenWindow {
    type: WindowType;
    opens_at: string;  // ISO UTC (sellado)
    closes_at: string; // ISO UTC
    status: WindowStatus;
    acta_id?: string;
}

// ============================================
// COMANDOS Y EVIDENCIA
// ============================================

/**
 * Comandos que puede ejecutar un usuario según estado/rol
 */
export type AllowedCommand =
    | 'UPSERT_TERMS'
    | 'GENERATE_DRAFT'
    | 'ACCEPT_TERMS'
    | 'REGISTER_SIGNATURE'
    | 'UPLOAD_DOCUMENT'
    | 'VALIDATE_DOCUMENT'
    | 'REJECT_DOCUMENT'
    | 'DELETE_DOCUMENT'
    | 'SCHEDULE_NOTARY'
    | 'SEND_COMMUNICATION'
    | 'REGISTER_PAYMENT'
    | 'GENERATE_CERTIFICATE'
    | 'REGISTER_NO_SHOW'
    | 'SUBMIT_ALLEGATION'
    | 'REGISTER_RESOLUTION'
    | 'CLOSE_CONTRACT';

/**
 * Evidencia requerida para avanzar
 */
export interface RequiredEvidence {
    tipo: string;
    descripcion: string;
    responsable_rol: string;
    estado: 'PENDIENTE' | 'SUBIDO' | 'VALIDADO' | 'RECHAZADO';
}

// ============================================
// DECISION OBJECT PRINCIPAL
// ============================================

export interface ArrasDecision {
    // ──────────────────────────────────────────
    // ESTADO
    // ──────────────────────────────────────────
    state_macro: EstadoMacro;
    state_micro?: EstadoMicro;

    // ──────────────────────────────────────────
    // BLOQUEOS
    // ──────────────────────────────────────────
    /** Razones por las que no puede avanzar */
    blockers: string[];

    /** Si está en LITIGIO, lista de comandos bloqueados */
    litigation_blocked_commands: AllowedCommand[];

    // ──────────────────────────────────────────
    // PERMISOS
    // ──────────────────────────────────────────
    /** Comandos permitidos en estado actual (sin considerar rol) */
    allowed_commands: AllowedCommand[];

    /** Evidencia requerida para siguiente transición */
    required_evidence: RequiredEvidence[];

    // ──────────────────────────────────────────
    // VENTANAS TEMPORALES
    // ──────────────────────────────────────────
    open_windows: OpenWindow[];

    // ──────────────────────────────────────────
    // RESULTADO NORMATIVO (Catala output)
    // ──────────────────────────────────────────
    normative?: {
        /** Consecuencia calculada (ej: DEVOLUCION_DOBLE) */
        consecuencia: string;
        /** Fundamento legal (ej: art. 1454 CC) */
        fundamento: string;
        /** Importe de penalización calculado */
        importe_penalizacion?: number;
    };

    // ──────────────────────────────────────────
    // METADATA
    // ──────────────────────────────────────────
    computed_at: string; // ISO UTC
    version_hash_evaluated: string;
}

// ============================================
// COMANDOS BLOQUEADOS EN LITIGIO
// ============================================

/**
 * Comandos prohibidos cuando estado_macro === 'LITIGIO'
 */
export const LITIGIO_BLOCKED_COMMANDS: AllowedCommand[] = [
    'UPSERT_TERMS',
    'GENERATE_DRAFT',
    'REGISTER_SIGNATURE',
    'DELETE_DOCUMENT',
    'SCHEDULE_NOTARY',
];

/**
 * Comandos permitidos en LITIGIO
 */
export const LITIGIO_ALLOWED_COMMANDS: AllowedCommand[] = [
    'SEND_COMMUNICATION',
    'SUBMIT_ALLEGATION',
    'GENERATE_CERTIFICATE',
    'REGISTER_RESOLUTION',
];

// ============================================
// FACTORY FUNCTION
// ============================================

/**
 * Crea un ArrasDecision vacío/inicial
 */
export function createInitialDecision(
    state_macro: EstadoMacro,
    version_hash: string
): ArrasDecision {
    return {
        state_macro,
        state_micro: undefined,
        blockers: [],
        litigation_blocked_commands: state_macro === 'LITIGIO'
            ? LITIGIO_BLOCKED_COMMANDS
            : [],
        allowed_commands: state_macro === 'LITIGIO'
            ? LITIGIO_ALLOWED_COMMANDS
            : [],
        required_evidence: [],
        open_windows: [],
        normative: undefined,
        computed_at: new Date().toISOString(),
        version_hash_evaluated: version_hash,
    };
}
