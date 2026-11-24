/* Supported iPhone 16 Pro finishes, shared by gallery and editor.
   Names: https://support.apple.com/en-us/121031 . Swatches are screen approximations. */
window.KPPhoneFinishes={apply(kits){
 for(const [model,key] of [['iPhone 16 Pro','i16p'],['iPhone 16 Pro Max','i16pm']]){
  if(!kits[model])continue;
  kits[model].colors=[
   {n:'Black Titanium',h:'#3C3C3D',f:key+'-black.webp'},
   {n:'White Titanium',h:'#F2F1ED',f:key+'-silver.webp'},
   {n:'Natural Titanium',h:'#B1AAA1',f:key+'-titan.webp'},
   {n:'Desert Titanium',h:'#BFA58D',f:key+'-desert.svg'}
  ];
 }
}};
