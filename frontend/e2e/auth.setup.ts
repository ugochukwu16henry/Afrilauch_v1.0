import { test as setup } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Authenticate once as super_admin and save storage state (localStorage includes riseflow_token).
 * Admin dashboard tests use this state via project dependency — no UI login in each test.
 * Prerequisites: Backend at http://localhost:4000, DB seeded (test-super_admin@example.com / Password123).
 */
export const SUPERADMIN_STORAGE = path.join(process.cwd(), 'playwright', '.auth', 'superadmin.json');
const AUTH_DIR = path.dirname(SUPERADMIN_STORAGE);
const BACKEND_HEALTH = 'http://localhost:4000/api/v1/health';

function ensureAuthDir() {
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }
}

async function ensureBackendUp(): Promise<void> {
  try {
    const res = await fetch(BACKEND_HEALTH);
    if (!res.ok) throw new Error(`Backend health returned ${res.status}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(
      `Backend not running at http://localhost:4000. Start it (e.g. cd backend && pnpm run dev) and ensure DB is seeded (pnpm run db:seed). ${msg}`
    );
  }
}

setup.beforeAll(async () => {
  ensureAuthDir();
  await ensureBackendUp();
});

setup('authenticate as super_admin', async ({ page }) => {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');
  await page.getByLabel(/Email/i).fill('test-super_admin@example.com');
  await page.getByLabel(/Password/i).fill('Password123');
  await page.getByRole('button', { name: /Sign in/i }).click();
  await page.waitForURL(/\/dashboard\/admin/, { timeout: 30000 });
  await page.context().storageState({ path: SUPERADMIN_STORAGE });
});
