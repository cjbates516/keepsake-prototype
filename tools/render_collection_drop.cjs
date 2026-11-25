// Rebuild marketing previews from the same case renderer customers customize.
// Run from the repository with the local server running; no customer uploads.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('../../playwright/node_modules/playwright-core');
const rows=JSON.parse(fs.readFileSync(path.resolve(__dirname,'collection-drop-manifest.json'),'utf8')).filter(r=>!process.env.KP_RENDER_FILES||process.env.KP_RENDER_FILES.split(',').includes(r.design));
const base=process.env.KP_BASE||'http://127.0.0.1:19042/';
(async()=>{
 const browser=await chromium.launch(),results=[];let next=0;
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  await context.route('**/*',r=>new URL(r.request().url()).origin===new URL(base).origin?r.continue():r.abort());
  async function worker(){
   const page=await context.newPage();page.setDefaultTimeout(30000);
   while(next<rows.length){
    const row=rows[next++];
    await page.goto(new URL(row.href,base).href,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(row=>{
     const s=window.__kp?.state;
     return s?.photoImg?.__kpDesignFile===row.design&&!s.photoImg.__kpIsThumb&&!s.libraryLoading&&s.variant===row.variant&&!__kp.printIssue();
    },row);
    const res=await page.evaluate(async()=>{
     await KPCaseShell.ready;__kp.render();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
     const c=document.getElementById('stageCanvas'),x=c.getContext('2d'),d=x.getImageData(0,0,c.width,c.height).data;
     const s=__kp.state,point=/Galaxy/.test(s.model)?[900,650]:/17 Pro/.test(s.model)?[1250,600]:[1000,650];
     const cameraAlpha=x.getImageData(Math.round(point[0]*c.width/2500),Math.round(point[1]*c.height/3000),1,1).data[3];
     let left=c.width,top=c.height,right=0,bottom=0;
     for(let y=0;y<c.height;y++)for(let a=0;a<c.width;a++){if(d[(y*c.width+a)*4+3]<20)continue;left=Math.min(left,a);right=Math.max(right,a);top=Math.min(top,y);bottom=Math.max(bottom,y);}
     left=Math.max(0,left-14);right=Math.min(c.width,right+15);top=Math.max(0,top-14);bottom=Math.min(c.height,bottom+15);
     const out=document.createElement('canvas');out.width=right-left;out.height=bottom-top;out.getContext('2d').drawImage(c,-left,-top);
     let print=null;const printed=await new Promise(r=>__kp.buildPrint(r));const px=printed.getContext('2d').getImageData(0,0,printed.width,printed.height).data;const alpha=new Uint8Array(printed.width*printed.height);let ink=0;for(let i=0;i<alpha.length;i++){alpha[i]=px[i*4+3];if(alpha[i])ink++;}const alphaHash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',alpha))).map(x=>x.toString(16).padStart(2,'0')).join('');if(KPStudioCore.info().rim==='Smoke Frost'){const blob=await KPPrintPng.encode(printed);print=await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result.split(',')[1]);f.readAsDataURL(blob);});}
     return {print,alphaHash,ink,dpi:__kp.dpi(),printSize:[printed.width,printed.height],sourceSize:[s.photoImg.naturalWidth,s.photoImg.naturalHeight],webp:out.toDataURL('image/webp',.94).split(',')[1],model:s.model,variant:s.variant,view:s.previewMode,caseType:s.caseType,rim:KPStudioCore.info().rim,width:out.width,height:out.height,crop:[left,top,right,bottom],cameraPoint:[point[0]*c.width/2500-left,point[1]*c.height/3000-top],cameraAlpha};
    });
    assert.equal(res.view,'phone');assert(res.cameraAlpha>240,row.output+' must show the phone through the camera opening');
    assert.equal(res.model.toLowerCase().replace(/^samsung /,'').replaceAll(' ','-'),row.model);
    assert.equal(res.variant,row.variant);if(row.rim)assert.equal(res.rim,row.rim,'Frost rim mismatch');assert.equal(res.caseType,row.caseType,'Case style drift: '+row.output);
    fs.mkdirSync(path.dirname(row.output),{recursive:true});fs.writeFileSync(row.output,Buffer.from(res.webp,'base64'));
    assert(res.dpi>=250,'Insufficient native source resolution: '+row.design+' '+res.dpi);assert(res.ink>100000);if(results.length)assert.equal(res.alphaHash,results[0].alphaHash,'Incomplete print mask: '+row.design);if(res.print){const dir='../collaboration/collection-depth-2026-11-25/prints';fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(dir+'/'+path.parse(row.design).name+'--iphone-15-pro-frost-print.png',Buffer.from(res.print,'base64'));}const {webp,print,...meta}=res;results.push({output:row.output,...meta});
    console.log('OK',results.length+'/'+rows.length,row.output);
   }
   await page.close();
  }
  await Promise.all([worker(),worker()]);
  const report=process.env.KP_RENDER_REPORT||'tools/collection-drop-renders.json';
  const prior=process.env.KP_RENDER_FILES&&fs.existsSync(report)?JSON.parse(fs.readFileSync(report)).filter(r=>!results.some(n=>n.output===r.output)):[];
  fs.writeFileSync(report,JSON.stringify([...prior,...results].sort((a,b)=>a.output.localeCompare(b.output)),null,2)+'\n');
 }finally{await browser.close();}
 assert.equal(results.length,rows.length);console.log(results.length+' mounted case previews rebuilt');
})().catch(e=>{console.error(e);process.exitCode=1;});
