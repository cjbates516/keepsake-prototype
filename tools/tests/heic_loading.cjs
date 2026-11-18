const assert=require('node:assert/strict'),{chromium,webkit}=require('../../../playwright/node_modules/playwright-core');
const base=process.env.KP_BASE||'http://127.0.0.1:19038/';
(async()=>{for(const engine of [chromium,webkit]){const b=await engine.launch();try{
 const p=await b.newPage({viewport:{width:390,height:844}});let calls=0,release,fail=true;const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/heic2any.min.js',async route=>{calls++;if(fail){await route.abort();return;}await new Promise(r=>release=r);await route.fulfill({contentType:'text/javascript',body:'window.heic2any=({blob})=>Promise.resolve(blob);'});});
 await p.goto(base+'customizer.html',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.__kp);assert.equal(calls,0,'decoder is on demand');
 const png=await p.evaluate(()=>{const c=document.createElement('canvas');c.width=300;c.height=400;const x=c.getContext('2d');x.fillStyle='#127485';x.fillRect(0,0,300,400);return c.toDataURL().split(',')[1];});
 const file={name:'fixture.heic',mimeType:'image/heic',buffer:Buffer.from(png,'base64')};
 await p.locator('#fileInput').setInputFiles(file);await p.waitForFunction(()=>document.body.innerText.includes('We could not load HEIC support'));
 fail=false;await p.locator('#fileInput').setInputFiles(file);
 await p.waitForFunction(()=>document.body.innerText.includes('One moment — getting that photo ready'));
 await p.getByRole('button',{name:'Open navigation menu'}).click();await p.getByRole('button',{name:'Close navigation menu'}).click();
 while(!release)await new Promise(r=>setTimeout(r,20));release();
 await p.waitForFunction(()=>__kp.state.photoImg&&__kp.state.photoImg.width===300&&!__kp.state.isLibraryDesign);assert.equal(calls,2);assert.deepEqual(errors,[]);
 console.log(engine.name()+': HEIC decoder lazy load, failure/retry, delayed conversion and usable navigation passed (converter stubbed)');
 }finally{await b.close();}}})().catch(e=>{console.error(e);process.exitCode=1;});
