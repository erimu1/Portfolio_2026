import { chromium } from 'playwright';
import { strict as assert } from 'node:assert';
import { fileURLToPath } from 'node:url';
import { writeFile } from 'node:fs/promises';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];
const results = [];
const path = name => fileURLToPath(new URL(name, import.meta.url));
async function ready(page) { await page.waitForFunction(() => !!document.querySelector('.page-transition--idle')); }
async function noOverflow(page, name) {
  const dimensions = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
  assert(dimensions.scroll <= dimensions.width, `${name} overflows: ${JSON.stringify(dimensions)}`);
  results.push(`${name}: no horizontal overflow`);
}
async function menuGo(page, label) {
  await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await page.locator('.nav-card').filter({ has: page.locator('.card-label', { hasText: label }) }).click();
  await ready(page);
}
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', e => { if (e.type() === 'error') errors.push(e.text()); });
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => [...document.querySelectorAll('.phase-disc')].every(el => el.getAnimations().every(a => a.playState === 'finished')));
  assert.deepEqual(await page.locator('.phase-disc').evaluateAll(els => els.map(el => getComputedStyle(el).getPropertyValue('--sweep').trim())), ['360deg', '270deg', '180deg', '90deg']);
  const before = await page.locator('.phase').first().boundingBox();
  await page.locator('.phase').first().hover();
  assert.deepEqual(await page.locator('.phase').first().boundingBox(), before);
  results.push('Circle fills reach their targets and have no hover movement');
  await noOverflow(page, 'Desktop home');
  await page.screenshot({ path: path('home-desktop.png'), fullPage: true });
  await page.getByRole('button', { name: 'Explore projects', exact: true }).click();
  await ready(page);
  assert.equal(await page.locator('.project-card').count(), 4);
  await noOverflow(page, 'Desktop projects');
  await page.screenshot({ path: path('projects-desktop.png'), fullPage: true });
  await page.locator('.project-card').first().click();
  assert.equal(await page.locator('.canvas').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(107, 171, 203)');
  await page.screenshot({ path: path('project-blue.png'), fullPage: true });
  await page.getByRole('button', { name: 'Next exploration', exact: true }).click();
  assert.equal(await page.locator('.canvas').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(245, 104, 29)');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.project-card').count(), 4);
  await page.getByRole('button', { name: 'Next page: concepts 5 to 8' }).click();
  assert.equal(await page.locator('.project-card').first().getAttribute('id'), 'project-card-4');
  await page.getByRole('button', { name: 'First page: concepts 1 to 4' }).click();
  await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await page.locator('.nav-card').first().evaluate(el => Promise.all(el.getAnimations().map(a => a.finished)));
  await page.screenshot({ path: path('menu-desktop.png'), fullPage: true });
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('dialog').count(), 0);
  await menuGo(page, 'About');
  assert.equal(new URL(page.url()).hash, '#about');
  await page.screenshot({ path: path('about-desktop.png'), fullPage: true });
  await page.goBack(); await ready(page);
  assert.equal(await page.locator('.project-card').count(), 4);
  await menuGo(page, 'Connect');
  await page.waitForFunction(() => document.activeElement?.id === 'links');
  results.push('Project details, blue/orange backgrounds, pagination, menu, Escape, history, Connect focus pass');
  await page.getByRole('button', { name: 'Pause animations' }).click();
  await menuGo(page, 'Projects');
  assert.equal(await page.locator('.project-card').count(), 4);
  await menuGo(page, 'Home');
  await page.getByRole('button', { name: 'Play animations' }).click();
  for (const width of [390, 320, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await noOverflow(page, `${width}px home`);
    if (width === 390) await page.screenshot({ path: path('home-mobile.png'), fullPage: true });
    await page.getByRole('button', { name: 'Explore projects', exact: true }).click(); await ready(page);
    await noOverflow(page, `${width}px projects`);
    if (width === 390) await page.screenshot({ path: path('projects-mobile.png'), fullPage: true });
    await page.locator('.project-card').first().click();
    await noOverflow(page, `${width}px project detail`);
    await menuGo(page, 'Home');
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('.phase-disc').first().evaluate(el => getComputedStyle(el).animationName), 'none');
  await page.getByRole('button', { name: 'Explore projects', exact: true }).click(); await ready(page);
  assert.equal(await page.locator('.project-card').count(), 4);
  results.push('Pause/play and reduced motion navigation pass');
  assert.deepEqual(errors, []);
  await writeFile(path('verification.json'), JSON.stringify({ results, errors }, null, 2));
  console.log(JSON.stringify({ results, errors }, null, 2));
} finally { await browser.close(); }
