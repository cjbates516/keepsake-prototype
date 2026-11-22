/* Design-specific colorways. Artwork geometry is preserved; backgrounds are composed locally. */
(function(){
  'use strict';
  var yosemite='modern-yosemite-national-park-logo-for-mug.jpg';
  var choices=[{id:'original',code:0,name:'Original',bg:'#dedee3',ink:'#062444'},{id:'black',code:1,name:'Midnight',bg:'#0c0e10'},{id:'charcoal-topo',code:2,name:'Charcoal Topo',bg:'#15171b',line:'#484c52'},{id:'blaze-topo',code:3,name:'Blaze Topo',bg:'#111519',line:'#ce702f'},{id:'granite',code:4,name:'Granite Ridges',bg:'#15191e',line:'#343b43'},{id:'forest-topo',code:5,name:'Forest Topo',bg:'#152c29',line:'#5c8070'}];
  var cacheSource=null,cacheId=null,cacheSize='',cacheCanvas=null;
  var palettes={
    maps:[['Midnight Navy','#172b45'],['Warm Sand','#eadcc7'],['Rose Map','#e7bec5'],['Sage','#acbeb0'],['Charcoal','#262b30']],
    holiday:[['Winter Pine','#244a40'],['Cranberry','#7b2839'],['Snow Cream','#f0e6d5'],['Midnight Blue','#20354e'],['Golden Glow','#d4b66c']],
    spooky:[['Pumpkin','#d78140'],['Plum Night','#49334e'],['Ghost Cream','#eee4d3'],['Midnight','#202128'],['Haunted Sage','#899780']],
    celestial:[['Night Sky','#182641'],['Stardust','#d8bd83'],['Rose Quartz','#d9b3be'],['Lunar Lilac','#bdb6d6'],['Cosmic Black','#202229']],
    outdoors:[['Forest','#294b3c'],['Trail Sand','#d8c7a8'],['Alpine Blue','#536e87'],['Canyon','#b76b4e'],['Midnight','#20282a']],
    floral:[['Petal Pink','#e7bac6'],['Buttercream','#efe1bb'],['Sky Blue','#b7d5e4'],['Sage Garden','#b2c6ae'],['Midnight Bloom','#26334a']],
    bright:[['Cherry Pop','#d94454'],['Butter Yellow','#f2da86'],['Pool Blue','#80c8dc'],['Lilac','#b8a4d7'],['Mint','#9ad1b8']],
    pastel:[['Cream','#eee2c8'],['Blush','#ebc5ce'],['Baby Blue','#bed9e8'],['Soft Sage','#bdd2be'],['Lavender','#d2c2e2']],
    coastal:[['Deep Ocean','#19495e'],['Sea Glass','#96bcb0'],['Sandy Shore','#e5d6b8'],['Coral','#df9b89'],['Cloud Blue','#bed8e3']],
    earth:[['Caramel','#bd9469'],['Sand','#e6d3b1'],['Dusty Rose','#caa3a4'],['Olive','#87966f'],['Ink','#242b30']],
    bold:[['Graphite','#282c33'],['Cobalt','#325aa2'],['Racing Red','#bb3645'],['Stone','#c8c4b9'],['Forest','#2d5543']]
  };
  function profile(src){return src&&(window.KP_COLORWAY_CATALOG||{})[src.__kpDesignFile]||null;}
  // Some collections count the named original as their first colorway.
  function variantCount(p){return p.originalColor ? 4 : 5;}
  function validAssets(p){return Array.isArray(p.variants)&&p.variants.length===variantCount(p)&&Array.isArray(p.variantHashes)&&p.variantHashes.length===variantCount(p)&&p.variantHashes.every(function(h){return typeof h==='string'&&/^[a-f0-9]{12,64}$/.test(h);});}
  const artworkOnly = {id:'artwork-only', code:6, name:'Artwork only', bg:'transparent'};
  function isArtworkOnly(src, id) {
    const p = profile(src);
    if (!p) return false;
    return (p.method === 'yosemite' && id === artworkOnly.id) ||
      (p.clearVariant && id === p.clearVariant) ||
      (id === 'original' && !!p.background?.transparent);
  }
  // Only offer real variants or backgrounds behind transparent artwork. A flattened
  // photograph/pattern has no separate background; a colored mat changes its fit.
  function choicesFor(src){
    var p=profile(src);if(!p)return [choices[0]];if(p.method==='yosemite')return choices.concat(artworkOnly);if(p.backgroundLayout==='inset'||(p.method!=='assets'&&!p.background?.transparent)||!p.colors||p.colors.length!==variantCount(p)||(p.method==='assets'&&!validAssets(p))||(p.hash&&p.preparedHash!==p.hash))return [choices[0]];
    var original=p.originalColor?{id:"original",code:0,name:p.originalColor[0],bg:p.originalColor[1]}:isArtworkOnly(src,'original') ? {id:'original', code:0, name:'Artwork only', bg:'transparent'} : choices[0];
    return [original].concat((p.colors||palettes[p.group]||palettes.bright).map(function(pair,i){return {id:'c'+(i+1),code:i+1,name:pair[0],bg:pair[1]};}).filter(function(c){return p.method!=='assets'||(!src.naturalWidth&&!src.width)||!!(src.__kpVariantImages&&src.__kpVariantImages[c.code-1]);}));
  }
  // Load authored variants together with their source so preview and print use identical art.
  function prepare(src){
    var pf=profile(src);if(!pf||pf.backgroundLayout==='inset'||pf.method!=='assets'||!validAssets(pf))return Promise.resolve(src);
    if(src.__kpVariantImages&&src.__kpVariantImages.every(Boolean))return Promise.resolve(src);
    if(src.__kpVariantPromise)return src.__kpVariantPromise;
    var small=/\/thumbs\//.test(src.src),base=new URL(src.src.replace('/thumbs/','/'),location.href);
    src.__kpVariantPromise=Promise.all(pf.variants.map(function(file,i){
      if(src.__kpVariantImages&&src.__kpVariantImages[i])return src.__kpVariantImages[i];
      return new Promise(function(resolve){
      var im=new Image(),timer=setTimeout(function(){im.onload=im.onerror=null;im.src='';resolve(null);},12000);
      im.onload=function(){clearTimeout(timer);resolve(im);};im.onerror=function(){clearTimeout(timer);resolve(null);};
      var url=new URL('colorways/'+(small?'thumbs/':'')+file,base);url.searchParams.set('v',pf.variantHashes[i]);im.src=url.href;
    });})).then(function(images){src.__kpVariantImages=images;delete src.__kpVariantPromise;return src;},function(error){delete src.__kpVariantPromise;throw error;});
    return src.__kpVariantPromise;
  }
  function valid(id){return id===artworkOnly.id||id==='original'||/^c[1-5]$/.test(id)||choices.some(function(c){return c.id===id;});}
  function paletteCanvas(src,look,maxEdge,pf){
    var iw=src.naturalWidth||src.width,ih=src.naturalHeight||src.height,k=Math.min(1,(maxEdge||2048)/Math.max(iw,ih));
    var cv=document.createElement('canvas');cv.width=Math.max(1,Math.round(iw*k));cv.height=Math.max(1,Math.round(ih*k));var cx=cv.getContext('2d');
    if (pf.background && pf.background.transparent) {
      cx.fillStyle=look.bg;cx.fillRect(0,0,cv.width,cv.height);
    }
    // Draw at the same size and position as Original, above the chosen background.
    cx.drawImage(src,0,0,cv.width,cv.height);
    cv.naturalWidth=cv.width;cv.naturalHeight=cv.height;return cv;
  }
  function clear(){if(cacheCanvas){cacheCanvas.width=cacheCanvas.height=0;}cacheSource=cacheId=cacheCanvas=null;cacheSize='';}
  function background(cx,w,h,look){
    cx.fillStyle=look.bg;cx.fillRect(0,0,w,h);
    if(look.line){
      cx.strokeStyle=look.line;cx.lineWidth=Math.max(.6,w/700);cx.globalAlpha=look.id==='blaze-topo'?.85:.6;
      // Contour lines from one continuous height field: distinct levels never cross.
      var cols=72,rows=144,field=[];
      for(var yy=0;yy<=rows;yy++)for(var xx=0;xx<=cols;xx++){
        var nx=xx/cols,ny=yy/rows;
        field.push(Math.sin(nx*5+Math.sin(ny*5)*.8)+Math.cos(ny*8-nx)*.8+Math.sin((nx+ny)*11)*.16);
      }
      var pairs={1:[[3,0]],2:[[0,1]],3:[[3,1]],4:[[1,2]],5:[[3,0],[1,2]],6:[[0,2]],7:[[3,2]],8:[[2,3]],9:[[0,2]],10:[[0,1],[2,3]],11:[[1,2]],12:[[1,3]],13:[[0,1]],14:[[3,0]]};
      for(var level=-2;level<=2;level+=.13){
        cx.beginPath();
        for(var y=0;y<rows;y++)for(var x=0;x<cols;x++){
          var at=y*(cols+1)+x,v=[field[at],field[at+1],field[at+cols+2],field[at+cols+1]];
          var code=(v[0]>level?1:0)|(v[1]>level?2:0)|(v[2]>level?4:0)|(v[3]>level?8:0);if(!pairs[code])continue;
          var corners=[[x,y],[x+1,y],[x+1,y+1],[x,y+1]];
          function point(edge){var next=(edge+1)%4,t=(level-v[edge])/(v[next]-v[edge]);return [(corners[edge][0]+(corners[next][0]-corners[edge][0])*t)*w/cols,(corners[edge][1]+(corners[next][1]-corners[edge][1])*t)*h/rows];}
          pairs[code].forEach(function(pair){var a=point(pair[0]),b=point(pair[1]);cx.moveTo(a[0],a[1]);cx.lineTo(b[0],b[1]);});
        }
        cx.stroke();
      }
      cx.globalAlpha=1;
    }
    if(look.id==='granite'){
      ['#252d35','#35404a','#47535d'].forEach(function(color,layer){
        cx.fillStyle=color;cx.beginPath();cx.moveTo(0,h);
        for(var i=0;i<=8;i++)cx.lineTo(w*i/8,h*(.76+layer*.065)+Math.sin(i*2.1+layer)*h*.035);
        cx.lineTo(w,h);cx.closePath();cx.fill();
      });
    }
  }
  // Keep the original lettering together beneath the camera, with its paper color extending to the edges.
  function centeredPoster(src, look, profile, maxEdge) {
    const height = maxEdge || 2400;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(height / 2);
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const art = src;
    const width = art.naturalWidth || art.width;
    const artHeight = art.naturalHeight || art.height;
    // Glacier's square source includes a paper border around all four sides.
    const printWidth = Math.min(canvas.width * 1.14, height * 0.70 * width / artHeight);
    const printHeight = printWidth * artHeight / width;
    const x = (canvas.width - printWidth) / 2;
    const y = canvas.height * 0.61 - printHeight / 2;
    ctx.fillStyle = look.id === 'original' ? 'rgb(' + profile.background.color.map(Math.round).join(',') + ')' : look.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(art, x, y, printWidth, printHeight);
    return canvas;
  }
  function make(src,id,maxEdge){
    var iw=src.naturalWidth||src.width,ih=src.naturalHeight||src.height;
    if(!iw||!ih||src.complete===false)throw new Error('Artwork is still loading');
    var pf=profile(src),available=choicesFor(src),look=available.find(function(c){return c.id===id;})||choices[0];
    if(pf&&id&&id!=='original'&&!available.some(function(c){return c.id===id;}))throw new Error('This background is unavailable. Choose Original to keep the artwork full size.');
    if (pf && pf.method === 'palette' && pf.caseLayout === 'centered-poster') return centeredPoster(src, look, pf, maxEdge);
    if(pf&&pf.method==='assets'&&look.id!=='original'){
      var variant=src.__kpVariantImages&&src.__kpVariantImages[look.code-1];
      if(!variant)throw new Error('Colorway artwork is still loading');
      var cv=document.createElement('canvas'),scale=Math.min(1,(maxEdge||2048)/Math.max(variant.naturalWidth,variant.naturalHeight));
      cv.width=Math.round(variant.naturalWidth*scale);cv.height=Math.round(variant.naturalHeight*scale);cv.getContext('2d').drawImage(variant,0,0,cv.width,cv.height);return cv;
    }
    if(pf&&pf.method!=='yosemite'&&look.id!=='original'){
      return paletteCanvas(src,look,maxEdge,pf);
    }
    var isVariant=pf&&pf.method==='yosemite'&&choicesFor(src).some(function(c){return c.id===id;}),cv=document.createElement('canvas');
    var edge=maxEdge||2000;
    if(!isVariant){var k=Math.min(1,edge/Math.max(iw,ih));cv.width=Math.round(iw*k);cv.height=Math.round(ih*k);cv.getContext('2d').drawImage(src,0,0,cv.width,cv.height);}
    else{
      cv.height=edge;cv.width=Math.round(edge/2);var cx=cv.getContext('2d'),w=cv.width,h=cv.height;
      var look=choices.find(function(c){return c.id===id;})||choices[0];if(id!==artworkOnly.id)background(cx,w,h,look);
      // Yosemite badge: preserve the original sunset, mountains and border pixels.
      var bx=.12*w,by=.34*h,bw=.76*w,bh=bw*(ih*.524)/(iw*.456);
      cx.save();cx.beginPath();cx.moveTo(bx+bw/2,by);cx.lineTo(bx+bw,by+bh*.25);cx.lineTo(bx+bw,by+bh*.75);cx.lineTo(bx+bw/2,by+bh);cx.lineTo(bx,by+bh*.75);cx.lineTo(bx,by+bh*.25);cx.closePath();
      cx.strokeStyle='#fff';cx.lineWidth=w*.009;cx.stroke();cx.clip();cx.drawImage(src,iw*.2715,ih*.1455,iw*.456,ih*.524,bx,by,bw,bh);cx.restore();
      // Preserve the navy lettering on every background; a cream backing keeps the title legible.
      var text=document.createElement('canvas');text.width=Math.round(w*((id==='original'||id===artworkOnly.id)?.92:.80));text.height=Math.round(text.width*(ih*.14)/(iw*.64));
      var tx=text.getContext('2d',{willReadFrequently:true});tx.drawImage(src,iw*.18,ih*.713,iw*.64,ih*.14,0,0,text.width,text.height);
      var data=tx.getImageData(0,0,text.width,text.height),p=data.data;
      for(var j=0;j<p.length;j+=4){var alpha=Math.max(0,Math.min(1,(205-Math.max(p[j],p[j+1],p[j+2]))/125));p[j]=6;p[j+1]=36;p[j+2]=68;p[j+3]=Math.round(alpha*255);}
      tx.putImageData(data,0,0);
      var titleY = by + bh + h * .025;
      var titleX = (w - text.width) / 2;
      if (id !== 'original' && id !== artworkOnly.id) {
        var padding = w * .015;
        cx.fillStyle = '#fff5db';
        cx.fillRect(titleX-padding, titleY-padding, text.width+2*padding, text.height+2*padding);
      }
      cx.drawImage(text, titleX, titleY);
      text.width=text.height=0;
    }
    cv.naturalWidth=cv.width;cv.naturalHeight=cv.height;return cv;
  }
  function source(src,id){
    if(profile(src)&&id&&id!=='original'&&!choicesFor(src).some(function(c){return c.id===id;}))throw new Error('Selected colorway is unavailable');
    if(!src||!choicesFor(src).some(function(c){return c.id===id;})||!profile(src)||(id==='original'&&profile(src).method!=='yosemite'&&profile(src).caseLayout!=='centered-poster')){clear();return src;}
    var w=src.naturalWidth||src.width,h=src.naturalHeight||src.height;if(!w||!h||src.complete===false)return src;
    var size=w+'x'+h;
    if(cacheSource!==src||cacheId!==id||cacheSize!==size){clear();cacheCanvas=make(src,id);cacheSource=src;cacheId=id;cacheSize=size;}
    return cacheCanvas;
  }
  window.KPDesignColorways={isArtworkOnly:isArtworkOnly,choices:choices,choicesFor:choicesFor,profile:profile,prepare:prepare,valid:valid,make:make,source:source,clear:clear};
})();
