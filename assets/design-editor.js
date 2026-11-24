/* Dedicated touch editor; all artwork and print rendering stays in customizer.html. */
(() => {
  if (!window.KP_EDITOR || !window.KPStudioCore) return;
  const core=KPStudioCore, $=id=>document.getElementById(id), params=new URLSearchParams(location.search);
  const sessionId=Date.now().toString(36)+Math.random().toString(36).slice(2);
  const kiosk=params.get('kiosk')==='1', mobile=matchMedia('(max-width:760px)');
  const fixedStore=kiosk&&params.get('storeMode')!=='choose'&&window.KPAccessories?.stores.includes(params.get('store'));
  function collectionReturn(){try{const u=new URL(params.get('back')||'',location.href),folder=new URL('.',location.href);if(u.origin!==folder.origin||!['gallery.html','parks-rugged.html','park-collages.html','new-prints.html','signature-golf.html','ocean-and-rain.html','seasonal-weather.html'].some(name=>u.pathname===folder.pathname+name))return null;const safe=new URL(u.pathname,location.origin);if(u.pathname.endsWith('/gallery.html'))for(const key of ['cat','q','color','state','all','n'])if(u.searchParams.has(key))safe.searchParams.set(key,u.searchParams.get(key));if(/^#[a-z0-9-]+$/.test(u.hash))safe.hash=u.hash;return safe;}catch{return null;}}
  // Arm privacy protection before constructing any editor UI. Deadlines survive device sleep.
  let idleTimer,warningTimer,warning=null,expiresAt=0,exiting=false,leaving=false;
  function arm(){if(exiting||leaving)return;const duration=$('counterReview')?.open?300000:180000;clearTimeout(idleTimer);clearTimeout(warningTimer);expiresAt=Date.now()+duration;if(warning?.open)warning.close();warningTimer=setTimeout(()=>warning?.showModal(),duration-30000);idleTimer=setTimeout(checkExpiry,duration);}
  function checkExpiry(){if(!expiresAt||exiting||leaving)return;if(Date.now()>=expiresAt)exit();else{clearTimeout(idleTimer);idleTimer=setTimeout(checkExpiry,expiresAt-Date.now());}}
  if(kiosk){
    document.addEventListener('click',e=>{if(exiting||leaving){e.preventDefault();e.stopImmediatePropagation();}},true);
    arm();['pointerdown','keydown','input','wheel'].forEach(ev=>document.addEventListener(ev,()=>{checkExpiry();if(!exiting&&!warning?.open)arm();},{passive:true}));
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkExpiry();});window.addEventListener('focus',checkExpiry);document.addEventListener('resume',checkExpiry);
    window.addEventListener('pagehide',()=>{window.KPKioskSession?.retire();leaving=true;document.documentElement.style.visibility='hidden';clearTimeout(idleTimer);clearTimeout(warningTimer);core.purge();});
    window.addEventListener('pageshow',e=>{if(e.persisted){exiting=false;exit();}else checkExpiry();});
  }
  const rail=document.querySelector('.design-rail'), frame=$('main').firstElementChild, grid=rail.parentElement;
  const stage=$('stageStick'),stageHome=document.createComment('Studio case position');stage.before(stageHome);
  const name=$('nameInput').parentElement, finish=$('colorSwatches').parentElement;
  const legacy=document.createElement('div');legacy.hidden=true;legacy.id='studioLegacy';
  while(rail.firstChild)legacy.append(rail.firstChild);rail.append(legacy);
  document.body.classList.add('design-editor');if(kiosk)document.body.classList.add('studio-kiosk');
  frame.id='studioFrame';grid.id='studioGrid';
  const top=document.createElement('div');top.className='studio-top';
  top.innerHTML='<div><a id="studioBrowse">← Designs</a><h1>Make it yours.</h1><p id="studioPhone"></p></div><div class="studio-history"><button id="studioUndo" type="button" aria-label="Undo last design change">↶ Undo</button><button id="studioRedo" type="button" aria-label="Redo design change">↷ Redo</button></div><ol class="studio-steps" aria-label="Design progress"><li data-step="edit">1 <span>Design</span></li><li data-step="preview">2 <span>Preview</span></li><li data-step="setup">3 <span>Extras</span></li></ol>';
  frame.prepend(top);
  const tray=document.createElement('div');tray.className='studio-tools';tray.setAttribute('role','group');tray.setAttribute('aria-label','Design tools');rail.append(tray);
  const host=document.createElement('div');host.className='studio-tool-host';rail.append(host);
  const sheet=document.createElement('dialog');sheet.id='studioSheet';sheet.setAttribute('aria-labelledby','studioSheetTitle');
  sheet.innerHTML='<div class="studio-sheet-head"><h2 id="studioSheetTitle"></h2><button id="studioDone" type="button">Done</button></div><div class="studio-sheet-body"></div>';
  document.body.append(sheet);const sheetBody=sheet.querySelector('.studio-sheet-body');
  const panels={},buttons={},icons={phone:'▯',background:'◒',name:'Aa',adjust:'⤢',photo:'▧',sky:'✧',layouts:'▦',words:'Aa+'};
  function panel(id,title,description){
    const p=document.createElement('section');p.className='studio-panel';p.id='studio-'+id;p.hidden=true;
    const h=document.createElement('h2');h.textContent=title;p.append(h);
    if(description){const t=document.createElement('p');t.className='studio-help';t.textContent=description;p.append(t);}
    host.append(p);panels[id]=p;
    const b=document.createElement('button');b.type='button';b.dataset.tool=id;b.setAttribute('aria-controls',p.id);b.setAttribute('aria-expanded','false');
    b.innerHTML='<span aria-hidden="true">'+icons[id]+'</span><strong>'+title+'</strong>';tray.append(b);buttons[id]=b;return p;
  }
  function move(p,...ids){ids.forEach(id=>{const el=typeof id==='string'?$(id):id;if(el)p.append(el);});}
  // Phone copy follows the phone (sync): with a Rated kit it names both cases, a Rated only phone names its one case, otherwise it keeps the clear case copy.
  const phoneCopy={clear:'Choose your model and phone finish. Your case stays clear; screen colors are approximate.',rated:'Choose your phone model, finish and case. The preview updates to show your choices.',
    only:'Choose your phone model and rim color. This phone comes in the Rated Case.',onlyOne:'Choose your phone model. This phone comes in the Rated Case.'};
  move(panel('phone','Phone',phoneCopy.clear),'kpSelRow',finish);
  move(panel('background','Background','Keep the artwork you love. Change only its background.'),'photoLooksWrap');
  const noBackground=document.createElement('p');noBackground.id='studioNoBackground';noBackground.textContent='Background choices appear once your design is ready.';panels.background.append(noBackground);
  move(panel('name','Name','Add a name, initials, or a little something that is you.'),name);
  move(panel('adjust','Adjust','Check important details stay clear of the camera and edges.'),'editTools');
  const adjustments=document.createElement('div');adjustments.id='studioAdjustments';
  adjustments.innerHTML='<button type="button" id="studioCenter">Center & reset size</button>'+[['scale','Size',.35,4,.01],['px','Left / right',-900,900,10],['py','Up / down',-1200,1200,10],['rot','Rotation',-180,180,1]].map(([key,label,min,max,step])=>'<label>'+label+'<input type="range" aria-label="Artwork '+label.toLowerCase()+'" data-adjust="'+key+'" min="'+min+'" max="'+max+'" step="'+step+'"></label>').join('');panels.adjust.append(adjustments);
  const adjustNote=document.createElement('p');adjustNote.textContent=kiosk?'Choose a design to adjust its placement.':'Add a photo or choose a design to adjust its placement.';panels.adjust.append(adjustNote);
  const info=core.info(),initialSnapshot=core.snapshot();
  if(info.drawing)top.querySelector('h1').textContent=kiosk?'Plan your drawing case.':'Their drawing, your case.';
  if(info.sky)top.querySelector('h1').textContent='Your special night.';
  if(info.sky){move(panel('sky','Night sky','Create a sky for your date and place.'),'personalStudio');buttons.background.hidden=true;buttons.adjust.hidden=true;buttons.name.hidden=true;tray.prepend(buttons.sky);}
  else {
    const photoPanel=panel('photo',info.drawing?'Drawing':kiosk?'Photo help':'Photo',info.drawing&&kiosk?'':kiosk?'Want to use your own photo or drawing? Ask our team at the counter.':'Choose an original, full-size image.');
    if(info.drawing){move(photoPanel,'personalStudio');tray.prepend(buttons.photo);}
    // slotButtons: one button per layout spot (add or swap any spot without tapping the case)
    if(!kiosk)move(photoPanel,'uploadBtn','fileInput','slotButtons','photoPrivacy','clearBtn');
    // the photo credit moves under the case below (web) or stays in this tool (kiosk), see creditBox
    move(photoPanel,'browseLink');
    if(kiosk){$('fileInput').disabled=true;$('choosePhoto').disabled=true;$('browseLink').hidden=true;}
  }
  // Keepsake layouts: one photo, a collage, or a words template, for the customer photo path only. Shared kiosks keep
  // personal photos staff assisted, so they get no Layouts (staff=1 keeps the classic rail picker). Words replaces Name
  // while a words template is active. Visibility follows the live layout state in sync(); layouts never enter history.
  let layoutAdd=null,layoutsWait=null,layoutsRetry=null,layoutSpare=null;
  if(!kiosk&&!info.sky&&!info.drawing){
    const layouts=panels.photo;move(layouts,'layoutChipsWrap');
    layoutsWait=document.createElement('p');layoutsWait.className='studio-help';layoutsWait.id='studioLayoutsWait';layoutsWait.textContent='Loading layouts…';layouts.append(layoutsWait);
    // A failed templates request says so and offers Try again; the add button works without templates (single photo).
    layoutsRetry=document.createElement('button');layoutsRetry.type='button';layoutsRetry.id='studioLayoutsRetry';layoutsRetry.textContent='Try again';layoutsRetry.hidden=true;layoutsRetry.onclick=()=>{core.loadLayouts?.();sync();};layouts.append(layoutsRetry);
    layoutSpare=document.createElement('p');layoutSpare.className='studio-help';layoutSpare.id='studioLayoutSpare';layoutSpare.hidden=true;layouts.append(layoutSpare);
    layoutAdd=document.createElement('button');layoutAdd.type='button';layoutAdd.id='studioLayoutAdd';layoutAdd.onclick=()=>$('uploadBtn').click();layouts.append(layoutAdd);
    layoutAdd.hidden=true;
    move(panel('words','Words','Printed in this layout’s lettering. Clear a box to leave those words off.'),'captionFields');
    buttons.name.after(buttons.words);buttons.words.hidden=true;
  }
  // The desktop tool on entering (or returning to) Design: the last tool the customer opened while it is still offered
  // (lastTool, set in openTool), else the first tool for this path: Night sky, Drawing, Layouts (photo path), Background, or Phone for original-only designs.
  const home=()=>lastTool&&panels[lastTool]&&!buttons[lastTool].hidden?lastTool:info.sky?'sky':info.drawing?'photo':panels.photo&&!core.info().library?'photo':buttons.background.hidden?'phone':'background';
  const preview=document.createElement('section');preview.id='studioPreview';preview.hidden=true;
  preview.innerHTML='<p class="studio-kicker">ONE LAST LOOK</p><h2>Your design, on your case.</h2><p>Check the spelling, placement and camera area. Tap the case to see every detail.</p><p id="studioPartial" class="studio-partial" role="status" hidden></p><dl id="studioReviewDetails"></dl><button type="button" id="studioEditAgain">Keep editing</button><p class="studio-help">Digital preview. Our team checks your case and artwork before printing.</p>';rail.append(preview);
  const setup=document.createElement('section');setup.id='studioSetup';setup.hidden=true;setup.innerHTML='<p class="studio-kicker">THE FINISHING TOUCHES</p><h2>Complete your setup.</h2><p>Optional extras. Everything is confirmed and paid for in store.</p>';rail.append(setup);
  move(setup,'retailAddons','promoReveal','promoRow','promoMsg','retailPickup');
  const storeChoice=$('storeChips').parentElement;
  let storePicker=null,storeLabel=null;
  if(!fixedStore){
    storePicker=document.createElement('details');storePicker.id='studioStorePicker';
    const summary=document.createElement('summary');storeLabel=document.createElement('strong');
    const change=document.createElement('span');change.textContent='Change store';summary.append(storeLabel,change);
    storePicker.append(summary,storeChoice);setup.insertBefore(storePicker,$('retailAddons'));
    $('storeChips').addEventListener('click',e=>{if(e.target.closest('[data-s]')){storePicker.open=false;summary.focus({preventScroll:true});}});
  }else setup.insertBefore(storeChoice,$('retailAddons'));
  const editSetup=document.createElement('button');editSetup.id='studioSetupEdit';editSetup.type='button';editSetup.textContent='Edit your case';setup.insertBefore(editSetup,storePicker||storeChoice);editSetup.onclick=returnToDesign;
  if(fixedStore){$('storeChips').querySelectorAll('button').forEach(b=>{b.disabled=true;b.hidden=b.dataset.s!==params.get('store');});}
  // Keep Extras in one screen; browse the full catalog in a focused, dismissible picker.
  const accessoryDialog=document.createElement('dialog');accessoryDialog.id='studioAccessoryDialog';accessoryDialog.setAttribute('aria-labelledby','studioAccessoryTitle');
  accessoryDialog.innerHTML='<header><h2 id="studioAccessoryTitle">Chargers & accessories</h2><button type="button" id="studioAccessoryDone">Done</button></header><div class="studio-accessory-body"></div>';
  document.body.append(accessoryDialog);
  const accessoryBody=accessoryDialog.querySelector('.studio-accessory-body'),accessoryHost=$('accessoryPicker');
  const helpLabel=$('chargerHelp').closest('label'),helpNote=helpLabel.nextElementSibling;
  accessoryBody.append(helpLabel,helpNote,accessoryHost);
  const accessoryOpen=document.createElement('button');accessoryOpen.id='studioAccessoryOpen';accessoryOpen.type='button';accessoryOpen.textContent='Choose a charger or accessory →';accessoryOpen.setAttribute('aria-haspopup','dialog');accessoryOpen.setAttribute('aria-expanded','false');
  const accessorySummary=document.createElement('div');accessorySummary.id='studioAccessorySummary';accessorySummary.setAttribute('aria-live','polite');
  $('retailAddons').append(accessoryOpen,accessorySummary);
  let accessoryClosing=false;
  accessoryOpen.onclick=()=>{if(accessoryDialog.open||accessoryClosing)return;if(!core.info().store){if(storePicker){storePicker.open=true;storePicker.querySelector('summary').focus();}return;}history.pushState({...history.state,kpStudioAccessory:true},'');accessoryDialog.showModal();accessoryOpen.setAttribute('aria-expanded','true');accessoryBody.scrollTop=0;};
  function closeAccessories(){if(accessoryDialog.open)accessoryDialog.close();}
  $('studioAccessoryDone').onclick=closeAccessories;accessoryDialog.addEventListener('cancel',e=>{e.preventDefault();closeAccessories();});
  accessoryDialog.addEventListener('close',()=>{if(!purged&&history.state?.kpStudioAccessory&&!accessoryClosing){accessoryClosing=true;history.back();}accessoryOpen.setAttribute('aria-expanded','false');if(!purged&&step==='setup')accessoryOpen.focus({preventScroll:true});});
  let accessorySummaryKey='';
  function syncAccessorySummary(i){
    const rows=[...accessoryHost.querySelectorAll('.ka-selected>div')],key=rows.map(r=>r.textContent).join('|')+'|'+$('chargerHelp').checked;
    accessoryOpen.disabled=!i.store;accessoryOpen.textContent=rows.length?'Change chargers & accessories →':'Choose a charger or accessory →';
    if(key===accessorySummaryKey)return;const restoreFocus=accessorySummary.contains(document.activeElement);accessorySummaryKey=key;accessorySummary.replaceChildren();
    rows.forEach(row=>{if(!row.querySelector('[data-remove]')||!row.querySelector('span'))return;const copy=document.createElement('div'),label=document.createElement('span'),remove=document.createElement('button'),id=row.querySelector('[data-remove]').dataset.remove;label.textContent=row.querySelector('span').textContent;remove.type='button';remove.textContent='Remove';remove.setAttribute('aria-label',row.querySelector('button').getAttribute('aria-label'));remove.onclick=()=>accessoryHost.querySelector('[data-remove="'+id+'"]').click();copy.append(label,remove);accessorySummary.append(copy);});
    if(restoreFocus)(accessorySummary.querySelector('button')||accessoryOpen).focus({preventScroll:true});
    if($('chargerHelp').checked){const note=document.createElement('p');note.textContent='Charger help requested · price confirmed by staff';accessorySummary.append(note);}
  }
  const quality=document.createElement('div');quality.className='studio-quality';move(quality,'dpiLabel');$('stageStick').append(quality);
  // Case choice (Rated Case): a two option radio group right under the case preview, on phones without opening a sheet
  // and on desktop, with the rim color chips while the Rated Case is chosen. Shown only for phones with a Rated kit.
  // customizer.html owns prices, photos and masks (core.setCase / core.setRim); the case never enters undo history.
  const caseBox=document.createElement('fieldset');caseBox.className='studio-case';caseBox.id='studioCase';caseBox.hidden=true;
  // Each title is the name, then the price in its own span: on a narrow stage (iPad portrait) the price takes its own line.
  // The rim chips carry a visible "Rim color" label (the Phone tool's words), which also names the radio group.
  const caseTitle=(id,name)=>'<strong id="'+id+'"><span>'+name+'</span><span class="studio-case-price"><span class="studio-case-sep"> · </span><span class="studio-case-amt"></span></span></strong>';
  caseBox.innerHTML='<legend>Choose your case</legend><div class="studio-case-row"><div class="studio-case-options"><label class="studio-case-opt"><input type="radio" name="studioCaseType" value="MagSafe Clear"><span>'+caseTitle('studioCaseClear','Clear case')+'<small>Your phone shows through</small></span></label><label class="studio-case-opt"><input type="radio" name="studioCaseType" value="Rated Case"><span>'+caseTitle('studioCaseRated','Rated Case')+'<small><span id="studioCaseDrop"></span>Confirm availability in store</small></span></label></div><div class="studio-rim" id="studioRim" role="radiogroup" aria-labelledby="studioRimLabel" hidden><span class="studio-rim-label" id="studioRimLabel">Rim color</span><span class="studio-rim-chips" id="studioRimChips"></span></div></div>';
  panels.phone.append(caseBox);let rimKey='',revealRim=false;
  // On phones, rim chips that appear below the fold (short screens) are scrolled into view once, above the tool tray.
  caseBox.addEventListener('change',e=>{if(e.target.name==='studioCaseType'){core.setCase(e.target.value);revealRim=mobile.matches&&e.target.value==='Rated Case';}else if(e.target.name==='studioRim')core.setRim(e.target.value);sync();});
  // Photo credits (city photographs, space and field photos) stay visible under the case on the web editor instead of
  // inside the Photo tool. On shared kiosks the credit stays in the Photo tool, where design-editor.css hides it
  // (.studio-kiosk #cityPhotoCredit) so a credits page can never become a way out of the kiosk editor. The credit has its
  // own box after the quality note, so short phone screens can show it above the case (CSS).
  const creditBox=document.createElement('div');creditBox.className='studio-credit';$('stageStick').append(creditBox);
  move(kiosk&&panels.photo?panels.photo:creditBox,'cityPhotoCredit');
  const product=document.createElement('header');product.id='studioProduct';
  const kicker=document.createElement('p');kicker.className='studio-kicker';kicker.textContent='YOUR CASE. YOUR WAY.';
  product.append(kicker,top.querySelector('h1'),$('studioPhone'));
  const productPrice=document.createElement('p');productPrice.id='studioProductPrice';product.append(productPrice);
  const promise=document.createElement('p');promise.className='studio-product-note';promise.textContent='Made yours in store. Choose a background, add your name, then show our team.';product.append(promise);
  rail.insertBefore(product,tray);
  const media=document.createElement('div');media.className='studio-media';
  const thumbs=document.createElement('div');thumbs.id='studioVariations';thumbs.setAttribute('role','group');thumbs.setAttribute('aria-label','See backgrounds on your case');thumbs.hidden=true;
  const wrap=$('stageWrap');wrap.before(media);media.append(thumbs,wrap);
  let thumbKey='',thumbSource=null,thumbTimer=null,thumbPending='',libraryTitle='Make it yours.';
  function syncVariations(i,flush=false){
    const originals=[...$('photoLooks').querySelectorAll('.photo-look')];
    thumbs.hidden=step!=='edit'||!i.previewReady||originals.length<2||i.sky||!!i.layout;
    media.classList.toggle('has-variations',!thumbs.hidden);if(thumbs.hidden)return;
    const source=originals[0],s=core.snapshot(),key=[core.context(),i.finish,i.caseType,i.rim,s.scale,s.px,s.py,s.rot,s.fitMode,originals.map(b=>b.dataset.look).join(',')].join('|');
    if(key!==thumbKey||source!==thumbSource){
      if(!flush&&thumbKey){if(thumbPending!==key){clearTimeout(thumbTimer);thumbPending=key;thumbTimer=setTimeout(()=>{thumbPending='';if(!purged)syncVariations(core.info(),true);},250);}return;}
      const focused=thumbs.contains(document.activeElement)?document.activeElement.dataset.variation:null;
      thumbs.querySelectorAll('canvas').forEach(c=>{c.width=c.height=0;});
      thumbKey=key;thumbSource=source;thumbs.replaceChildren();
      for(const original of originals){
        const b=document.createElement('button');b.type='button';b.dataset.variation=original.dataset.look;
        b.setAttribute('aria-label',original.getAttribute('aria-label'));b.title=original.textContent;
        let c=null;try{c=core.lookPreview?.(original.dataset.look);}catch(e){/* Keep other editor controls available if a thumbnail fails. */}
        if(c){c.setAttribute('aria-hidden','true');b.append(c);}
        const label=document.createElement('span');label.textContent=original.textContent;b.append(label);thumbs.append(b);
      }
      if(focused)[...thumbs.children].find(b=>b.dataset.variation===focused)?.focus({preventScroll:true});
    }
    thumbs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.variation===(s.variant||'original'))));
  }
  thumbs.addEventListener('click',e=>{const b=e.target.closest('[data-variation]');if(!b)return;const original=[...$('photoLooks').children].find(o=>o.dataset.look===b.dataset.variation);if(original){remember();original.click();remember();sync();}});
  if(params.get('design')&&window.KPI)KPI.load('instore/').then(data=>{/* phones outside the store list have no pick code, but the design still has its title */const m=data.activeModels.find(m=>m.name===core.info().model),d=(m?data.designsFor(m):data.designs).find(d=>d.file===params.get('design'));if(d){libraryTitle=KPI.cleanTitle(d.title);if(core.info().library)product.querySelector('h1').textContent=libraryTitle;}}).catch(()=>{});
  const footer=document.createElement('div');footer.id='studioFooter';footer.innerHTML='<button type="button" id="studioBack">← Back</button><div><strong id="studioTotal"></strong><small id="studioStore"></small></div><button type="button" id="studioNext">Preview design →</button><p id="studioStatus" role="status"></p>';$('main').append(footer);
  // Size around iPhone safe areas, wrapped totals and the on-screen keyboard.
  function sizeChrome(){
    document.body.style.setProperty('--studio-tray-bottom',Math.ceil(footer.getBoundingClientRect().height+$('studioStatus').getBoundingClientRect().height)+'px');
    const v=window.visualViewport;
    if(v){sheet.style.setProperty('--studio-sheet-bottom',Math.max(0,innerHeight-v.height-v.offsetTop)+'px');sheet.style.setProperty('--studio-sheet-height',Math.max(150,Math.min(innerHeight*(sheet.dataset.activeTool==='adjust'?.9:.64),v.height-16))+'px');}
    fitSoon();
  }
  // Case size budget. While the case choice or a photo credit shows under the case (both added there by this editor),
  // the case preview gives up only the height that the rows under it (print quality pill, case choice, rim chips,
  // Enlarge case, quality line, credit) need to clear the fixed tool tray (phones) or footer (desktop) before any
  // scrolling. It is measured, so a wrapped rim row, the pill on the photo path, a two line title or the kiosk's missing
  // site header all count. design-editor.css keeps the case between a floor and its baseline size; without either row
  // the baseline sizing applies unchanged.
  let fitFrame=0;
  function fitSoon(){if(!fitFrame)fitFrame=requestAnimationFrame(fitStage);}
  function fitStage(){
    fitFrame=0;const credit=$('cityPhotoCredit'),canvasEl=$('stageCanvas');
    const on=!purged&&step!=='setup'&&!sheet.open&&stage.parentElement===grid&&(!thumbs.hidden||stage.contains(caseBox)&&!caseBox.hidden||!!credit&&creditBox.contains(credit)&&!credit.hidden);
    stage.classList.toggle('studio-fit',on);
    if(!on){stage.style.removeProperty('--studio-case-fit');if(revealRim&&sheet.open)requestAnimationFrame(showRim);return;}
    const ch=canvasEl.getBoundingClientRect().height;if(!ch)return;
    let limit=footer.getBoundingClientRect().top;
    if($('studioStatus').textContent)limit=Math.min(limit,$('studioStatus').getBoundingClientRect().top);
    if(mobile.matches&&!tray.hidden)limit=Math.min(limit,tray.getBoundingClientRect().top);
    const sr=stage.getBoundingClientRect();let bottom=sr.top;
    for(const el of stage.children){const r=el.getBoundingClientRect();if(r.height>0)bottom=Math.max(bottom,r.bottom);}
    // where the content ends with the page at the top: the stage is the grid's first item (sticky on desktop)
    const bottom0=grid.getBoundingClientRect().top+scrollY+(bottom-sr.top);
    const fit=Math.floor(ch+limit-8-bottom0),prev=parseFloat(stage.style.getPropertyValue('--studio-case-fit'));
    if(!(Math.abs(fit-prev)<=1))stage.style.setProperty('--studio-case-fit',fit+'px');
    if(revealRim)requestAnimationFrame(showRim);
  }
  function showRim(){
    revealRim=false;const row=$('studioRim');if(row.hidden||!mobile.matches)return;if(sheet.open){row.scrollIntoView({block:'nearest'});return;}
    const lim=tray.hidden?footer.getBoundingClientRect().top:tray.getBoundingClientRect().top;
    if(row.getBoundingClientRect().bottom>lim-4)row.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  }
  const chromeSize=new ResizeObserver(sizeChrome);chromeSize.observe(footer,{box:'border-box'});chromeSize.observe($('studioStatus'));
  const stageSize=new ResizeObserver(fitSoon);stageSize.observe(stage);stageSize.observe(tray);window.addEventListener('resize',fitSoon);
  window.visualViewport?.addEventListener('resize',sizeChrome);window.visualViewport?.addEventListener('scroll',sizeChrome);sizeChrome();
  const reset=document.createElement('button');reset.id='studioReset';reset.type='button';reset.textContent='Start over';top.querySelector('.studio-history').append(reset);
  const resetDialog=document.createElement('dialog');resetDialog.id='studioResetDialog';resetDialog.setAttribute('aria-labelledby','studioResetTitle');resetDialog.innerHTML='<h2 id="studioResetTitle">Start a new design?</h2><p>Your current changes will be cleared.</p><button type="button" id="studioCancelReset">Keep designing</button><button type="button" id="studioConfirmReset">Start over</button>';document.body.append(resetDialog);
  let step='edit',tool=null,lastTool=null,entered=false,initialSetup=null,undo=[],redo=[],context='',pending,applying=false,purged=false,closing=false,internalCloses=0;
  const state=window.KPEditor={get step(){return step},get tool(){return tool},openTool,setStep};
  const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  function remember(){
    clearTimeout(pending);if(purged||applying)return;
    const key=core.context(),snap=core.snapshot();
    if(key!==context){context=key;undo=[snap];redo=[];}
    else if(!same(undo.at(-1),snap)){undo.push(snap);if(undo.length>21)undo.shift();redo=[];}
    historyButtons();
  }
  function historyButtons(){$('studioUndo').disabled=undo.length<2;$('studioRedo').disabled=!redo.length;}
  function travel(back){remember();if(back?undo.length<2:!redo.length)return;if(back)redo.push(undo.pop());else undo.push(redo.pop());applying=true;core.restore(undo.at(-1));applying=false;historyButtons();sync();}
  function rememberSoon(){if(purged)return;if(core.context()!==context)remember();sync();clearTimeout(pending);pending=setTimeout(remember,350);}
  document.addEventListener('kp:editor-change',rememberSoon);
  document.addEventListener('kp:editor-purge',()=>{purged=true;if(accessoryDialog.open)accessoryDialog.close();accessorySummary.replaceChildren();clearTimeout(thumbTimer);clearTimeout(pending);undo=[];redo=[];$('studioReviewDetails').replaceChildren();$('studioStatus').textContent='';});
  $('studioUndo').onclick=()=>travel(true);$('studioRedo').onclick=()=>travel(false);
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!e.target.closest('input,textarea,select')&&step==='edit'&&!document.querySelector('dialog[open]')){e.preventDefault();travel(!e.shiftKey);}});
  function hideSheet(){stageHome.after(stage);if(sheet.open){internalCloses++;sheet.close();}Object.values(panels).forEach(p=>host.append(p));}
  function paintTool(){
    Object.entries(panels).forEach(([id,p])=>p.hidden=id!==tool&&!(id==='phone'&&!mobile.matches&&step==='edit'));
    Object.entries(buttons).forEach(([id,b])=>b.setAttribute('aria-expanded',String(id===tool)));
    sheet.dataset.activeTool=tool||'';
    if(mobile.matches&&tool){if(tool==='adjust')sheetBody.append(stage);else stageHome.after(stage);sheetBody.append(panels[tool]);$('studioSheetTitle').textContent=buttons[tool].querySelector('strong').textContent;if(!sheet.open)sheet.showModal();}
    sizeChrome();const canMove=step==='edit'&&tool==='adjust';$('stageCanvas').style.touchAction=canMove?'none':'pan-y';
  }
  function openTool(id,push=true){if(step!=='edit'||!panels[id]||buttons[id].hidden)return;remember();tool=id;lastTool=id;if(mobile.matches&&push)pushStep(step,id);paintTool();if(id==='photo'&&layoutAdd){core.loadLayouts?.();showChosenLayout();}}
  // The phone sheet re-parents the panel, which resets the chip strip's scroll: bring the chosen layout back into view.
  function showChosenLayout(){const row=$('layoutChips'),chip=row?.querySelector('.layChip[aria-pressed="true"]');if(!chip||!mobile.matches)return;const r=row.getBoundingClientRect(),c=chip.getBoundingClientRect();row.scrollLeft+=(c.left+c.width/2)-(r.left+r.width/2);}
  function closeTool(){if(closing)return;if(document.activeElement instanceof HTMLElement)document.activeElement.blur();if(mobile.matches&&history.state?.kpStudioTool){closing=true;hideSheet();history.back();return;}tool=null;hideSheet();paintTool();}
  document.addEventListener('kp:sky-preview',()=>{if(mobile.matches)closeTool();$('stageStick').scrollIntoView({block:'start',behavior:'smooth'});});
  sheet.addEventListener('close',()=>{if(internalCloses){internalCloses--;return;}if(!purged&&tool)closeTool();});
  sheet.addEventListener('cancel',e=>{e.preventDefault();closeTool();});$('studioDone').onclick=closeTool;
  let backdropPress=false;sheet.addEventListener('pointerdown',e=>{backdropPress=e.target===sheet;});
  sheet.addEventListener('click',e=>{if(backdropPress&&e.target===sheet){const r=sheet.getBoundingClientRect();if(e.clientY<r.top||e.clientX<r.left||e.clientX>r.right)closeTool();}});
  tray.onclick=e=>{const b=e.target.closest('[data-tool]');if(b)openTool(b.dataset.tool);};
  mobile.addEventListener('change',()=>{hideSheet();if(!mobile.matches){tool=tool||home();paintTool();}else {tool=null;paintTool();}history.replaceState({...history.state,kpStudioTool:null},'');});
  function pushStep(next,id){const depth=(history.state?.kpStudioDepth||0)+1;history.pushState({...history.state,kpStudioSession:sessionId,kpStudioDepth:depth,kpStudioEditDepth:next==='edit'&&!id?depth:(history.state?.kpStudioEditDepth||0),kpStudioStep:next,kpStudioTool:id},'');}
  function returnToDesign(){const distance=(history.state?.kpStudioDepth||0)-(history.state?.kpStudioEditDepth||0);if(distance>0)history.go(-distance);else setStep('edit',false);}
  function setStep(next,push=true){
    remember();tool=null;hideSheet();step=next;document.body.dataset.studioStep=step;
    if(step==='setup'&&storePicker&&!core.info().store)storePicker.open=true;
    tray.hidden=host.hidden=step!=='edit';preview.hidden=step!=='preview';setup.hidden=step!=='setup';
    $('studioUndo').hidden=$('studioRedo').hidden=step!=='edit';
    top.querySelectorAll('[data-step]').forEach(li=>{if(li.dataset.step===step)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');});
    if(step==='edit'&&!mobile.matches)tool=home();paintTool();
    if(push)pushStep(step,null);core.redraw?.();
    sync();window.scrollTo({top:0,behavior:'instant'});if(entered){const heading=step==='edit'?product.querySelector('h1'):(step==='preview'?preview:setup).querySelector('h2');heading.tabIndex=-1;heading.focus({preventScroll:true});}entered=true;
  }
  history.replaceState({...history.state,kpStudioSession:sessionId,kpStudioDepth:0,kpStudioEditDepth:0,kpStudioStep:'edit',kpStudioTool:null},'');
  window.addEventListener('popstate',()=>{
    accessoryClosing=false;
    if(history.state?.kpStudioAccessory&&step==='setup'){accessoryDialog.showModal();accessoryOpen.setAttribute('aria-expanded','true');return;}
    closing=false;for(const id of ['counterReview','studioResetDialog','studioClearDialog','studioAccessoryDialog'])if($(id)?.open)$(id).close();if(!history.state?.kpStudioStep)return;const previous=tool;let target=history.state.kpStudioStep;
    if(history.state.kpStudioSession!==sessionId){target='edit';history.replaceState({...history.state,kpStudioSession:sessionId,kpStudioDepth:0,kpStudioEditDepth:0,kpStudioStep:'edit',kpStudioTool:null},'');}
    if(target!=='edit'&&core.info().issue){target='edit';history.replaceState({...history.state,kpStudioSession:sessionId,kpStudioEditDepth:history.state.kpStudioDepth||0,kpStudioStep:'edit',kpStudioTool:null},'');}
    if(target!==step)setStep(target,false);else{tool=step==='edit'&&!mobile.matches?home():null;hideSheet();paintTool();if(previous)buttons[previous]?.focus({preventScroll:true});}
    if(history.state.kpStudioTool)openTool(history.state.kpStudioTool,false);
  });
  $('studioNext').onclick=()=>{
    const i=core.info();if(i.issue){core.retry?.();$('studioStatus').textContent=i.issue;return;}
    if(step==='edit')setStep('preview');else if(step==='preview')setStep('setup');else core.review();
  };
  $('studioBack').onclick=()=>{if(step!=='edit')history.back();else $('studioBrowse').click();};
  $('studioEditAgain').onclick=()=>history.back();
  const counterBack=$('counterReview')?.querySelector('form button:not([type])');if(counterBack)counterBack.textContent='Edit extras';
  const counterActions=$('counterReview').querySelector('.review-actions');
  const editDesign=document.createElement('button');editDesign.type='button';editDesign.id='reviewEditDesign';editDesign.textContent='Edit design';counterActions.insertBefore(editDesign,counterBack);editDesign.onclick=()=>{$('counterReview').close();returnToDesign();};
  if(kiosk){const nextCustomer=document.createElement('button');nextCustomer.id='reviewNextCustomer';nextCustomer.type='button';nextCustomer.textContent='Start next customer';counterActions.append(nextCustomer);nextCustomer.onclick=()=>confirmExit('next');}
  $('studioCenter').onclick=()=>core.adjust('center');
  adjustments.addEventListener('input',e=>{if(e.target.dataset.adjust)core.adjust(e.target.dataset.adjust,e.target.value);});
  function sync(){
    if(purged)return;const i=core.info(),s=core.snapshot(),originalOnly=i.library&&i.previewReady&&!i.loading&&$('photoLooksWrap').hidden;syncAccessorySummary(i);
    promise.textContent=i.sky?'Create a sky for your date and place, then review it with our team.':i.drawing?'Turn their drawing into a keepsake. Our team checks the artwork before printing.':i.library?(originalOnly?'Choose your phone, add a name if you like, then show our team.':'Made yours in store. Choose a background, add your name, then show our team.'):'Add your photo, make it yours, then show our team in store.';
    product.querySelector('h1').textContent=i.library?libraryTitle:i.sky?'Your special night.':i.drawing?'Their drawing, your case.':i.layout?'Your photo collage.':'Make it yours.';
    syncVariations(i);productPrice.textContent='$'+(i.caseType==='Rated Case'?i.prices.rated:i.prices.clear).toFixed(2);product.hidden=step!=='edit';
    preview.querySelector('h2').textContent=i.drawingPending?'Your case setup.':'Your design, on your case.';
    preview.querySelector('h2 + p').textContent=i.drawingPending?'Your drawing will be added at the counter. Check your phone and any name, then choose your extras.':'Check the spelling, placement and camera area. Tap the case to see every detail.';
    if(i.drawing){buttons.background.hidden=buttons.adjust.hidden=!i.hasPhoto;if(i.drawingPending)$('stageHint').textContent=(i.caseType==='Rated Case'?'Rated Case':'Clear case')+' · drawing to be added at the counter';}
    if(i.library&&!lastTool&&tool==='photo'&&!mobile.matches){tool='background';paintTool();}
    if(initialSetup===null&&!i.loading&&!i.issue)initialSetup=i.selectionKey;
    if(storeLabel)storeLabel.textContent='Store: '+(i.store||'Choose your store');
    $('studioPhone').textContent=i.model+' · '+(i.caseType==='MagSafe Clear'?'Clear case':i.caseType);
    // case choice: prices from the customizer, checked state from the live case; rim chips only for the Rated Case
    caseBox.hidden=!i.ratedAvailable;
    const phoneHelp=panels.phone.querySelector('.studio-help'),copy=!i.clearAvailable?(i.rims.length>1?phoneCopy.only:phoneCopy.onlyOne):i.ratedAvailable?phoneCopy.rated:phoneCopy.clear;if(phoneHelp.textContent!==copy)phoneHelp.textContent=copy;
    if(i.ratedAvailable){
      // Rated only phones: no clear option, so the lone Rated card keeps the price, drop rating and availability line
      caseBox.classList.toggle('studio-case-only',!i.clearAvailable);caseBox.querySelector('[value="MagSafe Clear"]').closest('label').hidden=!i.clearAvailable;
      const legend=i.clearAvailable?'Choose your case':'Your case',drop=i.drop?i.drop+' · ':'';if(caseBox.querySelector('legend').textContent!==legend)caseBox.querySelector('legend').textContent=legend;if($('studioCaseDrop').textContent!==drop)$('studioCaseDrop').textContent=drop;
      $('studioCaseClear').querySelector('.studio-case-amt').textContent='$'+i.prices.clear.toFixed(2);$('studioCaseRated').querySelector('.studio-case-amt').textContent='$'+i.prices.rated.toFixed(2);
      caseBox.querySelectorAll('[name=studioCaseType]').forEach(r=>{r.checked=r.value===i.caseType;});
      const rims=i.caseType==='Rated Case'?i.rims:[],key=rims.map(r=>r.n).join('|'),rimRow=$('studioRim');
      if(key!==rimKey){rimKey=key;$('studioRimChips').replaceChildren(...rims.map(r=>{const l=document.createElement('label');l.className='studio-rim-chip';l.innerHTML='<input type="radio" name="studioRim"><span class="studio-rim-dot" aria-hidden="true"></span><span></span>';l.querySelector('input').value=r.n;l.querySelector('.studio-rim-dot').style.background=r.h;l.lastChild.textContent=r.n;return l;}));}
      rimRow.hidden=!rims.length;rimRow.querySelectorAll('input').forEach(r=>{r.checked=r.value===i.rim;});
    }fitSoon();$('studioTotal').textContent=i.accessoryError?'—':'$'+i.total.toFixed(2);
    $('studioStore').textContent=(i.store||'Choose your store')+(i.store==='Newark, DE'?' · No sales tax':' · Before tax');
    const url=!kiosk&&collectionReturn()||new URL(kiosk?'instore/':'gallery.html',location.href);if(kiosk){if(fixedStore)url.searchParams.set('store',params.get('store'));url.searchParams.set('model',i.model.toLowerCase().replace(/^(samsung|google|motorola) /,'').replaceAll(' ','-'));if(params.get('collection'))url.searchParams.set('collection',params.get('collection'));}else if(url.pathname.endsWith('/gallery.html'))url.searchParams.set('device',i.model.toLowerCase().replace(/^(samsung|google|motorola) /,'').replaceAll(' ','-'));$('studioBrowse').href=url.href;
    $('studioNext').textContent=step==='edit'?(i.drawingPending?'Review case setup →':'Preview design →'):step==='preview'?'Choose extras →':'Show at counter →';
    // Preview and Extras also carry the empty photo spot note above the footer (partial collages never block Next)
    const status=i.issue||(step!=='edit'&&i.partial)||'';
    $('studioNext').disabled=!!i.issue;if($('studioStatus').textContent!==status)$('studioStatus').textContent=status;
    noBackground.hidden=!$('photoLooksWrap').hidden;noBackground.textContent=i.hasPhoto?'This design uses its original background.':'Choose a design or photo to see its backgrounds.';
    if(layoutAdd){
      // Photo path: personal photos have no alternate backgrounds, so Background steps aside (as it does for the sky).
      // Words replaces Name for words templates; collage spots fill themselves, so Adjust steps aside too.
      const words=!!i.layout?.words;buttons.background.hidden=!!i.layouts;buttons.words.hidden=!words;buttons.name.hidden=words;buttons.adjust.hidden=!!i.layout;
      layoutsWait.hidden=!i.layouts||i.layoutsReady&&!i.layoutsOff;layoutsWait.textContent=i.layoutsOff?'Layouts do not fit this phone. Add one photo.':i.layoutsFailed?'Layouts could not load. Check your connection and try again. You can still add one photo.':'Loading layouts…';layoutsRetry.hidden=!i.layouts||!i.layoutsFailed;
      layoutSpare.hidden=!i.spare;layoutSpare.textContent=i.spare===1?'1 more photo is saved for a layout with more spots.':i.spare+' more photos are saved for a layout with more spots.';
      layoutAdd.textContent=$('uploadBtn').textContent;layoutAdd.disabled=$('uploadBtn').disabled;
      if(step==='edit'&&tool&&buttons[tool].hidden){if(mobile.matches)closeTool();else{tool=home();paintTool();}}
    }
    // Full-photo library designs have no alternate backgrounds. Keep the tool only when there is a choice or a recovery action.
    if(i.library){buttons.background.hidden=originalOnly;if(step==='edit'&&tool==='background'&&originalOnly){if(mobile.matches)closeTool();else{tool=home();paintTool();}}}
    adjustments.hidden=!i.hasPhoto||i.sky;adjustNote.hidden=i.hasPhoto&&!i.sky;
    $('editTools').style.display=i.hasPhoto&&!i.sky?'block':'none';
    adjustments.querySelectorAll('input').forEach(el=>{if(el!==document.activeElement)el.value=s[el.dataset.adjust];});
    const details=$('studioReviewDetails');details.replaceChildren();
    const rows=[['Phone',i.model+(i.finish?' · '+i.finish:'')],['Case',i.caseType==='Rated Case'?i.caseLabel:'Clear case']];
    $('studioPartial').hidden=!i.partial;$('studioPartial').textContent=i.partial||'';
    if(i.sky)rows.push(...(i.skyDetails||[]).filter(([label])=>!['Printed place','Coordinates','UTC instant','Sky version'].includes(label)));
    else if(i.layout){rows.push(['Layout',i.layout.name+' · '+i.layout.filled+' of '+i.layout.total+(i.layout.total===1?' photo':' photos')]);i.layout.captions.forEach(c=>rows.push([c.label,c.shown===false?'Not shown on this phone':c.waiting?'Prints when photo '+c.waiting+' is added':c.text.replace(/\n/g,' / ')||'Not added']));}
    else rows.push([i.drawing?'Artwork':'Background',i.drawingPending?'Drawing to add at the counter':i.drawing?'Your child’s drawing':$('photoLookStatus').textContent]);
    if(!i.sky&&!i.layout?.words)rows.push(['Added name',s.text||'None']);
    for(const [label,value] of rows){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;details.append(dt,dd);}
    if(step==='edit'&&tool!=='adjust')$('stageCanvas').style.touchAction='pan-y';
  }
  let leaveToBrowse=false;
  function exit(preserveBrowse=false){if(exiting)return;exiting=true;window.KPKioskSession?.retire();if(kiosk)document.documentElement.style.visibility='hidden';const fallback=new URL(kiosk?'instore/':'gallery.html',location.href);if(fixedStore)fallback.searchParams.set('store',params.get('store'));const dest=(!kiosk||preserveBrowse)&&$('studioBrowse')?.href||fallback.href;try{core.purge();}finally{location.replace(dest);}}
  function confirmExit(mode){const next=mode==='next',leave=mode===true;leaveToBrowse=leave;resetDialog.querySelector('h2').textContent=next?'Clear for the next customer?':leave?'Leave this design?':'Start a new design?';resetDialog.querySelector('p').textContent=next?'This clears the current design, name and extras from this screen.':leave?(core.info().layout?'Your layout, photos, words and selected extras will be cleared.':'Your design changes and selected extras will be cleared.'):'Your current changes will be cleared.';$('studioConfirmReset').textContent=next?'Clear screen':leave?'Leave design':'Start over';$('studioCancelReset').textContent=next?'Cancel':'Keep designing';resetDialog.showModal();}
  $('studioBrowse').onclick=e=>{const s=core.snapshot(),i=core.info();if(i.skyDirty||s.text||s.px||s.py||s.rot||s.scale!==1||i.hasPhoto&&!i.library||i.hasExtras||!same(s,initialSnapshot)||i.model!==info.model||i.finish!==info.finish||i.store!==info.store||initialSetup!==null&&i.selectionKey!==initialSetup||i.layout){e.preventDefault();confirmExit(true);}};
  $('studioReset').onclick=()=>confirmExit(false);$('studioCancelReset').onclick=()=>resetDialog.close();$('studioConfirmReset').onclick=()=>exit(leaveToBrowse);
  // Remove all photos in the Photo tool clears a whole layout (up to 12 photos and every word) and cannot be undone,
  // so it asks first, like Start over. A single photo keeps the one tap clear it always had.
  const clearDialog=document.createElement('dialog');clearDialog.id='studioClearDialog';clearDialog.innerHTML='<h2>Remove your photos?</h2><p>Your layout, photos and words will be cleared. Your phone and extras stay.</p><button type="button" id="studioCancelClear">Keep designing</button><button type="button" id="studioConfirmClear">Remove photos</button>';document.body.append(clearDialog);
  let clearConfirmed=false;
  document.addEventListener('click',e=>{if(clearConfirmed||!e.target.closest?.('#clearBtn')||!core.info().layout)return;e.preventDefault();e.stopImmediatePropagation();clearDialog.showModal();},true);
  $('studioCancelClear').onclick=()=>clearDialog.close();
  $('studioConfirmClear').onclick=()=>{clearDialog.close();clearConfirmed=true;try{$('clearBtn').click();}finally{clearConfirmed=false;}};
  if(kiosk){
    warning=document.createElement('dialog');warning.id='studioIdle';warning.setAttribute('aria-labelledby','studioIdleTitle');warning.innerHTML='<h2 id="studioIdleTitle">Still designing?</h2><p>This screen will reset in 30 seconds to clear your details.</p><button type="button">Keep designing</button>';document.body.append(warning);
    warning.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();arm();}});warning.querySelector('button').onclick=arm;warning.addEventListener('cancel',e=>{e.preventDefault();arm();});
    const counterExpiry=document.createElement('p');counterExpiry.className='review-expiry';counterExpiry.textContent='Clears after 5 minutes without a touch.';$('reviewCode').after(counterExpiry);new MutationObserver(arm).observe($('counterReview'),{attributes:true,attributeFilter:['open']});
    $('saveCounterCard').hidden=true;if($('skySave'))$('skySave').hidden=true;
    // Shared screens never open a customer's file picker, even from empty-canvas taps.
    $('fileInput').disabled=true;
    state.expire=exit;
  }
  setStep('edit',false);remember();sync();
  if(mobile.matches&&(info.drawing||info.sky))openTool(info.sky?'sky':'photo');
})();
