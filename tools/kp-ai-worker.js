/**
 * Keepsake AI design worker (Cloudflare Worker)
 * Holds the fal.ai key, rate-limits, blocks banned content, returns the image as a data URL.
 *
 * Setup (one time):
 *   1. wrangler kv namespace create KP_LIMITS      -> put the id in wrangler.toml
 *   2. wrangler secret put FAL_KEY                 -> paste the fal.ai key when prompted
 *   3. wrangler deploy
 *   4. Put the worker URL into window.KP_AI_ENDPOINT (theme.liquid / customizer.html)
 *
 * wrangler.toml:
 *   name = "keepsake-ai"
 *   main = "kp-ai-worker.js"
 *   compatibility_date = "2026-07-01"
 *   [[kv_namespaces]]
 *   binding = "KP_LIMITS"
 *   id = "<from step 1>"
 */

const ALLOWED_ORIGINS = [
  'https://cjbates516.github.io',
  'https://8sg4p0-m1.myshopify.com',
];
const PER_IP_PER_DAY = 5;
const GLOBAL_PER_DAY = 300;              // hard daily budget backstop (~$3/day at 1c each)
const BANNED = /\b(nike|adidas|disney|marvel|pokemon|hello kitty|taylor swift|nfl|nba|mlb|gucci|louis vuitton|supreme|logo|trademark|nude|naked|nsfw|gore|blood|weapon|gun)\b/i;

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    const cors = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (req.method !== 'POST') return new Response('POST only', { status: 405, headers: cors });

    let prompt = '';
    try { prompt = String((await req.json()).prompt || '').slice(0, 200); } catch {}
    if (!prompt.trim()) return json({ error: 'empty prompt' }, 400, cors);
    if (BANNED.test(prompt)) return json({ error: 'content not allowed' }, 400, cors);

    // rate limits
    const day = new Date().toISOString().slice(0, 10);
    const ip = req.headers.get('CF-Connecting-IP') || 'unknown';
    const ipKey = `ip:${ip}:${day}`, gKey = `g:${day}`;
    const [ipN, gN] = await Promise.all([env.KP_LIMITS.get(ipKey), env.KP_LIMITS.get(gKey)]);
    if ((+ipN || 0) >= PER_IP_PER_DAY) return json({ error: 'daily limit reached — come back tomorrow!' }, 429, cors);
    if ((+gN || 0) >= GLOBAL_PER_DAY) return json({ error: 'the studio is closed for today' }, 429, cors);

    // generate: flux schnell, portrait, phone-case styling baked into the prompt
    const r = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: { 'Authorization': `Key ${env.FAL_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: `phone case design, ${prompt}, seamless full-bleed pattern, vibrant, high detail, no text, no watermark`,
        image_size: { width: 768, height: 1344 },
        num_images: 1,
        enable_safety_checker: true,
      }),
    });
    if (!r.ok) return json({ error: 'generation failed' }, 502, cors);
    const out = await r.json();
    const url = out?.images?.[0]?.url;
    if (!url) return json({ error: 'no image' }, 502, cors);

    // proxy the bytes as a data URL so the canvas is never CORS-tainted
    const imgRes = await fetch(url);
    const buf = await imgRes.arrayBuffer();
    const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
    const mime = imgRes.headers.get('Content-Type') || 'image/jpeg';

    await Promise.all([
      env.KP_LIMITS.put(ipKey, String((+ipN || 0) + 1), { expirationTtl: 90000 }),
      env.KP_LIMITS.put(gKey, String((+gN || 0) + 1), { expirationTtl: 90000 }),
    ]);
    return json({ image: `data:${mime};base64,${b64}` }, 200, cors);
  },
};

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status, headers: { 'Content-Type': 'application/json', ...cors },
  });
}
