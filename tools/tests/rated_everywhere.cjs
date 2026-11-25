/* Every phone, everywhere on the storefront: the gallery, the home phone finder, the menu, the store iPad, the print counter and
   the editor must mean the same phones, names, slugs, rims and prices. Customer pages start on the frost case (the Rated Case) on
   every phone that has one: gallery cards and photo links carry case=rated and the rim (case=clear for a phone with no frost).
   A frost only phone reached by a customer who has the clear case keeps case=clear in its address (the phone, not the customer,
   chose that case), so the next phone with a clear case goes back to it. The store iPad shows frost on 20 phones only; every other
   phone there is the clear case.
   The kits in customizer.html are the one list; everything else is compared with it, so a phone added there (or taken out of
   COMING_SOON) fails here until the storefront has it. Also: prices and wording per phone, the coming soon phone cannot be
   picked, the white print area guide never shows as the product, and the print counter reads the rim from the pick code
   (-FS, -FC, no suffix = clear case) and refuses a rim the phone does not come in.
   Chromium and WebKit; layout at 320, 390, 820 and 1440 px. Only the local server is used: web fonts are blocked.
   usage: node tools/tests/rated_everywhere.cjs [outdir]
     KP_BASE=http://127.0.0.1:PORT/  a running server (default: its own)      KP_OUT or KP_SHOTS   folder for screenshots
     KP_PLAYWRIGHT or PW_CORE        a playwright-core folder                 KP_WAIT=ms           longest wait (default 180000)
     KP_ENGINE=chromium|webkit       one browser only                         KP_PART=a,b          only these parts: files layout
                                     counter kiosk gallery names soon editor walk links zoom */
const {chromium,webkit}=require(process.env.KP_PLAYWRIGHT||process.env.PW_CORE||'../../../playwright/node_modules/playwright-core');
const http=require('http'),fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'../..'),WAIT=+process.env.KP_WAIT||180000;
const out=path.resolve(process.argv[2]||process.env.KP_OUT||process.env.KP_SHOTS||'/tmp/keepsake-rated-everywhere');fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2','.pdf':'application/pdf'};
let server=null;
function serve(){return new Promise(r=>{server=http.createServer((req,res)=>{let f=path.join(root,decodeURIComponent(new URL(req.url,'http://local').pathname));if(f.endsWith(path.sep))f+='index.html';if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return}fs.readFile(f,(e,d)=>{if(e){res.writeHead(404).end();return}res.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});res.end(d);});}).listen(0,'127.0.0.1',()=>r('http://127.0.0.1:'+server.address().port+'/'));});}
let pass=0;const bad=[];
function check(name,ok,detail){if(ok){pass++;return;}bad.push(name);console.log('FAIL '+name+(detail===undefined?'':' '+JSON.stringify(detail)));}
const parts=(process.env.KP_PART||'').split(',').filter(Boolean),on=n=>!parts.length||parts.includes(n);
/* a step that stops (a wait that never ends) is tried once more from its start, then counted as one failure; the rest still runs */
async function step(name,fn){for(let go=1;;go++){const p0=pass,b0=bad.length;try{return await fn();}catch(e){const why=String(e&&e.message||e).split('\n').slice(0,3).join(' ');
 if(go<2){pass=p0;bad.length=b0;console.log('again '+name+': '+why);continue;}check(name+' ran to its end',false,why);return;}}}
const read=f=>fs.readFileSync(path.join(root,f),'utf8'),exists=f=>fs.existsSync(path.join(root,f));
const slug=t=>t.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const short=m=>m.replace(/^(Samsung|Google|Motorola) /,''),brandOf=m=>(/^(Samsung|Google|Motorola) /.exec(m)||[0,'Apple'])[1];
const same=(a,b)=>JSON.stringify([...a].sort())===JSON.stringify([...b].sort()),equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

/* the one list: the kits, the menu and the coming soon phones in customizer.html */
const editor=read('customizer.html'),scope=vm.createContext({window:{}});
vm.runInContext(read('assets/phone-finishes.js'),scope);scope.KPPhoneFinishes=scope.window.KPPhoneFinishes;
vm.runInContext(editor.slice(editor.indexOf('  var KITS ='),editor.indexOf('  var printPath=null')),scope);
const menu=vm.runInNewContext('('+editor.slice(editor.indexOf('{',editor.indexOf('var modelsByBrand =')),editor.indexOf('};',editor.indexOf('var modelsByBrand ='))+1)+')');
const soon=Object.keys(vm.runInNewContext('('+/var COMING_SOON=(\{[^}]*\})/.exec(editor)[1]+')'));
const kits=scope.KITS,models=Object.keys(kits),only=models.filter(m=>kits[m].ratedOnly),both=models.filter(m=>kits[m].rated&&!kits[m].ratedOnly),clear=models.filter(m=>!kits[m].rated);
const rimsOf=m=>kits[m].rated?kits[m].rated.colors.map(c=>c.n):[],dropOf=m=>kits[m].rated&&kits[m].rated.dropFt?kits[m].rated.dropFt+' ft drop protection':'';
const cfg=vm.runInNewContext('var window={};'+read('assets/kp-config.js')+';window.KP_CONFIG'),CLEAR='$'+cfg.PRICE.toFixed(2),RATED='$'+cfg.RATED_PRICE.toFixed(2);
const FRAMES=['Smoke Frost','Clear Frost'],CODE={'Smoke Frost':'-FS','Clear Frost':'-FC'},CASE='MagSafe Clear',FROST='Rated Case';
const BRANDS=['Apple','Samsung','Google','Motorola'],BRAND_LINK={Apple:'iPhone',Samsung:'Samsung',Google:'Google Pixel',Motorola:'Motorola'};
/* the phones the store iPad shows in frost (what it showed before the Rated Case reached every phone), and the six it must keep clear */
const KIOSK=['iPhone 13','iPhone 14','iPhone 14 Plus','iPhone 14 Pro','iPhone 14 Pro Max','iPhone 15','iPhone 15 Plus','iPhone 15 Pro','iPhone 15 Pro Max','iPhone 16','iPhone 16 Pro','iPhone 16 Pro Max','iPhone 17','iPhone Air','iPhone 17 Pro','iPhone 17 Pro Max','iPhone 18 Pro','iPhone 18 Pro Max','Galaxy S26','Galaxy S26 Ultra'];
const KIOSK_CLEAR=['iPhone 13 Pro','iPhone 13 Pro Max','iPhone 16 Plus','iPhone 12','iPhone 12 Pro','Galaxy S26 Plus'];
const store=JSON.parse(read('instore/models.json')).models,kitOf=name=>models.find(m=>short(m)===name);
/* what one phone's price line says */
const priceLine=m=>!m?'Clear '+CLEAR+' · Frost '+RATED+' · Made in store.':!kits[m].rated?'Clear case '+CLEAR+' · Made in store.':
 (kits[m].ratedOnly?'Frost case '+RATED+' · ':'Clear '+CLEAR+' · Frost '+RATED+(dropOf(m)?' with ':' · '))+(dropOf(m)?dropOf(m)+' · ':'')+'Confirm availability in store.';
/* a phone dropped from the kits would otherwise pass quietly everywhere below */
check('26 phones come in both cases, 3 in the clear case only, 29 are frost only or coming soon',both.length===26&&same(clear.map(short),['iPhone 12 Pro Max','iPhone 12 mini','iPhone 13 mini'])&&only.length===28&&soon.length===1&&models.length===57,{both:both.length,clear,only:only.length,soon});
check('the 20 iPad frost phones and the 6 it keeps clear are the 26 with both cases',same(KIOSK.concat(KIOSK_CLEAR),both.map(short)));
check('every phone with a clear case is a store phone, and no other',same(store.map(r=>r.name),both.concat(clear).map(short)),store.map(r=>r.name));
check('both case prices and availability are clear without an unverified drop claim',both.every(m=>priceLine(m)==='Clear $44.99 · Frost $49.99 · Confirm availability in store.'));
check('printing a Rated Case stays locked',cfg.RATED_PRINT_READY===false&&models.every(m=>!kits[m].rated||kits[m].rated.template!=='measured'));

