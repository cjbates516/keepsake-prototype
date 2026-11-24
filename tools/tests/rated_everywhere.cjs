/* Every phone, everywhere on the storefront: the gallery, the home phone finder, the menu and the editor must mean the same
   phones, names and slugs, and Rated only phones must carry their rim (never case=rated: the phone, not the customer, chose
   that case, so the next phone with a clear case goes back to it) from the gallery to the editor.
   The kits in customizer.html are the one list; everything else is compared with it, so a phone added there (or taken out of
   COMING_SOON) fails here until the storefront has it. Also: prices and wording per phone, the coming soon phone cannot be
   picked, the white print area guide never shows as the product, and the print counter asks Clear or Rated.
   Chromium and WebKit; layout at 320, 390, 820 and 1440 px.
   usage: node tools/tests/rated_everywhere.cjs [outdir]   (KP_BASE=http://127.0.0.1:PORT/ to use a running server) */
const {chromium,webkit}=require(process.env.PW_CORE||'../../../playwright/node_modules/playwright-core');
const http=require('http'),fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'../..');
const out=path.resolve(process.argv[2]||'/tmp/keepsake-rated-everywhere');fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2','.pdf':'application/pdf'};
let server=null;
function serve(){return new Promise(r=>{server=http.createServer((req,res)=>{let f=path.join(root,decodeURIComponent(new URL(req.url,'http://local').pathname));if(f.endsWith(path.sep))f+='index.html';if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return}fs.readFile(f,(e,d)=>{if(e){res.writeHead(404).end();return}res.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});res.end(d);});}).listen(0,'127.0.0.1',()=>r('http://127.0.0.1:'+server.address().port+'/'));});}
let pass=0;const bad=[];
function check(name,ok,detail){if(ok){pass++;return;}bad.push(name);console.log('FAIL '+name+(detail===undefined?'':' '+JSON.stringify(detail)));}
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const slug=t=>t.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const short=m=>m.replace(/^(Samsung|Google|Motorola) /,''),brandOf=m=>(/^(Samsung|Google|Motorola) /.exec(m)||[0,'Apple'])[1];
const same=(a,b)=>JSON.stringify([...a].sort())===JSON.stringify([...b].sort());

/* the one list: the kits, the menu and the coming soon phones in customizer.html */
const editor=read('customizer.html'),scope={};
vm.runInNewContext(editor.slice(editor.indexOf('  var KITS ='),editor.indexOf('  var printPath=null')),scope);
const menu=vm.runInNewContext('('+editor.slice(editor.indexOf('{',editor.indexOf('var modelsByBrand =')),editor.indexOf('};',editor.indexOf('var modelsByBrand ='))+1)+')');
const soon=Object.keys(vm.runInNewContext('('+/var COMING_SOON=(\{[^}]*\})/.exec(editor)[1]+')'));
const kits=scope.KITS,models=Object.keys(kits),only=models.filter(m=>kits[m].ratedOnly),both=models.filter(m=>kits[m].rated&&!kits[m].ratedOnly);
const cfg=vm.runInNewContext('var window={};'+read('assets/kp-config.js')+';window.KP_CONFIG'),CLEAR='$'+cfg.PRICE.toFixed(2),RATED='$'+cfg.RATED_PRICE.toFixed(2);
const BRANDS=['Apple','Samsung','Google','Motorola'];
/* a phone dropped from the kits would otherwise pass quietly everywhere below */
check('26 phones come in both cases, 29 are Rated only or coming soon',both.length===26&&only.length+soon.length===29,{both:both.length,only:only.length,soon:soon.length});

/* ---- files ---- */
const listed=vm.runInNewContext('var window={};'+read('assets/rated-phones.js')+';window.KP_RATED_PHONES');
check('rated-phones.js lists exactly the Rated only kits',same(Object.keys(listed.only),only.map(short)));
check('rated-phones.js lists exactly the kits with both cases',same(Object.keys(listed.both),both.map(short)));
only.forEach(m=>{const k=kits[m],r=listed.only[short(m)]||{};
 check('rated-phones.js matches the kit: '+m,r.brand===brandOf(m)&&r.mask===k.view&&r.back===k.colors[0].h&&!!r.flat===!!k.rated.flatPanel&&r.drop===(k.rated.dropFt||0)&&JSON.stringify(r.rims)===JSON.stringify(k.rated.colors.map(({n,h,f})=>({n,h,f}))),r);});
