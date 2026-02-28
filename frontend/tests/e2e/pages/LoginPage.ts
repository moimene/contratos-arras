import { Page, expect } from '@playwright/test';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async loginWithMagicLink(email = 'dev@test.chronoflare.com') {
    await this.page.getByTestId('email-input').fill(email);
    await this.page.getByTestId('magic-link-submit').click();
    await expect(this.page.getByTestId('magic-link-success')).toBeVisible();
  }
}
