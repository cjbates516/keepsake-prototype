const {chromium,webkit}=require('../../../playwright/node_modules/playwright-core');
const assert=require('assert');
const base=process.env.KP_BASE||'http://127.0.0.1:8766/';
(async()=>{for(const [engine,type] of Object.entries({chromium,webkit})){
 const b=await type.launch();try{
 const p=await b.newPage({viewport:{width:390,height:844},serviceWorkers:'block'});let blocked=true;const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/instore/models.json',r=>blocked?r.abort():r.continue());
 await p.goto(base+'instore/find.html?model=iphone-18-pro');await p.locator('#retryPhones').waitFor();
 assert(await p.locator('#staffModel').isDisabled());await p.locator('#retryPhones').click();await p.waitForFunction(()=>!document.getElementById('retryPhones').disabled);
 assert(await p.locator('#retryPhones').evaluate(e=>e===document.activeElement));
 blocked=false;await p.locator('#retryPhones').click();await p.waitForFunction(()=>!document.getElementById('staffModel').disabled);
 assert.equal(await p.locator('#staffModel').inputValue(),'iPhone 18 Pro');assert(await p.locator('#staffModel').evaluate(e=>e===document.activeElement));
 await p.locator('#designName').fill('Liquid Prism');await p.locator('#nameForm button').click();await p.locator('.name-result').waitFor();
 assert(await p.locator('.name-thumb img').evaluate(async e=>{await e.decode();return e.naturalWidth>0;}));assert.equal(await p.locator('.name-thumb figcaption').innerText(),'Original artwork');
 await p.locator('.name-result select').selectOption('c3');assert((await p.locator('.name-result a').getAttribute('href')).includes('colorway=c3'));
 for(const width of [320,390,820,1440]){await p.setViewportSize({width,height:900});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),engine+' overflow '+width);}
 await p.locator('#staffModel').selectOption('');assert.equal(await p.locator('.name-result').count(),0);assert.equal(await p.locator('#ownOpen').getAttribute('href'),'#staffModel');await p.locator('#ownOpen').focus();await p.keyboard.press('Enter');assert(await p.locator('#staffModel').evaluate(e=>e===document.activeElement));
 // A successful code lookup must also restore the phone list after initial failure.
 blocked=true;await p.reload();await p.locator('#retryPhones').waitFor();blocked=false;await p.locator('#q').fill('17P-FLR-012');await p.locator('#f button').click();await p.waitForFunction(()=>!document.getElementById('staffModel').disabled);
 assert(await p.locator('#retryPhones').isHidden());
 blocked=true;await p.reload();await p.locator('#retryPhones').waitFor();blocked=false;await p.locator('#designName').fill('Liquid Prism');await p.locator('#nameForm button').click();await p.waitForFunction(()=>document.getElementById('nameStatus').textContent==='Search again for this phone.');await p.locator('#nameForm button').click();await p.locator('.name-result').waitFor();assert((await p.locator('.name-result a').getAttribute('aria-label')).includes('Liquid Prism'));
 await p.route('**/assets/designs/designs.json',async r=>{const response=await r.fetch();const data=await response.json();data.find(d=>d.file==='kp-liquid-prism.png').compatible_models=['17P'];await r.fulfill({response,json:data});});
 await p.reload();await p.waitForFunction(()=>!document.getElementById('staffModel').disabled);
 const badCode=await p.evaluate(async()=>{const d=await KPI.load();return KPI.pickCode(d.modelById('18P'),d.allDesigns.find(x=>x.file==='kp-liquid-prism.png'),'original');});
 await p.locator('#q').fill(badCode);await p.locator('#f button').click();await p.waitForFunction(()=>document.getElementById('err').textContent.includes('not available for'));
 assert(!await p.locator('#ropen').isVisible());
 await p.evaluate(()=>{KPI.colorways=()=>{throw Error('Injected lookup failure');};});await p.locator('#q').fill(badCode.replace('18P-','17P-'));await p.locator('#f button').click();await p.waitForFunction(()=>document.getElementById('err').textContent.includes('Could not prepare'));assert.deepEqual(errors,[]);console.log(engine+': retry failure/success, lookup recovery, thumbnails, colorway links, model reset and four widths passed');
 }finally{await b.close();}
}})().catch(e=>{console.error(e);process.exit(1)});
