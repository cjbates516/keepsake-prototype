/* Rated Case photos: the "See photos" button beside Enlarge case (classic ?staff=1 rail: under the case cards) and its
   viewer. Photos, captions and the phone list come from assets/cases/rated-photos/manifest.json, written by
   tools/build_rated_photos.py from customizer.html KP-RATED-KITS (docs/RATED-CASE-PHOTOS.md lists the sources).
   This file only reads KPStudioCore.info(). "Choose Rated Case" goes through the editor's own case and rim radios
   (#studioCase), the same path a tap on them takes, or core.setCase / core.setRim where those radios do not exist, so
   prices, the case photo, the address and the editor follow as usual. Shared kiosks: no links in the viewer, and the
   idle reset (KPStudioCore.purge) closes it. Each photo has a 1000 x 1200 file and a 1600 x 1920 one (hd) for screens
   that would draw it more than 15% bigger than 1000 x 1200 (tablets such as the in-store iPad, high density desktops).
   Tests: tools/tests/rated_photos.cjs. */
(() => {
  const core = window.KPStudioCore, stage = document.getElementById('stageStick');
  if (!core || !stage || window.KPRatedGallery) return;
  const V = 'rated-photos-2', DIR = 'assets/cases/rated-photos/', RATED = 'Rated Case';
  const editor = document.body.classList.contains('design-editor');
  // the shared in-store iPad: a customer there cannot check a connection, so failures point to a team member
  const kiosk = new URLSearchParams(location.search).get('kiosk') === '1';
  const failText = what => what + ' could not load. ' + (kiosk ? 'Try again or ask a team member.' : 'Check your connection and try again.');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const src = f => DIR + f + '?v=' + V;
  const short = m => String(m || '').replace(/^Samsung /, '');
  let manifest = null, request = null, purged = false;
  function load() {
    if (manifest) return Promise.resolve(manifest);
    if (!request) request = fetch(DIR + 'manifest.json?v=' + V).then(r => { if (!r.ok) throw Error('manifest ' + r.status); return r.json(); })
      .then(m => (manifest = m)).catch(e => { request = null; throw e; });
    return request;
  }

  /* ── the button ── */
  const opener = document.createElement('button');
  opener.type = 'button'; opener.id = 'ratedPhotosOpen'; opener.className = 'rg-open'; opener.hidden = true;
  opener.setAttribute('aria-label', 'See photos of the Rated Case');
  opener.innerHTML = '<span class="rg-open-pic" aria-hidden="true"><img alt="" width="200" height="240" decoding="async" hidden></span><span>See photos</span>';
  const openerImg = opener.querySelector('img');
  // without its picture (offline) the button drops the empty slot and is a plain pill like Enlarge case
  const noPic = off => opener.classList.toggle('rg-open-nopic', off);
  openerImg.onerror = () => { openerImg.hidden = true; openerImg.removeAttribute('src'); noPic(true); };
  openerImg.onload = () => { openerImg.hidden = false; noPic(false); };
  const zoom = document.getElementById('skyCaseZoom');
  if (editor && zoom) {
    // one row with Enlarge case, so on phones the button costs no extra height under the case
    const row = document.createElement('div'); row.className = 'rg-zoomrow';
    zoom.before(row); row.append(zoom, opener);
  } else {
    const ct = document.getElementById('ctRow');
    if (ct) { opener.classList.add('rg-open-classic'); ct.after(opener); } else stage.append(opener);
  }

  /* model -> its photo set and rims (only rims this phone's kit offers and the manifest has photos for) */
  function resolve(model, info) {
    const m = manifest && manifest.models[model];
    if (!m) return null;
    const set = manifest.sets[m.key] || {};
    const kitRims = (info && info.rims && info.rims.length ? info.rims : m.rims.map(n => ({ n })));
    const rims = kitRims.filter(r => (set[r.n] || []).length).map(r => ({ n: r.n, h: r.h || (r.n === 'Smoke Frost' ? '#404040' : '#C4C5C6') }));
    return rims.length ? { key: m.key, similar: m.similar, set, rims } : null;
  }
  const chosenRim = (i, rims) => (i.caseType === RATED && rims.some(r => r.n === i.rim) ? i.rim : rims[0].n);
  let syncTimer = 0, openerKey = '';
  function syncOpener() {
    syncTimer = 0;
    if (purged) { opener.hidden = true; return; }
    const i = core.info(), r = manifest ? resolve(i.model, i) : null;
    opener.hidden = !i.ratedAvailable || (!!manifest && !r);
    if (!r || opener.hidden) return;
    const rim = chosenRim(i, r.rims), list = r.set[rim], pic = list.find(p => p.view === 'side') || list[0], key = pic.thumb;
    if (key !== openerKey) { openerKey = key; openerImg.src = src(pic.thumb); }
  }
  const syncSoon = () => { if (!syncTimer) syncTimer = setTimeout(syncOpener, 60); };
  document.addEventListener('kp:editor-change', syncSoon);
  syncOpener();
  // the photo list loads once the page has settled, only for phones with a Rated kit
  // (a phone switched to one with a Rated kit loads it then; an offline screen retries at most every 30 seconds)
  let tried = 0;
  const warm = () => { if (purged || manifest || request || Date.now() - tried < 30000 || !core.info().ratedAvailable) return; tried = Date.now(); load().then(syncOpener, () => { if (!manifest) noPic(true); }); };
  if (document.readyState === 'complete') setTimeout(warm, 300); else addEventListener('load', () => setTimeout(warm, 300), { once: true });
  document.addEventListener('kp:editor-change', () => { if (!manifest && !request && !purged) setTimeout(warm, 0); });

  /* ── the viewer ── */
  const dialog = document.createElement('dialog');
  dialog.id = 'ratedGallery'; dialog.className = 'rg'; dialog.tabIndex = -1;
  dialog.setAttribute('aria-labelledby', 'rgTitle'); dialog.setAttribute('aria-describedby', 'rgSub');
  // top (title, sets), the photo, then the side (thumbnails, rim, Choose): one column on phones and portrait tablets,
  // photo left and the rest right on wider screens (assets/rated-gallery.css)
  dialog.innerHTML = '<div class="rg-body"><div class="rg-top">'
    + '<header class="rg-head"><div class="rg-titles"><h2 id="rgTitle">Rated Case photos</h2><p id="rgSub"></p></div><button type="button" class="rg-close">Close</button></header>'
    + '<div class="rg-sets" role="group" aria-label="Photo sets"><button type="button" data-set="mine" aria-pressed="true">Your phone</button><button type="button" data-set="other" aria-pressed="false">On other phones</button></div></div>'
    + '<figure class="rg-figure"><div class="rg-frame"><img class="rg-img" width="1000" height="1200" alt="" decoding="async" draggable="false">'
    + '<div class="rg-msg" role="status" hidden><p></p><button type="button" class="rg-retry">Try again</button></div>'
    + '<button type="button" class="rg-nav rg-prev" aria-label="Previous photo"><span aria-hidden="true">‹</span></button>'
    + '<button type="button" class="rg-nav rg-next" aria-label="Next photo"><span aria-hidden="true">›</span></button></div>'
    + '<figcaption class="rg-cap" aria-live="polite"><span class="rg-caption"></span><span class="rg-count"></span></figcaption></figure>'
    + '<div class="rg-side"><div class="rg-thumbs" role="group" aria-label="Photos"></div>'
    + '<p class="rg-note"></p>'
    + '<div class="rg-rims" role="group" aria-labelledby="rgRimLabel"><span class="rg-rim-label" id="rgRimLabel">Rim color</span><span class="rg-rim-chips"></span></div>'
    + '<ul class="rg-facts"></ul>'
    + '<button type="button" class="rg-choose"></button>'
    + '</div></div>';
  document.body.append(dialog);
  const q = s => dialog.querySelector(s);
  const img = q('.rg-img'), frame = q('.rg-frame'), msg = q('.rg-msg'), thumbs = q('.rg-thumbs'), chips = q('.rg-rim-chips'), choose = q('.rg-choose');
  const st = { model: '', r: null, rim: '', set: 'mine', index: 0, items: [] };
  let opened = null, pushed = false, backPending = false, backTimer = 0, choice = null, ticket = 0, token = '', skippedAt = 0;

  // On other phones leaves out this phone's own listing (its photos are already under Your phone)
  const keyOf = p => p.key || (/^rp-([a-z0-9]+)-/.exec(p.file) || [])[1];
  function items() {
    if (!manifest) return [];
    return st.set === 'other' ? manifest.other.filter(p => !st.r || keyOf(p) !== st.r.key) : (st.r ? st.r.set[st.rim] || [] : []);
  }
  /* the 1600 x 1920 file when the photo would be drawn more than 15% bigger than 1000 x 1200 device pixels */
  function file(p) {
    if (!p.hd) return p.file;
    const fw = frame.clientWidth, fh = frame.clientHeight;
    const drawn = Math.min(fw, fh * p.w / p.h) * (window.devicePixelRatio || 1);
    return drawn > p.w * 1.15 ? p.hd : p.file;
  }
  function paint() {
    const i = core.info(), mine = st.set === 'mine';
    q('#rgSub').textContent = 'On ' + short(st.model);
    dialog.querySelectorAll('[data-set]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.set === st.set)));
    q('.rg-sets').hidden = !manifest || !manifest.other.length;
    const note = q('.rg-note');
    note.textContent = !mine ? 'The same case on other phones and colors. We do not make it for every phone shown yet.'
      : st.r && st.r.similar ? 'Photos show this case on a similar ' + (/^iPhone/.test(st.model) ? 'iPhone.' : 'phone.') : '';
    note.hidden = !note.textContent;
    // the rim chips stay on both sets: Choose below names this phone's rim, so the chips that change it stay in view
    q('.rg-rims').hidden = !st.r;
    q('.rg-rims').classList.toggle('rg-rims-other', !mine);
    q('#rgRimLabel').textContent = mine ? 'Rim color' : 'Rim for your ' + short(st.model);
    // the rim chips are rebuilt only for another phone, so a chip keeps keyboard focus when it is pressed
    const rimKey = st.r ? st.model + '|' + st.r.rims.map(r => r.n).join('|') : '';
    if (st.r && chips.dataset.key !== rimKey) {
      chips.dataset.key = rimKey;
      chips.replaceChildren(...st.r.rims.map(r => {
        const one = st.r.rims.length === 1, b = document.createElement(one ? 'span' : 'button');
        b.className = 'rg-rim' + (one ? ' rg-rim-only' : '');
        if (!one) { b.type = 'button'; b.dataset.rim = r.n; b.setAttribute('aria-pressed', String(r.n === st.rim)); }
        b.innerHTML = '<span class="rg-dot" aria-hidden="true"></span><span></span>';
        b.firstChild.style.background = r.h; b.lastChild.textContent = r.n;
        return b;
      }));
    }
    chips.querySelectorAll('[data-rim]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.rim === st.rim)));
    // what the case is, beside the photos on larger screens (the editor shows the price on phones). No drop rating here:
    // the full site audit (#71) removed that unsupported claim, and the case cards now say "Confirm availability in store".
    const rimNames = (st.r ? st.r.rims : (i.rims || [])).map(r => r.n);
    q('.rg-facts').replaceChildren(...['Rated Case \u00b7 $' + Number(i.prices && i.prices.rated || 0).toFixed(2), 'Confirm availability in store', 'Your design printed on the white back',
      rimNames.length ? 'Frosted rim in ' + rimNames.join(' or ') : ''].filter(Boolean).map(t => { const li = document.createElement('li'); li.textContent = t; return li; }));
    const done = i.caseType === RATED && i.rim === st.rim && i.model === st.model;
    choose.textContent = done ? 'Back to my design' : 'Choose Rated Case · ' + st.rim;
    choose.dataset.done = done ? '1' : '';
    st.items = items();
    thumbs.replaceChildren(...st.items.map((p, n) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'rg-thumb'; b.dataset.index = n;
      b.setAttribute('aria-label', 'Photo ' + (n + 1) + ' of ' + st.items.length + ': ' + p.caption);
      const t = document.createElement('img'); t.alt = ''; t.width = 200; t.height = 240; t.decoding = 'async'; t.draggable = false;
      t.onerror = () => { b.classList.add('rg-thumb-x'); b.dataset.n = n + 1; };
      t.src = src(p.thumb); b.append(t); return b;
    }));
    show(Math.min(st.index, Math.max(0, st.items.length - 1)), 0);
  }
  function message(text, retry) {
    msg.hidden = !text; msg.querySelector('p').textContent = text || ''; q('.rg-retry').hidden = !retry;
    img.classList.toggle('rg-off', !!text);
  }
  function show(n, dir) {
    const list = st.items, my = ++ticket;
    q('.rg-prev').hidden = q('.rg-next').hidden = list.length < 2;
    if (!list.length) {
      img.removeAttribute('src'); img.alt = ''; q('.rg-caption').textContent = ''; q('.rg-count').textContent = '';
      if (!manifest) message(request ? 'Loading photos…' : failText('Photos'), !request);
      return;
    }
    st.index = (n + list.length) % list.length;
    const p = list[st.index];
    message('');
    img.onload = () => {
      if (my !== ticket) return;
      img.classList.remove('rg-off');
      // the next photo is fetched while this one is looked at
      const next = list[(st.index + 1) % list.length]; if (next !== p) { const pre = new Image(); pre.decoding = 'async'; pre.src = src(file(next)); }
    };
    img.onerror = () => { if (my === ticket) message(failText('This photo'), true); };
    img.alt = p.alt; img.width = p.w; img.height = p.h;
    const want = src(file(p));
    if (img.getAttribute('src') !== want) img.src = want;
    else if (img.complete && !img.naturalWidth) { img.removeAttribute('src'); img.src = want; }
    if (dir && !reduce.matches) { img.classList.remove('rg-in-l', 'rg-in-r'); void img.offsetWidth; img.classList.add(dir > 0 ? 'rg-in-r' : 'rg-in-l'); }
    q('.rg-caption').textContent = p.caption;
    q('.rg-count').textContent = (st.index + 1) + ' of ' + list.length;
    thumbs.querySelectorAll('.rg-thumb').forEach((b, k) => { if (k === st.index) { b.setAttribute('aria-current', 'true'); if (dialog.open) keepInView(b); } else b.removeAttribute('aria-current'); });
  }
  function keepInView(b) {
    for (const box of [thumbs, q('.rg-side')]) {
      const r = b.getBoundingClientRect(), s = box.getBoundingClientRect();
      if (box.scrollWidth > box.clientWidth && (r.left < s.left || r.right > s.right)) box.scrollLeft += r.left - s.left - (s.width - r.width) / 2;
      if (box.scrollHeight > box.clientHeight && (r.top < s.top || r.bottom > s.bottom)) box.scrollTop += r.top - s.top - (s.height - r.height) / 2;
    }
  }
  const step = d => { if (st.items.length > 1) show(st.index + d, d); };

  function open(trigger) {
    if (dialog.open || purged) return;
    const i = core.info();
    if (!i.ratedAvailable) return;
    opened = trigger || opener; choice = null;
    // never the last phone's photo under this phone's caption while the new one loads
    if (st.model !== i.model) img.removeAttribute('src');
    st.model = i.model; st.set = 'mine'; st.index = 0; st.r = null; st.rim = i.caseType === RATED && i.rim ? i.rim : (i.rims[0] && i.rims[0].n) || '';
    const ready = () => { st.r = resolve(st.model, i); if (st.r) st.rim = chosenRim(i, st.r.rims); paint(); };
    // open first, so the photo's drawn size (which file to load) is known; nothing paints in between
    dialog.showModal(); lock(true);
    if (manifest) ready(); else { paint(); load().then(() => { if (dialog.open) ready(); }, () => { if (dialog.open) paint(); }); }
    // focus starts on the viewer itself (arrow keys browse at once) rather than ringing the Close button
    dialog.focus({ preventScroll: true });
    thumbs.scrollLeft = q('.rg-side').scrollTop = 0;
    // Back (a phone's back gesture too) closes the viewer instead of leaving the design
    try { token = Date.now().toString(36); history.pushState(Object.assign({}, history.state, { kpRatedPhotos: token }), ''); pushed = true; } catch (e) { pushed = false; }
  }
  function close() { if (dialog.open) dialog.close(); }
  /* the page behind keeps still while the viewer is open (a mouse wheel over the backdrop or panel scrolled it) */
  function lock(on) {
    const root = document.documentElement;
    if (on) { if (innerWidth - root.clientWidth > 0) root.style.scrollbarGutter = 'stable'; root.classList.add('rg-lock'); }
    else { root.classList.remove('rg-lock'); root.style.scrollbarGutter = ''; }
  }
  function finish() {
    clearTimeout(backTimer); backPending = false;
    const c = choice; choice = null;
    if (c && !purged) apply(c);
    if (!purged && opened && opened.isConnected && !opened.hidden) opened.focus({ preventScroll: true });
  }
  /* the same path as tapping the case radio, then the rim chip, under the case */
  function apply(c) {
    let i = core.info();
    if (i.model !== c.model || !i.ratedAvailable) return;
    if (editor) {
      const radio = document.querySelector('#studioCase input[name="studioCaseType"][value="' + RATED + '"]');
      if (radio && !radio.checked) radio.click();
      const chip = Array.prototype.find.call(document.querySelectorAll('#studioRim input[name="studioRim"]'), x => x.value === c.rim);
      if (chip && !chip.checked) chip.click();
    }
    i = core.info();
    if (i.caseType !== RATED) core.setCase(RATED);
    if (core.info().rim !== c.rim) core.setRim(c.rim);
  }
  dialog.addEventListener('close', () => {
    ticket++; img.onload = img.onerror = null; lock(false); sx = null;
    if (pushed) {
      pushed = false;
      if (!purged && history.state && history.state.kpRatedPhotos === token) {
        // leave the entry this viewer added; the case changes once the editor is back on its own entry (its address)
        backPending = true; backTimer = setTimeout(finish, 800); history.back(); return;
      }
    }
    finish();
  });
  window.addEventListener('popstate', () => {
    if (dialog.open) { pushed = false; dialog.close(); return; }
    if (backPending) { finish(); return; }
    // Forward onto the entry a closed viewer left behind: step back over it, so the editor never sits on an entry with
    // an older address (a Choose since then) or copies its marker into the steps it adds (Preview, Extras)
    const flag = history.state && history.state.kpRatedPhotos;
    if (!flag || purged) return;
    if (Date.now() - skippedAt > 1000) { skippedAt = Date.now(); history.back(); }
    else { const s = Object.assign({}, history.state); delete s.kpRatedPhotos; history.replaceState(s, ''); }
  });
  /* the backdrop closes the viewer only when the press started on it too (a photo drag released outside does not) */
  const outside = e => { const r = dialog.getBoundingClientRect(); return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom; };
  let backdropPress = false;
  dialog.addEventListener('pointerdown', e => { backdropPress = e.target === dialog && outside(e); });
  dialog.addEventListener('click', e => {
    const t = e.target;
    if (t === dialog) { const press = backdropPress; backdropPress = false; if (press && outside(e)) close(); return; }
    if (t.closest('.rg-close')) close();
    else if (t.closest('.rg-prev')) step(-1);
    else if (t.closest('.rg-next')) step(1);
    else if (t.closest('.rg-retry')) { if (!manifest) { message('Loading photos…'); load().then(() => { st.r = resolve(st.model, core.info()); if (st.r) st.rim = chosenRim(core.info(), st.r.rims); paint(); }, () => paint()); } else { img.removeAttribute('src'); show(st.index, 0); } }
    else if (t.closest('.rg-thumb')) show(+t.closest('.rg-thumb').dataset.index, +t.closest('.rg-thumb').dataset.index - st.index);
    else if (t.closest('[data-set]')) { const s = t.closest('[data-set]').dataset.set; if (s !== st.set) { st.set = s; st.index = 0; thumbs.scrollLeft = q('.rg-side').scrollTop = 0; paint(); } }
    else if (t.closest('[data-rim]')) { const n = t.closest('[data-rim]').dataset.rim; if (n !== st.rim) { st.rim = n; if (st.set === 'mine') st.index = Math.min(st.index, (st.r.set[n] || []).length - 1); paint(); } }
    else if (t.closest('.rg-choose')) { if (!choose.dataset.done) choice = { model: st.model, rim: st.rim }; close(); }
  });
  dialog.addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    // handled here only: the staff fit guides (?cal=1) also listen for arrow keys on the document
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); step(e.key === 'ArrowLeft' ? -1 : 1); }
  });
  /* swipe on the photo (touch, pen or a mouse drag); the frame keeps the pointer, so a drag released anywhere counts */
  let sx = null, sy = 0, sid = null;
  frame.addEventListener('pointerdown', e => {
    if (e.target.closest('button') || (e.pointerType === 'mouse' && e.button)) return;
    sx = e.clientX; sy = e.clientY; sid = e.pointerId;
    try { frame.setPointerCapture(e.pointerId); } catch (err) { /* the pointer is already gone */ }
  });
  frame.addEventListener('pointerup', e => {
    if (sx === null || e.pointerId !== sid) return;
    const dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) step(dx < 0 ? 1 : -1);
  });
  frame.addEventListener('pointercancel', () => { sx = null; });
  opener.addEventListener('click', () => open(opener));
  /* kiosk idle reset, Start over and Start next customer purge the session: the viewer closes and forgets the phone */
  document.addEventListener('kp:editor-purge', () => {
    purged = true; choice = null; clearTimeout(syncTimer);
    if (dialog.open) dialog.close();
    lock(false);
    img.removeAttribute('src'); img.alt = ''; thumbs.replaceChildren(); chips.replaceChildren(); chips.dataset.key = '';
    opener.hidden = true; openerImg.removeAttribute('src');
  });
  // a reload while the viewer was open leaves its history entry behind: make it an ordinary editor entry again
  if (history.state && history.state.kpRatedPhotos) { const s = Object.assign({}, history.state); delete s.kpRatedPhotos; history.replaceState(s, ''); }

  window.KPRatedGallery = { open: () => open(opener), close, get isOpen() { return dialog.open; }, load, resolve: m => (manifest ? resolve(m, null) : null), state: () => ({ model: st.model, rim: st.rim, set: st.set, index: st.index, count: st.items.length, src: img.getAttribute('src') || '' }) };
})();
