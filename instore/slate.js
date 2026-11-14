(function () {
  'use strict';
  const el = id => document.getElementById(id);
  const product = el('product'), file = el('file'), preview = el('preview'), save = el('save');
  let photo = null, loadVersion = 0, revision = 0, busy = false;
  const requested = new URLSearchParams(location.search).get('code');
  for (const item of Object.values(KPSlates.products)) {
    product.add(new Option(item.label, item.code));
  }
  const selected = () => KPSlates.byCode(product.value);
  function message(text) { el('status').textContent = text; }
  function clearPhoto(keepFile) {
    loadVersion++;
    revision++;
    photo = null;
    if (!keepFile) file.value = '';
    el('caption').value = '';
    el('x').value = el('y').value = 50;
    el('zoom').value = 100;
    el('approved').checked = false;
    preview.width = preview.height = 1;
    preview.hidden = true;
    save.disabled = true;
  }
  function selectSlate() {
    clearPhoto();
    const item = selected();
    el('job').disabled = !item;
    el('orientation').value = item?.artwork ? 'landscape' : 'portrait';
    el('width').value = el('height').value = '';
    el('price').textContent = item ? item.code + ' · $' + item.price.toFixed(2) + ' before applicable tax' : '';
    el('creditSlip').hidden = !item?.creditSlip;
    if (item?.creditSlip) el('creditDownload').href = item.creditSlip;
    else el('creditDownload').removeAttribute('href');
    el('reloadPark').hidden = !item?.artwork;
    message(item === KPSlates.products.bundle ? 'Prepare each of the two 4 × 6 prints. Clear the photo between different images.' : '');
    if (item?.artwork) loadParkPhoto(item);
  }
  function loadParkPhoto(item) {
    const version = loadVersion;
    const image = new Image();
    image.src = item.artwork;
    image.decode().then(() => {
      if (version !== loadVersion) return;
      photo = image;
      refresh();
    }).catch(() => {
      if (version === loadVersion) message('The selected photograph could not load. Use Reload park photo to try again.');
    });
  }
  el('reloadPark').addEventListener('click', () => {
    const item = selected();
    if (item?.artwork) {
      clearPhoto();
      loadParkPhoto(item);
    }
  });
  function dimensions() {
    const item = selected(), landscape = el('orientation').value === 'landscape';
    const width = el('width').valueAsNumber, height = el('height').valueAsNumber;
    if (!item || !el('width').validity.valid || !el('height').validity.valid ||
        !(width > 0 && height > 0) || (landscape ? width <= height : height <= width)) return null;
    return {width: Math.round(width * 300), height: Math.round(height * 300)};
  }
  function paint(canvas, size, scale) {
    canvas.width = Math.max(1, Math.round(size.width * scale));
    canvas.height = Math.max(1, Math.round(size.height * scale));
    const w = canvas.width, h = canvas.height, ctx = canvas.getContext('2d');
    const factor = Math.max(w / photo.naturalWidth, h / photo.naturalHeight) * Number(el('zoom').value) / 100;
    const dw = photo.naturalWidth * factor, dh = photo.naturalHeight * factor;
    ctx.drawImage(photo, (w - dw) * el('x').value / 100, (h - dh) * el('y').value / 100, dw, dh);
    const caption = el('caption').value.trim();
    if (caption) {
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = 'bold ' + Math.max(1, Math.round(Math.min(w,h) * 0.056)) + 'px system-ui';
      ctx.fillStyle = 'rgba(0,0,0,.76)';ctx.fillRect(0,h*.81,w,h*.12);
      ctx.fillStyle = 'white';ctx.fillText(caption,w*.5,h*.87,w*.88);
    }
  }
  function refresh() {
    const size = dimensions();
    const ready = !!(size && photo);
    preview.hidden = !ready;
    if (ready) paint(preview, size, Math.min(1, 650 / Math.max(size.width,size.height)));
    save.disabled = busy || !ready || !el('approved').checked;
    if (!photo) return;
    if (!size) { message('Enter the verified print area in inches, in the selected orientation.'); return; }
    const dpi = 300 * Math.min(photo.naturalWidth / size.width, photo.naturalHeight / size.height) * 100 / el('zoom').value;
    const landscape = el('orientation').value==='landscape', item=selected();
    const exceedsNominal=size.width>Math.round(300*(landscape?item.height:item.width)) || size.height>Math.round(300*(landscape?item.width:item.height));
    message((exceedsNominal?'The entered area exceeds the listed blank size. Double-check the template. ':'')+size.width+' × '+size.height+' px at 300 DPI.'+(dpi<150?' This crop has limited detail. Review sharpness or choose a larger original.':''));
  }
  product.addEventListener('change', selectSlate);
  product.value = (KPSlates.byCode(requested) || {}).code || '';
  selectSlate();
  if (requested && !selected()) message('Unrecognized slate code. Check the customer’s selection.');
  file.addEventListener('change', async () => {
    const original = file.files[0];
    clearPhoto(true);
    if (!original) { message('Choose a JPG or PNG.'); return; }
    const token = loadVersion, local = URL.createObjectURL(original), image = new Image();
    message('Opening photo…');
    try {
      image.src = local; await image.decode();
      if (token !== loadVersion) return;
      photo = image; refresh();
    } catch (_) { if (token === loadVersion) message('Could not read this photo. Choose a JPG or PNG copy.'); }
    finally { URL.revokeObjectURL(local); }
  });
  el('orientation').addEventListener('change', () => {
    const width = el('width').value;
    el('width').value = el('height').value; el('height').value = width;
    el('approved').checked = false; revision++; refresh();
  });
  for (const id of ['width','height','x','y','zoom','caption','approved']) {
    el(id).addEventListener(id==='approved'?'change':'input', () => {
      if (id !== 'approved') el('approved').checked = false;
      revision++; refresh();
    });
  }
  el('clear').addEventListener('click', () => { clearPhoto();message('Photo cleared.'); });
  window.addEventListener('pagehide', () => clearPhoto());
  window.addEventListener('pageshow', event => { if (event.persisted) selectSlate(); });
  save.addEventListener('click', async () => {
    const size = dimensions(), version = revision;
    if (busy || !photo || !size || !el('approved').checked) return;
    busy = true; save.disabled = true;
    const output = document.createElement('canvas');
    try {
      paint(output,size,1);
      const blob = await KPPrintPng.encode(output);
      if (version !== revision) { if(photo)message('The crop or selection changed. Review it and download again.');return; }
      const link = document.createElement('a'), url = URL.createObjectURL(blob);
      link.href=url;link.download=product.value+'-'+Date.now()+'.png';
      document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
      message('PNG prepared at '+size.width+' × '+size.height+' px. Verify its size in the print software.');
    } catch (_) { if (version===revision) message('Could not prepare the PNG. Review the photo and try again.'); }
    finally {output.width=output.height=1;busy=false;save.disabled=!photo||!dimensions()||!el('approved').checked;}
  });
}());
