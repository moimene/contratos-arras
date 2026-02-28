import { Page, expect } from '@playwright/test';

export class WizardPage {
  constructor(private readonly page: Page) {}

  async startNuevo() {
    await this.page.goto('/wizard/nuevo');
    await expect(this.page).toHaveURL(/wizard\/nuevo/);
  }

  async fillPaso1Inmueble() {
    await this.page.getByTestId('inmueble-direccion').fill('Calle Mayor 123, 4ºA');
    await this.page.getByTestId('inmueble-cp').fill('28001');
    await this.page.getByTestId('inmueble-ciudad').fill('Madrid');
    await this.page.getByTestId('inmueble-provincia').fill('Madrid');
    await this.page.getByTestId('step1-submit').click();
  }

  async fillPaso2Acuerdo() {
    await this.page.getByTestId('acuerdo-precio').fill('250000');
    await this.page.getByTestId('acuerdo-arras').fill('25000');
    await this.page.getByTestId('acuerdo-fecha-escritura').fill(new Date(Date.now() + 30*24*3600*1000).toISOString().slice(0,10));
    await this.page.getByTestId('step2-submit').click();
  }

  async fillPaso3Partes() {
    await this.page.getByTestId('add-comprador').click();
    await this.page.getByTestId('comprador-nombre').fill('María');
    await this.page.getByTestId('comprador-apellidos').fill('González');
    await this.page.getByTestId('comprador-documento').fill('12345678A');
    await this.page.getByTestId('comprador-email').fill('maria@example.com');
    await this.page.getByTestId('submit-comprador').click();

    await this.page.getByTestId('add-vendedor').click();
    await this.page.getByTestId('vendedor-nombre').fill('Juan');
    await this.page.getByTestId('vendedor-apellidos').fill('Pérez');
    await this.page.getByTestId('vendedor-documento').fill('87654321B');
    await this.page.getByTestId('vendedor-email').fill('juan@example.com');
    await this.page.getByTestId('submit-vendedor').click();

    await this.page.getByTestId('step3-submit').click();
  }
}
