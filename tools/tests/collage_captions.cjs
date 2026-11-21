/* Layout picker, words templates, print quality pill and photo credits.
   Customer pages run inside the touch editor (assets/design-editor.js): Layouts and Words tools at 390 and 1440 in
   Chromium and WebKit. The classic rail picker is covered in staff mode (?staff=1), which keeps the classic rail.
   usage: node tools/tests/collage_captions.cjs [outdir]
   Serves the repo itself on a free port unless KP_BASE is set (for example KP_BASE=http://127.0.0.1:18461/).
   Set PW_CORE when playwright-core is not at ../../../playwright/node_modules/playwright-core.
   Every photo is a synthetic canvas made inside the browser; no customer content is used. */
const {chromium,webkit}=require(process.env.PW_CORE||'../../../playwright/node_modules/playwright-core');
const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..');
const out=path.resolve(process.argv[2]||'/tmp/keepsake-collage-captions');fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2','.pdf':'application/pdf'};
let server=null;
function serve(){return new Promise(r=>{server=http.createServer((req,res)=>{let f=path.join(root,decodeURIComponent(new URL(req.url,'http://local').pathname));if(f.endsWith(path.sep))f+='index.html';if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return}fs.readFile(f,(e,d)=>{if(e){res.writeHead(404).end();return}res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(d)})});server.listen(0,'127.0.0.1',()=>r('http://127.0.0.1:'+server.address().port+'/'))})}
const results=[];
function check(name,ok,detail){results.push({name,ok:!!ok,detail});console.log((ok?'PASS ':'FAIL ')+name+(detail===undefined?'':' '+JSON.stringify(detail)));}
const MODEL='iphone-17-pro-max';
const designs=JSON.parse(fs.readFileSync(path.join(root,'assets/designs/designs.json'),'utf8'));
const credited=designs.find(d=>/^field-photo-.*\.jpg$/.test(d.file)&&d.credit&&d.active!==false&&!d.hidden&&fs.existsSync(path.join(root,'assets/designs',d.file)));
const uncredited=designs.find(d=>/^field-photo-.*\.jpg$/.test(d.file)&&!d.credit&&d.active!==false&&!d.hidden&&fs.existsSync(path.join(root,'assets/designs',d.file)));
const templates=JSON.parse(fs.readFileSync(path.join(root,'assets/collage/templates.json'),'utf8'));

/* QA hook: keeps the literal the print tests rely on and adds read-only helpers next to it */
const HOOK='window.__kpT={photoBox:photoBox,slotRects:slotRects,tplMap:tplMap,tpls:function(){return KP_TPLS;},cur:curTpl,faces:function(){return kpFaces;},y:function(){return KPPrintGeometry.metrics(TPL,FIT).y;},'+
 'toStage:function(ax,ay){var p=artMatrix().transformPoint(new DOMPoint(ax,ay));return {x:p.x*PS,y:p.y*PS};},'+
 'toPrint:function(ax,ay){var pxW=TPL.pxW||Math.round(TPL.w*300/72),pxH=TPL.pxH||Math.round(TPL.h*300/72);var m=new DOMMatrix().translate(18,18).scale(pxW/TPL.w,pxH/TPL.h).scale(1/FIT.sx,1/FIT.sy).translate(-FIT.x,-FIT.y).multiply(artMatrix());var p=m.transformPoint(new DOMPoint(ax,ay));return {x:p.x,y:p.y};},'+
 'slotClient:function(i){var r=slotRects()[i],p=artMatrix().transformPoint(new DOMPoint(r.x+r.w/2,r.y+r.h/2)),b=canvas.getBoundingClientRect();return {x:b.left+p.x*b.width/DIM.w,y:b.top+p.y*b.height/DIM.h};}};window.__kp={';

