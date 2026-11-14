const {chromium} = require('../../../playwright/node_modules/playwright-core');
(async () => {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto((process.env.KP_BASE || 'http://127.0.0.1:8766/') + 'instore/');
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await context.setOffline(true);
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(() => {
      const layouts = window.KP_PRINT_LAYOUTS;
      return layouts && ['Pro','Pro Max'].every(size => {
        const first = layouts['iPhone 17 '+size], second = layouts['iPhone 18 '+size];
        return first.mask === second.mask && JSON.stringify(first.box) === JSON.stringify(second.box);
      }) && layouts['iPhone 17 Pro'].mask !== layouts['iPhone 17 Pro Max'].mask;
    });
    console.log('PASS offline shared Pro and Pro Max preview layouts');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
