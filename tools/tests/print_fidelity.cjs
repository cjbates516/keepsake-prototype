const {chromium,webkit}=require('../../../playwright/node_modules/playwright-core');
const fs=require('fs'),path=require('path'),http=require('http'),crypto=require('crypto');
const root=path.resolve(__dirname,'../..'),out=path.resolve(process.argv[2]||'/tmp/print-fidelity');fs.mkdirSync(out,{recursive:true});
const source=process.env.KP_BASELINE==='1'?require('child_process').execFileSync('git',['show','HEAD:customizer.html'],{cwd:root,encoding:'utf8'}):fs.readFileSync(path.join(root,'customizer.html'),'utf8');
const baseline=process.env.KP_BASELINE==='1';
const hook=`window.__kpQA={kits:KITS,box:()=>maskBox,fit:()=>FIT,template:()=>TPL,mask:()=>viewMaskCanvas,design:()=>designTransform(),art:()=>typeof artMatrix==='function'?artMatrix():new DOMMatrix()};window.__kp={`;
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=http.createServer((q,r)=>{let f=path.join(root,new URL(q.url,'http://local').pathname);if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404).end();return;}r.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');r.end(f.endsWith('/customizer.html')?source.replace('window.__kp={',hook):d);});});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port,results=[],masks={};
const check=(name,ok,detail)=>{results.push({name,ok,detail});console.log(ok?'PASS':'FAIL',name,detail===undefined?'':JSON.stringify(detail));};
for(const [engine,kind]of [['chromium',chromium],['webkit',webkit]]){
 const b=await kind.launch(),ctx=await b.newContext({viewport:{width:1100,height:1000},serviceWorkers:'block'}),p=await ctx.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));await p.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 await p.goto(base+'/customizer.html?staff=1&model=iphone-18-pro');await p.waitForFunction(()=>window.__kpQA);
 const models=await p.evaluate(()=>Object.keys(__kpQA.kits));if(process.env.KP_MODELS)models.splice(0,models.length,...process.env.KP_MODELS.split('|'));
 // Synthetic known circle is independent of any production artwork or customer photo.
 const fixture=await p.evaluate(()=>{const c=document.createElement('canvas');c.width=600;c.height=1000;const x=c.getContext('2d');x.fillStyle='#112244';x.fillRect(0,0,600,1000);x.fillStyle='#ff0000';x.beginPath();x.arc(300,500,65,0,Math.PI*2);x.fill();return c.toDataURL();});
 for(const model of models){
  await p.goto(base+'/customizer.html?staff=1&model='+encodeURIComponent(model));
  await p.waitForFunction(()=>window.__kpQA&&__kpQA.mask()&&__kpQA.box());
  await p.evaluate(async(data)=>{const im=new Image();im.src=data;await im.decode();Object.assign(__kp.state,{photoImg:im,photoUrl:data,isLibraryDesign:false,fitMode:'fill',variant:'original',px:0,py:0,scale:1,rot:0});__kp.render();},fixture);
  const slug=model.replace(/[^a-z0-9]/gi,'');
  const report=await p.evaluate(async()=>{
   const s=__kp.state,q=__kpQA,box=q.box(),tpl=q.template(),fit=q.fit();
   const outputs=[];
   for(const rot of [0,37,90]){
    s.rot=rot;const c=await new Promise(r=>__kp.buildPrint(r)),x=c.getContext('2d'),d=x.getImageData(0,0,c.width,c.height).data;
    let x0=c.width,y0=c.height,x1=-1,y1=-1,partial=0,count=0;
    for(let i=0;i<d.length;i+=4){if(d[i+3]>0&&d[i+3]<255)partial++;if(d[i]>230&&d[i+1]<20&&d[i+2]<20&&d[i+3]>240){const n=i/4,xx=n%c.width,yy=Math.floor(n/c.width);x0=Math.min(x0,xx);x1=Math.max(x1,xx);y0=Math.min(y0,yy);y1=Math.max(y1,yy);count++;}}
    outputs.push({rot,ratio:(x1-x0+1)/(y1-y0+1),box:[x0,y0,x1,y1],count,partial,png:rot===0?c.toDataURL():null});
   }
   s.rot=0;
   const matrix=q.design(),a=q.art(),mx=(tpl.pxW/tpl.w)/fit.sx,my=(tpl.pxH/tpl.h)/fit.sy;
   // Opaque solid fixture must have binary final mask alpha and exact cross-engine mask geometry.
   const solid=document.createElement('canvas');solid.width=600;solid.height=1000;solid.getContext('2d').fillRect(0,0,600,1000);s.photoImg=solid;
   const c=await new Promise(r=>__kp.buildPrint(r)),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data,alpha=new Uint8Array(c.width*c.height);
   for(let i=0;i<alpha.length;i++)alpha[i]=d[i*4+3];
   let binary=true;for(const v of alpha)if(v!==0&&v!==255)binary=false;
   return {box,fit,tpl,outputs,binary,alpha:btoa(String.fromCharCode(...alpha.subarray(0,0))),alphaChunks:Array.from({length:Math.ceil(alpha.length/20000)},(_,i)=>btoa(String.fromCharCode(...alpha.subarray(i*20000,(i+1)*20000)))),maskPng:c.toDataURL(),physicalAxes:[Math.hypot(matrix.a*mx,matrix.b*my),Math.hypot(matrix.c*mx,matrix.d*my)],textAxes:[a.a*mx,a.d*my]};
  });
  check(engine+' '+model+' preserves circle at 0/37/90 degrees',report.outputs.every(x=>x.count>100&&Math.abs(x.ratio-1)<.012),report.outputs.map(({rot,ratio,count})=>({rot,ratio,count})));
  check(engine+' '+model+' binary opaque mask',report.binary);
  check(engine+' '+model+' uniform artwork/text axes',Math.abs(report.physicalAxes[0]/report.physicalAxes[1]-1)<1e-6&&Math.abs(report.textAxes[0]/report.textAxes[1]-1)<1e-6);
  const alpha=Buffer.concat(report.alphaChunks.map(x=>Buffer.from(x,'base64'))),hash=crypto.createHash('sha256').update(alpha).digest('hex');
  if(engine==='chromium')masks[model]={hash,box:report.box};else check(engine+' '+model+' exact mask/bounds match Chromium',hash===masks[model].hash&&JSON.stringify(report.box)===JSON.stringify(masks[model].box));
  fs.writeFileSync(path.join(out,engine+'-'+slug+'.png'),Buffer.from(report.outputs[0].png.split(',')[1],'base64'));
  fs.writeFileSync(path.join(out,engine+'-'+slug+'-mask.png'),Buffer.from(report.maskPng.split(',')[1],'base64'));
  for(const o of report.outputs)delete o.png;delete report.alphaChunks;delete report.maskPng;
  fs.writeFileSync(path.join(out,engine+'-'+slug+'.json'),JSON.stringify(report,null,2));
 }
 check(engine+' no runtime errors',errors.length===0,errors);await b.close();
}
fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));server.close();if(results.some(x=>!x.ok))process.exitCode=1;
})().catch(e=>{console.error(e);server.close();process.exit(1)});