async function hooked(page,errors,net){
 page.on('pageerror',e=>errors.push('pageerror: '+e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
 page.on('request',r=>net.push(new URL(r.url()).pathname));
 await page.route('**/assets/nsfw/**',r=>r.fulfill({contentType:'application/javascript',body:r.request().url().includes('nsfwjs')?"window.nsfwjs={load:async()=>({classify:async()=>[{className:'Porn',probability:window.__rejectTestPhoto?.9:0}]})};":''}));
 await page.route(/\/customizer\.html(\?|$)/,async r=>{const res=await r.fetch();let body=await res.text();if(!body.includes('window.__kp={'))throw Error('hook literal missing');body=body.replace('window.__kp={',HOOK);await r.fulfill({response:res,body});});
}
/* mid tones only (no near black, no pure white) so caption ink and plates are unambiguous in the print */
const PNG_FN=`(w,h,hue)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,w,h);g.addColorStop(0,'hsl('+hue+',55%,48%)');g.addColorStop(1,'hsl('+((hue+50)%360)+',55%,62%)');x.fillStyle=g;x.fillRect(0,0,w,h);x.fillStyle='hsl('+((hue+180)%360)+',45%,55%)';x.fillRect(w*.2,h*.3,w*.6,h*.25);const u=c.toDataURL('image/png').split(',')[1];c.width=c.height=0;return u;}`;
async function png(page,w,h,hue){return Buffer.from(await page.evaluate(`(${PNG_FN})(${w},${h},${hue})`),'base64');}
async function waitFilled(page,n){await page.waitForFunction(n=>{const l=__kp.layout();return !!l&&l.filled===n;},n,{timeout:20000}).catch(()=>{});return page.evaluate(()=>__kp.layout()&&__kp.layout().filled);}
async function badge(page){return page.evaluate(()=>{const b=document.getElementById('printBadge'),r=b.getBoundingClientRect(),s=document.getElementById('stageStick').getBoundingClientRect();return {hidden:b.hidden,text:b.textContent,cls:b.className,h:Math.round(r.height),right:Math.round(r.right),left:Math.round(r.left),vw:innerWidth,inStage:r.left>=s.left-1&&r.right<=s.right+1&&r.top>=s.top-1&&r.bottom<=s.bottom+1,label:document.getElementById('dpiLabel').textContent,labelColor:getComputedStyle(document.getElementById('dpiLabel')).color,color:getComputedStyle(b).color,bg:getComputedStyle(b).backgroundColor};});}
async function waitBadge(page,text){await page.waitForFunction(t=>document.getElementById('printBadge').textContent.startsWith(t),text,{timeout:8000}).catch(()=>{});return badge(page);}
async function noOverflow(page){return page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);}
/* region stats of a canvas (stage or print), box given in that canvas's pixels */
const STATS_FN=`(c,box)=>{const x0=Math.max(0,Math.floor(box.x)),y0=Math.max(0,Math.floor(box.y)),w=Math.min(c.width-x0,Math.ceil(box.w)),h=Math.min(c.height-y0,Math.ceil(box.h));const d=c.getContext('2d').getImageData(x0,y0,w,h).data;let dark=0,white=0,hash=2166136261;for(let i=0;i<d.length;i+=4){const l=d[i]*.299+d[i+1]*.587+d[i+2]*.114;if(d[i+3]>200&&l<70)dark++;if(d[i+3]>200&&l>250)white++;for(let j=0;j<4;j++)hash=Math.imul(hash^d[i+j],16777619);}return {dark,white,hash:hash>>>0,n:w*h};}`;
/* caption box (axis aligned bounds of the rotated text box) in print pixels */
async function printCaption(page,key){
 return page.evaluate(async({key,STATS})=>{const stats=eval(STATS);let out=null;
  for(let i=0;i<40&&!out;i++){__kp.buildPrint(c=>{const t=__kpT.cur(),x=t.texts.find(q=>q.key===key),m=__kpT.tplMap();const s=m.sc,cx=m.ox+x.cx*1080*s,cy=m.oy+x.cy*1920*s,hw=x.w*1080*s/2,hh=x.h*1920*s/2;
   const pts=[[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]].map(([a,b])=>__kpT.toPrint(cx+a,cy+b));const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);
   const box={x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};
   const full=stats(c,{x:0,y:0,w:c.width,h:c.height});out={box,cap:stats(c,box),full,w:c.width,h:c.height};});
   if(!out)await new Promise(r=>setTimeout(r,250));}
  return out;},{key,STATS:STATS_FN});
}
async function stageCaption(page,key){
 return page.evaluate(({key,STATS})=>{const stats=eval(STATS);const t=__kpT.cur(),x=t.texts.find(q=>q.key===key),m=__kpT.tplMap(),s=m.sc;const cx=m.ox+x.cx*1080*s,cy=m.oy+x.cy*1920*s,hw=x.w*1080*s/2,hh=x.h*1920*s/2;
  const pts=[[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]].map(([a,b])=>__kpT.toStage(cx+a,cy+b));const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);
  return stats(document.getElementById('stageCanvas'),{x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)});},{key,STATS:STATS_FN});
}
async function settle(page){await page.evaluate(()=>new Promise(r=>{__kp.render();setTimeout(()=>requestAnimationFrame(()=>setTimeout(r,60)),220);}));}
async function tapSlot(page,i,files){
 await done(page);
 await page.locator('#stageCanvas').scrollIntoViewIfNeeded();
 const pt=await page.evaluate(i=>__kpT.slotClient(i),i);
 const chooser=page.waitForEvent('filechooser',{timeout:5000});
 await page.mouse.click(pt.x,pt.y);
 const fc=await chooser;await fc.setFiles(files);
}
async function shot(page,name,el){
 const file=path.join(out,name+'.png');
 if(el){await page.locator(el).scrollIntoViewIfNeeded();}
 await page.screenshot({path:file});return file;
}
/* editor helpers: one tool at a time; on phones the tool opens a sheet with Done */
const editorReady=p=>p.waitForFunction(()=>window.KPEditor&&window.__kp,null,{timeout:20000});
async function tool(p,id){await p.locator('[data-tool="'+id+'"]').click();await p.waitForFunction(id=>KPEditor.tool===id,id,{timeout:5000});}
async function done(p){if(await p.locator('#studioSheet').evaluate(e=>e.open)){await p.locator('#studioDone').click();await p.waitForFunction(()=>!document.getElementById('studioSheet').open);}}
async function tools(p){return p.evaluate(()=>[...document.querySelectorAll('.studio-tools [data-tool]')].filter(b=>!b.hidden).map(b=>b.dataset.tool));}
/* the element is painted and nothing (tray, footer, sheet) covers its middle */
async function uncovered(p,sel){return p.evaluate(sel=>{const el=document.querySelector(sel),r=el.getBoundingClientRect();if(!r.width||!r.height)return false;const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return !!hit&&(hit===el||el.contains(hit));},sel);}

