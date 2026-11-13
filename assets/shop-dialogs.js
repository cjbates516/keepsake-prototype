/* Keyboard support for the existing phone selectors; no customer data storage. */
(function(){
  'use strict';
  var configs=[['kpDevDrawer','kpDevScrim'],['kpSheet','kpSheetScrim']];
  function attach(ids){
    var panel=document.getElementById(ids[0]),scrim=document.getElementById(ids[1]);
    if(!panel||!scrim||panel.dataset.keyboardReady)return;
    panel.dataset.keyboardReady='true';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Choose your phone');
    var opened=false,previous=null;
    function controls(){return Array.from(panel.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),a[href]')).filter(function(e){return e.getClientRects().length>0;});}
    function sync(){
      var visible=ids[0]==='kpSheet'?panel.style.display==='flex':panel.style.transform==='translateX(0px)'||panel.style.transform==='translateX(0)';
      panel.inert=!visible;panel.setAttribute('aria-hidden',String(!visible));
      if(visible&&!opened){previous=document.activeElement;opened=true;panel.setAttribute('aria-modal','true');var first=controls()[0];if(first)first.focus();}
      else if(!visible&&opened){opened=false;panel.removeAttribute('aria-modal');if(previous&&previous.isConnected)previous.focus();}
    }
    new MutationObserver(sync).observe(panel,{attributes:true,attributeFilter:['style']});sync();
    panel.addEventListener('keydown',function(e){
      if(!opened)return;
      if(e.key==='Escape'){e.preventDefault();scrim.click();return;}
      if(e.key==='Tab'){var items=controls(),first=items[0],last=items[items.length-1];if(!first){e.preventDefault();return;}if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
    });
  }
  function scan(){configs.forEach(attach);}scan();
  new MutationObserver(scan).observe(document.body,{childList:true});
})();
