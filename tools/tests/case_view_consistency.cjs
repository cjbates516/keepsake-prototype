const assert=require('node:assert/strict');
const {chromium,webkit}=require('../../../playwright/node_modules/playwright-core');
const base=process.env.KP_BASE||'http://127.0.0.1:19038/';
(async()=>{for(const engine of [chromium,webkit]){
 const b=await engine.launch();try{
  const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  for(const model of ['galaxy-s26-ultra','galaxy-s26','galaxy-s26-plus','iphone-15-pro-max','iphone-17-pro-max','iphone-18-pro','iphone-18-pro-max']){
   const point=model.startsWith('galaxy')?[900,650]:model.includes('17')?[1250,600]:[1000,650];
   const route='customizer.html?design=city-night-new-york.jpg&model='+model;
   const ready=()=>p.waitForFunction(()=>window.__kp?.state.photoImg&&!__kp.state.libraryLoading&&!__kp.printIssue());
   const camera=()=>p.waitForFunction(([a,b])=>{const c=document.getElementById('stageCanvas');return c.getContext('2d').getImageData(a*c.width/2500,b*c.height/3000,1,1).data[3]>240;},point);
   const print=()=>p.evaluate(async()=>{const c=await new Promise(r=>__kp.buildPrint(r));const blob=await new Promise(r=>c.toBlob(r));return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))).join(',');});
   // Legacy links must not restore the empty, dark-rimmed rendering.
   await p.goto(base+route+'&view=case',{waitUntil:'domcontentloaded'});await ready();await camera();
   assert.equal(await p.evaluate(()=>__kp.state.previewMode),'phone');
   assert.equal(await p.locator('#caseViewSwitch').isVisible(),false);
   if(model.includes('18')){
    // Alpha alone allowed the old bare-phone + 12px outline to pass. Require
    // the actual photographed clear bumper in the visible top rim instead.
    const delta=await p.locator('#stageCanvas').evaluate(async(c,isMax)=>{
     const im=new Image();im.src='assets/cases/i17'+(isMax?'pm':'p')+'-silver.webp';await im.decode();
     const ref=document.createElement('canvas');ref.width=c.width;ref.height=c.height;const x=ref.getContext('2d');x.drawImage(im,0,0,c.width,c.height);
     const a=c.getContext('2d').getImageData(0,0,c.width,c.height).data,b=x.getImageData(0,0,c.width,c.height).data;
     let count=0,error=0;const ymin=isMax?290:385,ymax=isMax?350:435;
     for(let y=Math.ceil(ymin*c.height/3000);y<ymax*c.height/3000;y++)for(let xx=Math.ceil(950*c.width/2500);xx<1500*c.width/2500;xx++){
      const i=(y*c.width+xx)*4;if(b[i+3]<245)continue;count++;for(let k=0;k<4;k++)error+=Math.abs(a[i+k]-b[i+k]);
     }return {count,error};
    },model.endsWith('max'));
    assert(delta.count>10&&delta.error/delta.count<2,model+' must show the photographed clear rim: '+JSON.stringify(delta));
   }
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
