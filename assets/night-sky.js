/* Positions from the Yale Bright Star Catalogue V/50 (J2000, V <= 5).
   Mean sidereal time and equatorial precession use Meeus, Astronomical Algorithms.
   The chart looks up, with east on the left. All personalization stays local. */
window.KPNightSky = (function () {
  'use strict';
  const rad = Math.PI / 180;
  const signs = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const emblems = [
    'M0 16 Q0 -20 -12 -15 Q-22 -12 -13 -3 M0 16 Q0 -20 12 -15 Q22 -12 13 -3',
    'M-14 -17 Q-12 -3 0 -3 Q12 -3 14 -17 M0 -3 A10 10 0 1 1 -.1 -3',
    'M-14 -15 Q0 -10 14 -15 M-14 15 Q0 10 14 15 M-8 -12 V12 M8 -12 V12',
    'M-16 -5 Q-5 -21 15 -10 M16 5 Q5 21 -15 10 M-8 -6 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 M8 6 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0',
    'M-12 4 a5 5 0 1 1 -.1 0 M-8 3 Q-15 -14 -4 -17 Q11 -21 8 -5 L4 7 Q1 20 14 14',
    'M-17 -9 Q-13 -19 -10 -10 V10 M-10 -9 Q-5 -20 -2 -10 V10 M-2 -9 Q4 -20 6 -10 V3 Q7 14 16 17 M6 -3 Q20 -15 14 2 Q11 11 -1 15',
    'M-17 13 H17 M-17 5 H-5 C-22 -12 -1 -22 8 -12 Q14 -4 5 5 H17',
    'M-17 -9 Q-13 -19 -10 -10 V12 M-10 -9 Q-5 -20 -2 -10 V12 M-2 -9 Q4 -20 6 -10 V5 Q6 17 18 9 M12 8 L18 9 L17 15',
    'M-15 15 L15 -15 M2 -15 H15 V-2 M-12 -3 L3 12',
    'M-18 -13 Q-12 -21 -9 -6 L-6 9 Q-2 -26 4 -13 L8 5 Q14 18 19 5 Q19 -5 10 -1 Q3 3 2 15',
    'M-17 -2 L-10 -10 L-7 -4 L1 -12 L4 -6 L13 -14 M-17 10 L-10 2 L-7 8 L1 0 L4 6 L13 -2',
    'M-12 -16 Q2 0 -12 16 M12 -16 Q-2 0 12 16 M-13 0 H13'
  ];
  function project(stars, instant, lat, lon) {
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
      if (up <= 0) continue;
      const east = -cosDec*Math.sin(hour), north = sinDec*Math.cos(phi) - cosDec*Math.cos(hour)*Math.sin(phi);
      const scale = Math.acos(Math.min(1,up)) / (Math.PI/2) / (Math.hypot(east,north) || 1);
      visible.push([-east*scale,-north*scale,magnitude]);
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
  function draw(stars, info) {
    const c = document.createElement('canvas');
    c.width=1200; c.height=2400;
    const ctx=c.getContext('2d'), cx=600,cy=1290,r=440;
    const wash=ctx.createLinearGradient(0,0,800,2400);
    wash.addColorStop(0,'#081223');wash.addColorStop(.53,'#172941');wash.addColorStop(1,'#0b1525');
    ctx.fillStyle=wash;ctx.fillRect(0,0,c.width,c.height);
    function ring(x,y,radius,color,width) {
      ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.stroke();
    }
    function label(str,x,y,size,color,font,max=1010) {
      ctx.textAlign='center';ctx.fillStyle=color;ctx.font=size+'px '+font;ctx.fillText(str,x,y,max);
    }
    // Reserve an inset for models with wide camera cutouts and tall print masks.
    ctx.translate(0,-265);
    ring(cx,cy,r,'#d8b786',3);ring(cx,cy,r+12,'#867963',1.5);
    for (const [x,y,mag] of project(stars,info.instant,info.lat,info.lon)) {
      const size=1.55+Math.pow((6-mag)/5,2)*3.7;
      ctx.fillStyle=mag<2?'#ffe5b1':'#e0e9f5';ctx.beginPath();ctx.arc(cx+x*r,cy+y*r,size,0,Math.PI*2);ctx.fill();
    }
    label('N',cx,cy-r-25,26,'#efd7ad','sans-serif');
    label('E',cx-r-37,cy+10,25,'#efd7ad','sans-serif');
    label('W',cx+r+37,cy+10,25,'#efd7ad','sans-serif');
    const pair=info.signs.filter(Boolean);
    if(pair.length===2){ctx.strokeStyle='#d8b786';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(558,1800);ctx.lineTo(642,1800);ctx.stroke();}
    pair.forEach((sign,i)=>{
      const x=pair.length===1?600:510+i*180;
      ctx.fillStyle='#122139';ctx.beginPath();ctx.arc(x,1800,48,0,2*Math.PI);ctx.fill();ring(x,1800,48,'#d8b786',3);
      ctx.save();ctx.translate(x,1800);ctx.scale(1.35,1.35);ctx.strokeStyle='#fae3b7';ctx.lineWidth=2.6;
      ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke(new Path2D(emblems[signs.indexOf(sign)]));ctx.restore();
    });
    if(pair.length)label(pair.join('  ·  '),600,1890,33,'#f9e4c7','sans-serif');
    label(info.title,600,1981,69,'#fff3dc','Georgia, serif');
    if(info.initials)label(info.initials,600,2054,54,'#e6c488','Georgia, serif');
    label(info.date,600,2125,41,'#fff3dc','sans-serif');
    label(info.place,600,2198,36,'#c7d2df','sans-serif',965);
    return c;
  }
  function mount(host, hooks) {
    host.innerHTML = `<h2>Map a special night</h2><p>Choose the date and place to map the bright stars above that horizon. Use 9:00 PM for an evening estimate.</p>
    <form id="skyForm"><label>Occasion<select name="occasion"><option>The night we met</option><option>Our wedding night</option><option>Under the same sky</option><option>The night you were born</option></select></label>
    <div class="studio-pair"><label>Date<input name="date" type="date" min="1900-01-01" max="2100-12-31" required></label><label>Local time<input type="time" name="time" value="21:00" required></label></div>
    <label>Town or city<input name="query" type="search" placeholder="Search for a city" autocomplete="off"></label>
    <label>Choose your location<select name="place" required></select></label>
    <details><summary>Use exact coordinates</summary><label><input type="checkbox" name="manual"> Use these coordinates for the map</label>
    <label>Place name<input name="placeName" maxlength="48"></label><div class="studio-pair"><label>Latitude (south is negative)<input name="lat" type="number" min="-90" max="90" step="any"></label><label>Longitude (west is negative)<input name="lon" type="number" min="-180" max="180" step="any"></label></div><label>Time zone<input name="zone" placeholder="America/New_York"></label></details>
    <label>Couple’s initials (optional)<input name="initials" maxlength="12" placeholder="J &amp; M"></label>
    <div class="studio-pair"><label>First zodiac sign<select name="sign1"></select></label><label>Second zodiac sign<select name="sign2"></select></label></div>
    <p>Optional zodiac emblems sit together on the chart’s rim. The star positions come from your date, time and location.</p>
    <button type="submit">Update my case preview</button></form>
    <p role="status" id="skyStatus"></p><div id="skyActions" hidden><a href="#stageWrap">See my case</a> · <button type="button" id="skySave">Save my sky artwork</button></div>
    <details><summary>About this sky map</summary><p>A map of bright stars above the geometric horizon. Moon, planets, clouds and daylight are outside this star chart. Star positions from the <a href="https://heasarc.gsfc.nasa.gov/W3Browse/all/bsc5p.html">Yale Bright Star Catalogue</a>. City coordinates and time zones adapted from <a href="https://www.geonames.org/">GeoNames</a> under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>.</p></details>`;
    const form=host.querySelector('form'), f=form.elements, status=host.querySelector('#skyStatus'), actions=host.querySelector('#skyActions');
    let chart, stars, places, indices=[];
    for(const select of [f.sign1,f.sign2])for(const sign of ['',...signs])select.add(new Option(sign||'None',sign));
    const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/ł/g,'l').replace(/ø/g,'o').replace(/ß/g,'ss').replace(/đ/g,'d');
    const cityLabel=row=>row.slice(0,3).filter(Boolean).join(', ');
    function populate(){
      const term=normalize(f.query.value.trim()), tokens=term.split(/[ ,]+/).filter(Boolean);
      const defaults=['West Chester, PA, US','Newark, DE, US','Pottstown, PA, US'];
      const hits=[];
      places.forEach((row,index)=>{
        const label=cityLabel(row), name=normalize(row[0]);
        if(!term){if(defaults.includes(label))hits.push({index,rank:0});return;}
        const full=normalize(label);
        if(tokens.every(token=>full.includes(token))){
          const rank=name===term || tokens[0]===name ? 0 : name.startsWith(tokens[0]) ? 1 : 2;
          hits.push({index,rank});
        }
      });
      indices=hits.sort((a,b)=>a.rank-b.rank).slice(0,50).map(hit=>hit.index);
      f.place.replaceChildren(new Option('Choose a location',''),...indices.map(i=>new Option(cityLabel(places[i]),i)));
      if(indices.length===1)f.place.selectedIndex=1;
    }
    function invalidate(){chart=null;actions.hidden=true;hooks.changed();status.textContent='Update the preview to apply your details.';}
    form.addEventListener('input',invalidate);
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
        chart=draw(stars,{instant:matches[0],lat,lon,place,date,title:f.occasion.value,initials:f.initials.value.trim(),signs:[f.sign1.value,f.sign2.value]});
        hooks.apply(chart);actions.hidden=false;
        status.textContent='Preview ready for '+place+' · '+date+' · '+f.time.value+' ('+zone+').'+(matches.length>1?' The clock repeated this time. Using the first occurrence.':'');
      }catch(err){invalidate();status.textContent=err instanceof RangeError?'Enter a time zone such as America/New_York.':err.message;}
    });
    host.querySelector('#skySave').onclick=()=>{
      if(!chart)return;
      chart.toBlob(blob=>{if(!blob)return;const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='keepsake-night-sky.png';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),60000);},'image/png');
    };
    host.addEventListener('skyreset',()=>{form.reset();manualMode();if(places)populate();invalidate();status.textContent='Choose a date and place to start again.';});
    Promise.all(['bright-stars','sky-places'].map(async name=>{
      const res=await fetch('assets/'+name+'.json');if(!res.ok)throw Error();return res.json();
    })).then(values=>{[stars,places]=values;populate();}).catch(()=>{status.textContent='The local sky catalogue could not load. Reload this page to try again.';});
  }
  return {mount,project,instants};
})();
