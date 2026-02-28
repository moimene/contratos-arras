import { APIRequestContext } from '@playwright/test';

const API_URL = process.env.VITE_API_URL || 'http://localhost:4000';

export async function seedContrato(request: APIRequestContext) {
  const res = await request.post(`${API_URL}/api/contratos`, {
    data: {
      inmueble: {
        direccion_completa: 'Calle Mayor 123, Madrid',
        ciudad: 'Madrid',
        provincia: 'Madrid',
        codigo_postal: '28001',
      },
      contrato: {
        tipo_arras: 'PENITENCIALES',
        precio_total: 250000,
        importe_arras: 25000,
        moneda: 'EUR',
        fecha_limite_firma_escritura: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        forma_pago_arras: 'AL_FIRMAR',
        gastos_quien: 'LEY',
        via_resolucion: 'JUZGADOS',
        firma_preferida: 'ELECTRONICA',
      },
    },
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'dev-user',
    },
  });

  if (!res.ok()) {
    throw new Error(`Seed contrato failed: ${res.status()} ${await res.text()}`);
  }

  return res.json();
}
