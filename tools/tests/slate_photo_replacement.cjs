const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,webkit}=require(process.env.KP_PLAYWRIGHT||'../../../playwright/node_modules/playwright-core');
const base=process.env.KP_BASE||'http://127.0.0.1:19038/';
const out=process.env.KP_OUT||'/tmp/slate-photo-replacement';fs.mkdirSync(out,{recursive:true});
(async()=>{for(const engine of [chromium,webkit]){
 const browser=await engine.launch();try{for(const [width,height] of [[390,844],[820,1180],[1024,768]]){
  const p=await browser.newPage({viewport:{width,height},hasTouch:true,isMobile:width===390,reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(base+'slates.html');await p.locator('[data-start]').first().click();await p.locator('[data-size=medium]').click();await p.locator('.store-choice').first().click();await p.locator('#slateForward').click();
  await p.locator('#slatePhoto').setInputFiles('assets/photos/slates/grandparents.jpg');await p.locator('#adjustPhoto').click();
  await p.locator('#slatePhotoZoom').fill('1.8');await p.locator('#slatePhotoX').fill('0');await p.locator('#slatePhotoY').fill('100');
  // Failed replacements must keep the current photo and its crop.
  await p.locator('#slatePhoto').setInputFiles({name:'invalid.png',mimeType:'image/png',buffer:Buffer.from('not an image')});
  await p.waitForFunction(()=>document.getElementById('photoStatus').textContent.includes('could not'));
  assert.equal(await p.locator('#slatePhotoZoom').inputValue(),'1.8');assert(await p.locator('#slateForward').isEnabled());
  await p.locator('#slatePhoto').setInputFiles('assets/photos/slates/family-outdoors.jpg');
  await p.waitForFunction(()=>document.getElementById('photoStatus').textContent.includes('stays'));
  assert.equal(await p.locator('#slatePhotoZoom').inputValue(),'1');assert.equal(await p.locator('#slatePhotoX').inputValue(),'50');assert.equal(await p.locator('#slatePhotoY').inputValue(),'50');
  await p.locator('#slateOrientation').selectOption('portrait');await p.locator('#slateCaption').fill('Our family');
  await p.locator('#slateBack').click();await p.locator('#slateBack').click();assert.equal(await p.locator('[name=sizeOrientation]:checked').inputValue(),'portrait');
  await p.locator('[data-size=large]').click();await p.locator('#slateForward').click();assert.equal(await p.locator('#slateOrientation').inputValue(),'portrait');
  await p.locator('#slateForward').click();assert.match(await p.locator('#selectedOrientation').innerText(),/Portrait/);assert.equal(await p.locator('#selectedCaption').innerText(),'Our family');
  assert.match(await p.locator('#selectedPrice').innerText(),/49.99/);assert.equal(await p.locator('#slateCode').innerText(),'SL-810');
  assert(await p.locator('#selectedSlatePreview').evaluate(async e=>{await e.decode();return e.naturalHeight>e.naturalWidth;}));
  await p.screenshot({path:out+'/'+engine.name()+'-'+width+'-portrait-counter.png'});
  await p.locator('#editSlate').click();await p.locator('#slateOrientation').selectOption('landscape');await p.locator('#slateBack').click();await p.locator('#slateBack').click();assert.equal(await p.locator('[name=sizeOrientation]:checked').inputValue(),'landscape');
  await p.locator('[data-size=small]').click();await p.locator('#slateForward').click();await p.locator('#slateForward').click();assert.match(await p.locator('#selectedOrientation').innerText(),/Landscape/);assert(await p.locator('#selectedSlatePreview').evaluate(async e=>{await e.decode();return e.naturalWidth>e.naturalHeight;}));
  assert.deepEqual(errors,[]);console.log('PASS',engine.name(),width,'new photo centered; failed replacement preserves crop; orientation survives size changes both ways and counter');await p.close();
 }}finally{await browser.close();}
}})().catch(e=>{console.error(e);process.exitCode=1;});
