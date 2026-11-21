const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require(process.env.KP_PLAYWRIGHT||'../../../playwright/node_modules/playwright-core');
const base=process.env.KP_BASE||'http://127.0.0.1:19038/',out=process.env.KP_OUT||'../collaboration/clear-case-every-page-2026-11-21/assets';fs.mkdirSync(out,{recursive:true});
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const personal=require('../personal-case-renders.json');
if(!process.env.KP_LIVE)for(const [file,sha] of Object.entries(personal.sources))assert.equal(hash(file),sha,'Rebuild personal previews after changing '+file);
for(const row of personal.renders){assert.equal(hash(row.output),row.sha256);if(row.input)assert.equal(hash(row.input),row.inputSha256);}
function sourceFiles(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?sourceFiles(path.join(dir,e.name)):/\.(js|html|css|json)$/.test(e.name)?[path.join(dir,e.name)]:[]);}
const files=[...fs.readdirSync('.').filter(f=>f.endsWith('.html')),...sourceFiles('assets'),...sourceFiles('instore')];
const refs=new Map();for(const file of files){const text=fs.readFileSync(file,'utf8');
 for(const m of text.matchAll(/(?:assets\/)?(?:home\/[^\s"'<>]+|(?:case-only-previews|featured-cases|collection-cases|celestial-patterns|new-prints)\/[^\s"'<>]+)\.(?:webp|png|jpg)(?:\?[^\s"'<>]*)?/g)){
  let src=m[0].split('?')[0];if(!src.startsWith('assets/'))src='assets/'+src;refs.set(src,[...(refs.get(src)||[]),file]);
 }
}
const excluded=new Set(['assets/home/case-edit/los-angeles-night.webp','assets/home/case-edit/new-york-night.webp','assets/home/case-edit/philadelphia-night.webp','assets/home/case-edit/yosemite-valley.webp','assets/home/og-card.jpg','assets/home/signature-golf/pebble-map-detail.webp','assets/home/signature-golf/andrews-map-detail.webp']);
const metadata=new Map();for(const file of fs.readdirSync('tools').filter(f=>/render.*\.json$/.test(f))){const obj=JSON.parse(fs.readFileSync('tools/'+file));for(const row of Array.isArray(obj)?obj:obj.renders||[])if(row.output&&row.crop){assert(!metadata.has(row.output),'Duplicate render record: '+row.output);metadata.set(row.output,row);}}
const rows=[];for(const [src,pages] of refs){if(excluded.has(src))continue;assert(metadata.has(src),'Case preview lacks renderer provenance: '+src);assert.equal(metadata.get(src).caseType,'MagSafe Clear',src);rows.push({src,pages:[...new Set(pages)],...metadata.get(src)});}
const bases={'iPhone 17 Pro Max':'i17pm-silver.webp','iPhone 15 Pro Max':'i15pm-black.webp','iPhone 15 Pro':'i15p-silver.webp','Samsung Galaxy S26 Ultra':'s26u-clear-black.webp'};
async function compare({row,photo,fit=false}){
  const image=async src=>{const im=new Image();im.src=src;await im.decode();return im};const maskFile={'iPhone 17 Pro Max':'view-i17pm.png','iPhone 15 Pro Max':'view-i15pm.png','iPhone 15 Pro':'view-i15p.png','Samsung Galaxy S26 Ultra':'view-s26u.png'}[row.model];
  const [im,ref,mask]=await Promise.all([image(row.src),image('assets/cases/'+photo),image('assets/masks/'+maskFile)]);
  const c=document.createElement('canvas');c.width=1250;c.height=1500;const x=c.getContext('2d');x.drawImage(ref,0,0,1250,1500);
  const a=document.createElement('canvas');a.width=fit?row.width:im.naturalWidth;a.height=fit?row.height:im.naturalHeight;const y=a.getContext('2d');y.drawImage(im,0,0,a.width,a.height);
  const d=x.getImageData(0,0,1250,1500).data,e=y.getImageData(0,0,a.width,a.height).data;
  const maskCanvas=document.createElement('canvas');maskCanvas.width=1250;maskCanvas.height=1500;maskCanvas.getContext('2d').drawImage(mask,0,0,1250,1500);const md=maskCanvas.getContext('2d').getImageData(0,0,1250,1500).data;
  // Compare actual bumper pixels on all four sides, excluding the printable
  // mask. A camera-only alpha test allowed the old bare-device images to pass.
  let error=0,count=0;
  for(let yy=row.crop[1];yy<row.crop[3];yy+=2)for(let xx=row.crop[0];xx<row.crop[2];xx+=2){
   const i=(yy*1250+xx)*4,xx2=xx-row.crop[0],yy2=yy-row.crop[1];
   if(d[i+3]<40||md[i+3]>5||!(xx2<50||xx2>a.width-50||yy2<50||yy2>a.height-50))continue;
   const j=(yy2*a.width+xx2)*4;for(let k=0;k<4;k++)error+=Math.abs(d[i+k]-e[j+k]);count++;
  }
  return {src:row.src,referencePhoto:photo,width:a.width,height:a.height,rimSamples:count,rimError:error/Math.max(1,count*4)};
 }
