// The uploaded white panel is a mask guide: every Rated preview of a phone with a clear kit must reveal the same phone pixels.
// (Rated only phones have no clear preview to compare with: tools/tests/rated_case.cjs section 20 checks their panel.)
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.KP_PLAYWRIGHT||'../../../playwright/node_modules/playwright-core');
const html=fs.readFileSync(path.resolve(__dirname,'../../customizer.html'),'utf8'),models=Function('return '+html.match(/var RATED=(\{[\s\S]*?\});/)[1])();
const base=process.env.KP_BASE||'http://127.0.0.1:19038/';
(async()=>{for(const engine of [chromium,webkit]){const b=await engine.launch();try{const p=await b.newPage({serviceWorkers:'block',viewport:{width:390,height:844},hasTouch:true,isMobile:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 for(const [model,key] of Object.entries(models)){
  await p.goto(base+'customizer.html?model='+encodeURIComponent(model.toLowerCase().replace(/^samsung /,'').replaceAll(' ','-'))+'&case=clear');/* a new session starts on frost: the clear preview is asked for */
  await p.waitForFunction(()=>window.KPStudioCore?.info().previewReady);assert.equal(await p.evaluate(()=>__kp.state.model),model);assert.equal(await p.evaluate(()=>__kp.state.caseType),'MagSafe Clear');
  await p.locator('[data-tool=phone]').click();await p.locator('#colorSwatches .sw').last().click();await p.waitForFunction(()=>KPStudioCore.info().previewReady);await p.waitForTimeout(150);
  const sample=()=>p.evaluate(key=>{const rows=KP_MASK_GEOMETRY['view-rated-'+key+'.png'].rows,rs=[.35,.55,.75].map(f=>rows[Math.floor(rows.length*f)]),c=document.getElementById('stageCanvas'),g=c.getContext('2d');return rs.map(r=>{const spans=[];for(let j=2;j<r.length;j+=2)spans.push([r[j],r[j+1]]);const span=spans.sort((a,b)=>(b[1]-b[0])-(a[1]-a[0]))[0];return [...g.getImageData(Math.floor((span[0]+span[1])/2*c.width/2500),Math.floor((r[0]+r[1])/2*c.height/3000),1,1).data];});},key);
  const clear=await sample();await p.locator('.studio-case-opt').filter({has:p.locator('[value="Rated Case"]')}).click();await p.waitForFunction(()=>KPStudioCore.info().previewReady);await p.waitForTimeout(150);assert.equal(await p.evaluate(()=>__kp.state.caseType),'Rated Case');const rated=await sample();
  for(let i=0;i<clear.length;i++)for(let ch=0;ch<4;ch++)assert(Math.abs(clear[i][ch]-rated[i][ch])<=5,model+' phone finish differs inside Rated mask: '+JSON.stringify({clear,rated}));
  console.log(engine.name(),model,'phone finish matches clear preview at 3 panel points');
 }
 assert.equal(Object.keys(models).length,26);assert.deepEqual(errors,[]);await p.close();}finally{await b.close();}}})().catch(e=>{console.error(e);process.exitCode=1;});
