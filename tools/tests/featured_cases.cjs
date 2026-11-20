// Follow featured case images through the mobile viewer into the counter review.
const assert = require('node:assert/strict');
const {chromium, webkit} = require('../../../playwright/node_modules/playwright-core');
const base = process.env.KP_BASE || 'http://127.0.0.1:19038/';
const renderMeta=require('../featured-case-renders.json');
const manifest=require('../featured-case-manifest.json');
const pages = ['parks-rugged.html','signature-golf.html','seasonal-weather.html','cherry-duck.html','gifts.html'];
const mobile = {viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'};

async function checkDestination(page, href) {
  const target = new URL(href,base);
  const expected = Object.fromEntries(target.searchParams);
  await page.waitForURL(url=>url.pathname.endsWith('/customizer.html'));
  await page.waitForFunction(expected=>{
    const s=window.__kp?.state;
    return s?.photoImg?.__kpDesignFile===expected.design && !s.photoImg.__kpIsThumb &&
      s.variant===(expected.colorway||'original') && !s.libraryLoading && !__kp.printIssue();
  },expected);
  assert.equal(await page.evaluate(()=>__kp.state.previewMode),'phone');
  const state = await page.evaluate(()=>({
    model:__kp.state.model,finish:__kp.state.colorName,variant:__kp.state.variant,caseType:__kp.state.caseType
  }));
  assert.equal(state.model.toLowerCase().replace(/^samsung /,'').replaceAll(' ','-'),expected.model);
  if(expected.finish)assert.equal(state.finish,expected.finish);
  const entry=manifest.find(r=>r.design===expected.design&&r.model===expected.model&&r.variant===(expected.colorway||'original'));
  assert(entry,'missing preview manifest entry');assert.equal(state.caseType,entry.caseType);
  await page.locator('#skyCaseZoom').click();
  await page.locator('#caseZoomDialog canvas').waitFor();
  await page.locator('#caseZoomDialog').getByRole('button',{name:'Close',exact:true}).click();
  await page.locator('#cartBtn').click();
  await page.locator('#counterReview').waitFor();
  const details=await page.locator('#reviewDetails').innerText();
  assert(details.includes(state.model),details);
  assert(details.includes(state.caseType),details);
  assert(details.includes(state.finish),details);
  await page.waitForFunction(()=>{ const text=document.querySelector('#reviewCode')?.textContent; return text && !text.includes('Looking up'); });
  const code=await page.locator('#reviewCode').innerText();
  const active=await page.evaluate(async model=>{const data=await KPI.load('instore/');return data.activeModels.some(m=>m.name.replace(/^Samsung /,'')===model.replace(/^Samsung /,''));},state.model);
  assert(active?code.startsWith('Pick code · '):code==='Ask the team to match this preview.',code);
  assert(!await page.locator('#kpPhone').count());
}

(async()=>{
  for(const engine of [chromium,webkit]){
    const browser=await engine.launch();
    try{
      const page=await browser.newPage(mobile);
      const errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      // Inspect every static collection placement and its intrinsic resolution.
      for(const file of pages){
        await page.goto(new URL(file,base).href);
        const links=page.locator('a[href*="customizer.html?"]:has(img[src^="assets/case-only-previews/"])');
        const items=await links.evaluateAll(async anchors=>{
          for(const a of anchors){const im=a.querySelector('img');im.loading='eager';}
          return Promise.all(anchors.map(async a=>{
            const im=a.querySelector('img');await im.decode();
            return {href:a.href,src:im.getAttribute('src').split('?')[0],w:im.naturalWidth,h:im.naturalHeight};
          }));
        });
        assert(items.length>0,file);
        for(const item of items){
          const u=new URL(item.href),file=u.searchParams.get('design').replace(/\.(png|jpg)$/,'');
          assert(item.src.endsWith('--'+file+'--'+u.searchParams.get('colorway')+'.webp'),item.src);
          assert(item.w>=500 && item.h>=1000,item.src);
          const meta=renderMeta.find(r=>r.output===item.src);assert(meta,item.src);
          const alpha=await page.evaluate(async ({src,point})=>{const im=new Image();im.src=src;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;c.getContext('2d').drawImage(im,0,0);return c.getContext('2d').getImageData(point[0],point[1],1,1).data[3];},{src:item.src,point:meta.cameraPoint});
          assert(alpha>240,item.src+' must show the mounted phone camera');
          const model=u.searchParams.get('model');
          assert(item.src.includes('/'+model+'--'),item.href);
          assert.equal(u.searchParams.get('view'),'phone');
        }
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),file+' horizontal overflow');
        // The first and last options exercise opposite ends of each mobile collection.
        for(const index of [0,items.length-1]){
          await page.goto(new URL(file,base).href);
          const trigger=page.locator('a[href*="customizer.html?"]:has(img[src^="assets/case-only-previews/"])').nth(index);
          await trigger.scrollIntoViewIfNeeded();
          await trigger.click();
          await page.locator('#caseZoomDialog img').waitFor();
          await page.locator('#caseZoomDialog').getByRole('button',{name:'Customize this case',exact:true}).click();
          await checkDestination(page,items[index].href);
        }
        console.log(engine.name(),file,items.length,'images; first/last backgrounds through counter review');
      }
      // Personal examples show the artwork on mounted clear cases; their routes
      // must open the same mounted view for new customer artwork.
      for(const studio of ['drawing','sky']){
        await page.goto(base);
        const link=page.locator('a[data-preview-link][href*="studio='+studio+'"]').first();
        assert.equal(new URL(await link.getAttribute('href'),base).searchParams.get('view'),'phone');
        await link.scrollIntoViewIfNeeded();
        const image=link.locator('img');
        await page.waitForFunction(studio=>{const im=document.querySelector('a[data-preview-link][href*="studio='+studio+'"] img');return im.complete&&im.naturalWidth;},studio);
        const alpha=await image.evaluate(im=>{const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;c.getContext('2d').drawImage(im,0,0);return c.getContext('2d').getImageData(300,300,1,1).data[3];});
        assert(alpha>240,studio+' sample must show phone hardware');
        await link.tap();await page.locator('#caseZoomDialog').getByRole('button',{name:'Customize this case',exact:true}).tap();
        await page.waitForFunction(()=>window.__kp);assert.equal(await page.evaluate(()=>__kp.state.previewMode),'phone');
        assert.equal(new URL(page.url()).searchParams.get('studio'),studio);
        if(studio==='drawing'){
          const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=600;c.height=450;const x=c.getContext('2d');x.fillStyle='#ffcab8';x.fillRect(0,0,600,450);x.fillStyle='#111';x.fillText('Test artwork',200,220);return c.toDataURL().split(',')[1];});
          await page.locator('#fileInput').setInputFiles({name:'test-artwork.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
        }else{
          await page.locator('#skyForm [name="place"] option').first().waitFor({state:'attached'});
          await page.locator('#skyForm [name="place"]').selectOption({label:'West Chester, PA, US'});
          await page.locator('#skyForm [name="date"]').fill('2019-06-14');
          await page.locator('#skyForm [name="initials"]').fill('J & M');
          await page.locator('#skyForm [name="sign1"]').selectOption('Gemini');
          await page.locator('#skyForm [name="sign2"]').selectOption('Libra');
          await page.locator('#skyForm button[type="submit"]').tap();
        }
        await page.waitForFunction(()=>__kp.state.photoImg&&!__kp.printIssue());
        await page.locator('#skyCaseZoom').tap();await page.locator('#caseZoomDialog canvas').waitFor();
        await page.locator('#caseZoomDialog').getByRole('button',{name:'Close',exact:true}).tap();
        console.log(engine.name(),studio,'clear case example → personal studio → case zoom');
      }
      // Advance using the real carousel controls, then tap each newly rebuilt hero.
      for(const slideNumber of [1,2,3,4,5,6,7,8]){
        await page.goto(base);
        await page.locator('.drawing-product').focus();
        for(let i=0;i<slideNumber;i++)await page.keyboard.press('ArrowRight');
        const slide=page.locator('.case-slide:visible');
        const href=await slide.locator('.campaign-shop').getAttribute('href');
        const image=slide.locator('.edit-phone img');
        await image.evaluate(im=>im.decode());
        assert((await image.getAttribute('src')).startsWith('assets/case-only-previews/'));
        await slide.locator('.hero-case-zoom').click();
        await page.locator('#caseZoomDialog img').waitFor();
        await page.locator('#caseZoomDialog').getByRole('button',{name:'Customize this case',exact:true}).click();
        await checkDestination(page,href);
      }
      assert.deepEqual(errors,[]);
      console.log(engine.name(),'eight homepage library cases through zoom, customizer and counter review');
    } finally {await browser.close();}
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
