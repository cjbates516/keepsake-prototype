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
  const hero = document.querySelector('.case-edit');
  if (!hero) return;
  const slides = Array.from(hero.querySelectorAll('.case-slide'));
  const status = hero.querySelector('[aria-live]');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const header = document.querySelector('.home-header');
  const announcement = document.querySelector('.announcement');
  let current = 0;
  let timer, start;
  let visible = true, stopped = false, suppressClick = false;

  function measureHeader() {
    hero.style.setProperty('--hero-header', (header.offsetHeight + announcement.offsetHeight) + 'px');
  }
  measureHeader();
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(measureHeader);
    observer.observe(header);
    observer.observe(announcement);
  }
  function schedule() {
    clearTimeout(timer);
    if (!stopped && !motion.matches && visible && !document.hidden) {
      timer = setTimeout(() => advance(1, false), 6500);
    }
  }
  function cycleColor(slide) {
    if (!slide.dataset.altArt) return;
    const link = slide.querySelector('.case-story');
    const art = slide.querySelector('.scene-art');
    const label = slide.querySelector('.campaign-shop');
    const url = new URL(link.href);
    const previous = [art.getAttribute('href').split('/').pop(), url.searchParams.get('colorway'), label.textContent];
    art.setAttribute('href', 'assets/home/case-edit/' + slide.dataset.altArt);
    url.searchParams.set('colorway', slide.dataset.altVariant);
    link.href = url.href;
    label.textContent = slide.dataset.altLabel;
    [slide.dataset.altArt, slide.dataset.altVariant, slide.dataset.altLabel] = previous;
  }
  function advance(step, manual) {
    const previous = slides[current];
    previous.hidden = true;
    current = (current + step + slides.length) % slides.length;
    const next = slides[current];
    next.hidden = false;
    if (manual) {
      stopped = true;
      status.textContent = next.getAttribute('aria-label');
    } else {
      cycleColor(previous);
    }
    schedule();
  }
  hero.addEventListener('keydown', event => {
    const step = {ArrowRight: 1, ArrowLeft: -1}[event.key];
    if (step) {
      event.preventDefault();
      advance(step, true);
      slides[current].querySelector('a').focus({preventScroll:true});
    }
    if (event.key === ' ') {
      event.preventDefault();
      stopped = !stopped;
      schedule();
    }
  });
  hero.addEventListener('focusin', () => { stopped = true; schedule(); });
  hero.addEventListener('touchstart', event => {
    suppressClick = false;
    start = event.touches.length === 1 ? event.touches[0] : null;
  }, {passive:true});
  hero.addEventListener('touchcancel', () => { start = null; });
  hero.addEventListener('touchend', event => {
    if (!start) return;
    const dx = event.changedTouches[0].clientX - start.clientX;
    const dy = event.changedTouches[0].clientY - start.clientY;
    start = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      suppressClick = true;
      advance(dx < 0 ? 1 : -1, true);
    }
  }, {passive:true});
  hero.addEventListener('click', event => {
    if (suppressClick && event.detail) { event.preventDefault(); suppressClick = false; }
  }, true);
  hero.addEventListener('pointerdown', () => { suppressClick = false; });
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', schedule);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      schedule();
    }).observe(hero);
  }
  schedule();
})();
