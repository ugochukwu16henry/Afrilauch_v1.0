import { defineConfig, devices } from '@playwright/test';

const WEB_BASE_URL = process.env.WEB_BASE_URL || 'http://localhost:3000';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';

/**
 * RiseFlow Hub — E2E tests: backend API, frontend web, mobile viewport.
 * Prerequisites: backend at :4000, frontend at :3000 (or set env vars).
 * Run: npx playwright test
 * Run API only: npx playwright test tests/api
 * Run web only: npx playwright test tests/web
 * Run mobile viewport: npx playwright test tests/web --project="Mobile Chrome"
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Backend API tests (no browser UI; uses request fixture)
    {
      name: 'api',
      testMatch: /tests\/api\/.*\.spec\.ts/,
      use: {
        baseURL: API_BASE_URL,
        extraHTTPHeaders: { 'Content-Type': 'application/json' },
      },
    },
    // Frontend web — Chromium
    {
      name: 'chromium',
      testMatch: /tests\/web\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: WEB_BASE_URL,
      },
    },
    {
      name: 'firefox',
      testMatch: /tests\/web\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Firefox'],
        baseURL: WEB_BASE_URL,
      },
    },
    {
      name: 'webkit',
      testMatch: /tests\/web\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Safari'],
        baseURL: WEB_BASE_URL,
      },
    },
    // Mobile viewport (same web app, responsive)
    {
      name: 'Mobile Chrome',
      testMatch: /tests\/web\/.*\.spec\.ts/,
      use: {
        ...devices['Pixel 5'],
        baseURL: WEB_BASE_URL,
      },
    },
    {
      name: 'Mobile Safari',
      testMatch: /tests\/web\/.*\.spec\.ts/,
      use: {
        ...devices['iPhone 12'],
        baseURL: WEB_BASE_URL,
      },
    },
  ],
  webServer: [
    {
      command: 'cd backend && pnpm run dev',
      url: API_BASE_URL + '/api/v1/health',
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
    },
    {
      command: 'cd frontend && pnpm run dev',
      url: WEB_BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
    },
  ],
});
