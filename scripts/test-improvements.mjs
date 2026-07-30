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

  const scrollBefore = await page.evaluate(() => window.scrollY);
  await page.evaluate(() => window.scrollTo(0, 400));
  const scrollMid = await page.evaluate(() => window.scrollY);

  await page.type('#search', '豊');
  await new Promise((r) => setTimeout(r, 300));
  const scrollAfterSearch = await page.evaluate(() => window.scrollY);

  await page.click('#btn-refresh');
  await new Promise((r) => setTimeout(r, 200));
  const toastText = await page.$eval('#toast', (el) => el.textContent);

  console.log('scroll preserved:', scrollAfterSearch >= 350);
  console.log('refresh toast (no change):', toastText || '(empty)');
  console.log('JS errors:', errors.length ? errors : 'none');
  if (errors.length) process.exit(1);
} finally {
  await browser.close();
}
