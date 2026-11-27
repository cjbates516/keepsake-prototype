const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('../../../playwright/node_modules/playwright-core');
const base=process.env.KP_BASE||'http://127.0.0.1:19047/',out=process.env.KP_SHOTS||'../collaboration/confetti-paint-20261127/local';fs.mkdirSync(out,{recursive:true});
const rows=JSON.parse(fs.readFileSync(path.join(__dirname,'../../assets/confetti-paint-20261127.json'))),results=[];
const ready=p=>p.waitForFunction(()=>window.KPStudioCore?.info().previewReady&&!KPStudioCore.info().issue&&!__kp.state.libraryLoading&&!__kp.state.photoImg?.__kpIsThumb);
(async()=>{for(const engine of [chromium,webkit]){const b=await engine.launch();try{
 const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'});p.setDefaultTimeout(25000);const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base+'gallery.html?cat=Paint%20Party');
 for(const row of rows){const card=p.locator('.kpCard[data-file="'+row.file+'"]');await card.scrollIntoViewIfNeeded();assert.equal(await card.locator('.artwork-thumb').count(),4);
 await p.waitForFunction(file=>[...document.querySelectorAll('.kpCard[data-file="'+file+'"] .artwork-thumb img')].every(im=>im.naturalWidth>0),row.file);
 await card.locator('[data-look="c1"]').click();assert.equal(await card.locator('[data-look="c1"]').getAttribute('aria-pressed'),'true');await card.screenshot({path:out+'/'+engine.name()+'-'+row.file+'-gallery.png'});}
 // Real gallery-to-counter path retains the selected colorway and frost rim.
 await p.locator('.kpCard[data-file="'+rows[0].file+'"] a[data-pick-model]').last().click();
 await p.locator('#galleryPhoneSeries [data-series="iPhone 15 series"]').click();await p.locator('#galleryPhoneSeries [data-series-model="iPhone 15 Pro"]').click();await ready(p);
 assert.equal(await p.evaluate(()=>__kp.state.variant),'c1');const initial=await p.evaluate(()=>KPStudioCore.info());assert.equal(initial.caseType,'Rated Case');
 await p.locator('#studioNext').click();await p.locator('#studioNext').click();if(await p.locator('#studioStorePicker summary').isVisible())await p.locator('#studioStorePicker summary').click();await p.locator('#storeChips [data-s="West Chester, PA"]').click();await p.locator('#studioNext').click();await p.locator('#counterReview[open]').waitFor();await p.waitForFunction(()=>document.getElementById('reviewCode').textContent.startsWith('Pick code'));
 const code=(await p.locator('#reviewCode').innerText()).replace('Pick code · ','').trim();await p.screenshot({path:out+'/'+engine.name()+'-mobile-counter.png'});
 await p.goto(base+'instore/find.html?code='+encodeURIComponent(code));await p.waitForFunction(()=>document.getElementById('rimg').naturalWidth>0);await p.locator('#ropen').click();await ready(p);assert.equal(await p.evaluate(()=>__kp.state.variant),'c1');assert.equal(await p.evaluate(()=>KPStudioCore.info().rim),initial.rim);
 results.push({engine:engine.name(),path:'mobile gallery → choose phone → counter → reopen',code});
 // Every artwork and both rims; verify composed colorways are full-size images,
 // without an inset mat, and the editor uses fill mode with a centered transform.
 console.log('PASS',engine.name(),'mobile gallery to counter');
 for(const row of rows)for(const rim of ['Clear Frost','Smoke Frost']){
 await p.goto(base+'customizer.html?'+new URLSearchParams({model:'iphone-15-pro',design:row.file,case:'rated',rim}));await ready(p);
 await p.waitForFunction(()=>KPDesignColorways.choicesFor(__kp.state.photoImg).length===4);
 const check=await p.evaluate(async()=>{const im=__kp.state.photoImg;await KPDesignColorways.prepare(im);const looks=KPDesignColorways.choicesFor(im),checks=[];
 for(const look of looks){const src=look.code?im.__kpVariantImages[look.code-1]:im,c=KPDesignColorways.make(im,look.id,1536),ref=document.createElement('canvas');ref.width=c.width;ref.height=c.height;ref.getContext('2d').drawImage(src,0,0,c.width,c.height);checks.push(c.toDataURL()===ref.toDataURL());}
 return {checks,info:KPStudioCore.info(),fit:__kp.state.fitMode,variant:__kp.state.variant};});
 assert(check.checks.every(Boolean),'Artwork must remain edge-to-edge at unchanged geometry');assert.equal(check.info.rim,rim);assert.equal(check.info.total,49.99);assert.equal(check.fit,'fill');
 await p.locator('#stageWrap').screenshot({path:out+'/'+engine.name()+'-'+row.file+'-'+rim.split(' ')[0]+'.png'});results.push({engine:engine.name(),file:row.file,rim,fullBleedVariants:check.checks.length});
 }
 console.log('PASS',engine.name(),'all four artwork × both rims × four colorways fill geometry');
 // Kiosk selections and generated counter codes for all four designs, alternating rims.
 await p.setViewportSize({width:1024,height:768});
 for(let i=0;i<rows.length;i++){const row=rows[i],rim=i%2?'Clear Frost':'Smoke Frost';await p.goto(base+'instore/?store=West%20Chester%2C%20PA');
 const series=p.locator('[data-series="iPhone 15 series"]');await series.click();await p.locator('[data-series-model="iPhone 15 Pro"]').click();await p.locator('#designSearch').fill(row.title);await p.locator('.tile[data-file="'+row.file+'"] .tname').click();await p.locator('#showBtn:not([disabled])').waitFor();
 assert.equal(await p.locator('#colorwayButtons button').count(),4);assert.equal(await p.locator('#colorwayButtons img').count(),4);await p.locator('#colorwayButtons [data-colorway="c3"]').click();await p.locator('#kioskRims button').filter({hasText:rim}).click();await p.locator('#showBtn:not([disabled])').waitFor();await p.locator('#showBtn').click();const pick=await p.locator('#code').innerText();assert(pick.includes('C3'));await p.screenshot({path:out+'/'+engine.name()+'-'+row.file+'-kiosk-counter.png'});
 await p.goto(base+'instore/find.html?code='+encodeURIComponent(pick));await p.waitForFunction(()=>document.getElementById('rimg').naturalWidth>0);await p.locator('#ropen').click();await ready(p);assert.equal(await p.evaluate(()=>__kp.state.variant),'c3');assert.equal(await p.evaluate(()=>__kp.state.photoImg.__kpDesignFile),row.file);assert.equal(await p.evaluate(()=>KPStudioCore.info().rim),rim);results.push({engine:engine.name(),path:'kiosk → color/rim → counter → reopen',file:row.file,rim,code:pick});
 }
 assert.deepEqual(errors,[]);await p.close();console.log('PASS',engine.name(),'four gallery cards, both frost rims, all colorway geometry, mobile and kiosk counter handoffs');
 }finally{await b.close();}}
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
