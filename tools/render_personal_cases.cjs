// Public, owner-approved examples. Render through the actual studio, including
// its clear case, mask and fit rules. Never read customers' uploads or storage.
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict'),path=require('node:path');
process.chdir(path.resolve(__dirname,'..'));
const {chromium}=require(process.env.KP_PLAYWRIGHT||'../../playwright/node_modules/playwright-core');
const rows=require('./personal-case-manifest.json');
const base=process.env.KP_BASE||'http://127.0.0.1:19038/';
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
(async()=>{const browser=await chromium.launch(),results=[];
 try{for(const row of rows){
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'});
 await context.route('**/*',r=>new URL(r.request().url()).origin===new URL(base).origin?r.continue():r.abort());
 const p=await context.newPage();p.setDefaultTimeout(30000);
  const href='customizer.html?'+new URLSearchParams({studio:row.studio,model:row.model,finish:row.finish,view:'phone',case:'rated',rim:row.rim});
  await p.goto(new URL(href,base).href,{waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.KPStudioCore?.info().previewReady);
  if(row.studio==='drawing')await p.locator('#fileInput').setInputFiles(row.input);
  else{
   await p.waitForFunction(()=>document.querySelector('#skyForm [name=place]')?.options.length>0);
   await p.evaluate(row=>{const f=document.getElementById('skyForm'),e=f.elements;
    e.manual.checked=true;e.manual.dispatchEvent(new Event('change'));
    for(const [key,value] of Object.entries({date:row.date,time:row.time,placeName:row.place,lat:row.lat,lon:row.lon,zone:row.zone,initials:row.initials,sign1:row.signs[0],sign2:row.signs[1]}))e[key].value=value;
    f.requestSubmit();
   },row);
  }
  await p.waitForFunction(row=>{const info=KPStudioCore.info();return __kp.state.photoImg&&!__kp.printIssue()&&info.previewReady&&(row.studio==='drawing'?info.drawing&&info.hasPhoto:info.sky&&info.skyDetails?.some(r=>r[0]==='Initials'&&r[1]===row.initials));},row);
  await p.evaluate(async()=>{await document.fonts.ready;await KPCaseShell.ready;__kp.render();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
  const result=await p.evaluate(()=>{const c=document.getElementById('stageCanvas'),x=c.getContext('2d'),d=x.getImageData(0,0,c.width,c.height).data;
   let l=c.width,t=c.height,r=0,b=0;for(let y=0;y<c.height;y++)for(let xx=0;xx<c.width;xx++)if(d[(y*c.width+xx)*4+3]>=20){l=Math.min(l,xx);r=Math.max(r,xx);t=Math.min(t,y);b=Math.max(b,y);}
   l=Math.max(0,l-14);t=Math.max(0,t-14);r=Math.min(c.width,r+15);b=Math.min(c.height,b+15);
   if(r<=l||b<=t)throw Error('Empty case canvas');
   const out=document.createElement('canvas');out.width=r-l;out.height=b-t;out.getContext('2d').drawImage(c,-l,-t);
   const s=__kp.state;return {data:out.toDataURL('image/webp',.95).split(',')[1],width:out.width,height:out.height,crop:[l,t,r,b],model:s.model,finish:s.colorName,caseType:s.caseType,view:s.previewMode,fitMode:s.fitMode};
  });
  assert.equal(result.caseType,row.caseType);assert.equal(await p.evaluate(()=>KPStudioCore.info().rim),row.rim);assert.equal(result.view,'phone');assert.equal(result.finish,row.finish);
  assert.equal(result.model.toLowerCase().replaceAll(' ','-'),row.model);
  assert(result.width>=600&&result.height>=1200,'Preview resolution');
  fs.writeFileSync(row.output+'.tmp',Buffer.from(result.data,'base64'));delete result.data;
  results.push({...row,href,...result,sha256:hash(row.output+'.tmp'),inputSha256:row.input?hash(row.input):undefined});console.log('Rebuilt',row.output);await context.close();
 }
 const sources=['customizer.html','assets/night-sky.js','assets/case-shell.js','assets/print-geometry.js','assets/cases/i17pm-silver.webp','assets/masks/view-i17pm.png','assets/design-editor.js','assets/bright-stars.json','assets/sky-figures.json','assets/sky-places.json'];
 for(const row of rows)fs.renameSync(row.output+'.tmp',row.output);
 fs.writeFileSync('tools/personal-case-renders.json',JSON.stringify({browser:browser.version(),noteSource:{path:'assets/home/personal/drawing-shell.webp',sha256:hash('assets/home/personal/drawing-shell.webp'),rect:[108,880,668,478],reason:'Recover the exact already-public note pixels; no generated handwriting.'},sources:Object.fromEntries(sources.map(f=>[f,hash(f)])),renders:results},null,2)+'\n');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
