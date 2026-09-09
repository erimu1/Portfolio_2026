import { chromium } from 'playwright';
import { strict as assert } from 'node:assert';
import { fileURLToPath } from 'node:url';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(new URL('../offline/index.html', import.meta.url).href);
  await page.getByRole('button', { name: 'Explore projects', exact: true }).click();
  await page.locator('.project-card').first().click();
  await page.screenshot({ path: fileURLToPath(new URL('project-blue.png', import.meta.url)), fullPage: true });
  assert.equal(await page.locator('.project-detail-copy h1').textContent(), 'A little room for curiosity.');
  await page.getByRole('button', { name: 'All explorations', exact: true }).click();
  await page.getByRole('button', { name: 'Next page: concepts 5 to 8' }).click();
  assert.equal(await page.locator('.project-card').first().getAttribute('id'), 'project-card-4');
  await page.getByRole('button', { name: 'Back home', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: fileURLToPath(new URL('home-mobile.png', import.meta.url)), fullPage: true });
  await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await page.screenshot({ path: fileURLToPath(new URL('menu-mobile.png', import.meta.url)), fullPage: true });
  await page.getByRole('button', { name: 'Close navigation', exact: true }).click();
  assert.deepEqual(errors, []);
  console.log('Offline home, project details, pagination, and mobile menu pass with no runtime errors.');
} finally { await browser.close(); }
