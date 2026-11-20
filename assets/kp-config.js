/* Keepsake site config. Edit this file, commit, push. */
window.KP_CONFIG = {
  /* Google Apps Script web app URL from tools/kp-orders-appsscript.js (Deploy, Web app). Empty = orders fall back to a reserve code. */
  ORDERS_ENDPOINT: '',
  /* Customer selection only: staff take payment in store. */
  IN_STORE_ONLY: true,
  /* One case option for launch. */
  PRICE: 44.99,
  GLASS_PRICE: 29.99,
  GLASS_BUNDLE_DISCOUNT: 10.00,
  CASE_NAME: 'MagSafe Clear',
  /* Optional: Cloudflare worker URL for AI designs (tools/kp-ai-worker.js). Empty = AI idea box hidden. */
  AI_ENDPOINT: ''
};
window.KP_CONFIG.bundledGlass = Math.round((window.KP_CONFIG.GLASS_PRICE - window.KP_CONFIG.GLASS_BUNDLE_DISCOUNT) * 100) / 100;
window.KP_ORDERS_ENDPOINT = window.KP_CONFIG.ORDERS_ENDPOINT;
window.KP_AI_ENDPOINT = window.KP_AI_ENDPOINT || window.KP_CONFIG.AI_ENDPOINT;

/* Optional accessories must not prevent browsing when their script is unavailable. */
window.KPAccessories=window.KPAccessories||{missing:true,label:function(x){return x?x.name:'';},stores:['West Chester, PA','Pottstown, PA','Newark, DE'],price:function(x){return x?x.price:0;},available:function(){return false;},items:[],parse:function(){return [];},valid:function(){return false;},total:function(){return 0;},get:function(){return null;},compatible:function(){return false;},mount:function(host){host.textContent='Accessories could not load. Refresh to retry, or ask a team member.';return {setStore:function(){},setModel:function(){},reset:function(){},selected:function(){return [];}};}};
