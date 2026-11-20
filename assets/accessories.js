/* Shared in-store accessory selection. Retail snapshot; staff confirms availability. */
(function(){
  'use strict';
  if(!Array.isArray(window.KP_ACCESSORY_CATALOG)||!window.KP_ACCESSORY_CATALOG.length)return;
  var catalog=window.KP_ACCESSORY_CATALOG, script=document.currentScript;
  var root=new URL('../',script.src).href;
  var API=window.KPAccessories={};
  API.items=catalog;
  API.stores=['West Chester, PA','Pottstown, PA','Newark, DE'];
  API.price=function(x,store){return x.prices&&x.prices[store]!=null?x.prices[store]:x.price;};
  API.available=function(x,store){return !x.availableStores||x.availableStores.indexOf(store)>=0;};
  API.get=function(id){return catalog.find(function(x){return x.id===id;});};
  API.parse=function(value){var ids=Array.isArray(value)?value:String(value||'').split(',').filter(Boolean);return Array.from(new Set(ids.filter(function(id){return !!API.get(id);}))).sort();};
  API.valid=function(ids){return Array.isArray(ids)&&ids.every(function(id){return !!API.get(id);});};
  API.total=function(ids,store){return Math.round(API.parse(ids).reduce(function(n,id){return n+API.price(API.get(id),store);},0)*100)/100;};
  API.label=function(x){return x.name+(x.option?' · '+x.option:'');};
  API.compatible=function(x,model){
    var name=String(model||'').replace(/-/g,' '),match=name.match(/iPhone\s+(\d+)/i);
    var connector=match&&Number(match[1])<15?'lightning':'usb-c';
    if(x.connector==='tablet')return false;
    if(x.connector==='iphone-12')return /^iPhone 12$/i.test(name);
    return x.connector==='any'||x.connector===connector;
  };
  function el(tag,text,cls){var n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;}
  API.mount=function(host,options){
    var ids=API.parse(options.selected),model=options.model||'',store=options.store==null?'':options.store,category='Recommended',choices={},expanded=false,checkedModel=false;
    var heading=el('h3','Make it a complete setup'),intro=el('p','Pick your extras now. Pay with our team in store.','ka-intro');
    var notice=el('p','','ka-status');notice.setAttribute('role','status');
    var tabs=el('div',null,'ka-tabs');tabs.setAttribute('aria-label','Accessory categories');tabs.setAttribute('role','group');
    var grid=el('div',null,'ka-grid'),selected=el('div',null,'ka-selected');selected.setAttribute('aria-live','polite');selected.tabIndex=-1;
    var more=el('button','Explore all accessories','ka-more');more.type='button';
    var checked=new Date(catalog[0].stockChecked+'T12:00:00Z').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'});
    var foot=el('p','1-year limited warranty. Keep your receipt and ask our team about coverage and exclusions. Prices and availability checked '+checked+'. Our team confirms stock before purchase.','ka-foot');
    var warranty=el('a','Accessory warranty help');warranty.href=new URL('help.html#accessory-warranty',root).href;if(!options.kiosk)foot.append(document.createTextNode(' '),warranty);
    host.classList.add('ka');host.append(heading,intro,selected,tabs,grid,more,notice,foot);
    var cats=['Recommended','Cables','Wall chargers','Car chargers','Wireless','Audio','More'];
    function change(){options.onChange(ids.slice());}
    function toggle(id){var x=API.get(id);if(ids.indexOf(id)>=0)ids=ids.filter(function(i){return i!==id;});else{ids=ids.filter(function(i){return API.get(i).group!==x.group;});ids.push(id);ids.sort();}draw();change();}
    function draw(){
      if(!store){intro.textContent='Choose your store above to see accessories and local pricing.';grid.replaceChildren();tabs.replaceChildren();selected.replaceChildren();more.hidden=true;return;}
      intro.textContent='Extras for '+store+'. Pay with our team in store.';
      var focused=document.activeElement, focusKey=host.contains(focused)?(focused.dataset.accessory?'[data-accessory="'+focused.dataset.accessory+'"]':focused.dataset.group?'[data-group="'+focused.dataset.group+'"]':focused.dataset.category?'[data-category="'+focused.dataset.category+'"]':focused.dataset.remove?'[data-accessory="'+focused.dataset.remove+'"]':null):null;
      tabs.replaceChildren();cats.forEach(function(cat){var b=el('button',cat);b.type='button';b.dataset.category=cat;b.setAttribute('aria-pressed',String(cat===category));b.onclick=function(){category=cat;expanded=cat!=='Recommended';draw();};tabs.append(b);});
      selected.replaceChildren();ids.forEach(function(id){var x=API.get(id),row=el('div'),label=el('span',API.label(x)+' · $'+API.price(x,store).toFixed(2)+(API.available(x,store)?'':' · ask staff about availability here')+(API.compatible(x,model)?'':' · check phone compatibility')),b=el('button','Remove');b.type='button';b.dataset.remove=id;b.setAttribute('aria-label','Remove '+API.label(x));b.onclick=function(){toggle(id);};row.append(label,b);selected.append(row);});
      var filtered=catalog.filter(function(x){return API.available(x,store)&&API.compatible(x,model)&&(category==='Recommended'||x.category===category);});
      if(category==='Recommended'){var priority=['X47','X25','X48','X06','X02','X44','X21','X41'];filtered.sort(function(a,b){var ai=priority.indexOf(a.id),bi=priority.indexOf(b.id);return (ai<0?99:ai)-(bi<0?99:bi);});}
      var groups=[];filtered.forEach(function(x){var g=groups.find(function(g){return g[0].group===x.group;});if(g)g.push(x);else groups.push([x]);});
      more.hidden=expanded||groups.length<=4;grid.replaceChildren();
      (expanded?groups:groups.slice(0,4)).forEach(function(variants){
        variants.sort(function(a,b){return (parseFloat(a.option)||0)-(parseFloat(b.option)||0);});
        var g=variants[0].group,id=choices[g]||ids.find(function(id){return variants.some(function(x){return x.id===id;});}),x=variants.find(function(x){return x.id===id;})||variants[0];
        var card=el('article',null,'ka-card'),photo=el('img');photo.src=new URL(x.image,root).href;photo.alt=x.name;photo.loading='lazy';photo.width=360;photo.height=300;photo.onerror=function(){photo.hidden=true;};
        var title=el('h4',x.name),desc=el('p',x.description,'ka-desc'),price=el('strong','$'+API.price(x,store).toFixed(2),'ka-price');
        card.append(photo,title,desc);
        if(variants.length>1){var select=el('select');select.dataset.group=g;select.setAttribute('aria-label',x.name+' option');variants.forEach(function(v){var o=el('option',v.option+' · $'+API.price(v,store).toFixed(2));o.value=v.id;o.selected=v.id===x.id;select.append(o);});select.onchange=function(){choices[g]=select.value;draw();};card.append(select);}else if(x.option)card.append(el('p',x.option,'ka-option'));
        var groupSelected=ids.find(function(id){return API.get(id).group===x.group;});
        if(groupSelected&&groupSelected!==x.id)card.append(el('p',(API.get(groupSelected).option||API.get(groupSelected).name)+' is in your setup.','ka-option'));
        var b=el('button',ids.indexOf(x.id)>=0?'Added ✓':groupSelected?'Switch to this option':'Add to my setup','ka-add');b.type='button';b.dataset.accessory=x.id;b.setAttribute('aria-pressed',String(ids.indexOf(x.id)>=0));b.onclick=function(){toggle(x.id);};card.append(price,b);grid.append(card);
      });
      if(!groups.length)grid.append(el('p','Ask our team for accessories for this device.'));
      if(focusKey){var next=host.querySelector(focusKey);if(next)next.focus({preventScroll:true});else if(focused.dataset.remove)selected.focus({preventScroll:true});}
    }
    more.onclick=function(){var oldCount=grid.children.length;expanded=true;draw();var next=grid.children[oldCount]||grid.children[0];if(next){var button=next.querySelector('button');if(button)button.focus();}};draw();
    return {setStore:function(value){if((value!==''&&API.stores.indexOf(value)<0)||store===value)return;store=value;if(!store){ids=[];draw();change();}else draw();},setModel:function(value){if(checkedModel&&model===value)return;checkedModel=true;model=value;var old=ids.length;ids=ids.filter(function(id){return options.keepIncompatible||API.compatible(API.get(id),model);});notice.textContent=old!==ids.length?'We removed accessories that do not match this phone.':'';if(options.onNotice)options.onNotice(notice.textContent);draw();if(old!==ids.length)change();},reset:function(){ids=[];choices={};category='Recommended';expanded=false;notice.textContent='';draw();change();},selected:function(){return ids.slice();}};
  };
})();
