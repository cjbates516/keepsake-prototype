const assert=require('node:assert/strict');
const G=require('../../assets/print-geometry.js');
let seed=27;const rand=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
for(let n=0;n<80;n++){
 const w=5+Math.floor(rand()*20),h=5+Math.floor(rand()*20),r=Math.floor(rand()*6),mask=Uint8Array.from({length:w*h},()=>rand()<.13?1:0),got=G.nearest(mask,w,h,r);
 for(let i=0;i<mask.length;i++){
  let d=Infinity;for(let j=0;j<mask.length;j++)if(mask[j])d=Math.min(d,(i%w-j%w)**2+(Math.floor(i/w)-Math.floor(j/w))**2);
  assert.equal(got[i]>=0,d<=r*r);
  if(got[i]>=0){const j=got[i];assert.equal(mask[j],1);assert.equal((i%w-j%w)**2+(Math.floor(i/w)-Math.floor(j/w))**2,d);}
 }
 const rgba=Uint8ClampedArray.from({length:w*h*4},()=>Math.floor(rand()*256)),original=rgba.slice();G.apply(rgba,{trim:mask,source:got});
 for(let i=0;i<mask.length;i++){const j=got[i];assert.deepEqual(rgba.slice(i*4,i*4+4),j<0?new Uint8ClampedArray(4):original.slice(j*4,j*4+4));}
}
assert.deepEqual(Array.from(G.nearest(new Uint8Array(10),5,2,18)),Array(10).fill(-1));
console.log('PASS 80 independently brute-forced distance fields and bleed pixel identity; empty mask');
// Independent half-pixel mapping: native rectangle x[2,7),y[3,8),
// anisotropic print scale x2,y3, translated stage origin (1,2), bleed2.
const rgba=new Uint8ClampedArray(10*10*4);for(let y=3;y<8;y++)for(let x=2;x<7;x++)rgba[(y*10+x)*4+3]=254;
const map=G.maskMap(rgba,10,10,10,10,{x:1,y:2},{w:18,h:24,x:2,y:3},2);
for(let y=0;y<map.h;y++)for(let x=0;x<map.w;x++)assert.equal(map.trim[y*map.w+x],x>=4&&x<14&&y>=5&&y<20?1:0);
console.log('PASS anisotropic half-pixel mask mapping');
