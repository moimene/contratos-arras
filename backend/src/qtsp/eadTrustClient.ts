/**
 * Cliente stub para QTSP EAD Trust / GoCertius
 * En desarrollo: simula emisión de sellos de tiempo
 * En producción: sustituir por cliente RFC 3161 real
 */

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

    if (mode === 'stub') {
        return await stubTimestamp(hashSha256);
    } else {
        // TODO: Implementar integración real con EAD Trust / GoCertius
        // return await productionTimestamp(hashSha256);
        throw new Error('Modo QTSP de producción no implementado aún');
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
 * Integración de producción con EAD Trust
 * Ejemplo de implementación con cliente RFC 3161
 */
/*
async function productionTimestamp(hashSha256: string): Promise<QTSPResponse> {
  // Importar cliente RFC 3161 (ej: node-rfc3161, node-forge)
  // const tsaClient = new TsaClient({
  //   tsaUrl: process.env.EAD_TRUST_TSA_URL,
  //   hashAlgorithm: 'sha256',
  //   certificatePath: './certs/ead-trust-ca.pem',
  // });

  // const tstResponse = await tsaClient.timestamp(hashSha256);

  // return {
  //   proveedor: 'EAD_TRUST',
  //   marca: 'GoCertius',
  //   fechaSello: tstResponse.genTime,
  //   rfc3161TstBase64: tstResponse.token.toString('base64'),
  //   metadata: {
  //     mode: 'PRODUCTION',
  //     serialNumber: tstResponse.serialNumber,
  //     tslUrl: 'https://sede.tsldl.gob.es/tsl-servicio-web/',
  //   },
  // };
}
*/
