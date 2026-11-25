/* Rated Case photos: the See photos button beside Enlarge case and its viewer (assets/rated-gallery.js), with the photos
   from tools/build_rated_photos.py. Chromium and WebKit at 390 x 844 (touch) and 1440 x 900.
   Covers: every site Rated phone and rim (RATED and RATED_ONLY) has at least 3 photos that load (HTTP 200) and decode at
   their stated size, or, for a rim no photo can be shown of (Galaxy S24 and S25 in Smoke Frost), the other rim's photos
   under their own captions and a note that says so; Pixel, moto, Galaxy A, iPhone Duo and the other Rated only phones
   (one photo set each, the similar phone note only where the camera differs, Choose changes only the rim and Back to my
   design otherwise); the drop rating follows the kit (none on the iPhone Duo) beside Confirm availability in store;
   a new customer session starts on the frost case, so the viewer opens on its rim with Back to my design, and the rim or the
   clear case chosen next survives a reload (case=clear links start on the clear case, which the rest of the checks use);
   the button shows with the clear case and the Rated Case chosen, never toggles the case, costs no height on phones and
   hides for a phone without a Rated kit; the viewer opens on the right phone and rim; next, previous, arrow keys,
   swipe, thumbnails and the rim switch; Choose Rated Case sets case, rim, price and address through the case radios;
   Back to my design; Esc, Close and Back close it and focus returns; On other phones (8+ photos, captions and alt text
   without dashes or brand names); a photo that fails to load shows a message; reduced motion; reopening follows a new
   phone; the shared kiosk (no links, the idle reset closes it, failures point to a team member); the classic ?staff=1
   rail, which starts on the clear case; a mouse drag released on the backdrop swipes instead of closing; Forward never lands on the viewer's old history
   entry; the page behind does not scroll; arrow keys stay in the viewer (?cal=1); short landscape phones keep a real
   photo; tablets load the 1600 x 1920 file; On other phones leaves out this phone and keeps its rim chips; the photos
   with the embossed rim name, a clock or an app icon stay out; a customer with the clear case gets it back (with a message)
   after a Rated only phone, and one on the frost case keeps it; no page errors. Around the viewer the editor
   says Frost case or the rim's name; Rated Case is the wording inside the viewer only.
   usage: KP_BASE=http://127.0.0.1:PORT/ node tools/tests/rated_photos.cjs [outdir]   (serves the repo itself without KP_BASE) */
const {chromium,webkit}=require(process.env.PW_CORE||'../../../playwright/node_modules/playwright-core');
const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..');
const out=path.resolve(process.argv[2]||process.env.KP_OUT||'/tmp/keepsake-rated-photos');fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2','.pdf':'application/pdf'};
let server=null;
function serve(){return new Promise(r=>{server=http.createServer((req,res)=>{let f=path.join(root,decodeURIComponent(new URL(req.url,'http://local').pathname));if(f.endsWith(path.sep))f+='index.html';if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return}fs.readFile(f,(e,d)=>{if(e){res.writeHead(404).end();return}res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(d)})});server.listen(0,'127.0.0.1',()=>r('http://127.0.0.1:'+server.address().port+'/'))})}
const results=[];
function check(name,ok,detail){results.push({name,ok:!!ok,detail});console.log((ok?'PASS ':'FAIL ')+name+(detail===undefined||ok?'':' '+JSON.stringify(detail)));}
const MODEL='iphone-17-pro-max',DESIGN='boho-floral-01.jpg',STORE='West Chester, PA';
const BRAND=/cck|custom case kiosk|nimbus|phantom|balaji/i,DASH=/[‐-―−-]/;
/* the site's Rated phones and rims, read the way tools/build_rated_photos.py reads them */
const SECOND=['googpl10p10','googpl11p11'],NO_PHOTOS={samgs24:['Smoke Frost'],samgs24u:['Smoke Frost']};
function siteKits(){
 const src=fs.readFileSync(path.join(root,'customizer.html'),'utf8'),block=src.slice(src.indexOf('KP-RATED-KITS'));
 const flat=n=>JSON.parse(new RegExp('var '+n+'=(\\{[\\s\\S]*?\\});').exec(block)[1].replace(/'/g,'"'));
 const soon=flat('COMING_SOON'),clear=flat('CLEAR_FROST_ONLY'),smoke=flat('SMOKE_FROST_ONLY'),only=flat('RATED_ONLY');
 return Object.entries({...flat('RATED'),...only}).filter(([model])=>!soon[model]).map(([model,key])=>({model,only:!!only[model],key:SECOND.includes(key.replace('-',''))?key.replace('-',''):key.split('-')[0],
  rims:clear[key]?['Clear Frost']:smoke[key]?['Smoke Frost']:['Smoke Frost','Clear Frost']}))
  /* a phone with no photo in any rim is in no photo list (its button hides itself) */
  .filter(k=>!k.rims.every(r=>(NO_PHOTOS[k.key]||[]).includes(r)));
}
async function hooked(page,errors){
 page.on('pageerror',e=>errors.push('pageerror: '+e.message));
 page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|net::ERR_FAILED/.test(m.text()))errors.push('console: '+m.text());});
 await page.route('**/assets/nsfw/**',r=>r.fulfill({contentType:'application/javascript',body:r.request().url().includes('nsfwjs')?"window.nsfwjs={load:async()=>({classify:async()=>[{className:'Neutral',probability:1}]})};":''}));
}
const editorReady=p=>p.waitForFunction(()=>window.KPEditor&&window.__kp&&window.KPRatedGallery,null,{timeout:20000});
const settled=async p=>{await p.waitForFunction(()=>KPStudioCore.info().previewReady&&!__kp.state.libraryLoading,null,{timeout:20000}).catch(()=>{});await p.waitForTimeout(300);};
const photosReady=p=>p.waitForFunction(()=>KPRatedGallery.resolve(KPStudioCore.info().model)!==null||!KPStudioCore.info().ratedAvailable,null,{timeout:15000}).catch(()=>{});
const center=l=>l.evaluate(e=>e.scrollIntoView({block:'center'}));
/* Since #69 the case cards live in the Phone tool: beside the stage on desktop, in a closed sheet on phones. When they are
   not on screen, click the same label from the page (its change event reaches the editor exactly as a tap does). */
const tapLabel=async l=>{if(await l.isVisible()){await center(l);await l.click();}else await l.evaluate(e=>e.click());};
async function pickCase(p,type){const l=p.locator('#studioCase label:has(input[value="'+type+'"])');await tapLabel(l);await p.waitForFunction(t=>__kp.state.caseType===t,type);await settled(p);}
async function pickRim(p,name){const l=p.locator('#studioRim label:has(input[value="'+name+'"])');await tapLabel(l);await p.waitForFunction(n=>KPStudioCore.info().rim===n,name);await settled(p);}
async function setModel(p,name){await p.evaluate(n=>{const b=document.getElementById('brandSel'),want=(/^(Samsung|Google|Motorola) /.exec(n)||[,'Apple'])[1];if(b.value!==want){b.value=want;b.dispatchEvent(new Event('change'));}const s=document.getElementById('modelSel');s.value=n;s.dispatchEvent(new Event('change'));},name);await p.waitForFunction(n=>__kp.state.model===n,name);await settled(p);await photosReady(p);}
async function openViewer(p){const b=p.locator('#ratedPhotosOpen');await center(b);await b.click();await p.waitForFunction(()=>KPRatedGallery.isOpen&&document.querySelector('#ratedGallery .rg-thumb'),null,{timeout:10000});await shown(p);}
/* the large photo has loaded (or failed) for the current index */
const shown=p=>p.waitForFunction(()=>{const i=document.querySelector('#ratedGallery .rg-img'),m=document.querySelector('#ratedGallery .rg-msg');return !m.hidden||i.complete&&i.naturalWidth>0;},null,{timeout:10000}).catch(()=>{});
const view=p=>p.evaluate(()=>{const d=document.getElementById('ratedGallery'),img=d.querySelector('.rg-img'),r=d.getBoundingClientRect();
 return {open:d.open,sub:d.querySelector('#rgSub').textContent,caption:d.querySelector('.rg-caption').textContent,count:d.querySelector('.rg-count').textContent,src:img.getAttribute('src')||'',alt:img.alt,
  natural:img.naturalWidth,attrW:img.getAttribute('width'),attrH:img.getAttribute('height'),choose:d.querySelector('.rg-choose').textContent,
  rims:[...d.querySelectorAll('.rg-rim')].map(b=>b.textContent+(b.getAttribute('aria-pressed')==='true'?'*':'')+(b.tagName==='SPAN'?'(only)':'')),rimsHidden:d.querySelector('.rg-rims').hidden,
  thumbs:d.querySelectorAll('.rg-thumb').length,current:[...d.querySelectorAll('.rg-thumb')].findIndex(t=>t.getAttribute('aria-current')==='true'),
  set:d.querySelector('[data-set][aria-pressed=true]')?.dataset.set,anchors:d.querySelectorAll('a,[href]').length,note:d.querySelector('.rg-note').hidden?'':d.querySelector('.rg-note').textContent,facts:[...d.querySelectorAll('.rg-facts li')].map(l=>l.textContent),sideScroll:(e=>e.scrollHeight-e.clientHeight)(d.querySelector('.rg-side')),
  rect:[r.left,r.top,r.width,r.height].map(Math.round),frame:(f=>[f.left,f.top,f.width,f.height].map(Math.round))(d.querySelector('.rg-frame').getBoundingClientRect()),vw:innerWidth,vh:innerHeight,
  msg:d.querySelector('.rg-msg').hidden?'':d.querySelector('.rg-msg p').textContent,imgHidden:getComputedStyle(img).visibility==='hidden'};});
