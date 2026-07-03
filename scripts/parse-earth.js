// Parse CelesTrak satellites + Wikipedia impact craters → satellites.js / craters.js
const fs=require('fs');
const dir='/tmp/claude-0/-home-centos-docker/98cb5152-5781-4d92-adf6-9fc3a3a88036/scratchpad/';

// --- satellites: OBJECT_NAME,OBJECT_ID,EPOCH,MEAN_MOTION,ECCENTRICITY,INCLINATION,...
const MU=398600.4418;
const lines=fs.readFileSync(dir+'sats.csv','utf8').split('\n');
const hdr=lines[0].split(','); const H=Object.fromEntries(hdr.map((h,i)=>[h,i]));
const sats=[];
for(let i=1;i<lines.length;i++){
  const c=lines[i].split(','); if(c.length<8) continue;
  const mm=parseFloat(c[H.MEAN_MOTION]), inc=parseFloat(c[H.INCLINATION]);
  if(!isFinite(mm)||mm<=0) continue;
  const Tsec=86400/mm, a=Math.pow(MU*Math.pow(Tsec/(2*Math.PI),2),1/3);   // km
  const year=parseInt((c[H.OBJECT_ID]||'').slice(0,4))||null;
  sats.push([c[H.OBJECT_NAME].trim(), Math.round(a), +inc.toFixed(1), +(1440/mm).toFixed(0), year]);
}
console.log('satellites:',sats.length);
fs.writeFileSync('/home/centos-docker/www_html/app/visual-data-solar/includes/js/satellites.js',
`/* Active artificial satellites — CelesTrak GP catalogue (celestrak.org). [name, semi-major axis km, inclination°, period min, launch year] */
const SATCAT=${JSON.stringify(sats)};
`);

// --- craters: <tr> rows containing a class="geo" span
const html=fs.readFileSync(dir+'craters.html','utf8');
const craters=[];
html.split(/<tr[^>]*>/).forEach(r=>{
  const geo=r.match(/class="geo">([-\d.]+);\s*([-\d.]+)/); if(!geo) return;
  const tds=[...r.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(m=>m[1]);
  if(tds.length<5) return;
  const txt=s=>s.replace(/<[^>]*>/g,' ').replace(/&#160;|&nbsp;/g,' ').replace(/\s+/g,' ').trim();
  const name=txt(tds[0]), country=txt(tds[2]);
  const dm=txt(tds[3]).match(/[\d.]+/), am=txt(tds[4]);
  craters.push([name, country, dm?+dm[0]:null, am.split('[')[0].trim()||'—', +(+geo[1]).toFixed(2), +(+geo[2]).toFixed(2)]);
});
console.log('craters:',craters.length, craters.slice(0,3).map(c=>c[0]).join(', '));
fs.writeFileSync('/home/centos-docker/www_html/app/visual-data-solar/includes/js/craters.js',
`/* Confirmed impact structures on Earth — Earth Impact Database / Wikipedia compilation.
   [name, country, diameter km, age My, lat°, lon°] */
const CRATERCAT=${JSON.stringify(craters)};
`);
