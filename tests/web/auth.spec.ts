import { test, expect } from '@playwright/test';

const WEB_URL = process.env.WEB_BASE_URL || 'http://localhost:3000';

test.describe('Auth (web)', () => {
  test('home page shows RiseFlow Hub and login/register links', async ({ page }) => {
    await page.goto(WEB_URL + '/');
    await expect(page.getByText(/RiseFlow Hub/i).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Login/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Start Your Project/i })).toBeVisible();
  });

  test('navigate to login from home', async ({ page }) => {
    await page.goto(WEB_URL + '/');
    await page.getByRole('link', { name: /Login/i }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /RiseFlow Hub/i })).toBeVisible();
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(page.getByLabel(/Password/i)).toBeVisible();
  });

  test('navigate to register from home', async ({ page }) => {
    await page.goto(WEB_URL + '/');
    await page.getByRole('link', { name: /Start Your Project/i }).click();
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByLabel(/Full name/i)).toBeVisible();
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(page.getByLabel(/Password/i)).toBeVisible();
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto(WEB_URL + '/login');
    await page.getByLabel(/Email/i).fill('invalid@example.com');
    await page.getByLabel(/Password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await expect(page.getByText(/invalid|failed|error/i)).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('login as client redirects to dashboard', async ({ page }) => {
    await page.goto(WEB_URL + '/login');
    await page.getByLabel(/Email/i).fill('test-client@example.com');
    await page.getByLabel(/Password/i).fill('Password123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.getByText(/Welcome back|Dashboard/i)).toBeVisible({ timeout: 5000 });
  });

  test('login as super_admin redirects to admin dashboard', async ({ page }) => {
    await page.goto(WEB_URL + '/login');
    await page.getByLabel(/Email/i).fill('test-super_admin@example.com');
    await page.getByLabel(/Password/i).fill('Password123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/admin/, { timeout: 10000 });
    await expect(page.getByText(/Dashboard|Projects|Users|Agreements/i)).toBeVisible({ timeout: 5000 });
  });

  test('logout redirects to login', async ({ page }) => {
    await page.goto(WEB_URL + '/login');
    await page.getByLabel(/Email/i).fill('test-client@example.com');
    await page.getByLabel(/Password/i).fill('Password123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await page.getByRole('button', { name: /Log out/i }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('register new user redirects to dashboard', async ({ page }) => {
    const email = `e2e-${Date.now()}@example.com`;
    await page.goto(WEB_URL + '/register');
    await page.getByLabel(/Full name/i).fill('E2E Test User');
    await page.getByLabel(/Email/i).fill(email);
    await page.getByLabel(/Password/i).fill('Password123');
    await page.getByRole('button', { name: /Create|Start Your Project/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.getByText(/Welcome back|Dashboard/i)).toBeVisible({ timeout: 5000 });
  });

  test('register with existing email shows error', async ({ page }) => {
    await page.goto(WEB_URL + '/register');
    await page.getByLabel(/Full name/i).fill('Duplicate');
    await page.getByLabel(/Email/i).fill('test-client@example.com');
    await page.getByLabel(/Password/i).fill('Password123');
    await page.getByRole('button', { name: /Create|Start Your Project/i }).click();
    await expect(page.getByText(/already|error|failed/i)).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/\/register/);
  });
});
