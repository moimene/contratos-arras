import { test as base } from '@playwright/test';
import type { APIResponse, Page } from '@playwright/test';

const SUPABASE_AUTH_URL = /supabase\.co\/auth\/v1\//;

export type TestContext = {
  mockAuth: (page: Page, overrides?: Partial<{ email: string; id: string }>) => Promise<void>;
};

export const test = base.extend<TestContext>({
  mockAuth: async ({ page }, use) => {
    await use(async (p: Page, overrides = {}) => {
      const email = overrides.email || 'dev@test.chronoflare.com';
      const id = overrides.id || 'dev-user';

      // Intercept Supabase auth endpoints
      await p.route(SUPABASE_AUTH_URL, async (route) => {
        const url = route.request().url();
        if (url.includes('/token')) {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              access_token: 'fake-token',
              token_type: 'bearer',
              expires_in: 3600,
              refresh_token: 'fake-refresh',
              user: { id, email },
            }),
          });
        }

        if (url.includes('/user')) {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ user: { id, email } }),
          });
        }

        // Default OK for other auth endpoints (otp, signout, etc.)
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: { id, email },
            session: null,
          }),
        });
      });

      // Seed localStorage session expected by supabase-js
      await p.addInitScript(({ email: e, id: uid }) => {
        const session = {
          currentSession: {
            access_token: 'fake-token',
            token_type: 'bearer',
            expires_in: 3600,
            refresh_token: 'fake-refresh',
            user: { id: uid, email: e },
          },
          expiresAt: Date.now() + 3600 * 1000,
        };
        localStorage.setItem('sb-session', JSON.stringify(session));
      }, { email, id });
    });
  },
});

export const expect = test.expect;
