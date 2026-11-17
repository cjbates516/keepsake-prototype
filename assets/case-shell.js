// Device silhouette bounds in the existing 2500 × 3000 mockup coordinate system.
// The clear material comes from the store scan. The model photo supplies its controls.
window.KPCaseShell = (() => {
  const bounds = {
    "iPhone 17 Pro Max": [640, 278, 1856, 2722],
    "iPhone 17 Pro": [682, 372, 1816, 2628],
    "iPhone 17": [684, 374, 1812, 2626],
    "iPhone Air": [662, 326, 1834, 2674],
    "iPhone 16 Pro Max": [640, 260, 1858, 2704],
    "iPhone 16 Pro": [686, 352, 1810, 2602],
    "iPhone 16": [684, 374, 1814, 2590],
    "iPhone 15 Pro Max": [690, 340, 1832, 2688],
    "iPhone 15 Pro": [728, 468, 1782, 2602],
    "iPhone 15": [714, 436, 1806, 2614],
    "iPhone 13 Pro Max": [730, 466, 1772, 2536],
    "iPhone 13 Pro": [772, 558, 1730, 2446],
    "iPhone 13": [772, 556, 1730, 2446],
    "iPhone 13 mini": [818, 652, 1684, 2350],
    "iPhone 12 Pro Max": [726, 464, 1776, 2540],
    "iPhone 12 Pro": [770, 556, 1732, 2448],
    "iPhone 12": [770, 556, 1732, 2448],
    "iPhone 12 mini": [818, 652, 1684, 2350],
    "iPhone 14 Pro Max": [718, 444, 1782, 2556],
    "iPhone 14 Pro": [760, 534, 1740, 2466],
    "iPhone 14 Plus": [732, 452, 1798, 2552],
    "iPhone 14": [762, 536, 1740, 2464],
    "iPhone 15 Plus": [664, 326, 1848, 2712],
    "iPhone 16 Plus": [640, 274, 1856, 2682],
    "Galaxy S26": [642, 254, 1856, 2745],
    "Galaxy S26 Plus": [642, 254, 1856, 2745],
    "Galaxy S26 Ultra": [640, 264, 1858, 2735],
    "iPhone 18 Pro": [682, 372, 1816, 2628],
    "iPhone 18 Pro Max": [640, 276, 1858, 2724]
  };
  const bumper = new Image();
  bumper.src = 'assets/cases/clear-bumper.webp';
  const cameraLip = new Image();
  cameraLip.src = 'assets/cases/wide-camera-lip.webp';
  const ready = Promise.allSettled([bumper.decode(), cameraLip.decode()]);
  let samplePhoto;
  function sampleReady() {
    if (!samplePhoto) {
      samplePhoto = new Image();
      samplePhoto.src = 'assets/cases/sample-clear-15pm.webp';
    }
    return samplePhoto.decode();
  }

  // Printable face traced directly on the 15 Pro Max scan, in source coordinates.
  const sampleFace = new Path2D('M431 215 L496 217 Q537 217 536 256 L528 696 Q528 738 494 740 L326 737 Q291 737 292 698 L297 354 Q307 370 339 370 L398 371 Q444 371 446 325 L448 258 Q449 231 431 215 Z');
  function drawSample(canvas, art) {
    const ctx = canvas.getContext('2d');
    const scale = canvas.height * .92 / 577;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate((canvas.width - 304*scale)/2, (canvas.height - 577*scale)/2);
    ctx.scale(scale, scale);
    ctx.translate(-266, -187);
    ctx.drawImage(samplePhoto, 266, 187, 304, 577);
    ctx.clip(sampleFace);
    ctx.translate(418, 478);
    ctx.rotate(.014);
    const fit = Math.max(246/art.width, 531/art.height);
    ctx.drawImage(art, -art.width*fit/2, -art.height*fit/2, art.width*fit, art.height*fit);
    ctx.restore();
  }
  function box(model) {
    return bounds[(model || '').replace(/^Samsung /, '')];
  }
  function draw(ctx, model, width, height, style = 'MagSafe Clear') {
    const b = box(model);
    // Galaxy and hybrid kit photos already include their fitted case hardware.
    if (!b || /Galaxy/.test(model) || style !== 'MagSafe Clear' || !bumper.naturalWidth) return;
    const [left, top, right, bottom] = b;
    const w = right - left, h = bottom - top;
    // Position the inner bevel over the phone's outer edge, away from the ink.
    const x = left - w * .047, y = top - w * .048;
    const outerW = w * 1.094, outerH = h + w * .096;
    ctx.save();
    ctx.scale(width / 2500, height / 3000);
    ctx.drawImage(bumper,x,y,outerW,outerH);
    if (/^iPhone (17|18) Pro/.test(model) && cameraLip.naturalWidth) {
      const lipX=left+w*.026, lipY=top+h*.015, lipW=w*.948;
      const lipH=h*(model.endsWith('Max') ? .253 : .271);
      // Keep the photographed bends round when fitting the wide camera plateau.
      const srcCap=cameraLip.width*.32, cap=lipH*.30;
      const src=[0,srcCap,cameraLip.width-srcCap,cameraLip.width];
      const dst=[0,cap,lipW-cap,lipW];
      for (let i=0;i<3;i++) {
        ctx.drawImage(cameraLip,src[i],0,src[i+1]-src[i],cameraLip.height,
          lipX+dst[i],lipY,dst[i+1]-dst[i],lipH);
      }
    }
    ctx.restore();
  }
  return {ready, box, draw, sampleReady, drawSample};
})();
