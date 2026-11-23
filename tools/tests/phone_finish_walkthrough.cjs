// Phone finish is display-only: preserve case hardware and print, then carry it to the counter.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,webkit}=require(process.env.KP_PLAYWRIGHT||'/tmp/keepsake-browser-20261121/package');
const base=process.env.KP_BASE||'http://127.0.0.1:19038/',out=process.env.KP_OUT||'../collaboration/phone-only-finish-2026-11-23/local';fs.mkdirSync(out,{recursive:true});
const ready=async p=>{await p.waitForFunction(()=>window.KPStudioCore&&KPStudioCore.info().previewReady&&!KPStudioCore.info().loading);await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));};
async function done(p){if(await p.locator('#studioSheet').evaluate(e=>e.open))await p.locator('#studioDone').click();}
const print=p=>p.evaluate(async()=>{const c=await new Promise(r=>__kp.buildPrint(r)),b=await new Promise(r=>c.toBlob(r));return [...new Uint8Array(await crypto.subtle.digest('SHA-256',await b.arrayBuffer()))].join(',');});
const sample=(p,points)=>p.evaluate(points=>{const c=document.getElementById('stageCanvas'),g=c.getContext('2d');return points.map(([x,y])=>[...g.getImageData(Math.round(x*c.width/2500),Math.round(y*c.height/3000),1,1).data]);},points);
const delta=(a,b)=>Math.max(...a.map((v,i)=>Math.abs(v-b[i])));
const finish=async(p,name)=>{await p.locator('#colorSwatches .sw[data-n="'+name+'"]').click();await ready(p);assert.equal(await p.evaluate(()=>KPStudioCore.info().finish),name);};
const type=async(p,value)=>{await p.locator('.studio-case-opt').filter({has:p.locator('input[value="'+value+'"]')}).click();await ready(p);assert.equal(await p.evaluate(()=>KPStudioCore.info().caseType),value);};
const stores=[['West Chester, PA',94.97,'S1'],['Pottstown, PA',94.97,'S2'],['Newark, DE',99.97,'S3']];
async function hardware(p,engine,report){
 for(const size of ['Pro Max','Pro']){const pm=size==='Pro Max',model='iPhone 18 '+size;
 await p.goto(base+'customizer.html?model='+model.toLowerCase().replaceAll(' ','-'));await ready(p);await p.locator('[data-tool=phone]').click();
 // Interior samples on the photographed ring/bar, camera lenses, flash and clear rim.
 const fixed=pm?[[1248,1210],[855,1600],[1250,2260],[890,515],[1150,650],[1616,507],[670,1500]]:[[1248,1310],[900,1667],[1250,2260],[934,610],[1190,760],[1570,610],[715,1500]];
 const moving=pm?[[1400,550],[1250,1800]]:[[1400,550],[1250,1800]];
 for(const style of ['MagSafe Clear','Rated Case']){
 await type(p,style);const rims=style==='Rated Case'?['Smoke Frost','Clear Frost']:[null];
 for(const rim of rims){if(rim){await p.locator('#studioRim label').filter({has:p.locator('input[value="'+rim+'"]')}).click();await ready(p);}
 await finish(p,'Silver');const unchanged=await sample(p,fixed),phone=await sample(p,moving);
 for(const name of ['Black','Glacier','Burgundy']){await finish(p,name);const hardwareNow=await sample(p,fixed),phoneNow=await sample(p,moving);hardwareNow.forEach((v,i)=>assert(delta(v,unchanged[i])<=1,`${model} ${style} ${rim} ${name} tinted hardware point ${fixed[i]}: ${v} != ${unchanged[i]}`));phoneNow.forEach((v,i)=>assert(delta(v,phone[i])>8,`${model} ${style} ${name} did not recolor phone point ${moving[i]}`));report.push({engine,check:'empty phone hardware',model,style,rim,finish:name,pass:true});}
 await p.locator('#stageCanvas').screenshot({path:out+'/'+engine+'-'+(pm?'18pm':'18p')+'-'+(rim||'clear').replaceAll(' ','-')+'-empty.png'});
 }
 }
 }
 console.log('PASS',engine,'empty clear/Rated cases: phone changes, ring/bar/lenses/rim retained');
}
async function journey(b,engine,job,report){
 const {kiosk,style,store,model,code,width}=job,label=engine+'-'+(kiosk?'kiosk':'mobile')+'-'+code+'-'+(style==='Rated Case'?'rated':'clear')+'-'+store[2],expectedTotal=(store[1]+(style==='Rated Case'?5:0)).toFixed(2);
 const ctx=await b.newContext({viewport:{width,height:width<500?844:900},isMobile:width<500,hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block',acceptDownloads:true}),p=await ctx.newPage(),errors=[],posts=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(r.method()==='POST')posts.push(r.url())});
 try{
 if(kiosk){await p.goto(base+'instore/?store='+encodeURIComponent(store[0]));await p.locator('[data-model="'+code+'"]').click();await p.locator('#designSearch').fill('Turtle Glide');await p.locator('.tile[data-file="ocean-photo-turtle-glide.jpg"] .tname').click();await p.locator('#personalizeCase:not([disabled])').click();await ready(p);assert(await p.locator('#fileInput').isDisabled(),'Kiosk uploads enabled');}
 else {await p.goto(base);await p.locator('.case-slide:not([hidden]) .paired-phone').first().tap();await ready(p);}
 await p.locator('[data-tool=phone]').click();await p.locator('#modelSel').selectOption(model);await ready(p);await type(p,style);await finish(p,'Silver');await print(p);const before=await print(p);
 const swatches=await p.locator('#colorSwatches .sw').evaluateAll(es=>es.map(e=>e.dataset.n)),selected=swatches.at(-1);
 for(const name of swatches){await finish(p,name);assert.equal(await print(p),before,'Phone finish changed print');}
 // Switching the case and its rim must preserve the selected device finish.
 await type(p,style==='Rated Case'?'MagSafe Clear':'Rated Case');assert.equal(await p.evaluate(()=>KPStudioCore.info().finish),selected);await type(p,style);assert.equal(await print(p),before);assert.equal(await p.evaluate(()=>KPStudioCore.info().finish),selected);
 if(style==='Rated Case'){await p.locator('#studioRim label').filter({has:p.locator('input[value="Clear Frost"]')}).click();await ready(p);assert.equal(await p.evaluate(()=>KPStudioCore.info().finish),selected);assert.equal(await print(p),before);}
 await done(p);assert(!await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),'Page overflows');await p.screenshot({path:out+'/'+label+'-editor.png'});
 await p.locator('#skyCaseZoom').click();assert.equal(await p.locator('#caseZoomDialog output').innerText(),'1×');await p.locator('#caseZoomDialog [data-close]').click();
 await p.locator('[data-tool=name]').click();await p.locator('#nameInput').fill('RILEY');await done(p);const personalized=await print(p);
 await p.locator('#studioNext').click();await p.locator('#studioNext').click();
 if(!kiosk){await p.locator('#studioStorePicker summary').click();await p.locator('[data-s="'+store[0]+'"]').click();}
 await p.locator('#addons [data-k=screen]').click();await p.locator('#studioAccessoryOpen').click();await p.locator('[data-category="Wall chargers"]').click();await p.locator('[data-accessory=X26]').click();await p.locator('#studioAccessoryDone').click();await p.waitForFunction(()=>!document.getElementById('studioAccessoryDialog').open&&!history.state?.kpStudioAccessory);
 assert((await p.locator('#studioTotal').innerText()).includes(expectedTotal));
 await p.locator('#studioSetupEdit').click();await p.locator('[data-tool=phone]').click();await finish(p,swatches[1]);await done(p);assert.equal(await print(p),personalized,'Editing finish after extras changed artwork');
 await p.locator('#studioNext').click();await p.locator('#studioNext').click();assert.equal(await p.locator('[data-accessory=X26]').getAttribute('aria-pressed'),'true');await p.locator('#studioNext').click();await p.locator('#counterReview[open]').waitFor();
 await p.waitForFunction(code=>document.getElementById('reviewCode').textContent.endsWith('-G-X26-'+code),store[2]);
 const overview=await p.locator('#reviewOverview').innerText();for(const text of [store[0],expectedTotal,swatches[1],'RILEY','19.99','30W USB-C wall charger'])assert(overview.includes(text),'Missing counter detail '+text);
 assert.equal(await p.evaluate(()=>KPStudioCore.info().caseType),style);assert.equal(await p.evaluate(()=>__kp.state.previewMode),'phone');
 assert(await p.evaluate(()=>{const c=document.getElementById('stageCanvas'),r=document.getElementById('reviewPreview'),e=document.createElement('canvas');e.width=r.width;e.height=r.height;e.getContext('2d').drawImage(c,0,0,e.width,e.height);return e.toDataURL()===r.toDataURL()}),'Counter image differs from editor');
 await p.screenshot({path:out+'/'+label+'-counter.png'});assert.equal(await print(p),personalized);if(!kiosk)await p.locator('#saveCounterCard:not([disabled])').waitFor();
 if(kiosk){await p.locator('#reviewNextCustomer').click();await p.locator('#studioConfirmReset').click();await p.locator('[data-model="'+code+'"]').waitFor();assert.equal(new URL(p.url()).searchParams.get('store'),store[0]);}
 assert.deepEqual(errors,[]);assert.deepEqual(posts,[],'Unexpected upload/order request');report.push({engine,check:'complete journey',...job,finish:swatches[1],total:expectedTotal,pass:true});console.log('PASS',label,'all finishes, case/rim switch, print isolation, glass/charger, counter match, QR held');
 }catch(e){await p.screenshot({path:out+'/'+label+'-failure.png',fullPage:true});throw e;}finally{await ctx.close();}
}
(async()=>{const report=[];for(const engine of [chromium,webkit]){const b=await engine.launch();try{const p=await b.newPage({viewport:{width:1280,height:900},reducedMotion:'reduce'});await hardware(p,engine.name(),report);await p.close();if(process.env.KP_JOURNEYS!=='0'){
 const jobs=[];for(const style of ['MagSafe Clear','Rated Case']){
 for(const [model,code] of [['iPhone 18 Pro','18P'],['iPhone 18 Pro Max','18PM'],['iPhone 15 Pro','15P'],['iPhone 16 Pro Max','16PM']])jobs.push({kiosk:false,style,store:stores[0],model,code,width:390});
 for(const store of stores)jobs.push({kiosk:true,style,store,model:'iPhone 18 Pro Max',code:'18PM',width:1280});}
 for(const job of jobs)await journey(b,engine.name(),job,report);
 }}finally{await b.close();}}
 fs.writeFileSync(out+'/results.json',JSON.stringify(report,null,2)+'\n');console.log('PASS',report.length,'checks');})().catch(e=>{console.error(e);process.exitCode=1});
