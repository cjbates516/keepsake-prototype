// Enumerate every shipped HTML page; no hand-maintained list that can omit a new collection.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.KP_PLAYWRIGHT||'../../../playwright/node_modules/playwright-core');
const base=process.env.KP_BASE||'http://127.0.0.1:19038/';
const out=process.env.KP_OUT||'../collaboration/clear-case-every-page-2026-11-21/pages';fs.mkdirSync(out,{recursive:true});
const routes=[...fs.readdirSync('.').filter(f=>f.endsWith('.html')),...fs.readdirSync('instore').filter(f=>f.endsWith('.html')).map(f=>'instore/'+f)].sort();
const old=/assets\/home\/personal\/(?:drawing-case|drawing-shell|sky-case|sky-shell|sky-case-detail)\.webp/;
(async()=>{const results=[];for(const engine of [chromium,webkit]){const b=await engine.launch();try{for(const width of [390,1280]){
 const context=await b.newContext({viewport:{width,height:900},isMobile:width<600,hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'});
 await context.route('**/*',r=>new URL(r.request().url()).origin===new URL(base).origin?r.continue():r.abort());
 const p=await context.newPage();p.setDefaultTimeout(20000);
 for(const route of routes){let errors=[];const err=e=>errors.push(e.message);p.on('pageerror',err);
  const failed=[],badResponse=r=>{if(new URL(r.url()).origin===new URL(base).origin&&r.status()>=400)failed.push(r.status()+' '+r.url());};p.on('response',badResponse);
  const response=await p.goto(new URL(route,base).href,{waitUntil:'domcontentloaded'});
  assert(response.ok(),route+' HTTP '+response.status());
  await p.waitForLoadState('load');await p.evaluate(()=>document.fonts.ready);
  if(route==='gallery.html')await p.waitForFunction(()=>document.querySelector('canvas[data-rendered-preview]'));
  const images=await p.evaluate(async()=>{
   const all=[...document.images].filter(im=>im.getAttribute('src')&&/assets\/(?:home|case-only-previews|featured-cases|collection-cases|celestial-patterns|new-prints)\//.test(im.src));
   return Promise.all(all.map(async im=>{im.loading='eager';try{await im.decode();return {src:im.getAttribute('src'),width:im.naturalWidth,height:im.naturalHeight};}catch{return {src:im.getAttribute('src'),error:true};}}));
  });
  const expected=(fs.readFileSync(route,'utf8').match(/<img\b[^>]*\bsrc=["']assets\/(?:home|case-only-previews|featured-cases|collection-cases|celestial-patterns|new-prints)\//g)||[]).length;
  assert(images.length>=expected,route+' missing image elements: '+images.length+' of at least '+expected);
  const broken=images.filter(i=>i.error||!i.width);assert.deepEqual(broken,[],route+' broken preview');
  assert(!images.some(i=>old.test(i.src)),route+' stale personal preview');
  const overflow=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
  const name=engine.name()+'-'+width+'-'+route.replaceAll('/','-');
  await p.screenshot({path:path.join(out,name+'.png')});
  if(route==='index.html'){
   const personal=p.locator('.personal-tiles');await personal.scrollIntoViewIfNeeded();
   await p.screenshot({path:path.join(out,name+'-personal.png')});
   await personal.locator('a').first().click();await p.locator('#caseZoomDialog').waitFor();
   await p.locator('#caseZoomDialog img').evaluate(im=>im.decode());
   assert((await p.locator('#caseZoomDialog img').getAttribute('src')).includes('drawing-clear-case-v2'));
   await p.screenshot({path:path.join(out,name+'-personal-zoom.png')});
   await p.locator('#caseZoomDialog [data-close]').click();await personal.locator('a').nth(1).click();await p.locator('#caseZoomDialog img').evaluate(im=>im.decode());assert((await p.locator('#caseZoomDialog img').getAttribute('src')).includes('sky-clear-case-v2'));
  }
  assert.deepEqual(failed,[],route+' failed same-origin resources');results.push({route,engine:engine.name(),width,status:response.status(),images:images.length,expected,overflow,errors});p.off('pageerror',err);p.off('response',badResponse);
  console.log(name,images.length+' previews',overflow?'OVERFLOW':'OK',errors.length?'ERRORS '+JSON.stringify(errors):'');
 }
 await context.close();
 }}finally{await b.close();}}
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2)+'\n');
 assert(results.every(r=>!r.overflow&&!r.errors.length),'Page failures: '+JSON.stringify(results.filter(r=>r.overflow||r.errors.length)));
 console.log(results.length+' page/viewport/browser combinations verified');
})().catch(e=>{console.error(e);process.exitCode=1;});
