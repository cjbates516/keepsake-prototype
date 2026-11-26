const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,webkit}=require('../../../playwright/node_modules/playwright-core');
const base=process.env.KP_BASE||'http://127.0.0.1:19043/',out=process.env.KP_OUT||'/tmp/home-marketing-check';fs.mkdirSync(out,{recursive:true});
const sizes=[[390,844],[820,1180],[1024,768]];
(async()=>{for(const engine of [chromium,webkit]){const b=await engine.launch();try{for(const [width,height] of sizes){
 const p=await b.newPage({viewport:{width,height},hasTouch:true,isMobile:width===390,reducedMotion:'reduce'}),errors=[],posts=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(r.method()==='POST')posts.push(r.url())});p.setDefaultTimeout(30000);
 const kiosk=width!==390,home=base+(kiosk?'?kiosk=1&store=Newark%2C%20DE':'');
 await p.goto(home);const area=p.locator('.make-personal');await area.locator('img').evaluateAll(es=>{es.forEach(e=>e.loading='eager');return Promise.all(es.map(e=>e.decode()))});
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'homepage overflow');
 assert.equal(await p.locator('[data-frost-price]').first().innerText(),await p.evaluate(()=>'$'+KP_CONFIG.RATED_PRICE.toFixed(2)));
 assert.equal(await p.locator('[aria-labelledby="personal-title"],[aria-labelledby="ocean-rain-title"]').count(),0,'old tall duplicate sections remain');
 await area.evaluate(e=>window.scrollTo(0,e.offsetTop-60));await p.screenshot({path:out+'/'+engine.name()+'-'+width+'-home.png'});
 for(const flow of ['drawing','clear','smoke']){console.log('CHECK',engine.name(),width,flow);
  await p.goto(home);const link=p.locator('[data-campaign='+flow+']'),href=new URL(await link.getAttribute('href'),base);assert(!href.searchParams.has('model'));if(kiosk)assert.equal(href.searchParams.get('kiosk'),'1');
  await link.click();await p.locator('#phoneFirst[open]').waitFor();assert(await p.locator('#phoneFirst [data-series="iPhone 15 series"]').isVisible());
  await p.locator('#phoneFirst [data-series="iPhone 15 series"]').click();await p.locator('#phoneFirst [data-model="iPhone 15 Pro"]').click();await p.waitForURL(u=>u.searchParams.get('model')==='iphone-15-pro');await p.waitForLoadState('load');await p.waitForFunction(()=>!!window.KPStudioCore);
  if(flow==='drawing'&&!kiosk){if(await p.locator('#studioSheet[open]').count()){await p.locator('#studioDone').click();await p.waitForFunction(()=>!document.getElementById('studioSheet').open&&!history.state?.kpStudioTool);}await p.locator('#fileInput').setInputFiles('assets/home/personal/drawing-note.png');}
  if(flow==='drawing'&&kiosk){assert(await p.locator('#fileInput').isDisabled(),'kiosk upload hold');await p.waitForFunction(()=>KPStudioCore.info().drawing);}
  else await p.waitForFunction(()=>KPStudioCore.info().previewReady&&!KPStudioCore.info().issue);
  if(await p.locator('#studioSheet[open]').count()){await p.locator('#studioDone').click();await p.waitForFunction(()=>!document.getElementById('studioSheet').open);}
  const rim=flow==='smoke'?'Smoke Frost':'Clear Frost';assert.equal(await p.evaluate(()=>KPStudioCore.info().rim),rim);assert.equal(await p.evaluate(()=>KPStudioCore.info().model),'iPhone 15 Pro');
  await p.locator('#studioNext').click();await p.locator('#studioNext').click();await p.locator('#studioNext').click();await p.locator('#counterReview[open]').waitFor();
  assert((await p.locator('#reviewOverview').innerText()).includes(rim));assert.equal(await p.evaluate(()=>KPStudioCore.info().total),49.99);
  if(flow!=='drawing'||!kiosk)assert(await p.evaluate(()=>{const src=document.getElementById('stageCanvas'),preview=document.getElementById('reviewPreview'),c=document.createElement('canvas');c.width=preview.width;c.height=preview.height;c.getContext('2d').drawImage(src,0,0,c.width,c.height);return c.toDataURL()===preview.toDataURL();}),'Counter preview differs from design');
  if(kiosk)assert(await p.locator('#fileInput').isDisabled());
  await p.screenshot({path:out+'/'+engine.name()+'-'+width+'-'+flow+'-counter.png'});
 }
 assert.deepEqual(errors,[]);assert.deepEqual(posts,[]);console.log('PASS',engine.name(),width,'drawing and both frost finishes → series/model → preview → counter; QR hold');await p.close();
}}finally{await b.close();}}
// A missing script still leaves usable links and visible pricing.
const b=await chromium.launch();try{const p=await b.newPage({javaScriptEnabled:false,viewport:{width:320,height:800}});await p.goto(base);assert.equal(await p.locator('[data-campaign]').count(),3);assert(await p.locator('.make-personal').evaluate(e=>e.scrollWidth<=e.clientWidth&&e.getBoundingClientRect().right<=innerWidth));console.log('PASS no-JS campaign links and 320px campaign layout');}finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
