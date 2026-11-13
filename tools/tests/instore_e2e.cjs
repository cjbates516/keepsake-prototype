#!/usr/bin/env node
/* End to end checks for In Store mode: iPad flow, pick code lookup, customizer load, print export.
   Self contained: starts its own static server that serves this repo at /keepsake-prototype/ (like GitHub Pages).

   Run from the repo root:
     NODE=/Users/coreybates/Desktop/Project\ File\ -\ Claude/keepsake/node-v22.12.0-darwin-arm64/bin/node
     "$NODE" tools/tests/instore_e2e.cjs [outDir] [--browsers=webkit,chromium]
   KP_REPO=/path/to/copy tests a different copy of the site (for example a frozen review snapshot).
   Playwright: set PW_CORE to a playwright-core folder, default is keepsake/playwright/node_modules/playwright-core
   (playwright-core 1.64.1, matching the WebKit 2370 and Chromium 1248 builds in ~/Library/Caches/ms-playwright).
   Prints a JSON summary; exit code 1 if any check fails. Screenshots go to outDir. */
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const REPO = path.resolve(process.env.KP_REPO || path.resolve(__dirname, '..', '..'));   /* KP_REPO: test another copy */
const PW = process.env.PW_CORE || path.resolve(__dirname, '..', '..', '..', 'playwright', 'node_modules', 'playwright-core');
const { webkit, chromium } = require(PW);
const args = process.argv.slice(2);
const OUT = path.resolve(args.find(a => !a.startsWith('--')) || path.join(require('node:os').tmpdir(), 'instore-e2e'));
const BROWSERS = ((args.find(a => a.startsWith('--browsers=')) || '--browsers=webkit,chromium').split('=')[1]).split(',');
fs.mkdirSync(OUT, { recursive: true });

/* ---------- expectations from the data files ---------- */
const readJSON = p => JSON.parse(fs.readFileSync(path.join(REPO, p), 'utf8'));
const config = readJSON('instore/config.json');
const models = readJSON('instore/models.json').models;
const designs = readJSON('assets/designs/designs.json');
const codes = readJSON('instore/codes.json');
const colByCat = {};
config.collections.forEach(c => { colByCat[c.category] = c.code; });
const colCode = cat => colByCat[cat] || (String(cat).replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'GEN');
const active = designs.filter(d => !d.hidden && d.active !== false);
const activeModels = models.filter(m => m.active);
const pad3 = n => String(n).padStart(3, '0');
const expectedCode = (m, d) => {
  const r = codes.codes[d.file];
  return r && r.c === colCode(d.category) ? `${m.id}-${r.c}-${pad3(r.n)}` : null;
};
const cust = fs.readFileSync(path.join(REPO, 'customizer.html'), 'utf8');
const specSrc = cust.slice(cust.indexOf('var printSpec = {') + 16, cust.indexOf('};', cust.indexOf('var printSpec = {')) + 1)
  .replace(/\/\*[\s\S]*?\*\//g, '');
const printSpec = Function('return ' + specSrc)();

/* ---------- static server ---------- */
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
function serve() {
  const srv = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    if (!u.pathname.startsWith('/keepsake-prototype/')) {
      if (u.pathname === '/keepsake-prototype') { res.writeHead(301, { Location: '/keepsake-prototype/' }); return res.end(); }
      res.writeHead(404); return res.end();
    }
    let p = path.join(REPO, decodeURIComponent(u.pathname.slice('/keepsake-prototype/'.length)));
    if (!p.startsWith(REPO)) { res.writeHead(403); return res.end(); }
    fs.stat(p, (err, st) => {
      if (!err && st.isDirectory()) {
        if (!u.pathname.endsWith('/')) { res.writeHead(301, { Location: u.pathname + '/' + u.search }); return res.end(); }
        p = path.join(p, 'index.html');
      }
      fs.readFile(p, (e2, buf) => {
        if (e2) { res.writeHead(404); return res.end('not found'); }
        res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
        res.end(buf);
      });
    });
  });
  return new Promise(r => srv.listen(0, '127.0.0.1', () => r(srv)));
}

/* ---------- checks ---------- */
const results = [];
function check(name, ok, detail) { results.push({ name, ok: !!ok, detail }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail !== undefined ? '  ' + JSON.stringify(detail).slice(0, 300) : '')); }

const VIEWS = [{ tag: 'portrait', width: 820, height: 1180 }, { tag: 'landscape', width: 1180, height: 820 }];

