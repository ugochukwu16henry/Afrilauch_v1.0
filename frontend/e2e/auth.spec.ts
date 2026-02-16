import { test, expect } from '@playwright/test';
import { dismissDashboardModals } from './helpers/dismissModals';

test.describe('Auth', () => {
  test('home page shows RiseFlow Hub and login/register links', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByText(/RiseFlow Hub/i).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Login/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Launch My Idea|Register|Start Your Project|Start Building/i }).first()).toBeVisible();
  });

  test('navigate to login from home', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.getByRole('link', { name: /Login/i }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /RiseFlow Hub/i })).toBeVisible();
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(page.getByLabel(/Password/i)).toBeVisible();
  });

  test('navigate to register from home', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.getByRole('link', { name: /Launch My Idea|Register|Start Your Project|Start Building/i }).first().click();
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByLabel(/Full name/i)).toBeVisible();
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(page.getByLabel(/Password/i)).toBeVisible();
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await page.getByLabel(/Email/i).fill('invalid@example.com');
    await page.getByLabel(/Password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await expect(page.getByTestId('auth-error')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('login as client redirects to dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await page.getByLabel(/Email/i).fill('test-client@example.com');
    await page.getByLabel(/Password/i).fill('Password123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await dismissDashboardModals(page);
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  });

  test('login as super_admin redirects to admin dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await page.getByLabel(/Email/i).fill('test-super_admin@example.com');
    await page.getByLabel(/Password/i).fill('Password123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/admin/, { timeout: 15000 });
    await dismissDashboardModals(page);
    await expect(
      page.getByRole('link', { name: /Ideas & Projects|Projects/i }).first()
    ).toBeVisible();
  });

  test('logout redirects to login', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await page.getByLabel(/Email/i).fill('test-client@example.com');
    await page.getByLabel(/Password/i).fill('Password123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });
    await dismissDashboardModals(page);
    const logoutButton = page.getByRole('button', { name: /Log out/i });
    await expect(logoutButton).toBeVisible({ timeout: 5000 });
    await logoutButton.click();
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('register new user redirects to dashboard', async ({ page }) => {
    const email = `e2e-${Date.now()}@example.com`;
    await page.goto('/register');
    await page.waitForLoadState('domcontentloaded');
    await page.getByLabel(/Full name/i).fill('E2E Test User');
    await page.getByLabel(/Email/i).fill(email);
    await page.getByLabel(/Password/i).fill('Password123');
    await page.getByRole('button', { name: /Create|Start Your Project/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });
    await page.waitForLoadState('networkidle');
    await dismissDashboardModals(page);
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible({ timeout: 10000 });
  });

  test('register with existing email shows error', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('domcontentloaded');
    await page.getByLabel(/Full name/i).fill('Duplicate');
    await page.getByLabel(/Email/i).fill('test-client@example.com');
    await page.getByLabel(/Password/i).fill('Password123');
    await page.getByRole('button', { name: /Create|Start Your Project/i }).click();
    await expect(page.getByText(/already|error|failed|exists/i)).toBeVisible();
    await expect(page).toHaveURL(/\/register/);
  });
});
