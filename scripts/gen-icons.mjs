import puppeteer from 'puppeteer-core';
import { readFileSync } from 'fs';

const svg = readFileSync('/workspace/icons/icon.svg', 'utf8');
const html = `<!DOCTYPE html><html><body style="margin:0;background:#f5a623;width:512px;height:512px;display:flex;align-items:center;justify-content:center">${svg.replace('<svg', '<svg width="320" height="320"')}</body></html>`;

const browser = await puppeteer.launch({
  executablePath: '/usr/local/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 512, height: 512, deviceScaleFactor: 1 });
  await page.setContent(html);
  await page.screenshot({ path: '/workspace/icons/icon-512.png', type: 'png' });
  await page.setViewport({ width: 192, height: 192, deviceScaleFactor: 1 });
  await page.screenshot({ path: '/workspace/icons/icon-192.png', type: 'png' });
  console.log('icons generated');
} finally {
  await browser.close();
}
