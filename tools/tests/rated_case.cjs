/* Rated Case (the second case option) and partial collages. Chromium and WebKit at 390 and 1440, plus 320 for layout.
   Covers: the case choice under the case (shown only for phones with a Rated kit), the case photo and panel mask swap,
   rim chips, prices with and without glass in the footer, Preview, counter review and counter card, collage and words
   on the Rated panel, the fallback toast, undo and purge, kiosk, the staff workspace gate (Rated Case printing waits on
   KP_CONFIG.RATED_PRINT_READY) and partial collages (customers may review, staff downloads wait for every photo).
   Release fixes: case and rim kept in the address (reload, shared link), the name stays on the Rated panel at the
   slider ends, words on the Rated panel, every Rated mask inside its clear mask, the staff status after a mid download
   case change, Galaxy setup links, the case size budget (phones, laptops, kiosk), the rim label, the toast in the phone
   sheet, iPad portrait titles, Phone copy and cache busting. Rated only phones (section 20). Review fixes (section 21): the
   clear case comes back with its own message, the message clears the sheet's title, a failed mask file is tried again, the
   loaded mask gates the print, setup and coming soon links, the address after Done, the code sentence, hidden photo spots.
   Customer wording is "Frost case" (the case type in the code stays Rated Case): a new customer session starts on frost
   (explicit case=clear, staff=1 without a case and style= stay clear), the case card and header read the rim, the address
   always carries case=rated or case=clear, and pick codes carry the finish (-P#) and the rim (-FS or -FC).
   usage: node tools/tests/rated_case.cjs [outdir]   (or KP_OUT; KP_BASE=http://127.0.0.1:PORT/ to use a running server;
   KP_PLAYWRIGHT or PW_CORE for playwright-core; KP_ENGINES=chromium,webkit)
   Every photo is a synthetic canvas made inside the browser. */
const {chromium,webkit}=require(process.env.PW_CORE||process.env.KP_PLAYWRIGHT||'../../../playwright/node_modules/playwright-core');
const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..');
const out=path.resolve(process.argv[2]||process.env.KP_OUT||'/tmp/keepsake-rated-case');fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2','.pdf':'application/pdf'};
let server=null;
function serve(){return new Promise(r=>{server=http.createServer((req,res)=>{let f=path.join(root,decodeURIComponent(new URL(req.url,'http://local').pathname));if(f.endsWith(path.sep))f+='index.html';if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return}fs.readFile(f,(e,d)=>{if(e){res.writeHead(404).end();return}res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(d)})});server.listen(0,'127.0.0.1',()=>r('http://127.0.0.1:'+server.address().port+'/'))})}
const DROP='20 ft drop protection \u00b7 Confirm availability in store';
const results=[];
function check(name,ok,detail){results.push({name,ok:!!ok,detail});console.log((ok?'PASS ':'FAIL ')+name+(detail===undefined?'':' '+JSON.stringify(detail)));}
const MODEL='iphone-17-pro-max',DESIGN='city-night-new-york.jpg',STORE='West Chester, PA';
const CLEAR='MagSafe Clear',RATED='Rated Case';
const PARTIAL='2 of 6 photo spots are empty. Add photos before printing, or choose a layout with fewer photos.';
const STAFF_RATED='Rated Case printing is waiting on a test print with a real blank. Print this design on a clear case or check with Corey.';
const FALLBACK='A frost case is not available for iPhone 13 mini yet. Showing the clear case.';
const FORCED='This phone comes in a frost case. Your case is now $49.99.';
/* the pick code line of the counter card, e.g. "Pick code · 17PM-SCN-131-G-S1-P1-FS" */
const CODE=new RegExp('^Pick code \u00b7 [A-Z0-9]+-[A-Z]+-[0-9]{3}(?:-C[0-9])?(-G)?-S([0-9])-P([0-9])(-F[SC])?$');
const codeOf=card=>{const m=CODE.exec(((card&&card.code)||'').split('\n')[0]);return m?{glass:!!m[1],store:+m[2],finish:+m[3],rim:m[4]||''}:null;};
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
/* since #69 the case cards live in the Phone tool: beside the stage on desktop, in a closed sheet on phones. When they are
   not on screen, click the same label from the page (its change event reaches the editor exactly as a tap does) */
