const assert=require('node:assert/strict');
const {chromium,webkit}=require('../../../playwright/node_modules/playwright-core');
(async()=>{for(const engine of [chromium,webkit]){const b=await engine.launch();try{
 const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:19038/customizer.html?model=iphone-18-pro-max&design=zodiac-atlas-leo.png&extras=X05&store=Pottstown%2C%20PA',{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>window.__kp?.state.photoImg&&!__kp.state.libraryLoading);
 assert.equal(await p.evaluate(()=>__kp.orderPricing().total),74.98);
 await p.locator('#cartBtn').tap();await p.waitForFunction(()=>document.getElementById('reviewCode').textContent.endsWith('-X05-S2'));
 const storeCode=(await p.locator('#reviewCode').innerText()).replace(/^Pick code · /,'');
 const staff=await b.newPage();await staff.goto('http://127.0.0.1:19038/instore/find.html');await staff.locator('#q').fill(storeCode);await staff.locator('#f button').click();await staff.waitForFunction(()=>document.getElementById('rprice').textContent.includes('74.98'));assert((await staff.locator('#ropen').getAttribute('href')).includes('Pottstown'));
 await p.locator('#counterReview').evaluate(d=>d.close());

 await p.locator('[data-s="West Chester, PA"]').tap();assert.equal(await p.evaluate(()=>__kp.orderPricing().total),69.98);
 assert.deepEqual(await p.evaluate(()=>KPAccessories.get('X48').availableStores),['West Chester, PA']);
 assert.equal(await p.evaluate(()=>KPAccessories.price(KPAccessories.get('X33'),'Newark, DE')),69.99);
 await p.locator('#kpModelTrig').tap();await p.locator('#kpSheetList [data-m="iPhone 14"]').tap();await p.waitForFunction(()=>__kp.state.model==='iPhone 14'&&__kp.state.accessories.length===0);
 assert((await p.locator('.ka-status').innerText()).includes('removed'));
 await p.goto('http://127.0.0.1:19038/customizer.html?model=iphone-18-pro-max&design=zodiac-atlas-leo.png&extras=X02',{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>window.__kp?.state.photoImg&&!__kp.state.libraryLoading);assert.deepEqual(await p.evaluate(()=>__kp.state.accessories),[]);
 const fallback=await b.newPage();await fallback.route('**/accessories.js',r=>r.abort());
 await fallback.goto('http://127.0.0.1:19038/customizer.html?model=iphone-18-pro-max&design=zodiac-atlas-leo.png&extras=X47',{waitUntil:'domcontentloaded'});
 await fallback.waitForFunction(()=>window.__kp?.state.photoImg&&!__kp.state.libraryLoading);
 assert(await fallback.locator('#cartBtn').isDisabled());assert((await fallback.locator('#accessoryPicker').innerText()).includes('could not load'));assert(fallback.url().includes('extras=X47'));
 await fallback.evaluate(()=>{var b=document.getElementById('cartBtn');b.disabled=false;b.click();});assert.equal(await fallback.locator('#counterReview').getAttribute('open'),null);
 await fallback.goto('http://127.0.0.1:19038/instore/',{waitUntil:'domcontentloaded'});await fallback.locator('[data-model="18PM"]').waitFor();
 assert.deepEqual(errors,[]);console.log(engine.name()+': store override prices, availability, incompatible selections and missing-script recovery passed');
}finally{await b.close();}}})().catch(e=>{console.error(e);process.exitCode=1;});
