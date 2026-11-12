const {chromium,webkit}=require(process.env.PW_CORE || 'playwright-core');
const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..');
const out=path.resolve(process.argv[2] || '/tmp/keepsake-customizer-qa');fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{let f=path.join(root,decodeURIComponent(new URL(req.url,'http://local').pathname));if(f.endsWith('/'))f+='index.html';if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return}fs.readFile(f,(e,d)=>{if(e){res.writeHead(404).end();return}res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(d)})});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;let results=[];
function check(name,ok,detail){results.push({name,ok,detail});console.log(name,ok?'PASS':'FAIL',JSON.stringify(detail||''));if(!ok)throw Error(name)}
for(const [engine,kind] of [['chromium',chromium],['webkit',webkit]]){const b=await kind.launch({headless:true});const p=await b.newPage({viewport:{width:1440,height:1100}});let errors=[],unwanted=[];
p.on('pageerror',e=>errors.push(e.message));await p.route('**/*',r=>{const u=new URL(r.request().url());if(/assets\/(scenes|collage)\//.test(u.pathname))unwanted.push(u.pathname);return u.hostname==='127.0.0.1'?r.continue():r.abort()});
await p.goto(base+'/customizer.html?model=iphone-16-pro-max&design=boho-floral-01.jpg');await p.waitForFunction(()=>window.__kp&&__kp.state.photoImg&&!__kp.state.photoImg.__kpIsThumb);await p.waitForTimeout(1500);
check(engine+' six looks',await p.locator('.photo-look').count()===6);
check(engine+' no fake scenes/collage',await p.locator('#kpViews,.layChip').count()===0&&unwanted.length===0,unwanted);
check(engine+' base price',await p.locator('#totalTop').textContent()==='$44.99');
await p.locator('.adn[data-k="screen"]').click();check(engine+' bundled total',await p.locator('#totalTop').textContent()==='$64.98'&&await p.locator('#cartBtn').textContent()==='Order — $64.98');
await p.locator('#cartBtn').click();check(engine+' order panel total',(await p.locator('#kpPlace').textContent()).includes('$64.98'));
await p.locator('.adn[data-k="screen"]').click();check(engine+' unbundle updates panel',(await p.locator('#kpPlace').textContent()).includes('$44.99'));
async function print(){for(let i=0;i<30;i++){let value=await p.evaluate(()=>{let out=null;__kp.buildPrint((c)=>{let d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let hash=2166136261,clear=0,solid=0,mono=true;for(let n=0;n<d.length;n+=4){if(!d[n+3])clear++;else{solid++;if(Math.abs(d[n]-d[n+1])>2||Math.abs(d[n+1]-d[n+2])>2)mono=false;}for(let j=0;j<4;j++)hash=Math.imul(hash^d[n+j],16777619);}out={hash:hash>>>0,w:c.width,h:c.height,clear,solid,mono};});return out});if(value)return value;await p.waitForTimeout(300)}throw Error('Print unavailable')}
const original=await print();let hashes=new Set([original.hash]);for(const look of ['vivid','warm','cool','mono','soft']){await p.locator('[data-look="'+look+'"]').click();const x=await print();check(engine+' '+look+' print',x.hash!==original.hash&&x.w===original.w&&x.h===original.h&&x.clear===original.clear&&x.solid>0,x);if(look==='mono')check(engine+' monochrome export',x.mono);hashes.add(x.hash);}
check(engine+' six distinct looks',hashes.size===6);await p.locator('[data-look="original"]').click();check(engine+' Original restores print',(await print()).hash===original.hash);
await p.locator('#photoLooksWrap').screenshot({path:path.join(out,engine+'-looks.png')});
// Synthetic upload: no customer content used.
const fixture=await p.evaluate(()=>{const c=document.createElement('canvas');c.width=600;c.height=800;const x=c.getContext('2d');x.fillStyle='#e02544';x.fillRect(0,0,300,800);x.fillStyle='#207bba';x.fillRect(300,0,300,800);x.fillStyle='#f9df65';x.fillRect(100,200,400,300);return c.toDataURL().split(',')[1]});
await p.locator('#fileInput').setInputFiles({name:'synthetic-photo.png',mimeType:'image/png',buffer:Buffer.from(fixture,'base64')});await p.waitForFunction(()=>__kp.state.photoImg&&!__kp.state.isLibraryDesign);check(engine+' upload resets original',await p.locator('[data-look="original"]').getAttribute('aria-pressed')==='true');
await p.locator('[data-look="mono"]').click();check(engine+' uploaded mono exports', (await print()).mono);await p.locator('#fitFit').click();check(engine+' fit mode variation exports',(await print()).mono);
await p.locator('#clearBtn').click();check(engine+' reset clears variations',!await p.locator('#photoLooksWrap').isVisible()&&await p.locator('.photo-look').count()===0);
const models=JSON.parse(fs.readFileSync(path.join(root,'instore/models.json'))).models.filter(m=>m.active);
for(const m of models){await p.goto(base+'/customizer.html?model='+m.name.toLowerCase().replaceAll(' ','-')+'&design=boho-floral-01.jpg');await p.waitForFunction(()=>window.__kp&&__kp.state.photoImg&&!__kp.state.photoImg.__kpIsThumb);const x=await print();check(engine+' model export '+m.name,x.clear>0&&x.solid>0&&x.w>500&&x.h>1000);}
await p.setViewportSize({width:390,height:844});await p.locator('#photoLooksWrap').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,engine+'-mobile.png')});check(engine+' mobile no overflow',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));check(engine+' no JS errors',errors.length===0,errors);
const localPixels=await p.evaluate(()=>{
 const c=document.createElement('canvas');c.width=4;c.height=4;const x=c.getContext('2d');const d=x.createImageData(4,4);for(let i=0;i<d.data.length;i+=4){d.data[i]=180;d.data[i+1]=70;d.data[i+2]=30;d.data[i+3]=(i/4)%2?255:0;}x.putImageData(d,0,0);
 const values=KPPhotoLooks.choices.map(v=>{const cv=KPPhotoLooks.make(c,v.id);const px=[...cv.getContext('2d').getImageData(0,0,4,4).data];return {id:v.id,pixels:px,alpha: px.filter((_,i)=>i%4===3).every((a,i)=>a===d.data[i*4+3])};});
 const old=KPPhotoLooks.source(c,'warm');KPPhotoLooks.source(c,'cool');return {values,released:old.width===0&&old.height===0};
});check(engine+' alpha preserved in all looks',localPixels.values.every(v=>v.alpha));check(engine+' old full-size canvas released',localPixels.released);results.push({name:engine+' deterministic synthetic pixels',ok:true,detail:localPixels.values});
let pending=[];const fullURL='**/assets/designs/boho-floral-01.jpg',thumbURL='**/assets/designs/thumbs/boho-floral-01.jpg';
await p.route(thumbURL,r=>r.fulfill({status:404,body:''}));await p.route(fullURL,r=>{pending.push(r)});
await p.goto(base+'/customizer.html?model=iphone-16-pro-max&design=boho-floral-01.jpg',{waitUntil:'domcontentloaded'});
await p.waitForFunction(()=>window.__kp&&__kp.state.photoUrl&&__kp.state.photoUrl.endsWith('boho-floral-01.jpg')&&!__kp.state.photoImg);
check(engine+' undecoded image has no looks',await p.locator('.photo-look').count()===0);
while(!pending.length)await p.waitForTimeout(50);await Promise.all(pending.map(r=>r.continue()));
await p.waitForFunction(()=>__kp.state.photoImg&&__kp.state.photoImg.naturalWidth>0);check(engine+' recovered full image builds looks',await p.locator('.photo-look').count()===6);await p.locator('[data-look="mono"]').click();check(engine+' recovered full image exports mono',(await print()).mono);
check(engine+' no errors after recovery',errors.length===0,errors);await b.close();}
const pixelSets=results.filter(r=>r.name.endsWith('deterministic synthetic pixels'));check('synthetic pixels identical across engines',JSON.stringify(pixelSets[0].detail)===JSON.stringify(pixelSets[1].detail));
fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));server.close();})().catch(e=>{console.error(e);server.close();process.exit(1)});
