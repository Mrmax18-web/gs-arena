const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage();
  await page.goto('https://gs-arena.vercel.app/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  const scriptSrcs = await page.$$eval('script[src]', els => els.map(e => e.src));
  console.log('Script bundles:', scriptSrcs);

  for (const src of scriptSrcs) {
    if (src.includes('index-') || src.includes('main-') || src.includes('/assets/')) {
      const resp = await page.request.get(src);
      const text = await resp.text();
      console.log(`Checking bundle ${src} (length: ${text.length})...`);
      const supabaseMatches = text.match(/https:\/\/[a-z0-9-]+\.supabase\.co/g);
      if (supabaseMatches) {
        console.log('Found Supabase URL in bundle:', supabaseMatches);
      } else {
        console.log('No supabase.co URL in bundle');
      }

      const bucketMatches = text.match(/GS-ARENA/gi);
      console.log('GS-ARENA occurrences:', bucketMatches?.length || 0);

      const hasSupabaseClient = text.includes('createClient') || text.includes('supabase');
      console.log('Contains supabase client references:', hasSupabaseClient);
    }
  }

  await browser.close();
})();
