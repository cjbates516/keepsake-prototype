/* Keepsake In Store mode: shared data, pick codes and case rendering.
   Used by instore/index.html (the iPad browse screens) and instore/find.html (team member lookup).
   Case rendering follows gallery.html renderCase(): the design is cover fit into the model's
   view mask box, lightly shaded by the phone photo, then clipped by the view mask, the same
   mask the print export uses. */
(function () {
  'use strict';
  var ROOT = '../';
  var MOCK_W = 2500, MOCK_H = 3000;
  var KPI = window.KPI = {};

  /* every download has a time limit, so a network that never answers still ends in an error the page can handle */
  var JSON_LIMIT_MS = 12000;
  function getJSON(url) {
    var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null, timer = null;
    var req = fetch(url, ctl ? { cache: 'no-cache', signal: ctl.signal } : { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(url + ' ' + r.status);
      return r.json();
    });
    if (typeof setTimeout === 'undefined') return req;
    var limit = new Promise(function (resolve, reject) {
      timer = setTimeout(function () { if (ctl) ctl.abort(); reject(new Error(url + ' timed out')); }, JSON_LIMIT_MS);
    });
    return Promise.race([req, limit]).then(function (v) { clearTimeout(timer); return v; }, function (e) { clearTimeout(timer); throw e; });
  }
  function cmp(a, b) { return a < b ? -1 : (a > b ? 1 : 0); }
  function pad3(n) { n = String(n); while (n.length < 3) n = '0' + n; return n; }

  /* ---------- data ---------- */
  KPI.load = function (prefix) {
    prefix = prefix || "";
    return Promise.all([
      getJSON(prefix+'config.json'),
      getJSON(prefix+'models.json'),
      getJSON(prefix+ROOT+'assets/designs/designs.json'),
      /* the pick code list is REQUIRED: if it does not load, loading fails and the page shows its
         "ask a team member" screen, so no code is ever shown that the team cannot look up (fail closed) */
      getJSON(prefix+'codes.json').then(function (c) {
        if (!c || typeof c.codes !== 'object') throw new Error('codes.json has no codes');
        c._ok = true; return c;
      })
    ]).then(function (res) {
      var config = res[0], models = res[1].models || res[1], all = res[2], codes = res[3];
      var rawPrice = config && config.price, price = Number(rawPrice);
      if ((typeof rawPrice !== 'number' && !(typeof rawPrice === 'string' && /^\d+(\.\d{1,2})?$/.test(rawPrice))) || !Number.isFinite(price) || price < 0.01 || Math.abs(price * 100 - Math.round(price * 100)) > 0.000001) throw new Error('Case price is unavailable. Ask a team member.');
      var cols = {}, colList = [], used = {};
      (config.collections || []).forEach(function (c, i) {
        var col = { category: c.category, label: c.label || c.category, code: c.code, order: i };
        cols[c.category] = col; colList.push(col); used[c.code] = true;
      });
      /* categories missing from config.json get a code that never collides with a configured one;
         same rule and order as fallback_codes() in tools/instore_codes.py */
      var extra = {};
      all.forEach(function (d) { if (!cols[d.category]) extra[d.category] = true; });
      Object.keys(extra).sort(cmp).forEach(function (cat) {
        var code = KPI.fallbackCode(cat, used);
        used[code] = true;
        cols[cat] = { category: cat, label: cat, code: code, order: 1000 + colList.length };
        colList.push(cols[cat]);
      });
      function colFor(cat) { return cols[cat]; }
      var excluded = {};
      var ex = config.exclude_files || {};
      (Array.isArray(ex) ? ex : Object.keys(ex).reduce(function (a, k) { return a.concat(ex[k]); }, [])).forEach(function (f) { excluded[f] = true; });
      /* pick code numbers come ONLY from codes.json (made by tools/instore_codes.py). A design that is not in
         the list, or whose collection changed since, gets no code instead of a guessed one, so a code shown on
         one iPad can never point to a different design on another device. */
      var codesOk = !!codes._ok, reg = codes.codes || {}, retired = codes.retired || {};
      all.forEach(function (d) {
        var col = colFor(d.category), r = reg[d.file];
        d._col = col;
        d._n = (codesOk && r && r.c === col.code) ? r.n : null;
      });
      var designs = all.filter(function (d) { return !d.hidden && d.active !== false && !excluded[d.file]; });
      designs.sort(function (a, b) { return (a._col.order - b._col.order) || cmp(a.title, b.title) || cmp(a.file, b.file); });
      var data = {
        config: config,
        price: price,
        idleMs: Math.max(15, Number(config.idle_seconds) || 75) * 1000,
        assetsVersion: String(config.assets_version || '11'),
        models: models,
        activeModels: models.filter(function (m) { return m.active; }),
        allDesigns: all,
        designs: designs,
        collections: colList,
        codesOk: codesOk
      };
      KPI._assetsVersion = data.assetsVersion;
      data.modelById = function (id) {
        for (var i = 0; i < models.length; i++) if (models[i].id === id) return models[i];
        return null;
      };
      /* team member lookup: current codes first, then codes retired when a design moved collection */
      data.findByCode = function (p) {
        var hit = null, i;
        if (!codesOk || !p) return null;
        for (i = 0; i < all.length; i++) if (all[i]._col.code === p.col && all[i]._n === p.n) { hit = all[i]; break; }
        if (!hit && retired[p.col + '-' + pad3(p.n)]) {
          var f = retired[p.col + '-' + pad3(p.n)];
          for (i = 0; i < all.length; i++) if (all[i].file === f) { hit = all[i]; break; }
        }
        return hit;
      };
      data.designsFor = function (model) {
        return designs.filter(function (d) {
          return !d.compatible_models || d.compatible_models.indexOf(model.id) > -1;
        });
      };
      return data;
    });
  };

  /* null when the design has no registered number yet: callers must then show no code */
  KPI.colorways = function(d){return window.KPDesignColorways?KPDesignColorways.choicesFor({__kpDesignFile:d.file}):[{id:'original',name:'Original'}];};
  KPI.pickCode = function (model, design, colorway, glass, charger, accessories, store, rim, finish) {
    if (!model || !design || design._n == null) return null;
    var code=model.id+'-'+design._col.code+'-'+pad3(design._n);
    if(colorway&&colorway!=='original'){
      var selected=KPI.colorways(design).find(function(c){return c.id===colorway;});
      if(!selected||! /^[1-6]$/.test(String(selected.code)))return null;code+='-C'+selected.code;
    }
    if(accessories&&accessories.length&&(!window.KPAccessories||!KPAccessories.valid(accessories)))return null;
    var extras=window.KPAccessories?KPAccessories.parse(accessories):[];
    if(extras.length&&KPAccessories.stores.indexOf(store)<0)return null;
    var finishIndex=finish?(model.finishes||[]).findIndex(function(f){return !f.retired&&f.n===finish;}):-1;
    if(finish&&finishIndex<0)return null;
    return code + (glass ? '-G' : '') + (charger ? '-A' : '')+(extras.length?'-'+extras.join('-'):'')+(window.KPAccessories&&KPAccessories.stores.indexOf(store)>=0?'-S'+(KPAccessories.stores.indexOf(store)+1):'')+(finishIndex>=0?'-P'+(finishIndex+1):'')+(rim==='Smoke Frost'?'-FS':rim==='Clear Frost'?'-FC':'');
  };
  KPI.pad3 = pad3;
  KPI.fallbackCode = function (cat, used) {
    var base = (String(cat).replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'GEN');
    while (base.length < 3) base += 'X';
    if (!used[base]) return base;
    for (var i = 1; i < 100; i++) {
      var c = i < 10 ? base.slice(0, 2) + i : base.slice(0, 1) + i;
      if (!used[c]) return c;
    }
    return 'Z' + Object.keys(used).length;
  };
  /* Accepts 17P-FLR-012, 17p flr 12, 17P.FLR.012 and 17PFLR012. Without separators the phone id is
     matched against the known ids (longest first), because ids and collection codes both use letters. */
  KPI.parseCode = function (text, modelIds) {
    var t = String(text || '').toUpperCase().trim().replace(/[\s_.\u2010-\u2015\u2212]+/g, '-').replace(/-+/g, '-');
    var frost=t.match(/-F([SC])$/),rim=frost?(frost[1]==='S'?'Smoke Frost':'Clear Frost'):null;if(frost)t=t.slice(0,frost.index);
    var phoneSuffix=t.match(/-P([1-9][0-9]?)$/),finishIndex=phoneSuffix?Number(phoneSuffix[1]):0;if(phoneSuffix)t=t.slice(0,phoneSuffix.index);
    var storeSuffix=t.match(/-S([1-3])$/),store=storeSuffix&&window.KPAccessories?KPAccessories.stores[Number(storeSuffix[1])-1]:null;
    if(storeSuffix)t=t.slice(0,storeSuffix.index);
    var extraSuffix=t.match(/(-X\d{2})+$/),accessories=[];
    if(extraSuffix){accessories=extraSuffix[0].slice(1).split('-');if(!window.KPAccessories||!KPAccessories.valid(accessories))return null;accessories=KPAccessories.parse(accessories);t=t.slice(0,extraSuffix.index);}
    if(accessories.length&&!store)return null;
    var charger=/[0-9G]-?A$/.test(t);
    if(charger)t=t.replace(/-?A$/, '');
    var glass=/[0-9]-?G$/.test(t);
    if(glass)t=t.replace(/-?G$/, '');
    var suffix=t.match(/(\d)-?C([1-6])$/),colorway=suffix?Number(suffix[2]):0;
    if(suffix)t=t.slice(0,suffix.index)+suffix[1];
    function result(model,col,n){var p={model:model,col:col,n:n};if(rim)p.rim=rim;if(finishIndex)p.finishIndex=finishIndex;if(colorway)p.colorway=colorway;if(glass)p.glass=true;if(charger)p.charger=true;if(accessories.length)p.accessories=accessories;if(store)p.store=store;return p;}
    var m = t.match(/^([A-Z0-9]+)-([A-Z0-9]{3})-(\d{1,4})$/);
    if (m) return result(m[1],m[2],parseInt(m[3],10));
    var flat = t.replace(/-/g, ''), ids = (modelIds || []).slice().sort(function (a, b) { return b.length - a.length; });
    for (var i = 0; i < ids.length; i++) {
      var id = String(ids[i]).toUpperCase();
      if (flat.indexOf(id) !== 0) continue;
      var rest = flat.slice(id.length).match(/^([A-Z0-9]{3})(\d{1,4})$/);
      if (rest) return result(id,rest[1],parseInt(rest[2],10));
    }
    return null;
  };
  /* Titles come from file names; tidy them and keep dashes out of customer facing text. */
  KPI.cleanTitle = function (t) {
    var s = String(t || '')
      .replace(/\b\d{5,}\b/g, ' ')                                   /* stock image ids */
      .replace(/\s+(Graphic\s+)?T-?\s?shirt\b/ig, ' ')
      .replace(/\s+(for\s+(a\s+)?)?(Mug|Phone\s+Case|Event\s+Sign)\b/ig, ' ')
      .replace(/\s+(transparent|png)\b/ig, ' ')
      .replace(/\s*[\u2012-\u2015\u2212]\s*/g, ', ')                    /* figure, en, em dashes and minus */
      .replace(/\s+[-\u2010\u2011]+\s+/g, ', ')                           /* spaced hyphen used as a dash */
      .replace(/[-\u2010\u2011]+/g, ' ')                                   /* any other hyphen */
      .replace(/\s{2,}/g, ' ').trim();
    for (var i = 0; i < 4; i++) s = s.replace(/[\s,]+(for|with|of|and|in|on|the|a|an|to)$/i, '').replace(/[\s,]+$/, '');
    return s.replace(/^[,\s]+/, '') || String(t || '').replace(/[-\u2010-\u2015\u2212]+/g, ' ').trim();
  };
  KPI.formatPrice = function (p) { return '$' + Number(p).toFixed(2); };
  KPI.thumbUrl = function (d) { return ROOT + 'assets/designs/thumbs/' + encodeURIComponent(d.file) + '?v=' + (d.hash || '1'); };
  KPI.fullUrl = function (d) { return ROOT + 'assets/designs/' + encodeURIComponent(d.file) + '?v=' + (d.hash || '1'); };
  KPI.customizerUrl = function (model, d, colorway, glass, charger, accessories, store, rim, finish) {
    return ROOT + 'customizer.html?staff=1&design=' + encodeURIComponent(d.file) + '&model=' + encodeURIComponent(model.name.replace(/ /g, '-'))+(colorway&&colorway!=='original'?'&colorway='+encodeURIComponent(colorway):'')+(glass?'&glass=1':'')+(charger?'&charger=1':'')+(accessories&&accessories.length?'&extras='+encodeURIComponent(accessories.join(',')):'')+(store?'&store='+encodeURIComponent(store):'')+(rim?'&case=rated&rim='+encodeURIComponent(rim):'')+(finish?'&finish='+encodeURIComponent(finish):'');
  };

  /* ---------- images ---------- */
  /* opts.timeout (ms) gives up on a hung download; opts.cache false keeps no reference, so hundreds of
     decoded thumbnails and full size designs are not held in memory all day on the iPad */
  var imgCache = {};
  KPI.loadImage = function (src, opts) {
    opts = opts || {};
    var keep = opts.cache !== false;
    if (keep && imgCache[src]) return imgCache[src];
    var p = new Promise(function (resolve, reject) {
      var im = new Image(), timer = null, done = false;
      function finish(ok) {
        if (done) return;
        done = true; clearTimeout(timer); im.onload = im.onerror = null;
        if (ok) resolve(im);
        else { try { im.removeAttribute('src'); } catch (e) {} reject(new Error('image ' + src)); }
      }
      im.decoding = 'async';
      im.onload = function () { finish(true); };
      im.onerror = function () { finish(false); };
      if (opts.timeout) timer = setTimeout(function () { finish(false); }, opts.timeout);
      if(src.indexOf('assets/designs/')>=0) im.__kpDesignFile=decodeURIComponent(src.split('?')[0].split('/').pop());
      im.src = src;
    });
    if (keep) { imgCache[src] = p; p.catch(function () { delete imgCache[src]; }); }
    return p;
  };
  function canvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  /* tiny grey light map from the phone photo, same as gallery.html shadeOf() */
  function shadeOf(img) {
    var m = canvas(20, 24), mc = m.getContext('2d');
    mc.fillStyle = '#fff'; mc.fillRect(0, 0, 20, 24);
    mc.drawImage(img, 0, 0, 20, 24);
    var d = mc.getImageData(0, 0, 20, 24), p = d.data, sum = 0, n = 0, i, l, v;
    for (i = 0; i < p.length; i += 4) {
      l = p[i] * 0.299 + p[i + 1] * 0.587 + p[i + 2] * 0.114;
      p[i] = p[i + 1] = p[i + 2] = l;
      if (l < 250) { sum += l; n++; }
    }
    var k = n ? 242 / Math.max(sum / n, 90) : 1;
    for (i = 0; i < p.length; i += 4) {
      v = Math.min(255, p[i] * k);
      v = 242 + (v - 242) * 0.45; v = Math.max(206, Math.min(248, v));
      p[i] = p[i + 1] = p[i + 2] = v;
    }
    mc.putImageData(d, 0, 0);
    return m;
  }

  /* Prepare a model at a given output width. withMask false = phone photo only (phone picker). */
  var prepCache = {};
  KPI.prepModel = function (model, width, withMask, rim, finish) {
    var key = model.id + '@' + width + (withMask === false ? 'n' : 'm')+(rim||'')+'|'+(finish||'');
    if (prepCache[key]) return prepCache[key];
    /* case photo and mask are only needed until they are drawn into canvases below, so keep no reference */
    var v = '?v=' + encodeURIComponent(KPI._assetsVersion || '11');
    var frost=rim&&window.KPFrostSamples?.config(model.name,null,rim);
    if(frost&&frost.rim!==rim)return Promise.reject(Error('Frost finish not available for this phone'));
    var choice=finish&&(model.finishes||[]).find(function(f){return !f.retired&&f.n===finish;});
    if(finish&&!choice)return Promise.reject(Error('Phone finish unavailable'));
    var phoneSrc=choice?ROOT+'assets/cases/'+choice.f+v:KPI.caseUrl(model);
    var jobs = [KPI.loadImage(phoneSrc, { timeout: 15000, cache: false })];
    if (withMask !== false) jobs.push(KPI.loadImage(KPI.maskUrl(model), { timeout: 15000, cache: false }));
    prepCache[key] = Promise.all(jobs).then(async function (imgs) {
      if(frost&&withMask!==false){const f=await KPFrostSamples.prepare(model.name,null,phoneSrc,2500,3000,ROOT,rim);imgs[0]=f.base;imgs[1]=f.mask;}
      var layouts=window.KP_PRINT_LAYOUTS||{},layout=layouts[model.name]||layouts['Samsung '+model.name];
      if(withMask!==false&&!layout)throw new Error('Print preview geometry unavailable. Reload to try again.');
      var ob = model.case_box, vb = layout?(frost&&layout.ratedBox?layout.ratedBox:layout.box):model.mask_box, padX = 40, padY = 40;
      var x0 = Math.min(ob[0], vb[0]) - padX, y0 = Math.min(ob[1], vb[1]) - padY;
      var x1 = Math.max(ob[2], vb[2]) + padX, y1 = Math.max(ob[3], vb[3]) + padY;
      var k = width / (x1 - x0), W = Math.round((x1 - x0) * k), H = Math.round((y1 - y0) * k);
      var full = [-x0 * k, -y0 * k, MOCK_W * k, MOCK_H * k];
      var caseC = canvas(W, H);
      caseC.getContext('2d').drawImage(imgs[0], full[0], full[1], full[2], full[3]);
      var prep = { model: model, artRatio:layout?layout.rx:1, bleedX:layout?layout.bleedX*k:0, bleedY:layout?layout.bleedY*k:0, W: W, H: H, full: full, caseC: caseC, shade: shadeOf(imgs[0]),
        box: [(vb[0] - x0) * k, (vb[1] - y0) * k, (vb[2] - vb[0]) * k, (vb[3] - vb[1]) * k] };
      var rimPath=window.KPCaseShell?.rimPath(model.name);
      if(rimPath&&!frost){prep.rim=new Path2D();prep.rim.addPath(rimPath,new DOMMatrix().translate(full[0],full[1]).scale(k));}
      if (imgs[1]) {
        /* rasterize the mask once: WebKit mis-composites an <img> used as a destination-in source */
        prep.maskC = canvas(W, H);
        prep.maskC.getContext('2d').drawImage(imgs[1], full[0], full[1], full[2], full[3]);
      }
      return prep;
    });
    prepCache[key].catch(function () { delete prepCache[key]; });
    return prepCache[key];
  };

  /* Free the big canvases kept for a phone (the iPad keeps one phone's renders at a time). keep: key suffixes to keep. */
  KPI.releaseModel = function (id, keep) {
    window.KPFrostSamples?.clear();
    Object.keys(prepCache).forEach(function (key) {
      if (key.indexOf(id + '@') !== 0 || (keep && keep.some(function (k) { return key === id + '@' + k; }))) return;
      var p = prepCache[key]; delete prepCache[key];
      p.then(function (prep) {
        prep.released=true;
        ['caseC', 'maskC', '_work', '_out'].forEach(function (k) { if (prep[k]) { prep[k].width = 0; prep[k].height = 0; prep[k] = null; } });
      }).catch(function () {});
    });
  };
  KPI.caseUrl = function (m) { return ROOT + 'assets/cases/' + m.case + '?v=' + encodeURIComponent(KPI._assetsVersion || '11'); };
  KPI.maskUrl = function (m) { return ROOT + 'assets/masks/' + m.mask + '?v=' + encodeURIComponent(KPI._assetsVersion || '11'); };

  /* Draw a design on the case. design may be null (phone only). bg fills behind for JPEG output. */
  KPI.render = function (prep, designImg, bg, into) {
    if(prep.released)throw new Error('Phone preview was released');
    var c = into || canvas(prep.W, prep.H);
    if (c.width !== prep.W || c.height !== prep.H) { c.width = prep.W; c.height = prep.H; }
    var x = c.getContext('2d');
    x.clearRect(0, 0, prep.W, prep.H);
    if (bg) { x.fillStyle = bg; x.fillRect(0, 0, prep.W, prep.H); }
    x.drawImage(prep.caseC, 0, 0);
    if (designImg && prep.maskC) {
      var t = prep._work || (prep._work = canvas(prep.W, prep.H)), tc = t.getContext('2d');
      tc.globalAlpha = 1; tc.globalCompositeOperation = 'source-over';
      tc.clearRect(0, 0, prep.W, prep.H);
      var b = prep.box, iw = designImg.naturalWidth || designImg.width, ih = designImg.naturalHeight || designImg.height;
      var rx=prep.artRatio||1;
      var s = Math.max((b[2]+2*prep.bleedX) / rx / iw, (b[3]+2*prep.bleedY) / ih), w = iw * s * rx, h = ih * s;
      try { tc.filter = 'none'; } catch (e) {}
      tc.drawImage(designImg, b[0] + (b[2] - w) / 2, b[1] + (b[3] - h) / 2, w, h);
      try { tc.filter = 'none'; } catch (e) {}
      /* Preserve artwork alpha: an all-over shade would tint the clear portions. */
      tc.globalAlpha = 1; tc.globalCompositeOperation = 'destination-in';
      tc.drawImage(prep.maskC, 0, 0);
      tc.globalCompositeOperation = 'source-over';
      x.drawImage(t, 0, 0);
    }
    if(prep.rim){
      x.save();x.clip(prep.rim,'evenodd');x.clearRect(0,0,prep.W,prep.H);
      if(bg){x.fillStyle=bg;x.fillRect(0,0,prep.W,prep.H);}
      x.drawImage(prep.caseC,0,0);x.restore();
    }
    return c;
  };

  /* Render to an object URL (keeps memory low with hundreds of tiles).
     With a background colour it is a small JPEG; without one it is a PNG so the area around the case stays clear. */
  KPI.renderToUrl = function (prep, designImg, bg, colorway) {
    var ready=window.KPDesignColorways&&colorway&&colorway!=='original'?KPDesignColorways.prepare(designImg):Promise.resolve();
    return ready.then(function(){
    if(prep.released)throw new Error('Phone preview was released');
    if(colorway&&colorway!=='original'&&(!window.KPDesignColorways||!KPDesignColorways.profile(designImg)))throw new Error('Background preview unavailable');
    var composed=null;
    if(window.KPDesignColorways&&KPDesignColorways.profile(designImg)){composed=KPDesignColorways.make(designImg,colorway||'original',1200);designImg=composed;}
    var c = KPI.render(prep, designImg, bg, prep._out || (prep._out = canvas(prep.W, prep.H)));
    if(composed)composed.width=composed.height=0;
    var type = bg ? 'image/jpeg' : 'image/png', q = bg ? 0.86 : undefined;
    return new Promise(function (resolve,reject) {
      if (c.toBlob) {
        c.toBlob(function (blob) { try{resolve(blob ? URL.createObjectURL(blob) : c.toDataURL(type, q));}catch(e){reject(e);} }, type, q);
      } else {
        resolve(c.toDataURL(type, q));
      }
    });
    });
  };
})();
