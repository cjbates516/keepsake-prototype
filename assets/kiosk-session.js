/* A cleared shared-screen session must not reopen from browser history. */
(() => {
  const params=new URLSearchParams(location.search);
  if(params.get('kiosk')!=='1')return;
  const key='kpRetiredKioskSessions';
  function retired(){try{const ids=JSON.parse(sessionStorage.getItem(key)||'[]');return Array.isArray(ids)?ids.filter(x=>typeof x==='string'):[];}catch(_){return [];}}
  let id=params.get('kioskSession');
  if(id&&retired().includes(id)){
    document.documentElement.style.visibility='hidden';
    const target=new URL('instore/',location.href),store=params.get('store');
    if(['West Chester, PA','Pottstown, PA','Newark, DE'].includes(store))target.searchParams.set('store',store);
    location.replace(target.href);return;
  }
  if(!id){id=globalThis.crypto?.randomUUID?.()||(Date.now().toString(36)+Math.random().toString(36).slice(2));const url=new URL(location.href);url.searchParams.set('kioskSession',id);history.replaceState(history.state,'',url);}
  window.KPKioskSession={retire(){try{sessionStorage.setItem(key,JSON.stringify([...new Set([...retired(),id])].slice(-100)));}catch(_){/* In-memory purge still runs when browser storage is unavailable. */}}};
})();
