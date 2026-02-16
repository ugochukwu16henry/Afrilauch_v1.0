import { defineConfig, devices } from '@playwright/test';

/**
 * RiseFlow Hub — Playwright E2E config
 * Prerequisites: backend running at http://localhost:4000, DB seeded (pnpm run db:seed in backend)
 * Run: pnpm exec playwright test (from frontend/)
 *
 * Auth: setup project logs in as super_admin once and saves storage state; admin-* projects reuse it.
 * CI: runs only Chromium (faster) so Railway "Wait for CI" deploys complete in ~10–15 min.
 */
const isCI = !!process.env.CI;

const allProjects = [
  { name: 'setup', testMatch: /auth\.setup\.ts/, teardown: undefined },
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
    testIgnore: [/admin-dashboard\.spec\.ts/, /auth\.setup\.ts/],
    dependencies: ['setup'],
  },
  {
    name: 'firefox',
    use: { ...devices['Desktop Firefox'] },
    testIgnore: [/admin-dashboard\.spec\.ts/, /auth\.setup\.ts/],
    dependencies: ['setup'],
  },
  {
    name: 'webkit',
    use: { ...devices['Desktop Safari'] },
    testIgnore: [/admin-dashboard\.spec\.ts/, /auth\.setup\.ts/],
    dependencies: ['setup'],
  },
  {
    name: 'admin-chromium',
    use: {
      ...devices['Desktop Chrome'],
      storageState: 'playwright/.auth/superadmin.json',
    },
    testMatch: [/admin-dashboard\.spec\.ts/],
    dependencies: ['setup'],
  },
  {
    name: 'admin-firefox',
    use: {
      ...devices['Desktop Firefox'],
      storageState: 'playwright/.auth/superadmin.json',
    },
    testMatch: [/admin-dashboard\.spec\.ts/],
    dependencies: ['setup'],
  },
  {
    name: 'admin-webkit',
    use: {
      ...devices['Desktop Safari'],
      storageState: 'playwright/.auth/superadmin.json',
    },
    testMatch: [/admin-dashboard\.spec\.ts/],
    dependencies: ['setup'],
  },
];

/** CI: only Chromium + admin-chromium for faster passes (~10–15 min instead of 30–45 min). */
const ciProjects = [
  { name: 'setup', testMatch: /auth\.setup\.ts/, teardown: undefined },
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
    testIgnore: [/admin-dashboard\.spec\.ts/, /auth\.setup\.ts/],
    dependencies: ['setup'],
  },
  {
    name: 'admin-chromium',
    use: {
      ...devices['Desktop Chrome'],
      storageState: 'playwright/.auth/superadmin.json',
    },
    testMatch: [/admin-dashboard\.spec\.ts/],
    dependencies: ['setup'],
  },
];

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  reporter: isCI ? [['html'], ['list']] : 'html',
  timeout: 30000,
  expect: { timeout: 10000 },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 15000,
  },
  projects: isCI ? ciProjects : allProjects,
  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !isCI,
    timeout: 120000,
    env: { ...process.env, NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000' },
  },
});
