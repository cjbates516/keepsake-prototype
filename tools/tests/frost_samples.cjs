const fs=require('fs'),assert=require('assert/strict');const {chromium,webkit}=require('../../../playwright/node_modules/playwright-core');
const base=process.env.KP_BASE||'http://127.0.0.1:19038/',out=process.env.KP_OUT||'../collaboration/site-frost-audit-2026-11-24';fs.mkdirSync(out,{recursive:true});
(async()=>{for(const engine of [chromium,webkit]){const b=await engine.launch();try{for(const width of [390,1280]){const p=await b.newPage({viewport:{width,height:900},reducedMotion:'reduce'});const errors=[];p.on('pageerror',e=>errors.push(e.message));
for(const route of ['index.html','gallery.html?device=iphone-15-pro&cat=Fruits','slates.html','instore/?store=West%20Chester%2C%20PA']){
 await p.goto(base+route);if(route.startsWith('gallery'))await p.waitForFunction(()=>document.querySelector('#grid canvas')?.dataset.renderedPreview);if(route.startsWith('slates')){await p.locator('[data-start]').first().click();await p.locator('[name=sizeOrientation][value=portrait]').check();await p.locator('[data-size=medium]').click();assert.equal(await p.locator('#slateOrientation').inputValue(),'portrait');await p.locator('#slateBack').click();}
 if(route.startsWith('instore')){await p.locator('[data-model="15P"]').click();await p.waitForTimeout(2500);}
 assert(!await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),'overflow '+route);await p.screenshot({path:out+'/'+engine.name()+'-'+width+'-'+route.split('.')[0].split('/')[0]+'.png'});console.log(engine.name(),width,route,errors);assert.deepEqual(errors,[]);
}await p.close();}}finally{await b.close();}}})();
