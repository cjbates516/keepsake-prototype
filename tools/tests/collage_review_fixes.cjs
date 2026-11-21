/* Regression checks for the layouts review: browsing layouts never loses photos, words or placement; loads in flight
   follow the customer; lettering and layouts recover from a failed request; spot buttons for keyboard users; toasts
   visible above the phone sheet; a full layout's add button is an opaque instruction; credits (retry, kiosk, short
   phones, staff slip). Chromium and WebKit.
   usage: node tools/tests/collage_review_fixes.cjs [outdir]   (KP_BASE=http://127.0.0.1:PORT/ to use a running server)
   Every photo is a synthetic canvas made inside the browser. */
const {chromium,webkit}=require(process.env.PW_CORE||'../../../playwright/node_modules/playwright-core');
const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..');
const out=path.resolve(process.argv[2]||'/tmp/keepsake-review-fixes');fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2','.pdf':'application/pdf'};
let server=null;
function serve(){return new Promise(r=>{server=http.createServer((req,res)=>{let f=path.join(root,decodeURIComponent(new URL(req.url,'http://local').pathname));if(f.endsWith(path.sep))f+='index.html';if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return}fs.readFile(f,(e,d)=>{if(e){res.writeHead(404).end();return}res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(d)})});server.listen(0,'127.0.0.1',()=>r('http://127.0.0.1:'+server.address().port+'/'))})}
const results=[];
function check(name,ok,detail){results.push({name,ok:!!ok,detail});console.log((ok?'PASS ':'FAIL ')+name+(detail===undefined?'':' '+JSON.stringify(detail)));}
const MODEL='iphone-17-pro-max';
/* credit checks use whatever the catalog has: a designs.json entry with a credit (none ship today, so those checks skip
   cleanly), any field photo for the plain text and no scroll checks, and a colorway catalog entry with a creditSlip */
const designs=JSON.parse(fs.readFileSync(path.join(root,'assets/designs/designs.json'),'utf8'));
const live=d=>d&&d.active!==false&&!d.hidden&&fs.existsSync(path.join(root,'assets/designs',d.file));
const credited=designs.find(d=>/^field-photo-.*\.jpg$/.test(d.file)&&d.credit&&live(d));
const fieldPhoto=credited||designs.find(d=>/^field-photo-.*\.jpg$/.test(d.file)&&live(d));
const creditWant=d=>'Image: '+d.credit.trim()+(d.license?' · '+String(d.license).trim():'');
const slipDesign=(()=>{const t=fs.readFileSync(path.join(root,'assets/colorway-catalog.js'),'utf8');const cat=JSON.parse(t.slice(t.indexOf('KP_COLORWAY_CATALOG=')+20,t.lastIndexOf(';')));
 const k=Object.keys(cat).find(f=>cat[f].creditSlip&&fs.existsSync(path.join(root,'assets/designs',f))&&fs.existsSync(path.join(root,cat[f].creditSlip)));return k?{file:k,slip:cat[k].creditSlip}:null;})();
