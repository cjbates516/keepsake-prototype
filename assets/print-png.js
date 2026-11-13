/* Preserve print scale in PNG consumers: 300 DPI = 11811 pixels per metre. */
(function(){
  'use strict';
  function crc(bytes){var n=0xffffffff;for(var i=0;i<bytes.length;i++){n^=bytes[i];for(var j=0;j<8;j++)n=(n>>>1)^((n&1)?0xedb88320:0);}return (n^0xffffffff)>>>0;}
  function density(buffer){
    var bytes=new Uint8Array(buffer),view=new DataView(buffer),chunks=[bytes.slice(0,8)],offset=8;
    var chunk=new Uint8Array(21),dv=new DataView(chunk.buffer);dv.setUint32(0,9);chunk.set([112,72,89,115],4);dv.setUint32(8,11811);dv.setUint32(12,11811);chunk[16]=1;dv.setUint32(17,crc(chunk.slice(4,17)));
    while(offset+12<=bytes.length){var size=view.getUint32(offset),end=offset+12+size;if(end>bytes.length)throw Error('Incomplete PNG');var type=String.fromCharCode.apply(null,bytes.slice(offset+4,offset+8));if(type!=='pHYs')chunks.push(bytes.slice(offset,end));if(type==='IHDR')chunks.push(chunk);offset=end;}
    return new Blob(chunks,{type:'image/png'});
  }
  window.KPPrintPng={encode:function(canvas){return new Promise(function(resolve,reject){var pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data,ink=false;for(var i=3;i<pixels.length;i+=4){if(pixels[i]){ink=true;break;}}if(!ink){reject(Error('Print contains no visible artwork. Adjust the image or add a name.'));return;}canvas.toBlob(function(blob){if(!blob){reject(Error('Could not build print PNG'));return;}blob.arrayBuffer().then(density).then(resolve,reject);},'image/png');});}};
})();
