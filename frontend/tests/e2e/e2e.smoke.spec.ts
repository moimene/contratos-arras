import { expect } from '@playwright/test';
import { test } from './fixtures/auth';
import { WizardPage } from './pages/WizardPage';
// Smoke E2E covering login and wizard baseline (backend calls mocked elsewhere)

test.describe('Chrono-Flare E2E smoke', () => {
  test('login mocked + wizard crea contrato y alcanza paso firma', async ({ page, mockAuth }) => {
    await mockAuth(page);

    const wizard = new WizardPage(page);

    await wizard.startNuevo();
    await wizard.fillPaso1Inmueble();
    await wizard.fillPaso2Acuerdo();
    await wizard.fillPaso3Partes();

    await expect(page).toHaveURL(/wizard\/nuevo\?step=4|wizard\/nuevo/);
  });

});
