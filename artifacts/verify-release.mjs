import { chromium } from 'playwright';
import { strict as assert } from 'node:assert';
import { fileURLToPath } from 'node:url';
import { writeFile } from 'node:fs/promises';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [], errors = [];
const out = name => fileURLToPath(new URL(name, import.meta.url));
const ready = page => page.waitForFunction(() => !!document.querySelector('.page-transition--idle'));
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', e => { if (e.type() === 'error') errors.push(e.text()); });
  await page.goto('http://127.0.0.1:5173/#about', { waitUntil: 'networkidle' });
  for (const [width, height] of [[1440,900],[1366,768],[1280,720],[1024,768],[1536,864],[1920,1080],[1280,620]]) {
    await page.setViewportSize({ width, height });
    const metrics = await page.evaluate(() => {
      const footer = document.querySelector('footer').getBoundingClientRect();
      const nav = document.querySelector('.page-index').getBoundingClientRect();
      return { height: innerHeight, scrollHeight: document.documentElement.scrollHeight, width: innerWidth, scrollWidth: document.documentElement.scrollWidth, footerBottom: footer.bottom, navTop:nav.top, navBottom:nav.bottom };
    });
    assert(metrics.footerBottom <= height + 1, `About footer outside ${width}x${height}: ${JSON.stringify(metrics)}`);
    assert(metrics.navTop >= 0 && metrics.navBottom <= height, 'Page shortcuts outside viewport');
    assert(metrics.scrollWidth <= width, 'Horizontal overflow');
    results.push(`About ${width}x${height}: entire page and navigation fit`);
    if (width === 1366) await page.screenshot({ path:out('release-about-laptop.png'),fullPage:true });
  }
  for (const [width,height] of [[390,844],[320,568],[768,1024]]) {
    await page.setViewportSize({width,height});
    for (const target of ['Home','Projects','About','Contact']) {
      await page.getByRole('button',{name:`Go to ${target}`,exact:true}).click(); await ready(page);
      const nav = await page.locator('.page-index').boundingBox();
      assert(nav.y >= 0 && nav.y + nav.height <= height + 1, `${target} mobile shortcuts invisible`);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth), `${target} overflows`);
      if (width === 390 && target === 'About') await page.screenshot({path:out('release-about-mobile.png'),fullPage:true});
    }
    results.push(`${width}x${height}: all pages navigable, no horizontal overflow`);
  }
  await page.evaluate(() => Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{window.__copiedEmail=value;}}}));
  await page.getByRole('button',{name:'Copy email address',exact:true}).click();
  await page.waitForFunction(()=>window.__copiedEmail === 'erimuludag39@gmail.com');
  assert.equal(await page.getByRole('status').textContent(),'Email copied');
  await page.getByRole('button',{name:'Go to Home',exact:true}).click(); await ready(page);
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.getByRole('button',{name:'Play animations',exact:true}).click();
  assert.equal(await page.locator('.orbit-art').evaluate(el=>getComputedStyle(el).animationName),'orbit-spin');
  const rotation = await page.locator('.orbit-art').evaluate(async el=>{
    const a=el.getAnimations()[0]; a.pause(); a.currentTime=3500;
    await new Promise(resolve=>requestAnimationFrame(resolve));
    const m=new DOMMatrix(getComputedStyle(el).transform); a.play(); return Math.atan2(m.b,m.a)*180/Math.PI;
  });
  assert(Math.abs(rotation-90)<.1,'Orbit arrows do not rotate');
  await page.getByRole('button',{name:'Pause animations',exact:true}).click();
  assert.equal(await page.locator('.orbit-art').evaluate(el=>getComputedStyle(el).animationPlayState),'paused');
  results.push('Copy email feedback and rotating arrows with Pause support pass');
  await page.setViewportSize({width:1440,height:900});
  await page.screenshot({path:out('release-home.png'),fullPage:true});
  assert.deepEqual(errors,[]);
  await writeFile(out('release-verification.json'),JSON.stringify({results,errors},null,2));
  console.log(JSON.stringify({results,errors},null,2));
} finally {await browser.close();}
