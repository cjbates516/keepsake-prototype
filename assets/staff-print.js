(function(){
  'use strict';
  if(!document.documentElement.classList.contains('staff-mode'))return;
  var api=window.__kp;if(!api)return;var busy=false,lastIssue='',lastSignature='',lastImage=null,customerGeneration=0;
  document.title='Print workspace — Keepsake';document.getElementById('photoPrivacy').textContent='Photos stay on this device while you prepare the print.';
  var top=document.createElement('div');top.className='staff-top';top.innerHTML='<div><strong>Keepsake · Print workspace</strong><small>Prepare locally. Take payment at the counter.</small></div><a href="instore/find.html">Next customer →</a>';document.body.prepend(top);document.getElementById('clearBtn').addEventListener('click',function(){customerGeneration++;busy=false;});function clearCustomer(){document.getElementById('clearBtn').click();document.getElementById('fileInput').value='';}top.querySelector('a').addEventListener('click',clearCustomer);['browseLink','chooseReady'].forEach(function(id){document.getElementById(id).addEventListener('click',clearCustomer);});window.addEventListener('pagehide',clearCustomer);
  var box=document.createElement('section');box.className='staff-summary';box.innerHTML='<h2>Print details</h2><dl><dt>Selection</dt><dd id="spPurchase"></dd><dt>Glass</dt><dd><label><input type="checkbox" id="spGlass"> Include tempered glass</label></dd><dt>Case + selected glass, before tax</dt><dd id="spSubtotal"></dd><dt>Phone</dt><dd id="spModel"></dd><dt>Artwork</dt><dd id="spArt"></dd><dt>Colorway</dt><dd id="spLook"></dd><dt>Print size</dt><dd id="spSize"></dd><dt>Preset</dt><dd id="spPreset"></dd></dl><p>Transparent PNG · 300 DPI · includes edge allowance. Verify the physical blank.</p><details><summary>Before you print</summary><ol><li>Compare the customer’s screen with this file. Confirm the phone, blank, crop, any name or other extras, and the final price together.</li><li>Check the crop, camera opening, name spelling and colorway.</li><li>Import the PNG into xTool Studio and confirm both dimensions match the size shown above. Choose “Keep size” if prompted. Do not use “fit to page” or add a background.</li><li>Use the matching jig and the printer’s validated preset. Confirm alignment before the first print for a blank.</li></ol><p>Download prepares a file; it does not send anything to the printer or mark an order paid.</p></details>';document.getElementById('stageStick').appendChild(box);
  var dock=document.createElement('div');dock.className='staff-dock';dock.innerHTML='<p id="spStatus" role="status">Choose artwork or add a name, then download the print PNG.</p><button id="spDownload" type="button">Download print PNG</button>';document.body.appendChild(dock);
  function put(id,text){document.getElementById(id).textContent=text;}
  function signature(){var s=api.state;return JSON.stringify([s.model,s.caseType,s.variant,s.text,s.textFont,s.textColor,s.textSize,s.textPos,s.textVertical,s.px,s.py,s.scale,s.rot,s.fitMode,s.filter,s.layout]);}
  function refresh(){var s=api.state,spec=api.printSpec(),file=s.isLibraryDesign&&s.photoUrl?s.photoUrl.split('/').pop():null,options=window.KPDesignColorways.choicesFor(s.photoImg),look=options.find(function(x){return x.id===s.variant;});var issue=api.printIssue();document.getElementById('spDownload').disabled=busy||!!issue;if(!busy&&(issue!==lastIssue||signature()!==lastSignature||s.photoImg!==lastImage)){put('spStatus',issue||'Ready to download. Confirm the crop and phone with the customer.');lastIssue=issue;lastSignature=signature();lastImage=s.photoImg;}glass.checked=!!s.addons.screen;put('spPurchase',s.addons.screen?'Case + tempered glass':'Case only');put('spSubtotal','$'+(api.orderPricing().base+(s.addons.screen?KP_CONFIG.bundledGlass:0)).toFixed(2));put('spModel',s.handoffError?'Choose a valid phone at the print counter':s.model);put('spArt',file?file.replace(/\.[^.]+$/,'').replace(/^kp-/,'').replace(/-/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase();}):s.photoImg?'Customer photo':s.text?'Name only':'Add artwork');put('spLook',look?look.name:'Original');put('spSize',s.handoffError?'Resolve the handoff before printing':spec?spec.w+' × '+spec.h+' px · '+(spec.w/300*25.4).toFixed(2)+' × '+(spec.h/300*25.4).toFixed(2)+' mm':'Template not available');put('spPreset',api.preset());}
  var glass=document.getElementById('spGlass');
  glass.checked=api.state.addons.screen;
  glass.addEventListener('change',function(){document.querySelector('#addons [data-k=screen]').click();refresh();});
  refresh();setInterval(refresh,500);
  document.getElementById('spDownload').addEventListener('click',function(){
    if(busy)return;
    var button=this,started=false,generation=customerGeneration;
    var preparedSignature=signature(),preparedImage=api.state.photoImg;
    busy=true;button.disabled=true;
    function current(){return generation===customerGeneration;}
    function unchanged(){return preparedSignature===signature()&&preparedImage===api.state.photoImg&&!api.printIssue();}
    function cleanup(){if(current()){busy=false;refresh();}}
    function fail(error){if(current())put('spStatus',error&&error.message==='Print contains no visible artwork. Adjust the image or add a name.'?error.message:'The PNG could not be prepared. Try again.');}
    try{
      var result=api.buildPrint(function(canvas,name){
        started=true;if(!current())return;
        lastSignature=preparedSignature;lastImage=preparedImage;
        put('spStatus','Preparing your print PNG…');
        var filename;
        Promise.resolve().then(function(){
          var s=api.state,tag=s.isLibraryDesign&&s.photoUrl?s.photoUrl.split('/').pop().replace(/\.[^.]+$/,''):'custom';
          tag=tag.replace(/[^a-z0-9-]/gi,'').slice(0,90);
          var variant=String(s.variant||'original').replace(/[^a-z0-9-]/gi,'').slice(0,40);
          filename=name.replace(/\.png$/i,'')+'-'+tag+'-'+variant+'.png';
          return KPPrintPng.encode(canvas);
        }).then(function(blob){
          if(!current())return;
          if(!unchanged()){lastSignature=signature();lastImage=api.state.photoImg;lastIssue=api.printIssue();put('spStatus','Artwork changed. Review the current design and download again.');return;}
          if(!(blob instanceof Blob))throw new Error('Invalid PNG output');
          var url=URL.createObjectURL(blob),a=document.createElement('a');
          try{a.href=url;a.download=filename;a.click();}finally{setTimeout(function(){URL.revokeObjectURL(url);},60000);}
          put('spStatus','PNG prepared and download started. Open it in your print software at the dimensions shown.');
        }).catch(fail).finally(cleanup);
      });
      if(result===false&&!started){cleanup();put('spStatus','Print is not ready. Check the artwork and any message above, then try again.');}
    }catch(error){fail(error);cleanup();}
  });
})();
