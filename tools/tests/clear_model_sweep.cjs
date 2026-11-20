const {chromium,webkit}=require('../../../playwright/node_modules/playwright-core');
const assert=require('node:assert/strict'),fs=require('fs');
const models=JSON.parse(fs.readFileSync('instore/models.json')).models;
(async()=>{for(const engine of [chromium,webkit]){const b=await engine.launch();try{const p=await b.newPage({viewport:{width:390,height:844}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
for(const m of models){
 await p.goto('http://127.0.0.1:19038/customizer.html?design=city-night-new-york.jpg&model='+encodeURIComponent(m.name.replace(/ /g,'-'))+'&style=hybrid&view=case',{waitUntil:'domcontentloaded'});
 await p.waitForFunction(name=>window.__kp?.state.model.replace(/^Samsung /,'')===name&&__kp.state.photoImg&&!__kp.state.libraryLoading&&!__kp.printIssue(),m.name);
 assert.equal(await p.evaluate(()=>__kp.state.caseType),'MagSafe Clear');assert.equal(await p.evaluate(()=>__kp.state.previewMode),'phone');
 assert.equal(await p.locator('#ctRow').isVisible(),false);
 const region=await p.evaluate(box=>{const c=document.getElementById('stageCanvas'),ctx=c.getContext('2d'),x=(box[0]+box[2])/2*c.width/2500,y=(box[1]+180)*c.height/3000;return ctx.getImageData(x,y,1,1).data[3];},m.case_box);
 assert(region>240,m.name+' mounted camera region absent');
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),m.name+' overflow');
 console.log(engine.name(),m.name,'mounted clear preview passed');
}
assert.deepEqual(errors,[]);
}finally{await b.close();}}})().catch(e=>{console.error(e);process.exitCode=1;});
