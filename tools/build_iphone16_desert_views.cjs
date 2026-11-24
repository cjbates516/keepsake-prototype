// Display-only finish simulation on the photographed phone. The clear rim,
// lens hardware and MagSafe ring stay unchanged; print masks are never edited.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../assets/cases');
const models={
 p:{body:[748,410,1004,2138,145],camera:[790,460,548,550,140],holes:[[932,586,120],[1196,726,120],[934,868,120],[1196,526,53],[1196,914,50]],ring:[1250,1514,352],bar:[1192,1945,116,296,58]},
 pm:{body:[700,300,1100,2358,160],camera:[752,362,550,556,140],holes:[[886,490,125],[1150,634,125],[886,770,128],[1150,430,55],[1150,830,52]],ring:[1250,1470,352],bar:[1192,1904,116,300,58]}
};
const rect=([x,y,w,h,r])=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/>`;
for(const [size,m] of Object.entries(models)){
 const photo=fs.readFileSync(path.join(root,`i16${size}-titan.webp`)).toString('base64');
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="2500" height="3000" viewBox="0 0 2500 3000"><title>iPhone 16 ${size==='p'?'Pro':'Pro Max'} in Desert Titanium, illustrative finish</title><defs><image id="photo" width="2500" height="3000" href="data:image/webp;base64,${photo}"/><filter id="desert" color-interpolation-filters="sRGB"><feColorMatrix values="1.09 0 0 0 0 0 .96 0 0 0 0 0 .84 0 0 0 0 0 1 0"/></filter><mask id="phone" maskUnits="userSpaceOnUse" x="0" y="0" width="2500" height="3000"><g fill="white">${rect(m.body)}</g><rect x="680" y="280" width="710" height="780" rx="150" fill="black"/><g fill="white">${rect(m.camera)}</g><g fill="black">${m.holes.map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}${rect(m.bar)}</g><circle cx="${m.ring[0]}" cy="${m.ring[1]}" r="${m.ring[2]}" stroke="black" stroke-width="100" fill="none"/></mask></defs><use href="#photo"/><use href="#photo" filter="url(#desert)" mask="url(#phone)"/></svg>`;
 fs.writeFileSync(path.join(root,`i16${size}-desert.svg`),svg);
}
