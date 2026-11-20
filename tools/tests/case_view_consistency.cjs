const assert=require('node:assert/strict');
const {chromium,webkit}=require('../../../playwright/node_modules/playwright-core');
const base=process.env.KP_BASE||'http://127.0.0.1:19038/';
(async()=>{for(const engine of [chromium,webkit]){
 const b=await engine.launch();try{
  const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  for(const model of ['galaxy-s26-ultra','galaxy-s26','galaxy-s26-plus','iphone-15-pro-max','iphone-17-pro-max']){
   const point=model.startsWith('galaxy')?[900,650]:model.includes('17')?[1250,600]:[1000,650];
   const route='customizer.html?design=city-night-new-york.jpg&model='+model;
   const ready=()=>p.waitForFunction(()=>window.__kp?.state.photoImg&&!__kp.state.libraryLoading&&!__kp.printIssue());
   const camera=()=>p.waitForFunction(([a,b])=>{const c=document.getElementById('stageCanvas');return c.getContext('2d').getImageData(a*c.width/2500,b*c.height/3000,1,1).data[3]>240;},point);
   const print=()=>p.evaluate(async()=>{const c=await new Promise(r=>__kp.buildPrint(r));const blob=await new Promise(r=>c.toBlob(r));return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))).join(',');});
   // Legacy links must not restore the empty, dark-rimmed rendering.
   await p.goto(base+route+'&view=case',{waitUntil:'domcontentloaded'});await ready();await camera();
   assert.equal(await p.evaluate(()=>__kp.state.previewMode),'phone');
   assert.equal(await p.locator('#caseViewSwitch').isVisible(),false);
   const hash=await print();
   await p.locator('#skyCaseZoom').tap();await p.locator('#caseZoomDialog canvas').waitFor();
   await p.locator('#caseZoomDialog [data-close]').tap();
   await p.goto(base+route+'&view=phone',{waitUntil:'domcontentloaded'});await ready();await camera();
   assert.equal(await print(),hash,model+' print changed with legacy URL');
   await p.goto(base+'gallery.html?cat=City%20Scenes&device='+model+'&view=case',{waitUntil:'domcontentloaded'});
   await p.waitForFunction(()=>document.querySelector('#grid canvas[data-rendered-preview]'));
   await p.waitForFunction(([a,b])=>{const c=document.querySelector('#grid canvas[data-rendered-preview]');return c&&c.getContext('2d').getImageData(a*c.width/2500,b*c.height/3000,1,1).data[3]>240;},point);
   assert.equal(await p.locator('#galleryCaseView').isVisible(),false);
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   console.log(engine.name(),model,'mounted clear-case gallery/customizer/zoom, legacy links, unchanged print passed');
  }
  await p.goto(base+'gallery.html');
  await p.waitForFunction(()=>document.querySelector('#grid canvas[data-rendered-preview]'));
  assert(await p.locator('#grid canvas[data-rendered-preview]').count()>0,'model-free browsing has case previews');
  assert.deepEqual(errors,[]);
 }finally{await b.close();}
}})().catch(e=>{console.error(e);process.exitCode=1;});
