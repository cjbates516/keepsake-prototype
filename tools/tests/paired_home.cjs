const assert=require('node:assert/strict'),fs=require('fs');const {chromium,webkit}=require('../../../playwright/node_modules/playwright-core');const base=process.env.KP_BASE||'http://127.0.0.1:19038/',out='../collaboration/zodiac-tarot-patterns-2026-11-20/home-validation';fs.mkdirSync(out,{recursive:true});
(async()=>{for(const engine of [chromium,webkit]){const b=await engine.launch();try{for(const [width,height] of [[375,812],[390,844],[820,1180],[1440,1000],[1920,1080]]){
 const c=await b.newContext({viewport:{width,height},hasTouch:true,reducedMotion:'reduce'}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(base);await p.locator('.ks-start-case').waitFor();assert(await p.locator('.ks-start-case').isVisible());assert.equal(await p.locator('.case-slide').count(),12);
 for(let i=0;i<12;i++){
  const s=p.locator('.case-slide:not([hidden])');assert.equal(await s.locator('.paired-phone').count(),2);for(const im of await s.locator('.paired-phone img').all())await im.evaluate(i=>i.decode());
  const layout=await s.evaluate(s=>{const a=s.getBoundingClientRect(),cta=s.querySelector('.campaign-shop').getBoundingClientRect();return{overflow:document.documentElement.scrollWidth>innerWidth,hero:a.height,cta:[cta.x,cta.y,cta.right,cta.bottom],pair:[...s.querySelectorAll('.paired-phone')].map(p=>{const b=p.getBoundingClientRect();return[b.x,b.y,b.right,b.bottom]})}});assert(!layout.overflow);assert(layout.hero>height*.65);assert(layout.cta[0]>=0&&layout.cta[2]<=width);for(const r of layout.pair)assert(r[0]>=-2&&r[2]<=width+2,'case outside viewport');
  if(i===0)await p.screenshot({path:out+'/'+engine.name()+'-'+width+'.png'});
  const links=await s.locator('.paired-phone').evaluateAll(a=>a.map(x=>x.href));for(const href of links)assert(href.includes('customizer.html'));
  await s.locator('.campaign-shop').focus();await p.keyboard.press('ArrowRight');
 }
 await p.locator('.case-slide:not([hidden]) .paired-phone').first().click();await p.waitForFunction(()=>window.KPEditor&&!KPStudioCore.info().issue);assert.equal(await p.evaluate(()=>__kp.state.photoImg.__kpDesignFile),'kp-park-collage-grand-canyon.jpg');
 await p.goto(base);await p.locator('.ks-start-case').click();await p.waitForFunction(()=>window.KPEditor);assert(new URL(p.url()).pathname.endsWith('customizer.html'));assert.deepEqual(errors,[]);console.log(engine.name(),width,'12 paired slides + direct customize + prominent start CTA passed');await c.close();
 }}finally{await b.close()}}})().catch(e=>{console.error(e);process.exitCode=1});
