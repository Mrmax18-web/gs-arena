const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = path.resolve(__dirname, '..', 'baseline-evidence');

(async () => {
  console.log('=== TESTING CREATOR CONSOLE ON LIVE SITE ===');

  const browser = await chromium.launch({
    headless: true,
    channel: 'chrome',
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  // Pre-seed creator in localStorage
  await context.addInitScript(() => {
    localStorage.setItem('gs_arena_creator', 'true');
  });

  const page = await context.newPage();

  page.on('console', msg => console.log(`[CONSOLE ${msg.type()}]:`, msg.text()));
  page.on('pageerror', err => console.log(`[PAGEERROR]:`, err.message));

  page.on('response', async res => {
    if (res.status() >= 400 || res.url().includes('supabase') || res.url().includes('storage')) {
      const body = await res.text().catch(() => '');
      console.log(`[HTTP ${res.status()}]: ${res.request().method()} ${res.url()} -> ${body.slice(0, 300)}`);
    }
  });

  await page.goto('https://gs-arena.vercel.app/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  console.log('Entering arena...');
  const enterBtn = await page.waitForSelector('text=Enter BGMI Arena');
  await enterBtn.click();
  await page.waitForTimeout(2000);

  // Check if More Options is present and expand it
  console.log('Looking for More Options in sidebar...');
  const moreBtn = await page.waitForSelector('button:has-text("More Options")', { timeout: 5000 });
  await moreBtn.click();
  await page.waitForTimeout(1000);

  // Look for Creator Console link
  console.log('Looking for Creator Console link...');
  const creatorLink = await page.waitForSelector('a[href="/creator"]', { timeout: 5000 });
  await creatorLink.click();
  await page.waitForTimeout(3000);

  console.log('On Creator Page URL:', page.url());
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'live-creator-console.png'), fullPage: true });

  const pageText = await page.evaluate(() => document.body.innerText);
  console.log('CREATOR PAGE TEXT:\n', pageText.slice(0, 500));

  // Check Background / WebGL Shader Tab
  console.log('Switching to WebGL Shader tab...');
  const bgTab = await page.waitForSelector('button:has-text("WebGL Shader")', { timeout: 5000 });
  await bgTab.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'live-creator-bg-tab.png'), fullPage: true });

  // Test color changes
  const colorInputs = await page.$$('input[type="color"]');
  console.log(`Found ${colorInputs.length} color inputs in Background tab.`);
  if (colorInputs.length > 0) {
    console.log('Filling color input 0 with #DE0202...');
    await colorInputs[0].fill('#DE0202');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'live-creator-bg-color-changed.png'), fullPage: true });

    const saveBtn = await page.$('button:has-text("Save Globally")');
    if (saveBtn) {
      console.log('Clicking Save Globally...');
      await saveBtn.click();
      await page.waitForTimeout(3000);
    }
  }

  // Switch to Appearance Tab
  console.log('Switching to Appearance tab...');
  const appTab = await page.waitForSelector('button:has-text("Appearance")', { timeout: 5000 });
  await appTab.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'live-creator-appearance-tab.png'), fullPage: true });

  const appInputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input, button')).map(el => ({
      tag: el.tagName,
      type: el.type,
      placeholder: el.placeholder,
      text: el.innerText
    }));
  });
  console.log('APPEARANCE TAB ELEMENTS:\n', JSON.stringify(appInputs, null, 2));

  await browser.close();
  console.log('=== TEST CREATOR FLOW COMPLETE ===');
})();
