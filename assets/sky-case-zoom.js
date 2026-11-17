/* Inspect a snapshot of the case without changing the customer's print crop. */
window.KPSkyCaseZoom = {
  mount(stage, openButton, exampleButton, refreshStage) {
    const dialog = document.getElementById('skyZoomDialog');
    const viewport = dialog.querySelector('.zoom-scroll');
    const picture = viewport.querySelector('canvas');
    const levels = [1, 1.5, 2, 3];
    let level = 0;

    function resize(centerX = 0.5, centerY = 0.5) {
      const fit = Math.min(viewport.clientWidth / picture.width, viewport.clientHeight / picture.height);
      picture.style.width = Math.round(picture.width * fit * levels[level]) + 'px';
      viewport.scrollLeft = viewport.scrollWidth * centerX - viewport.clientWidth / 2;
      viewport.scrollTop = viewport.scrollHeight * centerY - viewport.clientHeight / 2;
      dialog.querySelector('output').value = levels[level] + '×';
      dialog.querySelector('[data-zoom="-1"]').disabled = level === 0;
      dialog.querySelector('[data-zoom="1"]').disabled = level === levels.length - 1;
    }

    function open(source, title) {
      if (dialog.open) return;
      let x = 0, y = 0, w = source.naturalWidth || source.width, h = source.naturalHeight || source.height;
      if (!w || !h) return;
      if (source === stage) {
        if (!refreshStage()) return;
        // The preview canvas includes transparent padding around each phone model.
        const rgba = stage.getContext('2d').getImageData(0, 0, w, h).data;
        let left = w, right = -1, top = h, bottom = -1;
        for (let row = 0; row < h; row += 4) {
          for (let col = 0; col < w; col += 4) {
            if (rgba[(row*w+col)*4+3] < 24) continue;
            left = Math.min(left,col); right = Math.max(right,col);
            top = Math.min(top,row); bottom = row;
          }
        }
        if (right < left) return;
        x = Math.max(0,left-8); y = Math.max(0,top-8);
        w = Math.min(w,right+9)-x; h = Math.min(h,bottom+9)-y;
      }
      picture.width = w; picture.height = h;
      picture.getContext('2d').drawImage(source,x,y,w,h,0,0,w,h);
      dialog.querySelector('strong').textContent = title;
      dialog.showModal();
      level = 1;
      resize();
    }

    dialog.querySelectorAll('[data-zoom]').forEach(button => button.onclick = () => {
      const cx = (viewport.scrollLeft + viewport.clientWidth/2) / viewport.scrollWidth;
      const cy = (viewport.scrollTop + viewport.clientHeight/2) / viewport.scrollHeight;
      level += Number(button.dataset.zoom);
      resize(cx,cy);
    });
    dialog.querySelector('[data-close]').onclick = () => dialog.close();
    dialog.addEventListener('close', () => { picture.width = picture.height = 0; });
    window.addEventListener('resize', () => { if (dialog.open) resize(); });
    openButton.onclick = () => open(stage,'Your case');
    exampleButton.onclick = () => open(exampleButton.querySelector('img'),'Finished example');

    let start;
    stage.addEventListener('pointerdown', e => {
      start = e.isPrimary && e.button === 0 ? [e.clientX,e.clientY] : null;
    });
    stage.addEventListener('pointermove', e => {
      if (start && Math.hypot(e.clientX-start[0],e.clientY-start[1]) > 5) start = null;
    });
    stage.addEventListener('pointercancel', () => { start = null; });
    stage.addEventListener('click', () => {
      if (start && !openButton.hidden) openButton.click();
      start = null;
    });
  }
};
