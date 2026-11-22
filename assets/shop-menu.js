(() => {
 const header=document.querySelector('.home-header,.slate-header,.site-header .bar');
 if(!header)return;
 const start=header.querySelector('.header-cta')||document.createElement('a');
 start.href='customizer.html';start.textContent='Design your case';start.classList.add('ks-start-case');start.setAttribute('aria-label','Design your case — use your photo or choose a print');
 if(!start.isConnected)header.append(start);
 if(typeof document.createElement('dialog').showModal!=='function')return;
 const rows=[
  ['Design your case','Use your own photo or choose a print','customizer.html','assets/home/personal/drawing-clear-case-v2.webp'],
  ['Ocean Photography','Sea turtles, kelp forests and surf','ocean-and-rain.html#ocean-photography','assets/ocean-rain/ocean-photo-turtle-glide.webp'],
  ['Rain After Dark','Rain on glass and glowing streets','ocean-and-rain.html#rain-after-dark','assets/ocean-rain/rain-photo-golden-rain.webp'],
  ['Fresh prints','New nature, golf, liquid and space designs','new-prints.html','assets/new-prints/kp-blueprint-ginkgo.webp'],
  ['Zodiac Creatures','Full animals and figures · five backgrounds','celestial-creatures.html','assets/celestial-patterns/kp-zodiac-creature-leo--original.webp'],
  ['Tarot','The Sun, Moon, Star and Lovers','tarot.html','assets/celestial-patterns/kp-tarot-sun--original.webp'],
  ['Polka dots & lines','Clean patterns, your choice of background','pattern-studio.html','assets/celestial-patterns/kp-dots-cafe-dot--original.webp'],
  ['Original Zodiac','The star-sign collection you know','gallery.html?cat=Zodiac','assets/home/personal/sky-clear-case-v2.webp'],
  ['iPhone cases','Pick your iPhone model','gallery.html?brand=Apple','assets/case-only-previews/iphone-17-pro-max--kp-cherry-dot--original.webp?v=clear-mounted-1'],
  ['Samsung cases','Pick your Galaxy model','gallery.html?brand=Samsung','assets/case-only-previews/galaxy-s26-ultra--kp-sunday-scramble--original.webp?v=clear-mounted-1'],
  ['All phone cases','Browse prints before picking a phone','gallery.html','assets/case-only-previews/iphone-17-pro-max--kp-wrong-way-duck--original.webp?v=clear-mounted-1'],
  ['City After Dark','Find your city · real photography','gallery.html?cat=City%20Scenes','assets/case-only-previews/iphone-15-pro-max--city-night-philadelphia--original.webp?v=clear-mounted-1'],
  ['Earth From Orbit','Deserts and river deltas photographed by satellite','gallery.html?cat=Earth%20From%20Orbit','assets/designs/thumbs/field-photo-yukon-delta-0.jpg'],
  ['Botanical Blueprints','Fine botanical detail and historical cyanotypes','gallery.html?cat=Botanical%20Blueprints','assets/new-prints/kp-blueprint-ginkgo.webp'],
  ['Space Photography','Real telescope and spacecraft observations','gallery.html?cat=Space%20Photography','assets/new-prints/kp-space-bubble.webp'],
  ['Liquid Prism','Sculptural waves and prismatic color','gallery.html?cat=Liquid%20Color','assets/new-prints/kp-liquid-copper-wave.webp'],
  ['Signature Golf','Course maps and Sunday Scramble','signature-golf.html','assets/case-only-previews/galaxy-s26-ultra--kp-golf-pebble-beach--original.webp?v=clear-mounted-1'],
  ['Adventure Collages','Smokies, Everest and Grand Canyon','park-collages.html','assets/celestial-patterns/kp-park-collage-grand-canyon--original.webp'],
  ['National Parks','Illustrations and real park photos','parks-rugged.html','assets/case-only-previews/galaxy-s26-ultra--kp-acadia-bass-harbor--original.webp?v=clear-mounted-1'],
  ['Children’s artwork','Turn their drawing into a case','customizer.html?studio=drawing#personalStudio','assets/home/personal/drawing-clear-case-v2.webp'],
  ['Night sky','Map a special date and place','customizer.html?studio=sky#personalStudio','assets/home/personal/sky-clear-case-v2.webp'],
  ['Seasonal Weather','Rain, frost, autumn and summer prints','seasonal-weather.html','assets/case-only-previews/galaxy-s26-ultra--kp-weather-window-seat--original.webp?v=clear-mounted-1'],
  ['Photo slates','Personalized stone prints','slates.html','assets/photos/slates/yosemite-valley-print.jpg']
 ];
 const trigger=document.createElement('button');trigger.className='ks-menu-toggle';trigger.type='button';trigger.setAttribute('aria-label','Open navigation menu');trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-controls','ks-menu-panel');trigger.setAttribute('aria-expanded','false');trigger.innerHTML='<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 5h20M2 12h20M2 19h20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
 const panel=document.createElement('dialog');panel.id='ks-menu-panel';panel.setAttribute('aria-label','Shop Keepsake');panel.innerHTML='<div class="ks-menu-top"><button type="button" autofocus aria-label="Close navigation menu">×</button><b>KEEPSAKE</b></div><nav aria-label="Shop by category">'+rows.map(([name,sub,href,img])=>'<a href="'+href+'"><img alt="" loading="lazy" decoding="async" width="48" height="48" src="'+img+'"><span><strong>'+name+'</strong><small>'+sub+'</small></span><i aria-hidden="true">›</i></a>').join('')+'</nav><div class="ks-menu-extra"><a href="index.html#stores">Visit a store</a><a href="instore/">In-store browsing</a><a href="gifts.html">Gift guide</a><a href="help.html">Help</a><a href="account.html">Order help</a><a href="checkout.html">In-store pricing</a></div>';
 header.prepend(trigger);header.classList.add('ks-drawer-header');document.body.append(panel);
 let restoreFocus=true;trigger.onclick=()=>{restoreFocus=true;panel.showModal();trigger.setAttribute('aria-expanded','true');document.documentElement.classList.add('ks-menu-open');};
 panel.querySelector('button').onclick=()=>panel.close();panel.addEventListener('click',e=>{const link=e.target.closest('a');if(link)restoreFocus=false;if(link||(e.target===panel&&e.clientX>=panel.getBoundingClientRect().right))panel.close();});
 panel.addEventListener('close',()=>{document.documentElement.classList.remove('ks-menu-open');trigger.setAttribute('aria-expanded','false');if(restoreFocus&&trigger.offsetWidth)trigger.focus({preventScroll:true});});
 matchMedia('(max-width:900px)').addEventListener('change',e=>{if(!e.matches&&panel.open)panel.close()});
})();