both.forEach(m=>check('rated-phones.js drop rating: '+m,listed.both[short(m)]===(kits[m].rated.dropFt||0)));
const home=read('index.html'),finder=/<select id="homeDevice"[\s\S]*?<\/select>/.exec(home)[0];
const groups=[...finder.matchAll(/<optgroup label="([^"]+)">(.*?)<\/optgroup>/g)].map(g=>({brand:g[1],options:[...g[2].matchAll(/<option value="([^"]+)">([^<]+)<\/option>/g)].map(o=>[o[1],o[2]])}));
check('home finder: one group per brand, in order',groups.map(g=>g.brand).join()===BRANDS.join(),groups.map(g=>g.brand));
groups.forEach(g=>check('home finder: '+g.brand+' phones and slugs',same(g.options.map(o=>o.join('|')),models.filter(m=>brandOf(m)===g.brand).map(m=>slug(short(m))+'|'+short(m)))));
check('home finder: no phone outside a group, no duplicates',(finder.match(/<option /g)||[]).length-1===models.length&&new Set(groups.flatMap(g=>g.options.map(o=>o[0]))).size===models.length);
check('coming soon phones are in no storefront list',soon.every(m=>!models.includes(m)&&!home.includes('value="'+slug(short(m))+'"')&&!Object.keys(listed.only).includes(short(m))),soon);
BRANDS.forEach(b=>check('menu row for '+b,read('assets/shop-menu.js').includes("'gallery.html?brand="+b+"'")));
check('menu rows point at pictures that exist',[...read('assets/shop-menu.js').matchAll(/'(assets\/rated-menu\/[^']+)'/g)].length===2&&[...read('assets/shop-menu.js').matchAll(/'(assets\/rated-menu\/[^']+)'/g)].every(m=>fs.existsSync(path.join(root,m[1]))));
/* customer copy: no white back, no vendor, no drop claim without its availability line, no flat $44.99 promise */
const vendor=/\b(CCK|Nimbus9|Phantom|Balaji)\b|Custom Case Kiosk/i;
for(const f of ['index.html','gallery.html','checkout.html','instore/index.html','instore/find.html','assets/rated-phones.js','assets/shop-menu.js']){const t=read(f);
 check('no vendor name and no white back wording: '+f,!vendor.test(t)&&!/white back/i.test(t));}
check('checkout: 20 ft and availability together',/20 ft drop protection on most phones\.[^<]*Confirm availability in store/.test(read('checkout.html')));
for(const f of ['ocean-and-rain.html','parks-rugged.html','instore/index.html','index.html'])check('no "every case is '+CLEAR+'" promise: '+f,!/every (case|design|case design) ?·? ?\$44\.99|Cases \$44\.99,/i.test(read(f)));
check('home: the bundle total names the clear case',read('index.html').includes('$64.98 together with a clear case'));
check('home and Cherry Duck: no flat $44.99 on the slides, cards or intro',!/in store\. \$44\.99\.<\/p>/.test(home.replace(/Printed on a clear case in store\. \$44\.99\./g,''))&&!/<span>\$44\.99<\/span>/.test(home)&&!/\$44\.99 per case/.test(read('cherry-duck.html')));
/* every page loads the same menu, so none of them shows a cached one without the Google and Motorola rows */
const pages=fs.readdirSync(root).filter(f=>f.endsWith('.html')),menus=pages.flatMap(f=>[...read(f).matchAll(/shop-menu\.js\?v=([\w-]+)/g)].map(m=>m[1]));
check('every page loads the same shop-menu.js version ('+menus.length+' pages)',menus.length>=20&&new Set(menus).size===1,[...new Set(menus)]);
/* staff size tables: a print size only for phones with a clear case */
for(const f of ['staff-sop.html','sop-body.html']){const rows=[...read(f).matchAll(/<tr><td>([^<]+)<\/td><td[^>]*>([^<]+)<\/td>/g)].filter(r=>/^[\d.]+$/.test(r[2])).map(r=>r[1]);
 check(f+': no print size for a phone without a clear case, and the Rated Case is not printed',rows.length>20&&!rows.some(r=>only.some(m=>m===r||short(m)===r))&&/<b>Rated Case:<\/b> do not print one/.test(read(f)),rows.filter(r=>only.some(m=>m===r||short(m)===r)));}

