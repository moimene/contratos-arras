/**
 * Chrono-Flare Configuration Constants
 * 
 * Constantes centralizadas del sistema para evitar valores mágicos dispersos.
 * Cambiar aquí tiene efecto global.
 */

// ============================================
// VENTANA DE ALEGACIONES (No Comparecencia)
// ============================================

/**
 * Horas de la ventana de alegaciones tras no comparecencia.
 * Tras generar acta, el no compareciente tiene este plazo para:
 * - Alegar (presentar alegaciones)
 * - Someterse (aceptar consecuencias)
 * - Conformarse (acuerdo amigable)
 */
export const ALEGACIONES_WINDOW_HOURS = 48;

/** Milisegundos de la ventana de alegaciones */
export const ALEGACIONES_WINDOW_MS = ALEGACIONES_WINDOW_HOURS * 60 * 60 * 1000;

// ============================================
// QTSP (Qualified Trust Service Provider)
// ============================================

/**
 * Modo del servicio QTSP.
 * - 'stub': Mock local para desarrollo
 * - 'production': Endpoint real del QTSP
 */
export const QTSP_MODE = process.env.QTSP_MODE || 'stub';

/** URL del proveedor QTSP para producción */
export const QTSP_PROVIDER_URL = process.env.QTSP_PROVIDER_URL || 'https://api.eadtrust.eu';

/** Timeout para llamadas al QTSP en ms */
export const QTSP_TIMEOUT_MS = parseInt(process.env.QTSP_TIMEOUT_MS || '10000', 10);

// ============================================
// INVITACIONES
// ============================================

/** Días por defecto para caducidad de invitación */
export const DEFAULT_INVITATION_EXPIRY_DAYS = 7;

/** Días máximos permitidos para caducidad */
export const MAX_INVITATION_EXPIRY_DAYS = 30;

// ============================================
// DOCUMENTOS
// ============================================

/** Tamaño máximo de archivo en bytes (50MB) */
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

/** Extensiones permitidas para documentos */
export const ALLOWED_FILE_EXTENSIONS = [
    'pdf', 'doc', 'docx', 'xls', 'xlsx',
    'jpg', 'jpeg', 'png', 'gif', 'webp',
    'txt', 'rtf', 'odt'
];

// ============================================
// NOTARÍA
// ============================================

/** Días mínimos de antelación para convocatoria notarial */
export const MIN_NOTARY_NOTICE_DAYS = 3;

// ============================================
// COMUNICACIONES
// ============================================

/** Horas para marcar comunicación como "no leída" en dashboard */
export const UNREAD_MESSAGE_THRESHOLD_HOURS = 24;

// ============================================
// SISTEMA
// ============================================

/** Versión del schema de mandate attestation */
export const MANDATE_ATTESTATION_SCHEMA = 'chrono-flare.mandate_attestation.v1';

/** Versión del algoritmo de normalización de texto */
export const TEXT_NORMALIZATION_VERSION = 'cf-textnorm-v1';
