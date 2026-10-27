import { test, expect } from '@playwright/test';
test('cube renderer initializes and animates on first load and reload', async ({ page }) => {
  const initializationErrors = [];
  page.on('console', message => {
    if (message.type() === 'error' && message.text().includes('Sugar cube renderer initialization failed')) initializationErrors.push(message.text());
  });
  await page.goto('/');
  const root = page.locator('[data-boba-customizer]');
  await expect(root).toHaveAttribute('data-renderer', 'ready', { timeout: 15000 });
  await page.reload();
  await expect(root).toHaveAttribute('data-renderer', 'ready', { timeout: 15000 });
  await expect(root.locator('[data-renderer-note]')).toBeHidden();
  await root.locator('#sugarSelect').selectOption('100%');
  await root.locator('#sketch-container').scrollIntoViewIfNeeded();
  await expect(root.locator('[data-cube-count]')).toHaveText('8 sugar cubes');
  const canvas = root.locator('canvas');
  const firstFrame = await canvas.evaluate(node => node.toDataURL());
  await expect.poll(() => canvas.evaluate(node => node.toDataURL())).not.toBe(firstFrame);
  expect(initializationErrors).toEqual([]);
});
