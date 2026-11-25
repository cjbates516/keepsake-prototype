(() => {
 'use strict';
 const select=document.getElementById('arrivalCategory'),cards=[...document.querySelectorAll('#arrivalGrid .fresh-card')],more=document.getElementById('arrivalMore'),status=document.getElementById('arrivalCount'),collection=document.getElementById('arrivalCollection');
 if(!select||!cards.length)return;
 const q=new URLSearchParams(location.search);if([...select.options].some(o=>o.value===q.get('cat')))select.value=q.get('cat');
 let limit=12,rim='smoke';
 function render(){const matching=cards.filter(c=>select.value==='All'||c.dataset.category===select.value);cards.forEach(c=>c.hidden=!matching.includes(c)||matching.indexOf(c)>=limit);const shown=Math.min(limit,matching.length);status.textContent=shown+' of '+matching.length+' new designs · Tap a case to choose your phone.';more.hidden=shown>=matching.length;more.textContent='Show '+Math.min(12,matching.length-shown)+' more';collection.href='gallery.html'+(select.value==='All'?'':'?cat='+encodeURIComponent(select.value));collection.textContent=select.value==='All'?'Explore the full design library →':'Explore all '+select.value+' →';}
 select.addEventListener('change',()=>{limit=12;const url=new URL(location.href);if(select.value==='All')url.searchParams.delete('cat');else url.searchParams.set('cat',select.value);history.replaceState(null,'',url);render();});
 more.addEventListener('click',()=>{const previous=limit;limit+=12;render();const visible=cards.filter(c=>!c.hidden);visible[previous]?.querySelector('a').focus({preventScroll:true});});
 document.querySelectorAll('[data-rim]').forEach(button=>button.addEventListener('click',()=>{rim=button.dataset.rim;const label=rim==='clear'?'Clear Frost':'Smoke Frost';document.querySelectorAll('[data-rim]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));cards.forEach(c=>{const im=c.querySelector('img');im.src='assets/new-arrivals/'+c.dataset.art+'--'+rim+'.webp';im.alt=c.querySelector('h2').textContent+' on a '+label+' case';c.querySelectorAll('a[href^="gallery.html"]').forEach(a=>{const url=new URL(a.href);url.searchParams.set('rim',label);a.href=url.pathname.split('/').pop()+url.search;});});}));
 render();
})();
