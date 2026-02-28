import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.VITE_PORT || 5173;
const API_PORT = process.env.PORT || 4000;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  expect: {
    timeout: 8_000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [ ['list'], ['html', { outputFolder: 'playwright-report' }], ['junit', { outputFile: 'playwright-report/results.xml' }] ],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: process.env.CI ? 'retain-on-failure' : 'on-first-retry',
    extraHTTPHeaders: {
      // Simulate dev user header when backend runs in DEV_MODE
      'x-user-id': process.env.PW_USER_ID || 'dev-user',
    },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: [
    {
      // Frontend Vite dev server
      command: 'npm run dev',
      cwd: './',
      env: {
        VITE_API_URL: `http://localhost:${API_PORT}`,
        VITE_SUPABASE_ANON_KEY: 'test-anon-key',
        VITE_SUPABASE_URL: 'https://dummy.supabase.co',
        VITE_PORT: String(PORT),
      },
      url: `http://localhost:${PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
