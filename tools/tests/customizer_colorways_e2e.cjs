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
await p.route('**/assets/nsfw/**',r=>r.fulfill({contentType:'application/javascript',body:r.request().url().includes('nsfwjs')?"window.nsfwjs={load:async()=>({classify:async()=>[{className:'Porn',probability:window.__rejectTestPhoto?.9:0}]})};":''}));
await p.goto(base+'/customizer.html?model=iphone-16-pro-max&design=boho-floral-01.jpg');await p.waitForFunction(()=>window.__kp&&__kp.state.photoImg&&!__kp.state.photoImg.__kpIsThumb);await p.waitForTimeout(1500);
check(engine+' six looks',await p.locator('.photo-look').count()===6);
check(engine+' no fake scenes/collage',await p.locator('#kpViews,.layChip').count()===0&&unwanted.length===0,unwanted);
check(engine+' base price',await p.locator('#totalTop').textContent()==='$44.99');
await p.locator('.adn[data-k="screen"]').click();check(engine+' bundled total',await p.locator('#totalTop').textContent()==='$64.98'&&await p.locator('#cartBtn').textContent()==='Counter review · $64.98');
await p.locator('#cartBtn').click();check(engine+' order panel total',(await p.locator('#reviewDetails').innerText()).includes('$64.98'));
await p.locator('#counterReview button').click();await p.locator('.adn[data-k="screen"]').click();await p.locator('#cartBtn').click();check(engine+' unbundle updates panel',(await p.locator('#reviewDetails').innerText()).includes('$44.99'));
await p.locator('#counterReview button').click();
async function print(){for(let i=0;i<30;i++){let value=await p.evaluate(()=>{let out=null;__kp.buildPrint((c)=>{let d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let hash=2166136261,clear=0,solid=0,mono=true;for(let n=0;n<d.length;n+=4){if(!d[n+3])clear++;else{solid++;if(Math.abs(d[n]-d[n+1])>2||Math.abs(d[n+1]-d[n+2])>2)mono=false;}for(let j=0;j<4;j++)hash=Math.imul(hash^d[n+j],16777619);}out={hash:hash>>>0,w:c.width,h:c.height,clear,solid,mono};});return out});if(value)return value;await p.waitForTimeout(300)}throw Error('Print unavailable')}
const original=await print();let hashes=new Set([original.hash]);for(const look of ['c1','c2','c3','c4','c5']){await p.locator('[data-look="'+look+'"]').click();const x=await print();check(engine+' '+look+' print',x.hash!==original.hash&&x.w===original.w&&x.h===original.h&&x.clear===original.clear&&x.solid>0,x);hashes.add(x.hash);}
check(engine+' six distinct looks',hashes.size===6);await p.locator('[data-look="original"]').click();check(engine+' Original restores print',(await print()).hash===original.hash);
await p.locator('#photoLooksWrap').screenshot({path:path.join(out,engine+'-looks.png')});
// Synthetic upload: no customer content used.
const fixture=await p.evaluate(()=>{const c=document.createElement('canvas');c.width=600;c.height=800;const x=c.getContext('2d');x.fillStyle='#e02544';x.fillRect(0,0,300,800);x.fillStyle='#207bba';x.fillRect(300,0,300,800);x.fillStyle='#f9df65';x.fillRect(100,200,400,300);return c.toDataURL().split(',')[1]});
await p.locator('#fileInput').setInputFiles({name:'synthetic-photo.png',mimeType:'image/png',buffer:Buffer.from(fixture,'base64')});await p.waitForFunction(()=>__kp.state.photoImg&&!__kp.state.isLibraryDesign);check(engine+' uploaded photos have no library colorways',!await p.locator('#photoLooksWrap').isVisible());
await p.locator('#clearBtn').click();check(engine+' reset clears variations',!await p.locator('#photoLooksWrap').isVisible()&&await p.locator('.photo-look').count()===0);
// Upload decode completion must not overwrite Reset; use synthetic image bytes only.
await p.evaluate(()=>{window.__nativeBitmap=createImageBitmap;window.createImageBitmap=(...args)=>new Promise(resolve=>{window.__finishDecode=()=>__nativeBitmap(...args).then(resolve);});});
await p.locator('#fileInput').setInputFiles({name:'delayed-photo.png',mimeType:'image/png',buffer:Buffer.from(fixture,'base64')});
await p.waitForFunction(()=>!!window.__finishDecode); // reset has already removed the prior image, so use UI after setting text
await p.locator('#choosePhoto').click();await p.locator('#nameInput').fill('RESET TEST');await p.locator('#clearBtn').click();
await p.evaluate(()=>__finishDecode());await p.waitForTimeout(500);check(engine+' reset cancels late upload',await p.evaluate(()=>!__kp.state.photoImg));
await p.evaluate(()=>{window.createImageBitmap=__nativeBitmap;window.__rejectTestPhoto=true;});
await p.locator('#fileInput').setInputFiles({name:'screening-fixture.png',mimeType:'image/png',buffer:Buffer.from(fixture,'base64')});
await p.waitForFunction(()=>document.querySelector('#kpToast')?.textContent.includes('explicit imagery'));
check(engine+' screening checks uploaded image owner',await p.evaluate(()=>!__kp.state.photoImg&&__kp.state.variant==='original'));await p.evaluate(()=>window.__rejectTestPhoto=false);
// 24MP native decode: create no full-size intermediate canvas in the app.
await p.evaluate(()=>{window.createImageBitmap=async()=>{const c=document.createElement('canvas');c.width=5712;c.height=4284;const x=c.getContext('2d');x.fillStyle='#bd3050';x.fillRect(0,0,c.width,c.height);const bm=await __nativeBitmap(c);c.width=c.height=0;return bm;};});
await p.locator('#fileInput').setInputFiles({name:'24mp-test.png',mimeType:'image/png',buffer:Buffer.from(fixture,'base64')});await p.waitForFunction(()=>__kp.state.photoImg?.width===3072);check(engine+' large decode bounded',await p.evaluate(()=>__kp.state.photoImg.width===3072&&__kp.state.photoImg.height===2304));await p.evaluate(()=>window.createImageBitmap=__nativeBitmap);
const models=JSON.parse(fs.readFileSync(path.join(root,'instore/models.json'))).models.filter(m=>m.active);
for(const m of models){await p.goto(base+'/customizer.html?model='+m.name.toLowerCase().replaceAll(' ','-')+'&design=boho-floral-01.jpg');await p.waitForFunction(()=>window.__kp&&__kp.state.photoImg&&!__kp.state.photoImg.__kpIsThumb);const x=await print();check(engine+' model export '+m.name,x.clear>0&&x.solid>0&&x.w>500&&x.h>1000);}
await p.setViewportSize({width:390,height:844});await p.locator('#photoLooksWrap').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,engine+'-mobile.png')});check(engine+' mobile no overflow',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));check(engine+' no JS errors',errors.length===0,errors);
let pending=[];const fullURL=url=>url.pathname.endsWith('/assets/designs/boho-floral-01.jpg'),thumbURL=url=>url.pathname.endsWith('/assets/designs/thumbs/boho-floral-01.jpg');
await p.route(thumbURL,r=>r.fulfill({status:404,body:''}));await p.route(fullURL,r=>{pending.push(r)});
await p.goto(base+'/customizer.html?model=iphone-16-pro-max&design=boho-floral-01.jpg',{waitUntil:'domcontentloaded'});
await p.waitForFunction(()=>window.__kp&&__kp.state.photoUrl&&__kp.state.photoUrl.endsWith('boho-floral-01.jpg')&&!__kp.state.photoImg);
check(engine+' undecoded image has no looks',await p.locator('.photo-look').count()===0);
while(!pending.length)await p.waitForTimeout(50);await Promise.all(pending.map(r=>r.continue()));
await p.waitForFunction(()=>__kp.state.photoImg&&__kp.state.photoImg.naturalWidth>0);check(engine+' recovered full image builds looks',await p.locator('.photo-look').count()===6);await p.locator('[data-look="c3"]').click();check(engine+' recovered full image exports colorway',(await print()).solid>0);
check(engine+' no errors after recovery',errors.length===0,errors);await b.close();}
fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));server.close();})().catch(e=>{console.error(e);server.close();process.exit(1)});
