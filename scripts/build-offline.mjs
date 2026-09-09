import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
let html = await readFile(new URL('dist/index.html', root), 'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g)];
for (const match of scripts) {
  const js = await readFile(new URL(`dist/${match[1].replace(/^\.\//, '')}`, root), 'utf8');
  html = html.replace(match[0], () => `<script type="module">${js.replace(/<\/script/gi, '<\\/script')}</script>`);
}
const styles = [...html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"[^>]*>/g)];
for (const match of styles) {
  const css = await readFile(new URL(`dist/${match[1].replace(/^\.\//, '')}`, root), 'utf8');
  html = html.replace(match[0], () => `<style>${css}</style>`);
}
await mkdir(new URL('offline/', root), { recursive: true });
await writeFile(new URL('offline/index.html', root), html);
await copyFile(new URL('public/logo.png', root), new URL('offline/logo.png', root));
console.log('Updated offline/index.html with bundled scripts and styles.');
