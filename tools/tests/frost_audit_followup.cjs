const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium, webkit } = require('../../../playwright/node_modules/playwright-core');
const base = process.env.KP_BASE || 'http://127.0.0.1:19038/';
const out = process.env.KP_SHOTS || '../collaboration/frost-full-walkthrough-2026-11-24/followup';
fs.mkdirSync(out, { recursive: true });
const ready = p => p.waitForFunction(() => window.KPStudioCore?.info().previewReady && !KPStudioCore.info().loading);
const kioskReady = async p => { await p.locator('#setupDock:not([hidden])').waitFor(); await p.waitForFunction(() => !document.getElementById('showBtn').disabled); await p.waitForTimeout(500); };

(async () => {
  for (const engine of [chromium, webkit]) {
    const browser = await engine.launch();
    try {
      for (const [width, height] of [[390, 844], [1024, 768], [820, 1180]]) {
        const context = await browser.newContext({ viewport: { width, height }, hasTouch: true, isMobile: width === 390, reducedMotion: 'reduce' });
        const p = await context.newPage(), errors = [], posts = [];
        p.on('pageerror', e => errors.push(e.message));
        p.on('request', r => { if (r.method() === 'POST') posts.push(r.url()); });
        try {
          await p.goto(base);
          const models = await p.locator('#homeDevice option:not([disabled])').evaluateAll(es => es.map(e => e.value));
          assert.equal(models.length, 29);
          assert.equal(await p.locator('.pair-slide[aria-label*="ZODIAC"] .paired-phone.inverted').count(), 0);
          await p.locator('.pair-slide:not([hidden]) .campaign-copy a').first().click();
          await ready(p);
          assert.equal(await p.evaluate(() => KPStudioCore.info().rim), 'Smoke Frost');
          assert.equal(await p.evaluate(() => KPStudioCore.info().total), 49.99);
          assert((await p.locator('#studioPhone').innerText()).includes('Smoke Frost'));
          await p.goto(base+'customizer.html');await ready(p);assert.equal(await p.evaluate(()=>KPStudioCore.info().rim),'Smoke Frost');
          await p.evaluate(()=>KPStudioCore.setCase('MagSafe Clear'));await ready(p);await p.reload();await ready(p);assert.equal(await p.evaluate(()=>KPStudioCore.info().caseType),'MagSafe Clear');
          await p.goto(base+'customizer.html?staff=1&design=kp-cherry-dot.png&model=iphone-15-pro');await ready(p);assert.equal(await p.evaluate(()=>KPStudioCore.info().caseType),'MagSafe Clear');

          await p.goto(base + 'gallery.html');
          await p.locator('#wizDevBtn').click();
          const galleryModels = await p.locator('[data-md]').evaluateAll(es => [...new Set(es.map(e => e.dataset.md).filter(Boolean))]);
          await p.locator('[data-pill="Samsung"]').click();galleryModels.push(...await p.locator('[data-md]').evaluateAll(es=>es.map(e=>e.dataset.md).filter(Boolean)));assert.deepEqual([...models].sort(),galleryModels.sort());

          await p.goto(base + 'customizer.html?model=iphone-15-pro&design=zodiac-atlas-leo.png&case=rated&rim=Clear+Frost');
          await p.waitForFunction(()=>window.__kp?.state.photoImg&&!__kp.state.libraryLoading&&!__kp.printIssue());await ready(p);
          assert(!(await p.locator('#dpiLabel').innerText()).includes('PPI'));
          await p.locator('#studioNext').click();
          if (width === 390) assert((await p.locator('#stageCanvas').boundingBox()).height >= 240);
          await p.screenshot({ path: `${out}/${engine.name()}-${width}-preview.png` });

          await p.goto(base + 'instore/?store=West%20Chester%2C%20PA');
          await p.locator('[data-model="15P"]').click();
          await p.locator('#designSearch').fill('Leo · Star Atlas');
          await p.waitForTimeout(500);
          const tile = p.locator('.tile[data-file="zodiac-atlas-leo.png"]');
          await tile.locator('img:not(.wait)').waitFor();
          await tile.locator('.tname').click();
          await kioskReady(p);
          assert.equal(await p.locator('#kioskRims button').count(), 2);
          await p.locator('[data-rim="Clear Frost"]').click();
          await kioskReady(p);
          const clearSrc = await p.locator('#pv').getAttribute('src');
          await p.locator('[data-rim="Smoke Frost"]').click();
          await kioskReady(p);
          assert.notEqual(await p.locator('#pv').getAttribute('src'), clearSrc);
          await p.locator('[data-rim="Clear Frost"]').click();
          await kioskReady(p);
          await p.locator('#colorwayButtons button').nth(1).click();
          await kioskReady(p);
          assert.equal(await p.locator('[data-rim="Clear Frost"]').getAttribute('aria-pressed'), 'true');
          {
            const dock = await p.locator('#setupDock').boundingBox();
            for (const id of ['#glass', '#studioAccessoryOpen']) {
              const r = await p.locator(id).boundingBox();
              assert(r.y >= 0 && r.y + r.height < dock.y, id + ' must remain visible');
            }
          }
          await p.locator('#glass').check();
          await p.locator('#studioAccessoryOpen').click();
          await p.locator('[data-category="Wall chargers"]').click();
          await p.locator('[data-accessory="X26"]').click();
          await p.locator('#studioAccessoryDone').click();
          await p.screenshot({ path: `${out}/${engine.name()}-${width}-rim-setup.png` });
          const setupImage = await p.locator('#pv').getAttribute('src');
          await p.locator('#showBtn').click();
          const code = await p.locator('#code').innerText();
          assert(code.endsWith('-FC'));
          assert.equal(await p.locator('#counterPreview').getAttribute('src'), setupImage);
          assert((await p.locator('#counterCase').innerText()).includes('Clear Frost'));
          await p.waitForTimeout(300);await p.screenshot({path:out+'/'+engine.name()+'-'+width+'-code-debug.png'});assert(await p.locator('#code').evaluate(e => getComputedStyle(e).whiteSpace === 'nowrap' && e.scrollWidth <= e.clientWidth),JSON.stringify(await p.locator('#code').evaluate(e=>({width:e.clientWidth,scroll:e.scrollWidth,font:getComputedStyle(e).fontSize,whiteSpace:getComputedStyle(e).whiteSpace,text:e.textContent}))));
          assert(!await p.evaluate(() => document.documentElement.scrollWidth > innerWidth));
          await p.screenshot({ path: `${out}/${engine.name()}-${width}-counter.png` });
          const staff = await context.newPage();
          await staff.goto(base + 'instore/find.html?code=' + encodeURIComponent(code));
          await staff.locator('#ropen').click();
          await ready(staff);
          assert.equal(await staff.evaluate(() => KPStudioCore.info().rim), 'Clear Frost');
          assert.equal(await staff.evaluate(() => KPStudioCore.info().total), 99.97);
          await staff.close();
          await p.waitForTimeout(500);
          await p.locator('#editSetup').click();
          assert.equal(await p.locator('[data-rim="Clear Frost"]').getAttribute('aria-pressed'), 'true');
          await p.waitForTimeout(500);
          await p.locator('#s3 [data-act="reset"]').click();
          assert.equal(await p.evaluate(() => __kpInStore.state.rim), null);
          await p.locator('[data-model="16PM"]').click();
          await p.locator('#designSearch').fill('Aries');
          await p.waitForTimeout(500);
          await p.locator('.tile[data-file] img:not(.wait)').first().waitFor();
          await p.locator('.tile[data-file] .tname').first().click();
          await kioskReady(p);
          assert.deepEqual(await p.locator('#kioskRims button').allTextContents(), ['Clear Frost']);
          assert((await p.locator('#kioskRimLabel').innerText()).includes('Available'));
          assert.deepEqual(errors, []);
          assert.deepEqual(posts, []);
          console.log('PASS', engine.name(), width, 'CTA, model parity, larger preview, rim/background switching, accessories, counter, staff lookup, reset, clear-only model');
        } finally { await context.close(); }
      }
    } finally { await browser.close(); }
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
