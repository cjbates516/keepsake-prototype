/* Use the same price as the builder. Keep kiosk entries on their in-store journey. */
(() => {
  const price=window.KP_CONFIG?.RATED_PRICE;
  if(Number.isFinite(price))document.querySelectorAll('[data-frost-price]').forEach(node=>{
    node.textContent=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(price);
  });
  const entry=new URL(location.href);
  if(entry.searchParams.get('kiosk')!=='1')return;
  document.querySelectorAll('.make-personal a[href*="customizer.html"]').forEach(link=>{
    const target=new URL(link.href);target.searchParams.set('kiosk','1');
    const store=entry.searchParams.get('store');
    if(['West Chester, PA','Pottstown, PA','Newark, DE'].includes(store))target.searchParams.set('store',store);
    link.href=target.href;
  });
})();
