const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const {chromium,webkit}=require('../../../playwright/node_modules/playwright-core');
const base=process.env.KP_BASE||'http://127.0.0.1:19038/';
const rows=require('../../assets/nature-seasons.json'),out='../collaboration/nature-seasons-2026-11-23/validation';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const results=[];for(const r of rows)assert.equal(require('node:crypto').createHash('sha256').update(fs.readFileSync(path.resolve(__dirname,'../../assets/designs',r.file))).digest('hex').slice(0,12),r.hash);
 for(const engine of [chromium,webkit]){
  const browser=await engine.launch();try{
   for(const width of [375,820,1280]){
    const context=await browser.newContext({viewport:{width,height:900},hasTouch:true,isMobile:width===375,reducedMotion:'reduce',serviceWorkers:'block'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+'seasonal-weather.html');assert.equal(await page.locator('#nature-seasons .fresh-card').count(),6);
    const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,columns:getComputedStyle(document.querySelector('.fresh-grid')).gridTemplateColumns.split(' ').length}));assert(!layout.overflow);assert.equal(layout.columns,width<=900?2:4);
    for(let cardIndex=0;cardIndex<6;cardIndex++){
     const card=page.locator('#nature-seasons .fresh-image').nth(cardIndex);await card.scrollIntoViewIfNeeded();await card.locator('img').evaluate(img=>{if(!img.complete||!img.naturalWidth)throw Error('Preview failed to load');});await card.click();await page.locator('#caseZoomDialog .zoom-scroll img').waitFor();assert.equal(await page.locator('#caseZoomDialog output').innerText(),'1×');await page.locator('#caseZoomDialog [data-step="1"]').click();assert.equal(await page.locator('#caseZoomDialog output').innerText(),'1.5×');await page.locator('#caseZoomDialog [data-close]').click();
    }
    await page.locator('#nature-seasons').scrollIntoViewIfNeeded();await page.screenshot({path:out+'/'+engine.name()+'-'+width+'.png'});
    for(const href of await page.locator('#nature-seasons .fresh-customize').evaluateAll(links=>links.map(a=>a.href)))assert(!new URL(href).searchParams.has('model'),'Collection link must not force sample model');
    await page.locator('#nature-seasons .fresh-customize').first().click();await page.locator('[data-md="iphone-15-pro"]').click();await page.waitForFunction(()=>window.KPEditor);await page.locator('[data-tool=phone]').click();assert(await page.locator('#modelSel').isVisible(),'Customer can choose phone model');
    assert.deepEqual(errors,[]);console.log('UI',engine.name(),width,'passed');await context.close();
   }
  }finally{await browser.close();}
 }
 const browser=await chromium.launch();let next=0;const jobs=[];for(const model of ['iphone-17-pro-max','iphone-15-pro','galaxy-s26-ultra'])for(const row of rows)jobs.push({model,row});
 try{await Promise.all(Array.from({length:3},async()=>{const p=await browser.newPage({viewport:{width:390,height:844}});await p.route('**/*',r=>new URL(r.request().url()).origin===new URL(base).origin?r.continue():r.abort());
 while(next<jobs.length){const {model,row}=jobs[next++];await p.goto(base+'customizer.html?staff=1&model='+model+'&design='+row.file+'&view=phone');await p.waitForFunction(file=>window.__kp?.state.photoImg?.__kpDesignFile===file&&!__kp.state.photoImg.__kpIsThumb&&!__kp.state.libraryLoading&&!__kp.printIssue(),row.file);
 assert.deepEqual(await p.evaluate(()=>[__kp.state.photoImg.naturalWidth,__kp.state.photoImg.naturalHeight]),row.sourceSize);
 const r=await p.evaluate(async()=>{const c=await new Promise(r=>__kp.buildPrint(r)),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let count=0,partial=0;for(let i=3;i<d.length;i+=4){if(d[i])count++;if(d[i]&&d[i]!==255)partial++;}return{model:__kp.state.model,dpi:__kp.dpi(),spec:__kp.printSpec(),width:c.width,height:c.height,opaque:count,partial,print:c.toDataURL().split(',')[1]};});
 assert(r.opaque>100000);assert.equal(r.partial,0);assert.equal(r.width,r.spec.w);assert.equal(r.height,r.spec.h);assert(r.dpi>=300,'Source too soft: '+row.file+' '+r.dpi);
 fs.mkdirSync(out+'/'+model,{recursive:true});fs.writeFileSync(out+'/'+model+'/'+row.file.replace('.jpg','.png'),Buffer.from(r.print,'base64'));delete r.print;results.push({file:row.file,...r});console.log('PRINT',results.length+'/'+jobs.length,model,row.file,r.dpi);
 }await p.close();}));}finally{await browser.close();}
 fs.writeFileSync(out+'/results.json',JSON.stringify(results,null,2));console.log('PASS',results.length,'real-design print exports; mobile/tablet/desktop Chromium + WebKit');
})().catch(e=>{console.error(e);process.exitCode=1;});
