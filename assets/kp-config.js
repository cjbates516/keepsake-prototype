/* Keepsake site config. Edit this file, commit, push. */
window.KP_CONFIG = {
  /* Google Apps Script web app URL from tools/kp-orders-appsscript.js (Deploy, Web app). Empty = orders fall back to a reserve code. */
  ORDERS_ENDPOINT: '',
  /* One case option for launch. */
  PRICE: 59.99,
  CASE_NAME: 'MagSafe Clear',
  /* Optional: Cloudflare worker URL for AI designs (tools/kp-ai-worker.js). Empty = AI idea box hidden. */
  AI_ENDPOINT: ''
};
window.KP_ORDERS_ENDPOINT = window.KP_CONFIG.ORDERS_ENDPOINT;
window.KP_AI_ENDPOINT = window.KP_AI_ENDPOINT || window.KP_CONFIG.AI_ENDPOINT;
