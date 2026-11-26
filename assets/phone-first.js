/* Ask once before editing; a customer-selected model in a gallery or counter link is kept. */
(() => {
  const entry=new URL(window.KP_ENTRY_URL||location.href), params=entry.searchParams;
  if(params.get('staff')==='1'||!window.KPStudioCore?.phoneModels)return;
  const brands=KPStudioCore.phoneModels();
  const normalize=value=>(value||'').replace(/-/g,' ').replace(/\s+/g,' ').trim().toLowerCase().replace(/^(samsung|google|motorola) /,'').replace(/moto g 5g (2025|2026)$/,'moto g $1');
  if(Object.values(brands).flat().some(model=>normalize(model)===normalize(params.get('model'))))return;
  const kiosk=params.get('kiosk')==='1';
  const back=new URL(kiosk?'instore/':'./',entry);
  if(kiosk&&['West Chester, PA','Pottstown, PA','Newark, DE'].includes(params.get('store')))back.searchParams.set('store',params.get('store'));
  const dialog=document.createElement('dialog');dialog.id='phoneFirst';dialog.setAttribute('aria-labelledby','phoneFirstTitle');
  dialog.innerHTML='<div class="phone-first-shell"><header><a class="phone-first-back">← Back</a><span>Keepsake Printing Co.</span></header><div class="phone-first-intro"><p class="phone-first-eyebrow">LET’S MAKE IT YOURS</p><h1 id="phoneFirstTitle" tabindex="-1">Choose your phone first.</h1><p>Before you upload a photo or design, select the phone this case is for.</p></div><nav class="phone-first-brands" aria-label="Phone brand"></nav><label class="phone-first-search"><span>Find your model</span><input type="search" id="phoneFirstSearch" placeholder="Search all phones…" autocomplete="off" enterkeyhint="search"></label><div class="phone-first-results"><p id="phoneFirstCount" role="status" aria-live="polite"></p><div id="phoneFirstModels"></div><p id="phoneFirstEmpty" hidden>No matching phones. Try the model name, such as “16 Pro” or “Pixel”.</p></div><p class="phone-first-help">Not sure? Check Settings → About on your phone, or ask a team member.</p></div>';
  dialog.querySelector('a').href=back.href;
  const nav=dialog.querySelector('nav'),grid=dialog.querySelector('#phoneFirstModels'),search=dialog.querySelector('input');
  let brand='Apple',series='',choosing=false;
  const seriesFor=KPPhoneSeries.seriesFor;
  const seriesBack=document.createElement('button');seriesBack.type='button';seriesBack.className='phone-first-series-back';seriesBack.textContent='← All series';seriesBack.hidden=true;
  const heading=document.createElement('h2');heading.id='phoneFirstSeriesTitle';heading.tabIndex=-1;
  grid.before(seriesBack,heading);grid.setAttribute('aria-labelledby',heading.id);
  seriesBack.addEventListener('click',()=>{const previous=series;series='';render();Array.from(grid.querySelectorAll('[data-series]')).find(b=>b.dataset.series===previous)?.focus();});
  Object.keys(brands).forEach(name=>{
    const b=document.createElement('button');b.type='button';b.textContent=name;b.dataset.brand=name;
    b.addEventListener('click',()=>{brand=name;series='';search.value='';render();});nav.append(b);
  });
  function render(){
    const query=normalize(search.value),words=query.split(' ').filter(Boolean);
    nav.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(!query&&b.dataset.brand===brand)));
    const models=(query?Object.values(brands).flat():brands[brand]).filter(model=>words.every(word=>model.toLowerCase().includes(word))&&(!series||query||seriesFor(model)===series));
    seriesBack.hidden=!series||!!query;
    heading.textContent=query?'Search results':series?'Choose your '+series.replace(/ series$/,'')+' model.':'Choose your series.';
    grid.replaceChildren();
    if(!query&&!series){
      const groups=[...new Set(models.map(seriesFor))];
      groups.forEach(label=>{
        const button=document.createElement('button');button.type='button';button.dataset.series=label;
        const name=document.createElement('span');name.textContent=label;
        const arrow=document.createElement('span');arrow.textContent='→';arrow.setAttribute('aria-hidden','true');button.append(name,arrow);
        button.addEventListener('click',()=>{series=label;render();heading.focus({preventScroll:true});heading.scrollIntoView({block:'nearest'});});grid.append(button);
      });
    }else models.forEach(model=>{
      const button=document.createElement('button');button.type='button';button.dataset.model=model;
      const name=document.createElement('span');name.textContent=model;
      const arrow=document.createElement('span');arrow.textContent='→';arrow.setAttribute('aria-hidden','true');button.append(name,arrow);
      button.addEventListener('click',()=>{
        if(choosing)return;choosing=true;
        // Use the entry URL, before the compositor can write a default model or finish into it.
        const target=new URL(entry);target.searchParams.set('model',model.toLowerCase().replace(/ /g,'-'));
        // The shared-screen editor retires its session on navigation. Start the chosen
        // phone in a fresh session; never reopen the retired default-model screen.
        if(kiosk)target.searchParams.delete('kioskSession');
        if(!target.searchParams.has('case'))target.searchParams.set('case','rated');
        if(target.searchParams.get('case')==='rated'&&!target.searchParams.has('rim'))target.searchParams.set('rim','Smoke Frost');
        button.setAttribute('aria-busy','true');arrow.textContent='…';location.replace(target.href);
      });grid.append(button);
    });
    dialog.querySelector('#phoneFirstCount').textContent=query?models.length+' matching '+(models.length===1?'phone':'phones'):brand+' · '+models.length+' models';
    dialog.querySelector('#phoneFirstEmpty').hidden=models.length>0;
  }
  search.addEventListener('input',()=>{series='';render();});
  // Escape returns to browsing rather than exposing the editor's unchosen default phone.
  dialog.addEventListener('cancel',event=>{event.preventDefault();location.replace(back.href);});
  document.body.append(dialog);render();document.documentElement.classList.add('phone-first-open');dialog.showModal();
  dialog.querySelector('h1').focus({preventScroll:true});
})();
