(function(){
  'use strict';
  var menu=document.getElementById('mobileMenu');
  if(!menu)return;
  menu.addEventListener('click',function(e){
    var link=e.target.closest('a');
    if(!link)return;
    menu.open=false;
    var href=link.getAttribute('href');
    if(href&&href.charAt(0)==='#'){
      var target=document.getElementById(href.slice(1));
      if(target){target.setAttribute('tabindex','-1');target.focus({preventScroll:true});}
    }
  });
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'&&menu.open){menu.open=false;menu.querySelector('summary').focus();}
  });
})();