/* ---- files ---- */
const win={};vm.runInNewContext(read('assets/rated-phones.js')+read('assets/rated-camera-geometry.js')+read('assets/frost-cases.js'),{window:win});
const listed=win.KP_RATED_PHONES,samples=win.KPFrostSamples,rimList=m=>kits[m].rated.colors.map(({n,h,f,edge})=>({n,h,f,edge}));
/* the whole answer KPFrostSamples must give for one phone and rim, from its kit */
const expected=(m,rim)=>{const k=kits[m];if(!k||!k.rated)return null;const c=k.rated.colors.find(x=>x.n===rim)||k.rated.colors[0];return {key:k.rated.cameraKey,rim:c.n,edge:c.edge||0,type:FROST,price:cfg.RATED_PRICE,photo:c.f,mask:k.rated.view,only:!!k.ratedOnly};};
if(on('files')){
 check('rated-phones.js lists exactly the Rated only kits',same(Object.keys(listed.only),only.map(short)));
 check('rated-phones.js lists exactly the kits with both cases',same(Object.keys(listed.both),both.map(short)));
 only.forEach(m=>{const k=kits[m],r=listed.only[short(m)]||{};
  check('rated-phones.js matches the kit: '+m,r.brand===brandOf(m)&&r.mask===k.view&&r.back===k.colors[0].h&&!!r.flat===!!k.rated.flatPanel&&r.drop===(k.rated.dropFt||0)&&equal(r.rims,rimList(m)),r);});
 both.forEach(m=>{const k=kits[m],r=listed.both[short(m)]||{};
  check('rated-phones.js matches the kit: '+m,equal(r,{key:k.rated.cameraKey,mask:k.rated.view,drop:k.rated.dropFt||0,rims:rimList(m)}),r);
  check('camera of '+m+' is in rated-camera-geometry.js',!!(win.KPRatedCameraGeometry[r.key]&&win.KPRatedCameraGeometry[r.key].rows.length));});
 models.filter(m=>kits[m].rated).forEach(m=>check('mask and case photos exist: '+m,exists('assets/masks/'+kits[m].rated.view)&&kits[m].rated.colors.every(c=>exists('assets/cases/'+c.f)),rimList(m)));
 /* KPFrostSamples.config: the same kits, for every phone, rim and name form */
 models.forEach(m=>{const names=[...new Set([m,short(m)])];
  for(const rim of [null,...FRAMES])check('KPFrostSamples.config agrees with the kit: '+m+' '+(rim||'first rim'),names.every(n=>equal(samples.config(n,null,rim),expected(m,rim))),samples.config(m,null,rim));
  for(const file of ['ocean-photo-turtle-glide.jpg','rain-photo-midnight-window.jpg'])check('KPFrostSamples.config on a frost sample design: '+m+' '+file,equal(samples.config(m,file),expected(m,/turtle/.test(file)?'Clear Frost':'Smoke Frost'))&&equal(samples.config(m,file,'Smoke Frost'),expected(m,kits[m].rated&&rimsOf(m).includes('Smoke Frost')?'Smoke Frost':/turtle/.test(file)?'Clear Frost':'Smoke Frost')),samples.config(m,file));
 });
 check('KPFrostSamples.config has nothing for a phone without a kit or an odd name',[...soon,...soon.map(short),'Google Pixel 9','iPhone 99','','constructor','__proto__','toString',null,undefined].every(n=>samples.config(n,null,'Smoke Frost')===null&&samples.counter(n,'Smoke Frost')===null));
 check('KPFrostSamples.config: an unknown rim is answered with one the phone has',models.filter(m=>kits[m].rated).every(m=>rimsOf(m).includes(samples.config(m,null,'Gold').rim)));
 /* KPFrostSamples.counter: a kit only for the 20 iPad phones */
 check('KPFrostSamples.counter answers for exactly the 20 iPad phones',same(models.filter(m=>samples.counter(m)).map(short),KIOSK),models.filter(m=>samples.counter(m)).map(short));
 models.forEach(m=>{for(const rim of [undefined,...FRAMES])check('KPFrostSamples.counter: '+m+' '+(rim||'first rim'),[m,short(m)].every(n=>equal(samples.counter(n,rim),KIOSK.includes(short(m))?expected(m,rim):null)),samples.counter(m,rim));});
 const home=read('index.html'),finder=/<select id="homeDevice"[\s\S]*?<\/select>/.exec(home)[0];
 const groups=[...finder.matchAll(/<optgroup label="([^"]+)">(.*?)<\/optgroup>/g)].map(g=>({brand:g[1],options:[...g[2].matchAll(/<option value="([^"]+)">([^<]+)<\/option>/g)].map(o=>[o[1],o[2]])}));
 check('home finder: one group per brand, in order',groups.map(g=>g.brand).join()===BRANDS.join(),groups.map(g=>g.brand));
 groups.forEach(g=>check('home finder: '+g.brand+' phones and slugs',same(g.options.map(o=>o.join('|')),models.filter(m=>brandOf(m)===g.brand).map(m=>slug(short(m))+'|'+short(m)))));
 check('home finder: no phone outside a group, no duplicates',(finder.match(/<option /g)||[]).length-1===models.length&&new Set(groups.flatMap(g=>g.options.map(o=>o[0]))).size===models.length);
 check('coming soon phones are in no storefront list',soon.every(m=>!models.includes(m)&&!home.includes('value="'+slug(short(m))+'"')&&!Object.keys(listed.only).includes(short(m))&&!Object.keys(listed.both).includes(short(m))&&!store.some(r=>r.name===short(m))),soon);
 /* menu: one plain link per brand, no pictures */
 const menuFile=read('assets/shop-menu.js');
 BRANDS.forEach(b=>check('menu shortcut for '+b+' is a plain link',menuFile.includes('<a href="gallery.html?brand='+b+'">'+BRAND_LINK[b]+'</a>')));
 check('menu: no phone pictures left',!/rated-menu/.test(menuFile)&&!exists('assets/rated-menu'));
 /* customer copy: no white back, no vendor, no drop claim without its availability line, no flat $44.99 promise */
 const vendor=/\b(CCK|Nimbus9|Phantom|Balaji)\b|Custom Case Kiosk/i;
 for(const f of ['index.html','gallery.html','checkout.html','instore/index.html','instore/find.html','assets/rated-phones.js','assets/frost-cases.js','assets/shop-menu.js']){const t=read(f);
  check('no vendor name and no white back wording: '+f,!vendor.test(t)&&!/white back/i.test(t));}
 check('counter page names frost price and confirms fit in store',/Frost cases are \$49.99/.test(read('checkout.html')) && /confirms availability and fit at the counter/.test(read('checkout.html')) && !/20 ft drop protection/.test(read('checkout.html')));
 for(const f of ['ocean-and-rain.html','parks-rugged.html','instore/index.html','index.html'])check('no "every case is '+CLEAR+'" promise: '+f,!/every (case|design|case design) ?·? ?\$44\.99|Cases \$44\.99,/i.test(read(f)));
 check('home: the bundle total names the clear case',home.includes('$64.98 together with a clear case'));
 check('home and Cherry Duck: no flat $44.99 on the slides, cards or intro',!/in store\. \$44\.99\.<\/p>/.test(home.replace(/Printed on a clear case in store\. \$44\.99\./g,''))&&!/<span>\$44\.99<\/span>/.test(home)&&!/\$44\.99 per case/.test(read('cherry-duck.html')));
 /* every page loads the same menu, so none of them shows a cached one without the Google and Motorola links */
 const pages=fs.readdirSync(root).filter(f=>f.endsWith('.html')).concat('instore/index.html','instore/find.html'),menus=pages.flatMap(f=>[...read(f).matchAll(/shop-menu\.js\?v=([\w-]+)/g)].map(m=>m[1]));
 check('every page loads the same shop-menu.js version ('+menus.length+' pages)',menus.length>=20&&new Set(menus).size===1,[...new Set(menus)]);
 /* frost-cases.js reads the phone list while it loads: the list comes first on every page, in one version */
 for(const f of pages){const t=read(f);if(!t.includes('frost-cases.js'))continue;check(f+': rated-phones.js and the camera shapes load before frost-cases.js',t.indexOf('rated-phones.js')>0&&t.indexOf('rated-phones.js')<t.indexOf('frost-cases.js')&&t.indexOf('rated-camera-geometry.js')>0);}
 for(const file of ['rated-phones.js','frost-cases.js','rated-camera-geometry.js','print-layouts.js']){const v=pages.flatMap(f=>[...read(f).matchAll(new RegExp('src="[^"]*'+file.replace('.','\\.')+'(\\?v=[\\w-]+)?"','g'))].map(m=>m[1]||''));check('one version of '+file,v.length>=3&&new Set(v).size===1,v);}
 const required=/var REQUIRED = \[[\s\S]*?\];/.exec(read('instore/sw.js'))[0];
 check('the store iPad keeps the phone list for offline use',['rated-phones.js','frost-cases.js','rated-camera-geometry.js'].every(f=>required.includes("'../assets/"+f+"'")));
 /* staff size tables: a print size only for phones with a clear case */
 for(const f of ['staff-sop.html','sop-body.html']){const rows=[...read(f).matchAll(/<tr><td>([^<]+)<\/td><td[^>]*>([^<]+)<\/td>/g)].filter(r=>/^[\d.]+$/.test(r[2])).map(r=>r[1]);
  check(f+': no print size for a phone without a clear case, and the Rated Case is not printed',rows.length>20&&!rows.some(r=>only.some(m=>m===r||short(m)===r))&&/<b>Rated Case:<\/b> do not print one/.test(read(f)),rows.filter(r=>only.some(m=>m===r||short(m)===r)));}
}

