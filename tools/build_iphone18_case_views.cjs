// Reuse the owner's approved 17/18 clear-case geometry and photographed case.
// These SVG display components are not print templates. Finish simulation is
// restricted to the inner phone panels; the case rim, camera lip and lenses
// remain pixels from the photograph, never an invented stroke or empty shell.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const models = {
  pm: {
    panel: '<rect x="760" y="385" width="990" height="550" rx="170"/>',
    back: '<rect x="736" y="1020" width="1024" height="1615" rx="140"/>',
    openings: [[890,515,130],[1150,650,130],[890,790,130],[1616,507,53],[1616,801,50],[1616,654,7]]
  },
  p: {
    panel: '<rect x="804" y="472" width="890" height="550" rx="150"/>',
    back: '<rect x="780" y="1126" width="940" height="1415" rx="135"/>',
    openings: [[934,610,126],[1190,760,126],[934,890,126],[1570,610,53],[1570,900,51],[1570,750,8]]
  }
};
const finishes = {silver:null,black:[.43,.44,.46],glacier:[.90,1.02,1.10],burgundy:[.64,.40,.46]};
for (const [size, shape] of Object.entries(models)) {
  const source = 'i17'+size+'-silver.webp';
  const embedded = fs.readFileSync(path.join(root,'assets/cases',source)).toString('base64');
  for (const [finish, factors] of Object.entries(finishes)) {
    let defs='', overlay='';
    if (factors) {
      const matrix=factors.map((n,i)=>[i===0?n:0,i===1?n:0,i===2?n:0,0,0].join(' ')).join(' ')+' 0 0 0 1 0';
      defs=`<filter id="finish" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${matrix}"/></filter>
<filter id="soft-edge"><feGaussianBlur stdDeviation="1.5"/></filter>
<mask id="phone-panels" maskUnits="userSpaceOnUse" x="0" y="0" width="2500" height="3000"><g filter="url(#soft-edge)"><g fill="white">${shape.panel}${shape.back}</g><g fill="black">${shape.openings.map(([cx,cy,r])=>`<circle cx="${cx}" cy="${cy}" r="${r}"/>`).join('')}</g></g></mask>`;
      overlay='<use href="#photo" filter="url(#finish)" mask="url(#phone-panels)"/>';
    }
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="2500" height="3000" viewBox="0 0 2500 3000">
<title>Clear case on phone — ${finish} finish preview</title>
<desc>Photographed mounted clear case from ${source}; shared 17/18 fit approved by owner. Non-silver phone panels are illustrative finish simulations. Original transparent bumper, camera lip, lenses and buttons retained. Not a print template.</desc>
<defs>${defs}<image id="photo" width="2500" height="3000" href="data:image/webp;base64,${embedded}"/></defs>
<use href="#photo"/>${overlay}
</svg>\n`;
    fs.writeFileSync(path.join(root,'assets/cases',`i18${size}-${finish}.svg`),svg);
  }
}
console.log('Built 8 photographed clear-case display components; print masks unchanged.');
