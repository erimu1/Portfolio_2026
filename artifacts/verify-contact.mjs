import { chromium } from 'playwright';
import { strict as assert } from 'node:assert';
import { fileURLToPath } from 'node:url';
import { writeFile } from 'node:fs/promises';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [], results = [];
const out = name => fileURLToPath(new URL(name, import.meta.url));
const settle = page => page.waitForFunction(() => !!document.querySelector('.page-transition--idle'));
const nameText = page => page.locator('.scramble-display').allTextContents().then(x => x.join(''));
async function nav(page, name) {
  await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await page.locator('.nav-card').filter({ has: page.locator('.card-label', { hasText: name }) }).click();
  await settle(page);
}
async function finishEntrance(page) {
  await page.evaluate(() => Promise.all(document.getAnimations().filter(a => a.effect?.getTiming().iterations !== Infinity).map(a => a.finished.catch(() => {}))));
}
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', e => { if (e.type() === 'error') errors.push(e.text()); });
  await page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => [...document.querySelectorAll('.scramble-display')].map(x => x.textContent).join('') !== 'ERIM ULUDAG');
  const nameWidth = await page.locator('.scramble-name').evaluate(el => el.getBoundingClientRect().width);
  await page.waitForFunction(() => [...document.querySelectorAll('.scramble-display')].map(x => x.textContent).join('') === 'ERIM ULUDAG');
  assert.equal(await page.locator('.scramble-name').evaluate(el => el.getBoundingClientRect().width), nameWidth);
  assert.equal(await page.locator('.location').textContent(), 'Schiedam, NL');
  const sweep = await page.locator('.phase-disc').first().evaluate(async el => {
    const animation = el.getAnimations()[0];
    const timing = animation.effect.getTiming();
    animation.pause();
    const samples = [];
    for (const t of [0, 900, 2400, 19400, 20000, 20900]) {
      animation.currentTime = Number(timing.delay) + t;
      await new Promise(resolve => requestAnimationFrame(resolve));
      samples.push(parseFloat(getComputedStyle(el).getPropertyValue('--sweep')));
    }
    animation.play();
    return { samples, duration: timing.duration, repeats: timing.iterations === Infinity };
  });
  assert.equal(sweep.duration, 20000); assert(sweep.repeats);
  assert(sweep.samples[1] > 0 && sweep.samples[1] < 360);
  assert.equal(sweep.samples[2], 360);
  assert(sweep.samples[3] > 0 && sweep.samples[3] < 360);
  assert.equal(sweep.samples[4], 0);
  assert(Math.abs(sweep.samples[1] - sweep.samples[5]) < .01);
  results.push('Name scrambles then locks with no width shift; circle fills repeat smoothly on a 20-second cycle');
  await page.getByRole('button', { name: 'Pause animations', exact: true }).click();
  await page.screenshot({ path: out('contact-update-home.png'), fullPage: true });
  await nav(page, 'Connect');
  assert.equal(new URL(page.url()).hash, '#contact');
  assert.equal(await page.getByRole('link', { name: 'erimuludag39@gmail.com' }).getAttribute('href'), 'mailto:erimuludag39@gmail.com');
  assert.equal(await page.getByRole('link', { name: '06 3606 4366' }).getAttribute('href'), 'tel:+31636064366');
  assert.equal(await page.getByRole('img', { name: 'Space for a portrait of Erim Uludag' }).count(), 1);
  assert.equal(await page.locator('.canvas').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(33, 78, 59)');
  await page.screenshot({ path: out('contact-desktop.png'), fullPage: true });
  await page.goBack(); await settle(page);
  assert.equal(await page.locator('.home-screen').count(), 1);
  await nav(page, 'About');
  assert.match(await page.locator('.about-copy').textContent(), /Hogeschool Rotterdam/);
  assert.match(await page.locator('.about-copy').textContent(), /Applied Data Science & Machine Learning/);
  assert(!await page.getByText('Grafisch Lyceum Rotterdam', { exact: false }).count());
  await page.screenshot({ path: out('education-desktop.png'), fullPage: true });
  results.push('Contact links, portrait space, pine green, profile and school updates, and browser history pass');
  for (const width of [390, 320, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await nav(page, 'Connect');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.equal(await page.locator('html').evaluate(el => getComputedStyle(el).scrollbarWidth), 'none');
    if (width === 390) {
      await page.screenshot({ path: out('contact-mobile.png'), fullPage: true });
      await page.mouse.wheel(0, 500);
      await page.waitForFunction(() => scrollY > 0);
    }
    await nav(page, 'Home');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    results.push(`${width}px: hidden scrollbar, responsive home/contact without horizontal overflow`);
  }
  await page.getByRole('button', { name: 'Play animations', exact: true }).click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => [...document.querySelectorAll('.scramble-display')].map(x => x.textContent).join('') === 'ERIM ULUDAG');
  assert.equal(await nameText(page), 'ERIM ULUDAG');
  assert.equal(await page.locator('.phase-disc').first().evaluate(el => getComputedStyle(el).animationName), 'none');
  await page.goto(new URL('../offline/index.html', import.meta.url).href + '#contact');
  assert.equal(await page.getByRole('link', { name: 'erimuludag39@gmail.com' }).getAttribute('href'), 'mailto:erimuludag39@gmail.com');
  await nav(page, 'Home');
  assert.equal(await nameText(page), 'ERIM ULUDAG');
  assert.deepEqual(errors, []);
  results.push('Wheel scrolling, live reduced-motion preference, and offline contact navigation pass; no runtime errors');
  await writeFile(out('contact-verification.json'), JSON.stringify({ results, errors }, null, 2));
  console.log(JSON.stringify({ results, errors }, null, 2));
} finally { await browser.close(); }
