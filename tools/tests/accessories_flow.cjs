const assert=require('node:assert/strict');
const {chromium,webkit}=require('../../../playwright/node_modules/playwright-core');
const base=process.env.KP_BASE||'http://127.0.0.1:19038/';
(async()=>{for(const engine of [chromium,webkit]){
 const browser=await engine.launch();try{
 const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[],posts=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(r.method()==='POST')posts.push(r.url());});
 await p.goto(base+'customizer.html?design=zodiac-atlas-leo.png&model=iphone-18-pro-max&glass=1',{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>window.__kp?.state.photoImg&&!__kp.state.libraryLoading&&!__kp.printIssue());
 await p.locator('[data-accessory="X47"]').tap();
 assert.equal(await p.evaluate(()=>__kp.orderPricing().total),99.97);
 assert(new URL(p.url()).searchParams.get('extras')==='X47');
 await p.locator('#cartBtn').tap();await p.locator('#counterReview[open]').waitFor();
 await p.waitForFunction(()=>document.getElementById('reviewCode').textContent.endsWith('-G-X47-S1'));
 const code=(await p.locator('#reviewCode').innerText()).replace(/^Pick code · /,'');assert((await p.locator('#reviewDetails').innerText()).includes('PK-200'));
 await p.goto(base+'instore/find.html');await p.locator('#q').fill(code);await p.locator('#f button').click();
 try{await p.waitForFunction(()=>document.getElementById('rprice').textContent.includes('99.97'));}catch(e){console.log({code,body:await p.locator('body').innerText()});throw e;}
 assert((await p.locator('#raccessories').innerText()).includes('PK-200'));
 assert((await p.locator('#ropen').getAttribute('href')).includes('extras=X47'));
 assert.equal(await p.evaluate(()=>KPI.parseCode('18PM-ZOD-001-X99',['18PM'])),null);
 assert.equal(await p.evaluate(()=>KPAccessories.compatible(KPAccessories.get('X02'),'iPhone 18 Pro Max')),false);
 assert.equal(await p.evaluate(()=>KPAccessories.compatible(KPAccessories.get('X02'),'iPhone 14')),true);
 await p.goto(base+'instore/');await p.locator('[data-model="18PM"]').tap();await p.locator('#designSearch').fill('Leo · Star Atlas');await p.waitForTimeout(500);await p.locator('.tile[data-file="zodiac-atlas-leo.png"] img:not(.wait)').waitFor();await p.locator('.tile[data-file="zodiac-atlas-leo.png"] .tname').tap();
 try{await p.waitForFunction(()=>__kpInStore.state.screen===3,{},{timeout:3000});}catch(e){await p.screenshot({path:'/tmp/accessory-kiosk-failure.png'});console.log('KIOSK',engine.name(),errors,await p.locator('body').innerText());throw e;}
 await p.locator('#accessoryStore').selectOption('West Chester, PA');await p.locator('[data-accessory="X47"]').tap();await p.locator('#accessoryStore').selectOption('');assert.deepEqual(await p.evaluate(()=>__kpInStore.state.accessories),[]);await p.locator('#accessoryStore').selectOption('West Chester, PA');await p.locator('[data-accessory="X47"]').tap();await p.locator('#glass').check();
 await p.waitForFunction(()=>!document.getElementById('showBtn').disabled);
 assert((await p.locator('#price').innerText()).includes('99.97'));await p.locator('#showBtn').tap();
 assert((await p.locator('#code').innerText()).endsWith('-G-X47-S1'));
 assert((await p.locator('#counterAccessories').innerText()).includes('PK-200'));
 for(const width of [320,390,820,1280]){await p.setViewportSize({width,height:900});if(!(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))){console.log('OVERFLOW',engine.name(),width,await p.evaluate(()=>Array.from(document.querySelectorAll('body *')).map(e=>({tag:e.tagName,id:e.id,cls:e.className,r:e.getBoundingClientRect().right,w:e.getBoundingClientRect().width})).filter(e=>e.r>innerWidth+1&&e.w>0).slice(0,30)));await p.screenshot({path:'/tmp/accessory-overflow.png'});throw Error('overflow '+width);}}
 await p.setViewportSize({width:390,height:844});await p.locator('#s3 [data-act="reset"]').tap();await p.locator('[data-model="18PM"]').click();await p.locator('#designSearch').fill('Leo · Star Atlas');await p.waitForTimeout(500);await p.locator('.tile[data-file="zodiac-atlas-leo.png"] img:not(.wait)').waitFor();await p.locator('.tile[data-file="zodiac-atlas-leo.png"] .tname').click();
 assert.equal(await p.locator('#accessoryStore').inputValue(),'');await p.locator('#accessoryStore').selectOption('West Chester, PA');assert.equal(await p.locator('[data-accessory="X47"]').getAttribute('aria-pressed'),'false');assert((await p.locator('#price').innerText()).includes('44.99'));
 assert.deepEqual(errors,[]);assert.deepEqual(posts,[]);
 console.log(engine.name()+': accessory recommendation, total, URL, pick code, staff handoff, connector matching, kiosk reset and responsive widths passed');
 }finally{await browser.close();}
}})().catch(e=>{console.error(e);process.exitCode=1;});