const focusId=p=>p.evaluate(()=>document.activeElement&&document.activeElement.id);
const closed=p=>p.waitForFunction(()=>!KPRatedGallery.isOpen,null,{timeout:5000}).then(()=>true,()=>false);
/* after a close, the viewer's history entry is gone again (Back) and focus is back on the button */
const settledClose=async p=>{await closed(p);await p.waitForFunction(()=>!(history.state&&history.state.kpRatedPhotos)&&document.activeElement&&document.activeElement.id==='ratedPhotosOpen',null,{timeout:4000}).catch(()=>{});await p.waitForTimeout(150);};
async function swipe(p,dx,touch){
 const box=await p.locator('#ratedGallery .rg-frame').boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2;
 if(touch){await p.evaluate(([x,y,dx])=>{const f=document.querySelector('#ratedGallery .rg-frame'),o={bubbles:true,cancelable:true,pointerId:7,pointerType:'touch',isPrimary:true};
   f.dispatchEvent(new PointerEvent('pointerdown',{...o,clientX:x,clientY:y}));f.dispatchEvent(new PointerEvent('pointermove',{...o,clientX:x+dx/2,clientY:y+4}));f.dispatchEvent(new PointerEvent('pointerup',{...o,clientX:x+dx,clientY:y+6}));},[x,y,dx]);}
 else{await p.mouse.move(x,y);await p.mouse.down();await p.mouse.move(x+dx/2,y+3,{steps:4});await p.mouse.move(x+dx,y+5,{steps:4});await p.mouse.up();}
 await p.waitForTimeout(120);
}
const shot=async(p,name)=>{await p.evaluate(()=>{const i=document.querySelector('#ratedGallery[open] .rg-img');return i&&i.getAttribute('src')?i.decode().catch(()=>{}):null;});await p.waitForTimeout(250);await p.screenshot({path:path.join(out,name+'.png')});};

