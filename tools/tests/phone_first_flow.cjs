const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,webkit}=require('../../../playwright/node_modules/playwright-core');
const base=process.env.KP_BASE||'http://127.0.0.1:19042/',out='../collaboration/neon-expansion-2026-11-25/phone-first';fs.mkdirSync(out,{recursive:true});
const ready=p=>p.waitForFunction(()=>window.KPStudioCore?.info().previewReady,{},{timeout:30000});
(async()=>{for(const engine of [chromium,webkit]){const b=await engine.launch();try{for(const [width,height] of [[390,844],[1024,768],[820,1180]]){
  const p=await b.newPage({viewport:{width,height},isMobile:width===390,hasTouch:true,reducedMotion:'reduce'}),errors=[],posts=[];
  p.setDefaultTimeout(20000);p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(r.method()==='POST')posts.push(r.url());});
  // Begin with the actual homepage call to action, not a test-only link.
  await p.goto(base);await p.locator(width===390?'.campaign-shop':'.header-cta.ks-start-case').first().click();await p.locator('#phoneFirst[open]').waitFor();
  assert.equal(await p.locator('#phoneFirstModels button').count(),30);
  assert.equal(await p.locator('#phoneFirst [aria-pressed=true]').innerText(),'Apple');
  assert(!await p.evaluate(()=>document.getElementById('phoneFirst').scrollWidth>innerWidth+1));
  await p.locator('#phoneFirst [data-brand=Google]').click();assert.equal(await p.locator('#phoneFirstModels button').count(),10);
  await p.locator('#phoneFirstSearch').fill('nonsense model');assert(await p.locator('#phoneFirstEmpty').isVisible());
  await p.locator('#phoneFirstSearch').fill('16 Pro');assert.equal(await p.locator('#phoneFirstModels button').count(),2);
  await p.screenshot({path:out+'/'+engine.name()+'-'+width+'-picker.png'});
  await p.locator('#phoneFirstModels [data-model="iPhone 16 Pro"]').click();await ready(p);
  assert.equal(await p.locator('#phoneFirst').count(),0);assert.equal(await p.evaluate(()=>KPStudioCore.info().model),'iPhone 16 Pro');assert.equal(await p.evaluate(()=>KPStudioCore.info().rim),'Smoke Frost');
  // A saved entry selection stays intact, even if the editor writes defaults while loading.
  const q=new URLSearchParams({design:'kp-neon-neon-recess.png',colorway:'original',case:'rated',rim:'Clear Frost',store:'West Chester, PA',back:'gallery.html?cat=Neon Doodles'});
  if(width!==390){q.set('kiosk','1');q.set('storeMode','fixed');}
  await p.goto(base+'customizer.html?'+q);await p.locator('#phoneFirst[open]').waitFor();
  await p.locator('#phoneFirstSearch').fill('15 Pro');await p.locator('#phoneFirstModels [data-model="iPhone 15 Pro"]').click();await ready(p);
  await p.waitForFunction(()=>window.__kp?.state.photoImg?.__kpDesignFile==='kp-neon-neon-recess.png'&&!KPStudioCore.info().issue);
  const u=new URL(p.url());for(const key of ['design','colorway','case','rim','store','back'])assert.equal(u.searchParams.get(key),q.get(key),key+' lost');
  assert.equal(await p.evaluate(()=>KPStudioCore.info().rim),'Clear Frost');
  if(width!==390)assert(await p.locator('#fileInput').isDisabled(),'Kiosk upload must remain disabled');
  await p.locator('#studioNext').click();await p.locator('#studioNext').click();
  if(await p.locator('#studioStorePicker summary').isVisible())await p.locator('#studioStorePicker summary').click();
  const store=p.locator('#storeChips [data-s="West Chester, PA"]');if(await store.isVisible()&&await store.isEnabled())await store.click();
  await p.locator('#addons [data-k=screen]').click();await p.locator('#studioAccessoryOpen').click();await p.locator('[data-category="Wall chargers"]').click();await p.locator('[data-accessory=X26]').click();await p.locator('#studioAccessoryDone').click();await p.waitForFunction(()=>!history.state?.kpStudioAccessory);
  await p.locator('#studioNext').click();await p.locator('#counterReview[open]').waitFor();await p.waitForFunction(()=>document.getElementById('reviewCode').textContent.startsWith('Pick code'));
  assert.equal(await p.evaluate(()=>KPStudioCore.info().model),'iPhone 15 Pro');assert.equal(await p.evaluate(()=>KPStudioCore.info().rim),'Clear Frost');assert.equal(await p.evaluate(()=>KPStudioCore.info().total),99.97);
  await p.screenshot({path:out+'/'+engine.name()+'-'+width+'-counter.png'});
  const code=(await p.locator('#reviewCode').innerText()).replace('Pick code · ','').trim();
  await p.goto(base+'instore/find.html?code='+encodeURIComponent(code));await p.waitForFunction(()=>document.getElementById('rimg').naturalWidth>0);await p.locator('#ropen').click();await ready(p);assert.equal(await p.locator('#phoneFirst').count(),0,'Counter links already know the model');
  // Invalid models must never silently become the latest iPhone.
  await p.goto(base+'customizer.html?model=not-a-phone');await p.locator('#phoneFirst[open]').waitFor();
  assert.deepEqual(errors,[]);assert.deepEqual(posts,[]);console.log('PASS',engine.name(),width,'home → phone → design → glass/charger → counter, known/unknown models, QR hold');await p.close();
}}finally{await b.close();}}})().catch(e=>{console.error(e);process.exitCode=1;});
