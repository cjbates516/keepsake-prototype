// Encode the four approved original paintings; never inset or recolor them.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('../../playwright/node_modules/playwright-core');
const root=path.resolve(__dirname,'..'),source=path.resolve(process.argv[2]),dir=path.join(root,'assets/designs');
const rows=[['01-ocean-confetti','Ocean Confetti','#36a9b8'],['02-confetti-party','Confetti Party','#ee6397'],['03-pastel-confetti','Pastel Confetti','#c9b3df'],['04-jewel-confetti','Jewel Confetti','#554298']];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex').slice(0,12);
(async()=>{const browser=await chromium.launch();try{const page=await browser.newPage(),outputs=[];
for(const [id,title,color] of rows){
 const original=fs.readFileSync(path.join(source,id+'.png'));
 const encoded=await page.evaluate(async data=>{const im=new Image();im.src='data:image/png;base64,'+data;await im.decode();
 const cv=document.createElement('canvas');cv.width=im.naturalWidth;cv.height=im.naturalHeight;cv.getContext('2d').drawImage(im,0,0);
 const thumb=document.createElement('canvas');thumb.width=320;thumb.height=Math.round(320*cv.height/cv.width);thumb.getContext('2d').drawImage(im,0,0,thumb.width,thumb.height);
 return {width:cv.width,height:cv.height,full:cv.toDataURL('image/webp',.97).split(',')[1],thumb:thumb.toDataURL('image/webp',.94).split(',')[1],thumbPng:thumb.toDataURL('image/png').split(',')[1]};},original.toString('base64'));
 const file='kp-'+id.slice(3)+'.png',variantFile=file.replace('.png','.webp'),bytes=Buffer.from(encoded.full,'base64'),small=Buffer.from(encoded.thumb,'base64');
 fs.writeFileSync(path.join(dir,file),original);fs.writeFileSync(path.join(dir,'thumbs',file),Buffer.from(encoded.thumbPng,'base64'));fs.writeFileSync(path.join(dir,'colorways',variantFile),bytes);fs.writeFileSync(path.join(dir,'colorways/thumbs',variantFile),small);
 outputs.push({file,variantFile,variantHash:hash(bytes),title,color,hash:hash(original),sourceSha256:crypto.createHash('sha256').update(original).digest('hex'),width:encoded.width,height:encoded.height});
}
const catalogPath=path.join(root,'assets/colorway-catalog.js'),raw=fs.readFileSync(catalogPath,'utf8'),profiles=JSON.parse(raw.slice(raw.indexOf('=')+1).trim().replace(/;$/,''));
let designs=JSON.parse(fs.readFileSync(path.join(dir,'designs.json')));designs=designs.filter(d=>!outputs.some(o=>o.file===d.file));
for(const row of outputs){const siblings=outputs.filter(o=>o.file!==row.file);
 profiles[row.file]={method:'assets',label:'Color variation',variantCount:3,originalColor:[row.title,row.color],background:{transparent:false},group:'bright',hash:row.hash,preparedHash:row.hash,colors:siblings.map(o=>[o.title,o.color]),variants:siblings.map(o=>o.variantFile),variantHashes:siblings.map(o=>o.variantHash)};
}
designs.unshift(...outputs.map(o=>({file:o.file,title:o.title,category:'Paint Party',collection:'Confetti Paint',color:['Blue','Pink','Purple','Green'],hash:o.hash,kind:'original AI-assisted illustration',credit:'Keepsake · original AI-assisted artwork',license:'Original artwork',active:true,added:'2026-11-27'})));
fs.writeFileSync(path.join(dir,'designs.json'),JSON.stringify(designs,null,1).split('\n').map(l=>l.trimStart()).join('\n')+'\n');
fs.writeFileSync(catalogPath,raw.slice(0,raw.indexOf('=')+1)+JSON.stringify(profiles)+';\n');
fs.writeFileSync(path.join(root,'assets/confetti-paint-20261127.json'),JSON.stringify(outputs,null,2)+'\n');
console.log('Prepared four approved paintings, each with four full-bleed color choices.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
