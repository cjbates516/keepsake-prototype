// Export both finishes through the actual site compositor, then trim transparent canvas margins.
const fs=require('node:fs');
const {chromium}=require('../../playwright/node_modules/playwright-core');
const base=process.env.KP_BASE||'http://127.0.0.1:19043/';
(async()=>{const b=await chromium.launch();try{const p=await b.newPage();fs.mkdirSync('assets/home/campaign',{recursive:true});
for(const [slug,rim] of [['clear','Clear Frost'],['smoke','Smoke Frost']]){
 await p.goto(base+'customizer.html?'+new URLSearchParams({model:'iphone-15-pro',design:'ocean-photo-turtle-glide.jpg',case:'rated',rim}));
 await p.waitForFunction(()=>window.KPStudioCore?.info().previewReady&&!KPStudioCore.info().issue&&!__kp.state.photoImg?.__kpIsThumb&&!__kp.state.libraryLoading);
 const out=await p.evaluate(()=>{__kp.render();const src=document.getElementById('stageCanvas'),w=src.width,h=src.height,a=src.getContext('2d').getImageData(0,0,w,h).data;let l=w,t=h,r=0,b=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(a[(y*w+x)*4+3]){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x+1);b=Math.max(b,y+1);}
 const c=document.createElement('canvas');c.width=560;c.height=Math.round((b-t)*560/(r-l));c.getContext('2d').drawImage(src,l,t,r-l,b-t,0,0,c.width,c.height);return{data:c.toDataURL('image/webp',.94).split(',')[1],width:c.width,height:c.height,rim:KPStudioCore.info().rim};});
 if(out.rim!==rim)throw Error('Unexpected frost rim');fs.writeFileSync('assets/home/campaign/turtle-'+slug+'.webp',Buffer.from(out.data,'base64'));console.log(slug,out.width,out.height);
}}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