(async()=>{
 const base=process.env.KP_BASE?process.env.KP_BASE.replace(/\/?$/,'/'):await serve();
 console.log('base',base,'credited',credited&&credited.file,'uncredited',uncredited&&uncredited.file);
 const words=templates.filter(t=>(t.texts||[]).length),collages=templates.filter(t=>!(t.texts||[]).length);
 for(const [engine,kind] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await kind.launch();
  for(const width of [390,1440]){
   const tag=engine+' '+width, phone=width<761;
   const ctx=await browser.newContext({viewport:{width,height:phone?844:1000},deviceScaleFactor:1,isMobile:phone,hasTouch:phone});
   const page=await ctx.newPage();const errors=[],net=[];await hooked(page,errors,net);
   const big=[await png(page,2400,3200,10),await png(page,2400,3200,130),await png(page,2400,3200,220),await png(page,2400,3200,290)];
   const small=await png(page,500,650,40),medium=await png(page,800,1066,180);
   const F=(b,n)=>({name:n,mimeType:'image/png',buffer:b});

   /* 1. library design: no layout requests, no Layouts tool, no pill */
   await page.goto(base+'customizer.html?model='+MODEL+'&design=boho-floral-01.jpg');await editorReady(page);
   await page.waitForFunction(()=>__kp.state.photoImg&&!__kp.state.photoImg.__kpIsThumb,null,{timeout:20000});await page.waitForTimeout(1200);
   check(tag+' library design loads nothing from assets/collage',net.filter(p=>p.includes('/assets/collage/')).length===0&&await page.locator('.layChip').count()===0,net.filter(p=>p.includes('/assets/collage/')));
   const libTools=await tools(page);
   check(tag+' library design: no Layouts or Words tool, Background kept',!libTools.includes('layouts')&&!libTools.includes('words')&&libTools.includes('background')&&libTools.includes('name'),libTools);
   check(tag+' library design hides the pill',await page.locator('#printBadge').isHidden());
   /* a customer photo replaces the library design: from then on it is the photo path */
   await tool(page,'photo');await page.locator('#fileInput').setInputFiles(F(big[0],'own.png'));
   await page.waitForFunction(()=>__kp.state.photoImg&&!__kp.state.isLibraryDesign&&!document.querySelector('[data-tool="layouts"]').hidden,null,{timeout:10000}).catch(()=>{});
   const ownTools=await tools(page);await done(page);
   check(tag+' own photo over a library design brings Layouts (and drops Background)',ownTools.includes('layouts')&&!ownTools.includes('background')&&await page.evaluate(()=>KPStudioCore.info().layoutsReady||!!document.querySelector('.layChip')),ownTools);

   /* 2. photo credit (any credited library photo): visible under the case with no tool or sheet open */
   net.length=0;
   if(credited){
    await page.goto(base+'customizer.html?model='+MODEL+'&design='+credited.file);await editorReady(page);
    const want='Image: '+credited.credit.trim()+(credited.license?' · '+credited.license.trim():'');
    await page.waitForFunction(w=>document.getElementById('cityPhotoCredit').textContent===w,want,{timeout:15000}).catch(()=>{});
    await done(page);await page.locator('#cityPhotoCredit').scrollIntoViewIfNeeded();
    const cr=await page.evaluate(()=>{const a=document.getElementById('cityPhotoCredit'),rs=[...a.getClientRects()];return {text:a.textContent,href:a.getAttribute('href'),hidden:a.hidden,visible:!!rs.length,inStage:!!a.closest('#stageStick'),inTool:!!a.closest('.studio-panel'),sheet:document.getElementById('studioSheet').open,inside:rs.every(r=>r.left>=0&&r.right<=innerWidth+.5),overflow:getComputedStyle(a).textOverflow};});
    const slug=credited.file.replace(/^field-photo-|\.jpg$/g,'');
    check(tag+' photo credit text and link',cr.text===want&&cr.href==='field-photo-credits.html#'+slug&&!cr.hidden&&cr.visible,cr);
    check(tag+' photo credit sits under the case, outside the tools, no sheet needed',cr.inStage&&!cr.inTool&&!cr.sheet&&await uncovered(page,'#cityPhotoCredit'),cr);
    check(tag+' photo credit fits the viewport',cr.inside&&cr.overflow!=='ellipsis'&&await noOverflow(page),cr);
    check(tag+' library credit page has no layout requests',net.filter(p=>p.includes('/assets/collage/')).length===0);
    await shot(page,engine+'-'+width+'-photo-credit','#cityPhotoCredit');
   } else check(tag+' photo credit (no credited design found; skipped)',true);
   if(uncredited){
    await page.goto(base+'customizer.html?model='+MODEL+'&design='+uncredited.file);await editorReady(page);
    await page.waitForFunction(()=>window.__kp&&__kp.state.photoImg&&!document.getElementById('cityPhotoCredit').hidden,null,{timeout:15000}).catch(()=>{});await page.waitForTimeout(500);
    check(tag+' field photo without credit keeps "Photograph and license"',await page.locator('#cityPhotoCredit').textContent()==='Photograph and license');
   }

   /* 3. customer photo path: Layouts tool with 19 chips (desktop opens it by default) */
   net.length=0;
   await page.goto(base+'customizer.html?model='+MODEL);await editorReady(page);
   await page.waitForFunction(()=>document.querySelectorAll('.layChip').length>1,null,{timeout:10000});
   await page.waitForFunction(()=>!document.querySelector('[data-tool="layouts"]').hidden,null,{timeout:5000}).catch(()=>{});
   const t0=await tools(page);
   check(tag+' photo path tools: Layouts shown, Words and Background hidden',t0.includes('layouts')&&t0.includes('photo')&&t0.includes('name')&&!t0.includes('words')&&!t0.includes('background'),t0);
   check(tag+' tray stays one row above the footer',await page.evaluate(()=>{const bs=[...document.querySelectorAll('.studio-tools [data-tool]')].filter(b=>!b.hidden).map(b=>b.getBoundingClientRect()),f=document.getElementById('studioFooter').getBoundingClientRect();return bs.every(r=>Math.abs(r.top-bs[0].top)<1&&r.bottom<=f.top+1);}));
   check(tag+' tool labels fit their buttons',await page.evaluate(()=>[...document.querySelectorAll('.studio-tools [data-tool]')].filter(b=>!b.hidden).every(b=>{const s=b.querySelector('strong');return s.scrollWidth<=b.clientWidth;})));
   if(!phone)check(tag+' desktop opens Layouts first',await page.evaluate(()=>KPEditor.tool==='layouts'&&!document.getElementById('studio-layouts').hidden));
   else await tool(page,'layouts');
   check(tag+' picker lives in the Layouts tool',await page.evaluate(()=>!!document.querySelector('#studio-layouts #layoutChipsWrap')&&!document.getElementById('layoutChipsWrap').hidden&&(!matchMedia('(max-width:760px)').matches||!!document.querySelector('#studioSheet[open] #layoutChipsWrap'))));
   const chips=await page.evaluate(()=>[...document.querySelectorAll('.layChip')].map(b=>({l:b.dataset.l,label:b.getAttribute('aria-label'),pressed:b.getAttribute('aria-pressed'),aa:!!b.querySelector('.lay-aa'),name:b.querySelector('.lay-name').textContent,img:b.querySelector('img')?b.querySelector('img').getAttribute('src'):null})));
   check(tag+' picker has 19 chips',chips.length===19,chips.length);
   const order=chips.slice(1).map(c=>c.l).join(),wantOrder=words.concat(collages).map(t=>'tpl:'+t.id).join();
   check(tag+' chip order: Single photo, words, collages',chips[0].l===''&&chips[0].name==='Single photo'&&chips[0].pressed==='true'&&order===wantOrder,{first:chips[0],order});
   /* thumbnails carry the release version (KP_COLLAGE_V) so a cached old thumbnail never shows */
   check(tag+' chip labels, Aa badges and versioned thumbnails',chips.slice(1).every((c,i)=>{const t=words.concat(collages)[i],n=t.slots.length,w=(t.texts||[]).length>0;return c.label===t.n+', '+n+(n===1?' photo':' photos')+(w?', with your words':'')&&c.aa===w&&c.name===t.n&&/^assets\/collage\/[^?]+\?v=[a-z0-9-]+$/.test(c.img||'')&&c.img.split('?')[0]==='assets/collage/'+t.thumb;}),chips.slice(1,3).map(c=>c.img));
   check(tag+' templates.json fetched once',net.filter(p=>p.endsWith('/assets/collage/templates.json')).length===1,net.filter(p=>p.includes('templates.json')));
   await page.waitForFunction(()=>[...document.querySelectorAll('.layChip img')].slice(0,8).every(i=>i.complete&&i.naturalWidth>0),null,{timeout:10000}).catch(()=>{});
   check(tag+' Layouts add button mirrors the upload label',await page.locator('#studioLayoutAdd').innerText()==='Upload a photo');
   check(tag+' no horizontal overflow with the Layouts tool',await noOverflow(page));
   await shot(page,engine+'-'+width+'-layouts-panel');

   /* 4. single photo through the Layouts add button: pill states, and no second "looks great" in the editor */
   {const chooser=page.waitForEvent('filechooser',{timeout:5000});await page.locator('#studioLayoutAdd').click();await (await chooser).setFiles(F(big[0],'big.png'));}
   let b1=await waitBadge(page,'Print quality: Looks sharp');
   const dpiCheck=await page.evaluate(()=>{const s=__kp.state,B=__kpT.photoBox(),iw=s.photoImg.width,ih=s.photoImg.height;return {app:__kp.dpi(),formula:Math.round(300/(Math.max(B.w/iw,B.h/ih)*__kpT.y())),fit:s.fitMode,scale:s.scale};});
   check(tag+' slot dpi formula equals kpEffectiveDpi for a photo filling the window',dpiCheck.fit==='fill'&&dpiCheck.app===dpiCheck.formula,dpiCheck);
   check(tag+' large single photo: Looks sharp (green) and the stage note stays quiet',!b1.hidden&&b1.text==='Print quality: Looks sharp'&&b1.cls.includes('pb-green')&&b1.color==='rgb(25, 108, 52)'&&b1.label==='',b1);
   await done(page);b1=await badge(page);
   check(tag+' pill is one line inside the stage',b1.h<=30&&b1.left>=0&&b1.right<=b1.vw&&b1.inStage,b1);
   check(tag+' customer pill has no PPI number',!/PPI/.test(b1.text));
   check(tag+' Adjust and Name stay for a single photo',(await tools(page)).join()==='phone,name,adjust,layouts,photo',await tools(page));
   await page.locator('#fileInput').setInputFiles(F(medium,'medium.png'));
   const bm=await waitBadge(page,'Print quality: May look soft');
   check(tag+' medium single photo: May look soft (amber) with advice only',bm.text==='Print quality: May look soft'&&bm.cls.includes('pb-yellow')&&bm.color==='rgb(138, 90, 0)'&&bm.label==='Fine details may soften. Zoom out or use a larger photo for a sharper print.'&&bm.labelColor==='rgb(138, 90, 0)',bm);
   await page.locator('#fileInput').setInputFiles(F(small,'small.png'));
   const bs=await waitBadge(page,'Print quality: Too low for this size');
   check(tag+' small single photo: Too low (red) with advice only',bs.text==='Print quality: Too low for this size'&&bs.cls.includes('pb-red')&&bs.color==='rgb(184, 31, 36)'&&/^Zoom out, or use the original photo/.test(bs.label)&&bs.labelColor==='rgb(184, 31, 36)'&&bs.h<=30&&bs.right<=bs.vw,bs);
   const singleId=await page.evaluate(()=>__kp.state.photoImg.__kpId);

   /* 5. words template 102 from the Layouts tool: photo carried into spot 1, Words replaces Name, multi file pick */
   await tool(page,'layouts');
   await page.locator('.layChip[data-l="tpl:102"]').click();
   await page.waitForTimeout(500);
   const after=await page.evaluate(()=>({layout:__kp.state.layout,photo0:__kp.state.photos[0]&&__kp.state.photos[0].__kpId,photoImg:!!__kp.state.photoImg,multiple:document.getElementById('fileInput').multiple,pressed:document.querySelector('.layChip[aria-pressed="true"]').dataset.l,tools:[...document.querySelectorAll('.studio-tools [data-tool]')].filter(b=>!b.hidden).map(b=>b.dataset.tool),add:document.getElementById('studioLayoutAdd').textContent,tool:KPEditor.tool,sheet:document.getElementById('studioSheet').open,undo:document.getElementById('studioUndo').disabled,scrollY:scrollY}));
   check(tag+' choosing a words template keeps the photo in spot 1',after.layout==='tpl:102'&&after.photo0===singleId&&!after.photoImg&&after.pressed==='tpl:102',after);
   check(tag+' words template: Words replaces Name, Adjust steps aside',after.tools.join()==='phone,words,layouts,photo'&&after.multiple,after.tools);
   check(tag+' Layouts tool stays open and the add button reads Add photo 2 of 6',after.tool==='layouts'&&after.add==='Add photo 2 of 6'&&(!phone||after.sheet),after);
   check(tag+' a new layout starts a fresh undo history',after.undo,after);
   const bc=await badge(page),cd=await page.evaluate(()=>__kp.dpi());
   const cq=cd>=280?'green':cd>=200?'yellow':'red';
   check(tag+' collage pill follows the spot PPI',bc.cls.includes('pb-'+cq)&&bc.label===(cq==='green'?'':'The outlined photo is the softest. A larger original will print sharper.')&&cd>0,{bc,cd,cq});
   await page.locator('#fileInput').setInputFiles([F(big[1],'b1.png'),F(big[2],'b2.png'),F(big[3],'b3.png')]);
   const filled=await waitFilled(page,4);
   check(tag+' multi file pick fills several spots',filled===4&&await page.evaluate(()=>__kp.state.photos.slice(1,4).every(Boolean)&&!__kp.state.photos[4]),filled);
   check(tag+' add button counts the next spot',await page.locator('#studioLayoutAdd').innerText()==='Add photo 5 of 6');
   await settle(page);
   const stageEmpty=await stageCaption(page,'name');
   const printEmpty=await printCaption(page,'name');
   /* the same print with the template's words removed: an empty required field must add nothing */
   const printNoText=await page.evaluate(async({STATS})=>{const stats=eval(STATS);const t=__kpT.cur(),keep=t.texts;t.texts=[];let o=null;__kp.buildPrint(c=>{o=stats(c,{x:0,y:0,w:c.width,h:c.height});});t.texts=keep;return o;},{STATS:STATS_FN});
   check(tag+' empty required name prints nothing (no text, no plate)',printEmpty&&printNoText&&printEmpty.full.hash===printNoText.hash&&printEmpty.cap.dark===0,{empty:printEmpty&&printEmpty.cap,none:printNoText&&printNoText.hash});

   /* 6. Words tool: type, then undo and redo the words without touching the layout or its photos */
   await done(page);await tool(page,'words');
   const cap=await page.evaluate(()=>{const i=document.querySelector('#captionList [data-key="name"]');return {inWords:!!i.closest('#studio-words'),value:i.value,placeholder:i.placeholder,max:i.maxLength,size:getComputedStyle(i).fontSize,label:document.querySelector('label[for="'+i.id+'"]').textContent,dupHeading:getComputedStyle(document.querySelector('#captionFields>div')).display};});
   check(tag+' Words tool holds the fields: required name empty with example placeholder',cap.inWords&&cap.value===''&&cap.placeholder==='Your name'&&cap.max===18&&cap.size==='16px'&&cap.label==='Name'&&cap.dupHeading==='none',cap);
   await page.locator('#captionList [data-key="name"]').fill('Avery Lane');
   await page.waitForFunction(()=>!__kp.printIssue(),null,{timeout:10000}).catch(()=>{});
   await settle(page);await page.waitForTimeout(450);
   const stageTyped=await stageCaption(page,'name');
   check(tag+' stage pixels change in the caption box',stageTyped.hash!==stageEmpty.hash&&stageTyped.dark>stageEmpty.dark+20,{before:stageEmpty,after:stageTyped});
   const printTyped=await printCaption(page,'name');
   check(tag+' print has caption ink and its plate in the caption area',printTyped&&printTyped.cap.dark>200&&printTyped.cap.white>printEmpty.cap.white+500,{typed:printTyped&&printTyped.cap,empty:printEmpty&&printEmpty.cap});
   check(tag+' caption is never written to the URL',!/Avery/.test(page.url()));
   check(tag+' no horizontal overflow with the Words tool',await noOverflow(page));
   await shot(page,engine+'-'+width+'-words-tool');
   await done(page);
   await page.locator('#studioUndo').click();
   const undone=await page.evaluate(()=>({cap:__kp.state.captions.name,input:document.querySelector('#captionList [data-key="name"]').value,layout:__kp.state.layout,filled:__kp.layout().filled,text:__kp.state.text}));
   check(tag+' Undo restores the words only (layout and photos stay)',undone.cap===''&&undone.input===''&&undone.layout==='tpl:102'&&undone.filled===4,undone);
   await page.locator('#studioRedo').click();
   check(tag+' Redo brings the words back',await page.evaluate(()=>__kp.state.captions.name==='Avery Lane'&&document.querySelector('#captionList [data-key="name"]').value==='Avery Lane'&&__kp.layout().filled===4));
   await page.locator('#stageCanvas').scrollIntoViewIfNeeded();
   await shot(page,engine+'-'+width+'-words-template-typed');

   /* 7. replace spot 1 by tapping it on the case: every spot sharp now */
   await tapSlot(page,0,F(big[0],'replace.png'));
   await page.waitForFunction(id=>__kp.state.photos[0]&&__kp.state.photos[0].__kpId!==id,singleId,{timeout:10000}).catch(()=>{});
   const bg=await waitBadge(page,'Print quality: Looks sharp');
   check(tag+' tapping a filled spot replaces it; collage turns green',bg.cls.includes('pb-green')&&bg.label===''&&await page.evaluate(()=>__kp.layout().filled===4),bg);
   const dpiCollage=await page.evaluate(()=>{const y=__kpT.y();let low=1e9;__kpT.slotRects().forEach((r,i)=>{const p=__kp.state.photos[i];if(!p)return;low=Math.min(low,Math.round(300/(Math.max(r.w/p.width,r.h/p.height)*y)));});return {app:__kp.dpi(),low};});
   check(tag+' collage dpi is the lowest spot',dpiCollage.app===dpiCollage.low,dpiCollage);

   /* 8. Preview, Extras and the counter review for a collage */
   await page.locator('#studioNext').click();await page.waitForFunction(()=>KPEditor.step==='preview');
   const pv=await page.evaluate(()=>[...document.querySelectorAll('#studioReviewDetails dt')].map(d=>[d.textContent,d.nextElementSibling.textContent]));
   const pr=k=>(pv.find(r=>r[0]===k)||[])[1];
   check(tag+' preview lists the layout and the words, not the hidden name tool',pr('Layout')==='Name Grid · 4 of 6 photos'&&pr('Name')==='Avery Lane'&&pv.filter(r=>r[0]==='Name').length===1&&!pr('Background'),pv);
   {let picker=false;const onChooser=()=>{picker=true;};page.on('filechooser',onChooser);
    await page.locator('#stageCanvas').scrollIntoViewIfNeeded();const box=await page.locator('#stageCanvas').boundingBox();await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
    await page.waitForTimeout(700);const zoom=await page.evaluate(()=>!!document.querySelector('#caseZoomDialog[open]'));page.off('filechooser',onChooser);
    check(tag+' preview: tapping the case enlarges it instead of opening the photo picker',zoom&&!picker,{zoom,picker});
    if(zoom){await page.locator('#caseZoomDialog [data-close]').click();await page.waitForFunction(()=>!document.querySelector('#caseZoomDialog[open]'));}}
   await page.locator('#studioNext').click();await page.waitForFunction(()=>KPEditor.step==='setup');
   await page.locator('#studioNext').click();
   await page.waitForFunction(()=>document.getElementById('counterReview').open&&document.getElementById('reviewDetails').children.length>4,null,{timeout:10000}).catch(()=>{});
   const rv=await page.evaluate(()=>{const dts=[...document.querySelectorAll('#reviewDetails dt')];return {rows:dts.map(d=>[d.textContent,d.nextElementSibling.textContent]),code:document.getElementById('reviewCode').textContent,overview:[...document.querySelectorAll('#reviewOverview .review-personalization')].map(p=>p.textContent)};});
   const row=k=>(rv.rows.find(r=>r[0]===k)||[])[1];
   check(tag+' review: Design, Layout, words rows',row('Design')==='Photo collage · Name Grid'&&row('Layout')==='Name Grid · 4 of 6 photos'&&row('Name')==='Avery Lane'&&!row('Personalization'),rv.rows);
   check(tag+' review overview: layout and words, no hidden name',rv.overview.join('|')==='Layout: Name Grid · 4 of 6 photos|Name: Avery Lane',rv.overview);
   check(tag+' review: collage instruction',rv.code==='Bring the 4 original photos for your Name Grid layout on your phone and show this preview at the counter.',rv.code);
   check(tag+' no horizontal overflow with review open',await noOverflow(page));
   await page.waitForFunction(()=>!document.getElementById('saveCounterCard').disabled,null,{timeout:10000}).catch(()=>{});
   check(tag+' counter card prepared',await page.evaluate(()=>!document.getElementById('saveCounterCard').disabled));
   await shot(page,engine+'-'+width+'-counter-review-collage');
   await page.locator('#reviewEditDesign').click();await page.waitForFunction(()=>KPEditor.step==='edit');
   check(tag+' Edit design returns with the collage intact',await page.evaluate(()=>__kp.layout()&&__kp.layout().filled===4&&__kp.state.captions.name==='Avery Lane'));
   await tool(page,'words');await page.locator('#captionList [data-key="name"]').fill('');await done(page);
   await page.locator('#studioNext').click();await page.waitForFunction(()=>KPEditor.step==='preview');
   check(tag+' preview: empty required words read "Not added"',(await page.locator('#studioReviewDetails').innerText()).includes('Not added'));
   await page.locator('#studioNext').click();await page.waitForFunction(()=>KPEditor.step==='setup');await page.locator('#studioNext').click();
   await page.waitForFunction(()=>document.getElementById('counterReview').open&&document.getElementById('reviewDetails').children.length>4,null,{timeout:10000}).catch(()=>{});
   const rv2=await page.evaluate(()=>[...document.querySelectorAll('#reviewDetails dt')].map(d=>[d.textContent,d.nextElementSibling.textContent]));
   check(tag+' review: empty required field reads "Not added" (same as Preview)',(rv2.find(r=>r[0]==='Name')||[])[1]==='Not added',rv2);
   await page.locator('#reviewEditDesign').click();await page.waitForFunction(()=>KPEditor.step==='edit');

   /* 9. a collage with one soft photo: amber pill names the spot */
   await tool(page,'layouts');await page.locator('.layChip[data-l="tpl:20"]').click();
   await page.waitForFunction(()=>__kp.state.layout==='tpl:20');
   const amber=await page.evaluate(`(()=>{const y=__kpT.y(),r=__kpT.slotRects()[1];const iw=Math.round(240*r.w*y/300),ih=Math.round(iw*r.h/r.w);return {iw,ih,u:(${PNG_FN})(iw,ih,200)};})()`);
   check(tag+' switching layouts carries photos in order, the 4th is saved, not dropped',await page.evaluate(()=>__kp.layout().filled===3&&KPStudioCore.info().spare===1));
   check(tag+' collage without words: Name is back, Words hidden',(await tools(page)).join()==='phone,name,layouts,photo',await tools(page));
   await tapSlot(page,1,F(Buffer.from(amber.u,'base64'),'soft.png'));
   const ba=await waitBadge(page,'Print quality: May look soft');
   check(tag+' collage with a soft photo: amber pill, the note points at the outline, spot 2 is marked',ba.cls.includes('pb-yellow')&&ba.label==='The outlined photo is the softest. A larger original will print sharper.'&&ba.inStage&&await page.evaluate(()=>{const b=[...document.querySelectorAll('#slotButtons .slotBtn')];return b.length===3&&b[1].classList.contains('is-soft')&&b.filter(x=>x.classList.contains('is-soft')).length===1&&/may look soft/.test(b[1].getAttribute('aria-label'));}),{ba,size:[amber.iw,amber.ih]});
   await page.locator('#stageCanvas').scrollIntoViewIfNeeded();
   await shot(page,engine+'-'+width+'-collage-amber-badge');

   /* 10. back to Single photo carries spot 1 back; Photo tool Start over resets everything */
   const spot1=await page.evaluate(()=>__kp.state.photos[0].__kpId);
   await tool(page,'layouts');await page.locator('.layChip[data-l=""]').click();
   check(tag+' Single photo carries spot 1 back',await page.evaluate(id=>!__kp.state.layout&&__kp.state.photoImg&&__kp.state.photoImg.__kpId===id&&document.getElementById('captionFields').hidden,spot1));
   check(tag+' single photo tools are back',(await tools(page)).join()==='phone,name,adjust,layouts,photo',await tools(page));
   await page.locator('.layChip[data-l="tpl:104"]').click();
   await page.waitForFunction(()=>__kp.state.layout==='tpl:104');
   check(tag+' phrase fields start with their default',await page.evaluate(()=>document.querySelector('#captionList [data-key="title"]').value==='Our favorite days'&&document.querySelector('#captionList [data-key="date"]').value===''));
   await done(page);await tool(page,'photo');
   check(tag+' Photo tool names the layout clear "Remove all photos"',await page.locator('#clearBtn').innerText()==='Remove all photos');
   await page.locator('#clearBtn').click();
   check(tag+' removing a layout asks first',await page.evaluate(()=>document.getElementById('studioClearDialog').open&&!!__kp.state.layout));
   await page.locator('#studioConfirmClear').click();await done(page);
   const reset=await page.evaluate(()=>({layout:__kp.state.layout,photos:__kp.state.photos.length,photoImg:!!__kp.state.photoImg,captions:Object.keys(__kp.state.captions).length,capHidden:document.getElementById('captionFields').hidden,badge:document.getElementById('printBadge').hidden,pressed:document.querySelector('.layChip[aria-pressed="true"]').dataset.l,multiple:document.getElementById('fileInput').multiple,label:document.getElementById('dpiLabel').textContent,tools:[...document.querySelectorAll('.studio-tools [data-tool]')].filter(b=>!b.hidden).map(b=>b.dataset.tool)}));
   check(tag+' Start over resets layout, photos, words, inputs, picker and pill',!reset.layout&&!reset.photos&&!reset.photoImg&&!reset.captions&&reset.capHidden&&reset.badge&&reset.pressed===''&&!reset.multiple&&!reset.label&&!reset.tools.includes('words'),reset);

   /* 11. privacy purge (kiosk idle, Start over, pagehide) clears the layout, spot photos, words and the pill */
   await tool(page,'layouts');await page.locator('.layChip[data-l="tpl:68"]').click();
   await page.locator('#fileInput').setInputFiles([F(big[1],'p1.png'),F(big[2],'p2.png')]);await waitFilled(page,2);
   await done(page);await tool(page,'words');await page.locator('#captionList [data-key="name"]').fill('Private Name');await done(page);await page.waitForTimeout(400);
   const spots=await page.evaluate(()=>{window.__spots=__kp.state.photos.filter(Boolean);return window.__spots.length;});
   await page.evaluate(()=>KPStudioCore.purge());
   const purged=await page.evaluate(()=>({layout:__kp.state.layout,photos:__kp.state.photos.length,captions:Object.keys(__kp.state.captions).length,inputs:document.querySelectorAll('#captionList input,#captionList textarea').length,released:window.__spots.every(c=>c.width===0&&c.height===0),badge:document.getElementById('printBadge').hidden,label:document.getElementById('dpiLabel').textContent,pressed:document.querySelector('.layChip[aria-pressed="true"]').dataset.l,undo:document.getElementById('studioUndo').disabled,body:document.body.innerText.includes('Private Name')}));
   check(tag+' purge clears layout, spot photos, words, inputs, picker and pill',spots===2&&!purged.layout&&!purged.photos&&!purged.captions&&!purged.inputs&&purged.released&&purged.badge&&!purged.label&&purged.pressed===''&&!purged.body,purged);
   check(tag+' no console errors',errors.length===0,errors);
   await ctx.close();
  }

  /* 12. once per engine: editor Start over, font guard, real font in the export, spot screening, HEIC */
  {
   const tag=engine;
   const ctx=await browser.newContext({viewport:{width:1440,height:1000}});const page=await ctx.newPage();const errors=[],net=[];await hooked(page,errors,net);
   await page.goto(base+'customizer.html?model='+MODEL);await editorReady(page);await page.waitForSelector('.layChip[data-l="tpl:68"]');
   await page.locator('.layChip[data-l="tpl:68"]').click();
   await page.locator('#fileInput').setInputFiles({name:'a.png',mimeType:'image/png',buffer:await png(page,1600,2000,70)});await waitFilled(page,1);
   await page.locator('#studioReset').click();
   check(tag+' Start over dialog',await page.locator('#studioResetDialog p').innerText()==='Your current changes will be cleared.');
   await page.locator('#studioCancelReset').click();
   await page.locator('#studioBrowse').click();
   check(tag+' leaving a collage asks first',await page.evaluate(()=>document.getElementById('studioResetDialog').open&&document.querySelector('#studioResetDialog p').textContent==='Your layout, photos, words and selected extras will be cleared.'));
   await page.locator('#studioConfirmReset').click();await page.waitForURL(/gallery\.html/,{timeout:10000}).catch(()=>{});
   check(tag+' confirming leaves for the designs page',/gallery\.html/.test(page.url()),page.url());

   const held=[];await page.route('**/assets/fonts/**',r=>{held.push(r);});
   await page.goto(base+'customizer.html?model='+MODEL);await editorReady(page);await page.waitForSelector('.layChip[data-l="tpl:104"]');
   await page.locator('.layChip[data-l="tpl:104"]').click();
   await page.locator('#fileInput').setInputFiles({name:'a.png',mimeType:'image/png',buffer:await png(page,2400,3200,30)});
   await waitFilled(page,1);
   await page.waitForFunction(()=>__kp.printIssue().startsWith('The lettering'),null,{timeout:10000}).catch(()=>{});
   const issue=await page.evaluate(()=>__kp.printIssue());
   check(tag+' kpPrintIssue blocks until caption fonts load',issue==='The lettering is still loading. Try again in a moment.',issue);
   check(tag+' editor Preview waits for the caption fonts',await page.evaluate(()=>document.getElementById('studioNext').disabled&&document.getElementById('studioStatus').textContent.startsWith('The lettering')));
   check(tag+' export refuses while fonts load',await page.evaluate(()=>{let called=false;const r=__kp.buildPrint(()=>{called=true;});return r===false&&!called;}));
   await page.unroute('**/assets/fonts/**');for(const r of held)await r.continue();
   await page.waitForFunction(()=>!__kp.printIssue(),null,{timeout:10000}).catch(()=>{});
   check(tag+' fonts loaded: print allowed',await page.evaluate(()=>__kp.printIssue())==='');
   await page.waitForFunction(()=>!document.getElementById('studioNext').disabled,null,{timeout:5000}).catch(()=>{});
   check(tag+' fonts loaded: Preview allowed',await page.evaluate(()=>!document.getElementById('studioNext').disabled));
   check(tag+' caption faces registered',await page.evaluate(()=>{const f=__kpT.faces();return Object.keys(f).length===2&&Object.values(f).every(x=>x.status==='loaded');}));
   const real=await printCaption(page,'title'),again=await printCaption(page,'title');
   const wrong=await page.evaluate(async({STATS})=>{const stats=eval(STATS);const x=__kpT.cur().texts.find(q=>q.key==='title'),keep=x.font;x.font='KP Wrong Family';let o=null;__kp.buildPrint(c=>{o=stats(c,{x:0,y:0,w:c.width,h:c.height});});x.font=keep;return o;},{STATS:STATS_FN});
   check(tag+' export is deterministic',real&&again&&real.full.hash===again.full.hash);
   check(tag+' export uses the real caption font (differs from a wrong family)',real&&wrong&&real.full.hash!==wrong.hash&&real.cap.dark>100,{real:real&&real.cap,wrong:wrong&&wrong.hash});
   /* screening runs for spot photos too */
   await page.evaluate(()=>{window.__rejectTestPhoto=true;});
   await page.locator('#fileInput').setInputFiles({name:'screen.png',mimeType:'image/png',buffer:await png(page,1200,1600,300)});
   await page.waitForFunction(()=>document.querySelector('#kpToast')&&document.querySelector('#kpToast').textContent.includes('explicit imagery'),null,{timeout:10000}).catch(()=>{});
   check(tag+' spot photos are screened and removed',await page.evaluate(()=>__kp.layout().filled===1&&!__kp.state.photos[1]));
   await page.evaluate(()=>{window.__rejectTestPhoto=false;});
   /* HEIC into a spot: converter stubbed, the converted file lands in the next open spot */
   await page.route('**/heic2any.min.js',r=>r.fulfill({contentType:'text/javascript',body:'window.heic2any=({blob})=>Promise.resolve(blob);'}));
   await page.locator('#fileInput').setInputFiles({name:'spot.heic',mimeType:'image/heic',buffer:await png(page,1600,1200,250)});
   check(tag+' HEIC photo fills the next open spot',await waitFilled(page,2)===2&&await page.evaluate(()=>!!__kp.state.photos[1]&&__kp.state.layout==='tpl:104'));
   check(tag+' no console errors (fonts and screening)',errors.length===0,errors);
   await ctx.close();
   /* studios keep one image and kiosks keep photos staff assisted: no Layouts tool, no layout requests */
   const dctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const dp=await dctx.newPage();const derr=[],dnet=[];await hooked(dp,derr,dnet);
   await dp.goto(base+'customizer.html?studio=drawing&model='+MODEL);await editorReady(dp);
   await dp.locator('#fileInput').setInputFiles({name:'drawing.png',mimeType:'image/png',buffer:await png(dp,2400,3200,90)});
   const db=await waitBadge(dp,'Print quality:');
   check(tag+' drawing studio: pill shown, no Layouts tool, no layout requests',!db.hidden&&!(await tools(dp)).includes('layouts')&&!dnet.some(x=>x.includes('/assets/collage/')),{db:db.text,tools:await tools(dp),req:dnet.filter(x=>x.includes('/assets/collage/'))});
   await dp.goto(base+'customizer.html?studio=sky&model='+MODEL);await editorReady(dp);await dp.waitForTimeout(1200);
   check(tag+' sky studio: no Layouts tool, no pill, no layout requests',!(await tools(dp)).includes('layouts')&&await dp.locator('#printBadge').isHidden()&&!dnet.some(x=>x.includes('/assets/collage/')));
   await dp.goto(base+'customizer.html?kiosk=1&model='+MODEL);await editorReady(dp);await dp.waitForTimeout(1200);
   check(tag+' kiosk editor: no Layouts tool, uploads off, no layout requests',!(await tools(dp)).includes('layouts')&&!(await tools(dp)).includes('words')&&await dp.locator('#fileInput').isDisabled()&&!dnet.some(x=>x.includes('/assets/collage/')),{tools:await tools(dp),req:dnet.filter(x=>x.includes('/assets/collage/'))});
   check(tag+' studios and kiosk no console errors',derr.length===0,derr);
   await dctx.close();
   /* staff=1 keeps the classic rail: picker, words, PPI number and print details */
   const sctx=await browser.newContext({viewport:{width:1440,height:1000}});const sp=await sctx.newPage();const serr=[],snet=[];await hooked(sp,serr,snet);
   /* a staff library page never asks for layouts, not even when its pagehide Start over runs on the way out */
   await sp.goto(base+'customizer.html?staff=1&model='+MODEL+'&design=boho-floral-01.jpg');await sp.waitForFunction(()=>window.__kp&&__kp.state.photoImg&&!__kp.state.libraryLoading,null,{timeout:20000});await sp.waitForTimeout(600);
   await sp.goto(base+'gallery.html');await sp.waitForTimeout(300);
   check(tag+' staff library page and its pagehide make no layout requests',!snet.some(x=>x.includes('/assets/collage/'))&&!serr.some(e=>/collage|templates/.test(e)),{req:snet.filter(x=>x.includes('/assets/collage/')),serr});
   serr.length=0;
   await sp.goto(base+'customizer.html?staff=1&model='+MODEL);await sp.waitForFunction(()=>window.__kp);
   await sp.waitForSelector('.layChip[data-l="tpl:102"]',{timeout:10000});
   check(tag+' staff: classic rail picker heading and placement',await sp.evaluate(()=>{const w=document.getElementById('layoutChipsWrap');return !window.KPEditor&&!!w.closest('#photoSection')&&w.querySelector('h2').textContent==='Choose a layout'&&w.previousElementSibling.id==='photoLooksWrap'&&w.nextElementSibling.id==='uploadBtn'&&!w.hidden;}));
   await sp.locator('#fileInput').setInputFiles({name:'s.png',mimeType:'image/png',buffer:await png(sp,2400,3200,60)});
   const sb=await waitBadge(sp,'Print quality: Looks sharp');
   check(tag+' staff pill shows the PPI number',/^Print quality: Looks sharp· \d+ PPI$/.test(sb.text),sb.text);
   check(tag+' staff rail keeps the classic green note',sb.label==='Looks great. This will print sharp.'&&sb.labelColor==='rgb(25, 108, 52)',sb);
   await sp.locator('.layChip[data-l="tpl:102"]').click();
   check(tag+' staff: words template swaps the name block for Your words',await sp.evaluate(()=>document.getElementById('nameBlock').hidden&&!document.getElementById('captionFields').hidden));
   await sp.locator('#captionList [data-key="name"]').fill('Jordan');
   await sp.waitForTimeout(700);
   const staff=await sp.evaluate(()=>({art:document.getElementById('spArt').textContent,words:document.getElementById('spWords').textContent,wordsHidden:document.getElementById('spWords').hidden}));
   check(tag+' staff Artwork and Words rows',staff.art==='Collage · Name Grid'&&staff.words==='Name: Jordan'&&!staff.wordsHidden,staff);
   await sp.locator('#clearBtn').click();
   check(tag+' staff Start over resets the layout and words',await sp.evaluate(()=>!__kp.state.layout&&!Object.keys(__kp.state.captions).length&&document.getElementById('captionFields').hidden&&!document.getElementById('nameBlock').hidden&&document.querySelector('.layChip[aria-pressed="true"]').dataset.l===''));
   check(tag+' staff no console errors',serr.length===0,serr);
   await sctx.close();
  }
  await browser.close();
 }
 const failed=results.filter(r=>!r.ok);
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,1));
 console.log(results.length-failed.length+'/'+results.length+' collage and caption checks passed');
 if(server)server.close();
 if(failed.length)process.exit(1);
})().catch(e=>{console.error(e);if(server)server.close();process.exit(1);});