async function tapLabel(l,js){if(!js&&await l.isVisible()){await center(l);await l.click();}else await l.evaluate(e=>e.click());}
async function pickCase(p,type,js){const l=p.locator('#studioCase label:has(input[value="'+type+'"])');await tapLabel(l,js);await p.waitForFunction(t=>__kp.state.caseType===t,type);await settled(p);}
async function pickRim(p,name){const l=p.locator('#studioRim label:has(input[value="'+name+'"])');await tapLabel(l);await p.waitForFunction(n=>KPStudioCore.info().rim===n,name);await settled(p);}
/* most layouts sit behind More layouts */
async function pickLayout(p,id){const l=p.locator('.layChip[data-l="'+id+'"]');await l.evaluate(e=>{const d=e.closest('details');if(d)d.open=true;});await tapLabel(l);await p.waitForFunction(id=>__kp.state.layout===id,id);}
async function setModel(p,name){await p.evaluate(n=>{const b=document.getElementById('brandSel'),m=/^(Samsung|Google|Motorola) /.exec(n),want=m?m[1]:'Apple';if(b.value!==want){b.value=want;b.dispatchEvent(new Event('change'));}const s=document.getElementById('modelSel');s.value=n;s.dispatchEvent(new Event('change'));},name);await p.waitForFunction(n=>__kp.state.model===n,name);await settled(p);}
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
  check('every Rated panel mask lies inside its clear view mask ('+Object.keys(R).length+' phones)',!bad.length&&Object.keys(R).length===26,bad);
  /* the Rated only masks no clear phone uses are in their own file, and neither file repeats the other */
  const rt=fs.readFileSync(path.join(root,'assets/mask-geometry-rated.js'),'utf8'),late=JSON.parse(rt.slice(rt.indexOf('||{},')+5,rt.lastIndexOf(');')));
  const O=Function('return '+src.match(/var RATED_ONLY=(\{[\s\S]*?\});/)[1])();
  check('mask geometry is split: clear phones never need the Rated only file',Object.keys(late).length===18&&!Object.keys(late).some(m=>geo[m])&&Object.values(R).every(k=>geo['view-rated-'+k+'.png'])&&Object.values(V).every(m=>geo[m]),Object.keys(late));
  check('29 Rated only phones are listed, none of them has a clear kit',Object.keys(O).length===29&&!Object.keys(O).some(m=>V[m]||R[m]),Object.keys(O));
 }
 for(const [engine,kind] of [['chromium',chromium],['webkit',webkit]].filter(([n])=>!process.env.KP_ENGINES||process.env.KP_ENGINES.split(',').includes(n))){
  const browser=await kind.launch();
  for(const width of [390,1440]){
   const tag=engine+' '+width,phone=width<761;
   const ctx=await browser.newContext({serviceWorkers:'block',viewport:{width,height:phone?844:900},isMobile:phone,hasTouch:phone});
   const page=await ctx.newPage();const errors=[],net=[];await hooked(page,errors);page.on('request',r=>net.push(r.url()));
   const loaded=async()=>{await editorReady(page);await page.waitForFunction(()=>__kp.state.photoImg&&!__kp.state.libraryLoading&&!__kp.printIssue(),null,{timeout:20000});await settled(page);};
   /* 1a. which case a session starts on: frost for a new customer; clear for an explicit clear link and for an old style= link */
   const start=()=>page.evaluate(()=>{const b=document.getElementById('studioCase'),i=KPStudioCore.info();
    return {ct:i.caseType,rim:i.rim,total:document.getElementById('studioTotal').textContent,price:document.getElementById('studioProductPrice').textContent,head:document.getElementById('studioPhone').textContent,checked:b.querySelector('input[name=studioCaseType]:checked')?.value,
     labels:[...b.querySelectorAll('.studio-case-opt')].map(l=>l.querySelector('strong').textContent+' / '+l.querySelector('small').textContent),url:location.search};});
   for(const q of ['','&case=rated']){
    await page.goto(base+'customizer.html?model='+MODEL+'&design='+DESIGN+q);await loaded();
    const f0=await start(),u=new URLSearchParams(f0.url);
    check(tag+' '+(q||'a new customer session')+' starts on frost: rim, $49.99, header, checked card',f0.ct===RATED&&f0.rim==='Smoke Frost'&&f0.total==='$49.99'&&f0.price==='$49.99'&&f0.head==='iPhone 17 Pro Max · Smoke Frost'&&f0.checked===RATED,f0);
    check(tag+' '+(q||'a new customer session')+': the case card reads the rim name and price',f0.labels.join('|')==='Clear case · $44.99 / Your phone shows through|Smoke Frost · $49.99 / '+DROP,f0.labels);
    check(tag+' '+(q||'a new customer session')+': the address says case=rated and its rim',u.get('case')==='rated'&&u.get('rim')==='Smoke Frost',f0.url);
   }
   await page.goto(base+'customizer.html?model='+MODEL+'&design='+DESIGN+'&style=hybrid');await loaded();
   const sy=await start(),syq=new URLSearchParams(sy.url);
   check(tag+' an old style= link stays clear and is rewritten as case=clear',sy.ct===CLEAR&&sy.total==='$44.99'&&syq.get('case')==='clear'&&!syq.has('rim')&&!syq.has('style'),sy);
   /* 1. supported phone: the choice sits under the case, clear first, prices from the config */
   await page.goto(base+'customizer.html?model='+MODEL+'&design='+DESIGN+'&case=clear');await loaded();
   net.length=0;await page.reload();await loaded();
   const c0=await page.evaluate(()=>{const b=document.getElementById('studioCase');
    return {hidden:b.hidden,inTool:!!b.closest('#studio-phone'),labels:[...b.querySelectorAll('.studio-case-opt')].map(l=>l.querySelector('strong').textContent+' / '+l.querySelector('small').textContent),checked:b.querySelector('input:checked')?.value,
     rim:document.getElementById('studioRim').hidden,total:document.getElementById('studioTotal').textContent,head:document.getElementById('studioPhone').textContent,
     ld:JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent).offers};});
   check(tag+' case choice in the Phone tool for a supported phone',!c0.hidden&&c0.inTool&&c0.checked===CLEAR&&c0.rim,c0);
   check(tag+' case labels and prices',c0.labels.join('|')==='Clear case · $44.99 / Your phone shows through|Frost case · $49.99 / '+DROP,c0.labels);
   check(tag+' clear total $44.99 and header',c0.total==='$44.99'&&c0.head==='iPhone 17 Pro Max · Clear case',c0);
   {const u=new URLSearchParams(await page.evaluate(()=>location.search));check(tag+' case=clear link: the address keeps case=clear and has no rim',u.get('case')==='clear'&&!u.has('rim'),u.toString());}
   check(tag+' case=clear link never loads a Rated photo for the stage',!net.some(u=>/\/assets\/cases\/rated-iph17pmx-/.test(u)),net.filter(u=>/rated-iph/.test(u)));
   check(tag+' JSON-LD offers 44.99 to 49.99',c0.ld.lowPrice==='44.99'&&c0.ld.highPrice==='49.99',c0.ld);
   check(tag+' changed scripts load with a release version (mask geometry, config, editor, staff print)',['mask-geometry.js?v=','kp-config.js?v=','design-editor.js?v=','design-editor.css?v=','staff-print.js?v=','personal-studio.css?v='].every(f=>net.some(u=>u.includes('/assets/'+f))),net.filter(u=>/mask-geometry|kp-config|design-editor|staff-print|personal-studio/.test(u)));
   check(tag+' Phone tool copy names both cases on a Rated phone',await page.evaluate(()=>document.querySelector('#studio-phone .studio-help').textContent==='Choose your phone model, finish and case. The preview updates to show your choices.'));
   if(phone){
    await tool(page,'phone');
    const vis=await page.evaluate(()=>[...document.querySelectorAll('#studioCase .studio-case-opt')].every(l=>{const r=l.getBoundingClientRect(),h=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return r.bottom<=innerHeight&&!!h&&l.contains(h);}));
    check(tag+' case choice visible and tappable in the Phone sheet without scrolling',vis&&await page.evaluate(()=>document.getElementById('studioSheet').open));
    await done(page);
   }
   const clearRim=await page.evaluate(()=>{const r=__rt.rows('view-rated-iph17pmx.png',1800);return __rt.px(r[2]-30,1800);});
   /* 2. Rated Case: photo swap (rim pixels), panel mask (design stays on the panel), header, price */
   const ring=await page.evaluate(()=>__rt.ring('view-rated-iph17pmx.png'));
   await pickCase(page,RATED);
   const r1=await page.evaluate(()=>{const r=__rt.rows('view-rated-iph17pmx.png',1800);return {rim:__rt.px(r[2]-30,1800),total:document.getElementById('studioTotal').textContent,head:document.getElementById('studioPhone').textContent,
     chips:[...document.querySelectorAll('#studioRim input')].map(i=>i.value+(i.checked?'*':'')),rimHidden:document.getElementById('studioRim').hidden};});
   check(tag+' Rated swaps the case photo: dark Smoke Frost rim where the clear case was',lum(r1.rim)<110&&Math.abs(lum(r1.rim)-lum(clearRim))>40&&net.some(u=>u.includes('/assets/cases/rated-iph17pmx-smoke.webp')),{rated:r1.rim,clear:clearRim});
   check(tag+' Rated loads its panel mask and light map',net.some(u=>u.includes('/assets/masks/view-rated-iph17pmx.png'))&&net.some(u=>u.includes('/assets/cases/rated-light.jpg')));
   check(tag+' Rated total $49.99, header and rim chips',r1.total==='$49.99'&&r1.head==='iPhone 17 Pro Max · Smoke Frost'&&!r1.rimHidden&&r1.chips.join()==='Smoke Frost*,Clear Frost',r1);
   await tool(page,'phone');
   const lab=await page.evaluate(()=>{const l=document.getElementById('studioRimLabel'),r=l.getBoundingClientRect();return {text:l.textContent,shown:r.width>0&&r.height>0&&getComputedStyle(l).visibility!=='hidden',by:document.getElementById('studioRim').getAttribute('aria-labelledby')};});
   check(tag+' rim chips carry a visible Rim color label that names the group',lab.text==='Rim color'&&lab.shown&&lab.by==='studioRimLabel',lab);
   await done(page);
   await tool(page,'phone');
   const t=await page.evaluate(()=>[...document.querySelectorAll('#studioCase .studio-case-opt,#studioRim .studio-rim-chip')].map(e=>Math.round(e.getBoundingClientRect().height)));
   check(tag+' case and rim targets are at least 44 px tall',t.every(h=>h>=44),t);
   if(phone){
    const vis=await page.evaluate(()=>[...document.querySelectorAll('#studioRim .studio-rim-chip')].every(l=>{l.scrollIntoView({block:'nearest'});const r=l.getBoundingClientRect(),h=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return r.height>0&&!!h&&l.contains(h);}));
    check(tag+' rim chips reachable in the Phone sheet',vis);
   }
   await done(page);
   check(tag+' no horizontal overflow with the Rated Case',await noOverflow(page));
   await shot(page,engine+'-'+width+'-rated-smoke');
   /* 3. rim chips swap the photo */
   await pickRim(page,'Clear Frost');
   const r2=await page.evaluate(()=>{const r=__rt.rows('view-rated-iph17pmx.png',1800);return __rt.px(r[2]-30,1800);});
   check(tag+' Clear Frost chip swaps to the light rim photo',lum(r2)>150&&net.some(u=>u.includes('/assets/cases/rated-iph17pmx-clear.webp')),r2);
   check(tag+' the chosen rim names the card, the header and the address',await page.evaluate(()=>document.getElementById('studioCaseRated').firstElementChild.textContent==='Clear Frost'&&document.getElementById('studioPhone').textContent==='iPhone 17 Pro Max · Clear Frost'&&new URLSearchParams(location.search).get('rim')==='Clear Frost'&&new URLSearchParams(location.search).get('case')==='rated'),await page.evaluate(()=>location.search));
   check(tag+' rim choice is not a phone finish (phone finish kept for the clear case)',await page.evaluate(()=>__kp.state.colorName==='Silver'&&KPStudioCore.info().caseLabel==='Rated Case · Clear Frost'));
   await pickRim(page,'Smoke Frost');
   /* 4. prices with glass, Preview rows, counter review, overview and counter card (Rated) */
   await page.locator('#studioNext').click();await page.waitForFunction(()=>KPEditor.step==='preview');
   const pv=await page.evaluate(()=>[...document.querySelectorAll('#studioReviewDetails dt')].map(d=>[d.textContent,d.nextElementSibling.textContent]));
   check(tag+' Preview lists the phone and the frost rim',rowOf(pv,'Phone')==='iPhone 17 Pro Max · Silver'&&rowOf(pv,'Case')==='Smoke Frost',pv);
   await page.locator('#studioNext').click();await page.waitForFunction(()=>KPEditor.step==='setup');
   await page.locator('#addons .adn[data-k="screen"]').click();
   check(tag+' Rated + glass total $69.98',await page.locator('#studioTotal').textContent()==='$69.98');
   const rv=await openReview(page);
   check(tag+' review: Case row, phone row and total (Rated + glass)',rowOf(rv.rows,'Case')==='Rated Case · Smoke Frost'&&rowOf(rv.rows,'Phone')==='iPhone 17 Pro Max · Silver'&&rowOf(rv.rows,'Estimated total before tax')==='$69.98'&&rv.total==='$69.98',rv.rows);
   /* the team instruction rides on the card; the customer's overview names the rim and has no staff wording and no amber note
      when nothing is wrong (UX-7) */
   check(tag+' review overview: Smoke Frost · $49.99, the rim, no staff wording, no amber note',rv.items.includes('Smoke Frost · $49.99')&&!rv.items.some(t=>/Rated Case/.test(t))&&rv.overview.includes('iPhone 17 Pro Max · Silver · Smoke Frost rim')&&!rv.overview.some(t=>/Rated Case/.test(t))&&!rv.notes.length,{items:rv.items,notes:rv.notes,overview:rv.overview});
   check(tag+' counter card: Case row, total and the blank instruction',!!rv.card&&rowOf(rv.card.rows,'Case')==='Rated Case · Smoke Frost'&&rowOf(rv.card.rows,'Estimated total before tax')==='$69.98'&&rv.card.code.split('\n').includes('Use a Rated Case blank in Smoke Frost.'),rv.card);
   {const k=codeOf(rv.card);check(tag+' pick code: glass, store, Silver is finish 1, Smoke Frost rim (-G -S1 -P1 -FS)',!!k&&k.glass&&k.store===1&&k.finish===1&&k.rim==='-FS',rv.card&&rv.card.code);}
   await shot(page,engine+'-'+width+'-rated-review');
   /* 5. back to the clear case: prices follow */
   await closeReview(page);
   await pickCase(page,CLEAR);
   check(tag+' Clear + glass total $64.98',await page.locator('#studioTotal').textContent()==='$64.98');
   {const u=new URLSearchParams(await page.evaluate(()=>location.search));check(tag+' choosing clear writes case=clear and drops the rim',u.get('case')==='clear'&&!u.has('rim'),u.toString());}
   const rc=await openReview(page);
   check(tag+' review back on clear: MagSafe Clear, $64.98, no blank note',rowOf(rc.rows,'Case')===CLEAR&&rc.total==='$64.98'&&rc.items.includes('Case · $44.99')&&!rc.notes.length&&!rc.overview.some(t=>/blank/.test(t))&&!!rc.card&&!rc.card.code.includes('Rated'),{rows:rc.rows,items:rc.items,notes:rc.notes});
   {const k=codeOf(rc.card);check(tag+' clear pick code: finish but no rim (-G -S1 -P1, no -FS or -FC)',!!k&&k.glass&&k.store===1&&k.finish===1&&k.rim==='',rc.card&&rc.card.code);}
   await closeReview(page);
   /* a rim and a finish the team must match: Clear Frost with Deep Blue */
   await pickCase(page,RATED);await pickRim(page,'Clear Frost');
   if(phone)await tool(page,'phone');await page.locator('#colorSwatches .sw[data-n="Deep Blue"]').evaluate(e=>e.click());await settled(page);if(phone)await done(page);
   const rd=await openReview(page),kd=codeOf(rd.card);
   check(tag+' Clear Frost and Deep Blue: -P3 and -FC on the code, rows and overview agree',!!kd&&kd.finish===3&&kd.rim==='-FC'&&rowOf(rd.rows,'Phone')==='iPhone 17 Pro Max · Deep Blue'&&rowOf(rd.rows,'Case')==='Rated Case · Clear Frost'&&rd.items.includes('Clear Frost · $49.99')&&rd.overview.includes('iPhone 17 Pro Max · Deep Blue · Clear Frost rim')&&rd.card.code.split('\n').includes('Use a Rated Case blank in Clear Frost.'),rd);
   await closeReview(page);
   /* 6. design clipped to the Rated panel (solid red customer photo) */
   await page.goto(base+'customizer.html?model='+MODEL+'&case=clear');await editorReady(page);await settled(page);
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
   if(!(await page.evaluate(()=>KPEditor.tool==='photo')))await tool(page,'photo');
   await page.waitForSelector('.layChip[data-l="tpl:102"]',{state:'attached',timeout:15000});
   await pickLayout(page,'tpl:102');
   const six=[];for(let i=0;i<6;i++)six.push(F(await png(page,1500,2000,i*50),'p'+i+'.png'));
   {const chooser=page.waitForEvent('filechooser',{timeout:5000});await page.locator('#uploadBtn').click();await (await chooser).setFiles(six);}
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
   await setModel(page,'iPhone 14 Plus');
   check(tag+' Clear Frost only phone keeps the Rated Case with one chip',await page.evaluate(()=>__kp.state.caseType==='Rated Case'&&[...document.querySelectorAll('#studioRim input')].map(i=>i.value+(i.checked?'*':'')).join()==='Clear Frost*'));
   await setModel(page,'iPhone 13 mini');
   const fb=await page.evaluate(()=>({ct:__kp.state.caseType,toast:document.getElementById('kpToast')?.textContent,hidden:document.getElementById('studioCase').hidden,total:document.getElementById('studioTotal').textContent}));
   check(tag+' 13 mini: back to the clear case with the toast, no case choice',fb.ct===CLEAR&&fb.toast===FALLBACK&&fb.hidden&&fb.total==='$44.99',fb);
   await setModel(page,'iPhone 17 Pro Max');
   check(tag+' back on a Rated phone the clear case stays chosen',await page.evaluate(()=>__kp.state.caseType==='MagSafe Clear'&&!document.getElementById('studioCase').hidden));
   /* 10. partial collage: the customer still previews and reviews, with the empty spot message (clear here, then on frost) */
   await page.goto(base+'customizer.html?model='+MODEL+'&case=clear');await editorReady(page);
   if(!(await page.evaluate(()=>KPEditor.tool==='photo')))await tool(page,'photo');
   await page.waitForSelector('.layChip[data-l="tpl:102"]',{state:'attached',timeout:15000});
   await pickLayout(page,'tpl:102');
   {const four=six.slice(0,4);const chooser=page.waitForEvent('filechooser',{timeout:5000});await page.locator('#uploadBtn').click();await (await chooser).setFiles(four);}
   await page.waitForFunction(()=>__kp.layout()&&__kp.layout().filled===4,null,{timeout:20000}).catch(()=>{});await done(page);await settled(page);
   check(tag+' partial collage: customer flow is not blocked, staff print is',await page.evaluate(p=>__kp.printIssue()===''&&!document.getElementById('studioNext').disabled&&__kp.staffPrintIssue()===p,PARTIAL));
   await page.locator('#studioNext').click();await page.waitForFunction(()=>KPEditor.step==='preview');
   const pp=await page.evaluate(()=>{const e=document.getElementById('studioPartial'),r=e.getBoundingClientRect(),st=document.getElementById('studioStatus'),sr=st.getBoundingClientRect(),hit=document.elementFromPoint(sr.left+sr.width/2,sr.top+sr.height/2);
    return {hidden:e.hidden,text:e.textContent,visible:r.height>0,next:document.getElementById('studioNext').disabled,status:st.textContent,statusOnScreen:sr.height>0&&sr.bottom<=innerHeight&&!!hit&&st.contains(hit)};});
   check(tag+' Preview says how many photo spots are empty (panel and the bar above the footer)',!pp.hidden&&pp.visible&&pp.text===PARTIAL&&pp.status===PARTIAL&&pp.statusOnScreen&&!pp.next,pp);
   await shot(page,engine+'-'+width+'-partial-preview');
   const rp=await openReview(page);
   check(tag+' counter review and card say the spots are empty',rp.notes.includes(PARTIAL)&&rowOf(rp.rows,'Photo spots')===PARTIAL&&!!rp.card&&rp.card.code.split('\n').includes(PARTIAL),{notes:rp.notes,card:rp.card&&rp.card.code});
   await closeReview(page);
   await pickCase(page,RATED);
   check(tag+' partial collage on frost: customer flow is not blocked, staff print waits on the Rated Case first',await page.evaluate(([p,s])=>__kp.printIssue()===''&&!document.getElementById('studioNext').disabled&&__kp.staffPrintIssue()===s&&KPStudioCore.info().partial===p,[PARTIAL,STAFF_RATED]),await page.evaluate(()=>[__kp.printIssue(),__kp.staffPrintIssue(),KPStudioCore.info().partial]));
   const rq=await openReview(page);
   check(tag+' partial collage on frost: the empty spots are on the review, the spots and the blank on the card',rq.notes.includes(PARTIAL)&&rowOf(rq.rows,'Photo spots')===PARTIAL&&rq.total==='$49.99'&&!!rq.card&&['Use a Rated Case blank in Smoke Frost.',PARTIAL].every(t=>rq.card.code.split('\n').includes(t)),{notes:rq.notes,card:rq.card&&rq.card.code});
   await closeReview(page);
   /* 11. purge (Start over, next customer) returns to the clear case */
   await page.goto(base+'customizer.html?model='+MODEL+'&design='+DESIGN);await editorReady(page);await settled(page);
   await pickCase(page,RATED);
   await pickRim(page,'Clear Frost');
   check(tag+' purge resets to the clear case',await page.evaluate(()=>{KPStudioCore.purge();return __kp.state.caseType==='MagSafe Clear'&&__kp.state.rimColor===null;}));
   check(tag+' no console errors',errors.length===0,errors);
   await ctx.close();
  }
  /* 12. 320 px: the choice fits the Phone sheet, no overflow, targets 44 px, every target reachable */
  for(const [w,h] of [[320,568],[320,700]]){
   const tag=engine+' '+w+'x'+h;
   const ctx=await browser.newContext({serviceWorkers:'block',viewport:{width:w,height:h},isMobile:true,hasTouch:true});const page=await ctx.newPage();const errors=[];await hooked(page,errors);
   await page.goto(base+'customizer.html?model='+MODEL+'&design='+DESIGN);await editorReady(page);await settled(page);
   await pickCase(page,RATED,true);await page.locator('[data-tool=phone]').evaluate(e=>e.click());await page.waitForFunction(()=>document.getElementById('studioSheet').open);
   const l=await page.evaluate(async()=>{const els=[...document.querySelectorAll('#studioCase .studio-case-opt,#studioRim .studio-rim-chip')];
    /* the header's Design your case button already overflows 320 px on the baseline, so measure what the case choice adds */
    const box=document.getElementById('studioCase'),withCase=document.scrollingElement.scrollWidth;box.style.display='none';const without=document.scrollingElement.scrollWidth;box.style.display='';
    const res={overflow:withCase>without,clipped:els.filter(e=>e.scrollWidth>e.clientWidth+1).length,heights:els.map(e=>Math.round(e.getBoundingClientRect().height)),covered:0,inside:true};
    for(const e of els){e.scrollIntoView({block:'center'});await new Promise(r=>requestAnimationFrame(()=>r()));const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);if(!hit||!e.contains(hit))res.covered++;if(r.left<0||r.right>visualViewport.width+visualViewport.offsetLeft)res.inside=false;}
    return res;});
   check(tag+' case choice fits: no overflow, no clipped text, inside the screen',!l.overflow&&!l.clipped&&l.inside,l);
   check(tag+' case choice targets 44 px, all reachable in the Phone sheet',l.heights.every(x=>x>=44)&&!l.covered,l);
   if(h===568)await shot(page,engine+'-320-case-choice');
   check(tag+' no console errors',errors.length===0,errors);
   await ctx.close();
  }
  /* 13. kiosk shows the same control; an unsupported phone shows none */
  {
   const ctx=await browser.newContext({serviceWorkers:'block',viewport:{width:1024,height:768}});const page=await ctx.newPage();const errors=[];await hooked(page,errors);
   await page.goto(base+'customizer.html?kiosk=1&store='+encodeURIComponent(STORE)+'&model='+MODEL+'&design='+DESIGN);await editorReady(page);await settled(page);
   check(engine+' kiosk editor without a case starts on frost too',await page.evaluate(()=>KPStudioCore.info().caseType==='Rated Case'&&document.getElementById('studioTotal').textContent==='$49.99'));
   await page.goto(base+'customizer.html?kiosk=1&store='+encodeURIComponent(STORE)+'&model='+MODEL+'&design='+DESIGN+'&case=clear');await editorReady(page);await settled(page);
   check(engine+' kiosk editor from a clear phone (case=clear) is clear at $44.99',await page.evaluate(()=>KPStudioCore.info().caseType==='MagSafe Clear'&&document.getElementById('studioTotal').textContent==='$44.99'));
   check(engine+' kiosk editor shows the case choice',await page.evaluate(()=>!document.getElementById('studioCase').hidden&&document.body.classList.contains('studio-kiosk')));
   await pickCase(page,RATED);
   check(engine+' kiosk Rated total',await page.locator('#studioTotal').textContent()==='$49.99');
   await page.goto(base+'customizer.html?model=iphone-13-mini&design='+DESIGN);await editorReady(page);await settled(page);
   check(engine+' 13 mini: a customer who starts there gets the clear case with the toast',await page.evaluate(t=>__kp.state.caseType==='MagSafe Clear'&&document.getElementById('kpToast')?.textContent===t&&new URLSearchParams(location.search).get('case')==='clear'&&!new URLSearchParams(location.search).has('rim'),FALLBACK),await page.evaluate(()=>location.search));
   check(engine+' 13 mini: no Rated option',await page.evaluate(()=>document.getElementById('studioCase').hidden&&!KPStudioCore.info().ratedAvailable));
   check(engine+' 13 mini: Phone tool keeps the clear case copy',await page.evaluate(()=>document.querySelector('#studio-phone .studio-help').textContent==='Choose your model and phone finish. Your case stays clear; screen colors are approximate.'));
   check(engine+' kiosk no console errors',errors.length===0,errors);
   await ctx.close();
  }
  /* 14. staff workspace: case cards, Case row, prices, Rated download blocked, clear allowed, partial collage blocked */
  {
   const tag=engine+' staff';
   const ctx=await browser.newContext({serviceWorkers:'block',viewport:{width:1440,height:1000},acceptDownloads:true});const page=await ctx.newPage();const errors=[];await hooked(page,errors);
   await page.goto(base+'customizer.html?staff=1&model='+MODEL+'&design='+DESIGN);
   await page.waitForFunction(()=>window.__kp&&__kp.state.photoImg&&!__kp.state.libraryLoading&&!__kp.printIssue(),null,{timeout:20000});await page.waitForTimeout(700);
   const s0=await page.evaluate(()=>({row:getComputedStyle(document.getElementById('ctRow')).display,cards:[...document.querySelectorAll('#ctRow .ctCard')].map(c=>c.querySelector('strong').textContent+' '+c.querySelector('small').textContent),case:document.getElementById('spCase').textContent,dl:document.getElementById('spDownload').disabled}));
   check(tag+' case cards show for a Rated phone',s0.row==='grid'&&s0.cards[0]==='MagSafe Clear $44.99'&&s0.cards[1]==='Frost case $49.99 · '+DROP&&s0.case===CLEAR&&!s0.dl,s0);
   check(tag+' a staff link without a case stays clear',await page.evaluate(()=>__kp.state.caseType==='MagSafe Clear'));
   await page.locator('#ctRated').click();await page.waitForFunction(()=>__kp.state.caseType==='Rated Case');await page.waitForTimeout(900);
   const s1=await page.evaluate(()=>({status:document.getElementById('spStatus').textContent,dl:document.getElementById('spDownload').disabled,case:document.getElementById('spCase').textContent,sub:document.getElementById('spSubtotal').textContent,
    sw:[...document.querySelectorAll('#colorSwatches button')].map(b=>b.title).join(),label:document.getElementById('finishLabel').textContent,bundle:document.getElementById('bundleTotal').textContent,pressed:document.getElementById('ctRated').getAttribute('aria-pressed')}));
   check(tag+' Rated: download blocked with the message',s1.dl&&s1.status===STAFF_RATED,s1);
   check(tag+' Rated: Case row, $49.99, phone finishes stay, bundle copy',s1.case==='Rated Case · Smoke Frost'&&s1.sub==='$49.99'&&s1.sw==='Silver,Cosmic Orange,Deep Blue'&&s1.label==='Phone finish'&&s1.bundle==='$69.98'&&s1.pressed==='true',s1);
   await page.locator('#spGlass').check();await page.waitForTimeout(700);
   check(tag+' Rated + glass subtotal $69.98',await page.locator('#spSubtotal').textContent()==='$69.98');
   await page.evaluate(()=>KPStudioCore.setRim('Clear Frost'));await page.waitForTimeout(700);
   check(tag+' rim choice updates the Case row',await page.locator('#spCase').textContent()==='Rated Case · Clear Frost');
   check(tag+' staff export link is gated too',await page.evaluate(()=>{let called=false;const r=__kp.buildPrint(()=>{called=true;},{staff:true});return r===false&&!called;}));
   await shot(page,engine+'-staff-rated-blocked');
   await page.locator('#ctClear').click();await page.waitForFunction(()=>__kp.state.caseType==='MagSafe Clear');await page.waitForTimeout(900);
   const s2=await page.evaluate(()=>({status:document.getElementById('spStatus').textContent,dl:document.getElementById('spDownload').disabled,case:document.getElementById('spCase').textContent,sub:document.getElementById('spSubtotal').textContent,label:document.getElementById('finishLabel').textContent,finish:__kp.state.colorName}));
   check(tag+' Clear: download allowed, $64.98 with glass, phone finish back',!s2.dl&&s2.status.startsWith('Ready to download')&&s2.case===CLEAR&&s2.sub==='$64.98'&&s2.label==='Phone finish'&&s2.finish==='Silver',s2);
   const dl=page.waitForEvent('download',{timeout:20000}).catch(()=>null);await page.locator('#spDownload').click();
   const file=await dl;check(tag+' Clear print PNG downloads',!!file&&/\.png$/.test(file.suggestedFilename()),file&&file.suggestedFilename());
   check(tag+' no credit slip line for a design without credits',await page.evaluate(()=>{const a=document.querySelector('.staff-summary a[download]');return !!a&&a.closest('p').hidden;}));
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
   await page.waitForSelector('.layChip[data-l="tpl:102"]',{state:'attached',timeout:15000});
   await page.locator('#fileInput').setInputFiles(F(await png(page,1500,2000,10),'s0.png'));
   await page.waitForFunction(()=>__kp.state.photoImg,null,{timeout:15000});
   await pickLayout(page,'tpl:102');
   await page.waitForFunction(()=>__kp.layout().filled===1&&!__kp.printIssue(),null,{timeout:15000}).catch(()=>{});await page.waitForTimeout(800);
   const p1=await page.evaluate(()=>({status:document.getElementById('spStatus').textContent,dl:document.getElementById('spDownload').disabled,filled:__kp.layout().filled}));
   check(tag+' partial collage: staff download blocked with the message',p1.dl&&p1.status==='5 of 6 photo spots are empty. Add photos before printing, or choose a layout with fewer photos.',p1);
   const five=[];for(let i=1;i<6;i++)five.push(F(await png(page,1500,2000,i*50),'s'+i+'.png'));
   await page.locator('#fileInput').setInputFiles(five);
   await page.waitForFunction(()=>__kp.layout().filled===6&&!__kp.staffPrintIssue(),null,{timeout:20000}).catch(()=>{});await page.waitForTimeout(800);
   const p2=await page.evaluate(()=>({status:document.getElementById('spStatus').textContent,dl:document.getElementById('spDownload').disabled,filled:__kp.layout().filled}));
   check(tag+' every spot filled: staff download allowed',!p2.dl&&p2.filled===6&&p2.status.startsWith('Ready to download'),p2);
   /* unsupported phone: no cards */
   await page.goto(base+'customizer.html?staff=1&model=iphone-13-mini&design='+DESIGN);
   await page.waitForFunction(()=>window.__kp&&__kp.state.photoImg&&!__kp.state.libraryLoading,null,{timeout:20000});await page.waitForTimeout(500);
   check(tag+' 13 mini: no case cards',await page.evaluate(()=>getComputedStyle(document.getElementById('ctRow')).display==='none'));
   check(tag+' no console errors',errors.length===0,errors);
   await ctx.close();
  }
  /* 15. the case and rim ride in the address: a reload, a restored tab or a shared link keeps them (F1, UX-5, R2) */
  {
   const tag=engine+' url';
   const ctx=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await ctx.newPage();const errors=[];await hooked(page,errors);
   const libReady=async()=>{await editorReady(page);await page.waitForFunction(()=>__kp.state.photoImg&&!__kp.state.libraryLoading&&!__kp.printIssue(),null,{timeout:20000});await settled(page);};
   await page.goto(base+'customizer.html?model='+MODEL+'&design='+DESIGN+'&glass=1&case=clear');await libReady();
   await pickCase(page,RATED);await pickRim(page,'Clear Frost');
   const q1=new URL(await page.evaluate(()=>location.href)).searchParams;
   check(tag+' Rated Case and rim are written to the address',q1.get('case')==='rated'&&q1.get('rim')==='Clear Frost'&&q1.get('glass')==='1',q1.toString());
   await page.reload();await libReady();
   const a=await page.evaluate(()=>({ct:__kp.state.caseType,rim:KPStudioCore.info().rim,total:document.getElementById('studioTotal').textContent,checked:document.querySelector('#studioCase input:checked')?.value}));
   check(tag+' reload keeps the Rated Case, its rim and the price ($69.98 with glass)',a.ct===RATED&&a.rim==='Clear Frost'&&a.total==='$69.98'&&a.checked===RATED,a);
   await pickCase(page,CLEAR);
   const q2=new URL(await page.evaluate(()=>location.href)).searchParams;
   check(tag+' the clear case says case=clear and drops the rim from the address',q2.get('case')==='clear'&&!q2.has('rim'),q2.toString());
   await page.reload();await libReady();
   const a2=await page.evaluate(()=>({ct:__kp.state.caseType,total:document.getElementById('studioTotal').textContent,url:location.search}));
   check(tag+' reload keeps the clear case and its price ($64.98 with glass)',a2.ct===CLEAR&&a2.total==='$64.98'&&/[?&]case=clear(&|$)/.test(a2.url),a2);
   /* rim without a case (older links): a new session starts on frost in that rim */
   await page.goto(base+'customizer.html?model='+MODEL+'&design='+DESIGN+'&rim=Clear+Frost');await libReady();
   const a3=await page.evaluate(()=>({ct:__kp.state.caseType,rim:KPStudioCore.info().rim,url:location.search}));
   check(tag+' a link with only a rim opens frost in that rim',a3.ct===RATED&&a3.rim==='Clear Frost'&&/[?&]case=rated(&|$)/.test(a3.url),a3);
   await page.goto(base+'customizer.html?model=iphone-13-mini&design='+DESIGN+'&case=rated&rim=Smoke+Frost');await libReady();
   const b=await page.evaluate(()=>({ct:__kp.state.caseType,toast:document.getElementById('kpToast')?.textContent,url:location.search}));
   check(tag+' a Rated link for a phone without it opens the clear case with the toast',b.ct===CLEAR&&b.toast===FALLBACK&&/[?&]case=clear(&|$)/.test(b.url)&&!/[?&]rim=/.test(b.url),b);
   await page.goto(base+'customizer.html?model=iphone-14-plus&design='+DESIGN+'&case=rated&rim=Smoke+Frost');await libReady();
   const c=await page.evaluate(()=>({ct:__kp.state.caseType,rim:KPStudioCore.info().rim,url:location.search,total:document.getElementById('studioTotal').textContent}));
   check(tag+' a rim this phone does not come in falls back to its own rim',c.ct===RATED&&c.rim==='Clear Frost'&&/[?&]case=rated(&|$)/.test(c.url)&&/[?&]rim=Clear(\+|%20)Frost/.test(c.url)&&c.total==='$49.99',c);
   /* the toast inside the Phone sheet never covers the brand and model selects (UX-8) */
   await tool(page,'phone');await page.locator('#modelSel').selectOption('iPhone 13 mini');await page.waitForFunction(()=>__kp.state.caseType==='MagSafe Clear');await page.waitForTimeout(300);
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
   const ctx=await browser.newContext({serviceWorkers:'block',viewport:{width:1440,height:900}});const page=await ctx.newPage();const errors=[];await hooked(page,errors);
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
   if(!(await page.evaluate(()=>KPEditor.tool==='photo')))await tool(page,'photo');
   await page.waitForSelector('.layChip[data-l="tpl:37"]',{state:'attached',timeout:15000});
   await pickLayout(page,'tpl:37');
   const three=[];for(let i=0;i<3;i++)three.push(F(await png(page,1500,2000,i*70),'w'+i+'.png'));
   {const chooser=page.waitForEvent('filechooser',{timeout:5000});await page.locator('#uploadBtn').click();await (await chooser).setFiles(three);}
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
  /* 19. case size budget: with the page at the top, nothing under the case sits under the tool tray (phones), and on
     laptops and the kiosk the whole case clears the footer (since #69 the case choice sits beside it, in the Phone tool),
     clear and Rated, library design and photo path; the kiosk keeps its baseline case size; on a short phone new rim chips
     scroll into view in the Phone sheet; credits clear the tray; iPad portrait titles (UX-1 to UX-4, UX-9, R3) */
  const stageFits=`(()=>{const t=document.querySelector('.studio-tools'),f=document.getElementById('studioFooter');const lim=innerWidth<761&&!t.hidden?t.getBoundingClientRect().top:f.getBoundingClientRect().top;
   const bad=[];for(const el of innerWidth<761?document.getElementById('stageStick').children:[document.getElementById('stageCanvas')]){const r=el.getBoundingClientRect();if(r.height>0&&r.bottom>lim+0.5)bad.push((el.id||el.className)+' '+Math.round(r.bottom)+'>'+Math.round(lim));}
   return {scroll:Math.round(scrollY),bad,canvas:Math.round(document.getElementById('stageCanvas').getBoundingClientRect().height)};})()`;
  const addPhoto=async page=>{await page.locator('#fileInput').setInputFiles(F(await png(page,3000,4000,200),'me.png'));await page.waitForFunction(()=>__kp.state.photoImg&&!__kp.printIssue(),null,{timeout:20000});await done(page);await settled(page);};
  for(const [w,h,kind,kiosk] of [[375,812,'photo'],[390,844,'photo'],[393,852,'photo'],[414,896,'photo'],[390,844,'design'],[1024,768,'photo'],[1024,768,'design'],[1440,900,'photo'],[1440,900,'design'],[1024,768,'design',true]]){
   const phone=w<761,tag=engine+' '+w+'x'+h+' '+kind+(kiosk?' kiosk':'');
   const ctx=await browser.newContext({serviceWorkers:'block',viewport:{width:w,height:h},isMobile:phone,hasTouch:phone||!!kiosk});const page=await ctx.newPage();const errors=[];await hooked(page,errors);
   await page.goto(base+'customizer.html?'+(kiosk?'kiosk=1&store='+encodeURIComponent(STORE)+'&':'')+'model='+MODEL+'&case=clear'+(kind==='design'?'&design=boho-floral-01.jpg':''));await editorReady(page);await settled(page);
   if(kind==='photo')await addPhoto(page);
   for(const ct of [CLEAR,RATED]){
    if(ct===RATED)await pickCase(page,RATED,true);
    await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(400);
    const r=await page.evaluate(stageFits);
    check(tag+' '+(ct===RATED?'Rated':'clear')+': '+(phone?'everything under the case clears the tool tray':'the case clears the footer')+' before scrolling',r.scroll===0&&!r.bad.length,r);
    if(kiosk&&ct===CLEAR)check(tag+' kiosk keeps the baseline case size (no site header to leave room for)',r.canvas>=317,r);
   }
   if(w===768||w===1024&&!kiosk&&kind==='design')await shot(page,engine+'-'+w+'-rated-'+kind);
   check(tag+' no console errors',errors.length===0,errors);
   await ctx.close();
  }
  {
   const tag=engine+' 375x667 photo';
   const ctx=await browser.newContext({serviceWorkers:'block',viewport:{width:375,height:667},isMobile:true,hasTouch:true});const page=await ctx.newPage();const errors=[];await hooked(page,errors);
   await page.goto(base+'customizer.html?model='+MODEL+'&case=clear');await editorReady(page);await settled(page);await addPhoto(page);
   await page.evaluate(()=>scrollTo(0,0));await tool(page,'phone');await page.waitForTimeout(300);
   const opts=await page.evaluate(()=>[...document.querySelectorAll('#studioCase .studio-case-opt')].every(l=>{l.scrollIntoView({block:'center'});const r=l.getBoundingClientRect(),h=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return !!h&&l.contains(h);}));
   check(tag+' case choice can be scrolled to and tapped in the Phone sheet',opts);
   await page.locator('#studioCase label:has(input[value="Rated Case"])').click();await page.waitForFunction(()=>__kp.state.caseType==='Rated Case');await page.waitForTimeout(1200);
   const rim=await page.evaluate(()=>{const lim=innerHeight;return {scroll:Math.round(scrollY),ok:[...document.querySelectorAll('#studioRim .studio-rim-chip')].every(l=>{const r=l.getBoundingClientRect(),h=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return r.bottom<=lim&&!!h&&l.contains(h);})};});
   check(tag+' Rated: the new rim chips scroll into view in the Phone sheet',rim.ok,rim);
   await shot(page,engine+'-375x667-rated-rims');
   check(tag+' no console errors',errors.length===0,errors);
   await ctx.close();
  }
  for(const [w,h] of [[390,844],[375,812],[360,780]])for(const m of [MODEL,MODEL+'&case=clear','iphone-13-mini']){
   const tag=engine+' '+w+'x'+h+' '+m;
   const ctx=await browser.newContext({serviceWorkers:'block',viewport:{width:w,height:h},isMobile:true,hasTouch:true});const page=await ctx.newPage();const errors=[];await hooked(page,errors);
   await page.goto(base+'customizer.html?model='+m+'&design=kp-space-horsehead.jpg');await editorReady(page);
   await page.waitForFunction(()=>__kp.state.photoImg&&!__kp.state.libraryLoading&&!document.getElementById('cityPhotoCredit').hidden,null,{timeout:20000});await settled(page);
   await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(300);
   const u=await page.evaluate(()=>{const el=document.getElementById('cityPhotoCredit'),r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return {ok:!!hit&&(hit===el||el.contains(hit)),y:Math.round(scrollY),top:Math.round(r.top),bottom:Math.round(r.bottom),href:el.getAttribute('href')};});
   check(tag+' space photo credit link clears the tool tray before scrolling',u.ok&&u.y===0&&u.href==='new-print-credits.html#kp-space-horsehead',u);
   await ctx.close();
  }
  {
   const tag=engine+' 768x1024';
   const ctx=await browser.newContext({serviceWorkers:'block',viewport:{width:768,height:1024},hasTouch:true});const page=await ctx.newPage();const errors=[];await hooked(page,errors);
   for(const q of ['','&rim=Clear+Frost','&case=clear']){
   await page.goto(base+'customizer.html?model='+MODEL+'&design=boho-floral-01.jpg'+q);await editorReady(page);await settled(page);await tool(page,'phone');
   const tt=await page.evaluate(()=>[...document.querySelectorAll('#studioCase .studio-case-opt strong')].map(s=>{const name=s.firstElementChild,price=s.querySelector('.studio-case-price'),sep=s.querySelector('.studio-case-sep');
    const lines=e=>[...new Map([...e.getClientRects()].map(q=>[Math.round(q.top),q])).values()],nr=lines(name),pr=lines(price);return {text:s.innerText.replace(/\n/g,' / '),nameLines:nr.length,priceLines:pr.length,sameLine:pr.length===1&&nr.length===1&&Math.abs(pr[0].top-nr[0].top)<2,sepShown:getComputedStyle(sep).display!=='none'};}));
   check(tag+' '+(q||'default')+' case titles keep the name whole and the price whole (own line on a narrow stage)',tt.length===2&&tt.every(t=>t.nameLines===1&&t.priceLines===1&&(t.sameLine||!t.sepShown))&&tt[1].text.startsWith(q==='&case=clear'?'Frost case':q?'Clear Frost':'Smoke Frost'),tt);}
   await ctx.close();
  }
  /* 20. Rated only phones (no clear case kit): one case, its price and drop rating, no finish, the phone's own color in the
     panel, the customer's earlier clear choice kept, masks on demand, the review, the print gate and the staff rail */
  {
   const tag=engine+' Rated only';
   const ctx=await browser.newContext({serviceWorkers:'block',viewport:{width:1280,height:900}});
   const open=async(q,setup)=>{const page=await ctx.newPage();page.errs=[];page.net=[];await hooked(page,page.errs);page.on('request',q=>page.net.push(q.url()));if(setup)await setup(page);
    await page.goto(base+'customizer.html?'+q);await editorReady(page);await page.waitForFunction(()=>!__kp.state.libraryLoading,null,{timeout:20000}).catch(()=>{});await settled(page);return page;};
   const st=p=>p.evaluate(()=>{const i=KPStudioCore.info(),q=x=>document.querySelector(x),rated=q('#studioCase [value="Rated Case"]').closest('label');return {m:__kp.state.model,ct:i.caseType,total:i.total,rim:i.rim,finish:i.finish,color:__kp.state.colorName,issue:i.issue,url:location.search,
    toast:q('#kpToast')?q('#kpToast').textContent:'',staff:__kp.staffPrintIssue(),clear:q('#studioCase [value="MagSafe Clear"]').closest('label').getClientRects().length>0,small:rated.querySelector('small').textContent,card:rated.querySelector('strong').firstElementChild.textContent,legend:q('#studioCase legend').textContent,
    help:q('#studio-phone .studio-help').textContent,sw:getComputedStyle(q('#colorSwatches').parentElement).display,full:Math.round(rated.getBoundingClientRect().width)===Math.round(q('.studio-case-options').getBoundingClientRect().width)};});
   const clearToast=p=>p.evaluate(()=>{const t=document.getElementById('kpToast');if(t)t.textContent='';});
   for(const [slug,want] of [['pixel-10','Google Pixel 10'],['google-pixel-11-pro-xl','Google Pixel 11 Pro XL'],['moto-g-2026','Motorola moto g 2026'],['motorola-moto-g-stylus-2026','Motorola moto g stylus 2026'],['galaxy-s25-ultra','Samsung Galaxy S25 Ultra'],['iphone-16e','iPhone 16e'],['iphone-duo','iPhone Duo']]){
    for(const q of ['','&case=clear']){const p=await open('model='+slug+q),s=await st(p);
     check(tag+' ?model='+slug+q+' opens '+want+' in the Rated Case with no toast',s.m===want&&s.ct===RATED&&s.total===49.99&&!s.toast&&!p.errs.length,[s,p.errs]);await p.close();}
   }
   let p=await open('model='+MODEL+'&case=clear&finish=Cosmic%20Orange&design='+DESIGN),s;
   check(tag+' a clear phone never loads the Rated only masks',!p.net.some(u=>u.includes('mask-geometry-rated')));
   await setModel(p,'Google Pixel 10');s=await st(p);
   check(tag+' clear on iPhone, then a Pixel: Rated Case with a price toast',s.ct===RATED&&s.total===49.99&&s.toast===FORCED&&!s.issue,s);
   check(tag+' Pixel: one full width case card, no finish, drop and availability copy',!s.clear&&s.full&&s.legend==='Your case'&&s.finish===''&&s.sw==='none'&&s.small===DROP&&s.card==='Clear Frost',s);
   /* customer wording: Rated Case stays inside See photos, checkout and the staff pages */
   check(tag+' Pixel: the Phone tool help names the frost case, not the Rated Case',/^Choose your phone model( and rim color)?\. This phone comes in a frost case\.$/.test(s.help)&&!/Rated/.test(s.help),s.help);
   check(tag+' Pixel address: case=clear (the customer\'s own choice) with its rim and no finish=',/[?&]model=pixel-10(&|$)/.test(s.url)&&/[?&]case=clear(&|$)/.test(s.url)&&!/finish=/.test(s.url)&&/rim=Clear/.test(s.url),s.url);
   await p.evaluate(()=>KPStudioCore.setCase('MagSafe Clear'));check(tag+' the clear case cannot be chosen there',(await st(p)).ct===RATED);
   await p.reload();await editorReady(p);await p.waitForFunction(()=>!__kp.state.libraryLoading);await settled(p);s=await st(p);
   check(tag+' reload on the Pixel: Rated Case, no toast',s.ct===RATED&&!s.toast,s);
   await setModel(p,'iPhone 17 Pro Max');if(await p.evaluate(()=>KPEditor.tool!=='phone'))await tool(p,'phone');s=await st(p);
   check(tag+' back on iPhone 17 Pro Max the clear choice is back',s.ct===CLEAR&&s.total===44.99&&s.clear&&/[?&]case=clear(&|$)/.test(s.url)&&!/[?&]rim=/.test(s.url),s);
   await pickCase(p,RATED);await setModel(p,'Google Pixel 10');await clearToast(p);await setModel(p,'iPhone 17 Pro Max');s=await st(p);
   check(tag+' an explicit Rated choice survives a Rated only phone',s.ct===RATED&&/case=rated/.test(s.url),s);
   await setModel(p,'iPhone 13 mini');s=await st(p);check(tag+' a clear only phone still falls back with its toast',s.ct===CLEAR&&s.toast===FALLBACK,s);
   check(tag+' no console errors',!p.errs.length,p.errs);await p.close();
   /* a new session is already on frost: the phone changes nothing, so no toast, and frost stays on the next phone */
   p=await open('model='+MODEL+'&design='+DESIGN);await setModel(p,'Google Pixel 10');s=await st(p);
   check(tag+' frost session, then a Pixel: no toast, the address says case=rated',s.ct===RATED&&!s.toast&&/[?&]case=rated(&|$)/.test(s.url)&&/rim=Clear/.test(s.url),s);
   await p.reload();await editorReady(p);await p.waitForFunction(()=>!__kp.state.libraryLoading);await settled(p);await setModel(p,'iPhone 17 Pro Max');s=await st(p);
   check(tag+' frost session: frost stays after the Pixel (and a reload), no clear case message',s.ct===RATED&&s.total===49.99&&!s.toast&&/[?&]case=rated(&|$)/.test(s.url),s);
   check(tag+' frost session no console errors',!p.errs.length,p.errs);await p.close();
   p=await open('model=moto-g-2025&design='+DESIGN);s=await st(p);
   check(tag+' a Rated only phone with two rims: the Phone tool help names the rim and the frost case',s.help==='Choose your phone model and rim color. This phone comes in a frost case.',s.help);await p.close();
   p=await open('model='+MODEL+'&case=clear&finish=Cosmic%20Orange&design='+DESIGN);await setModel(p,'iPhone 16e');await setModel(p,'iPhone 17 Pro Max');s=await st(p);
   check(tag+' the phone finish is kept across a Rated only phone',s.color==='Cosmic Orange'&&s.ct===CLEAR,s);await p.close();
   /* the panel is the photographed phone's own color, not the white print area guide */
   for(const m of ['Google Pixel 10','Motorola moto g play 2026','iPhone 11','iPhone Duo','Samsung Galaxy S25']){
    p=await open('model='+m.toLowerCase().replace(/^samsung /,'').replace(/ /g,'-'));
    const c=await p.evaluate(()=>{const rows=KP_MASK_GEOMETRY[KP_PRINT_LAYOUTS[__kp.state.model].mask].rows,out=[];for(const f of [.35,.6,.85]){const r=rows[Math.floor(rows.length*f)],spans=[];for(let j=2;j<r.length;j+=2)spans.push([r[j],r[j+1]]);const q=spans.sort((a,b)=>(b[1]-b[0])-(a[1]-a[0]))[0];out.push(__rt.px((q[0]+q[1])/2,(r[0]+r[1])/2));}return out;});
    check(tag+' '+m+': an empty case shows the phone color in the panel',c.every(q=>Math.max(q[0],q[1],q[2])<238&&q[3]===255),c);await p.close();
   }
   /* iPhone Duo: no drop rating, no tempered glass, no layouts */
   p=await open('model='+MODEL+'&glass=1');
   await setModel(p,'iPhone Duo');s=await st(p);
   check(tag+' frost session to iPhone Duo: the toast names only the glass',s.ct===RATED&&s.toast==='Tempered glass is not available for iPhone Duo, so it was removed.',s);await p.close();
   p=await open('model='+MODEL+'&case=clear&glass=1');
   if(!(await p.evaluate(()=>KPEditor.tool==='photo')))await tool(p,'photo');
   await p.waitForSelector('.layChip[data-l="tpl:102"]',{state:'attached',timeout:15000});await pickLayout(p,'tpl:102');
   await setModel(p,'iPhone Duo');s=await st(p);
   const du=await p.evaluate(()=>({glass:__kp.state.addons.screen,offered:!!document.querySelector('#addons [data-k=screen]'),layout:__kp.state.layout,chips:document.getElementById('layoutChipsWrap').hidden,wait:document.getElementById('studioLayoutsWait').textContent,waitHidden:document.getElementById('studioLayoutsWait').hidden}));
   check(tag+' iPhone Duo: availability line only, no drop claim',s.small==='Confirm availability in store',s);
   check(tag+' iPhone Duo: no tempered glass, no layouts, and the toast says so',!du.glass&&!du.offered&&!du.layout&&du.chips&&!du.waitHidden&&du.wait==='Layouts do not fit this phone. Add one photo.'&&s.total===49.99&&s.toast===FORCED+' Tempered glass is not available for iPhone Duo, so it was removed. Layouts do not fit iPhone Duo. Your photos are saved for another phone.',[du,s]);
   await setModel(p,'iPhone 17 Pro Max');check(tag+' glass and layouts are offered again on the next phone',await p.evaluate(()=>!!document.querySelector('#addons [data-k=screen]')&&!document.getElementById('layoutChipsWrap').hidden));
   check(tag+' Duo no console errors',!p.errs.length,p.errs);await p.close();
   /* Galaxy S24 Ultra: built, but listed as coming soon (COMING_SOON, so turning it on needs no edit here) */
   const soon=Object.keys(JSON.parse(/var COMING_SOON=(\{[^}]*\})/.exec(fs.readFileSync(path.join(root,'customizer.html'),'utf8'))[1].replace(/'/g,'"')));
   p=await open('model=galaxy-s25');
   check(tag+' coming soon phones are listed and cannot be chosen: '+soon.join(),await p.evaluate(list=>list.every(m=>{const o=[...document.querySelectorAll('#modelSel option')].find(o=>o.value===m);return !!o&&o.disabled&&o.textContent===m+' (coming soon)';}),soon));
   check(tag+' no option text uses a dash',await p.evaluate(()=>![...document.querySelectorAll('#brandSel option,#modelSel option')].some(o=>/[\u2010-\u2015]/.test(o.textContent))));await p.close();
   /* the Rated only masks: one failed request is retried, a second one gives the mask message, the next phone recovers */
   let fails=1;
   p=await open('model=pixel-10',async q=>q.route('**/assets/mask-geometry-rated.js*',x=>fails-->0?x.abort():x.continue()));
   check(tag+' one failed mask request is retried',await p.evaluate(()=>KPStudioCore.info().previewReady));await p.close();
   fails=2;
   p=await ctx.newPage();await hooked(p,[]);await p.route('**/assets/mask-geometry-rated.js*',x=>fails-->0?x.abort():x.continue());await p.goto(base+'customizer.html?model=pixel-10&design='+DESIGN);await editorReady(p);
   check(tag+' two failed mask requests show the mask message',await p.waitForFunction(()=>__kp.printIssue()==='Case mask failed to load. Reload before printing.',null,{timeout:8000}).then(()=>true,()=>false));
   await setModel(p,'Google Pixel 10 Pro XL');check(tag+' the next Rated only phone loads them',await p.evaluate(()=>KPStudioCore.info().previewReady));await p.close();
   /* counter review: the title team members search for, no finish, the rim on screen and the blank on the card; a kiosk saves no card */
   p=await open('model=pixel-10&design='+DESIGN);
   check(tag+' the editor shows the design title',await p.waitForFunction(()=>document.querySelector('#studioProduct h1').textContent.startsWith('New York'),null,{timeout:8000}).then(()=>true,()=>false));
   const rv=await openReview(p);
   check(tag+' review rows: design title, phone without a finish, Rated Case',/^New York/.test(rowOf(rv.rows,'Design'))&&rowOf(rv.rows,'Phone')==='Google Pixel 10'&&rowOf(rv.rows,'Case')==='Rated Case · Clear Frost',rv.rows);
   check(tag+' review overview and card: rim, blank, no guessed pick code',rv.overview.includes('Google Pixel 10 · Clear Frost rim')&&!rv.overview.some(t=>/Rated Case/.test(t))&&!!rv.card&&rv.card.code==='Ask the team to match this preview.\nUse a Rated Case blank in Clear Frost.'&&rv.total==='$49.99',rv);
   check(tag+' purge leaves nothing printable behind',await p.evaluate(()=>{KPStudioCore.purge();return __kp.state.caseType==='MagSafe Clear'&&!__kp.state.ratedForced;}));
   check(tag+' review no console errors',!p.errs.length,p.errs);await p.close();
   p=await open('kiosk=1&store='+encodeURIComponent(STORE)+'&model=pixel-10&design='+DESIGN);
   for(let i=0;i<3;i++){await p.locator('#studioNext').click();await p.waitForTimeout(250);}
   check(tag+' kiosk review names the rim and no staff wording',await p.waitForFunction(()=>[...document.querySelectorAll('#reviewOverview > *')].some(e=>e.textContent==='Google Pixel 10 · Clear Frost rim'&&e.getClientRects().length>0)&&!/Rated Case/.test(document.getElementById('reviewOverview').textContent),null,{timeout:8000}).then(()=>true,()=>false));await p.close();
   /* print: an allow list. The flag alone never unblocks an estimated size, and the case type cannot get around it */
   p=await open('model=pixel-10&design='+DESIGN);
   const pg=await p.evaluate(()=>{const a=__kp.staffPrintIssue(),s=__kp.state;s.caseType='MagSafe Clear';const b=__kp.staffPrintIssue();s.caseType='Rated Case';KP_CONFIG.RATED_PRINT_READY=true;const c=__kp.staffPrintIssue();s.caseType='MagSafe Clear';const d=__kp.staffPrintIssue();s.caseType='Rated Case';let file='',built=false;__kp.buildPrint(()=>{built=true;},{staff:true});__kp.buildPrint((x,n)=>{file=n;});KP_CONFIG.RATED_PRINT_READY=false;return {a,b,c,d,built,file};});
   check(tag+' print blocked with its own message',pg.a==='Rated Case printing is waiting on a test print with a real blank. This phone has no clear case, so check with Corey.'&&pg.b===pg.a,pg);
   check(tag+' RATED_PRINT_READY alone does not unblock an estimated size',/^The Pixel 10 Rated Case print size is an estimate/.test(pg.c)&&pg.d===pg.c&&!pg.built,pg);
   check(tag+' the print file name says rated',/^print-GooglePixel10-rated-850x1805-/.test(pg.file),pg.file);
   await setModel(p,'iPhone 17');await pickCase(p,RATED);
   check(tag+' a phone with both cases is blocked the same way, and its clear print is not',await p.evaluate(()=>{KP_CONFIG.RATED_PRINT_READY=true;const a=__kp.staffPrintIssue();KP_CONFIG.RATED_PRINT_READY=false;KPStudioCore.setCase('MagSafe Clear');return /^The iPhone 17 Rated Case print size is an estimate/.test(a);})&&await p.waitForFunction(()=>__kp.staffPrintIssue()==='',null,{timeout:8000}).then(()=>true,()=>false));await p.close();
   /* staff workspace */
   p=await ctx.newPage();const se=[];await hooked(p,se);await p.setViewportSize({width:1440,height:1000});await p.goto(base+'customizer.html?staff=1&model=pixel-10&design='+DESIGN);
   await p.waitForFunction(()=>window.__kp&&__kp.state.photoImg&&!__kp.state.libraryLoading&&!__kp.printIssue(),null,{timeout:20000});await p.waitForTimeout(1200);
   const sr=await p.evaluate(()=>({row:getComputedStyle(document.getElementById('ctRow')).display,clear:getComputedStyle(document.getElementById('ctClear')).display,price:document.getElementById('ctPriceRated').textContent,status:document.getElementById('spStatus').textContent,dl:document.getElementById('spDownload').disabled,c:document.getElementById('spCase').textContent,
    thumb:(()=>{const c=document.getElementById('ctThumbRated'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i])n++;return n;})()}));
   check(tag+' staff rail: one card with its photo, download blocked',sr.row==='grid'&&sr.clear==='none'&&sr.dl&&/This phone has no clear case/.test(sr.status)&&sr.c==='Rated Case · Clear Frost'&&sr.thumb>1000&&sr.price==='$49.99 · '+DROP,sr);
   await p.evaluate(()=>__kp.resetCase());await p.waitForTimeout(600);
   check(tag+' staff Next customer on a Rated only phone stays Rated and blocked',await p.evaluate(()=>__kp.state.caseType==='Rated Case'&&__kp.state.ratedForced&&/no clear case/.test(__kp.staffPrintIssue()))&&!se.length,se);
   await p.close();await ctx.close();
   /* the name stays whole on the panel, level and upright, at both ends of the slider */
   const c2=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await c2.newPage();const errors=[];await hooked(page,errors);
   for(const slug of ['pixel-11','iphone-duo','moto-g-power-2026','galaxy-s25-ultra','galaxy-a17']){
    await page.goto(base+'customizer.html?model='+slug);await editorReady(page);await settled(page);
    const ink=await page.evaluate(async()=>{const s=__kp.state,out={};s.text='Christopher';
     for(const v of [false,true])for(const pos of [0,50,100]){s.textVertical=v;s.textPos=pos;let n=null;for(let i=0;i<40&&n===null;i++){__kp.buildPrint(c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let k=0;for(let q=3;q<d.length;q+=4)if(d[q]>8)k++;n=k;});if(n===null)await new Promise(r=>setTimeout(r,150));}out[(v?'v':'h')+pos]=n;}
     s.text='';s.textVertical=false;return out;});
    check(tag+' '+slug+': the whole name prints, level and upright, at both ends of the slider',['h','v'].every(k=>ink[k+50]>0&&ink[k+0]>=ink[k+50]*.97&&ink[k+100]>=ink[k+50]*.97),ink);
    if(slug==='pixel-11'){await tool(page,'phone');await page.waitForTimeout(300);await shot(page,engine+'-390-rated-only-phone-sheet');
     check(tag+' 390 Phone sheet: the one case card is full width, no overflow',await page.evaluate(()=>{const q=x=>document.querySelector(x).getBoundingClientRect();return Math.round(q('#studioCaseRated').width)>0&&Math.round(q('.studio-case-options').width)===Math.round(document.querySelector('#studioCase [value="Rated Case"]').closest('label').getBoundingClientRect().width)&&document.scrollingElement.scrollWidth<=innerWidth;}));}
   }
   check(tag+' 390 no console errors',!errors.length,errors);await c2.close();
  }
  /* 21. review fixes */
  {
   const tag=engine+' fixes',AGAIN='Your case is the clear case again at $44.99.',MASK='Case mask failed to load. Reload before printing.';
   const ctx=await browser.newContext({serviceWorkers:'block',viewport:{width:1280,height:900}}),toast=p=>p.evaluate(()=>{const t=document.getElementById('kpToast');return t&&t.style.opacity==='1'?t.textContent:'';});
   const open=async(q,setup,c)=>{const page=await (c||ctx).newPage();page.errs=[];await hooked(page,page.errs);if(setup)await setup(page);
    await page.goto(base+'customizer.html?'+q);await editorReady(page);await page.waitForFunction(()=>!__kp.state.libraryLoading,null,{timeout:20000}).catch(()=>{});await settled(page);return page;};
   /* the message about the Rated only phone goes when the clear case comes back */
   let p=await open('model='+MODEL+'&case=clear&design='+DESIGN);
   await setModel(p,'Google Pixel 10');await setModel(p,'iPhone 17 Pro');
   check(tag+' back on a clear phone the message says so',await toast(p)===AGAIN&&await p.evaluate(()=>KPStudioCore.info().total)===44.99,await toast(p));
   await setModel(p,'Google Pixel 10');await setModel(p,'iPhone Duo');
   check(tag+' Rated only to Rated only of another brand: one message about the case',(await toast(p)).startsWith(FORCED)&&(await toast(p)).split(FORCED).length===2&&!(await toast(p)).includes('clear case'),await toast(p));
   await setModel(p,'iPhone 17 Pro');check(tag+' leaving the Duo replaces its messages',await toast(p)===AGAIN,await toast(p));
   await pickCase(p,RATED);check(tag+' the customer choosing the Rated Case takes the clear case message away',await toast(p)==='',await toast(p));
   check(tag+' no console errors (messages)',!p.errs.length,p.errs);await p.close();
   /* a link that opens on a Rated only phone: as the gallery sends it (case=rated and its rim) the customer stays on frost;
      with case=clear (a customer who had the clear case) the clear case is still the customer's */
   p=await open('design='+DESIGN+'&model=pixel-10&case=rated&rim=Clear+Frost');await setModel(p,'iPhone 17');
   check(tag+' a Rated only phone from a gallery link: the next phone stays on frost at $49.99 with no message',await p.evaluate(()=>KPStudioCore.info().caseType==='Rated Case'&&KPStudioCore.info().total===49.99&&/[?&]case=rated(&|$)/.test(location.search))&&await toast(p)==='',[await p.evaluate(()=>location.search),await toast(p)]);
   await p.close();
   p=await open('design='+DESIGN+'&model=pixel-10&case=clear&rim=Clear+Frost');await setModel(p,'iPhone 17');
   check(tag+' a Rated only phone from a case=clear link: the next phone is clear at $44.99 and says so',await p.evaluate(()=>KPStudioCore.info().caseType==='MagSafe Clear'&&KPStudioCore.info().total===44.99&&/[?&]case=clear(&|$)/.test(location.search))&&await toast(p)===AGAIN,[await p.evaluate(()=>location.search),await toast(p)]);
   await p.close();
   /* masks: a phone or rim with the same mask tries again after a failure, and a reply that is not the file is a failure */
   let mode='fail',hits=0;
   const gate=async q=>q.route('**/assets/mask-geometry-rated.js*',x=>{hits++;return mode==='fail'?x.abort():mode==='portal'?x.fulfill({status:200,contentType:'text/html',body:'<html>sign in</html>'}):x.continue();});
   const broken=q=>q.waitForFunction(m=>__kp.printIssue()===m,MASK,{timeout:8000}).then(()=>true,()=>false),ready=q=>q.waitForFunction(()=>KPStudioCore.info().previewReady&&!__kp.printIssue(),null,{timeout:8000}).then(()=>true,()=>false);
   for(const bad of ['fail','portal']){
    mode=bad;hits=0;p=await open('model=pixel-10&design='+DESIGN,gate);
    check(tag+' mask file '+bad+': tried twice, then the mask message',await broken(p)&&hits===2,hits);
    mode='ok';await setModel(p,'Google Pixel 10 Pro');check(tag+' mask file '+bad+': the phone with the same mask tries again',await ready(p)&&hits===3,hits);await p.close();
    mode=bad;p=await open('model=moto-g-2025&design='+DESIGN,gate);await broken(p);mode='ok';await p.evaluate(()=>KPStudioCore.setRim('Clear Frost'));
    check(tag+' mask file '+bad+': a rim change tries again',await ready(p));await p.close();
   }
   /* a mask image that failed is tried again the same way */
   mode='fail';p=await open('model=iphone-17&case=clear&design='+DESIGN,q=>q.route('**/assets/masks/view-i17.png*',x=>mode==='fail'?x.abort():x.continue()));
   check(tag+' mask image failed: the message',await broken(p));mode='ok';await p.evaluate(()=>{const s=document.getElementById('modelSel');s.dispatchEvent(new Event('change'));});
   check(tag+' mask image failed: choosing the phone again tries again',await ready(p));await p.close();
   /* the Rated panel mask that is still loaded counts as Rated, whatever the case type says */
   p=await ctx.newPage();await hooked(p,[]);await p.goto(base+'customizer.html?staff=1&design='+DESIGN+'&model=iPhone-17-Pro&case=rated');
   await p.waitForFunction(()=>window.__kp&&__kp.state.photoImg&&!__kp.state.libraryLoading&&!__kp.printIssue(),null,{timeout:20000});
   const lm=await p.evaluate(()=>{__kp.state.caseType='MagSafe Clear';let file='';__kp.buildPrint((c,n)=>{file=n;});return {issue:__kp.staffPrintIssue(),file};});
   check(tag+' a wrong case type cannot print the Rated panel',lm.issue===STAFF_RATED&&/-rated-/.test(lm.file),lm);
   await p.close();
   /* setup links: the link's case is its own, not the first phone's */
   p=await open('model=pixel-10&setup='+encodeURIComponent(JSON.stringify({m:'iPhone 17 Pro',ct:'Rated Case',cal:{dx:0,dy:0,s:1,cdx:0,cdy:0,cs:1},ph:{px:0,py:0,sc:1,rot:0,f:'none',v:'original'},d:DESIGN})));
   check(tag+' a setup link keeps its Rated Case after a Rated only phone',await p.waitForFunction(()=>__kp.state.model==='iPhone 17 Pro'&&KPStudioCore.info().caseType==='Rated Case'&&KPStudioCore.info().total===49.99,null,{timeout:8000}).then(()=>true,()=>false));await p.close();
   p=await open('model=pixel-10&setup='+encodeURIComponent(JSON.stringify({m:'iPhone 17 Pro',ct:'MagSafe Clear',cal:{dx:0,dy:0,s:1,cdx:0,cdy:0,cs:1},ph:{px:0,py:0,sc:1,rot:0,f:'none',v:'original'},d:DESIGN})));
   check(tag+' a setup link keeps its clear case in a session that starts on frost',await p.waitForFunction(()=>__kp.state.model==='iPhone 17 Pro'&&KPStudioCore.info().caseType==='MagSafe Clear'&&KPStudioCore.info().total===44.99,null,{timeout:8000}).then(()=>true,()=>false));await p.close();
   /* a phone with no case yet has no clear case to show */
   for(const m of Object.keys(JSON.parse(/var COMING_SOON=(\{[^}]*\})/.exec(fs.readFileSync(path.join(root,'customizer.html'),'utf8'))[1].replace(/'/g,'"')))){
    const name=m.replace(/^(Samsung|Google|Motorola) /,'');p=await ctx.newPage();await hooked(p,[]);await p.goto(base+'customizer.html?design='+DESIGN+'&case=rated&model='+name.toLowerCase().replace(/ /g,'-'));await editorReady(p);
    check(tag+' '+name+' link: coming soon, no clear case promised',await toast(p)==='The case for '+name+' is coming soon. Choose another phone, or ask a team member.'&&await p.evaluate(()=>document.getElementById('studioNext').disabled),await toast(p));await p.close();
   }
   p=await open('model=moto-g-5g-2025');check(tag+' ?model=moto-g-5g-2025 is the moto g 2025',await p.evaluate(()=>__kp.state.model)==='Motorola moto g 2025');await p.close();
   /* the code sentence only with a code */
   for(const [q,want,rim] of [['model=iphone-17-pro',true,'-FS'],['model=iphone-17-pro&case=clear',true,''],['model=pixel-10',false]]){
    p=await open(q+'&design='+DESIGN);await p.evaluate(()=>{const n=document.getElementById('nameInput');n.value='Sam';n.dispatchEvent(new Event('input',{bubbles:true}));KPStudioCore.adjust('px',40);});await p.waitForTimeout(400);
    const rv=await openReview(p),text=rowOf(rv.rows,'Personalization handoff')+' | '+rowOf(rv.rows,'Artwork placement'),onCard=JSON.stringify(rv.card&&rv.card.rows);
    check(tag+' '+q+': the pick code sentence '+(want?'is there':'is not there')+', no dash',(text.match(/The pick code identifies the base design only\./g)||[]).length===(want?2:0)&&onCard.includes('pick code identifies')===want&&/Show this preview so our team can match your name/.test(text)&&/^.*\| Custom placement\. /.test(text)&&!/[\u2010-\u2015]/.test(text),text);
    const k=codeOf(rv.card);check(tag+' '+q+': the pick code '+(want?'carries the finish'+(rim?' and the rim '+rim:' and no rim'):'is not there'),want?!!k&&k.finish===1&&k.rim===rim&&!k.glass:!k&&!/Pick code/.test(rv.card.code),rv.card&&rv.card.code);await p.close();
   }
   /* a photo spot the camera hides is named (the customer is told before the counter), and only then */
   for(const [q,id,want] of [['model=moto-g-power-2025','tpl:102',null],['model=iphone-17-pro-max','tpl:102',null]]){
    p=await open(q);if(!(await p.evaluate(()=>KPEditor.tool==='photo')))await tool(p,'photo');await p.waitForSelector('.layChip[data-l="'+id+'"]',{state:'attached',timeout:15000});
    const r=await p.evaluate(async()=>{const out={};for(const c of document.querySelectorAll('.layChip[data-l^="tpl:"]')){__kp.state.layout=c.dataset.l;const l=KPStudioCore.info().layout;out[l.name]=l.hidden;}__kp.state.layout=null;return out;});
    if(/moto/.test(q))check(tag+' moto g power: Three Words says photo 1 is not shown, Mini Gallery does not',r['Three Words']==='Photo 1 is not shown on this phone.'&&r['Mini Gallery']==='',r);
    else check(tag+' iPhone 17 Pro Max: every photo spot shows',Object.values(r).length>10&&Object.values(r).every(x=>x===''),r);
    if(/moto/.test(q)){await p.evaluate(()=>{const c=[...document.querySelectorAll('.layChip')].find(c=>c.querySelector('.lay-name').textContent==='Three Words');const d=c.closest('details');if(d)d.open=true;c.click();});await p.waitForTimeout(500);
     check(tag+' the note is under the photo buttons',await p.evaluate(()=>{const n=document.getElementById('slotNote');return !n.hidden&&n.getClientRects().length>0&&n.textContent==='Photo 1 is not shown on this phone.';}));
     await setModel(p,'iPhone 17 Pro Max');check(tag+' the note goes on a phone that shows every photo',await p.waitForFunction(()=>document.getElementById('slotNote').hidden,null,{timeout:5000}).then(()=>true,()=>false));}
    await p.close();
   }
   /* dark art on the Galaxy S25 in Smoke Frost: no light line between the art and the rim */
   p=await open('model=galaxy-s25');await p.setInputFiles('#fileInput',F(await png(p,1200,2600,0,'#101418'),'dark.png'));await p.waitForFunction(()=>__kp.state.photoImg);await settled(p);
   const line=await p.evaluate(()=>{const g=KP_MASK_GEOMETRY['view-rated-samgs24.png'],c=document.getElementById('stageCanvas'),x=c.getContext('2d');let worst=0;for(const y of [1600,1900,2200,2400]){const r=g.rows.find(r=>r[0]<=y&&y<r[1]),a=r[2],b=r[r.length-1];for(let d=4;d<=12;d+=2)for(const q of [a-d,b+d]){const v=x.getImageData(Math.round(q*c.width/2500),Math.round(y*c.height/3000),1,1).data;worst=Math.max(worst,v[0]*.299+v[1]*.587+v[2]*.114);}}return worst;});
   check(tag+' Galaxy S25 Smoke Frost: no light line around dark art (4 px past the mask is rim)',line<90,line);await p.close();
   await ctx.close();
   /* phones: the address after Done is what is on screen, so a reload keeps the phone, case and rim; the message stays off the
      sheet's title when the sheet grows under it; spacing */
   const c2=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:844},isMobile:true,hasTouch:true});
   p=await open('model=iphone-17-pro&case=clear&design='+DESIGN,null,c2);
   await tool(p,'phone');await setModel(p,'Google Pixel 10');await setModel(p,'iPhone 18 Pro Max');await p.waitForTimeout(400); /* the sheet grows: finish row, two cards */
   const top=await p.evaluate(()=>{const t=document.getElementById('kpToast').getBoundingClientRect(),h=document.getElementById('studioSheetTitle').getBoundingClientRect(),d=document.getElementById('studioDone').getBoundingClientRect();return [t.top,t.bottom,h.top,h.bottom,d.top,d.bottom].map(Math.round);});
   check(tag+' 390 the message is clear of the sheet title and Done',top[1]<=Math.min(top[2],top[4])+1||top[0]>=Math.max(top[3],top[5])-1,top);
   await setModel(p,'Google Pixel 10');await done(p);await p.waitForTimeout(400);
   check(tag+' 390 the address after Done names the Pixel',/[?&]model=pixel-10(&|$)/.test(await p.evaluate(()=>location.search)),await p.evaluate(()=>location.search));
   await p.reload();await editorReady(p);check(tag+' 390 a reload keeps it',await p.evaluate(()=>__kp.state.model==='Google Pixel 10'&&KPStudioCore.info().total===49.99));
   await tool(p,'phone');await setModel(p,'Samsung Galaxy S25');await p.evaluate(()=>KPStudioCore.setRim('Clear Frost'));await done(p);await p.waitForTimeout(400);await p.reload();await editorReady(p);
   check(tag+' 390 a rim chosen in the Phone sheet survives a reload',await p.evaluate(()=>KPStudioCore.info().rim==='Clear Frost'),await p.evaluate(()=>location.search));
   await tool(p,'phone');await setModel(p,'iPhone 17 Pro');await pickCase(p,RATED);await done(p);await p.waitForTimeout(400);await p.reload();await editorReady(p);
   check(tag+' 390 a Rated choice made in the Phone sheet survives a reload',await p.evaluate(()=>__kp.state.model==='iPhone 17 Pro'&&KPStudioCore.info().caseType==='Rated Case'),await p.evaluate(()=>location.search));
   await p.waitForFunction(()=>!__kp.state.libraryLoading&&__kp.state.photoImg,null,{timeout:20000});await settled(p);
   await tool(p,'phone');await pickCase(p,CLEAR);await done(p);await p.waitForTimeout(400);await p.reload();await editorReady(p);
   check(tag+' 390 a clear choice made in the Phone sheet survives a reload',await p.evaluate(()=>__kp.state.model==='iPhone 17 Pro'&&KPStudioCore.info().caseType==='MagSafe Clear'&&KPStudioCore.info().total===44.99),await p.evaluate(()=>location.search));
   await p.close();
   p=await open('model=iphone-duo',null,c2);if(!(await p.evaluate(()=>KPEditor.tool==='photo')))await tool(p,'photo');
   check(tag+' 390 Duo: the layouts note has room above it',await p.evaluate(()=>{const n=document.getElementById('studioLayoutsWait'),r=n.getBoundingClientRect(),above=[...document.querySelectorAll('#studio-photo *')].filter(e=>!e.contains(n)&&!n.contains(e)&&e.getClientRects().length&&e.getBoundingClientRect().bottom<=r.top+1).map(e=>e.getBoundingClientRect().bottom);return r.height>0&&r.top-Math.max(...above)>=10;}));
   await p.close();await c2.close();
   const c3=await browser.newContext({serviceWorkers:'block',viewport:{width:1440,height:900}});p=await open('model=galaxy-s25',null,c3);await tool(p,'phone');
   check(tag+' 1440 the rim label does not touch the case card',await p.evaluate(()=>document.getElementById('studioRim').getBoundingClientRect().top-document.querySelector('.studio-case-options').getBoundingClientRect().bottom>=6));
   await p.close();await c3.close();
  }
  await browser.close();
 }
 const failed=results.filter(r=>!r.ok);
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,1));
 console.log(results.length-failed.length+'/'+results.length+' rated case checks passed');
 if(server)server.close();
 if(failed.length)process.exit(1);
})().catch(e=>{console.error(e);if(server)server.close();process.exit(1);});
