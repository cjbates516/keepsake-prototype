const fs=require('node:fs'), path=require('node:path'), vm=require('node:vm'), assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const ctx={window:{},setTimeout,clearTimeout,AbortController,fetch:async url=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path.resolve(root,'instore',url),'utf8'))})};
for(const file of ['assets/colorway-catalog.js','assets/design-colorways.js','instore/instore-lib.js']){vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);Object.assign(ctx,ctx.window);}
(async()=>{
 const k=ctx.window.KPI,d=await k.load();let count=0;
 for(const m of d.activeModels){
  const seen=new Set();
  for (const design of d.designsFor(m)) {
   const profile = ctx.window.KP_COLORWAY_CATALOG[design.file];
   const choices = k.colorways(design);
   const expected = profile?.method === 'yosemite' ? 7 : profile?.originalColor ? 5 : 6;
   assert.equal(choices.length, expected, 'Unprepared colorways: ' + design.file);
   for (const color of choices) {
   const code=k.pickCode(m,design,color.id);assert.ok(code,'Active design has no stable pick code');
   assert.ok(!seen.has(code),'Duplicate pick code '+code);seen.add(code);
   const parsed=k.parseCode(code);assert.ok(parsed,'Cannot parse '+code);
   assert.equal(parsed.model,m.id);assert.equal(parsed.col,design._col.code);assert.equal(parsed.n,design._n);assert.equal(parsed.colorway||0,color.code||0);
   const bundled=k.pickCode(m,design,color.id,true);
   assert.equal(bundled,code+'-G');
   assert.deepEqual(k.parseCode(bundled),Object.assign(parsed,{glass:true}));
   count++;
   }
  }
 }
 assert.equal(k.parseCode('17PABC3',d.activeModels.map(m=>m.id)).n,3);assert.equal(k.parseCode('17PFLR012C3',d.activeModels.map(m=>m.id)).colorway,3);
 console.log(JSON.stringify({activeModels:d.activeModels.length,activeDesigns:d.designs.length,uniqueParseableModelDesignCodes:count,price:d.price,idleSeconds:d.idleMs/1000},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
