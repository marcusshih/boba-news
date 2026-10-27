import { test, expect } from '@playwright/test';

async function openCustomizer(page) {
  await page.goto('/');
  const root = page.locator('[data-boba-customizer]');
  await expect(root).toHaveAttribute('data-ready', 'true');
  await expect(root).toHaveAttribute('data-renderer', 'ready', { timeout: 15000 });
  await root.locator('#baseSelect').scrollIntoViewIfNeeded();
  return root;
}
const cubeImage = page => page.locator('#sketch-container canvas').evaluate(canvas => canvas.toDataURL());

test('immediate gram estimates, all toppings, syrup and reference notices', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const root = await openCustomizer(page);
  await expect(root.locator('[data-total-sugar]')).toHaveText('0 g estimated total sugar');
  await expect(root.locator('[data-cube-count]')).toHaveText('0 sugar cubes');
  await expect(root.getByRole('status')).toBeEmpty();
  await root.getByLabel('Base:', { exact: true }).selectOption('Green Tea');
  await root.getByLabel('Add Milk', { exact: true }).check();
  await expect(root.locator('[data-total-sugar]')).toHaveText('4.8 g estimated total sugar');
  await expect(root.locator('[data-free-sugar]')).toHaveText('Estimated free sugar: 0 g.');
  await root.getByLabel('Add Milk', { exact: true }).uncheck();
  for (const [label, grams] of [['Boba', '5.38'], ['Pudding', '9.13'], ['Grass Jelly', '3.79'], ['Konjac', '13']]) {
    await root.getByLabel(label, { exact: true }).check();
    await expect(root.locator('[data-total-sugar]')).toHaveText(`${grams} g estimated total sugar`);
    await root.getByLabel(label, { exact: true }).uncheck();
  }
  await root.getByLabel('Sugar:', { exact: true }).selectOption('100%');
  await expect(root.locator('[data-total-sugar]')).toHaveText('32 g estimated total sugar');
  await expect(root.locator('[data-reference-notice]')).toHaveAttribute('data-state', 'exceeds');
  await root.getByLabel('Sugar:', { exact: true }).selectOption('70%');
  await root.getByLabel('Pudding', { exact: true }).check();
  await expect(root.locator('[data-reference-notice]')).toHaveAttribute('data-state', 'uncertain');
  await root.getByLabel('Pudding', { exact: true }).uncheck();
  await expect(root.locator('[data-reference-notice]')).toHaveAttribute('data-state', 'within');
  await expect(root.getByRole('status')).toContainText('22.4 g total sugar');
  expect(errors).toEqual([]);
});

