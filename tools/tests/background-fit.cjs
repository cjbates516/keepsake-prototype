const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,webkit}=require(process.env.KP_PLAYWRIGHT||'/tmp/keepsake-browser-20261121/package');
const base=process.env.KP_BASE||'http://127.0.0.1:19038/',out=process.env.KP_OUT||'/tmp/background-fit';fs.mkdirSync(out,{recursive:true});
(async()=>{for(const engine of [chromium,webkit]){const b=await engine.launch();try{for(const width of [390,1280]){
const p=await b.newPage({viewport:{width,height:900},reducedMotion:'reduce',serviceWorkers:'block'}),errors=[];p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(20000);
await p.goto(base+'gallery.html?device=iphone-17-pro-max');await p.locator('#wizSearch').fill('Pink Lemonade');const card=p.locator('.kpCard[data-file="kp-lemons-bubblegum.jpg"]');await card.waitFor();await card.scrollIntoViewIfNeeded();await p.waitForFunction(()=>document.querySelector('.kpCard canvas')?.dataset.renderedPreview);assert.equal(await card.locator('.artwork-thumb').count(),0);
const audit=await p.evaluate(async()=>{
 const counts={opaque:0,transparent:0,assets:0};
 for(const [file,pf] of Object.entries(KP_COLORWAY_CATALOG)){
 const opts=KPDesignColorways.choicesFor({__kpDesignFile:file});
 if(pf.method==='yosemite')continue;
 if(pf.method==='assets'){counts.assets++;continue;}
 if(pf.background?.transparent){counts.transparent++;continue;}
 if(opts.length!==1)throw Error(file+' still offers a matted background');counts.opaque++;
 }
 for(const file of ['kp-lemons-bubblegum.jpg','big-bloom-pop.jpg','wavy-rainbow-check.jpg']){
 const im=new Image();im.src='assets/designs/'+file;await im.decode();im.__kpDesignFile=file;
 const actual=KPDesignColorways.make(im,'original',600),expected=document.createElement('canvas');const scale=Math.min(1,600/Math.max(im.width,im.height));expected.width=Math.round(im.width*scale);expected.height=Math.round(im.height*scale);expected.getContext('2d').drawImage(im,0,0,expected.width,expected.height);
 if(actual.toDataURL()!==expected.toDataURL())throw Error(file+' changed original geometry or pixels');
 let blocked=false;try{KPDesignColorways.make(im,'c1',600)}catch(e){blocked=true}if(!blocked)throw Error('Retired variant silently rendered');
 }
 const im=new Image();im.src='assets/designs/city-scene-philadelphia.png';await im.decode();im.__kpDesignFile='city-scene-philadelphia.png';
 const original=KPDesignColorways.make(im,'original',600),variant=KPDesignColorways.make(im,'c1',600);
 if(original.width!==variant.width||original.height!==variant.height)throw Error('Transparent art changed geometry');
 const a=original.getContext('2d').getImageData(0,0,original.width,original.height).data,z=variant.getContext('2d').getImageData(0,0,variant.width,variant.height).data;let foreground=0,background=0;
 for(let i=0;i<a.length;i+=4){if(a[i+3]===255){foreground++;for(let j=0;j<4;j++)if(Math.abs(a[i+j]-z[i+j])>1)throw Error('Opaque artwork changed: '+a.slice(i,i+4)+' → '+z.slice(i,i+4));}if(a[i+3]===0&&z[i+3]===255)background++;}if(!foreground||!background)throw Error('No tested foreground/background');return counts;
});
await p.evaluate(()=>window.scrollBy(0,-150));await card.screenshot({path:out+'/'+engine.name()+'-'+width+'-lemon.png'});
await p.locator('#wizSearch').fill('Cherry Dot');const cherry=p.locator('.kpCard[data-file="kp-cherry-dot.png"]');await cherry.waitFor();await cherry.locator('.artwork-thumb[data-look="c1"] img').waitFor();await p.waitForFunction(()=>document.querySelector('[data-file="kp-cherry-dot.png"] .artwork-thumb[data-look="c1"] img')?.getAttribute('src'));await cherry.locator('.artwork-thumb[data-look="c1"]').click();await p.waitForFunction(()=>document.querySelector('[data-file="kp-cherry-dot.png"] .artwork-thumb[data-look="c1"]')?.getAttribute('aria-pressed')==='true');
await p.goto(base+'customizer.html?model=iphone-17-pro-max&design=kp-lemons-bubblegum.jpg&colorway=c4');await p.waitForFunction(()=>window.__kp&&__kp.state.photoImg&&!__kp.state.libraryLoading);assert(await p.evaluate(()=>__kp.state.colorwayUnavailable&&__kp.buildPrint(()=>{})===false));await p.locator('[data-tool="background"]').click();await p.locator('[data-look="original"]').click();assert(await p.evaluate(()=>!__kp.state.colorwayUnavailable&&__kp.state.variant==='original'&&new Promise(r=>__kp.buildPrint(c=>r(c.width>800)))));
if(await p.locator('#studioSheet').evaluate(e=>e.open))await p.locator('#studioDone').click();await p.screenshot({path:out+'/'+engine.name()+'-'+width+'-customizer.png'});
await p.goto(base+'instore/');await p.locator('[data-model="17PM"]').click();await p.locator('#designSearch').fill('Pink Lemonade');await p.locator('.tile[data-file="kp-lemons-bubblegum.jpg"] img:not(.wait)').waitFor();await p.waitForTimeout(450);await p.locator('.tile[data-file="kp-lemons-bubblegum.jpg"] .tname').click();await p.locator('#showBtn:not([disabled])').waitFor();assert(await p.locator('#colorwayPicker').isHidden());await p.locator('#showBtn').click();assert(!/-C[1-6]/.test(await p.locator('#code').textContent()));assert.deepEqual(errors,[]);console.log(engine.name(),width,JSON.stringify(audit),'gallery, authored variant, retired link/export guard, kiosk counter passed');await p.close();
}}finally{await b.close();}}})().catch(e=>{console.error(e);process.exitCode=1});
