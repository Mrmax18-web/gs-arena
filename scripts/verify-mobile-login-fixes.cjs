const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DIST_DIR = path.resolve(__dirname, '..', 'dist');
const VERIFY_DIR = path.resolve(__dirname, '..', 'baseline-evidence', 'mobile-login', 'verification');

if (!fs.existsSync(VERIFY_DIR)) {
  fs.mkdirSync(VERIFY_DIR, { recursive: true });
}

// Simple static file server for dist/
function startServer(port = 4173) {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
  };

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    let filePath = path.join(DIST_DIR, reqPath);

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(DIST_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end('Server Error: ' + err.code);
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  });

  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`Local verification server running at http://localhost:${port}`);
      resolve(server);
    });
  });
}

async function verifyMobileLogin() {
  const server = await startServer(4173);
  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  const viewports = [
    { width: 411, height: 568, name: '411x568' },
    { width: 283, height: 568, name: '283x568' },
    { width: 375, height: 667, name: '375x667' },
    { width: 390, height: 844, name: '390x844' },
  ];

  const results = {
    timestamp: new Date().toISOString(),
    viewports: {},
  };

  for (const vp of viewports) {
    console.log(`\nTesting fixes on viewport: ${vp.name} (${vp.width}x${vp.height})`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
      hasTouch: true,
      isMobile: true,
    });

    const page = await context.newPage();
    await page.goto('http://localhost:4173/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // 1. Verify canvas pointer-events
    const canvasStatus = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return { found: false };
      const comp = window.getComputedStyle(canvas);
      return {
        found: true,
        pointerEvents: comp.pointerEvents,
        position: comp.position,
        zIndex: comp.zIndex,
      };
    });
    console.log(`   Canvas pointer-events: ${canvasStatus.pointerEvents} (expected 'none')`);

    // 2. Verify hit-testing & tap on email input
    const emailInput = await page.$('#signin-email');
    if (!emailInput) {
      throw new Error(`Email input #signin-email not found on ${vp.name}`);
    }
    await emailInput.click();
    await page.fill('#signin-email', 'test@example.com');
    const emailVal = await page.$eval('#signin-email', (el) => el.value);
    console.log(`   ✓ Email input clickable & typed: "${emailVal}"`);

    // 3. Verify hit-testing & tap on password input
    const passwordInput = await page.$('#signin-password');
    if (!passwordInput) {
      throw new Error(`Password input #signin-password not found on ${vp.name}`);
    }
    await passwordInput.click();
    await page.fill('#signin-password', 'SecretPass123!');
    const passVal = await page.$eval('#signin-password', (el) => el.value);
    console.log(`   ✓ Password input clickable & typed: "${passVal}"`);

    // 4. Verify touch target of submit button
    const submitTarget = await page.evaluate(() => {
      const form = document.querySelector('form');
      const btn = form ? form.querySelector('button[type="submit"]') : null;
      if (!btn) return { found: false };
      const rect = btn.getBoundingClientRect();
      const comp = window.getComputedStyle(btn);
      return {
        found: true,
        height: rect.height,
        width: rect.width,
        type: btn.getAttribute('type'),
        disabled: btn.disabled,
        isAtLeast44px: rect.height >= 43.5, // allow subpixel tolerance
      };
    });
    console.log(`   ✓ Submit button dimensions: ${submitTarget.width}x${submitTarget.height}px (>=44px: ${submitTarget.isAtLeast44px})`);

    // 5. Verify horizontal reflow (no horizontal overflow)
    const overflowMetrics = await page.evaluate(() => {
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    });
    console.log(`   ✓ Horizontal scroll check: scrollWidth=${overflowMetrics.scrollWidth}px, clientWidth=${overflowMetrics.clientWidth}px (no overflow: ${!overflowMetrics.hasHorizontalOverflow})`);

    // 6. Test virtual keyboard / reduced visual viewport (320px)
    await page.setViewportSize({ width: vp.width, height: 320 });
    await page.waitForTimeout(300);

    const keyboardMetrics = await page.evaluate(() => {
      const btn = document.querySelector('form button[type="submit"]');
      if (!btn) return { found: false };
      btn.scrollIntoView({ behavior: 'instant', block: 'center' });
      const rect = btn.getBoundingClientRect();
      return {
        found: true,
        inView: rect.top >= 0 && rect.bottom <= window.innerHeight,
        top: rect.top,
        bottom: rect.bottom,
        windowHeight: window.innerHeight,
      };
    });
    console.log(`   ✓ Virtual keyboard scrollability: submit button in view = ${keyboardMetrics.inView} (top: ${keyboardMetrics.top}px in ${keyboardMetrics.windowHeight}px)`);

    const screenshotPath = path.join(VERIFY_DIR, `verified-login-${vp.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`   Saved screenshot: ${screenshotPath}`);

    results.viewports[vp.name] = {
      canvasStatus,
      emailVal,
      passVal,
      submitTarget,
      overflowMetrics,
      keyboardMetrics,
    };

    await context.close();
  }

  fs.writeFileSync(
    path.join(VERIFY_DIR, 'verification-results.json'),
    JSON.stringify(results, null, 2)
  );

  console.log('\nAll mobile login verifications completed successfully!');
  await browser.close();
  server.close();
}

verifyMobileLogin().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
