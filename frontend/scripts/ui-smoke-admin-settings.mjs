import { chromium } from '@playwright/test';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

async function fetchSecurityOverview(token) {
  const res = await fetch(`${BACKEND_URL}/api/v1/super-admin/security/overview`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Security overview request failed (${res.status}): ${text}`);
  }
  return res.json();
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(90000);

  try {
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.getByLabel(/Email/i).fill('test-super_admin@example.com');
    await page.getByLabel(/Password/i).fill('Password123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await page.waitForURL(/\/dashboard\/admin/, { timeout: 45000 });

    const token = await page.evaluate(() => localStorage.getItem('riseflow_token'));
    if (!token) throw new Error('No riseflow token found after login flow.');

    let ready = false;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      await page.goto(`${FRONTEND_URL}/dashboard/admin`, { waitUntil: 'domcontentloaded' });
      const dashboardText = await page.locator('body').innerText();
      if (/404\s+This page could not be found\./i.test(dashboardText)) {
        await page.waitForTimeout(1200);
        continue;
      }

      const settingsLink = page.getByRole('link', { name: /^Settings$/i }).first();
      if ((await settingsLink.count()) > 0) {
        await settingsLink.click();
      } else {
        await page.goto(`${FRONTEND_URL}/dashboard/admin/settings`, { waitUntil: 'domcontentloaded' });
      }

      const bodyText = await page.locator('body').innerText();
      if (/404\s+This page could not be found\./i.test(bodyText)) {
        await page.waitForTimeout(1200);
        continue;
      }

      const heading = page.getByRole('heading', { name: /System settings/i });
      if ((await heading.count()) > 0) {
        await heading.first().waitFor({ timeout: 15000 });
        ready = true;
        break;
      }

      await page.waitForTimeout(800);
    }

    if (!ready) {
      const url = page.url();
      const snapshot = await page.locator('body').innerText();
      throw new Error(`System settings heading not found after retries. URL: ${url}. Snapshot: ${snapshot.slice(0, 500)}`);
    }

    const wafCheckbox = page.getByLabel('WAF protection');
    const originalWaf = await wafCheckbox.isChecked();
    const toggledWaf = !originalWaf;

    if (toggledWaf) {
      await wafCheckbox.check();
    } else {
      await wafCheckbox.uncheck();
    }

    await page.getByRole('button', { name: /Save system settings/i }).click();
    await page.getByText(/System settings updated/i).waitFor({ timeout: 10000 });

    const updatedOverview = await fetchSecurityOverview(token);
    if (updatedOverview?.protections?.waf !== toggledWaf) {
      throw new Error(
        `WAF propagation check failed. Expected ${toggledWaf}, got ${String(updatedOverview?.protections?.waf)}`
      );
    }

    if (originalWaf) {
      await wafCheckbox.check();
    } else {
      await wafCheckbox.uncheck();
    }

    await page.getByRole('button', { name: /Save system settings/i }).click();
    await page.getByText(/System settings updated/i).waitFor({ timeout: 10000 });

    const restoredOverview = await fetchSecurityOverview(token);
    if (restoredOverview?.protections?.waf !== originalWaf) {
      throw new Error(
        `WAF restore check failed. Expected ${originalWaf}, got ${String(restoredOverview?.protections?.waf)}`
      );
    }

    console.log(
      `UI smoke passed: toggled WAF ${originalWaf} -> ${toggledWaf}, verified propagation, restored to ${originalWaf}.`
    );
  } finally {
    await context.close();
    await browser.close();
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
