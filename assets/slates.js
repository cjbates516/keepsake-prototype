(() => {
  'use strict';
  const $=id=>document.getElementById(id), products=KPSlates.products;
  const params=new URLSearchParams(location.search),kiosk=params.get('kiosk')==='1';
  const stores=['West Chester, PA','Pottstown, PA','Newark, DE'];
  const fixedStore=kiosk&&stores.includes(params.get('store'));
  const counter=$('counter'),button=$('showSelection'),next=$('slateNext'),defaultNext=next.textContent;
  let reviewing=false,exiting=false,deadline=0,timer,warningTimer;
  const selection=()=>products[document.querySelector('input[name="slate"]:checked')?.value];
  const home=new URL('instore/',location.href);
  if(stores.includes(params.get('store')))$('slateStore').value=params.get('store');
  if(fixedStore)$('slateStore').disabled=true;
  function storeHome(){home.searchParams.set('store',$('slateStore').value);return home.href;}
  if(kiosk){
    document.body.classList.add('slate-kiosk');
    document.querySelector('.slate-header').replaceChildren(Object.assign(document.createElement('a'),{href:storeHome(),textContent:'← In-store browsing'}));
    document.querySelectorAll('main a:not([href^="#"])').forEach(a=>{if(!a.closest('figure'))a.hidden=true;});
    document.querySelector('.slate-header a').onclick=e=>{e.currentTarget.href=storeHome();};
    const credits=document.querySelector('.slate-credits');if(credits)document.querySelector('.slate-footer').replaceChildren(credits);
    $('clearSlate').textContent='Start next customer';$('slateExpiry').hidden=false;
    document.querySelector('.slate-handoff-note').textContent='Keep this screen open for our team. The pick code identifies the slate; show these details for your orientation and name.';
  }
  document.addEventListener('click',e=>{
    const link=e.target.closest('a');
    if(!kiosk||!link||!link.closest('figure,.slate-credits,#selectedSlateCredit'))return;
    e.preventDefault();
    const image=link.querySelector('img');$('slateSourceImage').hidden=!image;
    if(image)$('slateSourceImage').src=image.src;else $('slateSourceImage').removeAttribute('src');
    $('slateSourceText').textContent=link.textContent.trim()+' · '+link.href;
    $('slateSourceDialog').showModal();
  });
  $('closeSlateSource').onclick=()=>$('slateSourceDialog').close();
  function render(){
    const item=selection();if(!item)return;
    next.textContent=item.artwork?'Show this code and these details at the counter. Your selected park photograph is included.':defaultNext;
    $('selectedProduct').textContent=item.label;$('slateCode').textContent=item.code;
    $('selectedStore').textContent=$('slateStore').value;
    const amount=document.createElement('strong'),tax=document.createElement('small');amount.textContent='$'+item.price.toFixed(2);tax.textContent=$('slateStore').value==='Newark, DE'?'No sales tax':'Before applicable tax';$('selectedPrice').replaceChildren(amount,document.createTextNode(' '),tax);
    $('selectedOrientation').textContent=item.artwork?'Landscape':$('slateOrientation').selectedOptions[0].textContent;
    $('selectedCaption').textContent=$('slateCaption').value.trim()||'None';
    const image=$('selectedSlatePreview'),choice=document.querySelector('[data-slate-choice="'+Object.keys(products).find(k=>products[k]===item)+'"]');
    const source=choice?.closest('article,section').querySelector('figure img');
    const credit=$('selectedSlateCredit');credit.replaceChildren();const caption=choice?.closest('article,section').querySelector('figcaption');if(caption)credit.append(...Array.from(caption.childNodes,n=>n.cloneNode(true)));credit.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
    image.hidden=!source;if(source)image.src=source.src;else image.removeAttribute('src');
  }
  function choiceChanged(){
    $('slateOrientation').disabled=!!selection()?.artwork;
    if(reviewing)render();
  }
  function showReview(){
    if(!selection())return;
    render();reviewing=true;counter.hidden=false;document.body.classList.add('slate-reviewing');
    window.scrollTo({top:0,behavior:'instant'});$('counterTitle').focus({preventScroll:true});arm();
  }
  function edit(){reviewing=false;counter.hidden=true;document.body.classList.remove('slate-reviewing');$('slateSizesTitle').focus();$('sizes').scrollIntoView({block:'start'});arm();}
  function purge(){
    $('slateCaption').value='';$('slateOrientation').value='staff';
    document.querySelector('input[name="slate"][value="small"]').checked=true;
    $('selectedCaption').textContent='';$('selectedSlateCredit').replaceChildren();counter.hidden=true;reviewing=false;
    for(const id of ['slateIdle','slateClearDialog','slateSourceDialog'])if($(id).open)$(id).close();
    $('selectedSlatePreview').removeAttribute('src');
    document.body.classList.remove('slate-reviewing');
    clearTimeout(timer);clearTimeout(warningTimer);
  }
  function exit(){if(exiting)return;exiting=true;window.KPKioskSession?.retire();const target=storeHome();purge();location.replace(target);}
  function checkExpiry(){if(!kiosk||!deadline||exiting)return;if(Date.now()>=deadline)exit();else{clearTimeout(timer);timer=setTimeout(checkExpiry,deadline-Date.now());}}
  function arm(){
    if(!kiosk||exiting)return;
    clearTimeout(timer);clearTimeout(warningTimer);if($('slateIdle').open)$('slateIdle').close();
    const duration=reviewing?300000:180000;deadline=Date.now()+duration;
    warningTimer=setTimeout(()=>{if(!$('slateIdle').open)$('slateIdle').showModal();},duration-30000);
    timer=setTimeout(checkExpiry,duration);
  }
  document.querySelectorAll('[data-slate-choice]').forEach(choice=>{
    const input=document.querySelector('input[name="slate"][value="'+choice.dataset.slateChoice+'"]');
    if(!input||!products[input.value])return;
    choice.hidden=false;choice.onclick=()=>{input.checked=true;choiceChanged();showReview();};
  });
  document.querySelectorAll('input[name="slate"]').forEach(input=>input.addEventListener('change',choiceChanged));
  button.hidden=false;button.onclick=showReview;$('editSlate').onclick=edit;
  $('clearSlate').onclick=()=>{$('slateClearTitle').textContent=kiosk?'Clear for the next customer?':'Start a new slate?';$('slateClearDialog').showModal();};
  $('cancelSlateClear').onclick=()=>$('slateClearDialog').close();
  $('confirmSlateClear').onclick=()=>{$('slateClearDialog').close();if(kiosk)exit();else{purge();choiceChanged();edit();}};
  $('slateIdle').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();arm();}});
  $('keepSlate').onclick=arm;$('slateIdle').addEventListener('cancel',e=>{e.preventDefault();arm();});
  // No customer file is accepted or sent from this selection page.
  window.addEventListener('pagehide',()=>{if(kiosk){window.KPKioskSession?.retire();document.documentElement.style.visibility='hidden';purge();}});
  window.addEventListener('pageshow',e=>{if(e.persisted){if(kiosk)exit();else choiceChanged();}});
  if(kiosk){
    document.addEventListener('click',e=>{checkExpiry();if(exiting){e.preventDefault();e.stopImmediatePropagation();}},true);
    ['pointerdown','keydown','input','wheel'].forEach(ev=>document.addEventListener(ev,()=>{checkExpiry();if(!exiting&&!$('slateIdle').open)arm();},{passive:true}));
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkExpiry();});window.addEventListener('focus',checkExpiry);arm();
  }
  choiceChanged();
})();
