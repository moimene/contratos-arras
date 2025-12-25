/**
 * Cliente QTSP que integra con Digital Trust (Legal App Factory)
 */
import { createTimestampEvidence } from './digitalTrustClient.js';

export interface QTSPResponse {
    proveedor: 'EAD_TRUST';
    marca: 'GoCertius';
    fechaSello: string;
    rfc3161TstBase64: string;
    metadata: {
        mode: 'DEMO' | 'PRODUCTION';
        [key: string]: any;
    };
}

/**
 * Solicita un sello de tiempo cualificado sobre un hash SHA-256
 * @param hashSha256 - Hash del documento a sellar
 * @returns Respuesta con el token TST y metadata
 */
export async function requestQualifiedTimestamp(
    hashSha256: string
): Promise<QTSPResponse> {
    const mode = process.env.QTSP_MODE || 'stub';

    // Check if we have credentials to run in production mode
    const hasCredentials = process.env.QTSP_CLIENT_ID && process.env.QTSP_CLIENT_SECRET;

    if (mode === 'production' || hasCredentials) {
         try {
             return await productionTimestamp(hashSha256);
         } catch (error) {
             console.error("QTSP Production Error:", error);
             // If credentials fail or are invalid, fallback to stub ONLY if not explicitly forced to production
             if (mode === 'production') throw error;
             return await stubTimestamp(hashSha256);
         }
    } else {
        return await stubTimestamp(hashSha256);
    }
}

/**
 * Stub de desarrollo: simula TST
 */
async function stubTimestamp(hashSha256: string): Promise<QTSPResponse> {
    const fechaSello = new Date().toISOString();

    // Simulación: token TST como JSON codificado en base64
    const mockToken = {
        hashSha256,
        fechaSello,
        issuer: 'EAD_TRUST_DEMO',
        serialNumber: Date.now().toString(16),
    };

    const rfc3161TstBase64 = Buffer.from(
        JSON.stringify(mockToken),
        'utf8'
    ).toString('base64');

    return {
        proveedor: 'EAD_TRUST',
        marca: 'GoCertius',
        fechaSello,
        rfc3161TstBase64,
        metadata: {
            mode: 'DEMO',
            note: 'Este es un sello de tiempo simulado. En producción, usar cliente RFC 3161 real.',
        },
    };
}

/**
 * Integración de producción con Digital Trust
 */
async function productionTimestamp(hashSha256: string): Promise<QTSPResponse> {
  const result = await createTimestampEvidence(hashSha256);

  return {
    proveedor: 'EAD_TRUST',
    marca: 'GoCertius',
    fechaSello: result.timestamp,
    rfc3161TstBase64: result.token,
    metadata: {
      mode: 'PRODUCTION',
      serialNumber: '', // Not explicitly returned in simple view
      tslUrl: 'https://sede.tsldl.gob.es/tsl-servicio-web/',
    },
  };
}
