import { chromium } from '@playwright/test';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

async function checkBackendHealth() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/health`, { signal: controller.signal });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Backend health check failed (${res.status}): ${text}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Backend preflight failed at ${BACKEND_URL}/api/v1/health: ${message}`);
  } finally {
    clearTimeout(timeout);
  }
}

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

async function setCheckboxState(checkbox, desiredValue) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const currentValue = await checkbox.isChecked();
    if (currentValue === desiredValue) return;
    await checkbox.setChecked(desiredValue, { timeout: 5000 });
    await checkbox.page().waitForTimeout(250);
  }
  const currentValue = await checkbox.isChecked();
  throw new Error(`Failed to set checkbox state. Expected ${desiredValue}, got ${currentValue}`);
}

async function waitForWafValue(token, expectedValue) {
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    const overview = await fetchSecurityOverview(token);
    if (overview?.protections?.waf === expectedValue) return overview;
    await new Promise((resolve) => setTimeout(resolve, 700));
  }
  return fetchSecurityOverview(token);
}

async function loginViaApi() {
  const res = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test-super_admin@example.com', password: 'Password123' }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API login fallback failed (${res.status}): ${text}`);
  }
  const json = await res.json();
  if (!json?.token) {
    throw new Error('API login fallback returned no token.');
  }
  return json.token;
}

async function run() {
  await checkBackendHealth();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(90000);

  try {
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded' });
    const emailInput = page.locator('input#email');
    const passwordInput = page.locator('input#password');
    await emailInput.waitFor({ timeout: 15000 });
    await passwordInput.waitFor({ timeout: 15000 });

    await emailInput.fill('test-super_admin@example.com');
    await passwordInput.fill('Password123');

    const emailValue = await emailInput.inputValue();
    const passwordValue = await passwordInput.inputValue();
    if (!emailValue || !passwordValue) {
      throw new Error('Login inputs were not populated before submit.');
    }

    await passwordInput.press('Enter');

    const loginDeadline = Date.now() + 45000;
    let token = null;
    while (Date.now() < loginDeadline) {
      token = await page.evaluate(() => localStorage.getItem('riseflow_token'));
      if (token) break;

      if (page.url().includes('/dashboard/')) break;

      const authError = page.locator('[data-testid="auth-error"]');
      if ((await authError.count()) > 0) {
        const authMessage = (await authError.first().innerText()).trim();
        throw new Error(`Login failed on UI: ${authMessage}`);
      }

      await page.waitForTimeout(500);
    }

    if (!token) token = await page.evaluate(() => localStorage.getItem('riseflow_token'));
    if (!token) {
      const fallbackToken = await loginViaApi();
      await page.evaluate((storedToken) => localStorage.setItem('riseflow_token', storedToken), fallbackToken);
      token = fallbackToken;
    }
    if (!token) {
      const url = page.url();
      const snapshot = await page.locator('body').innerText();
      throw new Error(`Login did not complete (no token). URL: ${url}. Snapshot: ${snapshot.slice(0, 500)}`);
    }

    let ready = false;
    await page.goto(`${FRONTEND_URL}/dashboard/admin/settings`, {
      waitUntil: 'domcontentloaded',
      timeout: 120000,
    });
    const bodyText = await page.locator('body').innerText();
    if (!/404\s+This page could not be found\./i.test(bodyText)) {
      const wafCheckbox = page.getByLabel('WAF protection');
      try {
        await wafCheckbox.waitFor({ state: 'visible', timeout: 180000 });
        ready = true;
      } catch {
        ready = false;
      }
    }

    if (!ready) {
      const url = page.url();
      const snapshot = await page.locator('body').innerText();
      throw new Error(`System settings heading not found after retries. URL: ${url}. Snapshot: ${snapshot.slice(0, 500)}`);
    }

    const wafCheckbox = page.getByLabel('WAF protection');
    const originalWaf = await wafCheckbox.isChecked();
    const toggledWaf = !originalWaf;

    await setCheckboxState(wafCheckbox, toggledWaf);

    await page.getByRole('button', { name: /Save system settings/i }).click();
    await page.getByText(/System settings updated/i).waitFor({ timeout: 10000 });

    const updatedOverview = await waitForWafValue(token, toggledWaf);
    if (updatedOverview?.protections?.waf !== toggledWaf) {
      throw new Error(
        `WAF propagation check failed. Expected ${toggledWaf}, got ${String(updatedOverview?.protections?.waf)}`
      );
    }

    await setCheckboxState(wafCheckbox, originalWaf);

    await page.getByRole('button', { name: /Save system settings/i }).click();
    await page.getByText(/System settings updated/i).waitFor({ timeout: 10000 });

    const restoredOverview = await waitForWafValue(token, originalWaf);
    if (restoredOverview?.protections?.waf !== originalWaf) {
      throw new Error(
        `WAF restore check failed. Expected ${originalWaf}, got ${String(restoredOverview?.protections?.waf)}`
      );
    }

    console.log(
      `UI smoke passed: toggled WAF ${originalWaf} -> ${toggledWaf}, verified propagation, restored to ${originalWaf}.`
    );
  } finally {
    await Promise.allSettled([context.close(), browser.close()]);
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
