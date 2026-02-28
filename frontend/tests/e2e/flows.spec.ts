import { expect } from '@playwright/test';
import { test } from './fixtures/auth';

const CONTRACT_ID = 'test-123';

function buildContract(state: string) {
  return {
    success: true,
    data: {
      id: CONTRACT_ID,
      numero_expediente: 'EXP-001',
      estado: state,
      fecha_limite_firma_escritura: new Date(Date.now() + 20 * 24 * 3600 * 1000).toISOString(),
      inmueble: { direccion_completa: 'Calle Falsa 123', ciudad: 'Madrid', provincia: 'Madrid' },
      partes: [
        {
          parte_id: 'p1', rol_en_contrato: 'COMPRADOR', tipo_parte: 'COMPRADOR', parte: {
            nombre: 'María', apellidos: 'González', tipo_documento: 'DNI', numero_documento: '12345678A', email: 'maria@example.com'
          }, obligado_aceptar: true, obligado_firmar: true
        },
        {
          parte_id: 'p2', rol_en_contrato: 'VENDEDOR', tipo_parte: 'VENDEDOR', parte: {
            nombre: 'Juan', apellidos: 'Pérez', tipo_documento: 'DNI', numero_documento: '87654321B', email: 'juan@example.com'
          }, obligado_aceptar: true, obligado_firmar: true
        }
      ],
      docs_count: { pendientes: 1, subidos: 1, validados: 0, rechazados: 0 },
      datos_wizard: { acuerdo: true, aceptado: true },
    }
  };
}

const documentosResponse = {
  success: true,
  data: [
    {
      inventarioId: 'inv-1',
      tipo: 'NOTA_SIMPLE',
      titulo: 'Nota simple',
      descripcion: 'Propiedad',
      grupo: 'INMUEBLE',
      subtipo: null,
      responsableRol: 'VENDEDOR',
      estado: 'PENDIENTE',
      obligatorio: true,
      esCritico: true,
      archivo: null,
      subidoPor: null,
      validadoPor: null,
    },
  ],
  resumen: { total: 1, pendientes: 1, subidos: 0, validados: 0, rechazados: 0 },
};

const comunicacionesResponse = {
  success: true,
  data: [{
    id: 'c1',
    contrato_id: CONTRACT_ID,
    tipo_comunicacion: 'RECLAMACION',
    tipo_funcion: null,
    canal: 'PLATAFORMA',
    remitente_rol: 'COMPRADOR',
    remitente_externo: null,
    destinatarios_roles: ['VENDEDOR'],
    destinatarios_externos: null,
    asunto: 'Pago arras',
    contenido: 'Recordatorio de pago de arras',
    resumen_externo: null,
    fecha_comunicacion: new Date().toISOString(),
    fecha_registro: new Date().toISOString(),
    estado: 'ENVIADA',
    es_externa: false,
    adjuntos_archivo_ids: [],
    hash_contenido: null,
    sello_qtsp_id: null,
  }],
};

const timelineResponse = { success: true, data: [] };

const inventarioNotariaResponse = { success: true, data: [] };

function installApiMocks(page, state: string) {
  let firmas = [
    { parteId: 'p1', firmado: false, tipo_parte: 'COMPRADOR', nombre: 'María', apellidos: 'González', tipo_documento: 'DNI', numero_documento: '12345678A' },
    { parteId: 'p2', firmado: false, tipo_parte: 'VENDEDOR', nombre: 'Juan', apellidos: 'Pérez', tipo_documento: 'DNI', numero_documento: '87654321B' },
  ];

  page.route('**/api/**', async (route) => {
    const url = route.request().url();

    if (url.endsWith(`/api/contracts/${CONTRACT_ID}`)) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(buildContract(state)) });
    }

    if (url.endsWith(`/api/contracts/${CONTRACT_ID}/firmas`)) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { todasFirmasCompletas: firmas.every(f => f.firmado), detalles: firmas } }) });
    }

    if (url.endsWith(`/api/contracts/${CONTRACT_ID}/firmar`)) {
      const body = await route.request().postDataJSON();
      firmas = firmas.map(f => f.parteId === body.parteId ? { ...f, firmado: true } : f);
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    }

    if (url.includes('/documentos')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(documentosResponse) });
    }

    if (url.includes('/comunicaciones')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(comunicacionesResponse) });
    }

    if (url.includes('/eventos')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(timelineResponse) });
    }

    if (url.includes('/notaria')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(inventarioNotariaResponse) });
    }

    // Default stub
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) });
  });
}

// ----------------------------------------------------
// Tests
// ----------------------------------------------------

test.describe('Flujos clave dashboard', () => {
  test('firma electrónica interna permite marcar firma', async ({ page, mockAuth }) => {
    await mockAuth(page);
    installApiMocks(page, 'EN_FIRMA');

    await page.goto(`/dashboard/contrato/${CONTRACT_ID}?rol=COMPRADOR`);

    await expect(page.getByRole('heading', { name: 'Firma Electrónica' })).toBeVisible({ timeout: 15000 });

    await page.getByTestId('aceptar-terminos-p1').check();
    await page.getByTestId('firmar-p1').click();

    await expect(page.getByText('Firmado')).toBeVisible();
  });

  test('documentos + notaría + comunicaciones se renderizan en dashboard post-firma', async ({ page, mockAuth }) => {
    await mockAuth(page);
    installApiMocks(page, 'FIRMADO');

    await page.goto(`/dashboard/contrato/${CONTRACT_ID}?rol=COMPRADOR`);

    const docsToggle = page.getByRole('button', { name: /Documentos/ }).first();
    await docsToggle.click();
    await expect(page.getByRole('heading', { name: 'Documentos' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Nota simple')).toBeVisible({ timeout: 15000 });

    const notariaToggle = page.getByRole('button', { name: /Notaría/ }).first();
    await expect(notariaToggle).toBeVisible();

    const commToggle = page.getByRole('button', { name: /Comunicaciones/ }).first();
    await commToggle.click();
    await expect(page.getByRole('heading', { name: 'Comunicaciones' })).toBeVisible();
    await expect(page.getByText(/Reclamación/i)).toHaveCount(1);
  });
});
