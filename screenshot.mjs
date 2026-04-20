import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'http://localhost:4173';
const OUT = path.join(__dirname, 'assets/screenshots');
const VIEWPORT = { width: 390, height: 844, deviceScaleFactor: 2 };

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
});

async function snap(page, name) {
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false });
  console.log(`  ✓  ${name}.png`);
}

async function openTab(page, url) {
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.waitForSelector('#root > *', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 1200));
}

const page = await browser.newPage();
await page.setViewport(VIEWPORT);

// 1 — Capture tab (clean home)
console.log('1. Capture tab');
await openTab(page, `${BASE}?demo=0`);
await snap(page, '01-capture-tab');

// 2 — Capture tab with both cards visible (scroll slightly to see tips)
console.log('2. Capture tab scrolled');
await openTab(page, `${BASE}`);
await page.evaluate(() => window.scrollTo(0, 0));
await page.setViewport({ width: 390, height: 750, deviceScaleFactor: 2 });
await snap(page, '02-capture-options');
await page.setViewport(VIEWPORT);

// 3 — Analyse tab (demo mode with video stub)
console.log('3. Analyse tab');
await openTab(page, `${BASE}?demo=1&tab=analyse`);
await snap(page, '03-analyse-tab');

// 4 — Charts tab — Technique Radar
console.log('4. Charts tab — radar');
await openTab(page, `${BASE}?demo=1&tab=charts`);
await snap(page, '04-charts-radar');

// 5 — Charts tab scrolled to show line charts
console.log('5. Charts tab — line charts');
await page.evaluate(() => window.scrollTo(0, 700));
await new Promise(r => setTimeout(r, 400));
await snap(page, '05-charts-linecharts');

// 6 — Charts tab scrolled to bottom bar chart
console.log('6. Charts tab — bar chart');
await page.evaluate(() => window.scrollTo(0, 1600));
await new Promise(r => setTimeout(r, 400));
await snap(page, '06-charts-barchart');

// 7 — Feedback tab — score ring + summary
console.log('7. Feedback tab — score');
await openTab(page, `${BASE}?demo=1&tab=feedback`);
await snap(page, '07-feedback-score');

// 8 — Feedback tab — scrolled to cards
console.log('8. Feedback tab — cards');
await page.evaluate(() => window.scrollTo(0, 500));
await new Promise(r => setTimeout(r, 400));
await snap(page, '08-feedback-cards');

// 9 — Header close-up with score indicator
console.log('9. Header');
await openTab(page, `${BASE}?demo=1&tab=feedback`);
await page.setViewport({ width: 390, height: 160, deviceScaleFactor: 2 });
await snap(page, '09-header');
await page.setViewport(VIEWPORT);

await browser.close();
console.log('\nDone — all screenshots in assets/screenshots/');
