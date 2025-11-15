const { test, expect } = require('@playwright/test');

test('demo login goes to dashboard and shows user', async ({ page }) => {
  // Go to the app root (webServer in config provides baseURL)
  await page.goto('/');

  // Click the Demo button if present
  const demoBtn = page.locator('#demoBtn');
  if (await demoBtn.count() > 0) {
    await demoBtn.click();
  } else {
    // fallback: click by text
    await page.click('text=Demo');
  }

  // Expect to navigate to dashboard.html
  await page.waitForURL('**/dashboard.html', { timeout: 5000 });
  await expect(page).toHaveURL(/dashboard.html/);

  // Wait for a dashboard-specific element to be visible
  await expect(page.locator('#cardRemaining')).toBeVisible();

  // Navbar should show signed-in username (Demo User)
  await expect(page.locator('#navbar').locator('text=Demo User').first()).toBeVisible();
});