const sizes=[[320,700],[390,844],[820,1180],[1440,950]],HEARTS='clear-mini-hearts-transparent.png';
(async()=>{
 const base=process.env.KP_BASE||await serve();
 for(const engine of [chromium,webkit].filter(x=>!process.env.KP_ENGINE||x.name()===process.env.KP_ENGINE)){
  const tag=engine.name(),b=await engine.launch(),errors=[];
  async function open(w,h){
   const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:w<900,isMobile:w<900,reducedMotion:'reduce',serviceWorkers:'block'});
   await ctx.route(u=>/^https?:$/.test(u.protocol)&&!/^(127\.0\.0\.1|localhost)$/.test(u.hostname),r=>r.abort());
   const p=await ctx.newPage();p.setDefaultTimeout(WAIT);p.on('pageerror',e=>errors.push(e.message+' '+p.url()));p.__ctx=ctx;
   /* a busy machine: a page that did not answer is asked once more */
   const goto=p.goto.bind(p);p.goto=(u,o)=>goto(u,{waitUntil:'domcontentloaded',...o}).catch(()=>goto(u,{waitUntil:'domcontentloaded',...o}));
   return p;}
  const drawn=p=>p.waitForFunction(()=>document.querySelector('.kpCard canvas')?.dataset.renderedPreview);
  /* measured against the screen asked for: a phone browser's own innerWidth grows with a page that is too wide. The category rail
     under the header is checked on its own (railFits), so one wide rail is one failure and cannot hide another. */
  const overflow=p=>p.evaluate(w=>{const rail=document.querySelector('.ks-shop-rail');if(rail)rail.style.overflowX='clip';const wide=document.documentElement.scrollWidth>w+1;if(rail)rail.style.overflowX='';return wide;},p.viewportSize().width);
  const railFits=async(t,p)=>{const r=await p.locator('.ks-shop-rail').evaluate((e,w)=>[...e.querySelectorAll('a,button')].map(x=>[x.textContent.trim(),x.getBoundingClientRect()]).filter(x=>x[1].width).map(x=>[x[0],Math.round(x[1].left),Math.round(x[1].right)]).filter(x=>x[1]<0||x[2]>w),p.viewportSize().width);check(t+': the category rail fits the screen',!r.length,r);};
  /* the editor's own idea of its phone, case, rim and price */
  const inEditor=p=>p.waitForFunction(()=>window.__kp&&window.KPStudioCore&&__kp.state);
  const ready=p=>p.waitForFunction(()=>window.KPEditor&&window.KPStudioCore&&KPStudioCore.info().previewReady&&!KPStudioCore.info().loading);
  const state=p=>p.evaluate(()=>{const i=KPStudioCore.info(),s=__kp.state;return {model:s.model,brand:s.brand,type:s.caseType,rim:i.rim,total:i.total,drop:i.drop,forced:!!s.ratedForced,browse:document.querySelector('#browseLink').getAttribute('href')};});
  const switchTo=(p,m)=>p.evaluate(([brand,m])=>{const b=document.querySelector('#brandSel'),s=document.querySelector('#modelSel');if(b.value!==brand){b.value=brand;b.dispatchEvent(new Event('change'));}s.value=m;s.dispatchEvent(new Event('change'));},[brandOf(m),m]);
  const toast=(p,text)=>p.waitForFunction(t=>document.querySelector('#kpToast')?.textContent===t,text,{timeout:30000}).then(()=>true,()=>false);
  const address=(p,want)=>p.waitForFunction(w=>{const q=new URLSearchParams(location.search);return Object.keys(w).every(k=>q.get(k)===w[k]);},want,{timeout:30000}).then(()=>true,()=>false);
  const isFrost=(s,m,rim)=>s.model===m&&s.type===FROST&&s.rim===(rim||rimsOf(m)[0])&&s.total===cfg.RATED_PRICE,isClear=(s,m)=>s.model===m&&s.type===CASE&&s.rim===null&&s.total===cfg.PRICE;
  try{
   /* ---- layout, drawer, finder and menu at every width ---- */
   if(on('layout'))for(const [w,h] of sizes){const t=tag+' '+w,p=await open(w,h);
    for(const brand of BRANDS)await step(t+' drawer '+brand,async()=>{
     await p.goto(base+'gallery.html?brand='+brand);await p.locator('#kpDevDrawer [data-pill="'+brand+'"][aria-pressed=true]').waitFor();await p.waitForTimeout(400);
     const d=await p.locator('#kpDevDrawer').evaluate(e=>({rows:[...e.querySelectorAll('[data-md]')].filter(x=>x.dataset.md).map(x=>[x.dataset.md,x.innerText.replace(/\s+/g,' ').trim(),x.scrollWidth<=x.clientWidth+1]),
      pills:[...e.querySelectorAll('[data-pill]')].map(x=>{const r=x.getBoundingClientRect(),q=e.getBoundingClientRect();return [x.dataset.pill,r.height,r.left>=q.left-.5&&r.right<=q.right+.5,x.scrollWidth<=x.clientWidth+1,x.disabled];}),wide:e.scrollWidth>e.clientWidth+1}));
     const want=models.filter(m=>brandOf(m)===brand);
     check(t+' drawer '+brand+': exactly its phones',same(d.rows.map(r=>r[0]),want.map(m=>slug(short(m)))),d.rows.map(r=>r[0]));
     check(t+' drawer '+brand+': frost only phones say so, others do not',d.rows.every(([s,text,fits])=>{const m=want.find(x=>slug(short(x))===s);return m&&fits&&(kits[m].ratedOnly?text===short(m)+' Frost case · '+RATED:text.replace(/ NEW$/,'')===short(m));}),d.rows);
     check(t+' drawer '+brand+': brand buttons at least 44 px, inside, not cut off, none disabled',d.pills.map(x=>x[0]).join()===BRANDS.join()&&d.pills.every(x=>x[1]>=44&&x[2]&&x[3]&&!x[4])&&!d.wide,d.pills);
     check(t+' drawer '+brand+': no page overflow',!await overflow(p));
     await p.screenshot({path:path.join(out,tag+'-drawer-'+brand+'-'+w+'.png')});
    });
    await step(t+' brand buttons',async()=>{await p.goto(base+'gallery.html?brand=Motorola');await p.locator('[data-pill="Samsung"]').click();check(t+' brand buttons switch the list',await p.locator('[data-md="galaxy-s25"]').isVisible()&&await p.locator('[data-md="pixel-10"]').count()===0&&await p.evaluate(()=>document.activeElement.dataset.pill)==='Samsung');});
    await step(t+' home finder',async()=>{
     await p.goto(base);await p.locator('#homeDevice').waitFor();await p.locator('.ks-shop-rail').waitFor();await railFits(t+' home',p);check(t+' home finder fits',!await overflow(p)&&await p.locator('#homeDevice').evaluate(e=>e.getBoundingClientRect().right<=innerWidth));
     check(t+' home: the customer reads Frost case, not Rated Case',!/rated case/i.test(await p.evaluate(()=>document.body.innerText)));
     await p.locator('#homeDevice').selectOption('pixel-10-pro-xl');await Promise.all([p.waitForURL(/gallery\.html\?device=pixel-10-pro-xl(&|$)/,{waitUntil:'domcontentloaded'}),p.locator('.phone-finder button').click()]);
     await p.waitForFunction(()=>document.querySelector('#wizDevBtn strong')?.textContent==='Pixel 10 Pro XL');});
    await step(t+' menu',async()=>{
     await p.goto(base+'gallery.html?device=pixel-10-pro-xl');await p.locator('.kpCard').first().waitFor();await railFits(t+' gallery',p);await p.locator('.ks-menu-toggle:visible,.ks-style-trigger:visible').first().click();await p.locator('#ks-menu-panel .ks-menu-shortcuts').waitFor();
     const links=await p.locator('#ks-menu-panel').evaluate(e=>{const q=e.getBoundingClientRect();return {wide:e.scrollWidth>e.clientWidth+1,rows:[...e.querySelectorAll('.ks-menu-shortcuts a')].map(a=>{const r=a.getBoundingClientRect();return [a.getAttribute('href'),a.textContent,r.height>=44&&r.left>=q.left-.5&&r.right<=q.right+.5&&a.scrollWidth<=a.clientWidth+1,!!a.querySelector('img,svg')];})};});
     check(t+' menu: a plain link per brand, at least 44 px, inside the menu',!links.wide&&equal(links.rows.filter(r=>/\?brand=/.test(r[0])).map(r=>r.slice(0,2)),BRANDS.map(x=>['gallery.html?brand='+x,BRAND_LINK[x]]))&&links.rows.every(r=>r[2]&&!r[3]),links);
     await p.screenshot({path:path.join(out,tag+'-menu-'+w+'.png')});
     for(const brand of ['Google','Motorola']){await p.locator('#ks-menu-panel a[href="gallery.html?brand='+brand+'"]').click();await p.locator('#kpDevDrawer [data-pill='+brand+'][aria-pressed=true]').waitFor();
      check(t+' menu link '+brand+' opens its phones',same(await p.locator('#kpDevDrawer [data-md]').evaluateAll(x=>x.map(e=>e.dataset.md).filter(Boolean)),models.filter(m=>brandOf(m)===brand).map(m=>slug(short(m)))));
      if(brand==='Google'){await p.locator('#kpDwClose').click();await p.waitForFunction(()=>document.querySelector('#kpDevDrawer').inert);await p.locator('.ks-menu-toggle:visible,.ks-style-trigger:visible').first().click();}}});
    for(const s of ['pixel-11','iphone-duo','moto-g-2026','iphone-17-pro','iphone-12-mini'])await step(t+' gallery '+s,async()=>{
     await p.goto(base+'gallery.html?device='+s);await p.locator('.kpCard').first().waitFor();await p.evaluate(()=>scrollTo(0,0));
     const g=await p.evaluate(()=>({top:document.querySelector('#grid').getBoundingClientRect().top,price:document.querySelector('#shopPrice').textContent}));
     check(t+' gallery '+s+': fits, cases in view',!await overflow(p)&&g.top<(w<400?640:620),g);
     const a=await p.locator('.kpCard').first().evaluate(e=>{const c=e.querySelector('canvas').getBoundingClientRect(),q=e.querySelector('.case-zoom-button').getBoundingClientRect();return [c.width,q.width,[...e.querySelectorAll('.cdot,.h-makeone')].every(x=>{const r=x.getBoundingClientRect(),k=e.getBoundingClientRect();return r.left>=k.left-1&&r.right<=k.right+1;})];});
     check(t+' gallery '+s+': card contents stay inside the card',a[2]&&Math.abs(a[0]-a[1])<2,a);
     await p.screenshot({path:path.join(out,tag+'-gallery-'+s+'-'+w+'.png')});
    });
    await p.__ctx.close();
   }
   /* ---- print counter: the pick code carries the rim; no suffix is the clear case ---- */
   if(on('counter')){
    const found=async p=>{await p.waitForFunction(()=>document.querySelector('#res').classList.contains('on')||document.querySelector('#err').classList.contains('on'));return p.evaluate(()=>({on:document.querySelector('#res').classList.contains('on'),err:document.querySelector('#err').classList.contains('on')?document.querySelector('#err').textContent:'',code:document.querySelector('#rcode').textContent,model:document.querySelector('#rmodel').textContent,text:document.querySelector('#res').innerText,price:document.querySelector('#rprice').textContent,open:document.querySelector('#ropen').getAttribute('href'),shown:!!document.querySelector('#ropen').offsetWidth}));};
    const look=async(p,code)=>{await p.locator('#q').fill(code);await p.locator('#f button').click();return found(p);};
    const link=f=>new URL(f.open,base+'instore/find.html').searchParams;
    for(const [w,h] of sizes){const t=tag+' '+w+' counter',p=await open(w,h);
     await step(t,async()=>{
      await p.goto(base+'instore/find.html?code=17P-SCN-131-G-S1');let f=await found(p),q=link(f);
      check(t+': a code without a rim is the clear case with its bundle price',f.on&&f.text.includes('Clear case · '+CLEAR)&&f.price.startsWith('Case + tempered glass · $64.98 · before tax')&&!/Rated|Frost/.test(f.text)&&!q.has('case')&&!q.has('rim')&&q.get('staff')==='1',f);
      check(t+': the old Clear or Rated question is gone',await p.locator('#rcase').count()===0&&!/Clear or Rated/i.test(await p.locator('main').innerText()));
      f=await look(p,'17P-SCN-131-G-S1-FS');q=link(f);
      check(t+': -FS is Smoke Frost with its bundle price',f.on&&f.code==='17P-SCN-131-G-S1-FS'&&f.text.includes('Smoke Frost · '+RATED)&&f.price.startsWith('Case + tempered glass · $69.98 · before tax')&&!/Clear case|44\.99/.test(f.text)&&q.get('case')==='rated'&&q.get('rim')==='Smoke Frost',f);
      check(t+': the page fits with a rim shown',!await overflow(p)&&await p.locator('#ropen').evaluate(e=>e.getBoundingClientRect().right<=innerWidth));
      await p.screenshot({path:path.join(out,tag+'-find-'+w+'.png'),fullPage:true});
      f=await look(p,'12-SCN-131-FS');check(t+': a rim the phone does not come in is refused',!f.on&&!f.shown&&f.err==='Frost case is unavailable for this phone. Confirm the model.'&&!await overflow(p),f);
      f=await look(p,'17P-SCN-131-G-S3-FC');check(t+': after a refusal the next code works, Newark has no sales tax',f.on&&!f.err&&f.text.includes('Clear Frost · '+RATED)&&/\$69\.98 · no sales tax/.test(f.price),f);
     });
     await p.__ctx.close();
    }
    const p=await open(820,1180),reqs=[];p.on('request',r=>reqs.push(r.url()));
    for(const row of store){const m=kitOf(row.name),t=tag+' counter '+row.name;await step(t,async()=>{
     if(!/find\.html/.test(p.url())){await p.goto(base+'instore/find.html');await p.waitForFunction(()=>!document.querySelector('#staffModel').disabled);}
     let f=await look(p,row.id+'-SCN-131'),q=link(f);
     check(t+': no suffix is the clear case',f.on&&f.text.includes('Clear case · '+CLEAR)&&f.price.startsWith('Case · '+CLEAR+' ')&&f.model.startsWith(row.name)&&!/Rated|Frost/.test(f.text)&&!q.has('case')&&!q.has('rim'),f);
     for(const rim of FRAMES){const code=row.id+'-SCN-131'+CODE[rim];f=await look(p,code);q=f.open?link(f):null;
      if(rimsOf(m).includes(rim))check(t+': '+CODE[rim]+' shows the rim and '+RATED+', and opens it',f.on&&!f.err&&f.code===code&&f.text.includes(rim+' · '+RATED)&&f.price.startsWith('Case · '+RATED+' ')&&f.model.startsWith(row.name)&&!/Clear case|44\.99|Rated/.test(f.text)&&!f.text.includes(FRAMES.find(x=>x!==rim))&&q.get('case')==='rated'&&q.get('rim')===rim&&q.get('staff')==='1'&&slug(q.get('model'))===slug(row.name),f);
      else check(t+': '+CODE[rim]+' is refused, nothing to print',!f.on&&!f.shown&&f.err==='Frost case is unavailable for this phone. Confirm the model.',f);}
    });}
    /* the six newly covered phones: their picture is drawn from their own Rated photo */
    for(const name of KIOSK_CLEAR){const m=kitOf(name),id=store.find(r=>r.name===name).id,t=tag+' counter picture '+name;await step(t,async()=>{
     const c=kits[m].rated.colors[0];reqs.length=0;await p.goto(base+'instore/find.html?code='+id+'-SCN-131'+CODE[c.n]);await found(p);
     await p.waitForFunction(()=>{const i=document.querySelector('#rimg');return (i.getAttribute('src')||'').startsWith('blob:')&&i.complete&&i.naturalWidth||/could not load/.test(document.querySelector('#rpreviewStatus').textContent);});
     const status=await p.locator('#rpreviewStatus').textContent();check(t+': drawn on its '+c.n+' case',status===''&&await p.evaluate(()=>document.querySelector('#rimg').naturalWidth>300)&&reqs.some(u=>u.includes('/assets/cases/'+c.f))&&reqs.some(u=>u.includes('/assets/masks/'+kits[m].rated.view)),[status,...reqs.filter(u=>/\/(cases|masks)\//.test(u))]);
     await p.locator('#res').screenshot({path:path.join(out,tag+'-find-'+slug(name)+'.png')});
    });}
    await step(tag+' counter: other ways to type it',async()=>{
     let f=await look(p,'13p scn 131 fs');check(tag+' counter: spaces and small letters carry the rim too',f.on&&f.text.includes('Smoke Frost · '+RATED)&&link(f).get('rim')==='Smoke Frost',f);
     f=await look(p,'16-SCN-131-P2-FC');check(tag+' counter: the phone finish and the rim together',f.on&&f.text.includes('Clear Frost · '+RATED)&&link(f).get('finish')===kits['iPhone 16'].colors[1].n&&link(f).get('rim')==='Clear Frost',f);
     check(tag+' counter: without a code the list holds the store phones only',same((await p.locator('#staffModel option').evaluateAll(x=>x.map(o=>o.value))).filter(Boolean),store.map(r=>r.name)));
     check(tag+' counter: without a code the workspace gets no case, so it opens clear',await p.locator('#staffModel').selectOption('iPhone 13 Pro').then(()=>p.locator('#ownOpen').getAttribute('href'))==='../customizer.html?staff=1&model=iPhone%2013%20Pro');});
    /* from a code to the print workspace: the rim arrives, printing stays locked; no suffix arrives clear */
    for(const [code,m,rim] of [['13PM-SCN-131-FC','iPhone 13 Pro Max','Clear Frost'],['S26PL-SCN-131-FS','Samsung Galaxy S26 Plus','Smoke Frost'],['13PM-SCN-131','iPhone 13 Pro Max',null],['16-SCN-131-FS','iPhone 16','Smoke Frost']]){const t=tag+' counter to workspace '+code;await step(t,async()=>{
     await p.goto(base+'instore/find.html?code='+code);await found(p);await Promise.all([p.waitForURL(/customizer\.html/,{waitUntil:'domcontentloaded'}),p.locator('#ropen').click()]);await inEditor(p);await p.waitForFunction(()=>__kp.state.photoImg&&!__kp.state.libraryLoading&&KPStudioCore.info().previewReady);
     const s=await state(p),issue=await p.evaluate(()=>__kp.staffPrintIssue()||'');
     check(t+': phone, case, rim and price',rim?isFrost(s,m,rim):isClear(s,m),s);
     check(t+(rim?': printing the Rated Case stays locked':': the clear case is not held back by the Rated lock'),/Rated Case printing is waiting/.test(issue)===!!rim,issue);
    });}
    /* the phone list did not load: a rim is refused rather than shown as another case, and clear codes still work */
    await step(tag+' counter: without the phone list',async()=>{
     await p.route('**/rated-phones.js*',r=>r.abort());await p.goto(base+'instore/find.html');await p.waitForFunction(()=>!document.querySelector('#staffModel').disabled);
     let f=await look(p,'17P-SCN-131-FS');check(tag+' counter: without the phone list a rim is refused',!f.on&&!f.shown&&!!f.err,f);
     f=await look(p,'12MN-SCN-131');check(tag+' counter: without the phone list a clear code still works',f.on&&f.text.includes('Clear case · '+CLEAR),f);
     await p.unroute('**/rated-phones.js*');});
    await p.__ctx.close();
   }
   /* ---- store iPad: frost on its 20 phones, the clear case on every other store phone, all the way into the editor ---- */
   if(on('kiosk')){
    const p=await open(820,1180),reqs=[];p.on('request',r=>reqs.push(r.url()));
    const enter=async()=>{await p.goto(base+'instore/?store=West%20Chester%2C%20PA');await p.locator('#phones [data-model]').first().waitFor();};
    const pickPhone=async id=>{await p.locator('#phones [data-model="'+id+'"]').click();await p.locator('#s2.on .tile[data-file]').first().waitFor();await p.waitForTimeout(600);};
    const pickDesign=async()=>{await p.locator('#designSearch').fill('Leo · Star Atlas');await p.waitForFunction(()=>{const x=document.querySelectorAll('#grid .tile[data-file]').length;return x>0&&x<10;});await p.waitForTimeout(500);await p.locator('.tile[data-file="zodiac-atlas-leo.png"] .tname').click();await p.locator('#s3.on').waitFor();await p.waitForTimeout(600);};
    const shown=()=>p.evaluate(()=>{const t=s=>document.querySelector(s).textContent.trim();return {label:t('#kioskRimLabel'),rims:[...document.querySelectorAll('#kioskRims button')].map(b=>b.textContent),rimText:t('#kioskRims'),price:t('#price'),dock:t('#dockTotal'),line:t('#counterCase'),total:t('#cprice'),code:t('#code'),body:document.body.innerText};});
    await step(tag+' kiosk: the phones it offers',async()=>{await enter();
     check(tag+' kiosk: exactly the active store phones, no frost only phone',same(await p.locator('#phones [data-model]').evaluateAll(x=>x.map(e=>e.dataset.model)),store.filter(r=>r.active).map(r=>r.id)));
     check(tag+' kiosk: both prices up front',await p.locator('#casePricePromise').textContent()==='Clear '+CLEAR+' · Frost '+RATED);
     check(tag+' kiosk: the same kits as the editor',equal(await p.evaluate(names=>names.map(n=>KPFrostSamples.config(n)),models),models.map(m=>JSON.parse(JSON.stringify(expected(m,null))))));});
    /* iPhone 13 Pro and 13 Pro Max are in the stores today; the other four are tried with every store phone switched on */
    await p.route('**/instore/config.json*',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({...JSON.parse(read('instore/config.json')),idle_seconds:3600})}));
    for(const row of store){const m=kitOf(row.name),t=tag+' kiosk '+row.name,frost=KIOSK.includes(row.name),rims=frost?FRAMES.filter(r=>rimsOf(m).includes(r)):[];
     await step(t,async()=>{
      await p.unroute('**/instore/models.json*');if(!row.active)await p.route('**/instore/models.json*',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({models:store.map(x=>({...x,active:true}))})}));
      reqs.length=0;await enter();await pickPhone(row.id);await pickDesign();
      const s=await shown();
      if(frost)check(t+': frost, its rims and '+RATED,equal(s.rims,rims)&&s.label===(rims.length>1?'Choose your frost rim':'Available for this phone')&&s.price===RATED&&s.dock===RATED&&s.line===rims[0]+' · '+RATED&&s.code===row.id+'-ZOD-054-S1'+CODE[rims[0]],s);
      else check(t+': the clear case at '+CLEAR+', no rim, plain code',!s.rims.length&&s.rimText==='Clear case'&&s.price===CLEAR&&s.dock===CLEAR&&s.line==='Clear case · '+CLEAR&&s.total.endsWith(CLEAR)&&s.code===row.id+'-ZOD-054-S1',s);
      check(t+': no Rated Case wording',!/rated case/i.test(s.body));
      if(!KIOSK_CLEAR.includes(row.name)&&!['iPhone 16 Pro Max','iPhone 13 mini'].includes(row.name))return;
      await p.waitForFunction(()=>!document.querySelector('#showBtn').disabled);  /* the preview is ready, or it says it could not load */
      /* the phone list draws every frost phone, so only this phone's own photos count */
      const own=reqs.filter(u=>(kits[m].rated?kits[m].rated.colors:[]).some(c=>u.includes('/assets/cases/'+c.f)));check(t+(frost?': drawn on the frost case':': its frost picture is never drawn'),frost?own.some(u=>u.includes(kits[m].rated.colors.find(c=>c.n===rims[0]).f)):!own.length,own);
      const status=await p.locator('#previewStatus').textContent();check(t+': its picture is drawn',status===''&&(await p.locator('#pv').getAttribute('src')||'').startsWith('blob:'),status);
      await p.screenshot({path:path.join(out,tag+'-kiosk-'+slug(row.name)+'.png')});
      await Promise.all([p.waitForURL(/customizer\.html/,{waitUntil:'domcontentloaded'}),p.locator('#personalizeCase').click()]);
      const q=new URL(p.url()).searchParams;check(t+': Make it yours sends '+(frost?'case=rated and the rim':'case=clear and no rim'),q.get('case')===(frost?'rated':'clear')&&q.get('rim')===(frost?rims[0]:null)&&q.get('model')===slug(row.name)&&q.get('kiosk')==='1',p.url());
      await inEditor(p);const e=await state(p);check(t+': the editor opens on it',frost?isFrost(e,m,rims[0]):isClear(e,m),e);
     });
    }
    /* the other two ways from the iPad into the editor (a child's drawing, the night sky) keep that case too */
    for(const act of ['drawing','sky']){const wrong=new Map();
     for(const name of [...KIOSK_CLEAR,'iPhone 13 mini','iPhone 15 Pro']){const row=store.find(r=>r.name===name),m=kitOf(name),t=tag+' kiosk '+name+' '+act;await step(t,async()=>{
      await p.unroute('**/instore/models.json*');if(!row.active)await p.route('**/instore/models.json*',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({models:store.map(x=>({...x,active:true}))})}));
      await enter();await pickPhone(row.id);await Promise.all([p.waitForURL(/customizer\.html/,{waitUntil:'domcontentloaded'}),p.locator('[data-act="'+act+'"]').click()]);await inEditor(p);
      const e=await state(p);if(KIOSK.includes(name))check(t+': the editor opens in frost at '+RATED,isFrost(e,m,rimsOf(m)[0]),{url:p.url(),...e});else if(!isClear(e,m))wrong.set(name,{url:p.url(),type:e.type,rim:e.rim,total:e.total});});}
     check(tag+' kiosk '+act+': a phone the iPad shows in the clear case opens the editor in the clear case at '+CLEAR,!wrong.size,[...wrong]);
    }
    await p.__ctx.close();
   }
   /* ---- every gallery slug ---- */
   const p=await open(1440,950),links={};
   if(on('gallery')||on('editor'))for(const m of models){const k=kits[m],name=short(m),t=tag+' gallery '+name,rims=rimsOf(m);await step(t,async()=>{
    const reqs=[],note=r=>reqs.push(r.url());p.on('request',note);
    try{
    await p.goto(base+'gallery.html?device='+slug(name)+'&q=mini+hearts');await p.locator('.kpCard').first().waitFor();
    const g=await p.evaluate(()=>{const c=document.querySelector('.kpCard');return {phone:document.querySelector('#wizDevBtn strong').textContent,url:new URL(location.href).searchParams.get('device'),price:document.querySelector('#shopPrice').textContent,note:document.querySelector('#deviceNote').hidden,card:c.innerText.replace(/\s+/g,' '),
     dots:[...c.querySelectorAll('.cdot')].map(d=>d.getAttribute('aria-label')),group:c.querySelector('.phone-finishes').getAttribute('aria-label'),href:c.querySelector('.h-makeone').href,photo:[...document.querySelectorAll('.library-photo-cta,.ks-start-case,#mobileMenu a[href^="customizer.html"]')].map(a=>a.href),body:document.body.innerText};});
    const q=new URL(g.href).searchParams;links[m]=g.href;if(!on('gallery'))return;
    check(t+': same phone, kept in the address',g.phone===name&&g.url===slug(name)&&g.note,g);
    check(t+': editor link names the phone',q.get('model')===slug(name));
    check(t+': use your own photo keeps the phone, its case and rim, and comes back',g.photo.length===3&&g.photo.every((h,i)=>{const u=new URL(h),x=u.searchParams,asked=i===1?'Smoke Frost':null;return u.pathname.endsWith('/customizer.html')&&x.get('model')===slug(name)&&new URL(x.get('back'),base).searchParams.get('device')===slug(name)&&x.get('case')===(rims.length?'rated':'clear')&&x.get('rim')===(rims.length?(rims.includes(asked)?asked:rims[0]):null);}),g.photo);
    check(t+': price line',g.price===priceLine(m),g.price);
    check(t+': no Rated Case wording',!/rated case/i.test(g.body));
    if(rims.length)check(t+': link carries case=rated and the rim the card shows',q.get('case')==='rated'&&q.get('rim')===rims[0],g.href);
    else check(t+': no frost, so the link carries no case and no rim',!q.has('case')&&!q.has('rim'),g.href);
    if(k.ratedOnly){
     check(t+': frost price and rim, nothing about clear or a finish',new RegExp('frost case · \\'+RATED,'i').test(g.card)&&!/clear case|magsafe|44\.99|phone finish|white|rated/i.test(g.card)&&g.group==='Rim color'&&!q.has('finish'),g.card);
     check(t+': rims offered',rims.length>1?g.dots.join()===rims.map(r=>'Preview '+r+' rim').join():!g.dots.length&&g.card.includes(rims[0]+' rim'),g.dots);
     /* a transparent design shows the phone's own back color through the panel, never the white guide */
     await drawn(p);const px=await p.locator('.kpCard canvas').first().evaluate(async(c,[mask,back])=>{const im=new Image();im.src='assets/masks/'+mask;await im.decode();const x=document.createElement('canvas');x.width=c.width;x.height=c.height;const g=x.getContext('2d');g.drawImage(im,0,0,c.width,c.height);const k=g.getImageData(0,0,c.width,c.height).data,d=c.getContext('2d').getImageData(0,0,c.width,c.height).data,v=[[],[],[]];
      for(let i=0;i<k.length;i+=4)if(k[i+3]===255)for(let z=0;z<3;z++)v[z].push(d[i+z]);const got=v.map(a=>a.sort((q,w)=>q-w)[a.length>>1]),lit=z=>{const n=parseInt(back.slice(1+z*2,3+z*2),16)*.9777;return n+.0463*(255-n);};return {got,want:[0,1,2].map(z=>Math.round(lit(z)))};},[k.view,k.colors[0].h]);
     check(t+': panel shows the phone back color',px.got.every((v,i)=>v<=px.want[i]+4&&v>=px.want[i]-20),px);  /* the photo may only darken it; the white guide would be lighter */
    }else{
     check(t+': '+(rims.length?'rim and frost price':'clear price and nothing about frost'),rims.length?new RegExp(rims[0]+' · \\'+RATED,'i').test(g.card)&&!/clear case|44\.99|rated/i.test(g.card):new RegExp('clear case · \\'+CLEAR,'i').test(g.card)&&!/frost|rated|49\.99/i.test(g.card),g.card);
     check(t+': phone finishes as before',g.group==='Phone finish'&&g.dots.join()===k.colors.map(c=>'Preview '+c.n+' phone color').join()&&q.get('finish')===k.colors[0].n,[g.dots,g.href]);
     await drawn(p);const shells=reqs.filter(u=>/\/assets\/cases\/rated-/.test(u));
     check(t+(rims.length?': drawn on its '+rims[0]+' photo and panel':': drawn on the clear case'),(rims.length?shells.length&&shells.every(u=>u.includes('/'+k.rated.colors[0].f))&&reqs.some(u=>u.includes('/assets/masks/'+k.rated.view)):!shells.length)&&await p.locator('.kpCard .zoom-hint').first().textContent()==='Zoom',shells);
    }
    }finally{p.off('request',note);}
   });}
   if(on('gallery')){
    /* a design with its own frost sample shows and sends that rim where the phone has it */
    for(const [name,rim] of [['iPhone 13 Pro','Clear Frost'],['iPhone 16 Plus','Clear Frost'],['Galaxy S26 Plus','Clear Frost'],['Galaxy S26','Clear Frost'],['iPhone 12','Clear Frost']]){const t=tag+' gallery sample rim '+name;await step(t,async()=>{
     await p.goto(base+'gallery.html?device='+slug(name)+'&q=turtle+glide');const c=p.locator('.kpCard[data-file="ocean-photo-turtle-glide.jpg"]');await c.waitFor();const q=new URL(await c.locator('.h-makeone').evaluate(a=>a.href)).searchParams;
     check(t,new RegExp(rim+' · \\'+RATED,'i').test(await c.innerText())&&q.get('case')==='rated'&&q.get('rim')===rim,q.toString());});}
    /* choosing another phone in place rewrites the photo links, the cards and the price line; nothing of the last phone stays */
    await step(tag+' gallery: another phone in place',async()=>{
     await p.goto(base+'gallery.html?q=mini+hearts');await p.locator('[data-pick-model]').first().waitFor();
     check(tag+' gallery: no phone, the price line has both cases',await p.locator('#shopPrice').textContent()===priceLine(null));
     for(const m of ['iPhone 12 mini','Google Pixel 10','iPhone 13 Pro','iPhone Duo','iPhone 13 mini','Motorola moto g 2025']){const rims=rimsOf(m);
      await p.locator('#wizDevBtn').click();await p.locator('[data-pill="'+brandOf(m)+'"]').click();await p.locator('[data-md="'+slug(short(m))+'"]').click();await p.waitForFunction(n=>document.querySelector('#wizDevBtn strong').textContent===n,short(m));
      const g=await p.evaluate(()=>({price:document.querySelector('#shopPrice').textContent,photo:document.querySelector('.library-photo-cta').href,head:document.querySelector('.ks-start-case').href,card:document.querySelector('.kpCard .h-makeone').href}));
      const ok=h=>{const x=new URL(h).searchParams;return x.get('model')===slug(short(m))&&x.get('case')===(rims.length?'rated':'clear')&&(rims.length?rims.includes(x.get('rim')):!x.has('rim'));},x=new URL(g.card).searchParams;
      check(tag+' gallery: then '+short(m)+': price line, photo links and card',g.price===priceLine(m)&&ok(g.photo)&&ok(g.head)&&x.get('model')===slug(short(m))&&x.get('case')===(rims.length?'rated':null)&&x.get('rim')===(rims[0]||null),g);}
    });
   }
   /* names people, the editor and old links use */
   if(on('names'))for(const [text,name] of [['Samsung Galaxy S25','Galaxy S25'],['google-pixel-10','Pixel 10'],['motorola-moto-g-2025','moto g 2025'],['iPhone 17 Pro','iPhone 17 Pro'],['apple-iphone-duo','iPhone Duo'],['galaxy-s26-ultra','Galaxy S26 Ultra'],['Moto-G-5G-2026','moto g 2026'],['moto-g-5g-2025','moto g 2025'],['motorola-moto-g-2026','moto g 2026']])await step(tag+' gallery device='+text,async()=>{
    await p.goto(base+'gallery.html?device='+encodeURIComponent(text));await p.locator('#grid canvas').first().waitFor();check(tag+' gallery device='+text,await p.locator('#wizDevBtn strong').textContent()===name);});
   /* ---- a phone we do not sell yet ---- */
   if(on('soon')){
    for(const m of soon.concat('Google Pixel 9')){const t=tag+' not sold: '+m;await step(t,async()=>{
     await p.goto(base+'gallery.html?device='+slug(short(m)));await p.locator('#grid canvas').first().waitFor();
     check(t+' gallery says so and picks nothing',await p.locator('#deviceNote').isVisible()&&/do not have a case for that phone yet/.test(await p.locator('#deviceNote').textContent())&&await p.locator('#wizDevBtn strong').textContent()==='Choose model'&&!new URL(p.url()).searchParams.has('device'));
     await p.locator('#wizDevBtn').click();for(const brand of BRANDS){await p.locator('[data-pill="'+brand+'"]').click();check(t+' is in no drawer list ('+brand+')',await p.locator('[data-md="'+slug(short(m))+'"]').count()===0);}
     await p.locator('[data-pill=Apple]').click();await p.locator('[data-md="iphone-16"]').click();check(t+' note goes once a phone is chosen',!await p.locator('#deviceNote').isVisible());
    });}
    await step(tag+' editor menu',async()=>{
     await p.goto(base+'customizer.html?staff=1&model=galaxy-s25');await p.waitForFunction(()=>window.__kp);
     const menuState=await p.evaluate(()=>[...document.querySelector('#modelSel').options].map(o=>[o.value,o.disabled,o.textContent]));
     for(const m of soon)check(tag+' editor lists '+m+' as coming soon, not selectable',menuState.some(o=>o[0]===m&&o[1]&&/coming soon/.test(o[2])),menuState);
     check(tag+' editor can select every Samsung phone with a kit',models.filter(m=>brandOf(m)==='Samsung').every(m=>menuState.some(o=>o[0]===m&&!o[1])));});
    /* ---- the mask that failed to load: nothing, rather than the white guide ---- */
    await step(tag+' no mask',async()=>{
     await p.route('**/masks/view-rated-googpl10.png*',r=>r.abort());await p.goto(base+'gallery.html?device=pixel-10&q=mini+hearts');
     await p.waitForFunction(()=>document.querySelector('.kpCard .zoom-hint')?.textContent==='Case preview unavailable');
     check(tag+' no mask: the bare photo is not shown',await p.locator('.kpCard canvas').first().evaluate(c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data.every(v=>v===0)));
     await p.unroute('**/masks/view-rated-googpl10.png*');});
   }
   await p.__ctx.close();
   /* ---- every ?model= slug, with and without the brand, and the gallery's own links: customers start on frost where the phone has
      it; an asked for clear case, a staff page and an old style= link start clear, except on a phone with no clear case ---- */
   if(on('editor')){
    const says=new Map(),e=await open(390,844);await e.route(/\.(png|jpe?g|webp|woff2?)(\?|$)|fonts\.g/,r=>r.abort());
    const go=async url=>{await e.goto(url);await inEditor(e);return state(e);};
    for(const m of models){const k=kits[m],t=tag+' editor '+m,rims=rimsOf(m),start=x=>rims.length?isFrost(x,m):isClear(x,m);await step(t,async()=>{
     let s=await go(base+'customizer.html?model='+slug(short(m)));
     check(t+': ?model='+slug(short(m))+' starts on '+(rims.length?'frost':'the clear case'),start(s)&&s.brand===brandOf(m)&&!s.forced,s);
     check(t+': its browse link is the gallery slug',s.browse==='gallery.html?device='+slug(short(m)),s.browse);
     const help=await e.locator('#studio-phone .studio-help').textContent();if(/rated case/i.test(help))says.set(m,help);
     if(links[m]){s=await go(links[m]);check(t+': the gallery card link opens it, case and rim chosen by the customer',start(s)&&!s.forced&&s.drop===dropOf(m),s);}
     else check(t+': the gallery gave a link',false);
     if(brandOf(m)!=='Apple'){s=await go(base+'customizer.html?model='+slug(m));check(t+': ?model='+slug(m),start(s),s);}
     for(const extra of ['case=clear','staff=1','style=hybrid']){s=await go(base+'customizer.html?model='+slug(short(m))+'&'+extra);check(t+': '+extra+(k.ratedOnly?' has no clear case to open, so frost, chosen by the phone':' opens the clear case'),k.ratedOnly?isFrost(s,m)&&s.forced:isClear(s,m)&&!s.forced,s);}
     for(const rim of FRAMES){s=await go(base+'customizer.html?model='+slug(short(m))+'&case=rated&rim='+rim.replace(' ','+'));check(t+': case=rated rim='+rim,rims.length?isFrost(s,m,rims.includes(rim)?rim:rims[0]):isClear(s,m),s);}
    });}
    check(tag+' editor: the phone panel says frost case, not Rated Case, on every phone',!says.size,[...says]);
    check(tag+' editor menu holds every kit under its brand',models.every(m=>menu[brandOf(m)].includes(m)));
    await step(tag+' editor with no phone named',async()=>{const s=await go(base+'customizer.html');check(tag+' editor with no phone named starts on frost',isFrost(s,'iPhone 18 Pro Max','Smoke Frost'),s);});
    await e.__ctx.close();
   }
   /* ---- walk it: design, brand, phone, editor ---- */
   if(on('walk')){
    for(const m of ['Google Pixel 10','Motorola moto g 2026','Samsung Galaxy S25','iPhone Duo','iPhone 17 Pro','iPhone 12','iPhone 12 mini']){const name=short(m),k=kits[m],rims=rimsOf(m),t=tag+' walk '+name;await step(t,async()=>{const w=await open(390,844);
     await w.goto(base+'gallery.html?q=mini+hearts');await w.locator('[data-pick-model]').first().waitFor();
     const card=await w.locator('[data-pick-model]').first().innerText();check(tag+' no phone yet: card says Frost case · '+RATED,card.includes('Frost case · '+RATED)&&!/44\.99|rated/i.test(card),card);
     await w.locator('[data-pick-model="'+HEARTS+'"]').click();await w.locator('[data-pill="'+brandOf(m)+'"]').click();await w.locator('[data-md="'+slug(name)+'"]').click();
     await w.waitForURL(/customizer\.html/,{waitUntil:'domcontentloaded'});const q=new URL(w.url()).searchParams;
     check(t+': the link carries '+(rims.length?'case=rated and the rim':'the clear case route'),(rims.length?q.get('case')==='rated':q.get('case')===null||q.get('case')==='clear')&&q.get('rim')===(rims[0]||null)&&q.get('design')===HEARTS,w.url());
     await w.waitForFunction(()=>window.KPEditor&&!KPStudioCore.info().issue&&!KPStudioCore.info().loading);
     const s=await state(w);check(t+': opens in its case',(rims.length?isFrost(s,m):isClear(s,m))&&!s.forced,s);
     check(t+': the address keeps it',await address(w,{case:rims.length?'rated':'clear',rim:rims[0]||null,model:slug(name)}),w.url());
     check(t+': no Rated Case wording on the first screen',!/rated case/i.test(await w.evaluate(()=>document.body.innerText)));
     await w.screenshot({path:path.join(out,tag+'-walk-'+slug(name)+'.png')});
     /* the customer chose frost: it stays on the next phone that has it, and the clear case comes only where there is no frost */
     if(rims.length){await switchTo(w,m==='iPhone 17 Pro'?'iPhone 15 Pro':'iPhone 17 Pro');await ready(w);const n=await state(w),want=m==='iPhone 17 Pro'?'iPhone 15 Pro':'iPhone 17 Pro';
      check(t+' then '+want+': frost stays',n.model===want&&n.type===FROST&&n.total===cfg.RATED_PRICE&&!n.forced&&await address(w,{case:'rated',model:slug(want),rim:n.rim}),[n,w.url()]);
      await switchTo(w,'iPhone 12 mini');await ready(w);check(t+' then iPhone 12 mini: no frost there, so the clear case at '+CLEAR+' and a message',await toast(w,'A frost case is not available for iPhone 12 mini yet. Showing the clear case.')&&isClear(await state(w),'iPhone 12 mini')&&await address(w,{case:'clear',rim:null}),[await state(w),w.url()]);}
     await w.__ctx.close();});}
    /* the customer chose clear: a frost only phone brings its own case (case=clear and its rim in the address), and the clear case
       comes back on the next phone that has one, also after a reload and after choosing a rim */
    for(const m of ['Google Pixel 10','Motorola moto g 2026','Samsung Galaxy S25','iPhone Duo']){const name=short(m),rims=rimsOf(m),t=tag+' clear, then '+name;await step(t,async()=>{const w=await open(390,844);
     await w.goto(base+'customizer.html?model=iphone-17-pro&case=clear&colorway=original&design='+HEARTS);await ready(w);check(t+': starts clear',isClear(await state(w),'iPhone 17 Pro'),await state(w));
     await switchTo(w,m);await ready(w);let s=await state(w);
     check(t+': its frost case at '+RATED+' and a message',await toast(w,'This phone comes in a frost case. Your case is now '+RATED+'.')&&isFrost(s,m)&&s.forced,s);
     check(t+': the address says case=clear and its rim',await address(w,{case:'clear',rim:rims[0],model:slug(name)}),w.url());
     if(rims.length>1){await w.evaluate(r=>KPStudioCore.setRim(r),rims[1]);await ready(w);s=await state(w);check(t+': another rim is still the phone’s case',isFrost(s,m,rims[1])&&s.forced&&await address(w,{case:'clear',rim:rims[1]}),[s,w.url()]);}
     const kept=rims[rims.length-1];await w.reload({waitUntil:'domcontentloaded'});await ready(w);s=await state(w);check(t+': a reload keeps phone, rim and the clear choice',isFrost(s,m,kept)&&s.forced,s);
     await switchTo(w,'iPhone 17 Pro');await ready(w);
     check(t+', then iPhone 17 Pro: the clear case at '+CLEAR+' and a message',await toast(w,'Your case is the clear case again at '+CLEAR+'.')&&isClear(await state(w),'iPhone 17 Pro')&&await address(w,{case:'clear',rim:null,model:'iphone-17-pro'}),[await state(w),w.url()]);
     await w.__ctx.close();});}
   }
   /* ---- Use your own photo, the menu's own links, Zoom and the second rim ---- */
   if(on('links')){const u=await open(390,844);
    await step(tag+' no phone: use your own photo',async()=>{await u.goto(base+'gallery.html');await u.locator('[data-pick-model]').first().waitFor();
     check(tag+' no phone: use your own photo is the plain editor',await u.locator('.library-photo-cta').getAttribute('href')==='customizer.html');
     const h=new URL(await u.locator('.ks-start-case').evaluate(a=>a.href)).searchParams;check(tag+' no phone: Design your case starts on Smoke Frost',h.get('case')==='rated'&&h.get('rim')==='Smoke Frost'&&!h.has('model'),h.toString());});
    await step(tag+' use your own photo from a moto',async()=>{await u.goto(base+'gallery.html?device=moto-g-power-2025');await u.locator('.kpCard').first().waitFor();await u.locator('.library-photo-cta').click();await u.waitForURL(/customizer\.html/,{waitUntil:'domcontentloaded'});await u.waitForFunction(()=>window.KPEditor&&window.KPStudioCore);
     const s=await state(u);check(tag+' use your own photo from a moto: that phone, frost, '+RATED,isFrost(s,'Motorola moto g power 2025')&&!s.forced&&await u.evaluate(()=>document.querySelector('#studioBrowse').href.includes('device=moto-g-power-2025')),[s,u.url()]);});
    await step(tag+' use your own photo from a phone with no frost',async()=>{await u.goto(base+'gallery.html?device=iphone-13-mini');await u.locator('.kpCard').first().waitFor();await u.locator('.library-photo-cta').click();await u.waitForURL(/customizer\.html/,{waitUntil:'domcontentloaded'});await u.waitForFunction(()=>window.KPEditor&&window.KPStudioCore);
     const s=await state(u);check(tag+' use your own photo from iPhone 13 mini: clear, '+CLEAR,isClear(s,'iPhone 13 mini')&&new URL(u.url()).searchParams.get('case')==='clear',[s,u.url()]);});
    /* the menu's own "make it personal" links are rewritten for the chosen phone as they are clicked */
    for(const m of ['iPhone 12 mini','Google Pixel 10','iPhone Duo','iPhone 13 Pro','Motorola moto g 2025',null])for(const [i,kind,asked] of [[0,null,'Smoke Frost'],[1,'drawing','Clear Frost'],[2,'sky','Smoke Frost']]){const t=tag+' menu '+(kind||'photo')+' link on '+(m?short(m):'no phone'),rims=m?rimsOf(m):FRAMES,rim=rims.includes(asked)?asked:rims[0]||null;await step(t,async()=>{
     await u.goto(base+'gallery.html'+(m?'?device='+slug(short(m)):''));await u.locator(m?'.kpCard':'[data-pick-model]').first().waitFor();await u.locator('.ks-menu-toggle').click();await u.locator('#ks-menu-panel [data-group]').filter({hasText:'Make it personal'}).click();
     const a=u.locator('#ks-menu-panel .ks-category-links a[href^="customizer.html"]');check(t+': three links',await a.count()===3);
     await Promise.all([u.waitForURL(/customizer\.html/,{waitUntil:'domcontentloaded'}),a.nth(i).click()]);const q=new URL(u.url()).searchParams;
     check(t+': phone, case, rim and studio in the address',q.get('model')===(m?slug(short(m)):null)&&q.get('case')===(rims.length?'rated':'clear')&&q.get('rim')===rim&&q.get('studio')===kind&&(!m||new URL(q.get('back'),base).searchParams.get('device')===slug(short(m))),u.url());
     await inEditor(u);const s=await state(u),phone=m||'iPhone 18 Pro Max';check(t+': the editor opens it',rims.length?isFrost(s,phone,rim)&&!s.forced:isClear(s,phone),s);});}
    await u.__ctx.close();
   }
   if(on('zoom')){const u=await open(390,844);
    /* the nearly square Duo is centered in Zoom on a phone, off the frame */
    await step(tag+' Duo zoom',async()=>{
     await u.goto(base+'gallery.html?device=iphone-duo&q=mini+hearts');await drawn(u);await u.locator('.case-zoom-button').first().click();await u.locator('#caseZoomDialog canvas').waitFor();await u.waitForTimeout(300);
     const zd=await u.evaluate(()=>{const c=document.querySelector('#caseZoomDialog canvas').getBoundingClientRect(),v=document.querySelector('#caseZoomDialog .zoom-scroll').getBoundingClientRect(),s=document.querySelector('#caseZoomDialog .zoom-scroll');return {above:c.top-v.top,below:v.bottom-c.bottom,left:c.left-v.left,right:v.right-c.right,scroll:s.scrollWidth-s.clientWidth};});
     check(tag+' Duo zoom: centered, off the frame, no scrolling',Math.abs(zd.above-zd.below)<=2&&zd.left>=6&&zd.right>=6&&zd.scroll<=0,zd);
     await u.locator('#caseZoomDialog [data-step="1"]').click();await u.locator('#caseZoomDialog [data-step="1"]').click();
     check(tag+' Duo zoom: magnified it still scrolls to every edge',await u.evaluate(()=>{const s=document.querySelector('#caseZoomDialog .zoom-scroll'),c=document.querySelector('#caseZoomDialog canvas');s.scrollLeft=0;s.scrollTop=0;const a=c.getBoundingClientRect(),v=s.getBoundingClientRect();s.scrollLeft=1e6;s.scrollTop=1e6;const z=c.getBoundingClientRect();return a.left>=v.left-1&&a.top>=v.top-1&&z.right<=v.right+1&&z.bottom<=v.bottom+1&&s.scrollWidth>s.clientWidth;}));});
    await u.__ctx.close();
    const r=await open(390,844);await step(tag+' second rim',async()=>{await r.goto(base+'gallery.html?device=moto-g-power-2026&q=mini+hearts');await drawn(r);
     await r.locator('.cdot[aria-label="Preview Clear Frost rim"]').first().click();await r.waitForFunction(()=>JSON.parse(document.querySelector('.kpCard canvas').dataset.renderedPreview||'[]')[2]===1);
     const href=await r.locator('.h-makeone').first().getAttribute('href'),q=new URL(href,base).searchParams;check(tag+' second rim: link and pressed state',q.get('case')==='rated'&&q.get('rim')==='Clear Frost'&&!q.has('finish')&&await r.locator('.cdot').nth(1).getAttribute('aria-pressed')==='true',href);
     await r.locator('.case-zoom-button').first().click();await r.locator('#caseZoomDialog canvas').waitFor();check(tag+' zoom shows the frost case',await r.locator('#caseZoomDialog canvas').evaluate(c=>c.width>500));await r.locator('#caseZoomDialog [data-close]').click();
     await r.locator('.h-makeone').first().click();await r.waitForURL(/customizer\.html/,{waitUntil:'domcontentloaded'});await r.waitForFunction(()=>window.KPStudioCore&&!KPStudioCore.info().loading);const s=await state(r);check(tag+' second rim reaches the editor',isFrost(s,'Motorola moto g power 2026','Clear Frost')&&!s.forced,s);});
    await r.__ctx.close();
   }
   check(tag+' no page errors',!errors.length,errors);
  }finally{await b.close();}
  console.log(tag+' done: '+pass+' checks passed so far, '+bad.length+' failed');
 }
 if(server)server.close();
 console.log((bad.length?'FAIL ':'PASS ')+pass+'/'+(pass+bad.length)+' rated everywhere checks'+(parts.length||process.env.KP_ENGINE?' (part of the file)':''));
 process.exit(bad.length?1:0);
})().catch(err=>{console.error(err);process.exit(1);});
