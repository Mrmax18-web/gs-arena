const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    channel: 'chrome',
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  page.on('console', msg => console.log(`[CONSOLE ${msg.type()}]: ${msg.text()}`));
  page.on('pageerror', err => console.log(`[PAGEERROR]: ${err.message}`));

  await page.goto('https://gs-arena.vercel.app/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  const enterBtn = await page.waitForSelector('text=Enter BGMI Arena');
  await enterBtn.click();
  await page.waitForTimeout(2000);

  const regLink = await page.waitForSelector('a[href="/registration"]');
  await regLink.click();

  console.log('Waiting for tournament data / skeleton to finish loading...');
  // Wait up to 15s for the form or closed state
  await page.waitForFunction(() => {
    return document.querySelector('input') || document.body.innerText.includes('Closed') || document.body.innerText.includes('Team Registration');
  }, { timeout: 15000 }).catch(e => console.log('Wait error:', e.message));

  const text = await page.evaluate(() => document.body.innerText);
  console.log('PAGE TEXT AFTER WAIT:\n', text);

  const inputs = await page.evaluate(() => Array.from(document.querySelectorAll('input')).map(i => ({ placeholder: i.placeholder, type: i.type, label: i.parentElement?.innerText })));
  console.log('INPUTS FOUND:\n', JSON.stringify(inputs, null, 2));

  await page.screenshot({ path: 'baseline-evidence/registration-loaded.png', fullPage: true });

  await browser.close();
})();
