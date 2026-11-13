/* Display lower print bleed on 17/18 Pro Max mockups only.
   Native trim masks and exported print geometry are never modified. */
(function(){
  var cache=new WeakMap();
  window.KPPreviewEdge={mask:function(source,layout){
    if(!layout||layout.mask!=='view-i17pm.png')return source;
    var w=source.naturalWidth||source.width,h=source.naturalHeight||source.height;
    if(!w||!h||source.complete===false)return source;
    var bottom=layout.box[3],bleed=Math.max(0,Math.round(layout.bleedY));
    var key=layout.box.join(',')+'|'+bleed,entries=cache.get(source);
    if(entries&&entries[key])return entries[key];
    var c=document.createElement('canvas');c.width=w;c.height=h;
    var x=c.getContext('2d');x.drawImage(source,0,0,w,h);
    // Start midway down the straight sides, well above this mask's lower curves.
    // Max alpha preserves antialiasing; source-over stacks would darken the edge.
    var top=Math.floor((layout.box[1]+bottom)/2),left=layout.box[0],width=layout.box[2]-left;
    var from=Math.max(0,top-bleed),height=Math.min(h,bottom+bleed)-from;
    var original=x.getImageData(left,from,width,height),out=x.getImageData(left,from,width,height);
    for(var y=top-from;y<height;y++)for(var col=0;col<width;col++){
      var index=(y*width+col)*4,alpha=original.data[index+3];
      for(var dy=1;dy<=bleed&&dy<=y&&alpha<255;dy++)alpha=Math.max(alpha,original.data[index-dy*width*4+3]);
      out.data[index]=out.data[index+1]=out.data[index+2]=0;out.data[index+3]=alpha;
    }
    x.putImageData(out,left,from);
    if(!entries){entries={};cache.set(source,entries);}entries[key]=c;return c;
  }};
})();
