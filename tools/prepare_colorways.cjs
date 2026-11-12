// Prepare source-specific, persistent palettes. Existing colorway slots never change.
// Run after build_colorway_catalog.py; PW_CORE may point to playwright-core.
const {chromium}=require(process.env.PW_CORE||'../../playwright/node_modules/playwright-core');
const fs=require('fs'),path=require('path'),http=require('http');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{let f=path.join(root,decodeURIComponent(new URL(req.url,'http://local').pathname));if(f.endsWith('/'))f+='index.html';if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return}fs.readFile(f,(e,d)=>{if(e){res.writeHead(404).end();return}res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.jpg':'image/jpeg','.png':'image/png'})[path.extname(f)]||'application/octet-stream');res.end(d)})});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const b=await chromium.launch({headless:true}),p=await b.newPage();const base='http://127.0.0.1:'+server.address().port;await p.goto(base+'/instore/find.html');
const catalog=await p.evaluate(async(base)=>{
const catalog=KP_COLORWAY_CATALOG;
function hsl(r,g,b){r/=255;g/=255;b/=255;let max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,h=0,l=(max+min)/2,s=d?d/(1-Math.abs(2*l-1)):0;if(d)h=60*(max===r?((g-b)/d)%6:max===g?(b-r)/d+2:(r-g)/d+4);return[(h+360)%360,s,l]}
function hex(h,s,l){let a=s*Math.min(l,1-l);return '#'+[0,8,4].map(n=>{let k=(n+h/30)%12;return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1)))).toString(16).padStart(2,'0')}).join('')}
for(const [file,pf] of Object.entries(catalog)){
if(pf.method==='yosemite'||(pf.colors&&pf.background&&pf.preparedHash===pf.hash))continue;
try {
const im=new Image();im.src=base+'/assets/designs/'+encodeURIComponent(file);await im.decode();const c=document.createElement('canvas');c.width=c.height=96;const cx=c.getContext('2d',{willReadFrequently:true});cx.drawImage(im,0,0,96,96);const d=cx.getImageData(0,0,96,96).data,bins={};let transparent=0;
for(let i=0;i<d.length;i+=4){if(d[i+3]<240){transparent++;continue}let n=i/4,x=n%96,y=Math.floor(n/96),w=x<3||x>92||y<3||y>92?24:1,key=[d[i]>>4,d[i+1]>>4,d[i+2]>>4].join(',');let b=bins[key]??=[0,0,0,0];b[0]+=w;for(let k=0;k<3;k++)b[k+1]+=d[i+k]*w;}
const ranked=Object.values(bins).sort((a,b)=>b[0]-a[0]),bg=ranked.length?ranked[0].slice(1).map(v=>v/ranked[0][0]):[255,255,255];let close=0;for(let i=0;i<d.length;i+=4)if(Math.hypot(d[i]-bg[0],d[i+1]-bg[1],d[i+2]-bg[2])<32)close++;
let accent=ranked.find(b=>{let a=b.slice(1).map(v=>v/b[0]);return Math.max(...a)-Math.min(...a)>40&&Math.hypot(...a.map((v,i)=>v-bg[i]))>75});let rgb=accent?accent.slice(1).map(v=>v/accent[0]):bg,hue=hsl(...rgb)[0],light=.2126*bg[0]+.7152*bg[1]+.0722*bg[2]>140;
pf.background={color:bg,transparent:transparent/9216>.05};pf.coverage=Number((close/9216).toFixed(3));
if(!pf.background.transparent&&pf.coverage<.16||/aerial-view|autumn-sunrise|desert-dusk|ridge-sun|lake-aerial/.test(file))pf.method='framed';
pf.islands=pf.islands||pf.method==='map'||/pattern|polka|stripes|checker|gingham/.test(file);
const names=['Coral','Apricot','Butter','Meadow','Sage','Sea Glass','Sky','Blue','Periwinkle','Lilac','Orchid','Rose'];
pf.colors=pf.colors||[-50,20,95,170,245].map((offset,i)=>{let h=(hue+offset+360)%360,l=pf.method==='framed'?[.20,.82,.43,.25,.70][i]:(light?[.78,.86,.81,.74,.88][i]:[.16,.23,.19,.28,.14][i]),sat=pf.method==='framed'?.28:light?.28:.25;return [names[Math.floor(h/30)]+(l<.35?' Night':''),hex(h,sat,l)]});
pf.paletteVersion=1;pf.preparedHash=pf.hash;c.width=c.height=0;
}catch(error){console.warn('Colorways remain unprepared for '+file+': '+error.message);}
}return catalog;
},base);fs.writeFileSync(path.join(root,'assets/colorway-catalog.js'),'/* Per-design colorway slots. Preserve existing palettes when syncing. */\nwindow.KP_COLORWAY_CATALOG='+JSON.stringify(catalog)+';\n');console.log('Prepared',Object.keys(catalog).length,'design palettes;',Object.values(catalog).filter(p=>p.method==='framed').length,'framed');await b.close();server.close()})().catch(e=>{console.error(e);process.exit(1)});
