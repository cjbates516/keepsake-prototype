// Keep pick-code finish indices stable: append new names; retire removed names.
const fs=require('node:fs'),vm=require('node:vm');
const s=fs.readFileSync('customizer.html','utf8'),c={window:{}};vm.createContext(c);
vm.runInContext(fs.readFileSync('assets/phone-finishes.js','utf8'),c);c.KPPhoneFinishes=c.window.KPPhoneFinishes;
vm.runInContext(s.slice(s.indexOf('  var KITS ='),s.indexOf('  /* KP-RATED-KITS:')),c);
const file='instore/models.json',data=JSON.parse(fs.readFileSync(file));
for(const m of data.models){const kit=c.KITS[m.name]||c.KITS['Samsung '+m.name];if(!kit?.colors)throw Error('Missing finishes: '+m.name);const colors=kit.colors;
 const saved=(m.finishes||[]).map(old=>{const current=colors.find(x=>x.n===old.n);return current?{n:current.n,f:current.f}:{...old,retired:true};});
 for(const color of colors)if(!saved.some(x=>x.n===color.n))saved.push({n:color.n,f:color.f});m.finishes=saved;
}
fs.writeFileSync(file,JSON.stringify(data,null,1)+'\n');
