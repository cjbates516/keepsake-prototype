const assert=require('node:assert/strict');
const {chromium,webkit}=require('../../../playwright/node_modules/playwright-core');
const base=process.env.KP_BASE||'http://127.0.0.1:19038/';
(async()=>{for(const engine of [chromium,webkit]){
 const b=await engine.launch();try{
 const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),errors=[],posts=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(r.method()==='POST')posts.push(r.url());});
 // A slow optional HEIC converter must not hold the navigation menu hostage.
 await p.route('**/heic2any.min.js',()=>{});
 await p.goto(base,{waitUntil:'domcontentloaded'});
 await p.getByRole('button',{name:'Open navigation menu'}).tap();
 await p.getByRole('link',{name:'All phone cases Browse prints before picking a phone'}).tap();
 await p.locator('#wizCat').selectOption('Zodiac');
 await p.locator('a[data-pick-model="zodiac-atlas-leo.png"]').tap();
 await p.locator('#kpDevDrawer [data-md="iphone-18-pro-max"]').tap();
 await p.waitForFunction(()=>window.__kp?.state.photoImg&&!__kp.state.libraryLoading&&!__kp.printIssue());
 await p.getByRole('button',{name:'Open navigation menu'}).waitFor();
 await p.waitForFunction(()=>{const c=document.getElementById('stageCanvas');return c.getContext('2d').getImageData(c.width*.5,c.height*.2,1,1).data[3]>240;});
 assert.equal(await p.evaluate(()=>__kp.state.previewMode),'phone');
 assert.equal(await p.locator('#caseViewSwitch').isVisible(),false);
 await p.locator('[data-tool="background"]').tap();await p.locator('[data-look="c4"]').tap();await p.locator('#studioDone').tap();await p.waitForFunction(()=>!document.getElementById('studioSheet').open);
 await p.locator('[data-tool="name"]').tap();await p.locator('#nameInput').fill('PRIVATE TEST');await p.locator('#studioDone').tap();await p.waitForFunction(()=>!document.getElementById('studioSheet').open);await p.locator('#studioNext').tap();await p.locator('#studioNext').tap();
 await p.locator('#addons [data-k="screen"]').tap();
 if(await p.locator('#studioAccessoryOpen').isVisible())await p.locator('#studioAccessoryOpen').click();await p.locator('#accessoryPicker [data-category="Wall chargers"]').click();await p.locator('[data-accessory="X26"]').click();if(await p.locator('#studioAccessoryDialog[open]').count())await p.locator('#studioAccessoryDone').click();
 await p.locator('#storeChips [data-s="Newark, DE"]').tap();
 assert(!p.url().includes('PRIVATE'),'personal text must never enter the URL');
 await p.locator('#studioNext').tap();await p.locator('#counterReview[open]').waitFor();
 await p.waitForFunction(()=>document.getElementById('reviewCode').textContent.endsWith('-G-X26-S3'));
 await p.locator('#reviewSpecification > summary').click();const review=await p.locator('#reviewDetails').innerText();
 for(const t of ['Sunstone','Newark, DE','$0.00','$99.97','PRIVATE TEST','Personalization handoff','base design only','Tempered glass','30W USB-C wall charger'])assert(review.includes(t),t+' missing');
 await p.locator('#counterReview').getByRole('button',{name:'Enlarge your counter case preview'}).tap();
 await p.locator('#caseZoomDialog canvas').waitFor();await p.locator('#caseZoomDialog').getByRole('button',{name:'Close',exact:true}).tap();
 await p.locator('#counterReview').getByRole('button',{name:'Edit extras'}).tap();
 await p.reload({waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>window.__kp?.state.photoImg&&!__kp.state.libraryLoading&&!__kp.printIssue());
 assert.deepEqual(await p.evaluate(()=>[__kp.state.variant,__kp.state.store,__kp.state.addons.screen,__kp.state.previewMode]),['c4','Newark, DE',true,'phone']);
 assert((await p.locator('#studioStore').innerText()).includes('Newark'),'saved store must be correct before any click');
 assert.equal(await p.locator('#kpPhone').count(),0);
 for(const width of [320,390,820]){await p.setViewportSize({width,height:844});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow '+width);}
 await p.locator('#studioBrowse').click();await p.locator('.kpCard[data-file="zodiac-atlas-leo.png"]').waitFor();
 assert(new URL(p.url()).searchParams.get('device')==='iphone-18-pro-max','phone selection lost on return');
 const card=p.locator('.kpCard[data-file="zodiac-atlas-leo.png"]');await card.scrollIntoViewIfNeeded();
 await p.waitForFunction(()=>{const c=document.querySelector('.kpCard[data-file="zodiac-atlas-leo.png"] canvas');return c?.dataset.renderedPreview&&c.getContext('2d').getImageData(c.width*.5,c.height*.2,1,1).data[3]>240;});
 await p.locator('#wizDevBtn').click();await p.locator('#kpDevDrawer [data-md=""]').click();
 assert(new URL(p.url()).searchParams.get('device')==='iphone-18-pro-max','cancel changed chosen phone');
 assert.deepEqual(errors,[]);assert.deepEqual(posts,[]);
 console.log(engine.name()+': homepage → choose design/phone → mounted clear case → glass + Newark → counter zoom → reload → back passed');
 }finally{await b.close();}
}})().catch(e=>{console.error(e);process.exitCode=1;});
