/* Physical artwork coordinates and deterministic binary print masks.
   No phone geometry is invented here: every mask uses the existing kit. */
(function(root){
  'use strict';
  function metrics(tpl,fit){
    var w=tpl.pxW||Math.round(tpl.w*300/72),h=tpl.pxH||Math.round(tpl.h*300/72);
    var x=w/tpl.w/fit.sx,y=h/tpl.h/fit.sy;
    return {w:w,h:h,x:x,y:y,rx:y/x};
  }
  function bounds(data,w,h){
    var x0=w,y0=h,x1=-1,y1=-1;
    for(var y=0;y<h;y++)for(var x=0;x<w;x++)if(data[(y*w+x)*4+3]>=128){
      if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;
    }
    return x1<0?null:{x:x0,y:y0,w:x1-x0+1,h:y1-y0+1};
  }
  /* Exact squared Euclidean distance transform. Horizontal nearest seeds,
     then the lower envelope of vertical parabolas. Ties are deterministic. */
  function nearest(mask,w,h,radius){
    var rowX=new Int32Array(w*h),dist=new Float64Array(w*h),result=new Int32Array(w*h);
    rowX.fill(-1);result.fill(-1);
    for(var y=0;y<h;y++){
      var last=-1,base=y*w;
      for(var x=0;x<w;x++){if(mask[base+x])last=x;rowX[base+x]=last;}
      last=-1;
      for(var x=w-1;x>=0;x--){
        if(mask[base+x])last=x;
        var left=rowX[base+x];
        if(last>=0&&(left<0||last-x<x-left))rowX[base+x]=last;
        var dx=x-rowX[base+x];dist[base+x]=rowX[base+x]<0?Infinity:dx*dx;
      }
    }
    var v=new Int32Array(h),z=new Float64Array(h+1),r2=radius*radius;
    for(var x=0;x<w;x++){
      var k=-1;
      for(var q=0;q<h;q++){
        var fq=dist[q*w+x];if(!Number.isFinite(fq))continue;
        var s=-Infinity;
        while(k>=0){var p=v[k];s=((fq+q*q)-(dist[p*w+x]+p*p))/(2*(q-p));if(s>z[k])break;k--;}
        k++;v[k]=q;z[k]=k===0?-Infinity:s;z[k+1]=Infinity;
      }
      if(k<0)continue;
      var j=0;
      for(var y=0;y<h;y++){
        while(j<k&&z[j+1]<y)j++;
        var sy=v[j],d=dist[sy*w+x]+(y-sy)*(y-sy);
        if(d<=r2)result[y*w+x]=sy*w+rowX[sy*w+x];
      }
    }
    return result;
  }
  /* Sample pixel centers directly, avoiding browser-specific canvas downsampling. */
  function maskMap(rgba,sw,sh,stageW,stageH,fit,m,bleed){
    var w=m.w+2*bleed,h=m.h+2*bleed,mask=new Uint8Array(w*h);
    for(var y=0;y<h;y++){
      var sy=Math.floor(((y+.5-bleed)/m.y+fit.y)*sh/stageH);
      if(sy<0||sy>=sh)continue;
      for(var x=0;x<w;x++){
        var sx=Math.floor(((x+.5-bleed)/m.x+fit.x)*sw/stageW);
        if(sx>=0&&sx<sw&&rgba[(sy*sw+sx)*4+3]>=128)mask[y*w+x]=1;
      }
    }
    return {w:w,h:h,trim:mask,source:nearest(mask,w,h,bleed)};
  }
  /* Copy edge pixels only into the bleed ring. Interior artwork is never scaled
     or moved. Alpha in photos/names is retained; the mask itself is binary. */
  function apply(data,map){
    var original=new Uint8ClampedArray(data);
    for(var p=0;p<map.source.length;p++){
      var src=map.source[p],i=p*4;
      if(src<0){data[i]=data[i+1]=data[i+2]=data[i+3]=0;continue;}
      if(map.trim[p])continue;
      var s=src*4;data[i]=original[s];data[i+1]=original[s+1];data[i+2]=original[s+2];data[i+3]=original[s+3];
    }
    return data;
  }
  var api={metrics:metrics,bounds:bounds,nearest:nearest,maskMap:maskMap,apply:apply};
  root.KPPrintGeometry=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