async function newPage(browser, vp, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, hasTouch: true, deviceScaleFactor: 2, serviceWorkers: opts.sw ? 'allow' : 'block' });
  const page = await ctx.newPage();
  /* taps come at human speed: the page ignores a second tap on the same spot within 450ms of a screen change
     (double tap guard), so every scripted tap waits like a person would (fake clock aware) */
  const tap0 = page.tap.bind(page);
  page.tap = async (sel, o) => { if (page._fakeClock) await page.clock.runFor(460); else await page.waitForTimeout(460); return tap0(sel, o); };
  page._errors = [];
  page.on('pageerror', e => page._errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|fonts\.g/.test(m.text())) page._errors.push(m.text()); });
  return { ctx, page };
}

async function measure(page, scope) {
  return page.evaluate(sel => {
    const root = document.querySelector(sel) || document.body, bad = [], small = [];
    const vis = el => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
    root.querySelectorAll('button, a, [role=button]').forEach(el => {
      if (!vis(el)) return; const r = el.getBoundingClientRect();
      if (r.width < 48 || r.height < 48) bad.push((el.id || el.className || el.tagName) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
    });
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n; while ((n = w.nextNode())) {
      if (!n.textContent.trim()) continue; const el = n.parentElement; if (!vis(el)) continue;
      const fs = parseFloat(getComputedStyle(el).fontSize); if (fs < 18) small.push(el.tagName + '.' + el.className + ' ' + fs + 'px "' + n.textContent.trim().slice(0, 30) + '"');
    }
    return { bad: bad.slice(0, 12), small: small.slice(0, 12), overflow: document.scrollingElement.scrollWidth - innerWidth };
  }, scope);
}

async function flow(browser, base, vp, modelId) {
  const { ctx, page } = await newPage(browser, vp);
  const m = models.find(x => x.id === modelId);
  await page.goto(base + 'instore/', { waitUntil: 'networkidle' });
  const ids = await page.$$eval('#phones button[data-model]', bs => bs.map(b => b.dataset.model));
  check(`${vp.tag}: only active models on screen 1`, JSON.stringify(ids) === JSON.stringify(activeModels.map(x => x.id)), ids);
  let mm = await measure(page, '#s1'); check(`${vp.tag}: screen 1 targets>=48, text>=18, no overflow`, !mm.bad.length && !mm.small.length && mm.overflow <= 0, mm);
  await page.screenshot({ path: path.join(OUT, `s1-${vp.tag}.png`) });

  await page.tap(`button[data-model="${modelId}"]`);                                        // tap 1
  await page.waitForSelector('#s2.on');
  const exp = active.length;
  const shown = await page.$$eval('#grid .tile[data-file]', t => t.length);
  check(`${vp.tag}: All designs shows every active design`, shown === exp, { shown, exp });
  const chips = await page.$$eval('#chips button', bs => bs.map(b => ({ code: b.dataset.col, label: b.textContent })));
  let chipOk = true; const chipBad = [];
  for (const c of chips.filter(c => c.code !== 'all')) {
    await page.tap(`#chips button[data-col="${c.code}"]`);
    const n = await page.$$eval('#grid .tile[data-file]', t => t.length);
    const e = active.filter(d => colCode(d.category) === c.code).length;
    const own = await page.$$eval('#grid .tile.own', t => t.length);
    if (n !== e || own !== 1) { chipOk = false; chipBad.push({ chip: c.code, n, e, own }); }
  }
  check(`${vp.tag}: every chip shows exactly its collection plus the own photo tile`, chipOk, chipBad.length ? chipBad : chips.length + ' chips');
  await page.tap('#chips button[data-col="all"]');
  await page.tap('#grid .tile.own');
  const sheet = await page.textContent('#ownSheet p');
  check(`${vp.tag}: own photo sheet text`, sheet.includes("original photo") && sheet.includes("check the crop with you"), sheet);
  mm = await measure(page, '#ownSheet'); check(`${vp.tag}: sheet targets and text`, !mm.bad.length && !mm.small.length, mm);
  await page.tap('#ownSheet button');
  await page.waitForFunction(() => { const imgs = [...document.querySelectorAll('#grid .tile[data-file] img')].slice(0, 12); return imgs.length && imgs.every(i => !i.classList.contains('wait') && i.getAttribute('src')); }, null, { timeout: 25000 })
    .then(() => check(`${vp.tag}: first 12 tiles rendered`, true), () => check(`${vp.tag}: first 12 tiles rendered`, false));
  mm = await measure(page, '#s2'); check(`${vp.tag}: screen 2 targets>=48, text>=18, no overflow`, !mm.bad.length && !mm.small.length && mm.overflow <= 0, mm);
  await page.screenshot({ path: path.join(OUT, `s2-${vp.tag}.png`) });

  const file = await page.getAttribute('#grid .tile[data-file]:nth-child(5)', 'data-file');
  const d = designs.find(x => x.file === file);
  await page.tap(`#grid .tile[data-file="${file}"]`);                                       // tap 2
  await page.waitForSelector('#s3.on');
  await page.tap('#showBtn');                                                               // tap 3
  await page.waitForTimeout(500);
  const got = await page.evaluate(() => ({ name: dname.textContent, meta: dmeta.textContent, price: price.textContent, code: code.textContent, codeVisible: !code.hidden && code.offsetHeight > 0,
    codeSize: parseFloat(getComputedStyle(code).fontSize), cname: cname.textContent, cmodel: cmodel.textContent }));
  const want = expectedCode(m, d);
  check(`${vp.tag}: confirm shows design, model, $44.99 and the registered pick code`,
    got.price === '$44.99' && got.meta.includes(m.name) && got.cmodel === m.name && got.code === want && got.codeVisible && got.cname === got.name+' · Original', { got, want });
  check(`${vp.tag}: pick code is large`, got.codeSize >= 40, got.codeSize);
  mm = await measure(page, '#s3'); check(`${vp.tag}: screen 3 targets>=48, text>=18, no overflow`, !mm.bad.length && !mm.small.length && mm.overflow <= 0, mm);
  await page.screenshot({ path: path.join(OUT, `s3-${vp.tag}.png`) });
  await page.tap('button[data-act="reset"]');
  const st = await page.evaluate(() => ({ s1: s1.classList.contains('on'), model: __kpInStore.state.model, design: __kpInStore.state.design }));
  check(`${vp.tag}: Start over clears the pick`, st.s1 && !st.model && !st.design, st);
  check(`${vp.tag}: no page errors`, !page._errors.length, page._errors);
  await ctx.close();
}

async function lookupAndPrint(browser, base) {
  const { ctx, page } = await newPage(browser, { width: 1280, height: 900 });
  const picks = [['17PM', 'FLR'], ['17P', 'ZOD'], ['16', 'MAP'], ['15P', 'CLR'], ['14', 'XMS'], ['13PM', 'APR'], ['13', 'POP']];
  for (const [mid, col] of picks) {
    const m = models.find(x => x.id === mid);
    const d = active.find(x => colCode(x.category) === col && codes.codes[x.file]);
    const code = expectedCode(m, d);
    await page.goto(base + 'instore/find.html?code=' + encodeURIComponent(code), { waitUntil: 'networkidle' });
    await page.waitForSelector('#res.on', { timeout: 10000 }).catch(() => {});
    const r = await page.evaluate(() => ({ code: rcode.textContent, name: rname.textContent, model: rmodel.textContent, href: ropen.getAttribute('href') }));
    const okLookup = r.model.startsWith(m.name) && r.code.startsWith(code) && r.href && r.href.includes('design=' + encodeURIComponent(d.file));
    check(`lookup ${code} finds ${d.file} on ${m.name}`, okLookup, r);
    if (!okLookup) continue;
    await page.click('#ropen');
    await page.waitForFunction(() => window.__kp && __kp.state && __kp.state.photoImg && !__kp.state.photoImg.__kpIsThumb, null, { timeout: 30000 }).catch(() => {});
    const st = await page.evaluate(() => ({ model: __kp.state.model, src: __kp.state.photoImg && __kp.state.photoImg.src }));
    check(`customizer opened ${code} with the right phone and design`, st.model === m.name && st.src && st.src.includes(d.file), st);
    let res = null;
    for (let i = 0; i < 20 && !res; i++) {
      await page.waitForTimeout(700);
      res = await page.evaluate(() => new Promise(resolve => {
        let got = null;
        const ok = __kp.buildPrint((c, name) => {
          const x = c.getContext('2d'), w = c.width, h = c.height;
          const a = (px, py) => x.getImageData(px, py, 1, 1).data[3];
          const all = x.getImageData(0, 0, w, h).data; let clear = 0, solid = 0;
          for (let k = 3; k < all.length; k += 4 * 7) { if (all[k] === 0) clear++; else if (all[k] === 255) solid++; }
          got = { name, w, h, corner: a(1, 1), center: a(w >> 1, (h * 0.7) | 0), clearShare: clear / (all.length / 28), solidShare: solid / (all.length / 28), bytes: c.toDataURL('image/png').length };
        });
        resolve(ok === false ? null : got);
      }));
    }
    const s = printSpec[m.name];
    /* Clear Case designs are see-through art on purpose, so they only need some ink; others must be solid under
       the printable area (the 17 Pro's printable area stops below its camera plateau, so about 0.58 is normal there) */
    const clearArt = colCode(d.category) === 'CLR';
    const okPrint = res && s && res.w === s[2] + 36 && res.h === s[3] + 36 && res.name === `print-${m.name.replace(/[^a-z0-9]+/gi, '')}-${s[2]}x${s[3]}-bleed1.5mm.png`
      && res.corner === 0 && res.clearShare > 0.01 && res.bytes > 20000
      && (clearArt ? res.solidShare > 0.01 : (res.center === 255 && res.solidShare > 0.3));
    check(`print export for ${code}: ${s ? (s[2] + 36) + 'x' + (s[3] + 36) : '?'} px, transparent corners and camera, ${clearArt ? 'clear art has ink' : 'solid art'}`, okPrint, res);
  }
  const bad = await (async () => { await page.goto(base + 'instore/find.html?code=NOPE', { waitUntil: 'networkidle' }); return page.evaluate(() => ({ err: err.classList.contains('on'), text: err.textContent, res: res.classList.contains('on') })); })();
  check('lookup of a garbage code shows a friendly error', bad.err && !bad.res, bad);
  check('lookup and customizer pages have no page errors', !page._errors.length, page._errors.slice(0, 5));
  await ctx.close();
}

async function idleReset(browser, base) {
  const { ctx, page } = await newPage(browser, VIEWS[1]);
  await page.clock.install(); page._fakeClock = true;
  await page.goto(base + 'instore/', { waitUntil: 'networkidle' });
  await page.tap('button[data-model="17P"]');
  await page.tap('#grid .tile[data-file]');
  await page.tap('#showBtn');
  await page.clock.fastForward(76000);
  let st = await page.evaluate(() => ({ s1: s1.classList.contains('on'), model: !!__kpInStore.state.model, card: codecard.classList.contains('on') }));
  check('pick code remains visible after 76 seconds', !st.s1 && st.model && st.card, st);
  await page.clock.fastForward(225000);
  st = await page.evaluate(() => ({ s1: s1.classList.contains('on'), model: !!__kpInStore.state.model, card: codecard.classList.contains('on') }));
  check('idle five minutes clears the pick code', st.s1 && !st.model && !st.card, st);
  await page.tap('button[data-model="15"]');
  await page.tap('#grid .tile.own');
  await page.clock.fastForward(70000);
  await page.tap('#ownSheet .sheet h2');
  await page.clock.fastForward(10000);
  st = await page.evaluate(() => ({ s2: s2.classList.contains('on'), sheet: ownSheet.classList.contains('on') }));
  check('a tap at 70s postpones the reset', st.s2 && st.sheet, st);
  await page.clock.fastForward(76000);
  st = await page.evaluate(() => ({ s1: s1.classList.contains('on'), sheet: ownSheet.classList.contains('on'), model: !!__kpInStore.state.model }));
  check('idle with the photo sheet open closes it and resets', st.s1 && !st.sheet && !st.model, st);
  await ctx.close();
}

async function failures(browser, base) {
  /* every thumbnail fails: tiles fall back to the phone outline, never stall */
  let { ctx, page } = await newPage(browser, VIEWS[0]);
  await page.route('**/assets/designs/thumbs/**', r => r.abort());
  await page.goto(base + 'instore/', { waitUntil: 'networkidle' });
  await page.tap('button[data-model="16P"]');
  const ok1 = await page.waitForFunction(() => { const imgs = [...document.querySelectorAll('#grid .tile[data-file] img')].slice(0, 8); return imgs.length && imgs.every(i => i.classList.contains('fail') && i.getAttribute('src')); }, null, { timeout: 20000 }).then(() => true, () => false);
  check('failed thumbnails show the phone outline (class fail, src set)', ok1, await page.$$eval('#grid .tile[data-file] img', a => a.slice(0, 8).map(i => i.className + ':' + !!i.getAttribute('src'))));
  await ctx.close();
  /* one thumbnail hangs forever: the rest still render */
  ({ ctx, page } = await newPage(browser, VIEWS[0]));
  const hung = active[0].file;
  await page.route('**/assets/designs/thumbs/' + hung + '*', () => { /* never answer */ });
  await page.goto(base + 'instore/', { waitUntil: 'networkidle' });
  await page.tap('button[data-model="16P"]');
  const ok2 = await page.waitForFunction(h => { const imgs = [...document.querySelectorAll('#grid .tile[data-file]')].slice(0, 12).filter(t => t.dataset.file !== h).map(t => t.querySelector('img')); return imgs.length >= 10 && imgs.every(i => !i.classList.contains('wait')); }, hung, { timeout: 20000 }).then(() => true, () => false);
  check('one hung thumbnail does not stall the other tiles', ok2);
  await ctx.close();
  /* code list missing: fail closed, no codes issued */
  ({ ctx, page } = await newPage(browser, VIEWS[0]));
  await page.route('**/instore/codes.json*', r => r.fulfill({ status: 404, body: 'nope' }));
  await page.goto(base + 'instore/', { waitUntil: 'networkidle' });
  const st = await page.evaluate(() => ({ err: sErr.classList.contains('on'), phones: document.querySelectorAll('#phones button').length }));
  check('missing codes.json shows the ask a team member screen and issues no codes', st.err && st.phones === 0, st);
  await ctx.close();
}

async function memory(browser, base) {
  const { ctx, page } = await newPage(browser, VIEWS[1]);
  await page.addInitScript(() => {
    const live = new Map(), c = URL.createObjectURL.bind(URL), r = URL.revokeObjectURL.bind(URL);
    URL.createObjectURL = b => { const u = c(b); live.set(u, b && b.type); return u; };
    URL.revokeObjectURL = u => { live.delete(u); r(u); };
    /* large confirm previews are PNG, tiles are JPEG */
    window.__live = () => live.size;
    window.__livePng = () => [...live.values()].filter(t => t === 'image/png').length;
  });
  await page.goto(base + 'instore/', { waitUntil: 'networkidle' });
  await page.tap('button[data-model="17PM"]');
  await page.waitForTimeout(3000);
  const tiles0 = await page.evaluate(() => __live());
  for (let i = 1; i <= 10; i++) {
    await page.tap(`#grid .tile[data-file]:nth-child(${i + 1})`);
    await page.waitForTimeout(900);
    await page.tap('button[data-act="designs"]');
  }
  await page.waitForTimeout(1500);
  const after = await page.evaluate(() => __live()), png = await page.evaluate(() => __livePng());
  check('ten confirm previews do not pile up image memory (at most one large preview alive)', png <= 1, { tiles0, after, livePreviews: png });
  await page.evaluate(() => __kpInStore.reset());
  const pngAfterReset = await page.evaluate(() => __livePng());
  check('Start over frees the large preview', pngAfterReset === 0, { pngAfterReset });
  await page.tap('button[data-model="17PM"]');
  await page.tap('button[data-act="phone"]');
  await page.tap('button[data-model="14"]');
  await page.waitForTimeout(3000);
  const swapped = await page.evaluate(() => __live());
  check('switching phones frees the previous phone tiles', swapped <= tiles0 + 40, { tiles0, after, swapped });
  await ctx.close();
}

async function serviceWorker(browser, base) {
  const { ctx, page } = await newPage(browser, VIEWS[1], { sw: true });
  await page.goto(base + 'instore/', { waitUntil: 'networkidle' });
  await page.evaluate(async () => { const c = await caches.open('unrelated-site-cache'); await c.put('/unrelated-probe', new Response('x')); });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload({ waitUntil: 'networkidle' });
  const ctl = await page.evaluate(() => !!navigator.serviceWorker.controller);
  check('service worker controls the In Store page', ctl);
  await page.tap('button[data-model="17P"]');
  await page.waitForFunction(() => [...document.querySelectorAll('#grid .tile[data-file] img')].slice(0, 12).every(i => !i.classList.contains('wait')), null, { timeout: 25000 }).catch(() => {});
  const keys = await page.evaluate(() => caches.keys());
  check('service worker keeps unrelated caches and uses only kp-instore-* names', keys.includes('unrelated-site-cache') && keys.filter(k => k !== 'unrelated-site-cache').every(k => k.startsWith('kp-instore-')), keys);
  /* let the background warm up store the DM Sans stylesheet and font files (starts 6s after load) */
  const fontCached = await page.waitForFunction(async () => {
    for (const k of await caches.keys()) { const c = await caches.open(k); if ((await c.keys()).some(r => r.url.includes('fonts.googleapis.com'))) return true; }
    return false;
  }, null, { timeout: 30000, polling: 1000 }).then(() => true, () => false);
  check('the DM Sans stylesheet is stored for offline use', fontCached);
  /* Authored raster colorways must have been viewed online before offline use. */
  await page.tap('#grid .tile[data-file]');
  await page.tap('[data-colorway="c3"]');
  await page.locator('#showBtn:not([disabled])').waitFor();
  await page.tap('#showBtn');
  await ctx.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const fontOff = await page.evaluate(async () => { await document.fonts.ready; return document.fonts.check('700 20px "DM Sans"') && [...document.fonts].some(f => f.family.replace(/"/g, '') === 'DM Sans' && f.status === 'loaded'); });
  check('offline: the brand font DM Sans still loads', fontOff);
  check('offline: colorway catalog and renderer load', await page.evaluate(()=>!!window.KP_COLORWAY_CATALOG&&!!window.KPDesignColorways&&Object.keys(KP_COLORWAY_CATALOG).length>=721));
  await page.waitForSelector('#phones button', { timeout: 15000 }).catch(() => {});
  await page.tap('button[data-model="17P"]').catch(() => {});
  await page.waitForTimeout(4000);
  const off = await page.evaluate(() => { const imgs = [...document.querySelectorAll('#grid .tile[data-file] img')].slice(0, 12); return { phones: document.querySelectorAll('#phones button').length, rendered: imgs.filter(i => !i.classList.contains('wait') && !i.classList.contains('fail')).length, total: imgs.length }; });
  check('offline after warming: page loads and seen tiles still render', off.phones === activeModels.length && off.total === 12 && off.rendered === 12, off);
  await page.tap('#grid .tile[data-file]');
  await page.tap('[data-colorway="c3"]');
  await page.tap('#showBtn');
  check('offline: selected colorway receives a stable code', (await page.locator('#code').textContent()).endsWith('-C3'));
  await page.screenshot({ path: path.join(OUT, 'offline-s2.png') });
  await ctx.close();
}

/* round two targeted checks: stale previews, lookup retry and order, hung network, tile retry */
async function roundTwo(browser, base) {
  /* a slow preview for an earlier phone must never replace the current phone's preview */
  let { ctx, page } = await newPage(browser, VIEWS[1]);
  await page.goto(base + 'instore/', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    const prep0 = KPI.prepModel, render0 = KPI.renderToUrl; let first = true;
    KPI.prepModel = (m, w, ...r) => prep0(m, w, ...r).then(p => {
      if (w !== 900) return p; const t = Object.assign({}, p, { _who: m.id });
      if (first) { first = false; return new Promise(res => { window.__releaseFirst = () => res(t); }); } return t;
    });
    KPI.renderToUrl = (p, ...r) => p._who ? Promise.resolve('data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg"><text>' + p._who + '</text></svg>')) : render0(p, ...r);
  });
  await page.tap('button[data-model="17P"]'); await page.tap('#grid .tile[data-file]');
  await page.waitForFunction(() => !!window.__releaseFirst);
  await page.tap('button[data-act="reset"]'); await page.tap('button[data-model="14"]'); await page.tap('#grid .tile[data-file]');
  await page.waitForFunction(() => decodeURIComponent(pv.src).includes('>14<'));
  await page.evaluate(() => __releaseFirst()); await page.waitForTimeout(600);
  let src = decodeURIComponent(await page.getAttribute('#pv', 'src'));
  check('stale preview from another phone never replaces the current one', src.includes('>14<'), src.slice(-40));
  /* same phone and design picked twice: the older request must not win either */
  await page.evaluate(() => {
    const prep0 = KPI.prepModel; let n = 0;
    KPI.prepModel = (m, w, ...r) => prep0(m, w, ...r).then(p => {
      if (w !== 900) return p; const k = ++n, t = Object.assign({}, p, { _who: 'req' + k });
      return k === 1 ? new Promise(res => { window.__releaseOld = () => res(t); }) : t;
    });
  });
  await page.tap('button[data-act="designs"]'); await page.tap('#grid .tile[data-file]');
  await page.waitForFunction(() => !!window.__releaseOld);
  await page.tap('button[data-act="designs"]'); await page.tap('#grid .tile[data-file]');
  await page.waitForFunction(() => decodeURIComponent(pv.src).includes('>req2<'));
  await page.evaluate(() => __releaseOld()); await page.waitForTimeout(600);
  src = decodeURIComponent(await page.getAttribute('#pv', 'src'));
  check('repeat pick of the same design: the older preview request cannot come back', src.includes('>req2<'), src.slice(-40));
  await ctx.close();

  /* find.html: a failed first load is retried by pressing Find it again */
  ({ ctx, page } = await newPage(browser, { width: 1280, height: 900 }));
  let fails = 2;
  await page.route('**/instore/codes.json*', r => (fails-- > 0 ? r.fulfill({ status: 503, body: 'down' }) : r.continue()));
  await page.goto(base + 'instore/find.html', { waitUntil: 'networkidle' });
  const m = models.find(x => x.id === '16P'), d = active.find(x => codes.codes[x.file] && colCode(x.category) === 'HRT');
  const code = expectedCode(m, d);
  await page.fill('#q', code); await page.click('button[type=submit]');
  await page.waitForSelector('#err.on', { timeout: 15000 });
  await page.click('button[type=submit]');
  const okRetry = await page.waitForSelector('#res.on', { timeout: 15000 }).then(() => true, () => false);
  check('lookup recovers when Find it is pressed again after a failed load', okRetry && (await page.textContent('#rcode')).startsWith(code), { code });
  /* find.html: an earlier slow lookup must not replace the newer picture */
  await page.evaluate(() => {
    const render0 = KPI.renderToUrl; let n = 0;
    KPI.renderToUrl = (p, img, bg) => { const k = ++n, u = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg"><text>look' + k + '</text></svg>');
      return k === 1 ? new Promise(res => { window.__releaseLook = () => res(u); }) : Promise.resolve(u); };
  });
  const d2 = active.find(x => codes.codes[x.file] && colCode(x.category) === 'ZOD');
  await page.fill('#q', expectedCode(m, d)); await page.click('button[type=submit]');
  await page.waitForFunction(() => !!window.__releaseLook);
  await page.fill('#q', expectedCode(m, d2)); await page.click('button[type=submit]');
  await page.waitForFunction(() => decodeURIComponent(rimg.src || '').includes('look2'));
  await page.evaluate(() => __releaseLook()); await page.waitForTimeout(500);
  const look = decodeURIComponent(await page.getAttribute('#rimg', 'src'));
  check('a slow earlier lookup never replaces the newer lookup picture', look.includes('look2') && (await page.textContent('#rname')).length > 0, look.slice(-30));
  await ctx.close();

  /* a design list that never answers reaches the ask a team member screen */
  ({ ctx, page } = await newPage(browser, VIEWS[0]));
  await page.clock.install();
  await page.route('**/assets/designs/designs.json*', () => { /* never answer */ });
  await page.goto(base + 'instore/', { waitUntil: 'domcontentloaded' });
  await page.clock.fastForward(26000);
  await page.waitForTimeout(300);
  const hung = await page.evaluate(() => ({ err: sErr.classList.contains('on'), phones: document.querySelectorAll('#phones button').length }));
  check('a network that never answers ends on the ask a team member screen', hung.err && hung.phones === 0, hung);
  await ctx.close();

  /* tiles that failed are retried when the customer comes back to the grid */
  ({ ctx, page } = await newPage(browser, VIEWS[1]));
  let blockThumbs = true;
  await page.route('**/assets/designs/thumbs/**', r => (blockThumbs ? r.abort() : r.continue()));
  await page.goto(base + 'instore/', { waitUntil: 'networkidle' });
  await page.tap('button[data-model="15PM"]');
  await page.waitForFunction(() => [...document.querySelectorAll('#grid .tile[data-file] img')].slice(0, 6).every(i => i.classList.contains('fail')), null, { timeout: 20000 });
  blockThumbs = false;
  await page.tap('#grid .tile[data-file]:nth-child(3)');
  await page.waitForTimeout(5600);                       /* first retry pause is 5s */
  await page.tap('button[data-act="designs"]');
  const healed = await page.waitForFunction(() => [...document.querySelectorAll('#grid .tile[data-file] img')].slice(0, 6).every(i => !i.classList.contains('fail') && !i.classList.contains('wait')), null, { timeout: 20000 }).then(() => true, () => false);
  check('failed tiles are retried on return to the grid once the network is back', healed,
    await page.$$eval('#grid .tile[data-file] img', a => a.slice(0, 6).map(i => i.className + ' tries=' + i.getAttribute('data-tries'))));
  await ctx.close();
}

async function touchQuirks(browser, base) {
  /* double tap on a phone tile must not also pick a design on the next screen */
  let { ctx, page } = await newPage(browser, VIEWS[0]);
  await page.goto(base + 'instore/', { waitUntil: 'networkidle' });
  const b = await page.locator('button[data-model="17"]').boundingBox();
  await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
  await page.waitForTimeout(150);
  await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
  await page.waitForTimeout(500);
  let st = await page.evaluate(() => ({ screen: __kpInStore.state.screen, design: !!__kpInStore.state.design, sheet: ownSheet.classList.contains('on') }));
  check('double tap on a phone opens the designs and picks nothing else', st.screen === 2 && !st.design && !st.sheet, st);
  /* a quick tap on a different spot still works */
  await page.tap('#grid .tile[data-file]');
  st = await page.evaluate(() => ({ screen: __kpInStore.state.screen }));
  check('a quick deliberate tap elsewhere still works', st.screen === 3, st);
  await ctx.close();
  /* 768x1024 portrait: after the code shows, the buttons below it are on screen */
  ({ ctx, page } = await newPage(browser, { tag: 'portrait-768', width: 768, height: 1024 }));
  await page.goto(base + 'instore/', { waitUntil: 'networkidle' });
  await page.tap('button[data-model="16PM"]'); await page.tap('#grid .tile[data-file]');
  await page.tap('#showBtn'); await page.waitForTimeout(700);
  const box = await page.evaluate(() => { const r = document.querySelector('#s3 .after').getBoundingClientRect(), c = code.getBoundingClientRect(); return { afterBottom: Math.round(r.bottom), codeTop: Math.round(c.top), h: innerHeight }; });
  check('768x1024: code and the Start over row are visible after the reveal', box.afterBottom <= box.h && box.codeTop >= 0, box);
  await page.screenshot({ path: path.join(OUT, 's3-portrait-768.png') });
  await ctx.close();
}

async function header(browser, base) {
  const { ctx, page } = await newPage(browser, { width: 1024, height: 768 });
  for (const p of ['index.html', 'gallery.html', 'gifts.html', 'customizer.html']) {
    await page.goto(base + p, { waitUntil: 'domcontentloaded' });
    const box = await page.locator('a.kpInStore').boundingBox();
    check(`${p}: In Store button visible in the header at 1024`, box && box.width > 0 && box.y < 120, box);
  }
  await page.click('a.kpInStore');
  await page.waitForSelector('#phones button', { timeout: 15000 }).catch(() => {});
  check('In Store button opens the mode', /\/instore\/$/.test(new URL(page.url()).pathname), page.url());
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + 'index.html', { waitUntil: 'domcontentloaded' });
  check('In Store button hidden on phones (390 wide)', !(await page.locator('a.kpInStore').isVisible()));
  await page.goto(base + 'instore', { waitUntil: 'networkidle' });
  check('/instore without a slash loads the mode', /\/instore\/$/.test(new URL(page.url()).pathname) && (await page.$$('#phones button')).length === activeModels.length, page.url());
  await ctx.close();
}

(async () => {
  const srv = await serve();
  const base = `http://127.0.0.1:${srv.address().port}/keepsake-prototype/`;
  console.log('serving', REPO, 'at', base, '| out', OUT, '| browsers', BROWSERS.join(','));
  for (const name of BROWSERS) {
    const browser = await ({ webkit, chromium })[name].launch();
    console.log(`\n== ${name}`);
    const before = results.length;
    if(args.includes('--only=offline')){if(name==='chromium')await serviceWorker(browser,base);}else{
    for (const vp of VIEWS) await flow(browser, base, vp, vp.tag === 'portrait' ? '17P' : '14PM');
    await idleReset(browser, base);
    await failures(browser, base);
    await memory(browser, base);
    await roundTwo(browser, base);
    await touchQuirks(browser, base);
    if (name === 'webkit') { await header(browser, base); await lookupAndPrint(browser, base); }
    if (name === 'chromium') await serviceWorker(browser, base);
    }
    results.slice(before).forEach(r => { r.browser = name; });
    await browser.close();
  }
  srv.close();
  const failed = results.filter(r => !r.ok);
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 1));
  console.log(`\n${results.length - failed.length}/${results.length} passed. results: ${path.join(OUT, 'results.json')}`);
  process.exitCode = failed.length ? 1 : 0;
})().catch(e => { console.error(e); process.exit(2); });
