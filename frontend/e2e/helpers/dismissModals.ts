import { Page } from '@playwright/test';

/** Dismiss the Welcome dialog (admin/team) if visible. */
export async function dismissWelcome(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog', { name: 'Welcome' });
  const removeWelcomeOverlay = async () => {
    await page.evaluate(() => {
      const node = document.querySelector('[role="dialog"][aria-label="Welcome"]') as HTMLElement | null;
      if (node) {
        node.style.display = 'none';
        node.remove();
      }
    });
  };

  try {
    for (let i = 0; i < 10; i += 1) {
      if (await dialog.isVisible({ timeout: 300 }).catch(() => false)) {
        const btn = page.getByRole('button', { name: 'Get started' });
        if (await btn.isVisible({ timeout: 300 }).catch(() => false)) {
          await btn.click({ timeout: 2000 }).catch(async () => {
            await removeWelcomeOverlay();
          });
          await dialog.waitFor({ state: 'hidden', timeout: 2000 }).catch(async () => {
            await removeWelcomeOverlay();
          });
        } else {
          await removeWelcomeOverlay();
        }
      } else {
        await removeWelcomeOverlay();
      }

      // Short wait for async user/profile response that may mount modal late.
      await page.waitForTimeout(250);
    }

    await removeWelcomeOverlay();
  } catch {
    // No Welcome modal
  }
}

/** Dismiss the "Complete your setup" modal (client) if visible: go to choose step if needed, then Skip for Now → Continue to limited dashboard. */
export async function dismissSetupModal(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog', { name: 'Complete your setup' });
  try {
    if (!(await dialog.isVisible({ timeout: 2000 }))) return;
    
    const skipBtn = page.getByRole('button', { name: 'Skip for Now' });
    if (await skipBtn.isVisible({ timeout: 1000 })) {
      await skipBtn.click();
      const continueBtn = page.getByRole('button', { name: 'Continue to limited dashboard' });
      await continueBtn.waitFor({ state: 'visible', timeout: 3000 });
      await continueBtn.click();
      // Wait for dialog to be hidden
      await dialog.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
      return;
    }
    
    const continuePayment = page.getByRole('button', { name: 'Continue to payment' });
    if (await continuePayment.isVisible({ timeout: 1000 })) {
      await continuePayment.click();
      const skipAfterPayment = page.getByRole('button', { name: 'Skip for Now' });
      await skipAfterPayment.waitFor({ state: 'visible', timeout: 3000 });
      await skipAfterPayment.click();
      const continueLimited = page.getByRole('button', { name: 'Continue to limited dashboard' });
      await continueLimited.waitFor({ state: 'visible', timeout: 3000 });
      await continueLimited.click();
      // Wait for dialog to be hidden
      await dialog.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
    }
  } catch {
    // No Setup modal or step already dismissed
  }
}

/** Dismiss both modals so dashboard nav is clickable. Call after landing on /dashboard or /dashboard/admin. */
export async function dismissDashboardModals(page: Page): Promise<void> {
  await dismissWelcome(page);
  await dismissSetupModal(page);
}
