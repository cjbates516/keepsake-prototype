// Rasterize our SVG pattern masters using the browser's vector renderer.
const {chromium}=require('../../playwright/node_modules/playwright-core');
const fs=require('fs');
(async()=>{const svg=fs.readFileSync(0,'utf8'),browser=await chromium.launch();try{const p=await browser.newPage();const png=await p.evaluate(async svg=>{const img=new Image();img.src='data:image/svg+xml;base64,'+btoa(svg);await img.decode();const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;c.getContext('2d').drawImage(img,0,0);return c.toDataURL().split(',')[1]},svg);process.stdout.write(Buffer.from(png,'base64'));}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