const HOOK='window.__kpT={slotClient:function(i){var r=slotRects()[i],p=artMatrix().transformPoint(new DOMPoint(r.x+r.w/2,r.y+r.h/2)),b=canvas.getBoundingClientRect();return {x:b.left+p.x*b.width/DIM.w,y:b.top+p.y*b.height/DIM.h};},faces:function(){return kpFaces;},weak:function(){return kpWeakSlot;}};window.__kp={';
async function hooked(page,errors){
 page.on('pageerror',e=>errors.push('pageerror: '+e.message));
 page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push('console: '+m.text());});
 await page.route('**/assets/nsfw/**',r=>r.fulfill({contentType:'application/javascript',body:r.request().url().includes('nsfwjs')?"window.nsfwjs={load:async()=>({classify:async()=>[{className:'Neutral',probability:1}]})};":''}));
 await page.route(/\/customizer\.html(\?|$)/,async r=>{const res=await r.fetch();let body=await res.text();if(!body.includes('window.__kp={'))throw Error('hook literal missing');body=body.replace('window.__kp={',HOOK);await r.fulfill({response:res,body});});
}
const PNG_FN=`(w,h,hue)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,w,h);g.addColorStop(0,'hsl('+hue+',55%,48%)');g.addColorStop(1,'hsl('+((hue+50)%360)+',55%,62%)');x.fillStyle=g;x.fillRect(0,0,w,h);const u=c.toDataURL('image/png').split(',')[1];c.width=c.height=0;return u;}`;
async function png(page,w,h,hue){return Buffer.from(await page.evaluate(`(${PNG_FN})(${w},${h},${hue})`),'base64');}
const F=(b,n)=>({name:n,mimeType:'image/png',buffer:b});
const editorReady=p=>p.waitForFunction(()=>window.KPEditor&&window.__kp,null,{timeout:20000});
async function tool(p,id){await p.locator('[data-tool="'+id+'"]').click();await p.waitForFunction(id=>KPEditor.tool===id,id,{timeout:5000});}
async function done(p){if(await p.locator('#studioSheet').evaluate(e=>e.open)){await p.locator('#studioDone').click();await p.waitForFunction(()=>!document.getElementById('studioSheet').open);}}
async function waitFilled(p,n,ms){await p.waitForFunction(n=>{const l=__kp.layout();return !!l&&l.filled===n;},n,{timeout:ms||20000}).catch(()=>{});return p.evaluate(()=>__kp.layout()&&__kp.layout().filled);}
async function layout(p,id){if(!(await p.evaluate(()=>KPEditor.tool==='layouts')))await tool(p,'layouts');await p.locator('.layChip[data-l="'+id+'"]').click();await p.waitForFunction(id=>(__kp.state.layout||'')===id,id);}
async function addFiles(p,files){const chooser=p.waitForEvent('filechooser',{timeout:5000});await p.locator('#studioLayoutAdd').click();await (await chooser).setFiles(files);}
async function words(p,key,text){await done(p);await tool(p,'words');await p.locator('#captionList [data-key="'+key+'"]').fill(text);await done(p);}
async function shot(p,name){const f=path.join(out,name+'.png');await p.screenshot({path:f});return f;}
async function fresh(browser,opts,url){const ctx=await browser.newContext(opts);const page=await ctx.newPage();const errors=[];await hooked(page,errors);if(url){await page.goto(url);await editorReady(page);}return {ctx,page,errors};}

