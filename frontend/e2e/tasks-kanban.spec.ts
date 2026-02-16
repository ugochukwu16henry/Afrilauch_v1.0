import { test, expect } from '@playwright/test';
import { dismissDashboardModals } from './helpers/dismissModals';

test.describe('Tasks Kanban', () => {
  test('client sees Tasks page with Kanban columns', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    // Wait for network idle to ensure page is fully loaded before interacting
    // Catch timeout errors as this is optional - tests should still work if network is active
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.getByLabel(/Email/i).fill('test-client@example.com');
    await page.getByLabel(/Password/i).fill('Password123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await dismissDashboardModals(page);
    await page.waitForTimeout(500);
    await page.getByRole('link', { name: 'Tasks' }).first().click();
    await expect(page).toHaveURL(/\/dashboard\/tasks/);
    await expect(page.getByText(/Tasks/i).first()).toBeVisible();
    // Check for kanban columns or "No project yet" message - .first() handles case where multiple columns exist
    await expect(
      page.getByTestId('kanban-column-todo').or(page.getByTestId('kanban-column-done')).or(page.getByText(/No project yet/i)).first()
    ).toBeVisible();
  });

  test('team user sees My tasks / By project toggle', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    // Wait for network idle to ensure page is fully loaded before interacting
    // Catch timeout errors as this is optional - tests should still work if network is active
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.getByLabel(/Email/i).fill('test-developer@example.com');
    await page.getByLabel(/Password/i).fill('Password123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });
    await dismissDashboardModals(page);
    await page.waitForTimeout(600);
    await page.getByRole('link', { name: 'Tasks' }).first().click();
    await expect(page).toHaveURL(/\/dashboard\/tasks/);
    await expect(page.getByRole('button', { name: /By project/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /My tasks/i })).toBeVisible();
  });
});
