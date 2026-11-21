/* Product layout, visible variation selection, and display-only mask regression. */
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,webkit}=require(process.env.KP_PLAYWRIGHT||'../../../playwright/node_modules/playwright-core');
const base=process.env.KP_BASE||'http://127.0.0.1:19038/',out=process.env.KP_OUT||'../collaboration/clear-photo-builder-2026-11-21';fs.mkdirSync(out,{recursive:true});
const ready=p=>p.waitForFunction(()=>window.KPEditor&&KPStudioCore.info().previewReady&&!KPStudioCore.info().loading);
const done=async p=>{if(await p.locator('#studioSheet').evaluate(e=>e.open)){await p.locator('#studioDone').click();await p.waitForFunction(()=>!document.getElementById('studioSheet').open);}};
const hash=p=>p.evaluate(async()=>{const c=await new Promise(r=>__kp.buildPrint(r)),b=await new Promise(r=>c.toBlob(r));return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await b.arrayBuffer()))).join(',');});
(async()=>{for(const engine of [chromium,webkit]){const b=await engine.launch();try{for(const width of [390,1280]){const p=await b.newPage({viewport:{width,height:width===390?844:960},hasTouch:true,isMobile:width===390,reducedMotion:'reduce'});const errors=[],posts=[];p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(r.method()==='POST')posts.push(r.url());});try{
 await p.goto(base+'gallery.html?device=iphone-17-pro-max&q=Cherry%20Dot');
 const card=p.locator('.kpCard[data-file="kp-cherry-dot.png"]');await card.waitFor();await card.locator('.artwork-thumb img[src]').first().waitFor();
 assert.equal(await card.locator('.artwork-thumb').count(),5);assert.equal(await card.locator('.artwork-picker').isVisible(),false);
 const pick=card.locator('.artwork-thumb').last(),look=await pick.getAttribute('data-look');await pick.click();assert.equal(await pick.getAttribute('aria-pressed'),'true');
 const url=await card.locator('a[href*="customizer.html"]').first().getAttribute('href');assert.equal(new URL(url,base).searchParams.get('colorway'),look);
 await p.screenshot({path:out+'/'+engine.name()+'-'+width+'-gallery.png'});await p.goto(new URL(url,base).href);await ready(p);await p.locator('#studioVariations button').first().waitFor();
 assert.equal(await p.locator('#studioVariations [aria-pressed=true]').getAttribute('data-variation'),look);assert.equal(await p.locator('#studioProduct h1').innerText(),'Cherry Dot');
 const before=await hash(p);await p.locator('#studioVariations button').first().click();await p.waitForFunction(()=>__kp.state.variant==='original');assert.notEqual(await hash(p),before);
 await p.locator('#studioVariations button').last().click();assert.equal(await hash(p),before,'image thumbnails must restore the same print');
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:out+'/'+engine.name()+'-'+width+'-product.png'});
 // New template: the white guide must not show through an empty/transparent design.
 await p.locator('[data-tool=phone]').click();await p.locator('.studio-case-opt').filter({has:p.locator('[value="Rated Case"]')}).click();await ready(p);
 await p.locator('#colorSwatches .sw').last().click();await ready(p);await done(p);const darkPrint=await hash(p);
 await p.locator('[data-tool=phone]').click();await p.locator('#colorSwatches .sw').first().click();await ready(p);await done(p);assert.equal(await hash(p),darkPrint,'phone finish is display-only, not printed');
 await p.goto(base+'customizer.html?model=iphone-17-pro-max&path=photo');await ready(p);await p.locator('[data-tool=photo]').click();await p.waitForFunction(()=>document.querySelectorAll('#layoutChips .layChip').length===19);
 assert.equal(await p.locator('#layoutChips > .layChip').count(),4);assert.equal(await p.locator('#layoutMore').evaluate(e=>e.open),false);
 await p.locator('#layoutMore summary').click();await p.locator('#layoutMore .layChip').first().click();assert(await p.locator('#layoutMore').evaluate(e=>e.open));await done(p);
 await p.goto(base+'customizer.html?model=iphone-17-pro-max');await ready(p);
 await p.locator('[data-tool=phone]').click();await p.locator('.studio-case-opt').filter({has:p.locator('[value="Rated Case"]')}).click();await ready(p);await p.locator('#colorSwatches .sw').last().click();await ready(p);await done(p);
 await p.waitForTimeout(300);const px=await p.evaluate(()=>{const c=document.getElementById('stageCanvas');return [...c.getContext('2d').getImageData(c.width*.5,c.height*.65,1,1).data];});assert(Math.max(...px.slice(0,3))<220,'dark phone must replace white mask guide: '+px);
 assert.deepEqual(errors,[]);assert.deepEqual(posts,[]);console.log(engine.name(),width,'visual variation → editor, exact print restore, phone-only finish, curated layouts, dark panel passed');
 }catch(e){await p.screenshot({path:out+'/failure-'+engine.name()+'-'+width+'.png',fullPage:true});throw e;}finally{await p.close();}}}finally{await b.close();}}})().catch(e=>{console.error(e);process.exitCode=1;});
