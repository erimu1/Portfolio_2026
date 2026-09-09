import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
const browser = await chromium.launch({channel:'chrome',headless:true});
try {
 const page = await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 const errors = [];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/#about',{waitUntil:'networkidle'});
 await page.locator('.site-header .logo').screenshot({path:fileURLToPath(new URL('logo-edge-orange.png',import.meta.url)),scale:'css'});
 await page.screenshot({path:fileURLToPath(new URL('logo-clean-about.png',import.meta.url)),fullPage:true});
 console.log(JSON.stringify({errors}));
} finally { await browser.close(); }