(async()=>{
 const base=process.env.KP_BASE?process.env.KP_BASE.replace(/\/?$/,'/'):await serve();
 for(const [engine,kind] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await kind.launch();
  /* 1. browsing layouts keeps every photo and the typed words (390 and 1440) */
  for(const width of [390,1440]){
   const tag=engine+' '+width,phone=width<761;
   const {ctx,page,errors}=await fresh(browser,{viewport:{width,height:phone?844:900},isMobile:phone,hasTouch:phone},base+'customizer.html?model='+MODEL);
   await page.waitForSelector('.layChip[data-l="tpl:102"]',{state:'attached'});
   const six=[];for(let i=0;i<6;i++)six.push(F(await png(page,1500,2000,i*50),'p'+i+'.png'));
   await layout(page,'tpl:102');await addFiles(page,six);
   check(tag+' Name Grid takes 6 photos',await waitFilled(page,6)===6);
   await words(page,'name','The Johnsons');
   const ids=await page.evaluate(()=>__kp.state.photos.map(p=>p.__kpId));
   await layout(page,'tpl:68');
   const a=await page.evaluate(()=>{const t=document.getElementById('kpToast');return {filled:__kp.layout().filled,spare:KPStudioCore.info().spare,name:__kp.state.captions.name,toast:t&&t.textContent,opacity:t&&t.style.opacity,host:t&&t.parentElement&&t.parentElement.id,sheet:document.getElementById('studioSheet').open,note:document.getElementById('studioLayoutSpare').hidden?'':document.getElementById('studioLayoutSpare').textContent};});
   check(tag+' Name Note keeps 4 photos and saves the other 2',a.filled===4&&a.spare===2,a);
   check(tag+' typed name carries into a layout with the same field',a.name==='The Johnsons',a);
   check(tag+' the notice says the photos are saved (toast and Layouts panel)',a.toast==='This layout has 4 spots. Your other 2 photos are saved for a layout with more spots.'&&a.opacity==='1'&&a.note==='2 more photos are saved for a layout with more spots.',a);
   if(phone)check(tag+' the toast joins the open phone sheet (top layer), so it is seen',a.sheet&&a.host==='studioSheet',a);
   await shot(page,engine+'-'+width+'-browse-name-note');
   await words(page,'name','Avery');
   await layout(page,'tpl:102');
   const b=await page.evaluate(()=>({filled:__kp.layout().filled,spare:KPStudioCore.info().spare,ids:__kp.state.photos.map(p=>p&&p.__kpId),name:__kp.state.captions.name,input:document.querySelector('#captionList [data-key="name"]').value}));
   check(tag+' back to Name Grid: all 6 photos in their order, latest name',b.filled===6&&b.spare===0&&JSON.stringify(b.ids)===JSON.stringify(ids)&&b.name==='Avery'&&b.input==='Avery',b);
   await layout(page,'');
   const c=await page.evaluate(()=>({img:__kp.state.photoImg&&__kp.state.photoImg.__kpId,spare:KPStudioCore.info().spare}));
   check(tag+' Single photo uses photo 1 and saves the other 5',c.img===ids[0]&&c.spare===5,c);
   await layout(page,'tpl:1');
   check(tag+' Photo Grid gets all 6 back',await page.evaluate(()=>__kp.layout().filled===6&&KPStudioCore.info().spare===0));
   /* a full layout's add button is an opaque instruction, not a translucent button over the chip grid */
   await layout(page,'tpl:20');
   const full=await page.evaluate(()=>{const b=document.getElementById('studioLayoutAdd'),s=getComputedStyle(b),u=document.getElementById('uploadBtn');return {text:b.textContent,disabled:b.disabled,opacity:s.opacity,position:s.position,bg:s.backgroundColor,upload:u.disabled};});
   check(tag+' full layout: add button reads as an opaque instruction',full.disabled&&full.upload&&full.text==='Layout complete. Tap a photo on the case to swap it'&&full.opacity==='1'&&full.position==='static'&&full.bg==='rgb(239, 237, 234)',full);
   if(!phone){
    const overlap=await page.evaluate(()=>{const b=document.getElementById('studioLayoutAdd').getBoundingClientRect();return [...document.querySelectorAll('.lay-name')].filter(n=>{const r=n.getBoundingClientRect();return r.width&&r.bottom>b.top&&r.top<b.bottom&&r.right>b.left&&r.left<b.right;}).map(n=>n.textContent);});
    check(tag+' full layout: no chip name sits under the add button',overlap.length===0,overlap);
   }
   await layout(page,'tpl:60');
   check(tag+' one-spot layout: "Tap your photo on the case to swap it"',await page.locator('#studioLayoutAdd').innerText()==='Tap your photo on the case to swap it');
   /* phone: reopening Layouts brings the chosen chip back into view */
   if(phone){
    await layout(page,'tpl:94');await done(page);await tool(page,'layouts');await page.waitForTimeout(200);
    const v=await page.evaluate(()=>{const row=document.getElementById('layoutChips').getBoundingClientRect(),c=document.querySelector('.layChip[aria-pressed="true"]').getBoundingClientRect();return {row:[row.left,row.right],chip:[c.left,c.right]};});
    check(tag+' reopened Layouts shows the chosen layout',v.chip[0]>=v.row[0]-1&&v.chip[1]<=v.row[1]+1,v);
   }
   check(tag+' no console errors',errors.length===0,errors);
   await ctx.close();
  }

  /* 2. single photo placement and full resolution come back after a trip through a layout (PF-6, ENG-1) */
  {
   const tag=engine;
   const {ctx,page,errors}=await fresh(browser,{viewport:{width:1440,height:900}},base+'customizer.html?model='+MODEL);
   await page.waitForSelector('.layChip[data-l="tpl:20"]',{state:'attached'});
   const big=await png(page,3000,4000,20);
   await addFiles(page,[F(big,'big.png')]);await page.waitForFunction(()=>__kp.state.photoImg&&__kp.state.photoImg.width===2304);
   await page.evaluate(()=>{KPStudioCore.adjust('scale',1.6);KPStudioCore.adjust('px',220);KPStudioCore.adjust('rot',12);});
   await layout(page,'tpl:20');await layout(page,'');
   const p=await page.evaluate(()=>({scale:__kp.state.scale,px:__kp.state.px,rot:__kp.state.rot}));
   check(tag+' Single photo placement survives a trip through a layout',p.scale===1.6&&p.px===220&&p.rot===12,p);
   await page.evaluate(()=>document.getElementById('clearBtn').click());
   await layout(page,'tpl:60');await addFiles(page,[F(big,'big.png')]);await waitFilled(page,1);
   const spot=await page.evaluate(()=>({w:__kp.state.photos[0].width,id:__kp.state.photos[0].__kpId}));
   await layout(page,'');
   await page.waitForFunction(()=>__kp.state.photoImg&&__kp.state.photoImg.width===2304,null,{timeout:10000}).catch(()=>{});
   const up=await page.evaluate(()=>({w:__kp.state.photoImg.width,id:__kp.state.photoImg.__kpId,dpi:__kp.dpi()}));
   check(tag+' a photo added in a layout returns to Single photo at full size',spot.w===1536&&up.w===2304&&up.id===spot.id&&up.dpi>600,{spot,up});
   check(tag+' no console errors (placement)',errors.length===0,errors);
   await ctx.close();
  }

  /* 3. loads still decoding follow the customer to the next layout (ENG-2) */
  {
   const tag=engine;
   const {ctx,page,errors}=await fresh(browser,{viewport:{width:1440,height:900}});
   await page.addInitScript(()=>{const o=window.createImageBitmap;if(o)window.createImageBitmap=function(...a){return new Promise(r=>setTimeout(r,1500)).then(()=>o.apply(window,a));};});
   await page.goto(base+'customizer.html?model='+MODEL);await editorReady(page);await page.waitForSelector('.layChip[data-l="tpl:102"]',{state:'attached'});
   const files=[];for(let i=0;i<6;i++)files.push(F(await png(page,1200,1600,i*40),'f'+i+'.png'));
   await layout(page,'tpl:102');await addFiles(page,files.slice(0,3));
   await page.locator('.layChip[data-l="tpl:1"]').click();
   check(tag+' 3 photos still loading land in the next layout',await waitFilled(page,3,10000)===3&&await page.evaluate(()=>__kp.state.layout==='tpl:1'));
   await page.evaluate(()=>{const d=document.getElementById('studioClearDialog');document.getElementById('clearBtn').click();if(d.open)document.getElementById('studioConfirmClear').click();});
   await page.locator('#fileInput').setInputFiles(files[0]);
   await page.locator('.layChip[data-l="tpl:20"]').click();
   check(tag+' a single photo still loading lands in spot 1',await waitFilled(page,1,10000)===1);
   await page.evaluate(()=>{const d=document.getElementById('studioClearDialog');document.getElementById('clearBtn').click();if(d.open)document.getElementById('studioConfirmClear').click();});
   await layout(page,'tpl:102');await addFiles(page,files);
   await page.locator('.layChip[data-l="tpl:60"]').click();
   await page.waitForFunction(()=>KPStudioCore.info().spare===5,null,{timeout:12000}).catch(()=>{});
   check(tag+' 6 photos loading into a 1 spot layout: 1 placed, 5 saved',await page.evaluate(()=>__kp.layout().filled===1&&KPStudioCore.info().spare===5),await page.evaluate(()=>({f:__kp.layout().filled,s:KPStudioCore.info().spare})));
   check(tag+' no console errors (in flight)',errors.length===0,errors);
   await ctx.close();
  }

  /* 4. spot buttons, drop, cancelled picker (UX-4, ENG-5) */
  {
   const tag=engine;
   const {ctx,page,errors}=await fresh(browser,{viewport:{width:1440,height:900}},base+'customizer.html?model='+MODEL);
   await page.waitForSelector('.layChip[data-l="tpl:20"]',{state:'attached'});
   await layout(page,'tpl:20');await addFiles(page,[F(await png(page,1200,1600,10),'a.png'),F(await png(page,1200,1600,90),'b.png')]);await waitFilled(page,2);
   const before=await page.evaluate(()=>__kp.state.photos.map(p=>p&&p.__kpId));
   await page.evaluate(()=>{__kp.state.slotTarget=0;});
   await page.locator('#fileInput').dispatchEvent('cancel');
   check(tag+' a cancelled picker clears the tapped spot',await page.evaluate(()=>__kp.state.slotTarget===null));
   await page.evaluate(()=>{__kp.state.slotTarget=0;});
   const drop=await png(page,1200,1600,200);
   await page.evaluate(async b64=>{const bin=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));const dt=new DataTransfer();dt.items.add(new File([bin],'drop.png',{type:'image/png'}));const ev=new Event('drop',{bubbles:true,cancelable:true});Object.defineProperty(ev,'dataTransfer',{value:dt});document.getElementById('stageWrap').dispatchEvent(ev);},drop.toString('base64'));
   await waitFilled(page,3);
   const after=await page.evaluate(()=>__kp.state.photos.map(p=>p&&p.__kpId));
   check(tag+' a drop fills the open spot and never replaces a tapped one',after[0]===before[0]&&after[1]===before[1]&&!!after[2],{before,after});
   await tool(page,'photo');
   const labels=await page.evaluate(()=>[...document.querySelectorAll('#studio-photo #slotButtons .slotBtn')].map(b=>b.getAttribute('aria-label')));
   check(tag+' Photo tool lists every spot as a button',JSON.stringify(labels)===JSON.stringify(['Replace photo 1 of 3','Replace photo 2 of 3','Replace photo 3 of 3']),labels);
   await page.locator('#slotButtons .slotBtn').nth(1).focus();
   const chooser=page.waitForEvent('filechooser',{timeout:5000});await page.keyboard.press('Enter');
   await (await chooser).setFiles(F(await png(page,1200,1600,300),'kbd.png'));
   await page.waitForFunction(id=>__kp.state.photos[1]&&__kp.state.photos[1].__kpId!==id,after[1],{timeout:10000}).catch(()=>{});
   const k=await page.evaluate(()=>__kp.state.photos.map(p=>p&&p.__kpId));
   check(tag+' keyboard: Enter on "Replace photo 2" swaps only photo 2',k[0]===after[0]&&k[1]!==after[1]&&k[2]===after[2],{after,k});
   check(tag+' no console errors (spots)',errors.length===0,errors);
   await ctx.close();
  }

  /* 5. lettering font that fails, then comes back (ENG-3) */
  {
   const tag=engine;
   const {ctx,page,errors}=await fresh(browser,{viewport:{width:1440,height:900}});
   let block=true,requests=0;
   await page.route('**/assets/fonts/special-elite-400.woff2',r=>{requests++;if(block)r.fulfill({status:503,body:''});else r.continue();});
   await page.goto(base+'customizer.html?model='+MODEL);await editorReady(page);await page.waitForSelector('.layChip[data-l="tpl:60"]',{state:'attached'});
   await layout(page,'tpl:60');await addFiles(page,[F(await png(page,1600,2000,60),'d.png')]);await waitFilled(page,1);
   await words(page,'date','06.14.2026');
   await page.waitForFunction(()=>__kp.printIssue().startsWith('The lettering could not load')&&document.getElementById('studioNext').disabled&&document.getElementById('studioStatus').textContent.startsWith('The lettering could not load'),null,{timeout:10000}).catch(()=>{});
   const e=await page.evaluate(()=>({issue:__kp.printIssue(),next:document.getElementById('studioNext').disabled,status:document.getElementById('studioStatus').textContent}));
   check(tag+' failed lettering: clear message, no reload advice, Preview waits',e.issue==='The lettering could not load. Check your connection and try again, or clear the words to continue.'&&e.next&&e.status===e.issue,e);
   block=false;
   await page.waitForFunction(()=>!__kp.printIssue(),null,{timeout:15000}).catch(()=>{});
   const r=await page.evaluate(()=>({issue:__kp.printIssue(),next:document.getElementById('studioNext').disabled,errored:[...document.fonts].filter(f=>f.family.replace(/"/g,'')==='Special Elite'&&f.status==='error').length}));
   check(tag+' lettering recovers by itself once the font is reachable (no reload)',r.issue===''&&!r.next&&requests>=2,{r,requests});
   check(tag+' failed font faces are removed, not piled up',r.errored===0,r);
   check(tag+' photo and words kept through the recovery',await page.evaluate(()=>__kp.layout().filled===1&&__kp.state.captions.date==='06.14.2026'));
   check(tag+' no console errors (lettering)',errors.length===0,errors);
   await ctx.close();
  }

  /* 6. layouts list that fails once (ENG-4, UX-6), designs.json that fails once (ENG-6) */
  {
   const tag=engine;
   const {ctx,page,errors}=await fresh(browser,{viewport:{width:1440,height:900}});
   let failT=true;await page.route('**/assets/collage/templates.json',r=>{if(failT){failT=false;r.abort();}else r.continue();});
   await page.goto(base+'customizer.html?model='+MODEL);await editorReady(page);
   await page.waitForFunction(()=>KPStudioCore.info().layoutsFailed,null,{timeout:8000}).catch(()=>{});
   await page.waitForTimeout(300);
   const f=await page.evaluate(()=>({tool:KPEditor.tool,wait:document.getElementById('studioLayoutsWait').textContent,retry:!document.getElementById('studioLayoutsRetry').hidden,add:document.getElementById('studioLayoutAdd').hidden?null:document.getElementById('studioLayoutAdd').textContent}));
   check(tag+' failed layouts list: says so, offers Try again and still adds a photo',f.tool==='layouts'&&/^Layouts could not load/.test(f.wait)&&f.retry&&f.add==='Upload a photo',f);
   await page.locator('#studioLayoutsRetry').click();
   await page.waitForFunction(()=>document.querySelectorAll('.layChip').length===19,null,{timeout:8000}).catch(()=>{});
   check(tag+' Try again loads the layouts',await page.evaluate(()=>document.querySelectorAll('.layChip').length===19&&document.getElementById('studioLayoutsWait').hidden&&document.getElementById('studioLayoutsRetry').hidden));
   if(credited){
    let failD=true;await page.route('**/assets/designs/designs.json*',r=>{if(failD){failD=false;r.abort();}else r.continue();});
    await page.goto(base+'customizer.html?model='+MODEL+'&design='+credited.file);await editorReady(page);
    await page.waitForFunction(()=>document.getElementById('cityPhotoCredit').textContent.startsWith('Image:'),null,{timeout:12000}).catch(()=>{});
    check(tag+' credit line recovers after one failed designs.json',await page.locator('#cityPhotoCredit').textContent()===creditWant(credited));
   } else check(tag+' credit line recovery (no credited design in designs.json; skipped)',true);
   check(tag+' no console errors (failed requests)',errors.length===0,errors);
   await ctx.close();
  }

  /* 7. credits: kiosks keep every credit link in the Photo tool (CC BY attribution, as on the baseline); short phones
     show it without scrolling; staff gets the slip; no designs.json fetch for credits nobody ships (R1, R7, F6, F1) */
  {
   const tag=engine;
   const {ctx,page}=await fresh(browser,{viewport:{width:1024,height:768}});
   const fieldSlug=fieldPhoto.file.replace(/^field-photo-|\.jpg$/g,'');
   for(const [file,href] of [[fieldPhoto.file,'field-photo-credits.html#'+fieldSlug],['kp-space-horsehead.jpg','new-print-credits.html#kp-space-horsehead']]){
    const anchor=href.split('#')[1];
    await page.goto(base+'customizer.html?kiosk=1&store=west-chester&model='+MODEL+'&design='+file);await editorReady(page);
    await page.waitForFunction(()=>!document.getElementById('cityPhotoCredit').hidden,null,{timeout:12000}).catch(()=>{});
    if(credited&&file===credited.file)await page.waitForFunction(()=>document.getElementById('cityPhotoCredit').textContent.startsWith('Image:'),null,{timeout:12000}).catch(()=>{});
    await tool(page,'photo');
    const k=await page.evaluate(()=>{const a=document.getElementById('cityPhotoCredit'),r=a.getBoundingClientRect();return {href:a.getAttribute('href'),text:a.textContent,inPhotoTool:!!a.closest('#studio-photo'),underCase:!!a.closest('.studio-credit'),visible:r.width>0&&r.height>0};});
    const res=await page.request.get(base+href.split('#')[0]);const body=res.ok()?await res.text():'';
    check(tag+' kiosk: '+file+' credit is a link in the Photo tool to its attribution',k.href===href&&k.inPhotoTool&&!k.underCase&&k.visible&&(credited&&file===credited.file?k.text===creditWant(credited):k.text==='Photograph and license')&&body.includes('id="'+anchor+'"'),k);
   }
   await ctx.close();
   {
    const {ctx:c4,page:p4}=await fresh(browser,{viewport:{width:1440,height:900}});const req=[];p4.on('request',r=>req.push(r.url()));
    await p4.goto(base+'customizer.html?model='+MODEL+'&design='+fieldPhoto.file);await editorReady(p4);
    await p4.waitForFunction(()=>!document.getElementById('cityPhotoCredit').hidden,null,{timeout:12000}).catch(()=>{});await p4.waitForTimeout(800);
    check(tag+' web field photo: credit link under the case, no designs.json request while no entry carries credits',await p4.evaluate(h=>{const a=document.getElementById('cityPhotoCredit');return a.getAttribute('href')===h&&!!a.closest('.studio-credit');},'field-photo-credits.html#'+fieldSlug)&&(!!credited||!req.some(u=>u.includes('/assets/designs/designs.json'))),req.filter(u=>u.includes('designs.json')));
    await c4.close();
   }
   for(const [w,h] of [[375,667],[390,664],[320,568]]){
    const {ctx:c2,page:p2}=await fresh(browser,{viewport:{width:w,height:h},isMobile:true,hasTouch:true});
    await p2.goto(base+'customizer.html?model='+MODEL+'&design='+fieldPhoto.file);await editorReady(p2);
    if(credited)await p2.waitForFunction(()=>document.getElementById('cityPhotoCredit').textContent.startsWith('Image:'),null,{timeout:12000}).catch(()=>{});
    else await p2.waitForFunction(()=>!document.getElementById('cityPhotoCredit').hidden,null,{timeout:12000}).catch(()=>{});
    await p2.waitForTimeout(300);
    const u=await p2.evaluate(()=>{const el=document.getElementById('cityPhotoCredit'),r=el.getBoundingClientRect();const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return {ok:!!hit&&(hit===el||el.contains(hit)),y:scrollY,top:Math.round(r.top),bottom:Math.round(r.bottom)};});
    check(tag+' '+w+'x'+h+' credit visible without scrolling',u.ok&&u.y===0,u);
    if(w===375)await shot(p2,engine+'-375x667-credit-no-scroll');
    await c2.close();
   }
   const {ctx:c3,page:p3}=await fresh(browser,{viewport:{width:1440,height:900}});
   if(slipDesign){
    await p3.goto(base+'customizer.html?staff=1&model='+MODEL+'&design='+slipDesign.file);
    await p3.waitForFunction(()=>{const a=document.querySelector('.staff-summary a[download]');return a&&!a.parentElement.hidden;},null,{timeout:12000}).catch(()=>{});
    const slip=await p3.evaluate(()=>{const a=document.querySelector('.staff-summary a[download]');return {hidden:a.parentElement.hidden,href:a.getAttribute('href')};});
    const res=slip.href?await p3.request.get(base+slip.href):null;
    check(tag+' staff: a credited design offers its credit slip PDF',!slip.hidden&&slip.href===slipDesign.slip&&res&&res.ok()&&(await res.body()).slice(0,5).toString()==='%PDF-',slip);
   } else check(tag+' staff credit slip (no design with a credit slip; skipped)',true);
   await p3.goto(base+'customizer.html?staff=1&model='+MODEL+'&design=boho-floral-01.jpg');await p3.waitForTimeout(1500);
   check(tag+' staff: a design without a credit shows no slip link',await p3.evaluate(()=>document.querySelector('.staff-summary a[download]').parentElement.hidden));
   await c3.close();
  }

  /* 8. labels for one photo wait for it; a soft photo is outlined and its spot marked (PF-5 minimum, UX-5) */
  {
   const tag=engine;
   const {ctx,page,errors}=await fresh(browser,{viewport:{width:1440,height:900}},base+'customizer.html?model='+MODEL);
   await page.waitForSelector('.layChip[data-l="tpl:87"]',{state:'attached'});
   const four=[];for(let i=0;i<4;i++)four.push(F(await png(page,1200,1600,i*70),'q'+i+'.png'));
   await layout(page,'tpl:87');await addFiles(page,four);
   await waitFilled(page,4);
   await page.waitForFunction(()=>!__kp.printIssue(),null,{timeout:15000}).catch(()=>{});
   const info=await page.evaluate(()=>__kp.layout().captions.filter(c=>/^label[56]$/.test(c.key)).map(c=>[c.key,c.waiting]));
   check(tag+' labels for photos 5 and 6 wait for those photos',JSON.stringify(info)==='[["label5",5],["label6",6]]',info);
   const ink=await page.evaluate(()=>new Promise(res=>{const st=__kp.state,keep=Object.assign({},st.captions);let a=null,b=null;__kp.buildPrint(c=>{a=c.getContext('2d').getImageData(0,0,c.width,c.height).data;});st.captions.label5='';st.captions.label6='';__kp.buildPrint(c=>{b=c.getContext('2d').getImageData(0,0,c.width,c.height).data;});st.captions=keep;let d=0;for(let i=0;i<a.length;i+=4){if(a[i]!==b[i]||a[i+3]!==b[i+3])d++;}res(d);}));
   check(tag+' a label for a missing photo prints nothing',ink===0,ink);
   check(tag+' no console errors (labels)',errors.length===0,errors);
   await ctx.close();
  }
  await browser.close();
 }
 const failed=results.filter(r=>!r.ok);
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,1));
 console.log(results.length-failed.length+'/'+results.length+' review fix checks passed');
 if(server)server.close();
 if(failed.length)process.exit(1);
})().catch(e=>{console.error(e);if(server)server.close();process.exit(1);});
