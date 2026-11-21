/* Rated Case (the second case option) and partial collages. Chromium and WebKit at 390 and 1440, plus 320 for layout.
   Covers: the case choice under the case (shown only for phones with a Rated kit), the case photo and panel mask swap,
   rim chips, prices with and without glass in the footer, Preview, counter review and counter card, collage and words
   on the Rated panel, the fallback toast, undo and purge, kiosk, the staff workspace gate (Rated Case printing waits on
   KP_CONFIG.RATED_PRINT_READY) and partial collages (customers may review, staff downloads wait for every photo).
   Release fixes: case and rim kept in the address (reload, shared link), the name stays on the Rated panel at the
   slider ends, words on the Rated panel, every Rated mask inside its clear mask, the staff status after a mid download
   case change, Galaxy setup links, the case size budget (phones, laptops, kiosk), the rim label, the toast in the phone
   sheet, iPad portrait titles, Phone copy and cache busting.
   usage: node tools/tests/rated_case.cjs [outdir]   (KP_BASE=http://127.0.0.1:PORT/ to use a running server)
   Every photo is a synthetic canvas made inside the browser. */
const {chromium,webkit}=require(process.env.PW_CORE||'../../../playwright/node_modules/playwright-core');
const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..');
const out=path.resolve(process.argv[2]||'/tmp/keepsake-rated-case');fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2','.pdf':'application/pdf'};
let server=null;
function serve(){return new Promise(r=>{server=http.createServer((req,res)=>{let f=path.join(root,decodeURIComponent(new URL(req.url,'http://local').pathname));if(f.endsWith(path.sep))f+='index.html';if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return}fs.readFile(f,(e,d)=>{if(e){res.writeHead(404).end();return}res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(d)})});server.listen(0,'127.0.0.1',()=>r('http://127.0.0.1:'+server.address().port+'/'))})}
const results=[];
function check(name,ok,detail){results.push({name,ok:!!ok,detail});console.log((ok?'PASS ':'FAIL ')+name+(detail===undefined?'':' '+JSON.stringify(detail)));}
const MODEL='iphone-17-pro-max',DESIGN='city-night-new-york.jpg',STORE='West Chester, PA';
const CLEAR='MagSafe Clear',RATED='Rated Case';
const PARTIAL='2 of 6 photo spots are empty. Add photos before printing, or choose a layout with fewer photos.';
const STAFF_RATED='Rated Case printing is waiting on a test print with a real blank. Print this design on a clear case or check with Corey.';
const FALLBACK='The Rated Case is not available for iPhone 13 Pro yet. Showing the clear case.';
const PNG_FN=`(w,h,hue,solid)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');if(solid){x.fillStyle=solid;x.fillRect(0,0,w,h);}else{const g=x.createLinearGradient(0,0,w,h);g.addColorStop(0,'hsl('+hue+',55%,48%)');g.addColorStop(1,'hsl('+((hue+50)%360)+',55%,62%)');x.fillStyle=g;x.fillRect(0,0,w,h);}const u=c.toDataURL('image/png').split(',')[1];c.width=c.height=0;return u;}`;
async function png(page,w,h,hue,solid){return Buffer.from(await page.evaluate(`(${PNG_FN})(${w},${h},${hue},${JSON.stringify(solid||null)})`),'base64');}
const F=(b,n)=>({name:n,mimeType:'image/png',buffer:b});
/* page helpers: geometry comes from the shipped mask rows, pixels from the live stage (half resolution) */
const PAGE_FNS=`window.__rt={
 rows(mask,y){const g=KP_MASK_GEOMETRY[mask];return g.rows.find(r=>r[0]<=y&&y<r[1]);},
 px(x,y){const c=document.getElementById('stageCanvas');const d=c.getContext('2d').getImageData(Math.round(x*c.width/2500),Math.round(y*c.height/3000),1,1).data;return [d[0],d[1],d[2],d[3]];},
 /* points 10 px outside the Rated panel (on the rim) and 24 px inside it, left, right and bottom */
 ring(mask){const g=KP_MASK_GEOMETRY[mask],o=[],i=[];for(const y of [1300,1800,2300]){const r=this.rows(mask,y);o.push([r[2]-10,y],[r[r.length-1]+10,y]);i.push([r[2]+24,y],[r[r.length-1]-24,y]);}
  let yb=0;for(const r of g.rows){for(let k=2;k<r.length;k+=2)if(r[k]<=1250&&1250<r[k+1])yb=Math.max(yb,r[1]);}o.push([1250,yb+10]);i.push([1250,yb-24]);return {outside:o,inside:i};},
 sample(pts){return pts.map(([x,y])=>this.px(x,y));}
};`;
async function hooked(page,errors){
 page.on('pageerror',e=>errors.push('pageerror: '+e.message));
 page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push('console: '+m.text());});
 await page.route('**/assets/nsfw/**',r=>r.fulfill({contentType:'application/javascript',body:r.request().url().includes('nsfwjs')?"window.nsfwjs={load:async()=>({classify:async()=>[{className:'Neutral',probability:1}]})};":''}));
 /* keep what the counter card was made from (the card itself is a PNG) */
 await page.addInitScript(()=>{let real;Object.defineProperty(window,'KPCounterCard',{configurable:true,get(){return real&&{create:o=>{window.__kpCard={code:o.code,rows:o.rows};return real.create(o);}};},set(v){real=v;}});});
 await page.addInitScript(PAGE_FNS);
}
const editorReady=p=>p.waitForFunction(()=>window.KPEditor&&window.__kp,null,{timeout:20000});
/* the case photo, light map and mask for the current case have loaded and the stage has redrawn */
const settled=async p=>{await p.waitForFunction(()=>KPStudioCore.info().previewReady,null,{timeout:20000}).catch(()=>{});await p.waitForTimeout(400);};
async function tool(p,id){await p.locator('[data-tool="'+id+'"]').click();await p.waitForFunction(id=>KPEditor.tool===id,id,{timeout:5000});}
async function done(p){if(await p.locator('#studioSheet').evaluate(e=>e.open)){await p.locator('#studioDone').click();await p.waitForFunction(()=>!document.getElementById('studioSheet').open);}}
/* the tool tray is fixed at the bottom on phones: bring a control to the middle of the screen before tapping it */
const center=l=>l.evaluate(e=>e.scrollIntoView({block:'center'}));
/* js: the 320 px pages are zoomed out by the header's pre-existing overflow, which throws off pointer coordinates */
async function pickCase(p,type,js){const l=p.locator('#studioCase label:has(input[value="'+type+'"])');await center(l);if(js)await l.evaluate(e=>e.click());else await l.click();await p.waitForFunction(t=>__kp.state.caseType===t,type);await settled(p);}
async function pickRim(p,name){const l=p.locator('#studioRim label:has(input[value="'+name+'"])');await center(l);await l.click();await p.waitForFunction(n=>KPStudioCore.info().rim===n,name);await settled(p);}
async function setModel(p,name){await p.evaluate(n=>{const s=document.getElementById('modelSel');s.value=n;s.dispatchEvent(new Event('change'));},name);await p.waitForFunction(n=>__kp.state.model===n,name);await settled(p);}
const lum=c=>c[0]*.299+c[1]*.587+c[2]*.114;
const isRed=c=>c[0]>120&&c[1]<80&&c[2]<80;
async function noOverflow(p){return p.evaluate(()=>document.scrollingElement.scrollWidth<=innerWidth);}
async function shot(p,name){await p.screenshot({path:path.join(out,name+'.png')});}
/* the review flow from any step: Next until the counter review opens, then what it shows */
async function openReview(p){
 await p.evaluate(()=>{window.__kpCard=null;});
 for(let i=0;i<3&&!(await p.evaluate(()=>document.getElementById('counterReview').open));i++){await p.locator('#studioNext').click();await p.waitForTimeout(250);}
 await p.waitForFunction(()=>document.getElementById('counterReview').open);
 await p.waitForFunction(()=>window.__kpCard,null,{timeout:15000}).catch(()=>{});
 return p.evaluate(()=>{const rows=[...document.querySelectorAll('#reviewDetails dt')].map(d=>[d.textContent,d.nextElementSibling.textContent]);
  return {rows,overview:[...document.querySelectorAll('#reviewOverview > *')].map(e=>e.textContent),total:document.querySelector('#reviewOverview .review-total').textContent,
   notes:[...document.querySelectorAll('#reviewOverview .review-note')].map(e=>e.textContent),items:[...document.querySelectorAll('#reviewOverview .review-items li')].map(e=>e.textContent),card:window.__kpCard};});
}
const rowOf=(rows,k)=>(rows.find(r=>r[0]===k)||[])[1];
async function closeReview(p){await p.locator('#reviewEditDesign').click();await p.waitForFunction(()=>!document.getElementById('counterReview').open&&KPEditor.step==='edit',null,{timeout:8000});await settled(p);}

