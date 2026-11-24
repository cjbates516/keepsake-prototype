const assert=require('node:assert/strict'),fs=require('node:fs'),{chromium,webkit}=require('../../../playwright/node_modules/playwright-core');
const base=process.env.KP_BASE||'http://127.0.0.1:19038/',out=process.env.KP_OUT||'../collaboration/category-counter-walkthrough-2026-11-24/local';fs.mkdirSync(out,{recursive:true});
const ready=p=>p.waitForFunction(()=>window.KPStudioCore?.info().previewReady&&!KPStudioCore.info().issue);
const stores=['West Chester, PA','Pottstown, PA','Newark, DE'];
async function adjust(p,engine,width){
 await p.locator('[data-tool=adjust]').click();await p.locator('#studioSheet[open]').waitFor();
 const box=await p.locator('#studioSheet').boundingBox(),v=await p.evaluate(()=>({height:visualViewport.height,width:innerWidth}));
 assert(Math.abs(box.height-v.height)<2,'Adjust must fill available screen');assert(Math.abs(box.y)<2,'Adjust must start at top');assert.equal(Math.round(box.width),v.width);
 const done=await p.locator('#studioDone').boundingBox();assert(done.y>=0&&done.y+done.height<v.height);
 const canvas=await p.locator('#stageCanvas').boundingBox(),stage=await p.locator('#stageStick').boundingBox();assert(canvas.height>160,'Case too small');assert(Math.abs(canvas.x+canvas.width/2-stage.x-stage.width/2)<3,'Preview off center');
 const before=await p.evaluate(()=>KPStudioCore.snapshot());const scale=p.locator('[data-adjust=scale]');await scale.focus();await scale.press('ArrowRight');assert.notEqual((await p.evaluate(()=>KPStudioCore.snapshot())).scale,before.scale);
 await p.locator('#studioCenter').click();
 await p.locator('[data-adjust=rot]').scrollIntoViewIfNeeded();const afterScroll=await p.locator('#stageCanvas').boundingBox();assert(Math.abs(canvas.y-afterScroll.y)<2,'Preview moved while controls scroll');assert((await p.locator('#studioDone').boundingBox()).y>=0);
 await p.screenshot({path:out+'/'+engine+'-'+width+'-adjust.png'});
 await p.locator('#studioDone').click();await p.waitForFunction(()=>!document.getElementById('studioSheet').open);assert.equal(await p.locator('#stageStick').evaluate(e=>e.parentElement.id),'studioGrid');
 // Escape and browser Back must restore the editing page without losing the design.
 await p.locator('[data-tool=adjust]').click();await p.keyboard.press('Escape');await p.waitForFunction(()=>!document.getElementById('studioSheet').open);await ready(p);
 if(width<761){await p.locator('[data-tool=adjust]').click();await p.goBack();await p.waitForFunction(()=>!document.getElementById('studioSheet').open);await ready(p);}
}
(async()=>{for(const engine of [chromium,webkit]){const b=await engine.launch();try{for(const [index,width] of [390,820,1024].entries()){
 const p=await b.newPage({viewport:{width,height:width===390?844:width===820?1180:768},isMobile:width===390,hasTouch:true,reducedMotion:'reduce'}),errors=[],posts=[];p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(r.method()==='POST')posts.push(r.url());});
 try{
 await p.goto(base);await p.locator('.ks-style-trigger').click();await p.locator('.ks-category-search input').fill(['ocean','golf','creatures'][index]);await p.locator('.ks-category-content a').first().click();await p.locator('#grid [data-pick-model]').first().waitFor();
 await p.locator('#grid [data-pick-model]').first().click();await p.locator('[data-md=iphone-16-pro]').click();await ready(p);const initial=await p.evaluate(()=>KPStudioCore.info());assert.equal(initial.caseType,'Rated Case');
 await adjust(p,engine.name(),width);
 await p.locator('#studioNext').click();await p.screenshot({path:out+'/'+engine.name()+'-'+width+'-preview.png'});await p.locator('#studioNext').click();
 if(await p.locator('#studioStorePicker summary').isVisible())await p.locator('#studioStorePicker summary').click();await p.locator('#storeChips [data-s="'+stores[index]+'"]').click();
 await p.locator('#addons [data-k=screen]').click();await p.locator('#studioAccessoryOpen').click();await p.locator('[data-category="Wall chargers"]').click();await p.locator('[data-accessory=X26]').click();await p.locator('#studioAccessoryDone').click();await p.waitForFunction(()=>!history.state?.kpStudioAccessory);
 await p.locator('#studioNext').click();await p.locator('#counterReview[open]').waitFor();await p.waitForFunction(()=>document.getElementById('reviewCode').textContent.startsWith('Pick code'));const final=await p.evaluate(()=>KPStudioCore.info());assert.equal(final.rim,initial.rim);assert.equal(final.finish,initial.finish);assert.equal(final.total,index===2?104.97:99.97);assert.equal(final.store,stores[index]);
 assert.match(await p.locator('#reviewOverview').innerText(),/19.99/);assert(await p.locator('#reviewCode').evaluate(e=>e.scrollWidth<=e.clientWidth));await p.screenshot({path:out+'/'+engine.name()+'-'+width+'-counter.png'});
 const code=(await p.locator('#reviewCode').innerText()).replace('Pick code · ','').trim();await p.goto(base+'instore/find.html?code='+encodeURIComponent(code));await p.waitForFunction(()=>document.getElementById('rimg').naturalWidth>0);await p.locator('#ropen').click();await ready(p);const reopened=await p.evaluate(()=>KPStudioCore.info());assert.equal(reopened.rim,initial.rim);assert.equal(reopened.finish,initial.finish);assert.equal(reopened.total,final.total);assert.equal(reopened.store,stores[index]);
 assert.deepEqual(errors,[]);assert.deepEqual(posts,[]);assert(!await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1));console.log('PASS',engine.name(),width,stores[index],'homepage → category → phone → full-screen Adjust → preview → glass/charger → counter → lookup',code);
 }catch(e){await p.screenshot({path:out+'/'+engine.name()+'-'+width+'-failure.png',fullPage:true});throw e;}finally{await p.close();}
 }}finally{await b.close();}}})().catch(e=>{console.error(e);process.exitCode=1});
