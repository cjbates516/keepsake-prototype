// Keep the chosen background, enlarged preview and studio destination together.
(() => {
 for (const card of document.querySelectorAll('.background-card')) {
  let request=0;
  for (const button of card.querySelectorAll('[data-variant]')) button.addEventListener('click',async()=>{
   const ticket=++request,status=card.querySelector('.background-status');
   status.textContent='Loading '+button.dataset.name+'…';
   try {
    const image=new Image();image.src=button.dataset.preview;await image.decode();
    if(ticket!==request)return;
    const title=card.dataset.title,name=button.dataset.name;
    card.querySelector('.fresh-image img').src=image.src;
    card.querySelector('.fresh-image img').alt=title+' on a frost case · '+name+(name==='Artwork only'?'':' background');
    const old=new URL(card.querySelector('.fresh-customize').href);old.searchParams.set('colorway',button.dataset.variant);const href=old.href;
    for(const link of card.querySelectorAll('.fresh-image,.fresh-customize'))link.href=href;
    card.querySelector('.fresh-image').setAttribute('aria-label','Enlarge '+title+' · '+name);
    for(const b of card.querySelectorAll('[data-variant]'))b.setAttribute('aria-pressed',String(b===button));
    status.textContent='Background: '+name;
   } catch {
    if(ticket===request)status.textContent='Preview could not load. Tap a background to retry.';
   }
  });
 }
})();