(async()=>{
 const base=process.env.KP_BASE?process.env.KP_BASE.replace(/\/?$/,'/'):await serve();
 /* 0. every Rated panel mask lies inside its clear view mask, so a Rated print never inks where the clear print area
    has none (the S26 and S26 Ultra masks were intersected with theirs). Geometry is the shipped mask-geometry.js. */
 {
  const src=fs.readFileSync(path.join(root,'customizer.html'),'utf8');
  const gt=fs.readFileSync(path.join(root,'assets/mask-geometry.js'),'utf8'),geo=JSON.parse(gt.slice(gt.indexOf('KP_MASK_GEOMETRY=')+17,gt.lastIndexOf(';')));
  const V=JSON.parse(src.match(/var V=(\{[^}]*\})/)[1]),R=Function('return '+src.match(/var RATED=(\{[\s\S]*?\});/)[1])();
  const clearView=m=>V[m]||({'iPhone 18 Pro Max':'view-i17pm.png','iPhone 18 Pro':'view-i17p.png'})[m];
  const raster=g=>{const a=new Uint8Array(g.w*g.h);for(const r of g.rows)for(let y=r[0];y<r[1];y++)for(let i=2;i<r.length;i+=2)a.fill(1,y*g.w+r[i],y*g.w+r[i+1]);return a;};
  const bad=[];
  for(const [m,key] of Object.entries(R)){const rg=geo['view-rated-'+key+'.png'],cg=geo[clearView(m)];if(!rg||!cg){bad.push(m+': mask missing');continue;}
   const a=raster(rg),b=raster(cg);let n=0;for(let i=0;i<a.length;i++)if(a[i]&&!b[i])n++;if(n)bad.push(m+': '+n+' px outside');}
  check('every Rated panel mask lies inside its clear view mask ('+Object.keys(R).length+' phones)',!bad.length&&Object.keys(R).length===20,bad);
 }
 for(const [engine,kind] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await kind.launch();
  for(const width of [390,1440]){
   const tag=engine+' '+width,phone=width<761;
   const ctx=await browser.newContext({viewport:{width,height:phone?844:900},isMobile:phone,hasTouch:phone});
   const page=await ctx.newPage();const errors=[],net=[];await hooked(page,errors);page.on('request',r=>net.push(r.url()));
   /* 1. supported phone: the choice sits under the case, clear first, prices from the config */
   await page.goto(base+'customizer.html?model='+MODEL+'&design='+DESIGN);await editorReady(page);
   await page.waitForFunction(()=>__kp.state.photoImg&&!__kp.state.libraryLoading&&!__kp.printIssue(),null,{timeout:20000});await settled(page);
   const c0=await page.evaluate(()=>{const b=document.getElementById('studioCase'),cv=document.getElementById('stageCanvas').getBoundingClientRect(),r=b.getBoundingClientRect();
    return {hidden:b.hidden,inStage:!!b.closest('#stageStick'),below:r.top>=cv.bottom-1,labels:[...b.querySelectorAll('.studio-case-opt')].map(l=>l.querySelector('strong').textContent+' / '+l.querySelector('small').textContent),checked:b.querySelector('input:checked')?.value,
     rim:document.getElementById('studioRim').hidden,total:document.getElementById('studioTotal').textContent,head:document.getElementById('studioPhone').textContent,
     ld:JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent).offers};});
   check(tag+' case choice under the case for a supported phone',!c0.hidden&&c0.inStage&&c0.below&&c0.checked===CLEAR&&c0.rim,c0);
   check(tag+' case labels and prices',c0.labels.join('|')==='Clear case · $44.99 / Your phone shows through|Rated Case · $49.99 / 20 ft drop protection',c0.labels);
   check(tag+' clear total $44.99 and header',c0.total==='$44.99'&&c0.head==='iPhone 17 Pro Max · Clear case',c0);
   check(tag+' JSON-LD offers 44.99 to 49.99',c0.ld.lowPrice==='44.99'&&c0.ld.highPrice==='49.99',c0.ld);
   check(tag+' changed scripts load with a release version (mask geometry, config, editor, staff print)',['mask-geometry.js?v=','kp-config.js?v=','design-editor.js?v=','design-editor.css?v=','staff-print.js?v=','personal-studio.css?v='].every(f=>net.some(u=>u.includes('/assets/'+f))),net.filter(u=>/mask-geometry|kp-config|design-editor|staff-print|personal-studio/.test(u)));
   check(tag+' Phone tool copy names both cases on a Rated phone',await page.evaluate(()=>document.querySelector('#studio-phone .studio-help').textContent.includes('a Rated Case shows its rim color')));
   if(phone){
    const vis=await page.evaluate(()=>[...document.querySelectorAll('#studioCase .studio-case-opt')].every(l=>{const r=l.getBoundingClientRect(),h=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return scrollY===0&&r.bottom<=innerHeight&&!!h&&l.contains(h);}));
    check(tag+' case choice visible and tappable without scrolling or opening a sheet',vis&&!(await page.evaluate(()=>document.getElementById('studioSheet').open)));
   }
   const clearRim=await page.evaluate(()=>{const r=__rt.rows('view-rated-iph17pmx.png',1800);return __rt.px(r[2]-30,1800);});
   /* 2. Rated Case: photo swap (rim pixels), panel mask (design stays on the panel), header, price */
   const ring=await page.evaluate(()=>__rt.ring('view-rated-iph17pmx.png'));
   await pickCase(page,RATED);
   const r1=await page.evaluate(()=>{const r=__rt.rows('view-rated-iph17pmx.png',1800);return {rim:__rt.px(r[2]-30,1800),total:document.getElementById('studioTotal').textContent,head:document.getElementById('studioPhone').textContent,
     chips:[...document.querySelectorAll('#studioRim input')].map(i=>i.value+(i.checked?'*':'')),rimHidden:document.getElementById('studioRim').hidden};});
   check(tag+' Rated swaps the case photo: dark Smoke Frost rim where the clear case was',lum(r1.rim)<110&&Math.abs(lum(r1.rim)-lum(clearRim))>40&&net.some(u=>u.includes('/assets/cases/rated-iph17pmx-smoke.webp')),{rated:r1.rim,clear:clearRim});
   check(tag+' Rated loads its panel mask and light map',net.some(u=>u.includes('/assets/masks/view-rated-iph17pmx.png'))&&net.some(u=>u.includes('/assets/cases/rated-light.jpg')));
   check(tag+' Rated total $49.99, header and rim chips',r1.total==='$49.99'&&r1.head==='iPhone 17 Pro Max · Rated Case'&&!r1.rimHidden&&r1.chips.join()==='Smoke Frost*,Clear Frost',r1);
   const lab=await page.evaluate(()=>{const l=document.getElementById('studioRimLabel'),r=l.getBoundingClientRect();return {text:l.textContent,shown:r.width>0&&r.height>0&&getComputedStyle(l).visibility!=='hidden',by:document.getElementById('studioRim').getAttribute('aria-labelledby')};});
   check(tag+' rim chips carry a visible Rim color label that names the group',lab.text==='Rim color'&&lab.shown&&lab.by==='studioRimLabel',lab);
   const t=await page.evaluate(()=>[...document.querySelectorAll('#studioCase .studio-case-opt,#studioRim .studio-rim-chip')].map(e=>Math.round(e.getBoundingClientRect().height)));
   check(tag+' case and rim targets are at least 44 px tall',t.every(h=>h>=44),t);
   if(phone){
    const vis=await page.evaluate(()=>[...document.querySelectorAll('#studioRim .studio-rim-chip')].every(l=>{const r=l.getBoundingClientRect(),h=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return r.bottom<=innerHeight&&!!h&&l.contains(h);}));
    check(tag+' rim chips visible above the tool tray without scrolling',vis);
   }
   check(tag+' no horizontal overflow with the Rated Case',await noOverflow(page));
   await shot(page,engine+'-'+width+'-rated-smoke');
   /* 3. rim chips swap the photo */
   await pickRim(page,'Clear Frost');
   const r2=await page.evaluate(()=>{const r=__rt.rows('view-rated-iph17pmx.png',1800);return __rt.px(r[2]-30,1800);});
   check(tag+' Clear Frost chip swaps to the light rim photo',lum(r2)>150&&net.some(u=>u.includes('/assets/cases/rated-iph17pmx-clear.webp')),r2);
   check(tag+' rim choice is not a phone finish (phone finish kept for the clear case)',await page.evaluate(()=>__kp.state.colorName==='Silver'&&KPStudioCore.info().caseLabel==='Rated Case · Clear Frost'));
   await pickRim(page,'Smoke Frost');
   /* 4. prices with glass, Preview rows, counter review, overview and counter card (Rated) */
   await page.locator('#studioNext').click();await page.waitForFunction(()=>KPEditor.step==='preview');
   const pv=await page.evaluate(()=>[...document.querySelectorAll('#studioReviewDetails dt')].map(d=>[d.textContent,d.nextElementSibling.textContent]));
   check(tag+' Preview lists the phone and the Rated Case',rowOf(pv,'Phone')==='iPhone 17 Pro Max'&&rowOf(pv,'Case')==='Rated Case · Smoke Frost',pv);
   await page.locator('#studioNext').click();await page.waitForFunction(()=>KPEditor.step==='setup');
   await page.locator('#addons .adn[data-k="screen"]').click();
   check(tag+' Rated + glass total $69.98',await page.locator('#studioTotal').textContent()==='$69.98');
   const rv=await openReview(page);
   check(tag+' review: Case row, phone row and total (Rated + glass)',rowOf(rv.rows,'Case')==='Rated Case · Smoke Frost'&&rowOf(rv.rows,'Phone')==='iPhone 17 Pro Max'&&rowOf(rv.rows,'Estimated total before tax')==='$69.98'&&rv.total==='$69.98',rv.rows);
   /* the team instruction rides on the card; the customer's overview has no amber note when nothing is wrong (UX-7) */
   check(tag+' review overview: Rated Case · $49.99, the rim, no amber note',rv.items.includes('Rated Case · $49.99')&&rv.overview.includes('iPhone 17 Pro Max · Smoke Frost rim')&&!rv.notes.length,{items:rv.items,notes:rv.notes,overview:rv.overview});
   check(tag+' counter card: Case row, total and the blank instruction',!!rv.card&&rowOf(rv.card.rows,'Case')==='Rated Case · Smoke Frost'&&rowOf(rv.card.rows,'Estimated total before tax')==='$69.98'&&rv.card.code.split('\n').includes('Use a Rated Case blank in Smoke Frost.'),rv.card);
   await shot(page,engine+'-'+width+'-rated-review');
   /* 5. back to the clear case: prices follow */
   await closeReview(page);
   await pickCase(page,CLEAR);
   check(tag+' Clear + glass total $64.98',await page.locator('#studioTotal').textContent()==='$64.98');
   const rc=await openReview(page);
   check(tag+' review back on clear: MagSafe Clear, $64.98, no blank note',rowOf(rc.rows,'Case')===CLEAR&&rc.total==='$64.98'&&rc.items.includes('Case · $44.99')&&!rc.notes.length&&!!rc.card&&!rc.card.code.includes('Rated'),{rows:rc.rows,items:rc.items,notes:rc.notes});
   await closeReview(page);
   /* 6. design clipped to the Rated panel (solid red customer photo) */
   await page.goto(base+'customizer.html?model='+MODEL);await editorReady(page);
   await pickCase(page,RATED);
   const bare=await page.evaluate(r=>({out:__rt.sample(r.outside),in:__rt.sample(r.inside)}),ring);
   await page.locator('#fileInput').setInputFiles(F(await png(page,1600,2400,0,'#ff0000'),'red.png'));
   await page.waitForFunction(()=>__kp.state.photoImg&&!__kp.printIssue(),null,{timeout:20000});await settled(page);
   const red=await page.evaluate(r=>({out:__rt.sample(r.outside),in:__rt.sample(r.inside)}),ring);
   const same=(a,b)=>a.every((c,i)=>Math.abs(c[0]-b[i][0])<=6&&Math.abs(c[1]-b[i][1])<=6&&Math.abs(c[2]-b[i][2])<=6);
   check(tag+' photo is clipped to the Rated panel: the rim around it is untouched',same(red.out,bare.out),{bare:bare.out,red:red.out});
   check(tag+' photo fills the Rated panel',red.in.every(isRed),red.in);
   await pickCase(page,CLEAR);
   const onClear=await page.evaluate(r=>__rt.sample(r.outside.slice(-1)),ring);
   check(tag+' the same spot below the Rated panel is printed on the clear case (mask swapped back)',isRed(onClear[0]),onClear);
   await pickCase(page,RATED);
   /* 7. collage and words on the Rated panel */
   await page.locator('#clearBtn').evaluate(b=>b.click());
   await page.waitForFunction(()=>!__kp.state.photoImg,null,{timeout:5000}).catch(()=>{});
   if(!(await page.evaluate(()=>KPEditor.tool==='layouts')))await tool(page,'layouts');
   await page.waitForSelector('.layChip[data-l="tpl:102"]',{state:'attached',timeout:15000});
   await page.locator('.layChip[data-l="tpl:102"]').click();await page.waitForFunction(()=>__kp.state.layout==='tpl:102');
   const six=[];for(let i=0;i<6;i++)six.push(F(await png(page,1500,2000,i*50),'p'+i+'.png'));
   {const chooser=page.waitForEvent('filechooser',{timeout:5000});await page.locator('#studioLayoutAdd').click();await (await chooser).setFiles(six);}
   await page.waitForFunction(()=>__kp.layout()&&__kp.layout().filled===6,null,{timeout:20000}).catch(()=>{});
   await done(page);await tool(page,'words');await page.locator('#captionList [data-key="name"]').fill('The Johnsons');await done(page);await settled(page);
   const col=await page.evaluate(r=>({out:__rt.sample(r.outside),in:__rt.sample(r.inside),lay:__kp.layout(),ct:__kp.state.caseType}),ring);
   check(tag+' collage and words on the Rated Case stay inside the panel',col.ct===RATED&&col.lay.filled===6&&same(col.out,bare.out)&&!same(col.in,bare.in),{out:col.out,bare:bare.out});
   check(tag+' words fit the Rated panel (name shown on this phone)',col.lay.captions[0].shown===true&&col.lay.captions[0].text==='The Johnsons',col.lay.captions);
   await shot(page,engine+'-'+width+'-rated-words');
   check(tag+' the Rated collage builds a print file (engine) but staff downloads are gated',await page.evaluate(()=>{let built=false,gated=true;__kp.buildPrint(()=>{built=true;});const r=__kp.buildPrint(()=>{gated=false;},{staff:true});return built&&gated&&r===false&&__kp.staffPrintIssue().startsWith('Rated Case printing is waiting');}));
   /* 8. undo never changes the case */
   await done(page);await tool(page,'words');await page.locator('#captionList [data-key="name"]').fill('Avery');await done(page);await page.waitForTimeout(600);
   await page.locator('#studioUndo').click();await page.waitForTimeout(300);
   check(tag+' undo restores the words and keeps the Rated Case',await page.evaluate(()=>__kp.state.captions.name==='The Johnsons'&&__kp.state.caseType==='Rated Case'));
   /* 9. a phone without a Rated kit falls back to clear with one toast; Clear Frost only phones show one chip */
   await setModel(page,'iPhone 16');
   check(tag+' Clear Frost only phone keeps the Rated Case with one chip',await page.evaluate(()=>__kp.state.caseType==='Rated Case'&&[...document.querySelectorAll('#studioRim input')].map(i=>i.value+(i.checked?'*':'')).join()==='Clear Frost*'));
   await setModel(page,'iPhone 13 Pro');
   const fb=await page.evaluate(()=>({ct:__kp.state.caseType,toast:document.getElementById('kpToast')?.textContent,hidden:document.getElementById('studioCase').hidden,total:document.getElementById('studioTotal').textContent}));
   check(tag+' 13 Pro: back to the clear case with the toast, no case choice',fb.ct===CLEAR&&fb.toast===FALLBACK&&fb.hidden&&fb.total==='$44.99',fb);
   await setModel(page,'iPhone 17 Pro Max');
   check(tag+' back on a Rated phone the clear case stays chosen',await page.evaluate(()=>__kp.state.caseType==='MagSafe Clear'&&!document.getElementById('studioCase').hidden));
   /* 10. partial collage: the customer still previews and reviews, with the empty spot message */
   await page.goto(base+'customizer.html?model='+MODEL);await editorReady(page);
   if(!(await page.evaluate(()=>KPEditor.tool==='layouts')))await tool(page,'layouts');
   await page.waitForSelector('.layChip[data-l="tpl:102"]',{state:'attached',timeout:15000});
   await page.locator('.layChip[data-l="tpl:102"]').click();await page.waitForFunction(()=>__kp.state.layout==='tpl:102');
   {const four=six.slice(0,4);const chooser=page.waitForEvent('filechooser',{timeout:5000});await page.locator('#studioLayoutAdd').click();await (await chooser).setFiles(four);}
   await page.waitForFunction(()=>__kp.layout()&&__kp.layout().filled===4,null,{timeout:20000}).catch(()=>{});await done(page);await settled(page);
   check(tag+' partial collage: customer flow is not blocked, staff print is',await page.evaluate(p=>__kp.printIssue()===''&&!document.getElementById('studioNext').disabled&&__kp.staffPrintIssue()===p,PARTIAL));
   await page.locator('#studioNext').click();await page.waitForFunction(()=>KPEditor.step==='preview');
   const pp=await page.evaluate(()=>{const e=document.getElementById('studioPartial'),r=e.getBoundingClientRect(),st=document.getElementById('studioStatus'),sr=st.getBoundingClientRect(),hit=document.elementFromPoint(sr.left+sr.width/2,sr.top+sr.height/2);
    return {hidden:e.hidden,text:e.textContent,visible:r.height>0,next:document.getElementById('studioNext').disabled,status:st.textContent,statusOnScreen:sr.height>0&&sr.bottom<=innerHeight&&!!hit&&st.contains(hit)};});
   check(tag+' Preview says how many photo spots are empty (panel and the bar above the footer)',!pp.hidden&&pp.visible&&pp.text===PARTIAL&&pp.status===PARTIAL&&pp.statusOnScreen&&!pp.next,pp);
   await shot(page,engine+'-'+width+'-partial-preview');
   const rp=await openReview(page);
   check(tag+' counter review and card say the spots are empty',rp.notes.includes(PARTIAL)&&rowOf(rp.rows,'Photo spots')===PARTIAL&&!!rp.card&&rp.card.code.split('\n').includes(PARTIAL),{notes:rp.notes,card:rp.card&&rp.card.code});
   await page.locator('#reviewEditDesign').click();
   /* 11. purge (Start over, next customer) returns to the clear case */
   await page.goto(base+'customizer.html?model='+MODEL+'&design='+DESIGN);await editorReady(page);await settled(page);
   await pickCase(page,RATED);
   check(tag+' purge resets to the clear case',await page.evaluate(()=>{KPStudioCore.purge();return __kp.state.caseType==='MagSafe Clear'&&__kp.state.rimColor===null;}));
   check(tag+' no console errors',errors.length===0,errors);
   await ctx.close();
  }
  /* 12. 320 px: the choice fits, no overflow, targets 44 px, nothing under the tool tray once scrolled to */
  for(const [w,h] of [[320,568],[320,700]]){
   const tag=engine+' '+w+'x'+h;
   const ctx=await browser.newContext({viewport:{width:w,height:h},isMobile:true,hasTouch:true});const page=await ctx.newPage();const errors=[];await hooked(page,errors);
   await page.goto(base+'customizer.html?model='+MODEL+'&design='+DESIGN);await editorReady(page);await settled(page);
   await pickCase(page,RATED,true);
   const l=await page.evaluate(async()=>{const els=[...document.querySelectorAll('#studioCase .studio-case-opt,#studioRim .studio-rim-chip')];const cv=document.getElementById('stageCanvas').getBoundingClientRect();
    /* the header's Design your case button already overflows 320 px on the baseline, so measure what the case choice adds */
    const box=document.getElementById('studioCase'),withCase=document.scrollingElement.scrollWidth;box.style.display='none';const without=document.scrollingElement.scrollWidth;box.style.display='';
    const res={overflow:withCase>without,clipped:els.filter(e=>e.scrollWidth>e.clientWidth+1).length,heights:els.map(e=>Math.round(e.getBoundingClientRect().height)),below:document.getElementById('studioCase').getBoundingClientRect().top>=cv.bottom-1,covered:0,inside:true};
    for(const e of els){e.scrollIntoView({block:'center'});await new Promise(r=>requestAnimationFrame(()=>r()));const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);if(!hit||!e.contains(hit))res.covered++;if(r.left<0||r.right>visualViewport.width+visualViewport.offsetLeft)res.inside=false;}
    return res;});
   check(tag+' case choice fits: no overflow, no clipped text, inside the screen',!l.overflow&&!l.clipped&&l.inside,l);
   check(tag+' case choice targets 44 px, under the case, never covered by the tray',l.heights.every(x=>x>=44)&&l.below&&!l.covered,l);
   if(h===568)await shot(page,engine+'-320-case-choice');
   check(tag+' no console errors',errors.length===0,errors);
   await ctx.close();
  }
  /* 13. kiosk shows the same control; an unsupported phone shows none */
  {
   const ctx=await browser.newContext({viewport:{width:1024,height:768}});const page=await ctx.newPage();const errors=[];await hooked(page,errors);
   await page.goto(base+'customizer.html?kiosk=1&store='+encodeURIComponent(STORE)+'&model='+MODEL+'&design='+DESIGN);await editorReady(page);await settled(page);
   check(engine+' kiosk editor shows the case choice',await page.evaluate(()=>!document.getElementById('studioCase').hidden&&document.body.classList.contains('studio-kiosk')));
   await pickCase(page,RATED);
   check(engine+' kiosk Rated total',await page.locator('#studioTotal').textContent()==='$49.99');
   await page.goto(base+'customizer.html?model=iphone-13-pro&design='+DESIGN);await editorReady(page);await settled(page);
   check(engine+' 13 Pro: no Rated option',await page.evaluate(()=>document.getElementById('studioCase').hidden&&!KPStudioCore.info().ratedAvailable));
   check(engine+' 13 Pro: Phone tool keeps the clear case copy',await page.evaluate(()=>document.querySelector('#studio-phone .studio-help').textContent==='Choose your model and phone finish. Your case stays clear; screen colors are approximate.'));
   check(engine+' kiosk no console errors',errors.length===0,errors);
   await ctx.close();
  }
  /* 14. staff workspace: case cards, Case row, prices, Rated download blocked, clear allowed, partial collage blocked */
  {
   const tag=engine+' staff';
   const ctx=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});const page=await ctx.newPage();const errors=[],snet=[];await hooked(page,errors);page.on('request',r=>snet.push(r.url()));
   await page.goto(base+'customizer.html?staff=1&model='+MODEL+'&design='+DESIGN);
   await page.waitForFunction(()=>window.__kp&&__kp.state.photoImg&&!__kp.state.libraryLoading&&!__kp.printIssue(),null,{timeout:20000});await page.waitForTimeout(700);
   const s0=await page.evaluate(()=>({row:getComputedStyle(document.getElementById('ctRow')).display,cards:[...document.querySelectorAll('#ctRow .ctCard')].map(c=>c.querySelector('strong').textContent+' '+c.querySelector('small').textContent),case:document.getElementById('spCase').textContent,dl:document.getElementById('spDownload').disabled}));
   check(tag+' case cards show for a Rated phone',s0.row==='grid'&&s0.cards[0]==='MagSafe Clear $44.99'&&s0.cards[1]==='Rated Case $49.99 · 20 ft drop protection'&&s0.case===CLEAR&&!s0.dl,s0);
   await page.locator('#ctRated').click();await page.waitForFunction(()=>__kp.state.caseType==='Rated Case');await page.waitForTimeout(900);
   const s1=await page.evaluate(()=>({status:document.getElementById('spStatus').textContent,dl:document.getElementById('spDownload').disabled,case:document.getElementById('spCase').textContent,sub:document.getElementById('spSubtotal').textContent,
    sw:[...document.querySelectorAll('#colorSwatches button')].map(b=>b.title).join(),label:document.getElementById('finishLabel').textContent,bundle:document.getElementById('bundleTotal').textContent,pressed:document.getElementById('ctRated').getAttribute('aria-pressed')}));
   check(tag+' Rated: download blocked with the message',s1.dl&&s1.status===STAFF_RATED,s1);
   check(tag+' Rated: Case row, $49.99, rim swatches, bundle copy',s1.case==='Rated Case · Smoke Frost'&&s1.sub==='$49.99'&&s1.sw==='Smoke Frost,Clear Frost'&&s1.label==='Rim color'&&s1.bundle==='$69.98'&&s1.pressed==='true',s1);
   await page.locator('#spGlass').check();await page.waitForTimeout(700);
   check(tag+' Rated + glass subtotal $69.98',await page.locator('#spSubtotal').textContent()==='$69.98');
   await page.locator('#colorSwatches button[title="Clear Frost"]').click();await page.waitForTimeout(700);
   check(tag+' rim swatch updates the Case row',await page.locator('#spCase').textContent()==='Rated Case · Clear Frost');
   check(tag+' staff export link is gated too',await page.evaluate(()=>{let called=false;const r=__kp.buildPrint(()=>{called=true;},{staff:true});return r===false&&!called;}));
   await shot(page,engine+'-staff-rated-blocked');
   await page.locator('#ctClear').click();await page.waitForFunction(()=>__kp.state.caseType==='MagSafe Clear');await page.waitForTimeout(900);
   const s2=await page.evaluate(()=>({status:document.getElementById('spStatus').textContent,dl:document.getElementById('spDownload').disabled,case:document.getElementById('spCase').textContent,sub:document.getElementById('spSubtotal').textContent,label:document.getElementById('finishLabel').textContent,finish:__kp.state.colorName}));
   check(tag+' Clear: download allowed, $64.98 with glass, phone finish back',!s2.dl&&s2.status.startsWith('Ready to download')&&s2.case===CLEAR&&s2.sub==='$64.98'&&s2.label==='Device color'&&s2.finish==='Silver',s2);
   const dl=page.waitForEvent('download',{timeout:20000}).catch(()=>null);await page.locator('#spDownload').click();
   const file=await dl;check(tag+' Clear print PNG downloads',!!file&&/\.png$/.test(file.suggestedFilename()),file&&file.suggestedFilename());
   check(tag+' no designs.json request for a design without credits',!snet.some(u=>u.includes('/assets/designs/designs.json')),snet.filter(u=>u.includes('designs.json')));
   /* a Rated Case tapped while the PNG is being prepared: the status says why Download is off (F5) */
   await page.waitForFunction(()=>!document.getElementById('spDownload').disabled,null,{timeout:10000}).catch(()=>{});
   await page.evaluate(()=>{const enc=KPPrintPng.encode;window.__kpEnc=enc;KPPrintPng.encode=c=>new Promise(r=>setTimeout(()=>r(enc(c)),900));});
   await page.locator('#spDownload').click();await page.waitForTimeout(150);await page.locator('#ctRated').click();
   await page.waitForFunction(()=>__kp.state.caseType==='Rated Case');await page.waitForTimeout(2000);
   const mid=await page.evaluate(()=>({status:document.getElementById('spStatus').textContent,dl:document.getElementById('spDownload').disabled}));
   check(tag+' Rated Case tapped mid download: status gives the Rated reason, Download off',mid.dl&&mid.status===STAFF_RATED,mid);
   await page.evaluate(()=>{KPPrintPng.encode=window.__kpEnc;});
   await page.locator('#ctClear').click();await page.waitForFunction(()=>__kp.state.caseType==='MagSafe Clear');await page.waitForTimeout(700);
   /* next customer: the case resets (the link's navigation is held back so the page can be read) */
   await page.locator('#ctRated').click();await page.waitForFunction(()=>__kp.state.caseType==='Rated Case');
   await page.evaluate(()=>document.querySelector('.staff-top a').addEventListener('click',e=>e.preventDefault()));
   await page.locator('.staff-top a').click();await page.waitForTimeout(500);
   check(tag+' Next customer resets to the clear case',await page.evaluate(()=>__kp.state.caseType==='MagSafe Clear'));
   /* partial collage in the classic rail */
   await page.goto(base+'customizer.html?staff=1&model='+MODEL);await page.waitForFunction(()=>window.__kp);
   await page.waitForSelector('.layChip[data-l="tpl:102"]',{timeout:15000});
   await page.locator('#fileInput').setInputFiles(F(await png(page,1500,2000,10),'s0.png'));
   await page.waitForFunction(()=>__kp.state.photoImg,null,{timeout:15000});
   await page.locator('.layChip[data-l="tpl:102"]').click();await page.waitForFunction(()=>__kp.state.layout==='tpl:102');
   await page.waitForFunction(()=>__kp.layout().filled===1&&!__kp.printIssue(),null,{timeout:15000}).catch(()=>{});await page.waitForTimeout(800);
   const p1=await page.evaluate(()=>({status:document.getElementById('spStatus').textContent,dl:document.getElementById('spDownload').disabled,filled:__kp.layout().filled}));
   check(tag+' partial collage: staff download blocked with the message',p1.dl&&p1.status==='5 of 6 photo spots are empty. Add photos before printing, or choose a layout with fewer photos.',p1);
   const five=[];for(let i=1;i<6;i++)five.push(F(await png(page,1500,2000,i*50),'s'+i+'.png'));
   await page.locator('#fileInput').setInputFiles(five);
   await page.waitForFunction(()=>__kp.layout().filled===6&&!__kp.staffPrintIssue(),null,{timeout:20000}).catch(()=>{});await page.waitForTimeout(800);
   const p2=await page.evaluate(()=>({status:document.getElementById('spStatus').textContent,dl:document.getElementById('spDownload').disabled,filled:__kp.layout().filled}));
   check(tag+' every spot filled: staff download allowed',!p2.dl&&p2.filled===6&&p2.status.startsWith('Ready to download'),p2);
   /* unsupported phone: no cards */
   await page.goto(base+'customizer.html?staff=1&model=iphone-13-pro&design='+DESIGN);
   await page.waitForFunction(()=>window.__kp&&__kp.state.photoImg&&!__kp.state.libraryLoading,null,{timeout:20000});await page.waitForTimeout(500);
   check(tag+' 13 Pro: no case cards',await page.evaluate(()=>getComputedStyle(document.getElementById('ctRow')).display==='none'));
   check(tag+' no console errors',errors.length===0,errors);
   await ctx.close();
  }
  /* 15. the case and rim ride in the address: a reload, a restored tab or a shared link keeps them (F1, UX-5, R2) */
  {
   const tag=engine+' url';
   const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await ctx.newPage();const errors=[];await hooked(page,errors);
   const libReady=async()=>{await editorReady(page);await page.waitForFunction(()=>__kp.state.photoImg&&!__kp.state.libraryLoading&&!__kp.printIssue(),null,{timeout:20000});await settled(page);};
   await page.goto(base+'customizer.html?model='+MODEL+'&design='+DESIGN+'&glass=1');await libReady();
   await pickCase(page,RATED);await pickRim(page,'Clear Frost');
   const q1=new URL(await page.evaluate(()=>location.href)).searchParams;
   check(tag+' Rated Case and rim are written to the address',q1.get('case')==='rated'&&q1.get('rim')==='Clear Frost'&&q1.get('glass')==='1',q1.toString());
   await page.reload();await libReady();
   const a=await page.evaluate(()=>({ct:__kp.state.caseType,rim:KPStudioCore.info().rim,total:document.getElementById('studioTotal').textContent,checked:document.querySelector('#studioCase input:checked')?.value}));
   check(tag+' reload keeps the Rated Case, its rim and the price ($69.98 with glass)',a.ct===RATED&&a.rim==='Clear Frost'&&a.total==='$69.98'&&a.checked===RATED,a);
   await pickCase(page,CLEAR);
   const q2=new URL(await page.evaluate(()=>location.href)).searchParams;
   check(tag+' the clear case drops case and rim from the address',!q2.has('case')&&!q2.has('rim'),q2.toString());
   await page.goto(base+'customizer.html?model=iphone-13-pro&design='+DESIGN+'&case=rated&rim=Smoke+Frost');await libReady();
   const b=await page.evaluate(()=>({ct:__kp.state.caseType,toast:document.getElementById('kpToast')?.textContent,url:location.search}));
   check(tag+' a Rated link for a phone without it opens the clear case with the toast',b.ct===CLEAR&&b.toast===FALLBACK&&!/[?&]case=/.test(b.url),b);
   await page.goto(base+'customizer.html?model=iphone-16&design='+DESIGN+'&case=rated&rim=Smoke+Frost');await libReady();
   const c=await page.evaluate(()=>({ct:__kp.state.caseType,rim:KPStudioCore.info().rim,url:location.search,total:document.getElementById('studioTotal').textContent}));
   check(tag+' a rim this phone does not come in falls back to its own rim',c.ct===RATED&&c.rim==='Clear Frost'&&/[?&]rim=Clear(\+|%20)Frost/.test(c.url)&&c.total==='$49.99',c);
   /* the toast inside the Phone sheet never covers the brand and model selects (UX-8) */
   await tool(page,'phone');await page.locator('#modelSel').selectOption('iPhone 13 Pro');await page.waitForFunction(()=>__kp.state.caseType==='MagSafe Clear');await page.waitForTimeout(300);
   const ts=await page.evaluate(()=>{const t=document.getElementById('kpToast'),r=t.getBoundingClientRect(),hit=s=>{const b=document.getElementById(s).getBoundingClientRect();return !(r.right<=b.left||r.left>=b.right||r.bottom<=b.top||r.top>=b.bottom);};
    return {text:t.textContent,host:t.parentElement.id,opacity:t.style.opacity,top:Math.round(r.top),bottom:Math.round(r.bottom),onScreen:r.top>=0&&r.bottom<=innerHeight,brand:hit('brandSel'),model:hit('modelSel')};});
   check(tag+' fallback toast in the Phone sheet is on screen and clear of the brand and model selects',ts.text===FALLBACK&&ts.host==='studioSheet'&&ts.opacity==='1'&&ts.onScreen&&!ts.brand&&!ts.model,ts);
   await shot(page,engine+'-390-toast-phone-sheet');
   await done(page);
   check(tag+' no console errors',errors.length===0,errors);
   await ctx.close();
  }
  /* 16. the name stays whole on the Rated panel at both ends of the Text position slider (F2); 17. a short default word
     prints on the Rated panel where a longer one would (F3); 18. a Galaxy setup link fills the Samsung list (F6) */
  {
   const tag=engine+' rated';
   const ctx=await browser.newContext({viewport:{width:1440,height:900}});const page=await ctx.newPage();const errors=[];await hooked(page,errors);
   for(const m of ['iPhone 17 Pro Max','iPhone 17','iPhone Air','iPhone 15 Pro Max','iPhone 17 Pro','iPhone 13']){
    await page.goto(base+'customizer.html?model='+m.toLowerCase().replace(/ /g,'-')+'&case=rated');await editorReady(page);await settled(page);
    const ink=await page.evaluate(async()=>{const s=__kp.state,out={};s.text='Madison';s.textSize=220;s.textFont=0;
     for(const pos of [0,50,100]){s.textPos=pos;__kp.render();let n=null;
      for(let i=0;i<40&&n===null;i++){__kp.buildPrint(c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let k=0;for(let q=3;q<d.length;q+=4)if(d[q]>8)k++;n=k;});if(n===null)await new Promise(r=>setTimeout(r,150));}
      out[pos]=n;}
     s.text='';s.textPos=62;__kp.render();return {ct:s.caseType,ink:out};});
    check(tag+' '+m+': the whole name prints at both ends of the slider',ink.ct===RATED&&ink.ink[50]>0&&ink.ink[0]>=ink.ink[50]*0.97&&ink.ink[100]>=ink.ink[50]*0.97,ink);
   }
   await page.goto(base+'customizer.html?model=iphone-15-pro-max&case=rated');await editorReady(page);await settled(page);
   if(!(await page.evaluate(()=>KPEditor.tool==='layouts')))await tool(page,'layouts');
   await page.waitForSelector('.layChip[data-l="tpl:37"]',{state:'attached',timeout:15000});
   await page.locator('.layChip[data-l="tpl:37"]').click();await page.waitForFunction(()=>__kp.state.layout==='tpl:37');
   const three=[];for(let i=0;i<3;i++)three.push(F(await png(page,1500,2000,i*70),'w'+i+'.png'));
   {const chooser=page.waitForEvent('filechooser',{timeout:5000});await page.locator('#studioLayoutAdd').click();await (await chooser).setFiles(three);}
   await page.waitForFunction(()=>__kp.layout()&&__kp.layout().filled===3&&!__kp.printIssue(),null,{timeout:20000}).catch(()=>{});await settled(page);
   const wd=await page.evaluate(()=>({ct:__kp.state.caseType,caps:__kp.layout().captions.map(c=>[c.key,c.text,c.shown])}));
   check(tag+' 15 Pro Max Rated: Three Words prints its first word',wd.ct===RATED&&wd.caps[0][1]==='Life'&&wd.caps[0][2]===true,wd);
   await page.goto(base+'customizer.html?setup='+encodeURIComponent(JSON.stringify({m:'Samsung Galaxy S26',ct:RATED})));await editorReady(page);
   await page.waitForFunction(()=>__kp.state.model==='Samsung Galaxy S26',null,{timeout:8000}).catch(()=>{});await page.waitForTimeout(600);
   const su=await page.evaluate(()=>({model:__kp.state.model,brand:__kp.state.brand,ct:__kp.state.caseType,bs:document.getElementById('brandSel').value,ms:document.getElementById('modelSel').value}));
   check(tag+' Galaxy setup link: Samsung brand and model selected, Rated Case',su.model==='Samsung Galaxy S26'&&su.brand==='Samsung'&&su.bs==='Samsung'&&su.ms==='Samsung Galaxy S26'&&su.ct===RATED,su);
   check(tag+' no console errors',errors.length===0,errors);
   await ctx.close();
  }
  /* 19. case size budget: with the page at the top, nothing under the case sits under the tool tray (phones) or the
     footer (laptops, kiosk), clear and Rated, library design and photo path; the kiosk keeps its baseline case size;
     on a short phone new rim chips scroll into view; credits clear the tray; iPad portrait titles (UX-1 to UX-4, UX-9, R3) */
  const stageFits=`(()=>{const t=document.querySelector('.studio-tools'),f=document.getElementById('studioFooter');const lim=innerWidth<761&&!t.hidden?t.getBoundingClientRect().top:f.getBoundingClientRect().top;
   const bad=[];for(const el of document.getElementById('stageStick').children){const r=el.getBoundingClientRect();if(r.height>0&&r.bottom>lim+0.5)bad.push((el.id||el.className)+' '+Math.round(r.bottom)+'>'+Math.round(lim));}
   return {scroll:Math.round(scrollY),bad,canvas:Math.round(document.getElementById('stageCanvas').getBoundingClientRect().height)};})()`;
  const addPhoto=async page=>{await page.locator('#fileInput').setInputFiles(F(await png(page,3000,4000,200),'me.png'));await page.waitForFunction(()=>__kp.state.photoImg&&!__kp.printIssue(),null,{timeout:20000});await done(page);await settled(page);};
  for(const [w,h,kind,kiosk] of [[375,812,'photo'],[390,844,'photo'],[393,852,'photo'],[414,896,'photo'],[390,844,'design'],[1024,768,'photo'],[1024,768,'design'],[1440,900,'photo'],[1440,900,'design'],[1024,768,'design',true]]){
   const phone=w<761,tag=engine+' '+w+'x'+h+' '+kind+(kiosk?' kiosk':'');
   const ctx=await browser.newContext({viewport:{width:w,height:h},isMobile:phone,hasTouch:phone||!!kiosk});const page=await ctx.newPage();const errors=[];await hooked(page,errors);
   await page.goto(base+'customizer.html?'+(kiosk?'kiosk=1&store='+encodeURIComponent(STORE)+'&':'')+'model='+MODEL+(kind==='design'?'&design=boho-floral-01.jpg':''));await editorReady(page);await settled(page);
   if(kind==='photo')await addPhoto(page);
   for(const ct of [CLEAR,RATED]){
    if(ct===RATED)await pickCase(page,RATED,true);
    await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(400);
    const r=await page.evaluate(stageFits);
    check(tag+' '+(ct===RATED?'Rated':'clear')+': everything under the case clears the '+(phone?'tool tray':'footer')+' before scrolling',r.scroll===0&&!r.bad.length,r);
    if(kiosk&&ct===CLEAR)check(tag+' kiosk keeps the baseline case size (no site header to leave room for)',r.canvas>=317,r);
   }
   if(w===768||w===1024&&!kiosk&&kind==='design')await shot(page,engine+'-'+w+'-rated-'+kind);
   check(tag+' no console errors',errors.length===0,errors);
   await ctx.close();
  }
  {
   const tag=engine+' 375x667 photo';
   const ctx=await browser.newContext({viewport:{width:375,height:667},isMobile:true,hasTouch:true});const page=await ctx.newPage();const errors=[];await hooked(page,errors);
   await page.goto(base+'customizer.html?model='+MODEL);await editorReady(page);await settled(page);await addPhoto(page);
   await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(300);
   const opts=await page.evaluate(()=>[...document.querySelectorAll('#studioCase .studio-case-opt')].every(l=>{const r=l.getBoundingClientRect(),h=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return !!h&&l.contains(h);}));
   check(tag+' case choice is visible and tappable before scrolling',opts);
   await page.locator('#studioCase label:has(input[value="Rated Case"])').click();await page.waitForFunction(()=>__kp.state.caseType==='Rated Case');await page.waitForTimeout(1200);
   const rim=await page.evaluate(()=>{const lim=document.querySelector('.studio-tools').getBoundingClientRect().top;return {scroll:Math.round(scrollY),ok:[...document.querySelectorAll('#studioRim .studio-rim-chip')].every(l=>{const r=l.getBoundingClientRect(),h=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return r.bottom<=lim&&!!h&&l.contains(h);})};});
   check(tag+' Rated: the new rim chips scroll into view above the tool tray',rim.ok,rim);
   await shot(page,engine+'-375x667-rated-rims');
   check(tag+' no console errors',errors.length===0,errors);
   await ctx.close();
  }
  for(const [w,h] of [[390,844],[375,812],[360,780]])for(const m of [MODEL,'iphone-13-pro']){
   const tag=engine+' '+w+'x'+h+' '+m;
   const ctx=await browser.newContext({viewport:{width:w,height:h},isMobile:true,hasTouch:true});const page=await ctx.newPage();const errors=[];await hooked(page,errors);
   await page.goto(base+'customizer.html?model='+m+'&design=kp-space-horsehead.jpg');await editorReady(page);
   await page.waitForFunction(()=>__kp.state.photoImg&&!__kp.state.libraryLoading&&!document.getElementById('cityPhotoCredit').hidden,null,{timeout:20000});await settled(page);
   await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(300);
   const u=await page.evaluate(()=>{const el=document.getElementById('cityPhotoCredit'),r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return {ok:!!hit&&(hit===el||el.contains(hit)),y:Math.round(scrollY),top:Math.round(r.top),bottom:Math.round(r.bottom),href:el.getAttribute('href')};});
   check(tag+' space photo credit link clears the tool tray before scrolling',u.ok&&u.y===0&&u.href==='new-print-credits.html#kp-space-horsehead',u);
   await ctx.close();
  }
  {
   const tag=engine+' 768x1024';
   const ctx=await browser.newContext({viewport:{width:768,height:1024},hasTouch:true});const page=await ctx.newPage();const errors=[];await hooked(page,errors);
   await page.goto(base+'customizer.html?model='+MODEL+'&design=boho-floral-01.jpg');await editorReady(page);await settled(page);
   const tt=await page.evaluate(()=>[...document.querySelectorAll('#studioCase .studio-case-opt strong')].map(s=>{const name=s.firstElementChild,price=s.querySelector('.studio-case-price'),sep=s.querySelector('.studio-case-sep');
    const nr=name.getClientRects(),pr=price.getClientRects();return {text:s.innerText.replace(/\n/g,' / '),nameLines:nr.length,priceLines:pr.length,sameLine:pr.length===1&&nr.length===1&&Math.abs(pr[0].top-nr[0].top)<2,sepShown:getComputedStyle(sep).display!=='none'};}));
   check(tag+' case titles keep the name whole and the price whole (own line on a narrow stage)',tt.length===2&&tt.every(t=>t.nameLines===1&&t.priceLines===1&&(t.sameLine||!t.sepShown)),tt);
   await ctx.close();
  }
  await browser.close();
 }
 const failed=results.filter(r=>!r.ok);
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,1));
 console.log(results.length-failed.length+'/'+results.length+' rated case checks passed');
 if(server)server.close();
 if(failed.length)process.exit(1);
})().catch(e=>{console.error(e);if(server)server.close();process.exit(1);});
