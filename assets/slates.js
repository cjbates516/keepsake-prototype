(function(){
  'use strict';
  var products=KPSlates.products;
  var button=document.getElementById('showSelection'),counter=document.getElementById('counter');
  function selection(){var input=document.querySelector('input[name="slate"]:checked');return input&&products[input.value];}
  var next=document.getElementById('slateNext'), defaultNext=next.textContent;
  var choose=document.getElementById('chooseYosemite');
  choose.hidden=false;
  choose.addEventListener('click',function(){
    document.querySelector('input[value="yosemite"]').checked=true;
    button.click();
  });
  function render(){var item=selection();if(!item)return;next.textContent=item.artwork?'Show this code at the counter. Your Yosemite Valley photograph is included.':defaultNext;document.getElementById('selectedProduct').textContent=item.label;document.getElementById('slateCode').textContent=item.code;document.getElementById('selectedPrice').textContent='$'+item.price.toFixed(2)+' before applicable tax';}
  button.hidden=false;
  button.addEventListener('click',function(){render();counter.hidden=false;document.getElementById('counterTitle').focus();counter.scrollIntoView({block:'start',behavior:'auto'});});
  document.querySelectorAll('input[name="slate"]').forEach(function(input){input.addEventListener('change',function(){if(!counter.hidden)render();});});
})();
