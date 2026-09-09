import { chromium } from 'playwright';
import { strict as assert } from 'node:assert';
import { fileURLToPath } from 'node:url';
import { writeFile } from 'node:fs/promises';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [], results = [];
const out = name => fileURLToPath(new URL(name, import.meta.url));
const settle = page => page.waitForFunction(() => !!document.querySelector('.page-transition--idle'));
async function finishEntrance(page) {
  await page.evaluate(() => Promise.all(document.getAnimations().filter(a => a.effect?.getTiming().iterations !== Infinity).map(a => a.finished.catch(() => {}))));
}
async function nav(page, name) {
  await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await page.locator('.nav-card').filter({ has: page.locator('.card-label', { hasText: name }) }).click();
  await settle(page);
}
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', e => { if (e.type() === 'error') errors.push(e.text()); });
  await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });
  await finishEntrance(page);
  assert.equal(await page.locator('html').evaluate(el => getComputedStyle(el).getPropertyValue('--green').trim()), '#a8bd83');
  assert.match(await page.locator('.canvas').evaluate(el => getComputedStyle(el, '::before').backgroundImage), /feTurbulence/);
  await page.screenshot({ path: out('refresh-home.png'), fullPage: true });
  await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  const matrices = await page.locator('.nav-card').evaluateAll(els => els.map(el => {
    const animation = el.getAnimations().find(a => a.animationName === 'card-axis-in');
    animation.pause(); animation.currentTime = 300;
    const style = getComputedStyle(el), matrix = new DOMMatrix(style.transform);
    return { tilt: Math.atan2(matrix.b, matrix.a) * 180 / Math.PI, x: matrix.e, y: matrix.f };
  }));
  matrices.forEach((m, i) => {
    assert(Math.abs(m.tilt - 12) < .01);
    assert(Math.abs(m.x / m.y + Math.tan(12 * Math.PI / 180)) < .001);
    assert(i % 2 ? m.y > 0 : m.y < 0);
  });
  results.push('Menu moves alternately from top/bottom on its exact 12-degree axis without changing rotation');
  await page.locator('.nav-card').evaluateAll(els => els.forEach(el => el.getAnimations().forEach(a => a.finish())));
  await finishEntrance(page);
  await page.screenshot({ path: out('refresh-menu.png'), fullPage: true });
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Explore projects', exact: true }).click(); await settle(page); await finishEntrance(page);
  assert.equal(await page.locator('.project-card').count(), 4);
  assert.deepEqual(await page.locator('.project-card').allTextContents(), ['', '', '', '']);
  assert.equal(await page.locator('.project-detail,.art-name').count(), 0);
  assert.equal(await page.locator('.project-card').first().evaluate(el => getComputedStyle(el).animationName), 'project-breathe');
  await page.screenshot({ path: out('refresh-projects.png'), fullPage: true });
  await page.getByRole('button', { name: 'Next page', exact: true }).click(); await settle(page); await finishEntrance(page);
  assert.equal(new URL(page.url()).hash, '#about');
  await page.screenshot({ path: out('refresh-about.png'), fullPage: true });
  results.push('Four blank animated project cards; Next page opens About; orange background is textured');
  for (const width of [390, 320, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await nav(page, 'Home'); await finishEntrance(page);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    if (width === 390) await page.screenshot({ path: out('refresh-home-mobile.png'), fullPage: true });
    await nav(page, 'Projects'); await finishEntrance(page);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    if (width === 390) await page.screenshot({ path: out('refresh-projects-mobile.png'), fullPage: true });
    await page.getByRole('button', { name: 'Pause animations', exact: true }).click();
    assert.notEqual(await page.locator('.project-card').first().evaluate(el => getComputedStyle(el).animationPlayState), 'running');
    await page.getByRole('button', { name: 'Play animations', exact: true }).click();
    results.push(`${width}px home/projects: no overflow, motion toggle works`);
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('.project-card').first().evaluate(el => getComputedStyle(el).animationName), 'none');
  await nav(page, 'Home');
  assert.equal(await page.locator('.phase-disc').first().evaluate(el => getComputedStyle(el).getPropertyValue('--sweep').trim()), '360deg');
  await page.goto(new URL('../offline/index.html', import.meta.url).href);
  await page.getByRole('button', { name: 'Explore projects', exact: true }).click(); await settle(page);
  assert.equal(await page.locator('.project-card').count(), 4);
  await page.getByRole('button', { name: 'Next page', exact: true }).click(); await settle(page);
  assert.equal(await page.locator('.about-screen').count(), 1);
  assert.deepEqual(errors, []);
  results.push('Reduced motion, offline navigation, and runtime error checks pass');
  await writeFile(out('refresh-verification.json'), JSON.stringify({ results, errors }, null, 2));
  console.log(JSON.stringify({ results, errors }, null, 2));
} finally { await browser.close(); }
