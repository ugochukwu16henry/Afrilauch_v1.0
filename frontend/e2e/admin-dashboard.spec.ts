import { test, expect } from '@playwright/test';
import { dismissWelcome } from './helpers/dismissModals';

/**
 * Admin dashboard tests use storageState (super_admin) from auth.setup.ts.
 * No UI login in each test — run with project admin-chromium, admin-firefox, or admin-webkit.
 */
test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/admin');
    await expect(page).toHaveURL(/\/dashboard\/admin/);
    await dismissWelcome(page);
    await expect(
      page.getByRole('link', { name: /Ideas & Projects|Projects/i }).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('admin dashboard shows nav: Projects, Users, Agreements', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Dashboard/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Ideas & Projects|Projects/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Users', exact: true }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Agreements', exact: true }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Reports/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Settings/i }).first()).toBeVisible();
  });

  test('navigate to Projects page', async ({ page }) => {
    await page.getByRole('link', { name: /Ideas & Projects|Projects/i }).first().click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/projects/);
    await expect(page.getByText(/Projects|Ideas|All projects/i).first()).toBeVisible();
  });

  test('navigate to Users page', async ({ page }) => {
    await page.getByRole('link', { name: 'Users', exact: true }).first().click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/users/);
    await expect(page.getByText(/Users/i).first()).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('navigate to Agreements page', async ({ page }) => {
    await page.getByRole('link', { name: 'Agreements', exact: true }).first().click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/agreements/);
    await expect(page.getByRole('button', { name: /Add New Agreement/i })).toBeVisible();
  });

  test('Agreements page has table and filters', async ({ page }) => {
    await page.getByRole('link', { name: 'Agreements', exact: true }).first().click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/agreements/);
    await expect(
      page.getByPlaceholder(/Search by user or agreement/i).or(page.getByRole('button', { name: /Assign Agreement/i })).first()
    ).toBeVisible();
  });

  test('Add New Agreement modal opens and closes', async ({ page }) => {
    await page.getByRole('link', { name: 'Agreements', exact: true }).first().click();
    await page.getByRole('button', { name: /Add New Agreement/i }).click();
    await expect(page.getByRole('heading', { name: /Add New Agreement/i })).toBeVisible();
    await expect(page.getByLabel(/Title/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Cancel/i })).toBeVisible();
    await page.getByRole('button', { name: /Cancel/i }).click();
    await expect(page.getByRole('heading', { name: /Add New Agreement/i })).not.toBeVisible();
  });

  test('Assign Agreement modal opens', async ({ page }) => {
    await page.getByRole('link', { name: 'Agreements', exact: true }).first().click();
    await page.getByRole('button', { name: /Assign Agreement/i }).click();
    await expect(page.getByRole('heading', { name: /Assign Agreement/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Cancel/i })).toBeVisible();
  });

  test('navigate to Reports page', async ({ page }) => {
    await page.getByRole('link', { name: /Reports/i }).first().click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/reports/);
  });

  test('navigate to Settings page', async ({ page }) => {
    await page.getByRole('link', { name: /Settings/i }).first().click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/settings/);
  });

  test('admin can log out', async ({ page }) => {
    await page.getByRole('button', { name: /Log out/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
