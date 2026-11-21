(() => {
'use strict';
const $=id=>document.getElementById(id), products=KPSlates.products, params=new URLSearchParams(location.search), kiosk=params.get('kiosk')==='1';
// Locations verified against each store's official CPR location page, November 21, 2026.
const stores=[
 {name:'West Chester, PA',address:'2 N 5 Points Rd · West Chester, PA 19380',lat:39.968813,lng:-75.576385},
 {name:'Pottstown, PA',address:'223 Shoemaker Rd, Suite 137 · Pottstown, PA 19464',lat:40.253029,lng:-75.663094},
 {name:'Newark, DE',address:'2826 Pulaski Hwy · Newark, DE 19702',lat:39.6041805,lng:-75.7687401}
];
const fixedStore=kiosk&&stores.some(s=>s.name===params.get('store'));
let step=0, key='', parkMode=false, bringing=false, photo=null, photoURL='', generation=0, map, markers=[], zipController, zipGeneration=0, deadline=0, timer, warningTimer, exiting=false, adjusting=false, ignoreIdleClose=false;
let base=null, silhouette=null, ink=null;
const sample=new Image(), stone=new Image();sample.src='assets/photos/slates/family-outdoors.jpg';stone.src='assets/photos/slates/supplier-8x10-details.jpg';
const home=()=>{const url=new URL('instore/',location.href);if(fixedStore)url.searchParams.set('store',params.get('store'));return url.href;};
if(stores.some(s=>s.name===params.get('store')))$('slateStore').value=params.get('store');
const selected=()=>products[key];
function credit(target){const node=document.querySelector('[data-slate-choice="'+key+'"]')?.closest('article,section')?.querySelector('figcaption');$(target).replaceChildren();if(node)$(target).append(...Array.from(node.childNodes,n=>n.cloneNode(true)));}
function parkSource(){return document.querySelector('[data-slate-choice="'+key+'"]')?.closest('article,section')?.querySelector('figure img')?.src;}
function updateActions(){
 const item=selected();$('runningTotal').querySelector('strong').textContent=item?'$'+item.price.toFixed(2):'From $29.99';
 $('runningDetail').textContent=item?(key==='bundle'?'Two 4 × 6 slates':item.width+' × '+item.height+' inches'):'Display supports included';
 $('builderSelection').textContent=item?$('runningDetail').textContent:'';
 $('slateForward').hidden=step===3||step===0;$('editSlate').hidden=step!==3;$('clearSlate').hidden=step!==3;$('slateBack').hidden=step===3;
 $('slateForward').textContent=['Choose a size above','Use this store →','Show at the counter →'][step]||'';
 $('slateForward').disabled=step===0||step===1&&!$('slateStore').value||step===2&&!(photo||bringing||item?.artwork);
 document.querySelectorAll('[data-size]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.size===(selected()?.artwork?'large':key))));
 document.querySelectorAll('[data-progress]').forEach(el=>{const n=+el.dataset.progress;el.classList.toggle('complete',n<step);if(n===step)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});
}
function show(n){
 step=n;$('sizes').hidden=false;$('leaveBuilder').hidden=false;document.body.classList.add('slate-building');window.scrollTo(0,0);
 document.querySelectorAll('[data-step]').forEach(el=>el.hidden=+el.dataset.step!==step);
 $('slateSizesTitle').textContent=['Choose your size.','Choose your counter.','Make it your memory.','Ready for our team.'][step];
 document.querySelector('.builder-panels').scrollTop=0;updateActions();$('slateSizesTitle').focus({preventScroll:true});
 if(step===1)requestAnimationFrame(initMap);
 if(step===2){updatePhoto();if(parkMode&&!selected()?.artwork)openParks();}
 if(step===3)review();arm();
}
function chooseSize(value){key=value;parkMode=false;closeParks();show(1);}
document.querySelectorAll('[data-start]').forEach(b=>b.onclick=()=>show(key?step:0));
document.querySelectorAll('[data-size]').forEach(b=>b.onclick=()=>chooseSize(b.dataset.size));
$('startParks').onclick=()=>{key='large';parkMode=true;show(1);};
$('slateForward').onclick=()=>{if(!$('slateForward').disabled)show(step+1);};
$('slateBack').onclick=()=>{if(step)show(step-1);else if(kiosk)$('slateClearDialog').showModal();else leave();};
$('editSlate').onclick=()=>show(2);
function leave(){if(kiosk){exit();return;}document.body.classList.remove('slate-building');$('sizes').hidden=true;$('leaveBuilder').hidden=true;document.querySelector('[data-start]').focus();}
$('leaveBuilder').onclick=()=>{if(kiosk)$('slateClearDialog').showModal();else leave();};
function selectStore(name){if(fixedStore&&name!==params.get('store'))return;$('slateStore').value=name;renderStores();updateActions();markers.forEach((m,i)=>m.setIcon(markerIcon(i)));if(map){const s=stores.find(s=>s.name===name);map.panTo([s.lat,s.lng]);}}
function renderStores(){
 const list=$('slateStoreList'),focused=document.activeElement.closest?.('.store-choice')?.dataset.store;list.replaceChildren();[...stores].sort((a,b)=>(a.distance??0)-(b.distance??0)).forEach(s=>{
 const b=document.createElement('button');b.type='button';b.className='store-choice';b.dataset.store=s.name;b.setAttribute('aria-pressed',String(s.name===$('slateStore').value));b.disabled=!!fixedStore&&s.name!==params.get('store');
 const number=document.createElement('span');number.className='store-number';number.textContent=stores.indexOf(s)+1;
 const label=document.createElement('span'),name=document.createElement('strong'),address=document.createElement('address');name.textContent=s.name;address.textContent=s.address;label.append(name,address);
 const distance=document.createElement('span');distance.className='store-distance';distance.textContent=s.distance===undefined?'':s.distance.toFixed(1)+' mi';b.append(number,label,distance);b.onclick=()=>selectStore(s.name);list.append(b);if(s.name===focused)b.focus({preventScroll:true});
 });
}
function markerIcon(i){return L.divIcon({className:'map-pin'+(stores[i].name===$('slateStore').value?' chosen':''),html:'<span><b>'+(i+1)+'</b></span>',iconSize:[36,42],iconAnchor:[18,42]});}
function initMap(){
 if(!window.L){$('mapNotice').hidden=false;return;}
 if(!map){map=L.map('slateMap',{scrollWheelZoom:false}).setView([39.94,-75.66],9);L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).on('tileerror',()=>{$('mapNotice').hidden=false;}).addTo(map);markers=stores.map((s,i)=>L.marker([s.lat,s.lng],{icon:markerIcon(i),title:s.name,alt:s.name}).addTo(map).on('click',()=>selectStore(s.name)));}
 map.invalidateSize();map.fitBounds(stores.map(s=>[s.lat,s.lng]),{padding:[25,25]});
}
$('allStoresMap').onclick=()=>map?.fitBounds(stores.map(s=>[s.lat,s.lng]),{padding:[25,25]});
$('zipSearch').onsubmit=async e=>{
 e.preventDefault();zipController?.abort();const request=++zipGeneration,zip=$('slateZip').value.trim();
 if(!/^\d{5}$/.test(zip)){$('zipStatus').textContent='Enter a five-digit US ZIP code, or choose a store below.';return;}
 const controller=new AbortController();zipController=controller;const timeout=setTimeout(()=>controller.abort(),8000);$('zipStatus').textContent='Finding your nearest counter…';
 try{const response=await fetch('https://api.zippopotam.us/us/'+zip,{signal:controller.signal,credentials:'omit'});if(!response.ok)throw Error('ZIP');const data=await response.json(),place=data.places?.[0],lat=Number(place?.latitude),lng=Number(place?.longitude);if(!Number.isFinite(lat)||!Number.isFinite(lng))throw Error('ZIP');if(request!==zipGeneration)return;
 const rad=x=>x*Math.PI/180;stores.forEach(s=>{const a=Math.sin(rad(s.lat-lat)/2)**2+Math.cos(rad(lat))*Math.cos(rad(s.lat))*Math.sin(rad(s.lng-lng)/2)**2;s.distance=3958.8*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));});renderStores();$('zipStatus').textContent='Nearest first · Approximate straight-line miles from your ZIP area.';
 }catch{if(request===zipGeneration)$('zipStatus').textContent='Couldn’t find that ZIP right now. Choose any store below.';}finally{clearTimeout(timeout);}
};
// Reconstruct the uninterrupted photographed stone perimeter; only the interior gets ink.
function prepareStone(){
 const c=document.createElement('canvas');c.width=450;c.height=583;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(stone,150,271,450,583,0,0,450,583);base=c;
 const pixels=x.getImageData(0,0,450,583).data,gray=(a,b)=>{const i=(b*450+a)*4;return .299*pixels[i]+.587*pixels[i+1]+.114*pixels[i+2];};
 function edge(count,read){const values=Array.from({length:count},(_,i)=>{for(let j=0;j<18;j++)if(read(i,j)<164)return j;return null;});const known=values.map((v,i)=>v===null?-1:i).filter(i=>i>=0);return values.map((v,i)=>{if(v!==null)return v;let hi=known.find(n=>n>=i)??known.at(-1),lo=[...known].reverse().find(n=>n<=i)??known[0];return lo===hi?values[lo]:values[lo]+(values[hi]-values[lo])*(i-lo)/(hi-lo);}).map((_,i,a)=>{const window=Array.from({length:11},(_,n)=>a[Math.max(0,Math.min(a.length-1,i+n-5))]).sort((a,b)=>a-b);return window[5];});}
 const left=edge(583,(i,j)=>gray(j,i)),right=edge(583,(i,j)=>gray(449-j,i)),top=edge(450,(i,j)=>gray(i,j)),bottom=edge(450,(i,j)=>gray(i,582-j));
 function mask(inner){const m=document.createElement('canvas');m.width=450;m.height=583;const ctx=m.getContext('2d'),d=ctx.createImageData(450,583);for(let y=0;y<583;y++)for(let x=0;x<450;x++){const distance=Math.min(x-left[y],449-x-right[y],y-top[x],582-y-bottom[x]),i=(y*450+x)*4;d.data[i]=d.data[i+1]=d.data[i+2]=255;d.data[i+3]=255*Math.max(0,Math.min(1,inner?(distance-2)/6:distance+1));}ctx.putImageData(d,0,0);return m;}
 silhouette=mask(false);ink=mask(true);drawPreview();
}
function drawPreview(){
 if(!base||!(photo||sample).naturalWidth)return false;
 const canvas=$('slatePreview'),ctx=canvas.getContext('2d'),item=selected()||products.small,portrait=$('slateOrientation').value==='portrait';
 const ratio=portrait?item.width/item.height:item.height/item.width,w=portrait?Math.round(800*ratio):900,h=portrait?800:Math.round(900/ratio);canvas.width=w+70;canvas.height=h+70;
 ctx.fillStyle='#faf8f2';ctx.fillRect(0,0,canvas.width,canvas.height);
 function surface(image,target){target.save();if(portrait)target.drawImage(image,0,0,w,h);else{target.translate(0,h);target.rotate(-Math.PI/2);target.drawImage(image,0,0,h,w);}target.restore();}
 const face=document.createElement('canvas');face.width=w;face.height=h;const f=face.getContext('2d');surface(base,f);
 const layer=document.createElement('canvas');layer.width=w;layer.height=h;const p=layer.getContext('2d'),source=photo||sample,zoom=photo?+$('slatePhotoZoom').value:1,scale=Math.max(w/source.naturalWidth,h/source.naturalHeight)*zoom,dw=source.naturalWidth*scale,dh=source.naturalHeight*scale;
 p.drawImage(source,(w-dw)*(photo?+$('slatePhotoX').value/100:.5),(h-dh)*(photo?+$('slatePhotoY').value/100:.45),dw,dh);
 const caption=$('slateCaption').value.trim();if(caption&&photo){p.fillStyle='#0008';p.fillRect(0,h-90,w,90);p.fillStyle='white';p.textAlign='center';p.font='28px Georgia';p.fillText(caption,w/2,h-34,w-70);}
 p.globalCompositeOperation='destination-in';surface(ink,p);f.drawImage(layer,0,0);f.globalCompositeOperation='destination-in';surface(silhouette,f);ctx.shadowColor='#0003';ctx.shadowBlur=12;ctx.shadowOffsetY=5;ctx.drawImage(face,35,35);
 if(step===3&&!selected()?.artwork){$('selectedSlatePreview').src=canvas.toDataURL('image/jpeg',.9);$('counterPhotoNote').textContent=photo?'Your photo preview · Bring the original file':'Example photo only · We’ll use your own photo';}return true;
}
stone.onload=()=>{prepareStone();if(step===2)updatePhoto();};sample.onload=()=>{drawPreview();if(step===2)updatePhoto();};stone.onerror=sample.onerror=()=>{if(step===2)updatePhoto();if(step===3)review();};if(stone.complete&&stone.naturalWidth)prepareStone();
function updatePhoto(){
 const art=!!selected()?.artwork;$('slatePreview').hidden=art;$('parkPreview').hidden=!art;if(art)$('parkPreview').src=parkSource();
 $('uploadLabel').hidden=kiosk||art;$('slatePhoto').disabled=kiosk;$('bringPhoto').hidden=art||!!photo;$('chooseParkPhoto').hidden=!parkMode;$('slateOrientation').disabled=art;$('slateCaption').disabled=art;if(art)$('slateCaption').value='';
 $('removePhoto').hidden=!photo||art;$('adjustPhoto').hidden=!photo||art;$('cropControls').hidden=!photo||art||!adjusting;$('adjustPhoto').setAttribute('aria-expanded',String(adjusting));$('adjustPhoto').textContent=adjusting?'Done adjusting':'Adjust photo position';$('previewNote').textContent=art?'Selected park photo · Digital slate preview':photo?'Your photo · Digital preview. Final crop confirmed in store.':'Example only · Your own photo will replace this.';
 if(kiosk)$('photoStatus').textContent='Bring your photo on your phone. Our team will help at the counter.';
 $('bringPhoto').textContent=bringing?'✓ Bringing my photo to the counter':'I’ll bring my photo to the counter';
 credit('selectedSlateCredit');const ready=drawPreview();if(!art&&!ready){$('adjustPhoto').hidden=true;$('cropControls').hidden=true;$('slatePreview').hidden=true;$('parkPreview').hidden=false;$('parkPreview').src='assets/photos/slates/family-slate-preview.jpg?v=solid-stone-2';$('previewNote').textContent='Sample slate · Your photo preview is not available yet. Bring the original to our team.';}updateActions();
}
$('adjustPhoto').onclick=()=>{adjusting=!adjusting;updatePhoto();};
function discardPhoto(){adjusting=false;generation++;if(photoURL)URL.revokeObjectURL(photoURL);photoURL='';photo=null;$('slatePhoto').value='';$('slatePhotoZoom').value='1';$('slatePhotoX').value=$('slatePhotoY').value='50';}
$('uploadLabel').onclick=()=>$('slatePhoto').click();
$('slatePhoto').onchange=async()=>{
 const file=$('slatePhoto').files[0];if(!file||kiosk)return;
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>20*1024*1024){$('photoStatus').textContent='Choose a JPG, PNG or WebP under 20 MB. For HEIC, bring the original to our team.';$('slatePhoto').value='';return;}
 const token=++generation,url=URL.createObjectURL(file),image=new Image();image.src=url;$('photoStatus').textContent='Preparing your preview…';
 try{await image.decode();if(token!==generation){URL.revokeObjectURL(url);return;}if(photoURL)URL.revokeObjectURL(photoURL);photoURL=url;photo=image;bringing=false;adjusting=false;parkMode=false;$('photoStatus').textContent=key==='bundle'?'First slate preview. Choose the second photo with our team.':'Your photo stays on this device. Bring the original to the counter.';updatePhoto();}catch{URL.revokeObjectURL(url);if(token===generation){$('slatePhoto').value='';$('photoStatus').textContent='That photo could not be opened. Try another JPG, PNG or WebP.';}}
};
$('removePhoto').onclick=()=>{discardPhoto();bringing=false;$('photoStatus').textContent='Choose another photo, or bring it to the counter.';updatePhoto();};
$('bringPhoto').onclick=()=>{parkMode=false;bringing=true;updatePhoto();show(3);};
['slatePhotoZoom','slatePhotoX','slatePhotoY','slateCaption','slateOrientation'].forEach(id=>$(id).addEventListener('input',drawPreview));
function openParks(){$('photoEditor').hidden=true;$('parkLibrary').hidden=false;$('slateForward').disabled=true;}
function closeParks(){$('photoEditor').hidden=false;$('parkLibrary').hidden=true;updateActions();}
$('chooseParkPhoto').onclick=openParks;$('closeParkLibrary').onclick=()=>{parkMode=!!selected()?.artwork;closeParks();updatePhoto();};
document.querySelectorAll('[data-slate-choice]').forEach(b=>b.onclick=()=>{key=b.dataset.slateChoice;parkMode=true;$('slateOrientation').value='landscape';closeParks();updatePhoto();show(3);});
function review(){
 const item=selected(),store=stores.find(s=>s.name===$('slateStore').value);if(!item||!store){show(!item?0:1);return;}
 $('selectedStore').textContent=store.name;$('counterAddress').textContent=store.address;$('selectedProduct').textContent=item.label;$('slateCode').textContent=item.code;$('selectedOrientation').textContent=item.artwork?'Landscape':$('slateOrientation').selectedOptions[0].textContent;$('selectedCaption').textContent=$('slateCaption').value.trim()||'None';
 const price=document.createElement('strong'),tax=document.createElement('small');price.textContent='$'+item.price.toFixed(2);tax.textContent=store.name==='Newark, DE'?'No sales tax':'Before applicable tax';$('selectedPrice').replaceChildren(price,tax);
 const ready=drawPreview();if(item.artwork)$('selectedSlatePreview').src=parkSource();else if(!ready)$('selectedSlatePreview').src='assets/photos/slates/family-slate-preview.jpg?v=solid-stone-2';
 $('counterPhotoNote').textContent=item.artwork?'Your chosen park photo':photo&&ready?'Your photo preview · Bring the original file':photo?'Example slate · Your chosen photo cannot be previewed. Bring the original.':'Example photo only · We’ll use your own photo';
 $('slateNext').textContent=item.artwork?'Show this screen to our team. Your park photograph is included. We’ll confirm stock and pickup timing.':key==='bundle'?'Bring both original photos. Our team will confirm each crop, stock and pickup timing.':'Bring your original photo and show this screen. Our team will confirm the crop, stock and pickup timing.';credit('counterCredit');
}
function purge(){discardPhoto();zipController?.abort();zipGeneration++;$('photoStatus').textContent=kiosk?'Bring your photo on your phone. Our team will help at the counter.':'Preview it here. Your photo stays on this device.';$('slateCaption').value='';$('slateZip').value='';$('slateOrientation').value='landscape';$('selectedCaption').textContent='';$('selectedSlatePreview').removeAttribute('src');$('slatePreview').width=1000;['selectedSlateCredit','counterCredit'].forEach(id=>$(id).replaceChildren());stores.forEach(s=>delete s.distance);key='';bringing=false;parkMode=false;if(!fixedStore)$('slateStore').value='';['slateIdle','slateClearDialog','slateSourceDialog'].forEach(id=>{if($(id).open)$(id).close();});$('zipStatus').textContent='Three local stores. Choose the one that works for you.';clearTimeout(timer);clearTimeout(warningTimer);renderStores();markers.forEach((m,i)=>m.setIcon(markerIcon(i)));closeParks();}
function exit(){if(exiting)return;exiting=true;const target=home();window.KPKioskSession?.retire();purge();location.replace(target);}
function checkExpiry(){if(!kiosk||!deadline||exiting)return;const left=deadline-Date.now();if(left<=0)exit();else{clearTimeout(timer);timer=setTimeout(checkExpiry,left);}}
function arm(){if(!kiosk||exiting)return;clearTimeout(timer);clearTimeout(warningTimer);if($('slateIdle').open){ignoreIdleClose=true;$('slateIdle').close();}const duration=step===3?300000:180000;deadline=Date.now()+duration;warningTimer=setTimeout(()=>{$('slateIdle').showModal();},duration-30000);timer=setTimeout(checkExpiry,duration);}
$('clearSlate').onclick=()=>$('slateClearDialog').showModal();$('cancelSlateClear').onclick=()=>$('slateClearDialog').close();$('confirmSlateClear').onclick=()=>{if(kiosk)exit();else{purge();show(0);}};$('keepSlate').onclick=arm;$('slateIdle').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();arm();}});$('slateIdle').addEventListener('cancel',e=>{e.preventDefault();arm();});$('slateIdle').addEventListener('close',()=>{if(ignoreIdleClose){ignoreIdleClose=false;return;}if(!exiting)arm();});
$('closeSlateSource').onclick=()=>$('slateSourceDialog').close();
document.addEventListener('click',e=>{const link=e.target.closest('a');if(!kiosk||!link||!link.closest('figure,.slate-credits,#selectedSlateCredit,#counterCredit,.leaflet-control-attribution'))return;e.preventDefault();$('slateSourceText').textContent=link.textContent.trim()+' · '+link.href;$('slateSourceImage').hidden=true;$('slateSourceDialog').showModal();});
document.querySelectorAll('[data-hero]').forEach(b=>b.onclick=()=>{const mode=b.dataset.hero;document.querySelectorAll('[data-hero]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('heroVisual').innerHTML=mode==='front'?'<img src="assets/photos/slates/family-slate-preview.jpg?v=solid-stone-2" alt="Family photo printed on natural slate">':'<svg viewBox="'+(mode==='edge'?'780 220 680 680':'1020 1060 440 395')+'" role="img" aria-label="'+(mode==='edge'?'Natural stone edge close-up':'Included display supports')+'"><defs><clipPath id="heroDetailClip"><rect x="'+(mode==='edge'?'780':'1020')+'" y="'+(mode==='edge'?'220':'1060')+'" width="'+(mode==='edge'?'680':'440')+'" height="'+(mode==='edge'?'680':'395')+'"/></clipPath></defs><image clip-path="url(#heroDetailClip)" href="assets/photos/slates/supplier-8x10-details.jpg" width="1500" height="1500"/></svg>';$('heroImageNote').textContent=mode==='front'?'Photo shown on the actual slate surface · Digital preview':'Supplier photograph · '+(mode==='edge'?'Every stone has its own edge':'Display supports included');});
window.addEventListener('pagehide',()=>{if(kiosk){window.KPKioskSession?.retire();document.documentElement.style.visibility='hidden';purge();}});window.addEventListener('pageshow',e=>{if(e.persisted&&kiosk)exit();});
if(kiosk){document.body.classList.add('slate-kiosk');document.querySelectorAll('.slate-header nav a,.slate-footer>a').forEach(a=>a.hidden=true);document.querySelector('.slate-brand').href=home();document.querySelector('.slate-brand').onclick=e=>{e.preventDefault();$('slateClearDialog').showModal();};document.querySelectorAll('.slate-footer').forEach(el=>Array.from(el.childNodes).filter(n=>n.nodeType===3&&n.textContent.trim()==='·').forEach(n=>n.textContent=''));$('clearSlate').textContent='Start next customer';$('slateClearTitle').textContent='Clear for the next customer?';$('slateExpiry').hidden=false;$('slatePhoto').disabled=true;$('zipSearch').hidden=!!fixedStore;if(fixedStore)$('zipStatus').textContent='You’re creating at '+params.get('store')+'.';document.addEventListener('click',e=>{checkExpiry();if(exiting){e.preventDefault();e.stopImmediatePropagation();}},true);['pointerdown','keydown','input','wheel'].forEach(type=>document.addEventListener(type,()=>{checkExpiry();if(!exiting&&!$('slateIdle').open)arm();},{passive:true}));document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkExpiry();});window.addEventListener('focus',checkExpiry);arm();}
renderStores();updateActions();function routeHash(){const hash=location.hash.slice(1);if(products[hash]?.artwork){key=hash;parkMode=true;show(1);}else if(hash==='sizes'||hash==='park-slates'){if(hash==='park-slates'){key='large';parkMode=true;show(1);}else show(0);}}window.addEventListener('hashchange',routeHash);routeHash();
})();
