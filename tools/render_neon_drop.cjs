// Proof every Neon Doodles background through the actual Frost compositor and print mask.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('../../playwright/node_modules/playwright-core');
const base=process.env.KP_BASE||'http://127.0.0.1:19042/',out='../collaboration/neon-expansion-2026-11-25/proofs';fs.mkdirSync(out,{recursive:true});
const rows=JSON.parse(fs.readFileSync('assets/neon-doodles-20261125.json'));let next=0;const report=[];
(async()=>{const b=await chromium.launch();try{const context=await b.newContext();await context.route('**/*',r=>new URL(r.request().url()).origin===new URL(base).origin?r.continue():r.abort());
async function worker(){const p=await context.newPage();for(;next<rows.length;){const row=rows[next++],images=[];let originalAlpha=null;const hashes=new Set();
 const q=new URLSearchParams({design:row.file,model:'iphone-15-pro',case:'rated',rim:'Smoke Frost'});
 await p.goto(base+'customizer.html?'+q,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.KPStudioCore?.info().previewReady&&!KPStudioCore.info().issue&&!__kp.state.photoImg?.__kpIsThumb&&!__kp.state.libraryLoading);
 for(const rim of ['Smoke Frost','Clear Frost']){await p.evaluate(rim=>KPStudioCore.setRim(rim),rim);await p.waitForFunction(()=>KPStudioCore.info().previewReady&&!KPStudioCore.info().issue);
  for(const option of row.options){const r=await p.evaluate(async({id,rim})=>{
   KPStudioCore.restore({variant:id});await KPCaseShell.ready;__kp.render();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   const src=document.getElementById('stageCanvas'),cv=document.createElement('canvas');cv.width=500;cv.height=600;cv.getContext('2d').drawImage(src,0,0,500,600);
   const variantImage=id==='original'?__kp.state.photoImg:__kp.state.photoImg.__kpVariantImages[Number(id.slice(1))-1];
   const result={preview:cv.toDataURL('image/webp',.94).split(',')[1],rim:KPStudioCore.info().rim,variant:__kp.state.variant,dpi:__kp.dpi(),sourceSize:[variantImage.naturalWidth,variantImage.naturalHeight]};
   if(rim==='Smoke Frost'){
    const print=await new Promise(resolve=>__kp.buildPrint(resolve)),bytes=print.getContext('2d').getImageData(0,0,print.width,print.height).data,alpha=new Uint8Array(bytes.length/4);for(let i=0;i<alpha.length;i++)alpha[i]=bytes[i*4+3];
    const hash=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(n=>n.toString(16).padStart(2,'0')).join('');
    result.alphaHash=await hash(alpha);result.printHash=await hash(bytes);result.size=[print.width,print.height];result.ink=alpha.reduce((a,n)=>a+(n>0),0);
   }return result;
  },{id:option.id,rim});
  assert.equal(r.variant,option.id);assert.equal(r.rim,rim);assert.deepEqual(r.sourceSize,[row.width,row.height]);if(option.id==='original')assert(r.dpi>=250,'Native source resolution');
  if(r.alphaHash){originalAlpha??=r.alphaHash;assert.equal(r.alphaHash,originalAlpha,'A variation must fill exactly the same print mask');assert(r.ink>100000);hashes.add(r.printHash);}
  const file=path.parse(row.file).name+'--'+option.id+'--'+(rim==='Smoke Frost'?'smoke':'clear')+'.webp';fs.writeFileSync(path.join(out,file),Buffer.from(r.preview,'base64'));
  images.push({label:option.name,rim,file});const {preview,...meta}=r;report.push({design:row.file,...meta});
 }}assert.equal(hashes.size,6,'Six visually distinct prints');
 await p.setViewportSize({width:1500,height:1000});await p.setContent('<style>body{font:16px Arial;margin:24px;color:#242424}h1{margin:0 0 8px}p{margin:8px 0 16px}.grid{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.cell{background:#f7f6f3;text-align:center;padding:8px}.cell img{width:100%;height:270px;object-fit:contain}.cell span{display:block;font-size:14px}small{color:#666}</style><h1>'+row.title+'</h1><p>Frost case previews · iPhone 15 Pro · Original + five full-size backgrounds</p><div class="grid">'+images.map(im=>'<div class="cell"><img src="data:image/webp;base64,'+fs.readFileSync(path.join(out,im.file)).toString('base64')+'"><b>'+im.label+'</b><span>'+im.rim+'</span></div>').join('')+'</div><p><small>Digital previews. Use the matching artwork in the printer template for the customer’s actual phone.</small></p>');
 await p.screenshot({path:path.join(out,path.parse(row.file).name+'--frost-options.png'),fullPage:true});console.log('PASS',row.title,'12 Frost previews, 6 distinct full-mask prints');
 }await p.close();}await Promise.all([worker(),worker()]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
