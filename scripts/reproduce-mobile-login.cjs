const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const LIVE_URL = 'https://gs-arena.vercel.app';
const EVIDENCE_DIR = path.resolve(__dirname, '..', 'baseline-evidence', 'mobile-login');

if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

async function runReproduction() {
  console.log('--- REPRODUCING MOBILE LOGIN & FIRESTORE TRANSPORT BUGS ---');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  const viewports = [
    { width: 411, height: 568, name: '411x568' },
    { width: 283, height: 568, name: '283x568' },
    { width: 375, height: 667, name: '375x667' },
    { width: 390, height: 844, name: '390x844' },
  ];

  const report = {
    timestamp: new Date().toISOString(),
    viewports: {},
    consoleErrors: [],
    transportErrors: [],
    networkFailures: [],
  };

  for (const vp of viewports) {
    console.log(`\nTesting viewport: ${vp.name} (${vp.width}x${vp.height})`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
      hasTouch: true,
      isMobile: true,
    });

    const page = await context.newPage();

    page.on('console', (msg) => {
      const text = msg.text();
      const type = msg.type();
      if (type === 'error' || text.includes('transport errored') || text.includes('WebChannelConnection') || text.includes('Firestore')) {
        const item = { viewport: vp.name, type, text, location: msg.location() };
        report.consoleErrors.push(item);
        if (text.includes('transport errored') || text.includes('WebChannelConnection')) {
          report.transportErrors.push(item);
          console.warn(`   [Transport Error Detected on ${vp.name}]:`, text);
        }
      }
    });

    page.on('requestfailed', (req) => {
      report.networkFailures.push({
        viewport: vp.name,
        url: req.url(),
        method: req.method(),
        error: req.failure() ? req.failure().errorText : 'failed',
      });
    });

    // Navigate to /login via root SPA to bypass Vercel 404
    console.log(`Navigating to ${LIVE_URL} and routing to /login at ${vp.name}...`);
    try {
      await page.goto(LIVE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(1500);
      await page.evaluate(() => {
        window.history.pushState({}, '', '/login');
        window.dispatchEvent(new PopStateEvent('popstate'));
      });
      await page.waitForTimeout(2000);
    } catch (e) {
      console.error('Navigation error:', e.message);
    }

    const screenshotPath = path.join(EVIDENCE_DIR, `login-${vp.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`   Saved screenshot: ${screenshotPath}`);

    // Inspect Hit-Testing on Email, Password, and Submit button
    const hitTestResults = await page.evaluate(() => {
      const results = {};

      const emailInput = document.querySelector('input[type="email"]') || document.querySelector('input[name="email"]') || document.querySelector('input[placeholder*="email" i]');
      const passwordInput = document.querySelector('input[type="password"]') || document.querySelector('input[placeholder*="password" i]');
      const submitBtn = document.querySelector('button[type="submit"]') || document.querySelector('form button') || Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Sign In') || b.innerText.includes('Log In'));

      const inspectElement = (el, name) => {
        if (!el) {
          return { found: false, name };
        }
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        let hitElement = null;
        let interceptedBy = null;
        if (centerX >= 0 && centerY >= 0 && centerX <= window.innerWidth && centerY <= window.innerHeight) {
          hitElement = document.elementFromPoint(centerX, centerY);
          if (hitElement !== el && !el.contains(hitElement)) {
            interceptedBy = {
              tagName: hitElement.tagName,
              id: hitElement.id,
              className: hitElement.className,
              computedZIndex: window.getComputedStyle(hitElement).zIndex,
              computedPosition: window.getComputedStyle(hitElement).position,
              computedPointerEvents: window.getComputedStyle(hitElement).pointerEvents,
              outerHTML: hitElement.outerHTML ? hitElement.outerHTML.substring(0, 150) : '',
            };
          }
        }

        const comp = window.getComputedStyle(el);
        return {
          found: true,
          name,
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          computedZIndex: comp.zIndex,
          computedPosition: comp.position,
          computedPointerEvents: comp.pointerEvents,
          computedOverflow: comp.overflow,
          intercepted: !!interceptedBy,
          interceptedBy,
        };
      };

      results.email = inspectElement(emailInput, 'Email Input');
      results.password = inspectElement(passwordInput, 'Password Input');
      results.submit = inspectElement(submitBtn, 'Submit Button');

      // Check form hierarchy
      const form = document.querySelector('form');
      results.form = {
        found: !!form,
        containsEmail: form && emailInput ? form.contains(emailInput) : false,
        containsPassword: form && passwordInput ? form.contains(passwordInput) : false,
        containsSubmit: form && submitBtn ? form.contains(submitBtn) : false,
      };

      // Check canvas
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const cStyle = window.getComputedStyle(canvas);
        results.canvas = {
          found: true,
          position: cStyle.position,
          zIndex: cStyle.zIndex,
          pointerEvents: cStyle.pointerEvents,
        };
      }

      // Check parent containers for overflow
      let curr = emailInput ? emailInput.parentElement : null;
      results.ancestorOverflows = [];
      while (curr && curr !== document.body) {
        const s = window.getComputedStyle(curr);
        if (s.overflow !== 'visible' || s.overflowY !== 'visible' || s.overflowX !== 'visible') {
          results.ancestorOverflows.push({
            tagName: curr.tagName,
            className: curr.className,
            overflow: s.overflow,
            overflowY: s.overflowY,
            position: s.position,
            zIndex: s.zIndex,
          });
        }
        curr = curr.parentElement;
      }

      return results;
    });

    console.log(`   Hit-test Email: intercepted = ${hitTestResults.email?.intercepted}`);
    if (hitTestResults.email?.intercepted) {
      console.log('     Intercepted by:', hitTestResults.email.interceptedBy);
    }
    console.log(`   Hit-test Password: intercepted = ${hitTestResults.password?.intercepted}`);
    console.log(`   Hit-test Submit: intercepted = ${hitTestResults.submit?.intercepted}`);
    console.log(`   Form wraps Email: ${hitTestResults.form?.containsEmail}, Password: ${hitTestResults.form?.containsPassword}, Submit: ${hitTestResults.form?.containsSubmit}`);
    if (hitTestResults.canvas) {
      console.log('   Canvas style:', hitTestResults.canvas);
    }

    // Try tapping inputs via Playwright click/tap
    let canTapEmail = false;
    let canTapPassword = false;
    let canTapSubmit = false;

    try {
      const emailInput = await page.$('input[type="email"]');
      if (emailInput) {
        await emailInput.click({ timeout: 3000 });
        canTapEmail = true;
        console.log('   ✓ Successfully clicked Email Input');
      }
    } catch (err) {
      console.warn('   ! Failed to click Email Input:', err.message);
    }

    try {
      const passInput = await page.$('input[type="password"]');
      if (passInput) {
        await passInput.click({ timeout: 3000 });
        canTapPassword = true;
        console.log('   ✓ Successfully clicked Password Input');
      }
    } catch (err) {
      console.warn('   ! Failed to click Password Input:', err.message);
    }

    // Test Keyboard / Reduced Visual Viewport (Height reduced to 320px)
    console.log(`   Simulating on-screen keyboard on ${vp.name}...`);
    await page.setViewportSize({ width: vp.width, height: 320 });
    await page.waitForTimeout(500);

    const keyboardScreenshotPath = path.join(EVIDENCE_DIR, `login-keyboard-${vp.name}.png`);
    await page.screenshot({ path: keyboardScreenshotPath });

    const scrollMetrics = await page.evaluate(() => {
      const submitBtn = document.querySelector('button[type="submit"]') || Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Sign In'));
      if (!submitBtn) return { foundSubmit: false };

      // Try scrolling submit button into view
      submitBtn.scrollIntoView({ behavior: 'instant', block: 'center' });
      const rect = submitBtn.getBoundingClientRect();
      const inView = rect.top >= 0 && rect.bottom <= window.innerHeight;

      return {
        foundSubmit: true,
        rect: { top: rect.top, bottom: rect.bottom, height: rect.height },
        inView,
        windowInnerHeight: window.innerHeight,
        documentScrollHeight: document.documentElement.scrollHeight,
        bodyScrollHeight: document.body.scrollHeight,
      };
    });

    console.log(`   Submit button visible with keyboard: ${scrollMetrics.inView} (rect.top: ${scrollMetrics.rect?.top}, winH: ${scrollMetrics.windowInnerHeight})`);

    report.viewports[vp.name] = {
      hitTestResults,
      canTapEmail,
      canTapPassword,
      canTapSubmit,
      scrollMetrics,
    };

    await context.close();
  }

  fs.writeFileSync(
    path.join(EVIDENCE_DIR, 'reproduction-report.json'),
    JSON.stringify(report, null, 2)
  );
  console.log('\nReproduction finished. Report saved to reproduction-report.json');

  await browser.close();
}

runReproduction().catch((err) => {
  console.error('Fatal reproduction error:', err);
  process.exit(1);
});
