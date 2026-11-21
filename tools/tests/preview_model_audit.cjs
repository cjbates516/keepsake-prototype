const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.KP_PLAYWRIGHT||'../../../playwright/node_modules/playwright-core');
const base=process.env.KP_BASE||'http://127.0.0.1:19038/',out=process.env.KP_OUT||'../collaboration/clear-case-every-page-2026-11-21/models';fs.mkdirSync(out,{recursive:true});
const models=JSON.parse(fs.readFileSync('instore/models.json')).models.filter(m=>!process.env.KP_MODEL||m.id===process.env.KP_MODEL);
async function proof(p,selector,m){return p.locator(selector).first().evaluate(async(c,m)=>{
 const image=async url=>{const i=new Image();i.src=url;await i.decode();return i};const [photo,mask]=await Promise.all([image('assets/cases/'+m.case),image('assets/masks/'+m.mask)]);
 const ref=document.createElement('canvas');ref.width=c.width;ref.height=c.height;const x=ref.getContext('2d');x.drawImage(photo,0,0,c.width,c.height);const a=x.getImageData(0,0,c.width,c.height).data;
 x.clearRect(0,0,c.width,c.height);x.drawImage(mask,0,0,c.width,c.height);const k=x.getImageData(0,0,c.width,c.height).data,d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
 const box=m.case_box.map((v,i)=>Math.round(v*(i%2?c.height/3000:c.width/2500)));let n=0,error=0;
 for(let yy=Math.max(0,box[1]-30);yy<Math.min(c.height,box[3]+30);yy++)for(let xx=Math.max(0,box[0]-30);xx<Math.min(c.width,box[2]+30);xx++){const i=(yy*c.width+xx)*4;if(a[i+3]<40||k[i+3]>5||!(xx<box[0]+20||xx>box[2]-20||yy<box[1]+20||yy>box[3]-20))continue;n++;for(let z=0;z<4;z++)error+=Math.abs(a[i+z]-d[i+z]);}
 const tile=document.createElement('canvas');tile.width=240;tile.height=490;tile.getContext('2d').drawImage(c,box[0]-10,box[1]-10,box[2]-box[0]+20,box[3]-box[1]+20,0,0,240,490);
 return {canvas:[c.width,c.height],box,samples:n,error:error/Math.max(1,n*4),image:tile.toDataURL()};
},m);}
(async()=>{const results=[];for(const engine of [chromium,webkit]){const b=await engine.launch();try{const images=[];
 for(const m of models){const context=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce',serviceWorkers:'block'}),p=await context.newPage();p.setDefaultTimeout(30000);
 const slug=m.name.replaceAll(' ','-').toLowerCase(),finish=/silver/.test(m.case)?'Silver':/white|whte/.test(m.case)?'White':'Black';
 await p.goto(base+'customizer.html?design=city-night-new-york.jpg&model='+slug+'&finish='+finish+'&view=case',{waitUntil:'domcontentloaded'});
 await p.waitForFunction(name=>__kp?.state.model.replace(/^Samsung /,'')===name&&__kp.state.photoImg&&!__kp.state.libraryLoading&&!__kp.printIssue(),m.name);
 await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 assert.equal(await p.evaluate(()=>__kp.state.caseType),'MagSafe Clear');assert.equal(await p.evaluate(()=>__kp.state.previewMode),'phone');
 const studio=await proof(p,'#stageCanvas',m);assert(studio.samples>30&&studio.error<12,m.name+' editor rim mismatch '+JSON.stringify({...studio,image:undefined}));
 await p.goto(base+'gallery.html?cat=City+Scenes&device='+slug+'&finish='+finish+'&view=case',{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>document.querySelector('canvas[data-rendered-preview]'));
 const gallery=await proof(p,'canvas[data-rendered-preview]',m);assert(gallery.samples>15&&gallery.error<12,m.name+' gallery rim mismatch '+JSON.stringify({...gallery,image:undefined}));
 images.push({name:m.name,studio:studio.image,gallery:gallery.image});delete studio.image;delete gallery.image;
 results.push({engine:engine.name(),model:m.name,studio,gallery});console.log(engine.name(),m.name,'clear bumper matched in gallery + editor');await context.close();
 }
 const page=await b.newPage({viewport:{width:1200,height:2000}});await page.setContent('<body style="background:#f1efec;margin:0"><main style="display:grid;grid-template-columns:repeat(6,200px)"></main>');
 await page.evaluate(rows=>{for(const r of rows){const el=document.createElement('div');el.style='height:360px;font:12px sans-serif;text-align:center';const label=document.createElement('div');label.style='height:30px';label.textContent=r.name;el.append(label);const pair=document.createElement('div');pair.style='display:flex;justify-content:center';el.append(pair);for(const src of [r.studio,r.gallery]){const im=new Image();im.src=src;im.style='width:95px;height:320px;object-fit:contain';pair.append(im);}document.querySelector('main').append(el);}},images);
 await page.evaluate(()=>Promise.all([...document.images].map(im=>im.decode())));
 await page.screenshot({path:path.join(out,engine.name()+'-all-models.png'),fullPage:true});
 }finally{await b.close();}}
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2)+'\n');console.log(results.length+' model/browser combinations verified in gallery and editor');
})().catch(e=>{console.error(e);process.exitCode=1;});
