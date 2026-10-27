/**
 * Keepsake order backend (Google Apps Script web app)
 *
 * What it does
 *   - Receives an order from customizer.html: print PNG, preview, model, blank, preset, pickup store, customer
 *   - Saves the print file and preview to a private Drive folder
 *   - Appends one row per order to a Google Sheet (the queue of record)
 *   - Serves the queue to staff.html (PIN protected), and lets staff mark Printed / Picked Up
 *   - Deletes print files 90 days after pickup (daily trigger)
 *
 * One time setup (about 10 minutes, from the Google account that owns the Drive)
 *   1. Go to script.google.com, New project, name it "Keepsake Orders".
 *   2. Replace the default code with this file. Save.
 *   3. Run the function `setup` once (Run menu). Approve the permissions prompt.
 *      It creates the Drive folder "Keepsake Orders" with "Print Files" inside, the "Keepsake Orders" sheet,
 *      sets a random staff PIN, and installs the daily cleanup trigger. The PIN is printed in the log (View, Logs).
 *   4. Deploy, New deployment, type Web app. Execute as: Me. Who has access: Anyone. Deploy.
 *      Copy the Web app URL.
 *   5. Paste that URL into assets/kp-config.js as KP_ORDERS_ENDPOINT. Commit and push.
 *   6. Open /staff.html on the site, enter the PIN once per device.
 *   To change the PIN later: run `setPin` after editing the value inside it, or edit Script Properties.
 */

var FOLDER_NAME = 'Keepsake Orders';
var PRINT_SUBFOLDER = 'Print Files';
var SHEET_NAME = 'Keepsake Orders';
var RETENTION_DAYS = 90;

var COLS = ['id','created','status','store','model','caseType','preset','name','phone','optIn','ownsPhoto',
            'printFileId','previewFileId','notes','printedAt','pickedUpAt','deletedAt','source'];

/* ───────────── setup ───────────── */
function setup(){
  var p = PropertiesService.getScriptProperties();
  var root = getOrCreateFolder_(DriveApp.getRootFolder(), FOLDER_NAME);
  var prints = getOrCreateFolder_(root, PRINT_SUBFOLDER);
  p.setProperty('ROOT_FOLDER_ID', root.getId());
  p.setProperty('PRINT_FOLDER_ID', prints.getId());

  var ssId = p.getProperty('SHEET_ID');
  var ss;
  if(ssId){ try{ ss = SpreadsheetApp.openById(ssId); }catch(e){ ss=null; } }
  if(!ss){
    ss = SpreadsheetApp.create(SHEET_NAME);
    DriveApp.getFileById(ss.getId()).moveTo(root);
    p.setProperty('SHEET_ID', ss.getId());
  }
  var sh = ss.getSheets()[0];
  if(sh.getLastRow() === 0){
    sh.appendRow(COLS);
    sh.setFrozenRows(1);
  }
  if(!p.getProperty('STAFF_PIN')){
    var pin = String(Math.floor(1000 + Math.random()*9000));
    p.setProperty('STAFF_PIN', pin);
  }
  // daily cleanup trigger (idempotent)
  var has = ScriptApp.getProjectTriggers().some(function(t){ return t.getHandlerFunction()==='cleanupOldFiles'; });
  if(!has) ScriptApp.newTrigger('cleanupOldFiles').timeBased().everyDays(1).atHour(3).create();

  Logger.log('Setup complete.');
  Logger.log('Staff PIN: ' + p.getProperty('STAFF_PIN'));
  Logger.log('Sheet: ' + ss.getUrl());
  Logger.log('Drive folder: ' + root.getUrl());
}

function setPin(){
  // edit the value, run once, then put it back to '' if you like
  var NEW_PIN = '';
  if(!NEW_PIN) throw new Error('Set NEW_PIN inside setPin() first');
  PropertiesService.getScriptProperties().setProperty('STAFF_PIN', NEW_PIN);
}

