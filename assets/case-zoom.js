/* One viewer for case photographs, rendered case canvases and the homepage artwork. */
window.KPCaseZoom = (() => {
  const dialog = document.createElement('dialog');
  dialog.id = 'caseZoomDialog';
  dialog.setAttribute('aria-labelledby','caseZoomTitle');
  dialog.innerHTML = '<header><strong id="caseZoomTitle"></strong><button type="button" data-close autofocus>Close</button></header><div class="zoom-scroll" tabindex="0" aria-label="Case detail. Scroll to explore."><p role="status"></p></div><footer><button type="button" data-step="-1" aria-label="Zoom out">−</button><output aria-live="polite"></output><button type="button" data-step="1" aria-label="Zoom in">+</button><button type="button" data-action hidden></button></footer>';
  document.body.append(dialog);
  const view=dialog.querySelector('.zoom-scroll'), status=view.querySelector('p'), action=dialog.querySelector('[data-action]');
  const levels=[1,1.5,2,3];
  let level, picture, ratio, generation=0, previousFocus;
  function resize(cx=.5,cy=.5) {
    if (!picture) return;
    const width=Math.min(view.clientWidth,view.clientHeight*ratio)*levels[level];
    picture.style.width=Math.round(width)+'px';
    view.scrollLeft=view.scrollWidth*cx-view.clientWidth/2;
    view.scrollTop=view.scrollHeight*cy-view.clientHeight/2;
    dialog.querySelector('output').value=levels[level]+'×';
    dialog.querySelector('[data-step="-1"]').disabled=level===0;
    dialog.querySelector('[data-step="1"]').disabled=level===levels.length-1;
  }
  function image(url) {
    const im=new Image();
    return new Promise((resolve,reject)=>{im.onload=()=>resolve(im); im.onerror=reject; im.src=url;});
  }
  function trim(canvas) {
    const w=canvas.width,h=canvas.height;
    const pixels=canvas.getContext('2d').getImageData(0,0,w,h).data;
    let left=w,right=-1,top=h,bottom=-1;
    for(let y=0;y<h;y+=4) for(let x=0;x<w;x+=4){
      if(pixels[(y*w+x)*4+3]<24) continue;
      left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=y;
    }
    if(right<left) throw Error('Empty preview');
    left=Math.max(0,left-8);top=Math.max(0,top-8);
    const out=document.createElement('canvas');
    out.width=Math.min(w,right+9)-left;out.height=Math.min(h,bottom+9)-top;
    out.getContext('2d').drawImage(canvas,-left,-top);
    return out;
  }
  async function open({title,source,proceed,label='Customize this case',trigger}) {
    if(dialog.open) return;
    const ticket=++generation;
    picture=null;view.replaceChildren(status);
    previousFocus=trigger||document.activeElement;
    dialog.querySelector('strong').textContent=title||'Case preview';
    status.hidden=false;status.textContent='Loading case preview…';
    action.hidden=!proceed;action.textContent=label;
    action.onclick=()=>{dialog.close();proceed();};
    for(const b of dialog.querySelectorAll('[data-step]')) b.disabled=true;
    dialog.querySelector('output').value='';
    dialog.showModal();
    try {
      const src=await source();
      if(ticket!==generation||!dialog.open)return;
      let ready;
      if(src instanceof HTMLCanvasElement) ready=trim(src);
      else if(src instanceof SVGElement){
        ready=src.cloneNode(true);
        for(const el of ready.querySelectorAll('[id]')){
          const old=el.id;el.id='zoom-'+old;
          for(const ref of ready.querySelectorAll('[clip-path]'))if(ref.getAttribute('clip-path')==='url(#'+old+')')ref.setAttribute('clip-path','url(#'+el.id+')');
        }
      } else if(src instanceof HTMLImageElement && !src.isConnected && src.naturalWidth) ready=src;
      else if(src instanceof HTMLImageElement && !src.getAttribute('src')) throw Error('No image loaded');
      else ready=await image(src.currentSrc||src.src||src);
      if(ticket!==generation||!dialog.open)return;
      picture=ready;
      const bounds=picture.viewBox?.baseVal;
      ratio=(bounds?.width||picture.naturalWidth||picture.width)/(bounds?.height||picture.naturalHeight||picture.height);
      picture.removeAttribute('class');picture.removeAttribute('style');
      picture.setAttribute('role','img');picture.setAttribute('aria-label',title||'Case preview');picture.removeAttribute('aria-hidden');
      // Open with the whole case visible. Magnification is an explicit choice.
      view.append(picture);status.hidden=true;level=0;resize();
    } catch {
      if(ticket===generation&&dialog.open){status.hidden=false;status.textContent='The preview could not load. Close and try again.';}
    }
  }
  dialog.querySelector('[data-close]').onclick=()=>dialog.close();
  dialog.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>{
    const cx=(view.scrollLeft+view.clientWidth/2)/view.scrollWidth,cy=(view.scrollTop+view.clientHeight/2)/view.scrollHeight;
    const focused=document.activeElement===b;
    level+=Number(b.dataset.step);resize(cx,cy);
    if(focused && b.disabled)dialog.querySelector('[data-step]:not(:disabled)').focus();
  });
  dialog.addEventListener('close',()=>{
    if(dialog.open)return;
    generation++;picture?.remove();picture=null;view.replaceChildren(status);
    if(document.activeElement===document.body&&previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
  });
  window.addEventListener('resize',()=>{if(dialog.open)resize();});
  return {open,image};
})();

// Collection lookbooks keep their destination available inside the preview.
document.addEventListener('click',event=>{
  if(event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)return;
  const trigger=event.target.closest('[data-preview-link],.hero-case-zoom,[data-image-zoom]');
  if(!trigger)return;
  const slide=trigger.closest('.case-slide');
  const next=slide ? slide.querySelector('.campaign-shop') : trigger.closest('a');
  const img=trigger.dataset.imageZoom ? document.getElementById(trigger.dataset.imageZoom) : trigger.querySelector('img,svg');
  const title=slide?.querySelector('.campaign-title')?.textContent || trigger.getAttribute('aria-label')?.replace(/^(Customize|Enlarge) /i,'') || trigger.textContent.trim() || img?.alt || 'Case preview';
  const url=trigger.style.backgroundImage.match(/^url\(["']?(.*?)["']?\)$/)?.[1];
  if(!img&&!url)return;
  event.preventDefault();
  const href=next?.href;
  KPCaseZoom.open({title,trigger,source:()=>img||url.replace('assets/designs/thumbs/','assets/designs/'),
    label:trigger.dataset.previewAction||(href?.includes('customizer.html')?'Customize this case':'View collection'),
    proceed:href && !href.endsWith('.webp') ? ()=>location.assign(href) : null});
});
