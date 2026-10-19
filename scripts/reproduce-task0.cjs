const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = path.resolve(__dirname, '..', 'baseline-evidence');
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

(async () => {
  console.log('=== STARTING TASK 0 LIVE REPRODUCTION ===');

  const browser = await chromium.launch({
    headless: true,
    channel: 'chrome',
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  const consoleLogs = [];
  const networkLogs = [];
  const failedRequests = [];

  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    consoleLogs.push({ type, text, timestamp: new Date().toISOString() });
    console.log(`[BROWSER ${type.toUpperCase()}]: ${text}`);
  });

  page.on('pageerror', err => {
    consoleLogs.push({ type: 'pageerror', text: err.message, stack: err.stack, timestamp: new Date().toISOString() });
    console.error(`[BROWSER UNCAUGHT]: ${err.message}`);
  });

  page.on('request', req => {
    networkLogs.push({
      event: 'request',
      url: req.url(),
      method: req.method(),
      headers: req.headers(),
      postData: req.postData(),
      timestamp: new Date().toISOString(),
    });
  });

  page.on('response', async res => {
    let body = null;
    try {
      if (res.url().includes('supabase') || res.status() >= 400 || res.url().includes('storage')) {
        body = await res.text().catch(() => null);
      }
    } catch (e) {}

    const entry = {
      event: 'response',
      url: res.url(),
      method: res.request().method(),
      status: res.status(),
      statusText: res.statusText(),
      headers: res.headers(),
      body: body ? (body.length > 2000 ? body.slice(0, 2000) + '...[truncated]' : body) : null,
      timestamp: new Date().toISOString(),
    };
    networkLogs.push(entry);

    if (res.status() >= 400) {
      failedRequests.push(entry);
      console.log(`[FAILED HTTP ${res.status()}]: ${res.request().method()} ${res.url()} -> ${entry.body}`);
    }
  });

  // 1. Visit Home
  console.log('\n--- 1. Navigating to Home ---');
  await page.goto('https://gs-arena.vercel.app/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '01-home.png'), fullPage: true });

  // Click "Enter BGMI Arena"
  console.log('Clicking "Enter BGMI Arena"...');
  const enterCard = await page.waitForSelector('text=Enter BGMI Arena', { timeout: 10000 });
  await enterCard.click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '01b-leaderboard.png'), fullPage: true });

  // 2. Test Registration Flow
  console.log('\n--- 2. Testing Registration Navigation ---');
  const regLink = await page.waitForSelector('a[href="/registration"]', { timeout: 10000 });
  await regLink.click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '02-registration-step1.png'), fullPage: true });

  // Auto-fill or fill fields
  const autoFillBtn = await page.$('button:has-text("Auto-fill")');
  if (autoFillBtn) {
    console.log('Clicking Auto-fill...');
    await autoFillBtn.click();
    await page.waitForTimeout(1000);
  } else {
    console.log('Filling fields manually...');
    await page.fill('input[placeholder*="Soul"]', 'QA_TEST_Team_Phoenix');
    await page.fill('input[type="email"]', 'qa_test_leader@example.com');
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '03-registration-filled.png'), fullPage: true });

  // Click Next to Step 2
  const nextBtn1 = await page.waitForSelector('button:has-text("Next: Payment Details")');
  await nextBtn1.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '04-registration-step2.png'), fullPage: true });

  // Check if payment proof upload input is present
  const fileInput = await page.$('input[type="file"]');
  console.log(`Payment file input found: ${!!fileInput}`);
  if (fileInput) {
    // Create dummy image
    const dummyImg = path.join(ARTIFACT_DIR, 'qa-test-receipt.png');
    const pngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync(dummyImg, pngBuffer);

    console.log('Attempting file upload for payment screenshot...');
    const reqCountBefore = networkLogs.length;
    await fileInput.setInputFiles(dummyImg);
    await page.waitForTimeout(6000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '05-registration-after-upload.png'), fullPage: true });

    const uploadRequests = networkLogs.slice(reqCountBefore);
    console.log(`Requests during file upload: ${uploadRequests.length}`);
    for (const r of uploadRequests) {
      if (r.url.includes('supabase') || r.url.includes('storage') || r.url.includes('firebase')) {
        console.log(`[STORAGE TRAFFIC]: ${r.event} ${r.method || ''} ${r.url} -> status: ${r.status || 'pending'}`);
        if (r.body) console.log(`[RESPONSE BODY]: ${r.body}`);
      }
    }
  }

  // 3. Navigate to Creator Login
  console.log('\n--- 3. Elevating Session to Creator ---');
  const signInBtn = await page.$('button:has-text("Sign In")');
  if (signInBtn) {
    await signInBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '06-login-page.png'), fullPage: true });

    const secretBtn = await page.$('button[aria-label="Secret Creator Authorization"]');
    if (secretBtn) {
      console.log('Opening Secret Creator Dialog...');
      await secretBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(ARTIFACT_DIR, '07-secret-modal.png'), fullPage: true });

      const codeInput = await page.$('input[placeholder="••••••"]');
      if (codeInput) {
        console.log('Entering code 130620...');
        await codeInput.fill('130620');
        const verifyBtn = await page.$('button:has-text("Verify Code")');
        if (verifyBtn) await verifyBtn.click();
        await page.waitForTimeout(3000);
      }
    }
  }

  await page.screenshot({ path: path.join(ARTIFACT_DIR, '08-after-creator-elevation.png'), fullPage: true });
  console.log('Current URL after elevation:', page.url());

  // 4. Test Creator Console Tabs
  // If not at /creator, navigate via More Options or sidebar
  if (!page.url().includes('/creator')) {
    const moreOptions = await page.$('button:has-text("More Options")');
    if (moreOptions) {
      await moreOptions.click();
      await page.waitForTimeout(500);
    }
    const creatorLink = await page.$('a[href="/creator"]');
    if (creatorLink) {
      await creatorLink.click();
      await page.waitForTimeout(3000);
    }
  }

  console.log('\n--- 4. Testing Creator Console ---');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '09-creator-console-main.png'), fullPage: true });

  // Test Background Tab
  const bgTab = await page.$('button:has-text("WebGL Shader")') || await page.$('button:has-text("Background")');
  if (bgTab) {
    console.log('Opening WebGL Shader / Background Tab...');
    await bgTab.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '10-creator-background-tab.png'), fullPage: true });

    // Try changing colors
    const colorInputs = await page.$$('input[type="color"]');
    console.log(`Found ${colorInputs.length} color picker inputs in Background Tab.`);
    if (colorInputs.length > 0) {
      console.log('Changing color inputs...');
      await colorInputs[0].fill('#ff0000');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(ARTIFACT_DIR, '11-creator-background-color-changed.png'), fullPage: true });

      const saveGlobalBtn = await page.$('button:has-text("Save Globally")');
      if (saveGlobalBtn) {
        console.log('Clicking Save Globally...');
        await saveGlobalBtn.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: path.join(ARTIFACT_DIR, '12-creator-background-saved.png'), fullPage: true });
      }
    }
  }

  // Test Appearance Tab
  const appearanceTab = await page.$('button:has-text("Appearance")');
  if (appearanceTab) {
    console.log('\nOpening Appearance Tab...');
    await appearanceTab.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '13-creator-appearance-tab.png'), fullPage: true });

    // Look for logo file upload or input
    const fileInputs = await page.$$('input[type="file"]');
    console.log(`File inputs in Appearance Tab: ${fileInputs.length}`);
    const textInputs = await page.$$eval('input', els => els.map(e => ({ type: e.type, placeholder: e.placeholder, value: e.value })));
    console.log('Appearance tab inputs:', JSON.stringify(textInputs, null, 2));
  }

  // Write detailed reproduction report
  const report = {
    timestamp: new Date().toISOString(),
    url: 'https://gs-arena.vercel.app/',
    consoleErrors: consoleLogs.filter(l => l.type === 'error' || l.type === 'pageerror'),
    consoleWarnings: consoleLogs.filter(l => l.type === 'warning'),
    failedHttpRequests: failedRequests,
    storageRequests: networkLogs.filter(n => n.url.includes('supabase') || n.url.includes('storage')),
    summary: {
      totalConsoleErrors: consoleLogs.filter(l => l.type === 'error' || l.type === 'pageerror').length,
      totalFailedHttpRequests: failedRequests.length,
    }
  };

  fs.writeFileSync(path.join(ARTIFACT_DIR, 'task0-detailed-report.json'), JSON.stringify(report, null, 2));

  console.log('\n=== TASK 0 LIVE REPRODUCTION FINISHED ===');
  await browser.close();
})();