/* ───────────── HTTP ───────────── */
function doGet(e){
  var q = (e && e.parameter) || {};
  try{
    if(q.action === 'ping') return out_({ ok:true, service:'keepsake-orders' });
    if(!checkPin_(q.pin)) return out_({ error:'bad pin' });
    if(q.action === 'list')  return out_({ ok:true, orders: listOrders_(Number(q.days)||14) });
    if(q.action === 'file')  return out_(fileAsBase64_(q.id, 'print'));
    if(q.action === 'preview') return out_(fileAsBase64_(q.id, 'preview'));
    return out_({ error:'unknown action' });
  }catch(err){ return out_({ error:String(err && err.message || err) }); }
}

function doPost(e){
  var lock = LockService.getScriptLock();
  try{
    lock.waitLock(20000);
    var body = {};
    try{ body = JSON.parse(e.postData.contents || '{}'); }catch(_){ return out_({ error:'bad json' }); }
    if(body.action === 'status'){
      if(!checkPin_(body.pin)) return out_({ error:'bad pin' });
      return out_(setStatus_(body.id, body.status, body.by));
    }
    if(body.action === 'order') return out_(createOrder_(body));
    return out_({ error:'unknown action' });
  }catch(err){ return out_({ error:String(err && err.message || err) }); }
  finally{ try{ lock.releaseLock(); }catch(_){} }
}

/* ───────────── orders ───────────── */
function createOrder_(b){
  var model = clean_(b.model, 60), store = clean_(b.store, 40), preset = clean_(b.preset, 20);
  var name = clean_(b.name, 60), phone = clean_(b.phone, 30).replace(/[^0-9+]/g,'');
  if(!model || !store || !preset) return { error:'missing model, store or preset' };
  if(!name || phone.length < 10) return { error:'name and a 10 digit phone number are required' };
  if(!b.printPng) return { error:'missing print file' };
  if(!b.ownsPhoto) return { error:'photo ownership not confirmed' };

  var p = PropertiesService.getScriptProperties();
  var prints = DriveApp.getFolderById(p.getProperty('PRINT_FOLDER_ID'));
  var id = nextId_();
  var slug = model.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

  var printBlob = Utilities.newBlob(Utilities.base64Decode(stripDataUrl_(b.printPng)), 'image/png',
                    id + '-' + slug + '-' + preset.toLowerCase().replace(/\s+/g,'-') + '.png');
  var printFile = prints.createFile(printBlob);
  var previewId = '';
  if(b.previewJpg){
    var prevBlob = Utilities.newBlob(Utilities.base64Decode(stripDataUrl_(b.previewJpg)), 'image/jpeg', id + '-preview.jpg');
    previewId = prints.createFile(prevBlob).getId();
  }

  var sh = sheet_();
  var row = {
    id:id, created:new Date().toISOString(), status:'New', store:store, model:model,
    caseType:clean_(b.caseType, 40) || 'MagSafe Clear', preset:preset, name:name, phone:phone,
    optIn: b.optIn ? 'Yes' : 'No', ownsPhoto:'Yes',
    printFileId:printFile.getId(), previewFileId:previewId, notes:clean_(b.notes, 300),
    printedAt:'', pickedUpAt:'', deletedAt:'', source:clean_(b.source, 20) || 'web'
  };
  sh.appendRow(COLS.map(function(c){ return row[c]; }));
  return { ok:true, id:id, store:store, model:model, preset:preset };
}

function listOrders_(days){
  var sh = sheet_();
  var last = sh.getLastRow(); if(last < 2) return [];
  var vals = sh.getRange(2, 1, last-1, COLS.length).getValues();
  var cutoff = Date.now() - days*86400000;
  var out = [];
  for(var i=vals.length-1; i>=0; i--){
    var r = rowObj_(vals[i]);
    if(r.status === 'Deleted') continue;
    var t = Date.parse(r.created);
    if(r.status === 'Picked Up' && t < cutoff) continue;
    delete r.ownsPhoto;
    r.row = i + 2;
    out.push(r);
    if(out.length >= 300) break;
  }
  return out;
}

