// Deliberately pause PNG encoding so editing during an export is deterministic.
const {chromium,webkit}=require('../../../playwright/node_modules/playwright-core');
const assert=require('assert');
const base=process.env.KP_BASE||'http://127.0.0.1:8766/';
(async()=>{for(const [engine,type] of Object.entries({chromium,webkit})){
 const b=await type.launch();try{const p=await b.newPage({acceptDownloads:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base+'customizer.html?staff=1&model=iphone-18-pro');
 await p.waitForFunction(()=>window.__kp);await p.locator('#nameInput').fill('Before');
 await p.locator('#spDownload:not([disabled])').waitFor();let downloads=0;p.on('download',()=>downloads++);
 await p.evaluate(()=>{const original=KPPrintPng.encode;window.restoreEncode=()=>KPPrintPng.encode=original;KPPrintPng.encode=c=>new Promise((resolve,reject)=>{window.finishHeld=()=>original(c).then(resolve,reject);});});
 await p.locator('#spDownload').click();await p.locator('#nameInput').fill('After');
 await p.evaluate(()=>finishHeld());await p.locator('#spDownload:not([disabled])').waitFor();await p.waitForTimeout(300);
 assert.equal(downloads,0,engine+': stale artwork must not download');
 for(const mode of ['throw','reject','null']){
 await p.evaluate(mode=>{KPPrintPng.encode=()=>{if(mode==='throw')throw Error('Injected failure');if(mode==='reject')return Promise.reject(null);return Promise.resolve(null);};},mode);
 await p.locator('#spDownload').click();await p.waitForFunction(()=>document.getElementById('spStatus').textContent.includes('could not be prepared'));
 assert.equal(await p.locator('#spDownload').isEnabled(),true,engine+': failure releases button');
 assert.equal(downloads,0,engine+': failure cannot download');
 }
 assert.deepEqual(errors,[],engine+': no unhandled errors');
 await p.evaluate(()=>restoreEncode());const ready=p.waitForEvent('download');await p.locator('#spDownload').click();const file=await ready;assert.equal(await file.failure(),null);assert.equal(downloads,1);
 console.log(engine+': changed artwork cancels pending export; sync/rejected/invalid encoding recovers; current artwork downloads');
 }finally{await b.close();}
}})().catch(e=>{console.error(e);process.exit(1)});
