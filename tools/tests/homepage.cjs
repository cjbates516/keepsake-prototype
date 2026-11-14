const {chromium,webkit}=require('../../../playwright/node_modules/playwright-core');
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..'),base=process.env.KP_BASE||'http://127.0.0.1:8766/';
const catalog=JSON.parse(fs.readFileSync(path.join(root,'assets/designs/designs.json')));
let checks=0;function check(ok,label){if(!ok)throw Error(label);checks++;}
(async()=>{
 for(const [engine,type] of Object.entries({chromium,webkit})){
  const browser=await type.launch();
  for(const width of [320,390,760,820,1440]){
   const p=await browser.newPage({viewport:{width,height:950},reducedMotion:'reduce'}),errors=[],posts=[];
   p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(r.method()==='POST')posts.push(r.url())});
   await p.goto(base,{waitUntil:'networkidle'});
   await p.locator('img').evaluateAll(async es=>{es.forEach(e=>e.loading='eager');await Promise.all(es.map(e=>e.decode()))});
   check(await p.locator('h1').count()===1,'single h1');
   const bounds=await p.locator('.case-edit').boundingBox();
   check(bounds.x===0 && bounds.width===width && Math.abs(bounds.y+bounds.height-950)<=2,'full viewport hero '+width);
   if(width===390){
     const active=p.locator('.case-slide:visible');
     check(await p.locator('.case-edit button').count()===0,'no slideshow control bar');
     await active.locator('a').focus();
     for(const name of ['Cherry Dot','Neon Hearts','Wrong Way Duck','Liquid Prism','Yosemite']){
       await p.keyboard.press('ArrowRight');
       check((await active.innerText()).includes(name),'next case: '+name);
     }
     await p.keyboard.press('ArrowLeft');
     check((await active.locator('a').getAttribute('href')).includes('design=kp-liquid-prism.png'),'previous wraps to matching product');
   }
   check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),engine+width+' overflow');
   check(await p.locator('img').evaluateAll(es=>es.every(e=>e.naturalWidth>0)),'loaded images');
   check(await p.locator('.design-label').evaluateAll(es=>es.length===4&&es.every(e=>e.textContent.includes('$44.99'))),'case prices');
   check((await p.locator('.glass-band').innerText()).includes('$64.98'),'bundle total');
   check(await p.locator('.gift-photo p').evaluate(e=>parseFloat(getComputedStyle(e).fontSize)>=12&&e.textContent.includes('AI-assisted')),'mockup disclosure');
   check(await p.locator('form').count()===1&&await p.locator('.phone-finder form').getAttribute('method')==='get','device finder uses navigation only');
   const links=await p.locator('a').evaluateAll(es=>es.map(e=>e.getAttribute('href')));
   for(const href of links){
    if(href.startsWith('#')){check(await p.locator(href).count()===1,'anchor '+href);continue;}
    const u=new URL(href,'https://example.test/');if(u.origin!=='https://example.test')continue;
    check(fs.existsSync(path.join(root,u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname)),'destination '+href);
    if(u.searchParams.has('design'))check(catalog.some(d=>d.file===u.searchParams.get('design')&&d.active!==false),'active design '+href);
    if(u.searchParams.has('cat'))check(catalog.some(d=>d.category===u.searchParams.get('cat')),'category '+href);
   }
   if(width<=760){
    await p.locator('#mobileMenu summary').click();check(await p.locator('#mobileMenu').evaluate(e=>e.open),'menu opens');
    await p.keyboard.press('Escape');check(await p.locator('#mobileMenu').evaluate(e=>!e.open&&document.activeElement===e.querySelector('summary')),'escape focus');
    await p.locator('#mobileMenu summary').click();await p.locator('#mobileMenu a[href="#stores"]').click();
    check(await p.locator('#mobileMenu').evaluate(e=>!e.open),'anchor closes menu');
    check(await p.locator('#stores').evaluate(e=>document.activeElement===e),'anchor focus');
   }
   check(!errors.length&&!posts.length,'no errors or submissions');
   await p.close();
  }
  const p=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});await p.goto(base);check(await p.locator('.case-slide:visible').count()===1&&!await p.locator('.edit-controls').isVisible(),'no JS shows one shoppable case without controls');await p.locator('#mobileMenu summary').click();check(await p.locator('#mobileMenu a[href="slates.html"]').isVisible(),'no JS menu');await browser.close();
 }
 console.log(checks+' homepage checks passed');
})().catch(e=>{console.error(e);process.exit(1)});
