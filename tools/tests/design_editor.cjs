const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,webkit}=require('../../../playwright/node_modules/playwright-core');
const base=process.env.KP_BASE||'http://127.0.0.1:19038/';
const out='../collaboration/editor-qa';fs.mkdirSync(out,{recursive:true});
const ready=p=>p.waitForFunction(()=>window.KPEditor&&!KPStudioCore.info().issue);
async function tool(p,id){await p.locator('[data-tool="'+id+'"]').click();}
async function done(p){if(await p.locator('#studioSheet').evaluate(e=>e.open)){await p.locator('#studioDone').click();await p.waitForFunction(()=>!document.getElementById('studioSheet').open);}}
const print=p=>p.evaluate(async()=>{const c=await new Promise(r=>__kp.buildPrint(r)),blob=await new Promise(r=>c.toBlob(r));return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))).join(',');});
(async()=>{for(const engine of [chromium,webkit]){const b=await engine.launch();try{for(const width of [390,1280]){
 const context=await b.newContext({viewport:{width,height:width===390?844:900},hasTouch:true,isMobile:width===390,reducedMotion:'reduce'}),p=await context.newPage(),errors=[],posts=[];p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(r.method()==='POST')posts.push(r.url());});
 try{
 await p.goto(base+'customizer.html?design=zodiac-atlas-leo.png&model=iphone-18-pro-max&store=Newark%2C%20DE');await ready(p);const original=await print(p);
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 const bounds=await p.locator('[data-tool="name"]').boundingBox(),footer=await p.locator('#studioFooter').boundingBox();assert(bounds.y>=0&&bounds.y+bounds.height<=footer.y,'tools must be visible above footer');
 await tool(p,'background');await p.locator('[data-look="c4"]').click();await done(p);await p.waitForTimeout(450);assert.equal(await p.evaluate(()=>__kp.state.variant),'c4');
 await p.locator('#studioUndo').click();assert.equal(await p.evaluate(()=>__kp.state.variant),'original');assert.equal(await print(p),original,'undo background restores identical print');await p.locator('#studioRedo').click();assert.equal(await p.evaluate(()=>__kp.state.variant),'c4');
 await tool(p,'name');await p.locator('#nameInput').fill('OUR STORY');await done(p);await p.waitForTimeout(400);await p.locator('#studioUndo').click();assert.equal(await p.evaluate(()=>__kp.state.text),'');await p.locator('#studioRedo').click();assert.equal(await p.evaluate(()=>__kp.state.text),'OUR STORY');
 assert(!p.url().includes('STORY'));assert.equal(await p.evaluate(()=>localStorage.getItem('kpCust')),null);
 await tool(p,'adjust');await p.locator('[data-adjust="scale"]').fill('1.25');await done(p);await p.waitForTimeout(400);assert.equal(await p.evaluate(()=>__kp.state.scale),1.25);await p.locator('#studioUndo').click();assert.equal(await p.evaluate(()=>__kp.state.scale),1);
 await tool(p,'phone');await p.locator('#modelSel').selectOption('iPhone 18 Pro');await done(p);await ready(p);await p.waitForTimeout(400);assert(await p.locator('#studioUndo').isDisabled(),'phone change clears edit history');assert.equal(await p.evaluate(()=>__kp.state.text),'OUR STORY');
 await p.screenshot({path:out+'/'+engine.name()+'-'+width+'-edit.png'});
 const customized=await print(p);await p.locator('#studioNext').click();assert.equal(await p.evaluate(()=>KPEditor.step),'preview');assert((await p.locator('#studioReviewDetails').innerText()).includes('OUR STORY'));
 await p.locator('#skyCaseZoom').click();await p.locator('#caseZoomDialog canvas').waitFor();await p.locator('#caseZoomDialog [data-close]').click();
 await p.locator('#studioNext').click();assert.equal(await p.evaluate(()=>KPEditor.step),'setup');await p.locator('#addons [data-k="screen"]').click();if(await p.locator('#studioAccessoryOpen').isVisible())await p.locator('#studioAccessoryOpen').click();await p.locator('#accessoryPicker [data-category="Wall chargers"]').click();await p.locator('[data-accessory="X26"]').click();if(await p.locator('#studioAccessoryDialog[open]').count())await p.locator('#studioAccessoryDone').click();assert((await p.locator('#studioTotal').innerText()).includes('99.97'));
 await p.locator('#studioBrowse').click();await p.waitForFunction(()=>KPEditor.step==='preview');assert.equal(await print(p),customized,'preview/setup must not alter print');await p.locator('#studioNext').click();await p.locator('#studioNext').click();await p.locator('#counterReview[open]').waitFor();await p.waitForFunction(()=>document.getElementById('reviewCode').textContent.endsWith('-G-X26-S3'));
 await p.locator('#reviewSpecification > summary').click();const review=await p.locator('#reviewDetails').innerText();for(const value of ['OUR STORY','Newark, DE','99.97','base design only'])assert(review.includes(value),value);
 await p.screenshot({path:out+'/'+engine.name()+'-'+width+'-counter.png'});await p.getByRole('button',{name:'Edit extras',exact:true}).click();
 await p.goBack();await p.waitForFunction(()=>KPEditor.step==='preview');await p.goBack();await p.waitForFunction(()=>KPEditor.step==='edit');
 if(width===390){for(const size of [{width:320,height:700},{width:844,height:390},{width:390,height:430}]){await p.setViewportSize(size);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow '+JSON.stringify(size));await tool(p,'name');const d=await p.locator('#studioDone').boundingBox();if(size.width<=760)assert(d.y>=0&&d.y+d.height<=size.height,'Done stays visible on short screen');await done(p);}await p.setViewportSize({width,height:844});}
 assert.deepEqual(errors,[]);assert.deepEqual(posts,[]);console.log(engine.name(),width,'background/name/position undo, model change, preview, glass/charger, counter, browser Back, print parity, layout passed');
 }catch(e){await p.screenshot({path:out+'/failure-'+engine.name()+'-'+width+'.png',fullPage:true});throw e;}finally{await context.close();}
 }}finally{await b.close();}}})().catch(e=>{console.error(e);process.exitCode=1;});
