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
  function validAssets(p){return Array.isArray(p.variants)&&p.variants.length===5&&Array.isArray(p.variantHashes)&&p.variantHashes.length===5&&p.variantHashes.every(function(h){return typeof h==='string'&&/^[a-f0-9]{12,64}$/.test(h);});}
  function choicesFor(src){
    var p=profile(src);if(!p)return [choices[0]];if(p.method==='yosemite')return choices;if(!p.colors||p.colors.length!==5||(p.method==='assets'&&!validAssets(p))||(p.hash&&p.preparedHash!==p.hash))return [choices[0]];
    return [choices[0]].concat((p.colors||palettes[p.group]||palettes.bright).map(function(pair,i){return {id:'c'+(i+1),code:i+1,name:pair[0],bg:pair[1]};}).filter(function(c){return p.method!=='assets'||(!src.naturalWidth&&!src.width)||!!(src.__kpVariantImages&&src.__kpVariantImages[c.code-1]);}));
  }
  // Load authored variants together with their source so preview and print use identical art.
  function prepare(src){
    var pf=profile(src);if(!pf||pf.method!=='assets'||!validAssets(pf))return Promise.resolve(src);
    if(src.__kpVariantImages)return Promise.resolve(src);
    if(src.__kpVariantPromise)return src.__kpVariantPromise;
    var small=/\/thumbs\//.test(src.src),base=new URL(src.src.replace('/thumbs/','/'),location.href);
    src.__kpVariantPromise=Promise.all(pf.variants.map(function(file,i){return new Promise(function(resolve){
      var im=new Image(),timer=setTimeout(function(){im.onload=im.onerror=null;im.src='';resolve(null);},12000);
      im.onload=function(){clearTimeout(timer);resolve(im);};im.onerror=function(){clearTimeout(timer);resolve(null);};
      var url=new URL('colorways/'+(small?'thumbs/':'')+file,base);url.searchParams.set('v',pf.variantHashes[i]);im.src=url.href;
    });})).then(function(images){src.__kpVariantImages=images;return src;},function(error){delete src.__kpVariantPromise;throw error;});
    return src.__kpVariantPromise;
  }
  function valid(id){return id==='original'||/^c[1-5]$/.test(id)||choices.some(function(c){return c.id===id;});}
  function rgb(hex){return [parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)];}
  function dominant(src){
    if(src.__kpDominant)return src.__kpDominant;
    var sample=document.createElement('canvas');sample.width=sample.height=96;var cx=sample.getContext('2d',{willReadFrequently:true});cx.drawImage(src,0,0,96,96);
    var p=cx.getImageData(0,0,96,96).data,bins={},transparent=0;
    for(var i=0;i<p.length;i+=4){if(p[i+3]<240){transparent++;continue;}var key=(p[i]>>4)+','+(p[i+1]>>4)+','+(p[i+2]>>4),bin=bins[key]||(bins[key]=[0,0,0,0]);var n=i/4,x=n%96,y=Math.floor(n/96),weight=x<8||x>87||y<8||y>87?3:1;bin[0]+=weight;bin[1]+=p[i]*weight;bin[2]+=p[i+1]*weight;bin[3]+=p[i+2]*weight;}
    var best=Object.keys(bins).reduce(function(a,k){return !a||bins[k][0]>bins[a][0]?k:a;},null),v=best?bins[best]:[1,255,255,255];
    var result={color:[v[1]/v[0],v[2]/v[0],v[3]/v[0]],transparent:transparent/(96*96)>.05};sample.width=sample.height=0;src.__kpDominant=result;return result;
  }
  function paletteCanvas(src,look,maxEdge,pf){
    var iw=src.naturalWidth||src.width,ih=src.naturalHeight||src.height,k=Math.min(1,(maxEdge||2048)/Math.max(iw,ih));
    var cv=document.createElement('canvas');cv.width=Math.max(1,Math.round(iw*k));cv.height=Math.max(1,Math.round(ih*k));var cx=cv.getContext('2d',{willReadFrequently:true});cx.drawImage(src,0,0,cv.width,cv.height);
    var bg=pf.background||dominant(src),target=rgb(look.bg);
    if(bg.transparent){cx.globalCompositeOperation='destination-over';cx.fillStyle=look.bg;cx.fillRect(0,0,cv.width,cv.height);cx.globalCompositeOperation='source-over';}
    else {
      var image=cx.getImageData(0,0,cv.width,cv.height),p=image.data;
      // Only the connected background changes. Enclosed highlights and artwork remain intact.
      var count=cv.width*cv.height,mask=new Uint8Array(count),queue=new Int32Array(count),head=0,tail=0;
      function enqueue(n){if(mask[n])return;var i=n*4,dr=p[i]-bg.color[0],dg=p[i+1]-bg.color[1],db=p[i+2]-bg.color[2];
        if(dr*dr+dg*dg+db*db>2304)return;mask[n]=1;queue[tail++]=n;}
      for(var x=0;x<cv.width;x++){enqueue(x);enqueue(count-cv.width+x);}
      for(var y=0;y<cv.height;y++){enqueue(y*cv.width);enqueue(y*cv.width+cv.width-1);}
      while(head<tail){var n=queue[head++],x=n%cv.width;if(x)enqueue(n-1);if(x<cv.width-1)enqueue(n+1);if(n>=cv.width)enqueue(n-cv.width);if(n<count-cv.width)enqueue(n+cv.width);}
      for(var n=0;n<count;n++){
        var i=n*4,dr=p[i]-bg.color[0],dg=p[i+1]-bg.color[1],db=p[i+2]-bg.color[2];
        // Maps and repeat patterns have many separate background islands; exact color key is opt-in.
        if(!mask[n]&&!(pf.islands&&dr*dr+dg*dg+db*db<576))continue;
        var amount=Math.max(0,Math.min(1,(48-Math.sqrt(dr*dr+dg*dg+db*db))/24));
        p[i]=p[i]*(1-amount)+target[0]*amount;p[i+1]=p[i+1]*(1-amount)+target[1]*amount;p[i+2]=p[i+2]*(1-amount)+target[2]*amount;
      }
      cx.putImageData(image,0,0);
    }
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
  function make(src,id,maxEdge){
    var iw=src.naturalWidth||src.width,ih=src.naturalHeight||src.height;
    if(!iw||!ih||src.complete===false)throw new Error('Artwork is still loading');
    var pf=profile(src),look=choicesFor(src).find(function(c){return c.id===id;})||choices[0];
    if(pf&&pf.method==='assets'&&id&&id!=='original'&&!choicesFor(src).some(function(c){return c.id===id;}))throw new Error('This colorway is unavailable. Choose Original or reconnect.');
    if(pf&&pf.method==='assets'&&look.id!=='original'){
      var variant=src.__kpVariantImages&&src.__kpVariantImages[look.code-1];
      if(!variant)throw new Error('Colorway artwork is still loading');
      var cv=document.createElement('canvas'),scale=Math.min(1,(maxEdge||2048)/Math.max(variant.naturalWidth,variant.naturalHeight));
      cv.width=Math.round(variant.naturalWidth*scale);cv.height=Math.round(variant.naturalHeight*scale);cv.getContext('2d').drawImage(variant,0,0,cv.width,cv.height);return cv;
    }
    if(pf&&pf.method!=='yosemite'&&look.id!=='original'){
      if(pf.method==='framed'){
        var framed=document.createElement('canvas');framed.height=maxEdge||2000;framed.width=Math.round(framed.height/2);
        var fx=framed.getContext('2d'),fw=framed.width,fh=framed.height;
        fx.fillStyle=look.bg;fx.fillRect(0,0,fw,fh);
        var scale=Math.min(fw*.88/iw,fh*.76/ih),dw=iw*scale,dh=ih*scale;
        fx.strokeStyle='rgba(255,255,255,.55)';fx.lineWidth=fw*.003;fx.strokeRect((fw-dw)/2-fw*.015,(fh-dh)/2-fh*.008,dw+fw*.03,dh+fh*.016);
        fx.drawImage(src,(fw-dw)/2,(fh-dh)/2,dw,dh);return framed;
      }
      return paletteCanvas(src,look,maxEdge,pf);
    }
    var isVariant=pf&&pf.method==='yosemite'&&choicesFor(src).some(function(c){return c.id===id;}),cv=document.createElement('canvas');
    var edge=maxEdge||2000;
    if(!isVariant){var k=Math.min(1,edge/Math.max(iw,ih));cv.width=Math.round(iw*k);cv.height=Math.round(ih*k);cv.getContext('2d').drawImage(src,0,0,cv.width,cv.height);}
    else{
      cv.height=edge;cv.width=Math.round(edge/2);var cx=cv.getContext('2d'),w=cv.width,h=cv.height;
      var look=choices.find(function(c){return c.id===id;})||choices[0];background(cx,w,h,look);
      // Yosemite badge: preserve the original sunset, mountains and border pixels.
      var bx=.12*w,by=.34*h,bw=.76*w,bh=bw*(ih*.524)/(iw*.456);
      cx.save();cx.beginPath();cx.moveTo(bx+bw/2,by);cx.lineTo(bx+bw,by+bh*.25);cx.lineTo(bx+bw,by+bh*.75);cx.lineTo(bx+bw/2,by+bh);cx.lineTo(bx,by+bh*.75);cx.lineTo(bx,by+bh*.25);cx.closePath();
      cx.strokeStyle='#fff';cx.lineWidth=w*.009;cx.stroke();cx.clip();cx.drawImage(src,iw*.2715,ih*.1455,iw*.456,ih*.524,bx,by,bw,bh);cx.restore();
      // Keep the exact original lettering, changing ink to white for contrast on dark backgrounds.
      var text=document.createElement('canvas');text.width=Math.round(w*.92);text.height=Math.round(text.width*(ih*.14)/(iw*.64));
      var tx=text.getContext('2d',{willReadFrequently:true});tx.drawImage(src,iw*.18,ih*.713,iw*.64,ih*.14,0,0,text.width,text.height);
      var data=tx.getImageData(0,0,text.width,text.height),p=data.data;
      for(var j=0;j<p.length;j+=4){var alpha=Math.max(0,Math.min(1,(205-Math.max(p[j],p[j+1],p[j+2]))/125));p[j]=id==='original'?6:255;p[j+1]=id==='original'?36:255;p[j+2]=id==='original'?68:255;p[j+3]=Math.round(alpha*255);}
      tx.putImageData(data,0,0);cx.drawImage(text,w*.04,by+bh+h*.025);text.width=text.height=0;
    }
    cv.naturalWidth=cv.width;cv.naturalHeight=cv.height;return cv;
  }
  function source(src,id){
    if(profile(src)&&profile(src).method==='assets'&&id&&id!=='original'&&!choicesFor(src).some(function(c){return c.id===id;}))throw new Error('Selected colorway is unavailable');
    if(!src||!choicesFor(src).some(function(c){return c.id===id;})||!profile(src)||(id==='original'&&profile(src).method!=='yosemite')){clear();return src;}
    var w=src.naturalWidth||src.width,h=src.naturalHeight||src.height;if(!w||!h||src.complete===false)return src;
    var size=w+'x'+h;
    if(cacheSource!==src||cacheId!==id||cacheSize!==size){clear();cacheCanvas=make(src,id);cacheSource=src;cacheId=id;cacheSize=size;}
    return cacheCanvas;
  }
  window.KPDesignColorways={choices:choices,choicesFor:choicesFor,profile:profile,prepare:prepare,valid:valid,make:make,source:source,clear:clear};
})();
