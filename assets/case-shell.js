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
  function box(model) {
    return bounds[(model || '').replace(/^Samsung /, '')];
  }
  // The device mockups already include the photographed clear-case edges and
  // camera lip. Keep those visible; the old scanned overlay looked black and
  // empty-case mode removed the phone cameras entirely. These no-op adapters
  // keep older callers compatible without changing any print geometry.
  const ready = Promise.resolve();
  function canShowEmpty() { return false; }
  function drawEmpty() { return false; }
  function draw() {}
  return {ready, box, draw, canShowEmpty, drawEmpty};
})();