(async()=>{
 const base=process.env.KP_BASE?process.env.KP_BASE.replace(/\/?$/,'/'):await serve();
 const kits=siteKits(),manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/cases/rated-photos/manifest.json'),'utf8'));
 /* 0. the manifest covers every site Rated phone with the rims its kit offers, 3+ photos each, and clean words */
 {
  const missing=[];for(const k of kits){const m=manifest.models[k.model];if(!m||m.key!==k.key||JSON.stringify(m.rims)!==JSON.stringify(k.rims)){missing.push(k.model+': phone list');continue;}
   for(const rim of k.rims){const set=manifest.sets[k.key]||{},none=(NO_PHOTOS[k.key]||[]).includes(rim),list=set[none?k.rims.find(r=>r!==rim):rim]||[];
    if(list.length<3||(none&&set[rim]))missing.push(k.model+' '+rim+': '+list.length+' photos');}}
  check('every site Rated phone x offered rim has at least 3 photos ('+kits.length+' phones, '+kits.reduce((n,k)=>n+k.rims.length,0)+' phone rims)',kits.length>=54&&!missing.length,missing);
  check('phones listed as coming soon have no photos (Galaxy S24 Ultra)',!manifest.models['Samsung Galaxy S24 Ultra']&&!Object.keys(manifest.sets).includes('samgs24u'));
  const mislabeled=Object.entries(manifest.sets).flatMap(([k,set])=>Object.entries(set).flatMap(([rim,l])=>l.filter(i=>!i.caption.endsWith('· '+rim)||!i.file.startsWith('rp-'+k+'-'+rim.split(' ')[0].toLowerCase()+'-')||!i.alt.includes(rim+' rim')).map(i=>i.file)));
  check('every photo is captioned with the rim it shows',!mislabeled.length,mislabeled);
  const all=[...Object.values(manifest.sets).flatMap(s=>Object.values(s).flat()),...manifest.other];
  const words=all.flatMap(i=>[i.caption,i.alt,i.file,i.thumb,i.phone||'',i.rim||'']).filter(t=>BRAND.test(t)||(!/\.webp$/.test(t)&&DASH.test(t)));
  check('captions, alt text and file names carry no dashes or brand names ('+all.length+' photos)',!words.length&&!BRAND.test(JSON.stringify(manifest)),words.slice(0,5));
  const order=Object.values(manifest.sets).flatMap(s=>Object.values(s)).every(l=>l.map(i=>i.view).join()===['angle','side','side2','back','front'].filter(v=>l.some(i=>i.view===v)).join()&&l.some(i=>i.view==='side'));
  check('views in order: front and back, side views, back, front (each set has a side view)',order);
  // these blanks' front and back (shot 1) and other side (shot 4) photos show the vendor name embossed in the rim; the iPhone
  // Duo's front photos show a lock screen clock, the Galaxy S24 Smoke Frost photo an app icon
  const out0=['samgs26','samgs26u','samgs25fe','samga37','samga17','googpl10','googpl10p10','googpl10pxl','motgstl26','motgpwr25','motgply25'].flatMap(k=>['smoke','clear'].flatMap(r=>['angle','side2'].map(v=>'rp-'+k+'-'+r+'-'+v)))
   .concat(['rp-iph18fld-smoke-angle','rp-iph18fld-smoke-front','rp-samgs24-smoke-back','rp-samgs24u-smoke-back']);
  const shipped=out0.filter(n=>JSON.stringify(manifest).includes(n+'.webp')||fs.existsSync(path.join(root,'assets/cases/rated-photos',n+'.webp')));
  check('photos with an embossed rim name, a clock or an app icon are not shipped',!shipped.length,shipped);
  check('every photo has a 1600 x 1920 file for tablets',all.every(i=>i.hd===i.file.replace(/\.webp$/,'-hd.webp')));
  const otherOk=manifest.other.length>=12&&manifest.other.length<=14&&new Set(manifest.other.map(o=>o.phone)).size===manifest.other.length&&['Smoke Frost','Clear Frost'].every(r=>manifest.other.some(o=>o.rim===r));
  check('on other phones: '+manifest.other.length+' photos, each a different phone, both rims',otherOk,manifest.other.map(o=>o.caption));
  /* the viewer calls them the same case beside this phone's 20 ft line: a blank without that rating is another case */
  check('on other phones: no iPhone Duo (another case, no drop rating)',!manifest.other.some(o=>o.key==='iph18fld'||/Duo/.test(o.phone)),manifest.other.map(o=>o.phone));
  const weight=fs.readdirSync(path.join(root,'assets/cases/rated-photos')).reduce((n,f)=>n+fs.statSync(path.join(root,'assets/cases/rated-photos',f)).size,0);
  check('photo folder weighs under 14 MB ('+(weight/1e6).toFixed(2)+' MB)',weight<14e6);
  const src=fs.readFileSync(path.join(root,'customizer.html'),'utf8');
  check('customizer loads the viewer with a release version and keeps window.__kp={',/rated-gallery\.js\?v=[\w.-]+/.test(src)&&/rated-gallery\.css\?v=[\w.-]+/.test(src)&&src.includes('window.__kp={'));
 }
 for(const [engine,kind] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await kind.launch();
  /* 1. every photo and thumbnail answers 200 and decodes at its stated size, in this engine */
  {
   const ctx=await browser.newContext(),page=await ctx.newPage();await page.goto(base+'assets/cases/rated-photos/manifest.json');
   const r=await page.evaluate(async()=>{const m=await (await fetch('manifest.json?v=t')).json(),files=new Set();
    const add=i=>{files.add(i.file+'|1000x1200');files.add(i.hd+'|1600x1920');files.add(i.thumb+'|200x240');};Object.values(m.sets).forEach(s=>Object.values(s).flat().forEach(add));m.other.forEach(add);
    const bad=[];await Promise.all([...files].map(async f=>{const [name,size]=f.split('|');try{const res=await fetch(name);if(res.status!==200){bad.push(name+' '+res.status);return;}
     const im=new Image();im.src=URL.createObjectURL(await res.blob());await im.decode();if(im.naturalWidth+'x'+im.naturalHeight!==size)bad.push(name+' '+im.naturalWidth+'x'+im.naturalHeight);URL.revokeObjectURL(im.src);}catch(e){bad.push(name+' '+e.message);}}));
    return {n:files.size,bad};});
   check(engine+' every photo, tablet photo and thumbnail loads (HTTP 200) and decodes ('+r.n+' files)',r.n>=780&&!r.bad.length,r.bad.slice(0,6));
   await ctx.close();
  }
  for(const width of [390,1440]){
   const tag=engine+' '+width,phone=width<761;
   /* 1b. a new customer session (no case in the link) starts on the frost case: the viewer opens on that rim and has nothing
      to choose; another rim, and then the clear case, are kept by the address and survive a reload */
   {
    const c0=await browser.newContext({viewport:{width,height:phone?844:900},isMobile:phone,hasTouch:phone,serviceWorkers:'block'});const p0=await c0.newPage();const e0=[];await hooked(p0,e0);
    const at=()=>p0.evaluate(()=>({ct:__kp.state.caseType,rim:KPStudioCore.info().rim,total:document.getElementById('studioTotal').textContent,head:document.getElementById('studioPhone').textContent,
     radio:document.querySelector('#studioCase input[name=studioCaseType]:checked')?.value,q:['case','rim'].map(k=>new URLSearchParams(location.search).get(k)),photos:!document.getElementById('ratedPhotosOpen').hidden,open:KPRatedGallery.isOpen}));
    const fresh=async()=>{await editorReady(p0);await p0.waitForFunction(()=>__kp.state.photoImg&&!__kp.state.libraryLoading,null,{timeout:30000});await settled(p0);await photosReady(p0);};
    await p0.goto(base+'customizer.html?model='+MODEL+'&design='+DESIGN);await fresh();
    const s0=await at();
    check(tag+' a new session starts on the frost case with See photos shown',s0.ct==='Rated Case'&&s0.rim==='Smoke Frost'&&s0.total==='$49.99'&&s0.radio==='Rated Case'&&s0.head==='iPhone 17 Pro Max · Smoke Frost'&&s0.photos,s0);
    await openViewer(p0);let d=await view(p0);
    check(tag+' new session: the viewer opens on the rim it starts with, with Back to my design',d.sub==='On iPhone 17 Pro Max'&&d.rims.join()==='Smoke Frost*,Clear Frost'&&/rp-iph17pmx-smoke-angle/.test(d.src)&&d.choose==='Back to my design',d);
    await p0.locator('#ratedGallery [data-rim="Clear Frost"]').click();await shown(p0);d=await view(p0);
    check(tag+' new session: another rim is chosen by case and rim',d.choose==='Choose Rated Case · Clear Frost'&&/clear-angle/.test(d.src),d);
    await p0.locator('#ratedGallery .rg-choose').click();await p0.waitForFunction(()=>KPStudioCore.info().rim==='Clear Frost',null,{timeout:6000}).catch(()=>{});await settled(p0);await settledClose(p0);
    const s1=await at();
    check(tag+' new session: Choose changes only the rim',!s1.open&&s1.ct==='Rated Case'&&s1.rim==='Clear Frost'&&s1.total==='$49.99'&&s1.head==='iPhone 17 Pro Max · Clear Frost'&&s1.q.join()==='rated,Clear Frost',s1);
    await p0.reload();await fresh();const s2=await at();
    check(tag+' the rim chosen in the viewer survives a reload',s2.ct==='Rated Case'&&s2.rim==='Clear Frost'&&s2.head==='iPhone 17 Pro Max · Clear Frost'&&s2.photos,s2);
    await openViewer(p0);d=await view(p0);
    check(tag+' after a reload the viewer opens on that rim',d.rims.join()==='Smoke Frost,Clear Frost*'&&d.choose==='Back to my design',d);
    await p0.keyboard.press('Escape');await settledClose(p0);
    await pickCase(p0,'MagSafe Clear');const s3=await at();await p0.reload();await fresh();const s4=await at();
    check(tag+' the clear case chosen over the starting frost case survives a reload, See photos stays',[s3,s4].every(x=>x.ct==='MagSafe Clear'&&x.total==='$44.99'&&x.head==='iPhone 17 Pro Max · Clear case'&&x.q[0]==='clear'&&x.photos),{s3,s4});
    await openViewer(p0);d=await view(p0);
    check(tag+' the viewer offers the first rim again beside the clear case',d.rims.join()==='Smoke Frost*,Clear Frost'&&d.choose==='Choose Rated Case · Smoke Frost',d);
    await p0.keyboard.press('Escape');await settledClose(p0);
    check(tag+' no page errors (new session)',!e0.length,e0);
    await c0.close();
   }
   const ctx=await browser.newContext({viewport:{width,height:phone?844:900},isMobile:phone,hasTouch:phone,serviceWorkers:'block'});
   const page=await ctx.newPage();const errors=[],net=[];await hooked(page,errors);page.on('request',r=>net.push(r.url()));
   await page.goto(base+'customizer.html?model='+MODEL+'&design='+DESIGN+'&case=clear');await editorReady(page);
   await page.waitForFunction(()=>__kp.state.photoImg&&!__kp.state.libraryLoading,null,{timeout:20000});await settled(page);await photosReady(page);
   check(tag+' no viewer photos load before it opens (only the button thumbnail)',!net.some(u=>/rated-photos\/rp-.*\.webp/.test(u)&&!/-side-t\.webp/.test(u)),net.filter(u=>/rated-photos\/rp-/.test(u)));
   await page.waitForFunction(()=>{const i=document.querySelector('#ratedPhotosOpen img');return i.complete&&i.naturalWidth>0;},null,{timeout:8000}).catch(()=>{});
   /* 2. the button: a real button, shown with the clear case, beside Enlarge case, 44 px, never inside a label */
   const b0=await page.evaluate(()=>{const b=document.getElementById('ratedPhotosOpen'),z=document.getElementById('skyCaseZoom'),r=b.getBoundingClientRect(),zr=z.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2),tray=document.querySelector('.studio-tools');
    return {tag:b.tagName,type:b.type,hidden:b.hidden,label:!!b.closest('label'),name:b.getAttribute('aria-label'),text:b.textContent.trim(),h:Math.round(r.height),w:Math.round(r.width),hit:!!hit&&b.contains(hit),
     row:Math.abs((r.top+r.bottom)/2-(zr.top+zr.bottom)/2)<2&&!z.hidden,inStage:!!b.closest('#stageStick'),aboveTray:!tray||getComputedStyle(tray).position!=='fixed'||r.bottom<=tray.getBoundingClientRect().top,scrollY,
     thumb:b.querySelector('img').complete&&b.querySelector('img').naturalWidth>0,zh:Math.round(zr.height),fw:getComputedStyle(b).fontWeight,zfw:getComputedStyle(z).fontWeight,fs:getComputedStyle(b).fontSize,zfs:getComputedStyle(z).fontSize};});
   check(tag+' See photos is a real button, shown with the clear case',b0.tag==='BUTTON'&&b0.type==='button'&&!b0.hidden&&!b0.label&&b0.text==='See photos'&&b0.name==='See photos of the Rated Case'&&b0.hit&&b0.inStage,b0);
   check(tag+' button shares the Enlarge case row (no extra height) with a 44 px target',b0.row&&b0.h>=44,b0);
   check(tag+' button matches Enlarge case (height, weight, size)',b0.h===b0.zh&&b0.fw===b0.zfw&&b0.fs===b0.zfs,b0);
   check(tag+' button shows a small side view of the case',b0.thumb,b0);
   if(phone)check(tag+' button visible above the tool tray without scrolling',b0.scrollY===0&&b0.aboveTray,b0);
   check(tag+' no horizontal overflow with the button',await page.evaluate(()=>document.scrollingElement.scrollWidth<=innerWidth));
   await shot(page,engine+'-'+width+'-button-clear');
   /* 3. open with the clear case: the radios stay put; this phone, the first rim, the first photo */
   await openViewer(page);
   let v=await view(page);
   /* the drop rating is the one published for this blank, always beside the availability line, as on the case card */
   check(tag+' facts: price, drop rating, availability, design on the back, rims',JSON.stringify(v.facts)===JSON.stringify(['Rated Case · $49.99','20 ft drop protection','Confirm availability in store','Your design printed on the back','Frosted rim in Smoke Frost or Clear Frost']),v.facts);
   check(tag+' opening never changes the case',await page.evaluate(()=>__kp.state.caseType==='MagSafe Clear'&&document.querySelector('#studioCase input[value="MagSafe Clear"]').checked));
   check(tag+' opens on this phone and the first rim',v.open&&v.sub==='On iPhone 17 Pro Max'&&v.rims.join()==='Smoke Frost*,Clear Frost'&&v.caption==='Front and back · Smoke Frost'&&v.count==='1 of 5'&&/rp-iph17pmx-smoke-angle\.webp/.test(v.src)&&v.natural===1000,v);
   check(tag+' Choose names the Rated Case and rim',v.choose==='Choose Rated Case · Smoke Frost',v.choose);
   check(tag+' photo has explicit width and height and alt text',v.attrW==='1000'&&v.attrH==='1200'&&/^Rated Case with a Smoke Frost rim/.test(v.alt),v);
   check(tag+' viewer has no links',v.anchors===0);
   check(tag+(phone?' viewer fills the phone screen':' viewer is a centered panel'),phone?v.rect[0]===0&&v.rect[1]===0&&v.rect[2]===v.vw&&Math.abs(v.rect[3]-v.vh)<=1:v.rect[2]<v.vw-40&&v.rect[3]<v.vh-40&&Math.abs(v.rect[0]*2+v.rect[2]-v.vw)<=2&&v.frame[3]>=600,v.rect);
   const targets=await page.evaluate(()=>[...document.querySelectorAll('#ratedGallery button:not([hidden])')].filter(b=>b.getClientRects().length&&!b.closest('[hidden]')).map(b=>[b.className||b.dataset.set,Math.round(b.getBoundingClientRect().width),Math.round(b.getBoundingClientRect().height)]).filter(([,w,h])=>w<44||h<44));
   check(tag+' every viewer control is at least 44 px',!targets.length,targets);
   const frame0=v.frame;
   if(!phone){
    /* a mouse drag on the photo released on the backdrop is a swipe, never a backdrop click */
    const fb=await page.locator('#ratedGallery .rg-frame').boundingBox(),pb=await page.locator('#ratedGallery').boundingBox();
    await page.mouse.move(fb.x+100,fb.y+fb.height/2);await page.mouse.down();await page.mouse.move(pb.x-30,fb.y+fb.height/2+4,{steps:8});await page.mouse.up();await page.waitForTimeout(250);
    v=await view(page);
    check(tag+' a photo drag released on the backdrop swipes and keeps the viewer open',v.open&&v.count==='2 of 5',v.count);
    await page.locator('#ratedGallery .rg-next').click();await shown(page);
    /* a backdrop click (press and release outside the panel) still closes it */
    await page.mouse.click(pb.x-30,pb.y+40);await settledClose(page);
    check(tag+' a click on the backdrop closes the viewer',await page.evaluate(()=>!KPRatedGallery.isOpen&&document.activeElement.id==='ratedPhotosOpen'));
    /* the mouse wheel does not scroll the page behind, over the backdrop or over the panel */
    await page.evaluate(()=>scrollTo(0,0));await openViewer(page);
    const y0=await page.evaluate(()=>scrollY);
    for(const [x,y] of [[pb.x-40,pb.y+pb.height/2],[pb.x+pb.width-60,pb.y+pb.height-120],[pb.x+200,pb.y+pb.height/2]])for(const dy of [400,-400]){await page.mouse.move(x,y);await page.mouse.wheel(0,dy);await page.waitForTimeout(200);}
    const w1=await page.evaluate(()=>({y:scrollY,max:document.scrollingElement.scrollHeight-innerHeight,lock:document.documentElement.classList.contains('rg-lock')}));
    check(tag+' the mouse wheel does not scroll the page behind the viewer',w1.y===y0&&w1.lock,{y0,...w1});
    v=await view(page);
    check(tag+' reopens on the first photo with the same frame',v.count==='1 of 5'&&JSON.stringify(v.frame)===JSON.stringify(frame0),v);
   }
   /* 4. next, previous, keys, swipe, thumbnails */
   await page.locator('#ratedGallery .rg-next').click();await shown(page);v=await view(page);
   check(tag+' next shows the side view',v.count==='2 of 5'&&v.caption==='Side view · Smoke Frost'&&/smoke-side\.webp/.test(v.src)&&v.current===1,v);
   check(tag+' no layout shift between photos',JSON.stringify(v.frame)===JSON.stringify(frame0),{before:frame0,after:v.frame});
   await shot(page,engine+'-'+width+'-viewer-side-smoke');
   await page.locator('#ratedGallery .rg-prev').click();v=await view(page);
   check(tag+' previous goes back',v.count==='1 of 5',v.count);
   await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');v=await view(page);
   check(tag+' Right arrow key',v.count==='3 of 5'&&v.caption==='Other side · Smoke Frost',v);
   await page.keyboard.press('ArrowLeft');v=await view(page);
   check(tag+' Left arrow key',v.count==='2 of 5',v.count);
   await swipe(page,-120,false);v=await view(page);
   check(tag+' swipe left (drag) shows the next photo',v.count==='3 of 5',v.count);
   await swipe(page,130,true);v=await view(page);
   check(tag+' swipe right (touch) shows the previous photo',v.count==='2 of 5',v.count);
   await swipe(page,-20,true);v=await view(page);
   check(tag+' a short touch does not change the photo',v.count==='2 of 5',v.count);
   await page.locator('#ratedGallery .rg-thumb').nth(4).click();await shown(page);v=await view(page);
   check(tag+' thumbnail opens that photo',v.count==='5 of 5'&&v.caption==='Front · Smoke Frost'&&v.current===4,v);
   await page.locator('#ratedGallery .rg-next').click();v=await view(page);
   check(tag+' next wraps to the first photo',v.count==='1 of 5',v.count);
   /* 5. the rim switch */
   await page.locator('#ratedGallery .rg-next').click();await page.locator('#ratedGallery [data-rim="Clear Frost"]').click();await shown(page);v=await view(page);
   check(tag+' rim switch shows Clear Frost photos and keeps the view',v.rims.join()==='Smoke Frost,Clear Frost*'&&v.caption==='Side view · Clear Frost'&&/clear-side\.webp/.test(v.src)&&v.natural===1000&&v.choose==='Choose Rated Case · Clear Frost',v);
   await shot(page,engine+'-'+width+'-viewer-clear-frost');
   check(tag+' still the clear case while browsing',await page.evaluate(()=>__kp.state.caseType==='MagSafe Clear'));
   await page.locator('#ratedGallery [data-rim="Smoke Frost"]').focus();await page.keyboard.press('Enter');
   const kf=await page.evaluate(()=>({rim:KPRatedGallery.state().rim,focus:document.activeElement.dataset&&document.activeElement.dataset.rim}));
   check(tag+' rim chip works from the keyboard and keeps focus',kf.rim==='Smoke Frost'&&kf.focus==='Smoke Frost',kf);
   await page.locator('#ratedGallery [data-rim="Clear Frost"]').click();await shown(page);
   /* 6. Choose: case, rim, price and address, the radios checked, focus back on the button */
   await page.locator('#ratedGallery .rg-choose').click();
   await page.waitForFunction(()=>__kp.state.caseType==='Rated Case'&&KPStudioCore.info().rim==='Clear Frost',null,{timeout:6000}).catch(()=>{});await settled(page);await settledClose(page);
   const c1=await page.evaluate(()=>({open:KPRatedGallery.isOpen,ct:__kp.state.caseType,rim:KPStudioCore.info().rim,total:document.getElementById('studioTotal').textContent,
    radio:document.querySelector('#studioCase input[value="Rated Case"]').checked,chip:document.querySelector('#studioRim input[value="Clear Frost"]')?.checked,focus:document.activeElement.id,step:KPEditor.step,head:document.getElementById('studioPhone').textContent}));
   const q1=await page.evaluate(()=>[new URLSearchParams(location.search).get('case'),new URLSearchParams(location.search).get('rim'),!!(history.state&&history.state.kpRatedPhotos)]);
   check(tag+' Choose sets the Rated Case, Clear Frost rim and $49.99, then closes',!c1.open&&c1.ct==='Rated Case'&&c1.rim==='Clear Frost'&&c1.total==='$49.99'&&c1.radio&&c1.chip&&c1.head==='iPhone 17 Pro Max · Clear Frost',c1);
   check(tag+' the address keeps the case and rim (reload, shared link)',q1[0]==='rated'&&q1[1]==='Clear Frost'&&!q1[2],q1);
   /* Forward steps over the entry the viewer left behind (it has the address from before Choose) */
   const len0=await page.evaluate(()=>history.length);
   await page.goForward().catch(()=>{});await page.waitForTimeout(500);
   const f1=await page.evaluate(()=>({open:KPRatedGallery.isOpen,entry:!!(history.state&&history.state.kpRatedPhotos),case:new URLSearchParams(location.search).get('case'),rim:new URLSearchParams(location.search).get('rim'),step:KPEditor.step,ct:__kp.state.caseType}));
   check(tag+' Forward after closing never lands on the viewer\'s old entry',!f1.open&&!f1.entry&&f1.case==='rated'&&f1.rim==='Clear Frost'&&f1.step==='edit'&&f1.ct==='Rated Case',{len0,...f1});
   check(tag+' focus returns to See photos and the editor stays on Design',c1.focus==='ratedPhotosOpen'&&c1.step==='edit',c1);
   check(tag+' case photo follows (Clear Frost Rated photo)',net.some(u=>u.includes('/assets/cases/rated-iph17pmx-clear.webp')));
   await shot(page,engine+'-'+width+'-button-rated');
   /* 7. reopening with that case: its rim, and Back to my design just closes */
   await openViewer(page);v=await view(page);
   check(tag+' reopens on the chosen rim',v.rims.join()==='Smoke Frost,Clear Frost*'&&/clear-angle\.webp/.test(v.src),v.rims);
   check(tag+' Back to my design when that case and rim are chosen',v.choose==='Back to my design',v.choose);
   await page.locator('#ratedGallery .rg-choose').click();await settledClose(page);
   check(tag+' Back to my design closes without changes',await page.evaluate(()=>!KPRatedGallery.isOpen&&__kp.state.caseType==='Rated Case'&&KPStudioCore.info().rim==='Clear Frost'&&document.activeElement.id==='ratedPhotosOpen'));
   /* 8. a rim chosen in the editor: the button stays, and the viewer opens on that rim */
   await pickRim(page,'Smoke Frost');
   const b1=await page.evaluate(()=>{const b=document.getElementById('ratedPhotosOpen');return !b.hidden&&b.getBoundingClientRect().height>=44;});
   check(tag+' button shown with the Rated Case chosen',b1);
   await openViewer(page);v=await view(page);
   check(tag+' opens on the editor rim (Smoke Frost)',v.rims.join()==='Smoke Frost*,Clear Frost'&&v.choose==='Back to my design',v);
   const yOpen=await page.evaluate(()=>scrollY);
   /* 9. Esc closes, focus returns, history entry gone, the page where it was */
   await page.keyboard.press('Escape');await settledClose(page);
   const yShut=await page.evaluate(()=>({y:scrollY,lock:document.documentElement.classList.contains('rg-lock'),gutter:document.documentElement.style.scrollbarGutter}));
   check(tag+' the page keeps its scroll position and is unlocked after closing',yShut.y===yOpen&&!yShut.lock&&!yShut.gutter,{yOpen,...yShut});
   const e1=await page.evaluate(()=>({open:KPRatedGallery.isOpen,focus:document.activeElement.id,entry:!!(history.state&&history.state.kpRatedPhotos),path:location.pathname,step:KPEditor.step}));
   check(tag+' Esc closes and focus returns',!e1.open&&e1.focus==='ratedPhotosOpen'&&!e1.entry&&e1.path.endsWith('customizer.html')&&e1.step==='edit',e1);
   /* 10. the browser Back button closes it and stays in the editor */
   await openViewer(page);await page.goBack();await settledClose(page);
   const g1=await page.evaluate(()=>({open:KPRatedGallery.isOpen,focus:document.activeElement.id,path:location.pathname,step:KPEditor.step,ct:__kp.state.caseType,photo:!!__kp.state.photoImg}));
   check(tag+' Back closes the viewer and keeps the design',!g1.open&&g1.path.endsWith('customizer.html')&&g1.step==='edit'&&g1.ct==='Rated Case'&&g1.photo&&g1.focus==='ratedPhotosOpen',g1);
   /* 11. On other phones */
   await openViewer(page);await page.locator('#ratedGallery [data-set="other"]').click();await shown(page);v=await view(page);
   const other=await page.evaluate(()=>[...document.querySelectorAll('#ratedGallery .rg-thumb')].map(t=>t.getAttribute('aria-label')));
   check(tag+' On other phones shows '+v.thumbs+' photos in the same viewer',v.set==='other'&&v.thumbs>=8&&v.count==='1 of '+v.thumbs&&v.natural===1000&&!!v.note&&!/studio/i.test(v.note),v);
   check(tag+' On other phones shows every phone but this one',other.length===manifest.other.filter(o=>o.key!=='iph17pmx').length&&!other.some(t=>/: iPhone 17 Pro Max ·/.test(t)),other);
   check(tag+' On other phones says what it shows, true for phones we sell',v.note==='The same case on other phones and colors.',v.note);
   if(!phone)check(tag+' On other phones fits beside the photo without scrolling (facts in view)',v.sideScroll<=1,v.sideScroll);
   const or=await page.evaluate(()=>({label:document.getElementById('rgRimLabel').textContent,rims:[...document.querySelectorAll('#ratedGallery .rg-rim')].filter(b=>b.getClientRects().length).map(b=>b.textContent),
    choose:document.querySelector('#ratedGallery .rg-choose').getBoundingClientRect().top,chips:document.querySelector('#ratedGallery .rg-rims').getBoundingClientRect().bottom}));
   check(tag+' On other phones keeps this phone\'s rim chips beside Choose',!v.rimsHidden&&or.label==='Rim for your iPhone 17 Pro Max'&&or.rims.join()==='Smoke Frost,Clear Frost'&&or.chips<=or.choose+1,or);
   check(tag+' other phones captions free of dashes and brand names',other.every(t=>!DASH.test(t)&&!BRAND.test(t))&&!DASH.test(v.caption)&&!BRAND.test(v.alt),other);
   check(tag+' Choose still refers to this phone and rim while viewing other phones',v.choose==='Back to my design'&&v.sub==='On iPhone 17 Pro Max',v);
   const seen=[];for(let k=0;k<v.thumbs;k++){await shown(page);const w=await view(page);seen.push(w.natural===1000&&!w.msg?w.caption:'FAILED '+w.caption);await page.locator('#ratedGallery .rg-next').click();}
   check(tag+' every other phones photo loads in the viewer',seen.every(s=>!s.startsWith('FAILED'))&&new Set(seen).size===v.thumbs,seen);
   /* a rim chip on this tab changes the rim Choose names, and the other phones photo stays */
   await page.locator('#ratedGallery .rg-thumb').nth(7).click();await shown(page);
   await page.locator('#ratedGallery [data-rim="Clear Frost"]').click();await shown(page);v=await view(page);
   check(tag+' a rim chip on On other phones changes Choose and keeps the photo',v.set==='other'&&v.count==='8 of '+v.thumbs&&v.choose==='Choose Rated Case · Clear Frost'&&v.rims.join()==='Smoke Frost,Clear Frost*',v);
   await page.locator('#ratedGallery [data-rim="Smoke Frost"]').click();
   await page.locator('#ratedGallery .rg-thumb').nth(2).click();await shown(page);
   await shot(page,engine+'-'+width+'-viewer-other-phones');
   if(phone){
    await page.locator('#ratedGallery .rg-thumb').nth(1).focus();
    const fr=await page.evaluate(()=>{const t=document.activeElement.getBoundingClientRect(),s=document.querySelector('#ratedGallery .rg-thumbs').getBoundingClientRect();return {top:Math.round(t.top-s.top),bottom:Math.round(s.bottom-t.bottom),ring:getComputedStyle(document.activeElement).outlineWidth};});
    check(tag+' a focused thumbnail\'s ring fits inside the strip',fr.top>=5&&fr.bottom>=5,fr);
   }
   await page.locator('#ratedGallery .rg-close').click();await settledClose(page);
   check(tag+' Close closes and focus returns',await page.evaluate(()=>!KPRatedGallery.isOpen&&document.activeElement.id==='ratedPhotosOpen'));
   /* 12. reopening follows a new phone: one rim, both rims, similar phones, Rated only phones of every brand, and none for
      a phone without a Rated kit */
   await setModel(page,'iPhone 14 Plus');
   await openViewer(page);v=await view(page);
   check(tag+' reopening follows the new phone (iPhone 14 Plus, Clear Frost only)',v.sub==='On iPhone 14 Plus'&&v.rims.join()==='Clear Frost(only)'&&/rp-iph14max-clear-angle/.test(v.src)&&v.set==='mine'&&v.count==='1 of 5'&&v.facts.includes('Frosted rim in Clear Frost'),v);
   const one=await page.evaluate(()=>{const c=getComputedStyle(document.querySelector('#ratedGallery .rg-rim-only'));return {style:c.borderTopStyle,color:c.borderTopColor,bg:c.backgroundColor};});
   check(tag+' a single rim looks chosen, not dimmed',one.style==='solid'&&one.color==='rgb(206, 32, 43)'&&one.bg==='rgb(255, 245, 242)',one);
   await page.keyboard.press('Escape');await settledClose(page);
   await setModel(page,'iPhone 16');await openViewer(page);v=await view(page);
   check(tag+' iPhone 16 comes in both rims, Smoke Frost photos first',v.sub==='On iPhone 16'&&v.rims.join()==='Smoke Frost*,Clear Frost'&&/rp-iph16-smoke-angle/.test(v.src)&&v.count==='1 of 5'&&!v.note&&v.choose==='Back to my design',v);
   await page.keyboard.press('Escape');await settledClose(page);
   if(!phone){
    await setModel(page,'iPhone 15');await openViewer(page);v=await view(page);
    check(tag+' a phone shown on a similar model says so (iPhone 15)',v.sub==='On iPhone 15'&&v.note==='Photos show this case on a similar iPhone.'&&/rp-iphse25-/.test(v.src),v);
    await page.keyboard.press('Escape');await settledClose(page);
   }
   /* model, rims (first is the one this phone opens on), first photo, number of photos, note; brands are left out of names */
   const LIST=[['Samsung Galaxy S26','Smoke Frost*,Clear Frost','samgs26-smoke-side',3,''],['iPhone 13 Pro Max','Smoke Frost*,Clear Frost','iph2167-smoke-angle',5,''],['iPhone 12 Pro','Clear Frost(only)','iph1261-clear-angle',5,'Photos show this case on a similar iPhone.'],
    ['Google Pixel 11 Pro','Clear Frost(only)','googpl11-clear-angle',5,'',1],['Google Pixel 10','Clear Frost(only)','googpl10p10-clear-side',3,'',1],['Motorola moto g stylus 2026','Smoke Frost*,Clear Frost','motgstl26-smoke-side',3,'',1],
    ['Motorola moto g 2025','Smoke Frost*,Clear Frost','motgply25-smoke-side',3,'Photos show this case on a similar phone.',1],['Samsung Galaxy A17','Clear Frost(only)','samga17-clear-side',3,'',1],['Samsung Galaxy A36','Clear Frost(only)','samga37-clear-side',3,'Photos show this case on a similar phone.',1],
    ['Samsung Galaxy S25 Plus','Smoke Frost*,Clear Frost','samgs26pl-smoke-angle',5,'Photos show this case on a similar phone.',1],['iPhone 17e','Smoke Frost*,Clear Frost','iphse25-smoke-angle',5,'',1],['iPhone Duo','Smoke Frost(only)','iph18fld-smoke-side',3,'',1]];
   for(const [model,rims,first,count,note,only] of phone?LIST.filter(l=>/Pixel 11|stylus|A17|S25 Plus|Duo/.test(l[0])):LIST){
    await setModel(page,model);await openViewer(page);v=await view(page);
    check(tag+' '+model+': its own photos, rims and note',v.sub==='On '+model.replace(/^(Samsung|Google|Motorola) /,'')&&v.rims.join()===rims&&v.src.includes('rp-'+first+'.webp')&&v.count==='1 of '+count&&v.natural===1000&&v.note===note,v);
    const drop=v.facts.includes('20 ft drop protection'),claims=v.facts.filter(t=>/drop|\bft\b|feet|protect|shock|military|warranty/i.test(t));
    check(tag+' '+model+(model==='iPhone Duo'?': no drop claim':': 20 ft drop protection')+', availability beside it',drop===(model!=='iPhone Duo')&&claims.length===(drop?1:0)&&v.facts.includes('Confirm availability in store')&&!v.facts.some(t=>/white/i.test(t)),v.facts);
    if(only)check(tag+' '+model+' (Rated Case only): already chosen, so Back to my design',v.choose==='Back to my design'&&await page.evaluate(()=>__kp.state.caseType==='Rated Case'),v.choose);
    if(only&&/S25 Plus/.test(model)){
     await page.locator('#ratedGallery [data-rim="Clear Frost"]').click();await shown(page);v=await view(page);
     check(tag+' Rated Case only: another rim is chosen by its name',v.choose==='Choose Clear Frost'&&v.caption==='Front and back · Clear Frost',v);
     await page.locator('#ratedGallery .rg-choose').click();await page.waitForFunction(()=>KPStudioCore.info().rim==='Clear Frost',null,{timeout:6000}).catch(()=>{});await settled(page);await settledClose(page);
     const rr=await page.evaluate(()=>({ct:__kp.state.caseType,rim:KPStudioCore.info().rim,total:document.getElementById('studioTotal').textContent,chip:document.querySelector('#studioRim input[value="Clear Frost"]')?.checked,open:KPRatedGallery.isOpen,q:new URLSearchParams(location.search).get('rim')}));
     check(tag+' Rated Case only: Choose changes the rim, the case and price stay',!rr.open&&rr.ct==='Rated Case'&&rr.rim==='Clear Frost'&&rr.total==='$49.99'&&rr.chip&&rr.q==='Clear Frost',rr);
     await openViewer(page);v=await view(page);
     check(tag+' Rated Case only: reopens on that rim with Back to my design',v.rims.join()==='Smoke Frost,Clear Frost*'&&v.choose==='Back to my design',v);
     await page.locator('#ratedGallery [data-rim="Smoke Frost"]').click();await page.locator('#ratedGallery .rg-choose').click();await page.waitForFunction(()=>KPStudioCore.info().rim==='Smoke Frost',null,{timeout:6000}).catch(()=>{});await settled(page);await settledClose(page);
    }else{
     if(model==='Google Pixel 10'){
      await page.locator('#ratedGallery [data-set="other"]').click();await shown(page);
      const o=await page.evaluate(()=>[...document.querySelectorAll('#ratedGallery .rg-thumb')].map(t=>t.getAttribute('aria-label')));
      check(tag+' On other phones leaves out this phone (its photos are under Your phone)',o.length===manifest.other.length-1&&!o.some(t=>/: Pixel 10 ·/.test(t))&&o.some(t=>/: Pixel 11 ·/.test(t)),o);
     }
     await shot(page,engine+'-'+width+'-'+model.replace(/ /g,'-'));
     await page.keyboard.press('Escape');await settledClose(page);
    }
   }
   /* Galaxy S25 and S24: no Smoke Frost photo can be shown, so that rim shows the Clear Frost photos and says so */
   for(const [model,like] of [['Samsung Galaxy S25',''],['Samsung Galaxy S24',' on a similar phone']]){
    await setModel(page,model);await openViewer(page);v=await view(page);
    check(tag+' '+model+' Smoke Frost: Clear Frost photos under their own captions, with a note',v.rims.join()==='Smoke Frost*,Clear Frost'&&v.caption==='Front and back · Clear Frost'&&/rp-samgs24-clear-angle/.test(v.src)&&v.count==='1 of 5'&&/Clear Frost rim/.test(v.alt)
     &&v.note==='Photos show Clear Frost'+like+'. Smoke Frost is the same case with a dark rim.'&&v.choose==='Back to my design',v);
    await shot(page,engine+'-'+width+'-'+model.replace(/ /g,'-')+'-smoke');
    await page.locator('#ratedGallery .rg-next').click();await page.locator('#ratedGallery [data-rim="Clear Frost"]').click();await shown(page);v=await view(page);
    check(tag+' '+model+' Clear Frost: the same photos, no rim note',v.caption==='Side view · Clear Frost'&&v.count==='2 of 5'&&v.note===(like?'Photos show this case on a similar phone.':'')&&v.choose==='Choose Clear Frost',v);
    await page.locator('#ratedGallery [data-rim="Smoke Frost"]').click();v=await view(page);
    check(tag+' '+model+' back on Smoke Frost keeps the photo',v.count==='2 of 5'&&/Smoke Frost is the same case/.test(v.note),v);
    await page.keyboard.press('Escape');await settledClose(page);
   }
   /* Galaxy S24 Ultra: not selectable while it is in COMING_SOON; once it is offered it has no photos, so no button */
   if(/var COMING_SOON=\{[^}]*S24 Ultra/.test(fs.readFileSync(path.join(root,'customizer.html'),'utf8')))check(tag+' a phone listed as coming soon cannot be picked (Galaxy S24 Ultra)',await page.evaluate(()=>{const o=[...document.getElementById('modelSel').options].find(o=>/S24 Ultra/.test(o.textContent));return !!o&&o.disabled;}));
   else{await setModel(page,'Samsung Galaxy S24 Ultra');check(tag+' a Rated phone without photos shows no See photos button (Galaxy S24 Ultra)',await page.evaluate(()=>{const b=document.getElementById('ratedPhotosOpen');return KPStudioCore.info().ratedAvailable&&(!b||b.hidden||!b.getClientRects().length);}));}
   await setModel(page,'iPhone 12 mini');await page.waitForTimeout(200);
   check(tag+' no button for a phone without a Rated kit (iPhone 12 mini)',await page.evaluate(()=>document.getElementById('ratedPhotosOpen').hidden&&document.getElementById('studioCase').hidden));
   /* a rim chosen here on a Rated only phone does not turn the customer's clear case into a Rated Case on the next phone: the
      address keeps case=clear with the rim, and the clear case comes back with a message */
   const toast=()=>page.evaluate(()=>(document.getElementById('kpToast')||{}).textContent||'');
   /* Rated Case is the wording inside the viewer only: around it the editor says Frost case or the rim's name */
   const rated=()=>page.evaluate(()=>['#studio-phone .studio-help','#studioCase','#studioPhone','#kpToast'].map(s=>document.querySelector(s).textContent).filter(t=>/Rated Case/.test(t)));
   await setModel(page,'iPhone 17');await pickCase(page,'MagSafe Clear');
   await setModel(page,'Motorola moto g power 2026');
   check(tag+' a Rated only phone says it comes in a frost case',/This phone comes in a frost case\. Your case is now \$49\.99\./.test(await toast()),await toast());
   check(tag+' the Phone tool, case choice, header and messages never say Rated Case (frost case only)',!(await rated()).length,await rated());
   await openViewer(page);
   await page.locator('#ratedGallery [data-rim="Clear Frost"]').click();await page.locator('#ratedGallery .rg-choose').click();
   await page.waitForFunction(()=>KPStudioCore.info().rim==='Clear Frost',null,{timeout:6000}).catch(()=>{});await settledClose(page);
   const mp=await page.evaluate(()=>({ct:__kp.state.caseType,head:document.getElementById('studioPhone').textContent,q:['case','rim'].map(k=>new URLSearchParams(location.search).get(k))}));
   check(tag+' the address keeps the clear case choice beside the rim of a Rated only phone',mp.ct==='Rated Case'&&mp.head==='Motorola moto g power 2026 · Clear Frost'&&mp.q.join()==='clear,Clear Frost',mp);
   await setModel(page,'iPhone 17');
   check(tag+' a rim chosen on a Rated Case only phone keeps the clear case for the next phone',mp.ct==='Rated Case'&&await page.evaluate(()=>__kp.state.caseType==='MagSafe Clear'&&document.getElementById('studioTotal').textContent==='$44.99'),mp);
   check(tag+' the clear case comes back with a message',/Your case is the clear case again at \$44\.99\./.test(await toast()),await toast());
   /* a customer on the frost case keeps it, and the rim where the next phone has it */
   await pickCase(page,'Rated Case');await pickRim(page,'Clear Frost');await setModel(page,'Motorola moto g power 2026');await setModel(page,'iPhone 17');
   const fk=await page.evaluate(()=>({ct:__kp.state.caseType,rim:KPStudioCore.info().rim,total:document.getElementById('studioTotal').textContent}));
   check(tag+' a customer on the frost case keeps it and the rim across a Rated only phone',fk.ct==='Rated Case'&&fk.rim==='Clear Frost'&&fk.total==='$49.99',fk);
   check(tag+' the Phone tool, case choice, header and messages never say Rated Case (both cases offered)',!(await rated()).length,await rated());
   check(tag+' no page errors',!errors.length,errors);
   await ctx.close();
   /* 13. a photo that cannot load (offline) shows a message, not a broken image; Choose still works (from the clear case) */
   {
    const c2=await browser.newContext({viewport:{width,height:phone?844:900},isMobile:phone,hasTouch:phone,serviceWorkers:'block',reducedMotion:'reduce'});const p2=await c2.newPage();const e2=[];await hooked(p2,e2);
    await p2.route(/rated-photos\/rp-iph17pro-.*\.webp/,r=>r.abort());
    await p2.goto(base+'customizer.html?model=iphone-17-pro&design='+DESIGN+'&case=clear');await editorReady(p2);await settled(p2);await photosReady(p2);
    const oc=await p2.evaluate(()=>__kp.state.caseType);
    await p2.waitForFunction(()=>document.getElementById('ratedPhotosOpen').classList.contains('rg-open-nopic'),null,{timeout:6000}).catch(()=>{});
    const ob=await p2.evaluate(()=>{const b=document.getElementById('ratedPhotosOpen'),i=b.querySelector('img');return {hidden:b.hidden,img:i.hidden,slot:getComputedStyle(b.querySelector('.rg-open-pic')).display,h:Math.round(b.getBoundingClientRect().height),pad:getComputedStyle(b).paddingLeft===getComputedStyle(b).paddingRight};});
    check(tag+' button stays clean when its thumbnail cannot load (no empty picture slot)',!ob.hidden&&ob.img&&ob.slot==='none'&&ob.h===44&&ob.pad,ob);
    await openViewer(p2);await p2.waitForFunction(()=>!document.querySelector('#ratedGallery .rg-msg').hidden,null,{timeout:6000}).catch(()=>{});v=await view(p2);
    check(tag+' a photo that cannot load shows a short message',/could not load\. Check your connection/.test(v.msg)&&v.imgHidden,v);
    await p2.locator('#ratedGallery .rg-next').click();
    check(tag+' reduced motion: no slide animation',await p2.evaluate(()=>document.querySelector('#ratedGallery .rg-img').getAnimations().length===0));
    await p2.locator('#ratedGallery .rg-choose').click();await p2.waitForFunction(()=>__kp.state.caseType==='Rated Case',null,{timeout:6000}).catch(()=>{});
    check(tag+' Choose works while photos are offline',oc==='MagSafe Clear'&&await p2.evaluate(()=>__kp.state.caseType==='Rated Case'&&KPStudioCore.info().rim==='Smoke Frost'&&document.getElementById('studioTotal').textContent==='$49.99'));
    check(tag+' no page errors (offline photos)',!e2.length,e2);
    await c2.close();
   }
   /* 14. shared kiosk: no links, the idle reset closes it and forgets the phone */
   {
    const c3=await browser.newContext({viewport:{width,height:phone?844:900},isMobile:phone,hasTouch:phone,serviceWorkers:'block'});const p3=await c3.newPage();const e3=[];await hooked(p3,e3);
    let purge=null;await p3.exposeFunction('__rgPurgeSeen',s=>{purge=s;});
    await p3.addInitScript(()=>document.addEventListener('kp:editor-purge',()=>queueMicrotask(()=>{const d=document.getElementById('ratedGallery'),b=document.getElementById('ratedPhotosOpen');window.__rgPurgeSeen({open:!!d&&d.open,img:d?d.querySelector('.rg-img').getAttribute('src'):null,thumbs:d?d.querySelectorAll('.rg-thumb').length:-1,opener:b?b.hidden:null});})));
    await p3.route(/rp-iph17pmx-smoke-side(-hd)?\.webp/,r=>r.abort());
    await p3.clock.install();
    await p3.goto(base+'customizer.html?kiosk=1&store='+encodeURIComponent(STORE)+'&model='+MODEL+'&design='+DESIGN);await editorReady(p3);await settled(p3);await photosReady(p3);
    await openViewer(p3);await p3.locator('#ratedGallery .rg-next').click();
    await p3.waitForFunction(()=>!document.querySelector('#ratedGallery .rg-msg').hidden,null,{timeout:6000}).catch(()=>{});v=await view(p3);
    check(tag+' kiosk: a photo that cannot load points to a team member',/could not load\. Try again or ask a team member\./.test(v.msg)&&!/connection/.test(v.msg),v.msg);
    await p3.locator('#ratedGallery [data-set="other"]').click();v=await view(p3);
    check(tag+' kiosk: viewer and button carry no links',v.anchors===0&&await p3.evaluate(()=>document.getElementById('ratedPhotosOpen').tagName==='BUTTON'&&!document.getElementById('ratedPhotosOpen').closest('a')));
    await shot(p3,engine+'-'+width+'-kiosk-viewer');
    await p3.clock.fastForward(181000);
    await p3.waitForURL(/instore\//,{timeout:15000}).catch(()=>{});
    check(tag+' kiosk idle reset closes the viewer and clears it',!!purge&&!purge.open&&!purge.img&&purge.thumbs===0&&purge.opener===true,purge);
    check(tag+' kiosk idle reset leaves for the in-store start',/instore\//.test(p3.url()),p3.url());
    check(tag+' no page errors (kiosk)',!e3.length,e3);
    await c3.close();
   }
  }
  /* 16. short landscape phones keep a real photo beside the choices; the in-store iPad and high density screens load the
     1600 x 1920 file (more than 15% bigger than 1000 x 1200 on screen), phones the 1000 x 1200 one */
  for(const [w,h,dpr] of [[667,375,2],[568,320,2],[844,390,3],[390,844,3],[820,1180,2]]){
   const tag=engine+' '+w+'x'+h+'@'+dpr;
   const c5=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:dpr,isMobile:true,hasTouch:true,serviceWorkers:'block'});const p5=await c5.newPage();const e5=[];await hooked(p5,e5);
   await p5.goto(base+'customizer.html?model='+MODEL+'&design='+DESIGN);await editorReady(p5);await settled(p5);await photosReady(p5);
   /* since #93 a phone on its side has no room for the buttons under the case, so its viewer is opened from the page */
   if(h<400){await p5.evaluate(()=>KPRatedGallery.open());await p5.waitForFunction(()=>KPRatedGallery.isOpen&&document.querySelector('#ratedGallery .rg-thumb'),null,{timeout:10000});await shown(p5);}else await openViewer(p5);
   const r=await p5.evaluate(()=>{const d=document.getElementById('ratedGallery'),box=s=>{const r=d.querySelector(s).getBoundingClientRect();return {t:Math.round(r.top),b:Math.round(r.bottom),l:Math.round(r.left),r:Math.round(r.right),w:Math.round(r.width),h:Math.round(r.height)};};
    const hit=s=>{const e=d.querySelector(s),r=e.getBoundingClientRect(),x=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return !!x&&e.contains(x);};
    const f=box('.rg-frame'),i=d.querySelector('.rg-img');
    return {frame:f,drawnH:Math.round(Math.min(f.h,f.w*6/5)),cap:box('.rg-cap'),thumbs:box('.rg-thumbs'),choose:hit('.rg-choose'),close:hit('.rg-close'),next:hit('.rg-next'),src:i.getAttribute('src'),need:Math.round(Math.min(f.w,f.h*5/6)*devicePixelRatio),vh:innerHeight};});
   if(w>h&&h<=560)check(tag+' short landscape: the photo keeps real room beside the choices',r.drawnH>=150&&r.frame.r<=r.thumbs.l&&r.cap.b<=r.vh&&r.cap.t>=r.frame.b-1&&r.choose&&r.close&&r.next,r);
   const hd=/-hd\.webp/.test(r.src);
   check(tag+' loads the '+(hd?'1600 x 1920':'1000 x 1200')+' file for a photo drawn '+r.need+' device pixels wide',hd===(r.need>1150),r.src);
   await shown(p5);await p5.evaluate(()=>document.querySelector('#ratedGallery .rg-img').decode().catch(()=>{}));await p5.waitForTimeout(150);
   check(tag+' the photo decodes',await p5.evaluate(()=>document.querySelector('#ratedGallery .rg-img').naturalWidth>=1000));
   await shot(p5,engine+'-'+w+'x'+h+'-viewer');
   check(tag+' no page errors',!e5.length,e5);
   await c5.close();
  }
  /* 17. staff fit guides (?cal=1, classic rail): arrow keys in the viewer move the photo only */
  {
   const c6=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});const p6=await c6.newPage();const e6=[];await hooked(p6,e6);
   await p6.goto(base+'customizer.html?model=iphone-17-pro&design='+DESIGN+'&cal=1');await p6.waitForFunction(()=>window.__kp&&window.KPRatedGallery,null,{timeout:20000});await settled(p6);await photosReady(p6);
   const ro=()=>p6.evaluate(()=>document.getElementById('calReadout')?.textContent||'');
   const r0=await ro();
   await p6.locator('#ratedPhotosOpen').scrollIntoViewIfNeeded();await p6.locator('#ratedPhotosOpen').click();await p6.waitForFunction(()=>KPRatedGallery.isOpen);
   await p6.keyboard.press('ArrowRight');await p6.keyboard.press('ArrowRight');await p6.waitForTimeout(200);
   const r1=await ro(),idx=await p6.evaluate(()=>KPRatedGallery.state().index);
   check(engine+' ?cal=1: arrow keys in the viewer leave the staff fit guides alone',r0.length>0&&r1===r0&&idx===2,{r0:r0.slice(0,120),r1:r1.slice(0,120),idx});
   check(engine+' no page errors (?cal=1)',!e6.length,e6);
   await c6.close();
  }
  /* 15. classic ?staff=1 rail: the button under the case cards works and nothing errors */
  {
   const c4=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});const p4=await c4.newPage();const e4=[];await hooked(p4,e4);
   await p4.goto(base+'customizer.html?model=iphone-17-pro&design='+DESIGN+'&staff=1');await p4.waitForFunction(()=>window.__kp&&window.KPRatedGallery,null,{timeout:20000});await settled(p4);await photosReady(p4);
   const s0=await p4.evaluate(()=>{const b=document.getElementById('ratedPhotosOpen');return {hidden:b.hidden,after:b.previousElementSibling&&b.previousElementSibling.id,ct:__kp.state.caseType};});
   await p4.locator('#ratedPhotosOpen').click();await p4.waitForFunction(()=>KPRatedGallery.isOpen);await p4.locator('#ratedGallery [data-rim="Clear Frost"]').click();await p4.locator('#ratedGallery .rg-choose').click();
   await p4.waitForFunction(()=>__kp.state.caseType==='Rated Case',null,{timeout:6000}).catch(()=>{});await settledClose(p4);
   const s1=await p4.evaluate(()=>({ct:__kp.state.caseType,rim:KPStudioCore.info().rim,card:document.getElementById('ctRated').getAttribute('aria-pressed'),open:KPRatedGallery.isOpen}));
   check(engine+' classic staff rail: starts on the clear case, See photos under the case cards, Choose sets the Rated Case',!s0.hidden&&s0.after==='ctRow'&&s0.ct==='MagSafe Clear'&&s1.ct==='Rated Case'&&s1.rim==='Clear Frost'&&s1.card==='true'&&!s1.open,{s0,s1});
   check(engine+' no page errors (staff rail)',!e4.length,e4);
   await c4.close();
  }
  await browser.close();
 }
 if(server)server.close();
 const failed=results.filter(r=>!r.ok);
 console.log((failed.length?'FAIL ':'PASS ')+'rated_photos: '+(results.length-failed.length)+' of '+results.length+' checks passed');
 process.exit(failed.length?1:0);
})().catch(e=>{console.error('FAIL rated_photos crashed: '+(e&&e.stack||e));if(server)server.close();process.exit(1);});
