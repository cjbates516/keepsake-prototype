/* Keepsake In Store offline cache.
   Controls only /instore/ pages. Pictures (design thumbnails, case photos, masks, fonts) are cache first,
   so a slow store connection never leaves blank tiles. The page and its JSON are network first with a
   short timeout, so updates still arrive but a dead connection falls back to the last good copy.
   CacheStorage is shared by the whole origin, so this worker only ever touches caches named kp-instore-*. */
var NS = 'kp-instore-';
var VERSION = NS + 'v7';
var SHELL = VERSION + '-shell';
/* pictures are keyed by ?v=<design hash>, so this cache can outlive worker versions and stay warm across updates */
var PICS = NS + 'pics-1';
var OURS = [SHELL, PICS];
/* REQUIRED: if any of these fails to download, the update is rejected and the old worker (with its complete
   offline copy) stays in charge; the browser tries the update again on a later visit. */
var REQUIRED = ['./', '../assets/print-layouts.js', '../assets/design-colorways.js', '../assets/colorway-catalog.js', 'instore-lib.js', 'config.json', 'models.json', 'codes.json', '../assets/designs/designs.json'];
var OPTIONAL = ['../assets/favicon.svg'];
var PIC_TIMEOUT_MS = 9000, NET_LIMIT_MS = 15000;

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(SHELL).then(function (c) {
    return c.addAll(REQUIRED).then(function () {
      return Promise.all(OPTIONAL.map(function (f) { return c.add(f).catch(function () {}); }));
    });
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) {
      return k.indexOf(NS) === 0 && OURS.indexOf(k) === -1;   /* only our own old versions */
    }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

/* image FILES only: assets/designs/designs.json lives in the same folder and must stay network first */
function isPicture(url) {
  return /\/assets\/(designs|cases|masks)\/.+\.(jpe?g|png|webp|gif|svg)$/i.test(url.pathname) || url.hostname === 'fonts.gstatic.com';
}
function isDesignList(url) { return /\/assets\/designs\/designs\.json$/.test(url.pathname); }
function later(ms, value) { return new Promise(function (resolve) { setTimeout(function () { resolve(value); }, ms); }); }
/* a captive portal answers everything with a 200 HTML page: never store HTML where data or a picture is expected */
function wrongType(req, res) {
  var path = new URL(req.url).pathname, ct = (res.headers.get('content-type') || '').toLowerCase();
  return ct.indexOf('html') > -1 && !/(\/|\.html)$/.test(path);
}

function cacheFirst(req) {
  return caches.open(PICS).then(function (c) {
    return c.match(req).then(function (hit) {
      if (hit) return hit;
      var net = fetch(req).then(function (res) {
        if (res && res.ok && !wrongType(req, res)) c.put(req, res.clone()).catch(function () {});
        return res;
      });
      /* a store network that hangs must not stall the page: give up after a while, the download keeps
         going in the background and lands in the cache for next time */
      return Promise.race([net, later(PIC_TIMEOUT_MS, null)]).then(function (res) {
        return res || Response.error();
      }, function () { return Response.error(); });
    });
  });
}
function networkFirst(req, ms) {
  return caches.open(SHELL).then(function (c) {
    var fallback = function () { return c.match(req, { ignoreSearch: true }); };
    /* a server error (404, 503...) counts as a failure: use the last good copy when we have one */
    var net = fetch(req).then(function (res) {
      if (res && res.ok && !wrongType(req, res)) { c.put(req, res.clone()).catch(function () {}); return res; }
      return fallback().then(function (hit) { return hit || res; });
    });
    return Promise.race([
      net.catch(fallback),
      later(ms).then(fallback)
    ]).then(function (res) {
      if (res) return res;
      /* nothing cached yet: wait for the network, but never forever, so the page reaches its error screen */
      return Promise.race([net, later(NET_LIMIT_MS, null)]).then(function (r) { return r || Response.error(); },
        function () { return Response.error(); });
    });
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin === self.location.origin && isDesignList(url)) { e.respondWith(networkFirst(req, 3500)); return; }
  if (url.origin === self.location.origin && /\/assets\/(colorway-catalog|design-colorways|print-layouts)\.js$/.test(url.pathname)) { e.respondWith(networkFirst(req, 3500)); return; }
  if (isPicture(url)) { e.respondWith(cacheFirst(req)); return; }
  if (url.hostname === 'fonts.googleapis.com') { e.respondWith(networkFirst(req, 2500)); return; }
  if (url.origin === self.location.origin &&
      (url.pathname.indexOf('/instore/') > -1 || /\/assets\/favicon\.svg$/.test(url.pathname))) {
    e.respondWith(networkFirst(req, 3500));
  }
});
