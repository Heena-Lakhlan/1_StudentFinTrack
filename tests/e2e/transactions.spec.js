const { test, expect } = require('@playwright/test');

test('transactions: create, update, delete and offline fallback', async ({ page }) => {
  await page.goto('/');

  // Use demo login
  const demoBtn = page.locator('#demoBtn');
  if (await demoBtn.count() > 0) await demoBtn.click(); else await page.click('text=Demo');
  await page.waitForURL('**/dashboard.html');

  // Go to transactions page
  await page.click('text=Transaction');
  await page.waitForURL('**/transactions.html');

  // Count initial rows
  const rowsBefore = await page.locator('#txList tbody tr').count();

  // Create a transaction
  await page.click('#addTxBtn');
  await page.fill('#txAmount', '5.00');
  await page.selectOption('#txCategory', { index: 0 });
  await page.fill('#txDesc', 'E2E create txn');
  await page.click('button:has-text("Save")');

  // Wait for new row to appear
  await page.waitForSelector('#txList tbody tr');
  const rowsAfterCreate = await page.locator('#txList tbody tr').count();
  expect(rowsAfterCreate).toBeGreaterThan(rowsBefore);

  // Edit the first transaction's description
  const firstEdit = page.locator('#txList [data-edit]').first();
  await firstEdit.click();
  await page.fill('#txDesc', 'E2E edited txn');
  await page.click('button:has-text("Save")');
  await page.waitForTimeout(200); // allow UI to refresh
  await expect(page.locator('#txList tbody tr td').nth(1)).toContainText('E2E edited txn');

  // Delete the first transaction
  const firstDel = page.locator('#txList [data-del]').first();
  // confirm dialog - Playwright handles native dialogs
  page.on('dialog', async dialog => { await dialog.accept(); });
  await firstDel.click();
  await page.waitForTimeout(200);
  const rowsAfterDelete = await page.locator('#txList tbody tr').count();
  expect(rowsAfterDelete).toBeLessThanOrEqual(rowsAfterCreate - 1);

  // Now simulate offline and add a transaction to verify LocalStorage fallback
  await page.context().setOffline(true);
  await page.click('#addTxBtn');
  await page.fill('#txAmount', '7.00');
  await page.selectOption('#txCategory', { index: 0 });
  await page.fill('#txDesc', 'Offline txn');
  await page.click('button:has-text("Save")');
  // offline change should still show up in UI
  await page.waitForTimeout(200);
  const rowsAfterOffline = await page.locator('#txList tbody tr').count();
  expect(rowsAfterOffline).toBeGreaterThanOrEqual(rowsAfterDelete + 1);

  await page.context().setOffline(false);
});