function setStatus_(id, status, by){
  var allowed = { 'New':1, 'Printed':1, 'Picked Up':1 };
  if(!allowed[status]) return { error:'bad status' };
  var sh = sheet_();
  var last = sh.getLastRow(); if(last < 2) return { error:'not found' };
  var ids = sh.getRange(2, 1, last-1, 1).getValues();
  for(var i=0;i<ids.length;i++){
    if(String(ids[i][0]) === String(id)){
      var rowN = i + 2;
      sh.getRange(rowN, COLS.indexOf('status')+1).setValue(status);
      var now = new Date().toISOString();
      if(status === 'Printed')   sh.getRange(rowN, COLS.indexOf('printedAt')+1).setValue(now);
      if(status === 'Picked Up') sh.getRange(rowN, COLS.indexOf('pickedUpAt')+1).setValue(now);
      if(by) { var n = sh.getRange(rowN, COLS.indexOf('notes')+1); n.setValue(((n.getValue()||'') + ' [' + status + ' by ' + clean_(by,30) + ']').trim()); }
      return { ok:true, id:id, status:status };
    }
  }
  return { error:'not found' };
}

function fileAsBase64_(id, kind){
  var sh = sheet_();
  var last = sh.getLastRow(); if(last < 2) return { error:'not found' };
  var vals = sh.getRange(2, 1, last-1, COLS.length).getValues();
  for(var i=0;i<vals.length;i++){
    var r = rowObj_(vals[i]);
    if(String(r.id) === String(id)){
      var fid = kind === 'preview' ? r.previewFileId : r.printFileId;
      if(!fid) return { error:'no file' };
      var f = DriveApp.getFileById(fid);
      var blob = f.getBlob();
      return { ok:true, id:id, name:f.getName(), mime:blob.getContentType(), b64:Utilities.base64Encode(blob.getBytes()) };
    }
  }
  return { error:'not found' };
}

/* ───────────── cleanup: 90 days after pickup ───────────── */
function cleanupOldFiles(){
  var sh = sheet_();
  var last = sh.getLastRow(); if(last < 2) return;
  var vals = sh.getRange(2, 1, last-1, COLS.length).getValues();
  var cutoff = Date.now() - RETENTION_DAYS*86400000;
  for(var i=0;i<vals.length;i++){
    var r = rowObj_(vals[i]);
    if(r.status !== 'Picked Up' || r.deletedAt) continue;
    var t = Date.parse(r.pickedUpAt || r.created);
    if(!(t < cutoff)) continue;
    [r.printFileId, r.previewFileId].forEach(function(fid){ if(fid){ try{ DriveApp.getFileById(fid).setTrashed(true); }catch(_){} } });
    var rowN = i + 2;
    sh.getRange(rowN, COLS.indexOf('status')+1).setValue('Deleted');
    sh.getRange(rowN, COLS.indexOf('deletedAt')+1).setValue(new Date().toISOString());
    sh.getRange(rowN, COLS.indexOf('printFileId')+1).setValue('');
    sh.getRange(rowN, COLS.indexOf('previewFileId')+1).setValue('');
  }
}

/* ───────────── helpers ───────────── */
function sheet_(){
  var id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if(!id) throw new Error('Run setup() first');
  return SpreadsheetApp.openById(id).getSheets()[0];
}
function rowObj_(arr){ var o={}; COLS.forEach(function(c,i){ o[c]=arr[i]; }); return o; }
function checkPin_(pin){ var want = PropertiesService.getScriptProperties().getProperty('STAFF_PIN'); return !!want && String(pin||'') === String(want); }
function clean_(s, n){ return String(s==null?'':s).replace(/[\u0000-\u001f<>]/g,'').trim().slice(0, n||100); }
function stripDataUrl_(s){ s=String(s); var i=s.indexOf('base64,'); return i>=0 ? s.slice(i+7) : s; }
function nextId_(){
  var p = PropertiesService.getScriptProperties();
  var n = Number(p.getProperty('ORDER_SEQ')||'1000') + 1;
  p.setProperty('ORDER_SEQ', String(n));
  return 'KP-' + n;
}
function getOrCreateFolder_(parent, name){
  var it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}
function out_(obj){
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
