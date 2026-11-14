(function(){
  'use strict';
  var products=KPSlates.products;
  var button=document.getElementById('showSelection'),counter=document.getElementById('counter');
  function selection(){var input=document.querySelector('input[name="slate"]:checked');return input&&products[input.value];}
  var next=document.getElementById('slateNext'), defaultNext=next.textContent;
  document.querySelectorAll('[data-slate-choice]').forEach(function (choice) {
    var input = document.querySelector('input[name="slate"][value="' + choice.dataset.slateChoice + '"]');
    if (!input || !products[input.value]) return;
    choice.hidden = false;
    choice.addEventListener('click', function () {
      input.checked = true;
      button.click();
    });
  });
  function render(){var item=selection();if(!item)return;next.textContent=item.artwork?'Show this code at the counter. Your selected park photograph is included.':defaultNext;document.getElementById('selectedProduct').textContent=item.label;document.getElementById('slateCode').textContent=item.code;document.getElementById('selectedPrice').textContent='$'+item.price.toFixed(2)+' before applicable tax';}
  button.hidden=false;
  button.addEventListener('click',function(){render();counter.hidden=false;document.getElementById('counterTitle').focus();counter.scrollIntoView({block:'start',behavior:'auto'});});
  document.querySelectorAll('input[name="slate"]').forEach(function(input){input.addEventListener('change',function(){if(!counter.hidden)render();});});
})();
