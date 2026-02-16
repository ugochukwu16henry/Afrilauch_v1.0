import { test, expect } from '@playwright/test';

test.describe('Protected routes', () => {
  test('unauthenticated user visiting /dashboard redirects to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 8000 });
  });

  test('unauthenticated user visiting /dashboard/admin redirects to login', async ({ page }) => {
    await page.goto('/dashboard/admin');
    await expect(page).toHaveURL(/\/login/, { timeout: 8000 });
  });

  test('unauthenticated user visiting /dashboard/tasks redirects to login', async ({ page }) => {
    await page.goto('/dashboard/tasks');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated user visiting /dashboard/admin/agreements redirects to login', async ({ page }) => {
    await page.goto('/dashboard/admin/agreements');
    await expect(page).toHaveURL(/\/login/);
  });

  test('login and register pages are accessible without auth', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);
    await page.goto('/register');
    await expect(page).toHaveURL(/\/register/);
  });
});
