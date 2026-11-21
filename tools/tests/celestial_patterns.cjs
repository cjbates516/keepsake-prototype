const assert=require('node:assert/strict'),fs=require('fs');
const {chromium,webkit}=require('../../../playwright/node_modules/playwright-core');
const base=process.env.KP_BASE||'http://127.0.0.1:19038/',rows=require('../../assets/celestial-patterns.json'),out='../collaboration/zodiac-tarot-patterns-2026-11-20/validation';fs.mkdirSync(out,{recursive:true});
const pages=[['celestial-creatures.html',12],['tarot.html',4],['pattern-studio.html',16]];
(async()=>{
 for(const engine of [chromium,webkit]){
  const b=await engine.launch();try{for(const width of [375,820,1280]){
   const ctx=await b.newContext({viewport:{width,height:900},hasTouch:true,isMobile:width===375,reducedMotion:'reduce',serviceWorkers:'block'}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
   for(const [url,count] of pages){
    await p.goto(base+url);assert.equal(await p.locator('.background-card').count(),count);
    const l=await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,columns:getComputedStyle(document.querySelector('.fresh-grid')).gridTemplateColumns.split(' ').length}));assert(!l.overflow);assert.equal(l.columns,width<=900?2:4);
    for(let n=0;n<count;n++){
     const c=p.locator('.background-card').nth(n);await c.scrollIntoViewIfNeeded();await c.locator('img').evaluate(im=>im.decode());
     for(const variant of ['c1','c5','original']){await c.locator('[data-variant='+variant+']').click();await p.waitForFunction(({n,variant})=>document.querySelectorAll('.background-card')[n].querySelector('[aria-pressed=true]').dataset.variant===variant,{n,variant});assert(new URL(await c.locator('.fresh-customize').getAttribute('href'),base).searchParams.get('colorway')===variant);}
    }
    const c=p.locator('.background-card').first();await c.locator('[data-variant=c3]').click();await p.waitForFunction(()=>document.querySelector('.background-card [data-variant=c3]').getAttribute('aria-pressed')==='true');
    await c.locator('.fresh-image').click();await p.locator('#caseZoomDialog .zoom-scroll img').waitFor();assert((await p.locator('#caseZoomDialog .zoom-scroll img').getAttribute('src')).includes('--c3.webp'));await p.locator('#caseZoomDialog [data-step="1"]').click();assert.equal(await p.locator('#caseZoomDialog output').innerText(),'2×');await p.locator('#caseZoomDialog [data-close]').click();
    await c.scrollIntoViewIfNeeded();await p.screenshot({path:out+'/'+url.replace('.html','')+'-'+engine.name()+'-'+width+'.png'});
    const href=await c.locator('.fresh-customize').getAttribute('href');assert(!new URL(href,base).searchParams.has('model'));await c.locator('.fresh-customize').click();await p.waitForFunction(()=>window.KPEditor&&!KPStudioCore.info().issue);assert.equal(await p.evaluate(()=>__kp.state.variant),'c3');await p.locator('[data-tool=phone]').click();assert(await p.locator('#modelSel').isVisible());
   }
   assert.deepEqual(errors,[]);console.log('UI',engine.name(),width,'3 collections / 32 backgrounds and zoom passed');await ctx.close();
  }}finally{await b.close()}
 }
 const b=await chromium.launch(),jobs=rows.flatMap(row=>row.looks.map(look=>({row,variant:look.id,model:'iphone-17-pro-max'}))).concat(rows.flatMap(row=>['iphone-15-pro','galaxy-s26-ultra'].map(model=>({row,model,variant:'original'}))));let next=0;const results=[];
 try{await Promise.all(Array.from({length:3},async()=>{const p=await b.newPage({viewport:{width:390,height:844}});await p.route('**/*',r=>new URL(r.request().url()).origin===new URL(base).origin?r.continue():r.abort());
 while(next<jobs.length){const {row,model,variant}=jobs[next++];await p.goto(base+'customizer.html?staff=1&model='+model+'&design='+row.file+'&colorway='+variant+'&view=phone');await p.waitForFunction(({row,variant})=>window.__kp?.state.photoImg?.__kpDesignFile===row.file&&!__kp.state.photoImg.__kpIsThumb&&!__kp.state.libraryLoading&&__kp.state.variant===variant&&!__kp.printIssue(),{row,variant});
 const r=await p.evaluate(async()=>{const c=await new Promise(r=>__kp.buildPrint(r));return{dpi:__kp.dpi(),spec:__kp.printSpec(),width:c.width,height:c.height,print:c.toDataURL().split(',')[1]};});assert.equal(r.width,r.spec.w);assert.equal(r.height,r.spec.h);if(variant==='original')assert(r.dpi>=230,'Low effective resolution '+row.file+' '+model+' '+r.dpi);else assert.equal(r.dpi,null,'Prepared variants deliberately omit the UI DPI estimate');
 const dest=out+'/exports/'+model;fs.mkdirSync(dest,{recursive:true});fs.writeFileSync(dest+'/'+row.file.replace('.png','')+'--'+variant+'.png',Buffer.from(r.print,'base64'));delete r.print;results.push({file:row.file,model,variant,...r});console.log('PRINT',results.length+'/'+jobs.length,row.file,model,variant,r.dpi);
 }await p.close();}));}finally{await b.close()}
 fs.writeFileSync(out+'/results.json',JSON.stringify(results,null,2));console.log('PASS',results.length,'exports and 18 responsive/browser/page checks');
})().catch(e=>{console.error(e);process.exitCode=1});
