/* Local retail calendar. Existing counter codes still resolve all year. */
window.KPSeason = (() => {
  function holiday(item) {
    const s=[item.category,item.title,item.file].join(' ').toLowerCase();
    if (/halloween|jack[- ]o[- ]lantern|trick[- ]or[- ]treat/.test(s)) return 'Halloween';
    if (/christmas|santa[- ](?:claus|hat)|yuletide/.test(s)) return 'Christmas';
    return '';
  }
  function visible(item, date=new Date()) {
    const season=holiday(item), month=date.getMonth()+1;
    return season==='Halloween'?month===10:season==='Christmas'?month>=11:true;
  }
  function updateLinks(){
    document.querySelectorAll('a[href]').forEach(a=>{
      const u=new URL(a.href,location.href);
      if(u.origin!==location.origin)return;
      const h=holiday({category:u.searchParams.get('cat')||'',file:u.searchParams.get('design')||''});
      if(h&&!visible({category:h}))a.hidden=true;
    });
  }
  if(typeof document==='undefined')return {visible};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',updateLinks);else updateLinks();
  return {visible};
})();
