import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

mkdirSync('docs/screenshots', { recursive: true });
const base = process.env.BASE_URL ?? 'http://localhost:4321';
const browser = await chromium.launch();

const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
for (const [path, name] of [['/', 'home'], ['/menu', 'menu'], ['/reserve', 'reserve'], ['/order', 'order']]) {
  await desktop.goto(base + path, { waitUntil: 'networkidle' });
  await desktop.screenshot({ path: `docs/screenshots/${name}.png` });
}
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto(base + '/', { waitUntil: 'networkidle' });
await mobile.screenshot({ path: 'docs/screenshots/home-mobile.png' });
await browser.close();
console.log('screenshots saved');
