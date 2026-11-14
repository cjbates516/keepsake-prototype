(function () {
  'use strict';
  var products = {
    small: {code:'SL-46', label:'4 × 6 inch photo slate', price:29.99, width:4, height:6},
    medium: {code:'SL-5979', label:'5.9 × 7.9 inch photo slate', price:39.99, width:5.9, height:7.9},
    large: {code:'SL-810', label:'8 × 10 inch photo slate', price:49.99, width:8, height:10},
    bundle: {code:'SL-PAIR', label:'Holiday pair · two 4 × 6 inch photo slates', price:49.99, width:4, height:6}
  };
  window.KPSlates = {products:products, byCode:function (value) {
    var code=String(value || '').trim().toUpperCase().replace(/[\s_.\u2010-\u2015\u2212-]+/g,'');
    return Object.values(products).find(function (item) {return item.code.replace('-','')===code;});
  }};
}());
