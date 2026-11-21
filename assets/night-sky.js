/* Positions from the Yale Bright Star Catalogue V/50 (J2000, V <= 5).
   Mean sidereal time and equatorial precession use Meeus, Astronomical Algorithms.
   The chart looks up, with east on the left. All personalization stays local. */
window.KPNightSky = (function () {
  'use strict';
  const rad = Math.PI / 180;
  const signs = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  function project(stars, instant, lat, lon, includeBelow=false) {
    const days = instant / 86400000 - 10957.5;
    const t = days / 36525;
    const local = (280.46061837 + 360.98564736629 * days + .000387933*t*t - t*t*t/38710000 + lon) * rad;
    const zeta = (2306.2181*t + .30188*t*t + .017998*t*t*t)*rad/3600;
    const z = (2306.2181*t + 1.09468*t*t + .018203*t*t*t)*rad/3600;
    const theta = (2004.3109*t - .42665*t*t - .041833*t*t*t)*rad/3600;
    const phi = lat*rad;
    const visible = [];
    for (const [ra, dec, magnitude] of stars) {
      const d = dec*rad, a = ra*rad + zeta;
      const b = Math.cos(theta)*Math.cos(d)*Math.cos(a) - Math.sin(theta)*Math.sin(d);
      const hour = local - (Math.atan2(Math.cos(d)*Math.sin(a), b) + z);
      const sinDec = Math.sin(theta)*Math.cos(d)*Math.cos(a) + Math.cos(theta)*Math.sin(d);
      const cosDec = Math.sqrt(Math.max(0, 1 - sinDec*sinDec));
      const up = Math.sin(phi)*sinDec + Math.cos(phi)*cosDec*Math.cos(hour);
      if (up <= 0 && !includeBelow) continue;
      const east = -cosDec*Math.sin(hour), north = sinDec*Math.cos(phi) - cosDec*Math.cos(hour)*Math.sin(phi);
      const scale = Math.acos(Math.max(-1,Math.min(1,up))) / (Math.PI/2) / (Math.hypot(east,north) || 1);
      const point=[-east*scale,-north*scale,magnitude];
      if(includeBelow)point.push(up);
      visible.push(point);
    }
    return visible;
  }
  // Try both sides of a clock change and require the exact civil time to round-trip.
  function instants(date,time,zone) {
    const wall = Date.parse(date+'T'+time.slice(0,5)+':00Z');
    const fmt = new Intl.DateTimeFormat('en-GB',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
    function wallAt(ms) {
      const p = Object.fromEntries(fmt.formatToParts(ms).map(x=>[x.type,x.value]));
      return Date.parse(p.year+'-'+p.month+'-'+p.day+'T'+p.hour+':'+p.minute+':00Z');
    }
    const candidates = [-1,0,1].map(delta=>{
      const sample = wall + delta*86400000;
      return wall - (wallAt(sample)-sample);
    });
    return [...new Set(candidates)].filter(ms=>wallAt(ms)===wall).sort((a,b)=>a-b);
  }
  const figureIds = ['Ari','Tau','Gem','Cnc','Leo','Vir','Lib','Sco','Sgr','Cap','Aqr','Psc'];

  // A north-up tangent-plane portrait keeps each sign recognizable across the RA seam.
  function portraitPoints(stars) {
    const vectors = stars.map(([ra,dec]) => [
      Math.cos(dec*rad)*Math.cos(ra*rad), Math.cos(dec*rad)*Math.sin(ra*rad), Math.sin(dec*rad)
    ]);
    const center = vectors.reduce((sum,v)=>sum.map((n,i)=>n+v[i]), [0,0,0]);
    const ra = Math.atan2(center[1],center[0]);
    const dec = Math.atan2(center[2],Math.hypot(center[0],center[1]));
    const points = vectors.map(([x,y,z]) => {
      const along = x*Math.cos(ra)+y*Math.sin(ra);
      const depth = along*Math.cos(dec)+z*Math.sin(dec);
      return [(x*Math.sin(ra)-y*Math.cos(ra))/depth, (along*Math.sin(dec)-z*Math.cos(dec))/depth];
    });
    const mid = axis => {
      const values = points.map(p=>p[axis]);
      return (Math.min(...values)+Math.max(...values))/2;
    };
    const mx=mid(0), my=mid(1);
    const radius=Math.max(...points.map(([x,y])=>Math.hypot(x-mx,y-my)));
    return points.map(([x,y])=>[(x-mx)/radius,(y-my)/radius]);
  }

  function draw(stars, figures, info) {
    const c=document.createElement('canvas');
    c.width=1200; c.height=2400;
    const ctx=c.getContext('2d');
    const gold='#ecc18a', ivory='#fff0d9', pale='#cbdedc', brass='#827c65';
    const pairs=info.signs.filter(sign=>signs.includes(sign));
    const active=new Set(pairs.map(sign=>figureIds[signs.indexOf(sign)]));
    const background=ctx.createLinearGradient(80,250,1050,2200);
    background.addColorStop(0,'#081724');background.addColorStop(.50,'#133542');background.addColorStop(1,'#0a1727');
    ctx.fillStyle=background;ctx.fillRect(0,0,c.width,c.height);
    function line(x,y,xx,yy,color,width) {
      ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(xx,yy);ctx.stroke();
    }
    function circle(x,y,r,color,width) {
      ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);
      if(width){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
      else{ctx.fillStyle=color;ctx.fill();}
    }
    function lettering(str,x,y,size,color,face,maxWidth=960) {
      ctx.textAlign='center';ctx.fillStyle=color;ctx.font=size+'px '+face;ctx.fillText(str,x,y,maxWidth);
    }
    function spark(x,y,r,color) {
      ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x,y-r);ctx.quadraticCurveTo(x+r*.14,y-r*.14,x+r*.75,y);
      ctx.quadraticCurveTo(x+r*.14,y+r*.14,x,y+r);ctx.quadraticCurveTo(x-r*.14,y+r*.14,x-r*.75,y);
      ctx.quadraticCurveTo(x-r*.14,y-r*.14,x,y-r);ctx.fill();
    }
    function paths(figure,points,color,width,onSky=false) {
      for(const path of figure.paths){
        for(let i=1;i<path.length;i++){
          const a=points[path[i-1]],b=points[path[i]];
          if(onSky&&a[3]<=0&&b[3]<=0)continue;
          line(a[0],a[1],b[0],b[1],color,width);
        }
      }
    }
    const cx=c.width/2, cy=c.height/2;
    // Map zenith to the center and the horizon to the four edges of the print.
    // A radial stretch preserves each point's compass bearing in chart coordinates.
    function skyPoint(point) {
      const [x,y,mag,up]=point;
      const extent=Math.max(Math.abs(x),Math.abs(y));
      const stretch=extent ? Math.hypot(x,y)/extent : 1;
      return [cx+cx*x*stretch,cy+cy*y*stretch,mag,up];
    }
    for(const [id,figure] of Object.entries(figures)){
      const projected=project(figure.stars,info.instant,info.lat,info.lon,true).map(skyPoint);
      paths(figure,projected,active.has(id)?gold:'#65878f',active.has(id)?3.4:1.6,true);
    }
    for(const point of project(stars,info.instant,info.lat,info.lon)){
      const [x,y,mag]=skyPoint(point), size=1.35+Math.pow((6-mag)/5,2)*3.6;
      circle(x,y,size,mag<2?ivory:'#d1e0df');
      if(mag<1.1)spark(x,y,size*2,ivory);
    }
    const shade=ctx.createLinearGradient(0,1000,0,2300);
    shade.addColorStop(0,'#07182300');shade.addColorStop(.43,'#071823b8');
    shade.addColorStop(.72,'#071823e0');shade.addColorStop(1,'#07182350');
    ctx.fillStyle=shade;ctx.fillRect(0,1000,c.width,c.height-1000);

    const portraitY=1460, pr=130;
    function portrait(sign,x) {
      const f=figures[figureIds[signs.indexOf(sign)]];
      const pts=portraitPoints(f.stars).map(([a,b])=>[x+a*pr*.79,portraitY+b*pr*.79]);
      paths(f,pts,gold,3);
      pts.forEach(([a,b],i)=>circle(a,b,Math.max(2.8,6.1-f.stars[i][2]*.48),ivory));
      const [name,index]=f.anchor, [ax,ay]=pts[index];
      circle(ax,ay,11,'#d4af79',1.6);spark(ax,ay,13,ivory);
      lettering(sign,x,portraitY+187,49,ivory,'Georgia, serif',405);
      lettering(name,x,portraitY+224,27,gold,'sans-serif',390);
    }
    if(pairs.length===2){
      line(519,portraitY,681,portraitY,brass,2);spark(600,portraitY,17,gold);
    }
    pairs.forEach((s,i)=>portrait(s,pairs.length===1?cx:388+424*i));
    const titleY=pairs.length?1760:1550;
    lettering(info.title,cx,titleY,75,ivory,'Georgia, serif',930);
    const offset=info.initials?54:0;
    if(info.initials)lettering(info.initials,cx,titleY+54,46,gold,'Georgia, serif');
    const dateY=titleY+65+offset;
    lettering(info.date,cx,dateY,37,ivory,'sans-serif');
    lettering(info.place,cx,dateY+43,35,pale,'sans-serif',900);
    const coords=[Math.abs(info.lat).toFixed(2)+'° '+(info.lat<0?'S':'N'),Math.abs(info.lon).toFixed(2)+'° '+(info.lon<0?'W':'E')];
    lettering([info.clock,...coords].join('   ·   '),cx,dateY+79,28,gold,'sans-serif',900);
    return c;
  }
  function mount(host, hooks) {
    host.innerHTML = `<h2>Map a special night</h2><p>Choose the date and place to map the bright stars above that horizon. Use 9:00 PM for an evening estimate.</p>
    <details class="sky-example"><summary>See a finished example</summary><button type="button" id="skyExampleZoom" aria-label="Enlarge the finished example"><img src="assets/home/personal/sky-case.webp" loading="lazy" alt="Gemini and Libra on a case with the night sky above West Chester on June 14, 2019" width="912" height="1731"><span>Enlarge example</span></button></details>
    <form id="skyForm" autocomplete="off"><label>Occasion<select name="occasion"><option>The night we met</option><option>Our wedding night</option><option>Under the same sky</option><option>The night you were born</option></select></label>
    <div class="studio-pair"><label>Date<input name="date" type="date" min="1900-01-01" max="2100-12-31" required></label><label>Local time<input type="time" name="time" value="21:00" required></label></div>
    <label>Town, city or island<input name="query" type="search" aria-describedby="skyPlaceHint" placeholder="Search for a place" autocomplete="off"></label>
    <label>Choose your location<select name="place" required></select></label><small id="skyPlaceHint" role="status"></small>
    <details><summary>Use exact coordinates</summary><label><input type="checkbox" name="manual"> Use these coordinates for the map</label>
    <label>Place name<input name="placeName" maxlength="48"></label><div class="studio-pair"><label>Latitude (south is negative)<input name="lat" type="number" min="-90" max="90" step="any"></label><label>Longitude (west is negative)<input name="lon" type="number" min="-180" max="180" step="any"></label></div><label>Time zone<input name="zone" placeholder="America/New_York"></label></details>
    <label>Initials (optional)<input name="initials" maxlength="12" placeholder="J &amp; M"></label>
    <div class="studio-pair"><label>Zodiac sign (optional)<select name="sign1"></select></label><label>Second sign (optional)<select name="sign2"></select></label></div>
    <p>Each sign gets a constellation portrait with a named star. Look for the gold lines on the sky map to see which parts of your signs were above the horizon.</p>
    <button type="submit">Update my case preview</button></form>
    <p role="status" id="skyStatus"></p><div id="skyActions" hidden><button type="button" id="skySeeCase">See my case</button> <button type="button" id="skySave">Save my sky artwork</button><details id="skyDetail"><summary>See the star map up close</summary><div id="skyArtwork"></div></details></div>
    <details><summary>About this sky map</summary><p>The sky fills the case, with the zenith at the center, north at the top and the horizon along the edges. Moon, planets, clouds and daylight are outside this star chart. Star positions from the <a href="https://heasarc.gsfc.nasa.gov/W3Browse/all/bsc5p.html">Yale Bright Star Catalogue</a>. Constellation figures adapted from <a href="https://github.com/ofrohn/d3-celestial">D3-Celestial</a> (<a href="assets/sky-figures-license.txt">credits and license</a>). City coordinates and time zones adapted from <a href="https://www.geonames.org/">GeoNames</a> under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>.</p></details>`;
    if(new URLSearchParams(location.search).get('kiosk')==='1')host.querySelectorAll('a').forEach(link=>link.replaceWith(document.createTextNode(link.textContent)));
    const form=host.querySelector('form'), f=form.elements, status=host.querySelector('#skyStatus'), actions=host.querySelector('#skyActions');
    let chart, stars, figures, places, indices=[];
    for(const select of [f.sign1,f.sign2])for(const sign of ['',...signs])select.add(new Option(sign||'None',sign));
    const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/['‘’ʻʼ`]/g,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/ł/g,'l').replace(/ø/g,'o').replace(/ß/g,'ss').replace(/đ/g,'d');
    const cityLabel=row=>row.slice(0,3).filter(Boolean).join(', ');
    function populate(){
      const term=normalize(f.query.value.trim()), tokens=term.split(/[ ,]+/).filter(Boolean);
      const defaults=['West Chester, PA, US','Newark, DE, US','Pottstown, PA, US'];
      const hits=[];
      places.forEach((row,index)=>{
        const label=cityLabel(row), name=normalize(row[0]);
        if(!term){if(defaults.includes(label))hits.push({index,rank:0});return;}
        const full=normalize([label, row[6], row[1]==='HI' && row[2]==='US' ? 'Hawaii' : ''].filter(Boolean).join(' '));
        if(tokens.every(token=>full.includes(token))){
          const rank=name===term || tokens[0]===name ? 0 : name.startsWith(tokens[0]) ? 1 : 2;
          hits.push({index,rank});
        }
      });
      indices=hits.sort((a,b)=>a.rank-b.rank).slice(0,50).map(hit=>hit.index);
      f.place.replaceChildren(new Option('Choose a location',''),...indices.map(i=>new Option(cityLabel(places[i]),i)));
      if(indices.length===1)f.place.selectedIndex=1;
      host.querySelector('#skyPlaceHint').textContent = !term ? '' : indices.length===0
        ? 'No matching places. Try a nearby town or use exact coordinates below.'
        : indices.length===1 ? 'Selected: '+cityLabel(places[indices[0]]) : 'Choose your location from the matches above.';
    }
    function invalidate(){chart=null;detail.open=false;artwork.replaceChildren();actions.hidden=true;hooks.changed();status.textContent='Update the preview to apply your details.';}
    form.addEventListener('input',invalidate);
    const detail=host.querySelector('#skyDetail'), artwork=host.querySelector('#skyArtwork');
    detail.addEventListener('toggle',()=>{if(detail.open&&chart)artwork.replaceChildren(chart);});
    f.query.addEventListener('input',()=>{if(places)populate();});
    function manualMode(){
      f.place.required=!f.manual.checked;
      for(const field of [f.lat,f.lon,f.zone,f.placeName]){field.required=f.manual.checked;field.disabled=!f.manual.checked;}
    }
    f.manual.addEventListener('change',manualMode);manualMode();
    form.addEventListener('invalid',e=>{const details=e.target.closest('details');if(details)details.open=true;},true);
    form.addEventListener('submit',e=>{
      e.preventDefault();
      if(!stars || !places){status.textContent='The sky catalogue is still loading. Try again shortly.';return;}
      try{
        let row=places[f.place.value], place=f.manual.checked?f.placeName.value.trim():row[0];
        const lat=f.manual.checked?Number(f.lat.value):row[3],lon=f.manual.checked?Number(f.lon.value):row[4],zone=f.manual.checked?f.zone.value.trim():row[5];
        if(!place)throw Error('Enter a place name.');
        const matches=instants(f.date.value,f.time.value,zone);
        if(!matches.length)throw Error('That local time falls in a clock change. Choose a different time.');
        const date=new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:zone}).format(matches[0]);
        chart=draw(stars,figures,{clock:new Intl.DateTimeFormat('en-US',{timeZone:zone,hour:'numeric',minute:'2-digit'}).format(matches[0]),instant:matches[0],lat,lon,place,date,title:f.occasion.value,initials:f.initials.value.trim(),signs:[f.sign1.value,f.sign2.value]});
        let offset='';
        try{offset=new Intl.DateTimeFormat('en',{timeZone:zone,timeZoneName:'longOffset'}).formatToParts(matches[0]).find(p=>p.type==='timeZoneName')?.value||'';}catch{}
        // Keep the exact applied recipe with its canvas, never an unsubmitted form value.
        chart.__kpSkyRows=[['Occasion',f.occasion.value],['Date',date],['Local time',f.time.value+' · '+zone+' · '+offset+(matches.length>1?' · first occurrence':'')],['Place',f.manual.checked?place:cityLabel(row)],['Printed place',place],['Coordinates',lat+', '+lon],['Initials',f.initials.value.trim()||'None'],['Zodiac signs',[f.sign1.value,f.sign2.value].filter(Boolean).join(' & ')||'None'],['UTC instant',new Date(matches[0]).toISOString()],['Sky version','Full-case atlas 1']];
        chart.setAttribute('role','img');chart.setAttribute('aria-label',[f.occasion.value,place,date,...[f.sign1.value,f.sign2.value].filter(Boolean)].join(', '));
        if(detail.open)artwork.replaceChildren(chart);hooks.apply(chart);actions.hidden=false;
        status.textContent='Preview ready for '+place+' · '+date+' · '+f.time.value+' ('+zone+', '+offset+').'+(matches.length>1?' The clock repeated this time. Using the first occurrence.':'');
      }catch(err){invalidate();status.textContent=err instanceof RangeError?'Enter a time zone such as America/New_York.':err.message;}
    });
    host.querySelector('#skySeeCase').onclick=()=>host.dispatchEvent(new CustomEvent('kp:sky-preview',{bubbles:true}));
    host.querySelector('#skySave').onclick=()=>{
      if(!chart)return;
      chart.toBlob(blob=>{if(!blob)return;const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='keepsake-night-sky.png';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),60000);},'image/png');
    };
    host.addEventListener('skyreset',()=>{form.reset();manualMode();if(places)populate();invalidate();status.textContent='Choose a date and place to start again.';});
    Promise.all(['bright-stars','sky-places','sky-figures'].map(async name=>{
      const res=await fetch('assets/'+name+'.json'+(name==='sky-places'?'?v=islands-1':''));if(!res.ok)throw Error();return res.json();
    })).then(values=>{[stars,places,figures]=values;populate();}).catch(()=>{status.textContent='The local sky catalogue could not load. Reload this page to try again.';});
  }
  return {mount,project,instants};
})();
