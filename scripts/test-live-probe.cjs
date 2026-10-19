const { chromium } = require('playwright');

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({
    headless: true,
    channel: 'chrome',
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log(`[BROWSER CONSOLE ${msg.type()}]:`, msg.text()));
  page.on('pageerror', err => console.log('[BROWSER UNCAUGHT]:', err.message));

  console.log('Navigating to https://gs-arena.vercel.app/ ...');
  await page.goto('https://gs-arena.vercel.app/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log('Page title:', await page.title());
  console.log('URL:', page.url());

  await browser.close();
  console.log('Done probe.');
})();
