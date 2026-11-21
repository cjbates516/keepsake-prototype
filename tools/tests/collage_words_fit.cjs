/* Words templates on every phone kit: no caption ink (text or plate) may print outside the print trim.
   Each field is drawn alone through the real print transform and intersected with the print mask (printMaskCache.trim),
   with its default words and with maximum length words. A field this phone cannot show must print nothing and be
   reported as hidden (kpCaptionHidden), so the review rows and staff details can say so. Phones with a Rated Case
   run again on the Rated panel mask. A field that hides its default words while it prints its maximum length words
   fails (a short word must never be hidden where a longer one in the same field prints).
   usage: node tools/tests/collage_words_fit.cjs [outdir]   (KP_BASE=http://127.0.0.1:PORT/ to use a running server;
   KP_ENGINES=chromium,webkit; KP_MODELS=slug,slug to limit the kits; KP_CASES=clear,rated). Photos are synthetic canvases. */
const {chromium,webkit}=require(process.env.PW_CORE||'../../../playwright/node_modules/playwright-core');
const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..');
const out=path.resolve(process.argv[2]||'/tmp/keepsake-words-fit');fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2'};
let server=null;
function serve(){return new Promise(r=>{server=http.createServer((req,res)=>{let f=path.join(root,decodeURIComponent(new URL(req.url,'http://local').pathname));if(f.endsWith(path.sep))f+='index.html';if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return}fs.readFile(f,(e,d)=>{if(e){res.writeHead(404).end();return}res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(d)})});server.listen(0,'127.0.0.1',()=>r('http://127.0.0.1:'+server.address().port+'/'))})}
const HOOK='window.__W={st:function(){return state;},choose:chooseLayout,cur:curTpl,map:tplMap,dc:drawCaptions,pm:function(){return printMaskCache;},art:artMatrix,TPL:function(){return TPL;},FIT:function(){return FIT;},kits:function(){return Object.keys(KITS);},rated:function(){return Object.keys(KITS).filter(function(m){return !!KITS[m].rated;});},tplImage:tplImage,hidden:kpCaptionHidden,ready:function(){return {c:caseReady,l:lightReady,v:viewReady,n:KP_TPLS.length,mb:!!maskBox,f:viewFailed,vs:viewSrc};},tpls:function(){return KP_TPLS;}};window.__kp={';
const results=[];
function check(name,ok,detail){results.push({name,ok:!!ok,detail});console.log((ok?'PASS ':'FAIL ')+name+(detail===undefined?'':' '+JSON.stringify(detail)));}
const INPAGE=`window.WF={
 mc0(){const T=__W.TPL(),F=__W.FIT();const pxW=T.pxW||Math.round(T.w*300/72),pxH=T.pxH||Math.round(T.h*300/72);return new DOMMatrix().translate(18,18).scale(pxW/T.w,pxH/T.h).scale(1/F.sx,1/F.sy).translate(-F.x,-F.y);},
 photo(i){const c=document.createElement('canvas');c.width=1200;c.height=1600;const g=c.getContext('2d');g.fillStyle='hsl('+(i*53%360)+',55%,50%)';g.fillRect(0,0,1200,1600);c.naturalWidth=1200;c.naturalHeight=1600;c.__kpId=880000+i;return c;},
 sleep(ms){return new Promise(r=>setTimeout(r,ms));},
 async setup(id){__W.choose(null);__W.choose('tpl:'+id);const t=__W.cur();const t0=Date.now();
  while(!(__W.tplImage(t).complete&&__W.tplImage(t).naturalWidth)&&Date.now()-t0<15000)await WF.sleep(50);
  const st=__W.st();st.photos=t.slots.map((s,i)=>WF.photo(i));
  for(const x of t.texts)st.captions[x.key]=x.default||'X';
  __kp.render();const t1=Date.now();while(__kp.printIssue()&&Date.now()-t1<20000)await WF.sleep(100);
  /* builds the print once so printMaskCache exists for this phone */
  let ok=false;__kp.buildPrint(()=>{ok=true;});return {issue:__kp.printIssue(),ok};},
 field(x,v){const st=__W.st();const keep=Object.assign({},st.captions);for(const k in st.captions)st.captions[k]='';st.captions[x.key]=v;
  const pm=__W.pm().map,c=document.createElement('canvas');c.width=pm.w;c.height=pm.h;const g=c.getContext('2d');const M=WF.mc0().multiply(__W.art());g.setTransform(M.a,M.b,M.c,M.d,M.e,M.f);
  __W.dc(g,__W.map(),{texts:[x]},true,false);const d=g.getImageData(0,0,c.width,c.height).data;let ink=0,outside=0;
  for(let p=0;p<pm.w*pm.h;p++){if(d[p*4+3]>32){ink++;if(!pm.trim[p])outside++;}}
  const hidden=__W.hidden(x);st.captions=keep;c.width=c.height=0;return {ink,outside,hidden};},
 maxText(x){const n=Math.max(1,+x.maxLen||20);if(x.stack)return '8'.repeat(Math.min(n,4));if(x.multiline){const L=Math.max(1,+x.maxLines||2),per=Math.max(1,Math.floor((n-(L-1))/L));return Array.from({length:L},()=> 'W'.repeat(per)).join('\\n');}return 'W'.repeat(n);}
};`;
(async()=>{
 const base=process.env.KP_BASE?process.env.KP_BASE.replace(/\/?$/,'/'):await serve();
 const engines=(process.env.KP_ENGINES||'chromium,webkit').split(',');
 const summary={};
 for(const engine of engines){
  const kind=engine==='webkit'?webkit:chromium,browser=await kind.launch();
  const ctx0=await browser.newContext({viewport:{width:1440,height:1000}});const p0=await ctx0.newPage();
  await p0.route(/\/customizer\.html(\?|$)/,async r=>{const res=await r.fetch();let body=await res.text();body=body.replace('window.__kp={',HOOK);await r.fulfill({response:res,body});});
  await p0.goto(base+'customizer.html?model=iphone-17-pro-max');await p0.waitForFunction(()=>window.__W);
  const toSlug=n=>n.toLowerCase().replace(/\s+/g,'-');
  let slugs=(await p0.evaluate(()=>__W.kits())).map(toSlug);const ratedSlugs=(await p0.evaluate(()=>__W.rated())).map(toSlug);await ctx0.close();
  if(process.env.KP_MODELS)slugs=slugs.filter(s=>process.env.KP_MODELS.split(',').includes(s));
  const cases=(process.env.KP_CASES||'clear,rated').split(',');
  for(const slug0 of slugs)for(const cs of cases){
   if(cs==='rated'&&!ratedSlugs.includes(slug0))continue;
   const slug=slug0+(cs==='rated'?' (Rated Case)':'');
   const ctx=await browser.newContext({viewport:{width:1440,height:1000}});const page=await ctx.newPage();const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/assets/nsfw/**',r=>r.fulfill({contentType:'application/javascript',body:r.request().url().includes('nsfwjs')?"window.nsfwjs={load:async()=>({classify:async()=>[{className:'Neutral',probability:1}]})};":''}));
   await page.route(/\/customizer\.html(\?|$)/,async r=>{const res=await r.fetch();let body=await res.text();if(!body.includes('window.__kp={'))throw Error('hook literal missing');body=body.replace('window.__kp={',HOOK);await r.fulfill({response:res,body});});
   await page.goto(base+'customizer.html?model='+slug0);
   let ready=await page.waitForFunction(()=>{const r=window.__W&&__W.ready();return r&&(r.f||(r.c&&r.l&&r.v&&r.n>0&&r.mb));},null,{timeout:30000}).then(()=>page.evaluate(()=>__W.ready())).catch(()=>null);
   if(ready&&cs==='rated'){
    await page.evaluate(()=>KPStudioCore.setCase('Rated Case'));
    ready=await page.waitForFunction(()=>{const r=__W.ready();return r.f||(/^view-rated-/.test(r.vs||'')&&r.c&&r.l&&r.v&&r.mb);},null,{timeout:30000}).then(()=>page.evaluate(()=>__W.ready())).catch(()=>null);
   }
   if(!ready||ready.f||!ready.v){check(engine+' '+slug+' kit has a print mask (skipped)',true,ready);await ctx.close();continue;}
   await page.evaluate(INPAGE);
   const tpls=await page.evaluate(()=>__W.tpls().filter(t=>(t.texts||[]).length).map(t=>({id:t.id,n:t.n,texts:t.texts.map(x=>x.key)})));
   for(const t of tpls){
    const s=await page.evaluate(id=>WF.setup(id),t.id);
    if(s.issue||!s.ok){check(engine+' '+slug+' '+t.n+' print is ready',false,s);continue;}
    for(const key of t.texts){
     const r=await page.evaluate(key=>{const x=__W.cur().texts.find(q=>q.key===key);const v=[String(x.default||'').trim()||'Sample',WF.maxText(x)];return v.map(val=>Object.assign({val},WF.field(x,val)));},key);
     check(engine+' '+slug+' '+t.n+' '+key+': default words are not hidden where the longest words print',!(r[0].hidden&&!r[1].hidden),r.map(q=>({val:q.val.slice(0,16),hidden:q.hidden,ink:q.ink})));
     for(const q of r){
      const label=engine+' '+slug+' '+t.n+' '+key+' "'+q.val.replace(/\n/g,'/').slice(0,24)+'"';
      check(label+': no ink outside the print trim'+(q.hidden?' (not shown on this phone)':''),q.outside===0&&(q.hidden?q.ink===0:q.ink>0),q);
      if(q.hidden){(summary[engine+' '+t.n+' '+key]=summary[engine+' '+t.n+' '+key]||[]).push(slug+(q.val.length>8&&/^W+/.test(q.val)?' (max length)':''));}
     }
    }
   }
   check(engine+' '+slug+' no page errors',errors.length===0,errors);
   await ctx.close();
  }
  await browser.close();
 }
 const failed=results.filter(r=>!r.ok);
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({results,hidden:summary},null,1));
 console.log('Hidden fields (not shown on these phones):',JSON.stringify(summary,null,1));
 console.log(results.length-failed.length+'/'+results.length+' words fit checks passed');
 if(server)server.close();
 if(failed.length)process.exit(1);
})().catch(e=>{console.error(e);if(server)server.close();process.exit(1);});