(async()=>{const b=await chromium.launch();try{const p=await b.newPage();await p.goto(base);const results=[];
 for(const row of rows){assert(bases[row.model],row.model);const result=await p.evaluate(compare,{row,photo:bases[row.model]});
 results.push(result);assert.equal(result.width,row.width,row.src);assert.equal(result.height,row.height,row.src);assert(result.rimSamples>100&&result.rimError<12,'Clear bumper mismatch: '+JSON.stringify(result));
 }
 const bad=await p.evaluate(compare,{row:{...personal.renders.find(r=>r.studio==='drawing'),src:'assets/home/personal/drawing-case.webp'},photo:'i17pm-silver.webp',fit:true});
 assert(bad.rimSamples>100&&bad.rimError>12,'Known-bad bare-phone preview must fail even when resized to the new dimensions');
 assert.equal(personal.renders.find(r=>r.studio==='drawing').input,'assets/home/personal/drawing-note.png');
 const recovered=await p.evaluate(async()=>{const image=async src=>{const im=new Image();im.src=src;await im.decode();return im};const [source,note]=await Promise.all([image('assets/home/personal/drawing-shell.webp'),image('assets/home/personal/drawing-note.png')]);const c=document.createElement('canvas');c.width=668;c.height=478;const x=c.getContext('2d');x.drawImage(source,108,880,668,478,0,0,668,478);const a=x.getImageData(0,0,668,478).data;x.clearRect(0,0,668,478);x.drawImage(note,0,0);const b=x.getImageData(0,0,668,478).data;return a.every((v,i)=>v===b[i]);});assert(recovered,'Approved handwriting must remain pixel-identical');
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({cases:results,negativeControl:bad,notePixelsPreserved:recovered,manuallyReviewedExclusions:[...excluded]},null,2)+'\n');
 // Visual contact sheets include every used static case, including all backgrounds.
 for(let n=0;n<rows.length;n+=48){const slice=rows.slice(n,n+48);await p.setViewportSize({width:1200,height:1500});await p.setContent('<html><body style="margin:0;background:#f1efec"><div id="sheet" style="display:grid;grid-template-columns:repeat(8,150px)"></div></body></html>');
  await p.evaluate(async({rows,base})=>{const grid=document.getElementById('sheet');for(const r of rows){const el=document.createElement('div');el.style='height:245px;padding:5px;box-sizing:border-box;text-align:center;font:9px sans-serif;overflow:hidden';const im=new Image();im.src=new URL(r.src,base);im.style='height:215px;max-width:135px;object-fit:contain';await im.decode();el.append(im,document.createElement('br'),r.src.split('/').pop());grid.append(el);}},{rows:slice,base});
  await p.locator('#sheet').screenshot({path:path.join(out,'sheet-'+String(n/48+1).padStart(2,'0')+'.png')});
 }
 console.log(rows.length+' static case previews: render metadata, dimensions and photographed bumper pixels verified (the referenced finish per model); '+excluded.size+' separately reviewed scene/map/social images');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
