/* One reusable worker, serialized jobs and small transferable RGB samples. */
(()=>{
  const url=new URL('photo-screening-worker.js',document.currentScript.src);
  let worker=null,seq=0;const jobs=new Map();
  function dispose(){worker?.terminate();worker=null;for(const job of jobs.values()){clearTimeout(job.timer);job.reject(new Error('Photo screening stopped'));}jobs.clear();}
  function classify(image){return new Promise((resolve,reject)=>{
    if(!worker){try{worker=new Worker(url);worker.onmessage=({data})=>{const job=jobs.get(data.id);if(!job)return;jobs.delete(data.id);clearTimeout(job.timer);data.error?job.reject(new Error(data.error)):job.resolve(data.predictions);};worker.onerror=dispose;}catch(error){reject(error);return;}}
    const sample=document.createElement('canvas');sample.width=sample.height=224;
    try{
      const ctx=sample.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,224,224);
      const rgba=ctx.getImageData(0,0,224,224).data,rgb=new Uint8Array(224*224*3);
      for(let a=0,b=0;a<rgba.length;a+=4){rgb[b++]=rgba[a];rgb[b++]=rgba[a+1];rgb[b++]=rgba[a+2];}
      const id=++seq,timer=setTimeout(()=>{jobs.delete(id);reject(new Error('Photo screening timed out'));},90000);
      jobs.set(id,{resolve,reject,timer});worker.postMessage({id,pixels:rgb.buffer,width:224,height:224},[rgb.buffer]);
    }catch(error){reject(error);}finally{sample.width=sample.height=0;}
  });}
  window.KPPhotoScreen={classify,dispose};
})();
