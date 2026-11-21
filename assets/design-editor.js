/* Dedicated touch editor; all artwork and print rendering stays in customizer.html. */
(() => {
  if (!window.KP_EDITOR || !window.KPStudioCore) return;
  const core=KPStudioCore, $=id=>document.getElementById(id), params=new URLSearchParams(location.search);
  const sessionId=Date.now().toString(36)+Math.random().toString(36).slice(2);
  const kiosk=params.get('kiosk')==='1', mobile=matchMedia('(max-width:760px)');
  const fixedStore=kiosk&&window.KPAccessories?.stores.includes(params.get('store'));
  // Arm privacy protection before constructing any editor UI. Deadlines survive device sleep.
  let idleTimer,warningTimer,warning=null,expiresAt=0,exiting=false,leaving=false;
  function arm(){if(exiting||leaving)return;const duration=$('counterReview')?.open?300000:180000;clearTimeout(idleTimer);clearTimeout(warningTimer);expiresAt=Date.now()+duration;if(warning?.open)warning.close();warningTimer=setTimeout(()=>warning?.showModal(),duration-30000);idleTimer=setTimeout(checkExpiry,duration);}
  function checkExpiry(){if(expiresAt&&Date.now()>=expiresAt)exit();}
  if(kiosk){
    document.addEventListener('click',e=>{if(exiting||leaving){e.preventDefault();e.stopImmediatePropagation();}},true);
    arm();['pointerdown','keydown','input','wheel'].forEach(ev=>document.addEventListener(ev,()=>{checkExpiry();if(!exiting)arm();},{passive:true}));
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
  const panels={},buttons={},icons={phone:'▯',background:'◒',name:'Aa',adjust:'⤢',photo:'▧',sky:'✧'};
  function panel(id,title,description){
    const p=document.createElement('section');p.className='studio-panel';p.id='studio-'+id;p.hidden=true;
    const h=document.createElement('h2');h.textContent=title;p.append(h);
    if(description){const t=document.createElement('p');t.className='studio-help';t.textContent=description;p.append(t);}
    host.append(p);panels[id]=p;
    const b=document.createElement('button');b.type='button';b.dataset.tool=id;b.setAttribute('aria-controls',p.id);b.setAttribute('aria-expanded','false');
    b.innerHTML='<span aria-hidden="true">'+icons[id]+'</span><strong>'+title+'</strong>';tray.append(b);buttons[id]=b;return p;
  }
  function move(p,...ids){ids.forEach(id=>{const el=typeof id==='string'?$(id):id;if(el)p.append(el);});}
  move(panel('phone','Phone','Choose your model and phone finish. Your case stays clear; screen colors are approximate.'),'kpSelRow',finish);
  move(panel('background','Background','Keep the artwork you love. Change only its background.'),'photoLooksWrap');
  const noBackground=document.createElement('p');noBackground.id='studioNoBackground';noBackground.textContent='Background choices appear once your design is ready.';panels.background.append(noBackground);
  move(panel('name','Name','Add a name, initials, or a little something that is you.'),name);
  move(panel('adjust','Adjust','Check important details stay clear of the camera and edges.'),'editTools');
  const adjustments=document.createElement('div');adjustments.id='studioAdjustments';
  adjustments.innerHTML='<button type="button" id="studioCenter">Center & reset size</button>'+[['scale','Size',.35,4,.01],['px','Left / right',-900,900,10],['py','Up / down',-1200,1200,10],['rot','Rotation',-180,180,1]].map(([key,label,min,max,step])=>'<label>'+label+'<input type="range" aria-label="Artwork '+label.toLowerCase()+'" data-adjust="'+key+'" min="'+min+'" max="'+max+'" step="'+step+'"></label>').join('');panels.adjust.append(adjustments);
  const adjustNote=document.createElement('p');adjustNote.textContent=kiosk?'Choose a design to adjust its placement.':'Add a photo or choose a design to adjust its placement.';panels.adjust.append(adjustNote);
  const info=core.info(),initialSnapshot=core.snapshot();
  if(info.sky){move(panel('sky','Night sky','Create a sky for your date and place.'),'personalStudio');buttons.background.hidden=true;buttons.adjust.hidden=true;}
  else {
    const photoPanel=panel('photo',kiosk?'Photo help':info.drawing?'Drawing':'Photo',kiosk?'Want to use your own photo or drawing? Ask our team at the counter.':'Your photo stays on this device. Choose an original, full-size image.');
    if(info.drawing)move(photoPanel,'personalStudio');
    if(!kiosk)move(photoPanel,'uploadBtn','fileInput','photoPrivacy','clearBtn');
    move(photoPanel,'browseLink','cityPhotoCredit');
    if(kiosk){$('fileInput').disabled=true;$('choosePhoto').disabled=true;}
  }
  const preview=document.createElement('section');preview.id='studioPreview';preview.hidden=true;
  preview.innerHTML='<p class="studio-kicker">ONE LAST LOOK</p><h2>Your design, on your case.</h2><p>Check the spelling, placement and camera area. Tap the case to see every detail.</p><dl id="studioReviewDetails"></dl><button type="button" id="studioEditAgain">Keep editing</button><p class="studio-help">Digital preview. Our team checks your case and artwork before printing.</p>';rail.append(preview);
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
  const quality=document.createElement('div');quality.className='studio-quality';move(quality,'dpiLabel');$('stageStick').append(quality);
  const footer=document.createElement('div');footer.id='studioFooter';footer.innerHTML='<button type="button" id="studioBack">← Back</button><div><strong id="studioTotal"></strong><small id="studioStore"></small></div><button type="button" id="studioNext">Preview design →</button><p id="studioStatus" role="status"></p>';$('main').append(footer);
  // Size around iPhone safe areas, wrapped totals and the on-screen keyboard.
  function sizeChrome(){
    document.body.style.setProperty('--studio-tray-bottom',Math.ceil(footer.getBoundingClientRect().height+$('studioStatus').getBoundingClientRect().height)+'px');
    const v=window.visualViewport;
    if(v){sheet.style.setProperty('--studio-sheet-bottom',Math.max(0,innerHeight-v.height-v.offsetTop)+'px');sheet.style.setProperty('--studio-sheet-height',Math.max(150,Math.min(innerHeight*(sheet.dataset.activeTool==='adjust'?.9:.64),v.height-16))+'px');}
  }
  const chromeSize=new ResizeObserver(sizeChrome);chromeSize.observe(footer,{box:'border-box'});chromeSize.observe($('studioStatus'));
  window.visualViewport?.addEventListener('resize',sizeChrome);window.visualViewport?.addEventListener('scroll',sizeChrome);sizeChrome();
  const reset=document.createElement('button');reset.id='studioReset';reset.type='button';reset.textContent='Start over';top.querySelector('.studio-history').append(reset);
  const resetDialog=document.createElement('dialog');resetDialog.id='studioResetDialog';resetDialog.setAttribute('aria-labelledby','studioResetTitle');resetDialog.innerHTML='<h2 id="studioResetTitle">Start a new design?</h2><p>Your current changes will be cleared.</p><button type="button" id="studioCancelReset">Keep designing</button><button type="button" id="studioConfirmReset">Start over</button>';document.body.append(resetDialog);
  let step='edit',tool=null,lastTool=info.sky?'sky':'background',entered=false,initialSetup=null,undo=[],redo=[],context='',pending,applying=false,purged=false,closing=false,internalCloses=0;
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
  function rememberSoon(){if(purged)return;sync();clearTimeout(pending);pending=setTimeout(remember,350);}
  document.addEventListener('kp:editor-change',rememberSoon);
  document.addEventListener('kp:editor-purge',()=>{purged=true;clearTimeout(pending);undo=[];redo=[];$('studioReviewDetails').replaceChildren();$('studioStatus').textContent='';});
  $('studioUndo').onclick=()=>travel(true);$('studioRedo').onclick=()=>travel(false);
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!e.target.closest('input,textarea,select')&&step==='edit'&&!document.querySelector('dialog[open]')){e.preventDefault();travel(!e.shiftKey);}});
  function hideSheet(){stageHome.after(stage);if(sheet.open){internalCloses++;sheet.close();}Object.values(panels).forEach(p=>host.append(p));}
  function paintTool(){
    Object.entries(panels).forEach(([id,p])=>p.hidden=id!==tool);
    Object.entries(buttons).forEach(([id,b])=>b.setAttribute('aria-expanded',String(id===tool)));
    sheet.dataset.activeTool=tool||'';
    if(mobile.matches&&tool){if(tool==='adjust')sheetBody.append(stage);else stageHome.after(stage);sheetBody.append(panels[tool]);$('studioSheetTitle').textContent=buttons[tool].querySelector('strong').textContent;if(!sheet.open)sheet.showModal();}
    sizeChrome();const canMove=step==='edit'&&tool==='adjust';$('stageCanvas').style.touchAction=canMove?'none':'pan-y';
  }
  function openTool(id,push=true){if(step!=='edit'||!panels[id])return;remember();tool=id;lastTool=id;if(mobile.matches&&push)pushStep(step,id);paintTool();}
  function closeTool(){if(closing)return;if(document.activeElement instanceof HTMLElement)document.activeElement.blur();if(mobile.matches&&history.state?.kpStudioTool){closing=true;hideSheet();history.back();return;}tool=null;hideSheet();paintTool();}
  sheet.addEventListener('close',()=>{if(internalCloses){internalCloses--;return;}if(!purged&&tool)closeTool();});
  sheet.addEventListener('cancel',e=>{e.preventDefault();closeTool();});$('studioDone').onclick=closeTool;
  let backdropPress=false;sheet.addEventListener('pointerdown',e=>{backdropPress=e.target===sheet;});
  sheet.addEventListener('click',e=>{if(backdropPress&&e.target===sheet){const r=sheet.getBoundingClientRect();if(e.clientY<r.top||e.clientX<r.left||e.clientX>r.right)closeTool();}});
  tray.onclick=e=>{const b=e.target.closest('[data-tool]');if(b)openTool(b.dataset.tool);};
  mobile.addEventListener('change',()=>{hideSheet();if(!mobile.matches){tool=tool||(info.sky?'sky':'background');paintTool();}else {tool=null;paintTool();}history.replaceState({...history.state,kpStudioTool:null},'');});
  function pushStep(next,id){const depth=(history.state?.kpStudioDepth||0)+1;history.pushState({...history.state,kpStudioSession:sessionId,kpStudioDepth:depth,kpStudioEditDepth:next==='edit'&&!id?depth:(history.state?.kpStudioEditDepth||0),kpStudioStep:next,kpStudioTool:id},'');}
  function returnToDesign(){const distance=(history.state?.kpStudioDepth||0)-(history.state?.kpStudioEditDepth||0);if(distance>0)history.go(-distance);else setStep('edit',false);}
  function setStep(next,push=true){
    remember();tool=null;hideSheet();step=next;document.body.dataset.studioStep=step;
    if(step==='setup'&&storePicker&&!core.info().store)storePicker.open=true;
    tray.hidden=host.hidden=step!=='edit';preview.hidden=step!=='preview';setup.hidden=step!=='setup';
    $('studioUndo').hidden=$('studioRedo').hidden=step!=='edit';
    top.querySelectorAll('[data-step]').forEach(li=>{if(li.dataset.step===step)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');});
    if(step==='edit'&&!mobile.matches)tool=lastTool;paintTool();
    if(push)pushStep(step,null);
    sync();window.scrollTo({top:0,behavior:'instant'});if(entered){const heading=step==='edit'?top.querySelector('h1'):(step==='preview'?preview:setup).querySelector('h2');heading.tabIndex=-1;heading.focus({preventScroll:true});}entered=true;
  }
  history.replaceState({...history.state,kpStudioSession:sessionId,kpStudioDepth:0,kpStudioEditDepth:0,kpStudioStep:'edit',kpStudioTool:null},'');
  window.addEventListener('popstate',()=>{
    closing=false;for(const id of ['counterReview','studioResetDialog'])if($(id)?.open)$(id).close();if(!history.state?.kpStudioStep)return;const previous=tool;let target=history.state.kpStudioStep;
    if(history.state.kpStudioSession!==sessionId){target='edit';history.replaceState({...history.state,kpStudioSession:sessionId,kpStudioDepth:0,kpStudioEditDepth:0,kpStudioStep:'edit',kpStudioTool:null},'');}
    if(target!=='edit'&&core.info().issue){target='edit';history.replaceState({...history.state,kpStudioSession:sessionId,kpStudioEditDepth:history.state.kpStudioDepth||0,kpStudioStep:'edit',kpStudioTool:null},'');}
    if(target!==step)setStep(target,false);else{tool=step==='edit'&&!mobile.matches?lastTool:null;hideSheet();paintTool();if(previous)buttons[previous]?.focus({preventScroll:true});}
    if(history.state.kpStudioTool)openTool(history.state.kpStudioTool,false);
  });
  $('studioNext').onclick=()=>{
    const i=core.info();if(i.issue){$('studioStatus').textContent=i.issue;return;}
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
    if(purged)return;const i=core.info(),s=core.snapshot();
    if(initialSetup===null&&!i.loading&&!i.issue)initialSetup=i.selectionKey;
    if(storeLabel)storeLabel.textContent='Store: '+(i.store||'Choose your store');
    $('studioPhone').textContent=i.model+' · '+(i.caseType==='MagSafe Clear'?'Clear case':i.caseType);$('studioTotal').textContent=i.accessoryError?'—':'$'+i.total.toFixed(2);
    $('studioStore').textContent=(i.store||'Choose your store')+(i.store==='Newark, DE'?' · No sales tax':' · Before tax');
    const url=new URL(kiosk?'instore/':'gallery.html',location.href);if(kiosk){if(i.store)url.searchParams.set('store',i.store);}else url.searchParams.set('device',i.model.toLowerCase().replace(/^samsung /,'').replaceAll(' ','-'));$('studioBrowse').href=url.href;
    $('studioNext').textContent=step==='edit'?'Preview design →':step==='preview'?'Choose extras →':'Show at counter →';
    $('studioNext').disabled=!!i.issue;if($('studioStatus').textContent!==(i.issue||''))$('studioStatus').textContent=i.issue||'';
    noBackground.hidden=!$('photoLooksWrap').hidden;noBackground.textContent=i.hasPhoto?'This design uses its original background.':'Choose a design or photo to see its backgrounds.';
    adjustments.hidden=!i.hasPhoto||i.sky;adjustNote.hidden=i.hasPhoto&&!i.sky;
    $('editTools').style.display=i.hasPhoto&&!i.sky?'block':'none';
    adjustments.querySelectorAll('input').forEach(el=>{if(el!==document.activeElement)el.value=s[el.dataset.adjust];});
    const details=$('studioReviewDetails');details.replaceChildren();
    for(const [label,value] of [['Phone',i.model+' · '+i.finish],['Background',$('photoLookStatus').textContent],['Name',s.text||'No added name']]){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;details.append(dt,dd);}
    if(step==='edit'&&tool!=='adjust')$('stageCanvas').style.touchAction='pan-y';
  }
  function exit(){if(exiting)return;exiting=true;window.KPKioskSession?.retire();if(kiosk)document.documentElement.style.visibility='hidden';const fallback=new URL(kiosk?'instore/':'gallery.html',location.href);if(kiosk&&core.info().store)fallback.searchParams.set('store',core.info().store);const dest=$('studioBrowse')?.href||fallback.href;try{core.purge();}finally{location.replace(dest);}}
  function confirmExit(mode){const next=mode==='next',leave=mode===true;resetDialog.querySelector('h2').textContent=next?'Clear for the next customer?':leave?'Leave this design?':'Start a new design?';resetDialog.querySelector('p').textContent=next?'This clears the current design, name and extras from this screen.':leave?'Your design changes and selected extras will be cleared.':'Your current changes will be cleared.';$('studioConfirmReset').textContent=next?'Clear screen':leave?'Leave design':'Start over';$('studioCancelReset').textContent=next?'Cancel':'Keep designing';resetDialog.showModal();}
  $('studioBrowse').onclick=e=>{const s=core.snapshot(),i=core.info();if(s.text||s.px||s.py||s.rot||s.scale!==1||i.hasPhoto&&!i.library||i.hasExtras||!same(s,initialSnapshot)||i.model!==info.model||i.finish!==info.finish||i.store!==info.store||initialSetup!==null&&i.selectionKey!==initialSetup){e.preventDefault();confirmExit(true);}};
  $('studioReset').onclick=()=>confirmExit(false);$('studioCancelReset').onclick=()=>resetDialog.close();$('studioConfirmReset').onclick=exit;
  if(kiosk){
    warning=document.createElement('dialog');warning.id='studioIdle';warning.setAttribute('aria-labelledby','studioIdleTitle');warning.innerHTML='<h2 id="studioIdleTitle">Still designing?</h2><p>This screen will reset in 30 seconds to clear your details.</p><button type="button">Keep designing</button>';document.body.append(warning);
    warning.querySelector('button').onclick=arm;warning.addEventListener('cancel',e=>{e.preventDefault();arm();});
    const counterExpiry=document.createElement('p');counterExpiry.className='review-expiry';counterExpiry.textContent='Clears after 5 minutes without a touch.';$('reviewCode').after(counterExpiry);new MutationObserver(arm).observe($('counterReview'),{attributes:true,attributeFilter:['open']});
    $('saveCounterCard').hidden=true;if($('skySave'))$('skySave').hidden=true;
    // Shared screens never open a customer's file picker, even from empty-canvas taps.
    $('fileInput').disabled=true;
    state.expire=exit;
  }
  setStep('edit',false);remember();sync();
})();
