import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const outputDir = fileURLToPath(new URL('./', import.meta.url));
await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({channel: 'chrome', headless: true});
const report = {checks: [], errors: [], requestsFailed: [], views: []};
function check(name, actual, expected = true) {
  const pass = actual === expected;
  report.checks.push({name, pass, actual, expected});
  if (!pass) console.log(`FAIL ${name}: ${JSON.stringify(actual)} != ${JSON.stringify(expected)}`);
}
async function snapshot(page, name) {
  await page.screenshot({path: `${outputDir}/${name}.png`, fullPage: true});
  const layout = await page.evaluate(() => ({
    viewport: {width: innerWidth, height: innerHeight},
    document: {width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight},
    headings: [...document.querySelectorAll('h1')].map(el => el.textContent),
    focused: document.activeElement?.outerHTML.slice(0, 180),
    rectangles: [...document.querySelectorAll('.phase, .project-card, .name-block, .vertical-label, .home-bottom, .explore-arrow, .link-grid')].map(el => {
      const r = el.getBoundingClientRect();
      return {class: el.className, x:r.x, y:r.y, width:r.width, height:r.height};
    }),
  }));
  report.views.push({name,...layout});
  check(`${name}: no horizontal overflow`, layout.document.width <= layout.viewport.width);
}
async function settled(page) {
  await page.waitForTimeout(1100);
}
async function makePage(viewport, reducedMotion = 'no-preference') {
  const context = await browser.newContext({ viewport, deviceScaleFactor:1, reducedMotion });
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('console', message => { if(message.type() === 'error') report.errors.push(message.text()); });
  page.on('response', response => { if(response.status() >= 400) report.requestsFailed.push({url: response.url(), status: response.status()}); });
  await page.goto('http://127.0.0.1:5173', {waitUntil:'networkidle'});
  await settled(page);
  return {context,page};
}
try {
  const {context,page} = await makePage({width:1440,height:900});
  await snapshot(page,'desktop-home');
  check('Home circles are decorative', await page.locator('.phase-row button').count(), 0);
  await page.locator('.explore-arrow').click();
  await settled(page);
  check('Home arrow opens projects', await page.locator('.projects-screen').count(), 1);
  await snapshot(page,'desktop-projects');
  check('Four project cards', await page.locator('.project-card').count(), 4);
  await page.locator('.project-card').first().click();
  await settled(page);
  check('Card opens project detail', await page.locator('.project-detail').count(), 1);
  await snapshot(page,'desktop-project-detail');
  await page.keyboard.press('Escape');
  await settled(page);
  check('Escape closes detail', await page.locator('.project-card').count(), 4);
  check('Focus restored to selected card', await page.evaluate(() => document.activeElement?.id), 'project-card-0');
  await page.locator('.projects-next').click();
  await settled(page);
  check('Pagination changes concepts', await page.locator('.project-card').first().getAttribute('id'), 'project-card-4');
  await snapshot(page,'desktop-projects-page2');
  await page.locator('.menu-button').click();
  await settled(page);
  await snapshot(page,'desktop-menu');
  check('Four navigation cards', await page.locator('.nav-card').count(), 4);
  await page.locator('.nav-card').filter({hasText: /home/i}).click();
  await settled(page);
  check('Menu home navigation', await page.locator('.home-screen').count(), 1);
  await page.goBack();
  await settled(page);
  check('Browser Back restores projects', await page.locator('.projects-screen').count(), 1);
  await context.close();
  for (const width of [390, 375]) {
    const {context,page} = await makePage({width,height:844});
    await snapshot(page,`mobile-${width}-home`);
    await page.locator('.explore-arrow').click();
    await settled(page);
    await snapshot(page,`mobile-${width}-projects`);
    await page.locator('.project-card').first().click();
    await settled(page);
    await snapshot(page,`mobile-${width}-detail`);
    await page.locator('.menu-button').click();
    await settled(page);
    await snapshot(page,`mobile-${width}-menu`);
    await context.close();
  }
  const reduced = await makePage({width:1280,height:800}, 'reduce');
  await reduced.page.locator('.explore-arrow').click();
  await reduced.page.waitForTimeout(100);
  check('Reduced motion navigation arrives immediately', await reduced.page.locator('.projects-screen').count(), 1);
  await snapshot(reduced.page,'reduced-motion-projects');
  await reduced.context.close();
} catch (error) {
  report.errors.push(error.stack || error.message);
} finally {
  await browser.close();
  check('No runtime or console errors', report.errors.length, 0);
  check('No failed resource requests', report.requestsFailed.length, 0);
  await writeFile(`${outputDir}/browser-report.json`, JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
  process.exitCode = report.checks.some(item => !item.pass) ? 1 : 0;
}
