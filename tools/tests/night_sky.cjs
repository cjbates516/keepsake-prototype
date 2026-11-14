// Numerical checks for the geometry and time handling used in case artwork.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assets = path.resolve(__dirname, '../../assets');
const context = {window:{}};
vm.runInNewContext(fs.readFileSync(path.join(assets,'night-sky.js'),'utf8'), context);
const {project,instants} = context.window.KPNightSky;
const epoch = Date.UTC(2000,0,1,12);
const sidereal = 280.46061837;
const map = project([[sidereal,0,1],[sidereal+45,0,1],[sidereal-45,0,1],[sidereal,45,1],[sidereal+180,0,1]],epoch,0,0);
assert.equal(map.length,4);
for (const [i,[x,y]] of [[0,0],[-.5,0],[.5,0],[0,-.5]].entries()) {
  assert(Math.hypot(map[i][0]-x,map[i][1]-y)<1e-6);
}
assert.deepEqual(Array.from(instants('2024-07-04','21:00','America/New_York')),[Date.UTC(2024,6,5,1)]);
assert.deepEqual(Array.from(instants('2024-11-03','01:30','America/New_York')),[Date.UTC(2024,10,3,5,30),Date.UTC(2024,10,3,6,30)]);
assert.equal(instants('2024-03-10','02:30','America/New_York').length,0);
assert.deepEqual(Array.from(instants('2020-01-01','00:30','Asia/Kathmandu')),[Date.UTC(2019,11,31,18,45)]);
const catalog = JSON.parse(fs.readFileSync(path.join(assets,'bright-stars.json')));
assert(catalog.some(([ra,dec,m])=>Math.abs(ra-279.235)<.01 && Math.abs(dec-38.784)<.01 && m<.1),'Vega included with J2000 RA in degrees');
console.log('Sky orientation, altitude, date rollover, DST, fractional offsets and star catalogue verified.');
