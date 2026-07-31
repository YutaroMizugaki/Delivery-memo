import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: '/usr/local/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('http://localhost:8080/', { waitUntil: 'networkidle2' });
  await page.waitForSelector('.card');

  const countText = await page.$eval('#count', (el) => el.textContent);
  console.log('count:', countText);

  await page.click('#search', { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.type('#search', '豊洲');
  await new Promise((r) => setTimeout(r, 300));
  const afterSearch = await page.$$eval('.card', (cards) => cards.length);
  console.log('search 豊洲 cards:', afterSearch);

  const hasMark = await page.$$eval('.card-name mark', (els) => els.length > 0);
  console.log('highlight mark:', hasMark);

  await page.click('#btn-add');
  await page.waitForSelector('#overlay.show');
  const bodyLocked = await page.$eval('body', (el) => el.classList.contains('modal-open'));
  console.log('modal body lock:', bodyLocked);

  await page.keyboard.press('Escape');
  await new Promise((r) => setTimeout(r, 150));
  const overlayHidden = await page.$eval('#overlay', (el) => !el.classList.contains('show'));
  console.log('escape closes modal:', overlayHidden);

  await page.evaluate(() => {
    localStorage.setItem('delivery-memo-records', '[]');
    localStorage.setItem('delivery-memo-shared', 'false');
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 300));
  const emptyCount = await page.$eval('#count', (el) => el.textContent);
  console.log('empty storage count:', emptyCount);
  const emptyMsg = await page.$('.empty').then((el) => el && el.evaluate((n) => n.textContent));
  console.log('empty message:', emptyMsg);

  await page.evaluate(() => {
    localStorage.removeItem('delivery-memo-records');
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForSelector('.card');
  const seeded = await page.evaluate(() => {
    const raw = localStorage.getItem('delivery-memo-records');
    return raw ? JSON.parse(raw).length : 0;
  });
  console.log('seed persisted count:', seeded);

  console.log('JS errors:', errors.length ? errors : 'none');
  if (errors.length) process.exit(1);
  if (!hasMark) { console.error('expected highlight'); process.exit(1); }
  if (!bodyLocked || !overlayHidden) { console.error('modal behavior failed'); process.exit(1); }
  if (emptyCount !== '0 / 0 件') { console.error('empty array reseeded'); process.exit(1); }
  if (seeded < 1) { console.error('seed not persisted'); process.exit(1); }
  console.log('SMOKE OK');
} finally {
  await browser.close();
}
