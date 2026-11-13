(function(){
  'use strict';
  var products={small:{label:'4 × 6 inch photo slate',price:29.99},medium:{label:'5.9 × 7.9 inch photo slate',price:39.99},large:{label:'8 × 10 inch photo slate',price:49.99},bundle:{label:'Holiday pair · two 4 × 6 inch photo slates',price:49.99}};
  var button=document.getElementById('showSelection'),counter=document.getElementById('counter');
  function selection(){var input=document.querySelector('input[name="slate"]:checked');return input&&products[input.value];}
  function render(){var item=selection();if(!item)return;document.getElementById('selectedProduct').textContent=item.label;document.getElementById('selectedPrice').textContent='$'+item.price.toFixed(2)+' before applicable tax';}
  button.hidden=false;
  button.addEventListener('click',function(){render();counter.hidden=false;document.getElementById('counterTitle').focus();counter.scrollIntoView({block:'start',behavior:'auto'});});
  document.querySelectorAll('input[name="slate"]').forEach(function(input){input.addEventListener('change',function(){if(!counter.hidden)render();});});
})();
