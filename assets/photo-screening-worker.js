/* Local image screening runs off the UI thread; pixels never leave this browser. */
importScripts('nsfw/tf.min.js','nsfw/nsfwjs.min.js');
let model,queue=Promise.resolve();
async function classify(job){
  let tensor;
  try{
    if(!model){await tf.setBackend('cpu');await tf.ready();model=await nsfwjs.load(new URL('nsfw/',self.location.href).href,{size:224});}
    tensor=tf.tensor3d(new Uint8Array(job.pixels),[job.height,job.width,3],'int32');
    const predictions=await model.classify(tensor);
    self.postMessage({id:job.id,predictions});
  }catch(error){self.postMessage({id:job.id,error:String(error.message||error)});}
  finally{tensor?.dispose();}
}
self.onmessage=event=>{queue=queue.then(()=>classify(event.data));};
