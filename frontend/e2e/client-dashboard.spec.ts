import { test, expect } from '@playwright/test';
import { dismissDashboardModals } from './helpers/dismissModals';

test.describe('Client Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    // Wait for network idle to ensure page is fully loaded before interacting
    // Catch timeout errors as this is optional - tests should still work if network is active
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.getByLabel(/Email/i).fill('test-client@example.com');
    await page.getByLabel(/Password/i).fill('Password123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });
    await dismissDashboardModals(page);
    await page.waitForTimeout(300);
    await expect(page.getByRole('link', { name: /Dashboard/i }).first()).toBeVisible();
  });

  test('dashboard shows overview section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  });

  test('sidebar shows client nav links', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Dashboard/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Project', exact: true }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Tasks' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Files' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Messages' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Payments' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Reports/i }).first()).toBeVisible();
  });

  test('navigate to Project page', async ({ page }) => {
    await page.getByRole('link', { name: 'Project', exact: true }).first().click();
    await expect(page).toHaveURL(/\/dashboard\/project/);
    await expect(page.getByText(/Project|Details|No project/i).first()).toBeVisible();
  });

  test('navigate to Tasks page', async ({ page }) => {
    await page.getByRole('link', { name: 'Tasks' }).first().click();
    await expect(page).toHaveURL(/\/dashboard\/tasks/);
    await expect(
      page.getByTestId('kanban-column-todo').or(page.getByText(/Tasks|No project yet/i))
    ).toBeVisible();
  });

  test('navigate to Files page', async ({ page }) => {
    await page.getByRole('link', { name: 'Files' }).first().click();
    await expect(page).toHaveURL(/\/dashboard\/files/);
  });

  test('navigate to Messages page', async ({ page }) => {
    await page.getByRole('link', { name: 'Messages' }).first().click();
    await expect(page).toHaveURL(/\/dashboard\/messages/);
  });

  test('navigate to Payments page', async ({ page }) => {
    await page.getByRole('link', { name: 'Payments' }).first().click();
    await expect(page).toHaveURL(/\/dashboard\/payments/);
  });

  test('Agreements to Sign section visible', async ({ page }) => {
    await expect(
      page.getByText(/Agreements to Sign|No agreements assigned to you|You don't have a project yet/i).first()
    ).toBeVisible();
  });

  test('dashboard shows project timeline or no project message', async ({ page }) => {
    await expect(
      page.getByText(/You don't have a project yet|Project timeline|Progress|Dashboard/i).first()
    ).toBeVisible();
  });
});
