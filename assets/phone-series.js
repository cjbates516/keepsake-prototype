/* Shared phone families and series → model controls. No customer data is stored. */
(function(){
  'use strict';
  function seriesFor(name){
    var short=name.replace(/^(Samsung |Google |Motorola )/,'');
    var numbered=short.match(/^(iPhone \d+|Galaxy S\d+|Pixel \d+)/);
    if(numbered)return numbered[1]+' series';
    if(/^Galaxy A/.test(short))return 'Galaxy A series';
    if(/^moto /i.test(short))return short.replace(/ \d{4}$/,'').replace(/^moto/i,'Moto')+' series';
    return short;
  }
  function brandFor(name){return /^iPhone/.test(name)?'Apple':/^(Samsung |Galaxy )/.test(name)?'Samsung':/^(Google |Pixel )/.test(name)?'Google':'Motorola';}
  function mount(host,options){
    var items=options.items,brand=options.brand||items[0]?.brand,series='',query='';
    host.classList.add('kp-series-picker');host.replaceChildren();
    var nav=document.createElement('nav');nav.className='kp-series-brands';nav.setAttribute('aria-label','Phone brand');
    var label=document.createElement('label');label.className='kp-series-search';label.textContent='Find your model';
    var search=document.createElement('input');search.type='search';search.placeholder='Search all phones…';search.setAttribute('aria-label','Search all phones');label.append(search);
    var back=document.createElement('button');back.type='button';back.className='kp-series-back';back.textContent='← All series';
    var title=document.createElement('h3');title.tabIndex=-1;
    var grid=document.createElement('div');grid.className='kp-series-grid';
    var status=document.createElement('p');status.className='kp-series-status';status.setAttribute('role','status');
    host.append(nav,label,back,title,grid,status);
    [...new Set(items.map(i=>i.brand))].forEach(b=>{var button=document.createElement('button');button.type='button';button.textContent=b;button.dataset.seriesBrand=b;button.addEventListener('click',()=>{brand=b;series='';query='';search.value='';render();});nav.append(button);});
    function render(){
      var words=query.toLowerCase().trim().split(/\s+/).filter(Boolean);
      var matching=items.filter(i=>words.length?words.every(w=>i.name.toLowerCase().includes(w)):i.brand===brand&&(!series||seriesFor(i.name)===series));
      nav.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(!words.length&&b.dataset.seriesBrand===brand)));
      back.hidden=!series||!!words.length;title.textContent=words.length?'Search results':series?'Choose your '+series.replace(/ series$/,'')+' model.':'Choose your series.';
      grid.replaceChildren();
      if(!words.length&&!series){
        [...new Set(matching.map(i=>seriesFor(i.name)))].forEach(s=>{var b=document.createElement('button');b.type='button';b.dataset.series=s;var name=document.createElement('span'),arrow=document.createElement('span');name.textContent=s;arrow.textContent='→';arrow.setAttribute('aria-hidden','true');b.append(name,arrow);b.addEventListener('click',()=>{series=s;render();title.focus({preventScroll:true});title.scrollIntoView({block:'nearest'});});grid.append(b);});
      }else matching.forEach(item=>{var b=document.createElement('button');b.type='button';b.dataset.seriesModel=item.name;b.textContent=item.name;b.disabled=!!item.disabled;b.setAttribute('aria-pressed',String(item.name===options.selected));b.addEventListener('click',()=>options.onSelect(item));grid.append(b);});
      status.textContent=matching.length?(words.length?matching.length+' matching phones':''):'No matching phones. Try “16 Pro” or “Pixel”.';
    }
    back.addEventListener('click',()=>{var previous=series;series='';render();[...grid.children].find(b=>b.dataset.series===previous)?.focus();});
    search.addEventListener('input',()=>{query=search.value;series='';render();});render();
    return {reset:function(){series='';query='';search.value='';render();}};
  }
  // Native select forms retain their existing values and submit/change handlers.
  function enhanceSelect(select){
    if(select.dataset.seriesReady)return;select.dataset.seriesReady='true';
    var all=[...select.options].filter(o=>o.value).map(o=>({value:o.value,name:o.textContent,disabled:o.disabled,group:seriesFor(o.textContent.replace(/ · check availability$/,''))}));
    var initial=select.value,chooser=document.createElement('select');chooser.id=select.id+'Series';chooser.className='kp-series-select';chooser.setAttribute('aria-label','Phone series');
    chooser.add(new Option('Choose your series',''));
    [...new Set(all.map(o=>o.group))].forEach(s=>chooser.add(new Option(s,s)));
    var label=document.createElement('label');label.htmlFor=chooser.id;label.textContent='Phone series';label.className='kp-series-select-label';
    var oldLabel=document.querySelector('label[for="'+select.id+'"]'),seriesField=document.createElement('div'),modelField=document.createElement('div');seriesField.className=modelField.className='kp-series-native-field';select.before(seriesField,modelField);seriesField.append(label,chooser);if(oldLabel)modelField.append(oldLabel);modelField.append(select);
    var submit=select.closest('form')?.querySelector('[type=submit]');function syncSubmit(){if(submit)submit.disabled=!select.value;}select.addEventListener('change',syncSubmit);
    function filter(value){select.replaceChildren(new Option('Choose your model',''));all.filter(o=>o.group===chooser.value).forEach(o=>{var option=new Option(o.name,o.value);option.disabled=o.disabled;select.add(option);});select.disabled=!chooser.value;select.value=value||'';}
    chooser.value=all.find(o=>o.value===initial)?.group||'';filter(initial);syncSubmit();
    chooser.addEventListener('change',()=>{filter('');select.dispatchEvent(new Event('change',{bubbles:true}));});
  }
  window.KPPhoneSeries={seriesFor:seriesFor,brandFor:brandFor,mount:mount,enhanceSelect:enhanceSelect};
})();
