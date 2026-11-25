// Compose original transparent doodle layers with full-size background colors.
// Input is the reviewed image-generation receipt; never synthesize or inset the artwork.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require('../../playwright/node_modules/playwright-core');
const input=process.argv[2];if(!input)throw Error('Usage: node tools/build_neon_drop.cjs <generated.json>');
const rows=JSON.parse(fs.readFileSync(input)),root=path.resolve(__dirname,'..'),dir=path.join(root,'assets/designs');
const catalogPath=path.join(root,'assets/colorway-catalog.js'),raw=fs.readFileSync(catalogPath,'utf8');
const profiles=JSON.parse(raw.slice(raw.indexOf('=')+1).trim().replace(/;$/,''));
const designs=JSON.parse(fs.readFileSync(path.join(dir,'designs.json'))),manifest=[];
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex').slice(0,12);
const palette=[['Midnight Navy','#111c35'],['Electric Plum','#2a1435'],['Deep Teal','#123532'],['Berry Night','#3d1830'],['Graphite','#282a31']];
(async()=>{const browser=await chromium.launch();try{const p=await browser.newPage();
for(const row of rows){
 const file='kp-neon-'+row.slug+'.png',old=designs.find(d=>d.file===file),oldProfile=profiles[file];
 assert(row.existing?!!old:!old,'Run only on the pre-release catalog');
 const colors=oldProfile?.colors||palette;
 const data=fs.readFileSync(row.path).toString('base64');
 const output=await p.evaluate(async({data,colors})=>{
  const im=new Image();im.src='data:image/png;base64,'+data;await im.decode();
  const cv=document.createElement('canvas');cv.width=im.naturalWidth;cv.height=im.naturalHeight;const cx=cv.getContext('2d');
  return [['Original','#000000'],...colors].map(([name,color])=>{
   cx.fillStyle=color;cx.fillRect(0,0,cv.width,cv.height);cx.drawImage(im,0,0);
   const thumb=document.createElement('canvas');thumb.width=320;thumb.height=Math.round(320*cv.height/cv.width);thumb.getContext('2d').drawImage(cv,0,0,thumb.width,thumb.height);
   return {name,color,width:cv.width,height:cv.height,png:cv.toDataURL('image/png').split(',')[1],webp:cv.toDataURL('image/webp',.97).split(',')[1],thumbPng:thumb.toDataURL('image/png').split(',')[1],thumbWebp:thumb.toDataURL('image/webp',.94).split(',')[1]};
  });
 },{data,colors});
 assert.equal(output[0].width*2,output[0].height);
 if(!old){
  const bytes=Buffer.from(output[0].png,'base64');fs.writeFileSync(path.join(dir,file),bytes);fs.writeFileSync(path.join(dir,'thumbs',file),Buffer.from(output[0].thumbPng,'base64'));
  designs.unshift({file,title:row.title,category:'Neon Doodles',collection:'Neon Doodles',color:['Black','Pink','Blue','Purple'],hash:hash(bytes),kind:'original AI-assisted illustration',credit:'Keepsake · original AI-assisted artwork',license:'Original artwork',active:true,added:'2026-11-25'});
 }
 const original=old||designs.find(d=>d.file===file),variants=[],variantHashes=[];
 for(let i=1;i<output.length;i++){
  const name='kp-neon-'+row.slug+'-c'+i+'.webp',bytes=Buffer.from(output[i].webp,'base64');
  fs.mkdirSync(path.join(dir,'colorways/thumbs'),{recursive:true});fs.writeFileSync(path.join(dir,'colorways',name),bytes);fs.writeFileSync(path.join(dir,'colorways/thumbs',name),Buffer.from(output[i].thumbWebp,'base64'));
  variants.push(name);variantHashes.push(hash(bytes));
 }
 profiles[file]={method:'assets',background:{color:[0,0,0],transparent:false},group:'bright',hash:original.hash,preparedHash:original.hash,colors,variants,variantHashes};
 manifest.push({file,title:original.title,existing:row.existing,width:output[0].width,height:output[0].height,sourceSha256:crypto.createHash('sha256').update(fs.readFileSync(row.path)).digest('hex'),method:'Original transparent artwork generated or edited with image_gen; full-size backgrounds composed with browser canvas. Existing originals are preserved.',options:[{id:'original',name:'Original',file:'assets/designs/'+file},...variants.map((v,i)=>({id:'c'+(i+1),name:colors[i][0],file:'assets/designs/colorways/'+v}))]});
 console.log('Prepared',original.title,'6 full-size looks');
}
// Retain the catalog's existing human-readable JSON indentation.
fs.writeFileSync(path.join(dir,'designs.json'),JSON.stringify(designs,null,1).split('\n').map(l=>l.trimStart()).join('\n')+'\n');
fs.writeFileSync(catalogPath,raw.slice(0,raw.indexOf('=')+1)+JSON.stringify(profiles)+';\n');
fs.writeFileSync(path.join(root,'assets/neon-doodles-20261125.json'),JSON.stringify(manifest,null,2)+'\n');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
