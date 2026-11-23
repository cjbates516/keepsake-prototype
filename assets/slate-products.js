(function () {
  'use strict';
  // Width and height are stored in portrait order. Natural edges vary from blank to blank.
  var small = {width:3.5, height:5.625, sizeLabel:'5⅝ × 3½', printWidth:3.25, printHeight:5.375};
  var medium = {width:5.375, height:7.375, sizeLabel:'7⅜ × 5⅜', printWidth:5.125, printHeight:7.125};
  var large = {width:8, height:10, sizeLabel:'10 × 8', printWidth:7.625, printHeight:9.625};
  var products = {
    small: {code:'SL-46', label:'5⅝ × 3½ inch photo slate', price:29.99, ...small},
    medium: {code:'SL-5979', label:'7⅜ × 5⅜ inch photo slate', price:39.99, ...medium},
    large: {code:'SL-810', label:'10 × 8 inch photo slate', price:49.99, ...large},
    yosemite: {code:'SL-810-YOS', label:'Yosemite Valley · 10 × 8 inch landscape slate', price:49.99, ...large,
      artwork:'../assets/photos/slates/yosemite-valley-print.jpg'},
    yellowstone: {code:'SL-810-YEL', label:'Yellowstone · Grand Prismatic Spring · 10 × 8 inch landscape slate',
      price:49.99, ...large, artwork:'../assets/photos/slates/yellowstone-landscape-print.jpg'},
    zion: {code:'SL-810-ZIO', label:'Zion · Towers of the Virgin · 10 × 8 inch landscape slate',
      price:49.99, ...large, artwork:'../assets/photos/slates/zion-landscape-print.jpg'},
    teton: {code:'SL-810-TET', label:'Grand Teton · Snake River Overlook · 10 × 8 inch landscape slate',
      price:49.99, ...large, artwork:'../assets/photos/slates/teton-landscape-print.jpg'},
    canyon: {code:'SL-810-GCN', label:'Grand Canyon · Powell Point Sunset · 10 × 8 inch landscape slate',
      price:49.99, ...large, artwork:'../assets/photos/slates/canyon-landscape-print.jpg'},
    rocky: {code:'SL-810-RMT', label:'Rocky Mountain · Sprague Lake · 10 × 8 inch landscape slate',
      price:49.99, ...large, artwork:'../assets/photos/slates/rocky-landscape-print.jpg'},
    smokies: {code:'SL-810-GSM', label:'Great Smoky Mountains · Oconaluftee Sunrise · 10 × 8 inch landscape slate',
      price:49.99, ...large, artwork:'../assets/photos/slates/smokies-landscape-print.jpg'},
    acadia: {code:'SL-810-ACD', label:'Acadia · Jordan Pond at Sunset · 10 × 8 inch landscape slate',
      price:49.99, ...large, artwork:'../assets/photos/slates/acadia-landscape-print.jpg'},
    joshua: {code:'SL-810-JTR', label:'Joshua Tree · Cholla Garden at Sunset · 10 × 8 inch landscape slate',
      price:49.99, ...large, artwork:'../assets/photos/slates/joshua-landscape-print.jpg'},
    olympic: {code:'SL-810-OLY', label:'Olympic · Lake Crescent Reflections · 10 × 8 inch landscape slate',
      price:49.99, ...large, artwork:'../assets/photos/slates/olympic-landscape-print.jpg', creditSlip:'../assets/photos/slates/olympic-photo-credit.pdf'},
    glacier: {code:'SL-810-GLA', label:'Glacier · Lake McDonald Reflections · 10 × 8 inch landscape slate',
      price:49.99, ...large, artwork:'../assets/photos/slates/glacier-landscape-print.jpg'},
    redwood: {code:'SL-810-RED', label:'Redwood · Coastal Redwood Grove · 10 × 8 inch landscape slate',
      price:49.99, ...large, artwork:'../assets/photos/slates/redwood-landscape-print.jpg'},
    shenandoah: {code:'SL-810-SHN', label:'Shenandoah · Shenandoah Valley in Fall · 10 × 8 inch landscape slate',
      price:49.99, ...large, artwork:'../assets/photos/slates/shenandoah-landscape-print.jpg'},
    bundle: {code:'SL-PAIR', label:'Holiday pair · two 5⅝ × 3½ inch photo slates', price:49.99, ...small}
  };
  window.KPSlates = {products:products, byCode:function (value) {
    var code=String(value || '').trim().toUpperCase().replace(/[\s_.\u2010-\u2015\u2212-]+/g,'');
    return Object.values(products).find(function (item) {return item.code.replace(/-/g,'')===code;});
  }};
}());
