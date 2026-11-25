(() => {
 const header=document.querySelector('.home-header,.slate-header,.site-header .bar');
 if(!header)return;
 const start=header.querySelector('.header-cta')||document.createElement('a');
 start.href='customizer.html?case=rated&rim=Smoke%20Frost';start.textContent='Design your case';start.classList.add('ks-start-case');start.setAttribute('aria-label','Design your case — use your photo or choose a print');
 if(!start.isConnected)header.append(start);
 if(typeof document.createElement('dialog').showModal!=='function')return;
 const category=(name,cat=name)=>({name,cat,href:'gallery.html?cat='+encodeURIComponent(cat)});
 const groups=[
  {name:'Nature & escape',hint:'Ocean, parks, botanicals & space',items:[category('Ocean Photography'),category('Rain After Dark'),category('National Parks'),category('Botanical Blueprints'),category('Space Photography'),category('Earth From Orbit'),category('Seasonal Weather'),category('Coastal'),category('Scenery'),category('Florals'),category('Birth flowers'),category('Christmas'),category('Halloween')]},
  {name:'Zodiac & meaning',hint:'Star signs, creatures & tarot',items:[category('Zodiac Star Atlas','Zodiac'),category('Zodiac Creatures'),category('Tarot'),category('Celestial')]},
  {name:'Patterns & color',hint:'Dots, stripes, liquid & abstract',items:[category('Polka dots'),category('Stripes & waves'),category('Liquid Prism','Liquid Color'),category('Abstract'),category('Animal print'),category('Gradients & pastels'),category('Bright Pop'),category('Neon Doodles'),category('Paint Party'),category('Clear designs','Clear')]},
  {name:'Everyday favorites',hint:'Animals, fruit, hearts & retro',items:[category('Animals'),category('Fruits'),category('Hearts'),category('Neon Hearts'),category('Cute & kids'),category('Coquette'),category('Retro & Y2K')]},
  {name:'Places & passions',hint:'Cities, golf, sports & outdoors',items:[category('City After Dark','City Scenes'),category('City maps'),category('Hometown'),category('Signature Golf'),category('Sports'),category('Outdoors'),category('Cars'),category('For Him')]},
  {name:'Make it personal',hint:'Your photos, drawings & memories',items:[{name:'Your photo on a case',href:'customizer.html?case=rated&rim=Smoke%20Frost'},{name:'Your child’s drawing',href:'customizer.html?studio=drawing&case=rated&rim=Clear%20Frost'},{name:'The night we met',href:'customizer.html?studio=sky&case=rated&rim=Smoke%20Frost'},{name:'Photo slates',href:'slates.html'}]}
 ];
 const month=new Date().getMonth()+1;
 groups.forEach(g=>g.items=g.items.filter(i=>window.KPSeason?KPSeason.visible({category:i.cat}):i.cat==='Halloween'?month===10:i.cat==='Christmas'?month>=11:true));
 const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const trigger=document.createElement('button');trigger.className='ks-menu-toggle';trigger.type='button';trigger.setAttribute('aria-label','Open navigation menu');trigger.innerHTML='<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 5h20M2 12h20M2 19h20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
 const panel=document.createElement('dialog');panel.id='ks-menu-panel';panel.setAttribute('aria-labelledby','ks-menu-title');
 panel.innerHTML='<div class="ks-menu-top"><h2 id="ks-menu-title">Shop by style</h2><button type="button" autofocus aria-label="Close navigation menu">×</button></div><label class="ks-category-search">Find a category<input type="search" placeholder="Try ocean, golf or zodiac" autocomplete="off"></label><div class="ks-menu-shortcuts"><a href="gallery.html">All cases</a><a href="gallery.html?brand=Apple">iPhone</a><a href="gallery.html?brand=Samsung">Samsung</a><a href="gallery.html?brand=Google">Google Pixel</a><a href="gallery.html?brand=Motorola">Motorola</a><a href="slates.html">Photo slates</a></div><button class="ks-category-back" type="button" hidden>‹ All categories</button><p class="ks-menu-status" role="status"></p><nav class="ks-category-content" aria-label="Case categories"></nav><div class="ks-menu-extra"><a href="new-prints.html">New designs</a><a href="index.html#stores">Visit a store</a><a href="instore/">In-store browsing</a><a href="help.html">Help</a></div>';
 header.prepend(trigger);header.classList.add('ks-drawer-header');document.body.append(panel);
 const rail=document.createElement('nav');rail.className='ks-shop-rail';rail.setAttribute('aria-label','Browse collections');
 rail.innerHTML='<button class="ks-style-trigger" type="button">Shop by style <span aria-hidden="true">⌄</span></button><a href="gallery.html">All cases</a><a href="gallery.html?cat=Ocean%20Photography" class="ks-rail-feature">Ocean</a><a href="gallery.html?cat=National%20Parks" class="ks-rail-feature">Parks</a><a href="gallery.html?cat=Signature%20Golf" class="ks-rail-feature">Golf</a><a href="gallery.html?cat=Zodiac" class="ks-rail-feature">Zodiac</a><a href="slates.html">Photo slates</a>';
 // The editor keeps its own focused step navigation and leave guard.
 if(!document.body.classList.contains('design-editor')&&!location.pathname.endsWith('/customizer.html')){(header.closest('header')||header).after(rail);document.body.classList.add('ks-category-navigation');}
 const triggers=[trigger,rail.querySelector('button')],content=panel.querySelector('.ks-category-content'),search=panel.querySelector('input'),back=panel.querySelector('.ks-category-back'),status=panel.querySelector('[role=status]'),title=panel.querySelector('h2');
 let opener=trigger,restoreFocus=true,selected=null;
 function categoryHref(item){const url=new URL(item.href,location.href);if(url.pathname.endsWith('/gallery.html')&&location.pathname.endsWith('/gallery.html')){const current=new URLSearchParams(location.search);for(const key of ['device','view'])if(current.has(key))url.searchParams.set(key,current.get(key));}return url.pathname.split('/').pop()+url.search+url.hash;}
 function render(focus=false){
  const q=search.value.trim().toLowerCase();back.hidden=selected===null&&!q;title.textContent=selected===null?'Shop by style':groups[selected].name;
  if(q||selected!==null){const items=q?groups.flatMap(g=>g.items.filter(i=>(i.name+' '+(i.cat||'')).toLowerCase().includes(q))):groups[selected].items;content.className='ks-category-content ks-category-links';content.innerHTML=items.map(i=>'<a href="'+escape(categoryHref(i))+'"'+(i.cat?' data-category="'+escape(i.cat)+'"':'')+'>'+escape(i.name)+'<span aria-hidden="true">›</span></a>').join('');status.textContent=q?(items.length?items.length+' matching categories':'No matching category. Try a different word or browse all cases.'):'Choose a collection';}
  else{content.className='ks-category-content ks-category-groups';content.innerHTML=groups.map((g,i)=>'<button type="button" data-group="'+i+'"><strong>'+escape(g.name)+'</strong><small>'+escape(g.hint)+'</small><span aria-hidden="true">›</span></button>').join('');status.textContent='Find your style without scrolling the whole shop.';}
  if(focus){const first=content.querySelector('a,button');(first||search).focus({preventScroll:true});panel.scrollTop=0;}
 }
 function open(from=trigger){opener=from;restoreFocus=true;selected=null;search.value='';render();panel.showModal();triggers.forEach(t=>t.setAttribute('aria-expanded','true'));document.documentElement.classList.add('ks-menu-open');}
 triggers.forEach(t=>{t.setAttribute('aria-haspopup','dialog');t.setAttribute('aria-controls',panel.id);t.setAttribute('aria-expanded','false');t.onclick=()=>open(t);});
 window.KPShopMenu={open};
 panel.querySelector('.ks-menu-top button').onclick=()=>panel.close();
 back.onclick=()=>{selected=null;search.value='';render(true);};search.oninput=()=>{selected=null;render();};
 panel.addEventListener('click',e=>{const group=e.target.closest('[data-group]');if(group){selected=Number(group.dataset.group);render(true);return;}const link=e.target.closest('a');if(link){restoreFocus=false;panel.close();const url=new URL(link.href);if(url.pathname.endsWith('/gallery.html')&&!url.searchParams.has('brand')&&typeof window.KPBrowseStyle==='function'){e.preventDefault();KPBrowseStyle(link.dataset.category||'All');}}else if(e.target===panel){const r=panel.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)panel.close();}});
 panel.addEventListener('close',()=>{document.documentElement.classList.remove('ks-menu-open');triggers.forEach(t=>t.setAttribute('aria-expanded','false'));if(restoreFocus&&opener.isConnected)opener.focus({preventScroll:true});});
 // Keep collection changes on the gallery in place so the chosen phone is retained.
 rail.addEventListener('click',e=>{const a=e.target.closest('a');if(!a||typeof window.KPBrowseStyle!=='function')return;const cat=new URL(a.href).searchParams.get('cat');if(new URL(a.href).pathname.endsWith('/gallery.html')){e.preventDefault();KPBrowseStyle(cat||'All');}});
 render();
})();