const sizes=[[320,700],[390,844],[820,1180],[1440,950]];
(async()=>{
 const base=process.env.KP_BASE||await serve();
 for(const engine of [chromium,webkit]){
  const tag=engine.name(),b=await engine.launch(),errors=[];
  async function open(w,h){const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:w<900,isMobile:w<900,reducedMotion:'reduce',serviceWorkers:'block'}),p=await ctx.newPage();p.setDefaultTimeout(30000);p.on('pageerror',e=>errors.push(e.message));p.__ctx=ctx;return p;}
  const drawn=p=>p.waitForFunction(()=>document.querySelector('.kpCard canvas')?.dataset.renderedPreview);
  const overflow=p=>p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
  try{
   /* ---- layout, drawer and finder at every width ---- */
   for(const [w,h] of sizes){const t=tag+' '+w,p=await open(w,h);
    for(const brand of BRANDS){
     await p.goto(base+'gallery.html?brand='+brand);await p.locator('#kpDevDrawer [data-pill="'+brand+'"][aria-pressed=true]').waitFor();
     const d=await p.locator('#kpDevDrawer').evaluate(e=>({rows:[...e.querySelectorAll('[data-md]')].filter(x=>x.dataset.md).map(x=>[x.dataset.md,x.innerText.replace(/\s+/g,' ').trim()]),
      pills:[...e.querySelectorAll('[data-pill]')].map(x=>{const r=x.getBoundingClientRect(),q=e.getBoundingClientRect();return [x.dataset.pill,r.height,r.left>=q.left-.5&&r.right<=q.right+.5,x.scrollWidth<=x.clientWidth+1,x.disabled];}),wide:e.scrollWidth>e.clientWidth+1}));
     const want=models.filter(m=>brandOf(m)===brand);
     check(t+' drawer '+brand+': exactly its phones',same(d.rows.map(r=>r[0]),want.map(m=>slug(short(m)))),d.rows.map(r=>r[0]));
     check(t+' drawer '+brand+': Rated only phones say so, others do not',d.rows.every(([s,text])=>{const m=want.find(x=>slug(short(x))===s);return m&&(kits[m].ratedOnly?text===short(m)+' Rated Case · '+RATED:text.replace(/ NEW$/,'')===short(m));}),d.rows);
     check(t+' drawer '+brand+': brand buttons at least 44 px, inside, not cut off, none disabled',d.pills.map(x=>x[0]).join()===BRANDS.join()&&d.pills.every(x=>x[1]>=44&&x[2]&&x[3]&&!x[4])&&!d.wide,d.pills);
     check(t+' drawer '+brand+': no page overflow',!await overflow(p));
     await p.screenshot({path:path.join(out,tag+'-drawer-'+brand+'-'+w+'.png')});
    }
    await p.locator('[data-pill="Samsung"]').click();check(t+' brand buttons switch the list',await p.locator('[data-md="galaxy-s25"]').isVisible()&&await p.locator('[data-md="pixel-10"]').count()===0&&await p.evaluate(()=>document.activeElement.dataset.pill)==='Samsung');
    await p.goto(base);check(t+' home finder fits',!await overflow(p)&&await p.locator('#homeDevice').evaluate(e=>e.getBoundingClientRect().right<=innerWidth));
    await p.locator('#homeDevice').selectOption('pixel-10-pro-xl');await Promise.all([p.waitForURL(/gallery\.html\?device=pixel-10-pro-xl$/),p.locator('.phone-finder button').click()]);
    await p.waitForFunction(()=>document.querySelector('#wizDevBtn strong')?.textContent==='Pixel 10 Pro XL');
    if(w<900){await p.locator('.ks-menu-toggle').click();for(const brand of ['Google','Motorola']){const a=p.locator('#ks-menu-panel a[href="gallery.html?brand='+brand+'"]');await a.scrollIntoViewIfNeeded();await a.locator('img').evaluate(i=>{i.loading='eager';return i.decode();});check(t+' menu row '+brand,await a.isVisible());}
     await p.locator('#ks-menu-panel a[href="gallery.html?brand=Motorola"]').click();await p.locator('#kpDevDrawer [data-pill=Motorola][aria-pressed=true]').waitFor();}
    for(const s of ['pixel-11','iphone-duo','moto-g-2026','iphone-17-pro','iphone-12-mini']){
     await p.goto(base+'gallery.html?device='+s);await p.locator('.kpCard').first().waitFor();
     const g=await p.evaluate(()=>({top:document.querySelector('#grid').getBoundingClientRect().top,price:document.querySelector('#shopPrice').textContent}));
     check(t+' gallery '+s+': fits, cases in view',!await overflow(p)&&g.top<(w<400?640:620),g);
     const a=await p.locator('.kpCard').first().evaluate(e=>{const c=e.querySelector('canvas').getBoundingClientRect(),q=e.querySelector('.case-zoom-button').getBoundingClientRect();return [c.width,q.width,[...e.querySelectorAll('.cdot,.h-makeone')].every(x=>{const r=x.getBoundingClientRect(),k=e.getBoundingClientRect();return r.left>=k.left-1&&r.right<=k.right+1;})];});
     check(t+' gallery '+s+': card contents stay inside the card',a[2]&&Math.abs(a[0]-a[1])<2,a);
    }
    /* ---- print counter: the code carries no case, so it asks ---- */
    await p.goto(base+'instore/find.html?code=17P-SCN-131-G-S1');await p.waitForFunction(()=>document.querySelector('#res').classList.contains('on'));
    const f=await p.locator('#res').innerText();
    check(t+' counter: asks Clear or Rated before printing',/Clear or Rated Case\? Check the customer’s screen or card before printing\./.test(f)&&/workspace opens on the clear case/.test(f),f);
    check(t+' counter: states neither case as fact, shows both prices',!/Clear case ·/.test(f)&&f.includes('Case · '+CLEAR+' clear or '+RATED+' Rated Case')&&f.includes('$64.98 clear or $69.98 Rated'),f);
    if(w===820){for(const m of models.filter(m=>!kits[m].rated)){const row=JSON.parse(read('instore/models.json')).models.find(x=>x.name===m);await p.goto(base+'instore/find.html?code='+row.id+'-SCN-131');await p.waitForFunction(()=>document.querySelector('#res').classList.contains('on'));
     check(t+' counter: '+m+' has no Rated Case, so it says clear',/Clear case · \$44\.99/.test(await p.locator('#res').innerText())&&!/Rated/.test(await p.locator('#res').innerText()),await p.locator('#res').innerText());}
     /* the phone list is not in the offline copy: without it every lookup asks */
     await p.route('**/rated-phones.js*',r=>r.abort());await p.goto(base+'instore/find.html?code=12MN-SCN-131');await p.waitForFunction(()=>document.querySelector('#res').classList.contains('on'));check(t+' counter: without the phone list it asks',await p.locator('#rcase').isVisible());await p.unroute('**/rated-phones.js*');
     await p.goto(base+'instore/find.html?code=17P-SCN-131-G-S1');await p.waitForFunction(()=>document.querySelector('#res').classList.contains('on'));}
    check(t+' counter: no pick code path asks too, page fits',/Check their screen or card for Clear or Rated Case before printing/.test(await p.locator('main').innerText())&&!await overflow(p));
    await p.screenshot({path:path.join(out,tag+'-find-'+w+'.png'),fullPage:true});
    await p.__ctx.close();
   }
   /* ---- every gallery slug ---- */
   const p=await open(1440,950),links={};
   for(const m of models){const k=kits[m],name=short(m),t=tag+' gallery '+name;
    await p.goto(base+'gallery.html?device='+slug(name)+'&q=mini+hearts');await p.locator('.kpCard').first().waitFor();
    const g=await p.evaluate(()=>{const c=document.querySelector('.kpCard');return {phone:document.querySelector('#wizDevBtn strong').textContent,url:new URL(location.href).searchParams.get('device'),price:document.querySelector('#shopPrice').textContent,note:document.querySelector('#deviceNote').hidden,card:c.innerText.replace(/\s+/g,' '),
     dots:[...c.querySelectorAll('.cdot')].map(d=>d.getAttribute('aria-label')),group:c.querySelector('.phone-finishes').getAttribute('aria-label'),href:c.querySelector('.h-makeone').href,photo:[...document.querySelectorAll('.library-photo-cta,.ks-start-case,#ks-menu-panel a[href^="customizer.html"]:not([href*="studio="])')].map(a=>a.href)};});
    const q=new URL(g.href).searchParams;links[m]=g.href;
    check(t+': same phone, kept in the address',g.phone===name&&g.url===slug(name)&&g.note,g);
    check(t+': editor link names the phone',q.get('model')===slug(name));
    check(t+': use your own photo keeps the phone',g.photo.length===3&&g.photo.every(h=>{const u=new URL(h);return u.pathname.endsWith('/customizer.html')&&u.searchParams.get('model')===slug(name)&&new URL(u.searchParams.get('back'),base).searchParams.get('device')===slug(name);}),g.photo);
    const drop=k.rated&&k.rated.dropFt?k.rated.dropFt+' ft drop protection · ':'',line='Rated Case '+RATED+' · '+drop+'Confirm availability in store.';
    check(t+': price line',g.price===(k.ratedOnly?line:k.rated?'Clear cases '+CLEAR+' · Made in store. '+line:'Clear cases. Your favorite print. '+CLEAR+' · Made in store.'),g.price);
    if(k.ratedOnly){const rims=k.rated.colors.map(c=>c.n);
     check(t+': Rated price and rim, nothing about clear or a finish',new RegExp('rated case · \\'+RATED,'i').test(g.card)&&!/magsafe clear|44\.99|phone finish|white/i.test(g.card)&&g.group==='Rim color',g.card);
     check(t+': rims offered',rims.length>1?g.dots.join()===rims.map(r=>'Preview '+r+' rim').join():!g.dots.length&&g.card.includes(rims[0]+' rim'),g.dots);
     check(t+': link carries the rim, no case and no finish',!q.has('case')&&q.get('rim')===rims[0]&&!q.has('finish'),g.href);
     /* a transparent design shows the phone's own back color through the panel, never the white guide */
     await drawn(p);const px=await p.locator('.kpCard canvas').first().evaluate(async(c,[mask,back])=>{const im=new Image();im.src='assets/masks/'+mask;await im.decode();const x=document.createElement('canvas');x.width=c.width;x.height=c.height;const g=x.getContext('2d');g.drawImage(im,0,0,c.width,c.height);const k=g.getImageData(0,0,c.width,c.height).data,d=c.getContext('2d').getImageData(0,0,c.width,c.height).data,v=[[],[],[]];
      for(let i=0;i<k.length;i+=4)if(k[i+3]===255)for(let z=0;z<3;z++)v[z].push(d[i+z]);const got=v.map(a=>a.sort((q,w)=>q-w)[a.length>>1]),lit=z=>{const n=parseInt(back.slice(1+z*2,3+z*2),16)*.9777;return n+.0463*(255-n);};return {got,want:[0,1,2].map(z=>Math.round(lit(z)))};},[k.view,k.colors[0].h]);
     check(t+': panel shows the phone back color',px.got.every((v,i)=>v<=px.want[i]+4&&v>=px.want[i]-20),px);  /* the photo may only darken it; the white guide would be lighter */
    }else{
     check(t+': clear price, Rated note only where there is one',/magsafe clear · \$44\.99/i.test(g.card)&&g.card.includes('Rated Case · '+RATED)===!!k.rated,g.card);
     check(t+': finishes and link unchanged',g.group==='Phone finish'&&g.dots.length===k.colors.length&&!q.has('case')&&!q.has('rim')&&q.get('finish')===k.colors[0].n,g.href);
    }
   }
   /* names people, the editor and old links use */
   for(const [text,name] of [['Samsung Galaxy S25','Galaxy S25'],['google-pixel-10','Pixel 10'],['motorola-moto-g-2025','moto g 2025'],['iPhone 17 Pro','iPhone 17 Pro'],['galaxy-s26-ultra','Galaxy S26 Ultra'],['Moto-G-5G-2026','moto g 2026'],['moto-g-5g-2025','moto g 2025'],['motorola-moto-g-2026','moto g 2026']]){
    await p.goto(base+'gallery.html?device='+encodeURIComponent(text));await p.locator('#grid canvas').first().waitFor();check(tag+' gallery device='+text,await p.locator('#wizDevBtn strong').textContent()===name);}
   /* ---- a phone we do not sell yet ---- */
   for(const m of soon.concat('Google Pixel 9')){const t=tag+' not sold: '+m;
    await p.goto(base+'gallery.html?device='+slug(short(m)));await p.locator('#grid canvas').first().waitFor();
    check(t+' gallery says so and picks nothing',await p.locator('#deviceNote').isVisible()&&/do not have a case for that phone yet/.test(await p.locator('#deviceNote').textContent())&&await p.locator('#wizDevBtn strong').textContent()==='Choose model'&&!new URL(p.url()).searchParams.has('device'));
    await p.locator('#wizDevBtn').click();for(const brand of BRANDS){await p.locator('[data-pill="'+brand+'"]').click();check(t+' is in no drawer list ('+brand+')',await p.locator('[data-md="'+slug(short(m))+'"]').count()===0);}
    await p.locator('[data-pill=Apple]').click();await p.locator('[data-md="iphone-16"]').click();check(t+' note goes once a phone is chosen',!await p.locator('#deviceNote').isVisible());
   }
   await p.goto(base+'customizer.html?staff=1&model=galaxy-s25');await p.waitForFunction(()=>window.__kp);
   const menuState=await p.evaluate(()=>[...document.querySelector('#modelSel').options].map(o=>[o.value,o.disabled,o.textContent]));
   for(const m of soon)check(tag+' editor lists '+m+' as coming soon, not selectable',menuState.some(o=>o[0]===m&&o[1]&&/coming soon/.test(o[2])),menuState);
   check(tag+' editor can select every Samsung phone with a kit',models.filter(m=>brandOf(m)==='Samsung').every(m=>menuState.some(o=>o[0]===m&&!o[1])));
   /* ---- the mask that failed to load: nothing, rather than the white guide ---- */
   await p.route('**/masks/view-rated-googpl10.png*',r=>r.abort());await p.goto(base+'gallery.html?device=pixel-10&q=mini+hearts');
   await p.waitForFunction(()=>document.querySelector('.kpCard .zoom-hint')?.textContent==='Case preview unavailable');
   check(tag+' no mask: the bare photo is not shown',await p.locator('.kpCard canvas').first().evaluate(c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data.every(v=>v===0)));
   await p.unroute('**/masks/view-rated-googpl10.png*');
   /* ---- every ?model= slug, with and without the brand, and the gallery's own links ---- */
   const e=await open(390,844);await e.route(/\.(png|jpe?g|webp|woff2?)(\?|$)|fonts\.g/,r=>r.abort());
   const state=()=>e.evaluate(()=>({model:__kp.state.model,brand:__kp.state.brand,type:__kp.state.caseType,rim:KPStudioCore.info().rim,total:KPStudioCore.info().total,drop:KPStudioCore.info().drop,browse:document.querySelector('#browseLink').getAttribute('href')}));
   async function go(url){await e.goto(url,{waitUntil:'domcontentloaded'});await e.waitForFunction(()=>window.__kp&&window.KPStudioCore&&__kp.state);return state();}
   for(const m of models){const k=kits[m],t=tag+' editor '+m;
    let s=await go(base+'customizer.html?model='+slug(short(m)));
    check(t+': ?model='+slug(short(m)),s.model===m&&s.brand===brandOf(m)&&s.type===(k.ratedOnly?'Rated Case':'MagSafe Clear')&&s.total===(k.ratedOnly?cfg.RATED_PRICE:cfg.PRICE),s);
    check(t+': its browse link is the gallery slug',s.browse==='gallery.html?device='+slug(short(m)),s.browse);
    s=await go(links[m]);
    check(t+': the gallery card link opens it',s.model===m&&s.type===(k.ratedOnly?'Rated Case':'MagSafe Clear')&&s.rim===(k.ratedOnly?k.rated.colors[0].n:null)&&s.drop===(k.rated&&k.rated.dropFt?k.rated.dropFt+' ft drop protection':''),s);
    if(brandOf(m)!=='Apple'){s=await go(base+'customizer.html?model='+slug(m));check(t+': ?model='+slug(m),s.model===m,s);}
   }
   check(tag+' editor menu holds every kit under its brand',models.every(m=>menu[brandOf(m)].includes(m)));
   await e.__ctx.close();
   /* ---- walk it: design, brand, phone, editor; and the second rim from a card ---- */
   for(const [brand,name] of [['Google','Pixel 10'],['Motorola','moto g 2026'],['Samsung','Galaxy S25'],['Apple','iPhone Duo'],['Apple','iPhone 17 Pro']]){
    const m=models.find(x=>short(x)===name),k=kits[m],w=await open(390,844);
    await w.goto(base+'gallery.html?q=mini+hearts');await w.locator('[data-pick-model]').first().waitFor();
    check(tag+' no phone yet: card says From '+CLEAR,/From \$44\.99/.test(await w.locator('[data-pick-model]').first().innerText()));
    await w.locator('[data-pick-model="clear-mini-hearts-transparent.png"]').click();await w.locator('[data-pill="'+brand+'"]').click();await w.locator('[data-md="'+slug(name)+'"]').click();
    await w.waitForFunction(()=>window.KPEditor&&!KPStudioCore.info().issue&&!KPStudioCore.info().loading);
    const s=await w.evaluate(()=>({model:__kp.state.model,type:__kp.state.caseType,rim:KPStudioCore.info().rim,total:KPStudioCore.info().total,q:location.search}));
    check(tag+' walk to '+name,s.model===m&&s.type===(k.ratedOnly?'Rated Case':'MagSafe Clear')&&s.total===(k.ratedOnly?cfg.RATED_PRICE:cfg.PRICE)&&s.rim===(k.ratedOnly?k.rated.colors[0].n:null)&&!/case=rated/.test(s.q),s);
    /* the case came with the phone: the next phone with a clear case is clear again */
    if(k.ratedOnly){await w.evaluate(()=>{const b=document.querySelector('#brandSel'),m=document.querySelector('#modelSel');if(b.value!=='Apple'){b.value='Apple';b.dispatchEvent(new Event('change'));}m.value='iPhone 17 Pro';m.dispatchEvent(new Event('change'));});await w.waitForFunction(()=>KPStudioCore.info().previewReady);
     check(tag+' '+name+' then iPhone 17 Pro: the clear case at '+CLEAR+' and a message',await w.evaluate(()=>KPStudioCore.info().caseType==='MagSafe Clear'&&KPStudioCore.info().total)===cfg.PRICE&&await w.waitForFunction(t=>document.querySelector('#kpToast')?.textContent===t,'Your case is the clear case again at '+CLEAR+'.',{timeout:3000}).then(()=>true,()=>false));}
    await w.screenshot({path:path.join(out,tag+'-walk-'+slug(name)+'.png')});await w.__ctx.close();
   }
   /* Use your own photo opens the editor on the chosen phone and comes back to it; with no phone it stays the plain link */
   const u=await open(390,844);await u.goto(base+'gallery.html');await u.locator('[data-pick-model]').first().waitFor();
   check(tag+' no phone: use your own photo is the plain editor',await u.locator('.library-photo-cta').getAttribute('href')==='customizer.html');
   await u.goto(base+'gallery.html?device=moto-g-power-2025');await u.locator('.kpCard').first().waitFor();await u.locator('.library-photo-cta').click();await u.waitForFunction(()=>window.KPEditor&&window.KPStudioCore);
   check(tag+' use your own photo from a moto: that phone, Rated Case, '+RATED,await u.evaluate(()=>__kp.state.model==='Motorola moto g power 2025'&&KPStudioCore.info().caseType==='Rated Case'&&KPStudioCore.info().total)===cfg.RATED_PRICE&&await u.evaluate(()=>document.querySelector('#studioBrowse').href.includes('device=moto-g-power-2025')),await u.url());
   /* the nearly square Duo is centered in Zoom on a phone, off the frame */
   await u.goto(base+'gallery.html?device=iphone-duo&q=mini+hearts');await drawn(u);await u.locator('.case-zoom-button').first().click();await u.locator('#caseZoomDialog canvas').waitFor();await u.waitForTimeout(300);
   const zd=await u.evaluate(()=>{const c=document.querySelector('#caseZoomDialog canvas').getBoundingClientRect(),v=document.querySelector('#caseZoomDialog .zoom-scroll').getBoundingClientRect(),s=document.querySelector('#caseZoomDialog .zoom-scroll');return {above:c.top-v.top,below:v.bottom-c.bottom,left:c.left-v.left,right:v.right-c.right,scroll:s.scrollWidth-s.clientWidth};});
   check(tag+' Duo zoom: centered, off the frame, no scrolling',Math.abs(zd.above-zd.below)<=2&&zd.left>=6&&zd.right>=6&&zd.scroll<=0,zd);
   await u.locator('#caseZoomDialog [data-step="1"]').click();await u.locator('#caseZoomDialog [data-step="1"]').click();
   check(tag+' Duo zoom: magnified it still scrolls to every edge',await u.evaluate(()=>{const s=document.querySelector('#caseZoomDialog .zoom-scroll'),c=document.querySelector('#caseZoomDialog canvas');s.scrollLeft=0;s.scrollTop=0;const a=c.getBoundingClientRect(),v=s.getBoundingClientRect();s.scrollLeft=1e6;s.scrollTop=1e6;const z=c.getBoundingClientRect();return a.left>=v.left-1&&a.top>=v.top-1&&z.right<=v.right+1&&z.bottom<=v.bottom+1&&s.scrollWidth>s.clientWidth;}));
   await u.__ctx.close();
   const r=await open(390,844);await r.goto(base+'gallery.html?device=moto-g-power-2026&q=mini+hearts');await drawn(r);
   await r.locator('.cdot[aria-label="Preview Clear Frost rim"]').first().click();await r.waitForFunction(()=>JSON.parse(document.querySelector('.kpCard canvas').dataset.renderedPreview||'[]')[2]===1);
   const href=await r.locator('.h-makeone').first().getAttribute('href');check(tag+' second rim: link and pressed state',new URL(href,base).searchParams.get('rim')==='Clear Frost'&&await r.locator('.cdot').nth(1).getAttribute('aria-pressed')==='true',href);
   await r.locator('.case-zoom-button').first().click();await r.locator('#caseZoomDialog canvas').waitFor();check(tag+' zoom shows the Rated case',await r.locator('#caseZoomDialog canvas').evaluate(c=>c.width>500));await r.locator('#caseZoomDialog [data-close]').click();
   await r.locator('.h-makeone').first().click();await r.waitForFunction(()=>window.KPStudioCore&&!KPStudioCore.info().loading);check(tag+' second rim reaches the editor',await r.evaluate(()=>KPStudioCore.info().rim)==='Clear Frost');
   await r.__ctx.close();await p.__ctx.close();
   check(tag+' no page errors',!errors.length,errors);
  }finally{await b.close();}
  console.log(tag+' done: '+pass+' checks passed so far, '+bad.length+' failed');
 }
 if(server)server.close();
 console.log((bad.length?'FAIL ':'PASS ')+pass+'/'+(pass+bad.length)+' rated everywhere checks');
 process.exit(bad.length?1:0);
})().catch(err=>{console.error(err);process.exit(1);});
