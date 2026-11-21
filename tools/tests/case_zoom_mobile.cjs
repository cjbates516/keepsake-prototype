const {webkit,chromium}=require(process.env.KP_PLAYWRIGHT||'../../../playwright/node_modules/playwright-core'),assert=require('node:assert/strict');
const base=process.env.KP_BASE||'http://127.0.0.1:8766/';
(async()=>{for(const engine of [webkit,chromium]){
const b=await engine.launch(); try{const p=await b.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});p.setDefaultTimeout(16000);p.on('pageerror',e=>console.error(e.message));const d=p.locator('#caseZoomDialog');
async function verify(sel){await sel.tap();await d.waitFor();await d.locator('output').filter({hasText:'1×'}).waitFor();const subject=d.locator('.zoom-scroll :is(canvas,img,svg)').last();const first=await subject.boundingBox();await d.getByRole('button',{name:'Zoom in',exact:true}).tap();assert((await subject.boundingBox()).width>first.width);}
const close=()=>d.getByRole('button',{name:'Close',exact:true}).tap();
for(const [cat,file] of [['Zodiac','zodiac-atlas-libra.png'],['City%20Scenes','city-night-new-york.jpg']]){
 await p.goto(base+'gallery.html?cat='+cat);
 const sample=p.locator('[data-enlarge="'+file+'"]');
 await sample.scrollIntoViewIfNeeded();
 await p.waitForFunction(file=>document.querySelector('[data-enlarge="'+file+'"] canvas[data-rendered-preview]'),file);
 await verify(sample);assert(await d.locator('canvas').evaluate(c=>c.height>1100));await close();
 await p.goto(base+'gallery.html?cat='+cat+'&device=iphone-18-pro-max');const card=p.locator('.kpCard[data-file="'+file+'"]');
 if(cat==='Zodiac')await card.locator('.artwork-thumb[data-look="c3"]').tap();await card.locator('.cdot').nth(1).evaluate(e=>e.scrollIntoView({block:'center',behavior:'instant'}));await card.locator('.cdot').nth(1).tap();await verify(card.locator('.case-zoom-button'));
 await d.getByRole('button',{name:'Customize this case'}).tap();await p.waitForFunction(f=>window.__kp?.state.photoImg?.__kpDesignFile===f && !__kp.printIssue(),file);
 if(cat==='Zodiac')assert.equal(await p.evaluate(()=>__kp.state.variant),'c3');assert(new URL(p.url()).searchParams.get('finish'));await verify(p.locator('#stageCanvas'));await close();console.log(engine.name(),cat,'full size gallery, finish/colorway, customize and stage passed');
}
for(const [path,selector] of [['parks-rugged.html','a.look'],['gifts.html','a.caseTile[href*="zodiac-atlas-leo"]'],['instore/','button[data-model]']]){
 await p.goto(base+path);if(path==='instore/'){await p.locator(selector).first().tap();await verify(p.locator('[data-zoom-tile]').first());await d.getByRole('button',{name:'Use this design'}).tap();await p.waitForFunction(()=>document.getElementById('showBtn').disabled===false);await verify(p.locator('[data-image-zoom="pv"]:visible').first());}
 else await verify(p.locator(selector).first());await close();
}
 console.log(engine.name(),'collection, gift guide, in-store tiles and counter preview passed');
}finally{await b.close()}}})().catch(e=>{console.error(e);process.exitCode=1});