test('normal motion retains a WebGL falling-cube scene', async ({ page }, testInfo) => {
  const root = await openCustomizer(page);
  await root.locator('#sketch-container').scrollIntoViewIfNeeded();
  expect(await page.locator('#sketch-container canvas').evaluate(canvas => Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl')))).toBe(true);
  await root.locator('#sugarSelect').selectOption('100%');
  const initial = await cubeImage(page);
  await expect.poll(() => cubeImage(page), { timeout: 5000 }).not.toBe(initial);
  await expect(root.locator('[data-cube-count]')).toHaveText('8 sugar cubes');
  await root.locator('#baseSelect').selectOption('Green Tea');
  await root.locator('#milkCheckbox').check();
  await root.locator('#bobaCheckbox').check();
  await root.locator('#sketch-container').screenshot({ path: testInfo.outputPath('falling-cubes.png') });
  await root.screenshot({ path: testInfo.outputPath('customizer-desktop.png') });
});

test('comparison freezes recipe, result and visual while second drink changes', async ({ page }, testInfo) => {
  const root = await openCustomizer(page);
  await root.locator('#baseSelect').selectOption('Black Tea');
  await root.locator('#milkCheckbox').check();
  const canvas = await page.locator('#sketch-container canvas').elementHandle();
  const button = root.getByRole('button', { name: 'Compare Another Drink' });
  await button.click();
  await expect(root.locator('#baseSelect')).toBeFocused();
  await expect(root.locator('[data-reference-total]')).toHaveText('1 sugar cube · 4.8 g estimated total sugar');
  await expect(root.locator('[data-comparison-difference]')).toHaveText('Both drinks have the same estimated total sugar.');
  await expect(root.locator('[data-reference-cubes]')).toBeVisible();
  const savedText = await root.locator('[data-reference-recipe]').textContent();
  const savedImage = await root.locator('[data-reference-cubes]').getAttribute('src');
  const savedArtwork = await root.locator('[data-reference-illustration]').innerHTML();
  await root.locator('#milkCheckbox').uncheck();
  await root.locator('#bobaCheckbox').check();
  await expect(root.locator('[data-comparison-difference]')).toContainText('0.58 g more');
  await expect(root.locator('[data-cube-count]')).toHaveText('1 sugar cube');
  await expect(root.locator('[data-reference-recipe]')).toHaveText(savedText);
  await expect(root.locator('[data-reference-cubes]')).toHaveAttribute('src', savedImage);
  expect(await root.locator('[data-reference-illustration]').innerHTML()).toBe(savedArtwork);
  await expect(page.locator('canvas')).toHaveCount(1);
  expect(await canvas.evaluate(node => node.isConnected)).toBe(true);
  await root.locator('[data-comparison]').screenshot({ path: testInfo.outputPath('comparison.png') });
  await root.getByRole('button', { name: 'Finish Comparison' }).click();
  await expect(root.locator('[data-comparison]')).toBeHidden();
  await expect(root.getByRole('button', { name: 'Compare Another Drink' })).toBeFocused();
  await expect(root.locator('[data-total-sugar]')).toHaveText('5.38 g estimated total sugar');
  expect(await canvas.evaluate(node => node.isConnected)).toBe(true);
});

test('reduced motion is static, updates quantities and reacts to preference changes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const root = await openCustomizer(page);
  await root.locator('#sugarSelect').selectOption('100%');
  await root.locator('#sketch-container').scrollIntoViewIfNeeded();
  const image = await cubeImage(page);
  await page.waitForTimeout(200); // Verify absence of animation across frames.
  expect(await cubeImage(page)).toBe(image);
  await root.locator('#konjacCheckbox').check();
  await expect(root.locator('[data-total-sugar]')).toHaveText('45 g estimated total sugar');
  expect(await cubeImage(page)).not.toBe(image);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await root.locator('#sugarSelect').selectOption('0%');
  await root.locator('#sugarSelect').selectOption('100%');
  await root.locator('#sketch-container').scrollIntoViewIfNeeded();
  const moving = await cubeImage(page);
  await expect.poll(() => cubeImage(page)).not.toBe(moving);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(100);
  const settled = await cubeImage(page);
  await page.waitForTimeout(200);
  expect(await cubeImage(page)).toBe(settled);
});

test('keyboard selection, comparison focus and accessible groups/results', async ({ page }) => {
  const root = await openCustomizer(page);
  await expect(root.getByRole('group', { name: 'Milk:' })).toBeVisible();
  await expect(root.getByRole('group', { name: 'Toppings:' })).toBeVisible();
  const base = root.getByLabel('Base:', { exact: true });
  await base.focus();
  expect(await base.evaluate(node => getComputedStyle(node).outlineStyle)).toBe('solid');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await expect(root.getByLabel('Add Milk', { exact: true })).toBeFocused();
  await page.keyboard.press('Space');
  await expect(root.locator('[data-total-sugar]')).toHaveText('4.8 g estimated total sugar');
  for (const name of ['Boba', 'Pudding', 'Grass Jelly', 'Konjac']) {
    await page.keyboard.press('Tab');
    await expect(root.getByLabel(name, { exact: true })).toBeFocused();
    await page.keyboard.press('Space');
  }
  await page.keyboard.press('Tab');
  await expect(root.getByLabel('Sugar:', { exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(root.getByRole('button', { name: 'Compare Another Drink' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(base).toBeFocused();
  await expect(root.getByRole('status')).toContainText('Drink 1 saved. Now editing Drink 2');
  const aria = await root.locator('#sugarDisplay').ariaSnapshot();
  expect(aria).toContain('36.1 g estimated total sugar');
  expect(aria).toContain('Estimated free sugar: 13–31.3 g.');
  await root.getByRole('button', { name: 'Finish Comparison' }).focus();
  await page.keyboard.press('Enter');
  await expect(root.getByRole('button', { name: 'Compare Another Drink' })).toBeFocused();
  await root.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(root.locator('.game-methodology')).toHaveAttribute('open', '');
  await expect(root.getByRole('table')).toBeVisible();
});

test('rapid changes keep one canvas and announce only the settled result', async ({ page }) => {
  const root = await openCustomizer(page);
  await root.evaluate(node => {
    window.bobaTestAnnouncements = [];
    new MutationObserver(() => window.bobaTestAnnouncements.push(node.querySelector('[data-status]').textContent))
      .observe(node.querySelector('[data-status]'), { childList: true });
    for (let index = 0; index < 50; index++) {
      const select = node.querySelector('#sugarSelect');
      select.value = ['0%', '30%', '50%', '70%', '100%'][index % 5];
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await expect(root.locator('[data-total-sugar]')).toHaveText('32 g estimated total sugar');
  await expect(root.getByRole('status')).toContainText('32 g total sugar');
  expect(await page.evaluate(() => window.bobaTestAnnouncements.length)).toBe(1);
  await expect(page.locator('canvas')).toHaveCount(1);
});

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`layout and canvas remain contained at ${width}px, including comparison`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const root = await openCustomizer(page);
    await root.locator('#baseSelect').selectOption('Green Tea');
    for (const id of ['milk', 'boba', 'pudding', 'grass', 'konjac']) await root.locator(`#${id}Checkbox`).check();
    await root.locator('#sugarSelect').selectOption('100%');
    await expect(root.locator('[data-total-sugar]')).toHaveText('68.1 g estimated total sugar');
    await expect(root.locator('[data-cube-count]')).toHaveText('17 sugar cubes');
    await root.getByRole('button', { name: 'Compare Another Drink' }).click();
    await root.locator('summary').click();
    const overflow = await root.evaluate(node => [...node.querySelectorAll('input, select, button, canvas, .sugar-visual, .game-comparison, .game-methodology')].filter(element => {
      const box = element.getBoundingClientRect();
      return box.left < -1 || box.right > innerWidth + 1;
    }).map(element => element.tagName));
    expect(overflow).toEqual([]);
    if (width === 390) await root.screenshot({ path: testInfo.outputPath('customizer-mobile.png') });
    const canvas = await page.locator('#sketch-container canvas').elementHandle();
    const count = await root.locator('[data-cube-count]').textContent();
    await page.setViewportSize({ width: width === 1440 ? 390 : 1440, height: 900 });
    expect(await canvas.evaluate(node => node.isConnected)).toBe(true);
    await expect(root.locator('[data-cube-count]')).toHaveText(count);
  });
}

test('text results and comparison survive a rendering-library failure', async ({ page }) => {
  await page.route(/(?:\/_astro\/p5[^/]*\.js$|\/node_modules\/\.vite[^/]*\/deps\/p5\.js(?:\?.*)?$)/, route => route.abort());
  await page.goto('/');
  const root = page.locator('[data-boba-customizer]');
  await expect(root).toHaveAttribute('data-renderer', 'unavailable');
  await expect(root.locator('[data-renderer-note]')).toBeVisible();
  await root.locator('#sugarSelect').selectOption('100%');
  await expect(root.locator('[data-total-sugar]')).toHaveText('32 g estimated total sugar');
  await root.getByRole('button', { name: 'Compare Another Drink' }).click();
  await expect(root.locator('[data-reference-total]')).toHaveText('8 sugar cubes · 32 g estimated total sugar');
  await root.locator('#sugarSelect').selectOption('0%');
  await expect(root.locator('[data-comparison-difference]')).toContainText('32 g less');
});

test('repeated comparison reuses the active canvas and keeps the frozen quantity visible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const root = await openCustomizer(page);
  await root.locator('#sugarSelect').selectOption('100%');
  const canvas = await page.locator('#sketch-container canvas').elementHandle();
  for (let index = 0; index < 12; index++) {
    await root.getByRole('button', { name: 'Compare Another Drink' }).click();
    await expect(root.locator('[data-reference-cubes]')).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(1);
    // An 8-cube reference image must contain the cubes, even when the active
    // simulation has just been changed; not an empty falling-frame snapshot.
    const opaquePixels = await root.locator('[data-reference-cubes]').evaluate(async image => {
      await image.decode();
      const buffer = document.createElement('canvas');
      buffer.width = 300;
      buffer.height = 500;
      const context = buffer.getContext('2d');
      context.drawImage(image, 0, 0, 300, 500);
      const pixels = context.getImageData(0, 0, 300, 500).data;
      let count = 0;
      for (let i = 3; i < pixels.length; i += 4) if (pixels[i] > 100) count++;
      return count;
    });
    expect(opaquePixels).toBeGreaterThan(8000);
    await root.getByRole('button', { name: 'Finish Comparison' }).click();
  }
  expect(await canvas.evaluate(node => node.isConnected)).toBe(true);
});
