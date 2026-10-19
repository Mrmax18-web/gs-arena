const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    channel: 'chrome',
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('https://gs-arena.vercel.app/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  const enterBtn = await page.waitForSelector('text=Enter BGMI Arena');
  await enterBtn.click();
  await page.waitForTimeout(2000);

  // Switch to FF BR
  console.log('Switching to FF BR...');
  const ffBrBtn = await page.waitForSelector('button:has-text("FF BR")');
  await ffBrBtn.click();
  await page.waitForTimeout(2000);

  const regLink = await page.waitForSelector('a[href="/registration"]');
  await regLink.click();
  await page.waitForTimeout(3000);

  let text = await page.evaluate(() => document.body.innerText);
  console.log('FF BR REGISTRATION TEXT:\n', text);

  // Switch to FF CS
  console.log('Switching to FF CS...');
  const ffCsBtn = await page.waitForSelector('button:has-text("FF CS")');
  await ffCsBtn.click();
  await page.waitForTimeout(2000);
  text = await page.evaluate(() => document.body.innerText);
  console.log('FF CS REGISTRATION TEXT:\n', text);

  await browser.close();
})();
