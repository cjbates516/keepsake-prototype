(function(){
  'use strict';
  var menu=document.getElementById('mobileMenu');
  if(!menu)return;
  menu.addEventListener('click',function(e){
    var link=e.target.closest('a');
    if(!link)return;
    menu.open=false;
    var href=link.getAttribute('href');
    if(href&&href.charAt(0)==='#'){
      var target=document.getElementById(href.slice(1));
      if(target){target.setAttribute('tabindex','-1');target.focus({preventScroll:true});}
    }
  });
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'&&menu.open){menu.open=false;menu.querySelector('summary').focus();}
  });
})();

(function () {
  'use strict';
  const edit = document.querySelector('.case-edit');
  if (!edit) return;
  const slides = Array.from(edit.querySelectorAll('.case-slide'));
  const controls = edit.querySelector('.edit-controls'), toggle = controls.querySelector('[data-edit="play"]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0, playing = !reduce.matches, onscreen = false, hovering = false, timer, start;
  function schedule() {
    clearTimeout(timer);
    toggle.textContent = playing ? 'Ⅱ' : '▷';
    toggle.setAttribute('aria-label',playing ? 'Pause slideshow' : 'Play slideshow');
    if (playing && onscreen && !hovering && !document.hidden) timer = setTimeout(() => show(1, false), 6500);
  }
  function show(step, manual) {
    slides[index].hidden = true;
    index = (index + step + slides.length) % slides.length;
    slides[index].hidden = false;
    if (manual) { playing = false; edit.querySelector('.edit-status').textContent = slides[index].getAttribute('aria-label'); }
    schedule();
  }
  function stop() { playing = false; schedule(); }
  for (const picker of edit.querySelectorAll('.scene-picks')) {
    const slide = picker.closest('.case-slide');
    const link = slide.querySelector('.case-story');
    picker.addEventListener('click', event => {
      const choice = event.target.closest('button[data-variant]');
      if (!choice) return;
      stop();
      const url = new URL(link.href);
      url.searchParams.set('colorway', choice.dataset.variant);
      link.href = url.href;
      slide.querySelector('.scene-art').setAttribute('href', 'assets/home/case-edit/' + choice.dataset.art);
      slide.querySelector('.scene-name').textContent = choice.textContent;
      for (const button of picker.querySelectorAll('button')) {
        button.setAttribute('aria-pressed', String(button === choice));
      }
    });
    picker.hidden = false;
  }
  controls.hidden = false;
  controls.addEventListener('click', e => {
    const key=e.target.closest('button')?.dataset.edit;
    if (key==='play') { playing=!playing; schedule(); } else if(key) show(key==='prev'?-1:1,true);
  });
  // Stop when a shopper tabs in; do not take focus away from the product link.
  edit.addEventListener('focusin', e => { if(e.target.matches(':focus-visible')) stop(); });
  edit.addEventListener('pointerenter', e=>{ if(e.pointerType==='mouse'){hovering=true;schedule();} });
  edit.addEventListener('pointerleave', ()=>{hovering=false;schedule();});
  const win = edit.querySelector('.edit-window');
  let suppressClick=false;
  win.addEventListener('touchstart', e=>{suppressClick=false;const t=e.touches[0];start=e.touches.length===1?{x:t.clientX,y:t.clientY}:null;},{passive:true});
  win.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch')suppressClick=false;});
  win.addEventListener('touchcancel',()=>{start=null;});
  win.addEventListener('touchend', e=>{
    if(!start)return;
    const dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;start=null;
    if(Math.abs(dx)>45 && Math.abs(dx)>Math.abs(dy)*1.5){suppressClick=true;show(dx<0?1:-1,true);}
  },{passive:true});
  win.addEventListener('click',e=>{if(suppressClick&&e.detail){e.preventDefault();suppressClick=false;}},true);
  reduce.addEventListener('change',()=>{if(reduce.matches)stop();});
  document.addEventListener('visibilitychange', schedule);
  if ('IntersectionObserver' in window) new IntersectionObserver(entries=>{onscreen=entries[0].isIntersecting;schedule();},{threshold:.25}).observe(edit);
  else onscreen=true;
  schedule();
})();
