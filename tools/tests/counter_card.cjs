const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {chromium,webkit}=require('../../../playwright/node_modules/playwright-core');
const base=process.env.KP_BASE||'http://127.0.0.1:19038/';
(async()=>{for(const engine of [chromium,webkit]){
 const browser=await engine.launch();try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 const errors=[],posts=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()==='POST')posts.push(r.url());});
 await page.goto(base+'customizer.html?model=iphone-18-pro-max&design=city-night-new-york.jpg&store=Newark%2C+DE&glass=1');
 await page.waitForFunction(()=>window.__kp?.state.photoImg&&!__kp.state.libraryLoading&&!__kp.printIssue());
 assert.equal(await page.locator('#barStore').innerText(),'Newark');
 // A downloaded file is the fallback when native file sharing is unavailable.
 await page.evaluate(()=>Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>false}));
 await page.locator('#cartBtn').tap();
 await page.waitForFunction(()=>!document.getElementById('saveCounterCard').disabled);
 const details=await page.locator('#reviewDetails').innerText();
 for(const text of ['Newark, DE','$0.00','$64.98','Tempered glass'])assert(details.includes(text));
 const pickCode=(await page.locator('#reviewCode').innerText()).replace('Pick code · ','');
 assert(pickCode.endsWith('-G'));
 const downloadPromise=page.waitForEvent('download');await page.locator('#saveCounterCard').tap();
 const download=await downloadPromise;assert.equal(download.suggestedFilename(),'keepsake-counter-card.png');
 const out='/tmp/keepsake-counter-card-'+engine.name()+'.png';await download.saveAs(out);
 const png=await fs.readFile(out);assert.equal(png.readUInt32BE(16),900);assert(png.readUInt32BE(20)>1200);
 await page.screenshot({path:'/tmp/keepsake-counter-dialog-'+engine.name()+'.png'});
 // Native share receives a prepared PNG synchronously within the tap gesture.
 await page.evaluate(()=>{
  Object.defineProperty(navigator,'canShare',{configurable:true,value:({files})=>files[0].type==='image/png'});
  Object.defineProperty(navigator,'share',{configurable:true,value:({files})=>{window.sharedCard={name:files[0].name,size:files[0].size,active:navigator.userActivation.isActive};return Promise.resolve();}});
 });
 await page.locator('#saveCounterCard').tap();
 const share=await page.evaluate(()=>sharedCard);assert(share.size>10000);assert.equal(share.active,true);
 // Both controls stay inside the dialog, including a short landscape viewport.
 for(const [width,height] of [[320,568],[390,844],[820,390]]){
  await page.setViewportSize({width,height});
  await page.locator('#saveCounterCard').scrollIntoViewIfNeeded();
  const visible=await page.locator('#saveCounterCard').evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight&&document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===el;});
  assert(visible,'counter actions obscured at '+width+'×'+height);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
 await page.setViewportSize({width:390,height:844});
 await page.locator('#counterReview').getByRole('button',{name:'Back to my design'}).tap();
 // A late card cannot re-enable or replace a newer review after close/reopen.
 await page.evaluate(()=>{window.originalCreate=KPCounterCard.create;window.cardCalls=[];KPCounterCard.create=args=>new Promise(resolve=>cardCalls.push({args,resolve}));});
 await page.locator('#cartBtn').tap();await page.waitForFunction(()=>cardCalls.length===1);
 assert(await page.locator('#saveCounterCard').isDisabled());
 await page.locator('#counterReview').getByRole('button',{name:'Back to my design'}).tap();
 await page.locator('#cartBtn').tap();await page.waitForFunction(()=>cardCalls.length===2);
 await page.evaluate(()=>cardCalls[0].resolve(new Blob(['stale'],{type:'image/png'})));
 assert(await page.locator('#saveCounterCard').isDisabled());
 await page.evaluate(async()=>cardCalls[1].resolve(await originalCreate(cardCalls[1].args)));
 await page.waitForFunction(()=>!document.getElementById('saveCounterCard').disabled);
 await page.locator('#counterReview').getByRole('button',{name:'Back to my design'}).tap();
 // Failed preparation leaves the ordinary review usable.
 await page.evaluate(()=>{KPCounterCard.create=()=>Promise.reject(Error('fixture'));});
 await page.locator('#cartBtn').tap();await page.getByRole('button',{name:'Card unavailable'}).waitFor();
 assert(await page.locator('#saveCounterCard').isDisabled());
 assert((await page.locator('#reviewDetails').innerText()).includes('$64.98'));
 await page.locator('#counterReview').getByRole('button',{name:'Back to my design'}).tap();
 // Replacing a catalog design with a private photo must discard the catalog code.
 await page.evaluate(()=>{KPCounterCard.create=args=>{window.cardInput={code:args.code,rows:args.rows};return originalCreate(args);};});
 const fixture=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=1200;c.height=1800;const x=c.getContext('2d');x.fillStyle='#74bec7';x.fillRect(0,0,1200,1800);return c.toDataURL().split(',')[1];});
 await page.locator('#fileInput').setInputFiles({name:'private-fixture.png',mimeType:'image/png',buffer:Buffer.from(fixture,'base64')});
 await page.waitForFunction(()=>__kp.state.photoImg&&!__kp.state.isLibraryDesign&&!__kp.printIssue());
 await page.locator('#cartBtn').tap();await page.waitForFunction(()=>!document.getElementById('saveCounterCard').disabled);
 assert.equal(await page.evaluate(()=>cardInput.code),'Bring the original photos on your phone with this preview.');
 assert(!(await page.locator('#reviewCode').innerText()).includes('Pick code'));
 assert(!page.url().includes('private-fixture'));
 // The actual code from the customer opens the matching staff print workspace.
 const staff=await browser.newPage({viewport:{width:390,height:844}});
 await staff.goto(base+'instore/find.html?code='+encodeURIComponent(pickCode));
 await staff.waitForFunction(()=>document.getElementById('res').classList.contains('on'));
 assert((await staff.locator('#rname').innerText()).includes('Times Square Rain'));
 assert((await staff.locator('#rprice').innerText()).includes('$64.98'));
 await staff.locator('#ropen').click();
 await staff.waitForFunction(()=>window.__kp?.state.photoImg&&!__kp.state.libraryLoading&&!__kp.printIssue());
 assert.deepEqual(await staff.evaluate(()=>[__kp.state.model,__kp.state.photoImg.__kpDesignFile,__kp.state.addons.screen]),['iPhone 18 Pro Max','city-night-new-york.jpg',true]);
 const printSize=await staff.evaluate(()=>new Promise(resolve=>__kp.buildPrint(c=>resolve([c.width,c.height]))));
 assert(printSize.every(n=>n>500),'offline print export must be available');
 await staff.close();
 assert.deepEqual(errors,[]);assert.deepEqual(posts,[]);
 console.log(engine.name()+': Newark on reload, glass total, PNG download, native-share gesture, short screens, stale result, failure recovery, private photo replacement and staff print handoff passed');
 }finally{await browser.close();}
}})().catch(e=>{console.error(e);process.exitCode=1;});
