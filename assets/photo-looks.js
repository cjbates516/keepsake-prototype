/* Local, deterministic color treatments shared by thumbnails, preview and print. */
(function(){
  'use strict';
  var choices=[{id:'original',name:'Original'},{id:'vivid',name:'Vivid'},{id:'warm',name:'Warm'},{id:'cool',name:'Cool'},{id:'mono',name:'Black & white'},{id:'soft',name:'Soft'}];
  var cachedSource=null,cachedId=null,cachedCanvas=null,cachedSize="";
  function valid(id){return choices.some(function(c){return c.id===id;});}
  function make(src,id,maxEdge){
    var w=src.naturalWidth||src.width,h=src.naturalHeight||src.height;
    if(!w||!h||src.complete===false) throw new Error('Image is still loading');
    var scale=Math.min(1,(maxEdge||3072)/Math.max(w,h));
    var cv=document.createElement('canvas');cv.width=Math.max(1,Math.round(w*scale));cv.height=Math.max(1,Math.round(h*scale));
    var cx=cv.getContext('2d',{willReadFrequently:true});cx.drawImage(src,0,0,cv.width,cv.height);
    if(id!=='original'&&valid(id)){
      for(var row=0;row<cv.height;row+=256){
      var image=cx.getImageData(0,row,cv.width,Math.min(256,cv.height-row)),p=image.data;
      for(var i=0;i<p.length;i+=4){
        var r=p[i],g=p[i+1],b=p[i+2],y=.2126*r+.7152*g+.0722*b;
        if(id==='mono'){r=g=b=y;}
        else if(id==='vivid'){r=(y+(r-y)*1.3-128)*1.06+128;g=(y+(g-y)*1.3-128)*1.06+128;b=(y+(b-y)*1.3-128)*1.06+128;}
        else if(id==='warm'){r=r*1.06+6;g=g*1.01+2;b=b*.92;}
        else if(id==='cool'){r=r*.94;g=g*1.01+2;b=b*1.06+5;}
        else if(id==='soft'){r=(y+(r-y)*.8)*.88+24;g=(y+(g-y)*.8)*.88+24;b=(y+(b-y)*.8)*.88+24;}
        p[i]=r;p[i+1]=g;p[i+2]=b; // alpha stays unchanged
      }
      cx.putImageData(image,0,row);
      }
    }
    cv.naturalWidth=cv.width;cv.naturalHeight=cv.height;return cv;
  }
  function clear(){if(cachedCanvas){cachedCanvas.width=0;cachedCanvas.height=0;}cachedSource=null;cachedId=null;cachedCanvas=null;cachedSize="";}
  function source(src,id){
    if(!src||!valid(id)||id==='original'){clear();return src;}
    var w=src.naturalWidth||src.width,h=src.naturalHeight||src.height;
    if(!w||!h||src.complete===false)return src;
    var size=w+'x'+h;
    if(cachedSource!==src||cachedId!==id||cachedSize!==size){clear();cachedCanvas=make(src,id);cachedSource=src;cachedId=id;cachedSize=size;}
    return cachedCanvas;
  }
  window.KPPhotoLooks={choices:choices,valid:valid,make:make,source:source,clear:clear};
})();
