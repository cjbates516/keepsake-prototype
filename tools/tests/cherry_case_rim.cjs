// Serve the repository locally and set KP_BASE to its URL to test real storefront canvases.
const assert = require('node:assert/strict');
const { chromium, webkit } = require(process.env.PW_CORE || '../../../playwright/node_modules/playwright-core');
const base = (process.env.KP_BASE || 'http://127.0.0.1:8766/').replace(/\/?$/, '/');

async function measure(canvas, url) {
  const photo = new Image();
  photo.src = url;
  await photo.decode();
  const { width: w, height: h } = canvas;
  const ref = document.createElement('canvas');
  ref.width = w; ref.height = h;
  const ctx = ref.getContext('2d');
  ctx.drawImage(photo, 0, 0, w, h);
  const bare = ctx.getImageData(0, 0, w, h).data;
  const seen = canvas.getContext('2d').getImageData(0, 0, w, h).data;
  let outside = 0, blue = 0, bodyEnd = -1, artEnd = -1, wrongFinish = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = 4 * (y * w + x);
    if (seen[i+3] > bare[i+3] + 4) outside++;
    // Compare the exposed camera area so a stale render of a previous finish cannot pass.
    if (y > h*.08 && y < h*.29 && bare[i+3] > 249 &&
        Math.abs(bare[i]-seen[i]) + Math.abs(bare[i+1]-seen[i+1]) + Math.abs(bare[i+2]-seen[i+2]) > 30) wrongFinish++;
    if (Math.abs(x-w/2) >= w*.05 || y <= h*.52) continue;
    if (bare[i+3] > 240) bodyEnd = y;
    if (seen[i+3] > 220 && seen[i+2]-seen[i] > 38 && seen[i+1]-seen[i] > 22) { blue++; artEnd = y; }
  }
  return { outside, blue, wrongFinish, rim: bodyEnd-artEnd, h };
}

(async () => {
  for (const engine of [chromium, webkit]) {
    const browser = await engine.launch();
    try {
      const page = await browser.newPage({viewport:{width:390,height:844},hasTouch:true});
      const photos = new Map();
      page.on('response', response => {
        const u = new URL(response.url()), file = u.pathname.split('/').pop();
        if (/^i18p(m)?-.+\.svg$/.test(file) && response.ok()) photos.set(file,u);
      });
      for (const size of ['p','pm']) for (const surface of ['gallery','customizer']) {
        const model = 'iphone-18-pro' + (size==='pm'?'-max':'');
        await page.goto(base + surface + '.html?' + (surface==='gallery'?'q=Cherry%20Dot&device=':'design=kp-cherry-dot.png&model=') + model);
        const card = page.locator('.kpCard[data-file="kp-cherry-dot.png"]');
        const canvas = surface==='gallery' ? card.locator('canvas') : page.locator('#stageCanvas');
        for (const finish of ['Black','Glacier','Burgundy','Silver']) {
          await (surface==='gallery'?card:page.locator('#colorSwatches')).locator('button[title="'+finish+'"]').click();
          const file = 'i18'+size+'-'+finish.toLowerCase()+'.svg';
          let m;
          for (let i=0; i<50; i++) {
            const u = photos.get(file);
            if (u) {
              assert(u.searchParams.has('v'), 'Unversioned case photo: '+file);
              m = await canvas.evaluate(measure,u.href);
              if (m.blue>100 && m.wrongFinish<8) break;
            }
            await page.waitForTimeout(120);
          }
          assert(m && m.blue>100 && m.wrongFinish<8 && m.outside===0 && m.rim>=Math.floor(m.h*.01),
            [engine.name(),model,surface,finish,JSON.stringify(m)].join(' '));
        }
        console.log('PASS',engine.name(),model,surface,'all four finishes');
      }
    } finally { await browser.close(); }
  }
})().catch(e => { console.error(e); process.exitCode=1; });
