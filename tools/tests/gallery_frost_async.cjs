const assert = require('node:assert/strict');
const { chromium } = require('../../../playwright/node_modules/playwright-core');
const base = process.env.KP_BASE || 'http://127.0.0.1:19038/';

(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', e => errors.push(e.stack));
    await page.goto(base + 'gallery.html');
    await page.locator('#wizDevBtn').click();
    await page.locator('[data-md="iphone-15-pro"]').click();
    await page.locator('#wizSearch').fill('Cherry Dot');
    await page.waitForTimeout(500); // Search is debounced.
    const card = page.locator('.kpCard[data-file="kp-cherry-dot.png"]');
    await card.locator('canvas').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector('.kpCard[data-file="kp-cherry-dot.png"] canvas')?.dataset.renderedPreview);

    // Hold the shell load across the same canvas release used for offscreen cards.
    await page.evaluate(() => {
      const original = window.originalPrepare = KPFrostSamples.prepare;
      KPFrostSamples.prepare = async (...args) => {
        const result = await original(...args);
        return new Promise(resolve => window.releasePreview = () => resolve(result));
      };
    });
    await card.locator('.artwork-thumb').nth(1).click();
    await page.waitForFunction(() => window.releasePreview);
    await page.evaluate(() => {
      const canvas = document.querySelector('.kpCard[data-file="kp-cherry-dot.png"] canvas');
      window.previewSize = [canvas.width, canvas.height];
      canvas.width = canvas.height = 0;
      delete canvas.dataset.renderedPreview;
      window.releasePreview();
    });
    await page.waitForTimeout(500);
    assert.deepEqual(errors, []);
    assert.equal(await card.locator('canvas').getAttribute('data-rendered-preview'), null);

    // Reusing the card must still render the next selected background.
    await page.evaluate(() => {
      KPFrostSamples.prepare = window.originalPrepare;
      const canvas = document.querySelector('.kpCard[data-file="kp-cherry-dot.png"] canvas');
      [canvas.width, canvas.height] = window.previewSize;
    });
    await card.locator('.artwork-thumb').nth(2).click();
    await page.waitForFunction(() => document.querySelector('.kpCard[data-file="kp-cherry-dot.png"] canvas').dataset.renderedPreview);
    assert.deepEqual(errors, []);
    console.log('PASS: released canvas skips stale render and recovers on the next background');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
