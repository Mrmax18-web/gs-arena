const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('https://gs-arena.vercel.app/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  console.log('Navigating into BGMI arena...');
  const enterBtn = await page.waitForSelector('text=Enter BGMI Arena');
  await enterBtn.click();
  await page.waitForTimeout(2000);

  console.log('Navigating to /registration...');
  const regLink = await page.waitForSelector('a[href="/registration"]');
  await regLink.click();
  await page.waitForTimeout(4000);

  const regText = await page.evaluate(() => document.body.innerText);
  console.log('=== REGISTRATION PAGE INNER TEXT ===\n', regText);

  await page.screenshot({ path: 'baseline-evidence/registration-inspected.png', fullPage: true });

  await browser.close();
})();
