// Parse CNEOS planetary-defense datasets + comets → defence.js
const fs=require('fs');
const dir='/tmp/claude-0/-home-centos-docker/98cb5152-5781-4d92-adf6-9fc3a3a88036/scratchpad/';

// --- PHAs (SBDB): full_name, a, e, i, H, moid(au)
const pj=JSON.parse(fs.readFileSync(dir+'pha.json'));
const pha=pj.data.map(d=>{
  const a=+d[1], e=+d[2], inc=+d[3], H=parseFloat(d[4]), moid=parseFloat(d[5]);
  if(!isFinite(a)||a<=0) return null;
  return [+a.toFixed(3), isFinite(e)?+e.toFixed(2):0, isFinite(inc)?+inc.toFixed(1):0,
    isFinite(H)?+H.toFixed(1):null, isFinite(moid)?+moid.toFixed(4):null, (d[0]||'').trim()];
}).filter(Boolean);

// --- Sentry impact-risk list: des, fullname, ip, ps_cum, ts_max, diameter(km), range, v_inf, n_imp
const sj=JSON.parse(fs.readFileSync(dir+'sentry.json'));
const sentry=sj.data.map(d=>[
  (d.fullname||d.des||'').trim(), +(+d.ip).toExponential(1), d.ts_max!=null?+d.ts_max:null,
  d.ps_cum!=null?+(+d.ps_cum).toFixed(2):null, d.diameter?+(+d.diameter*1000).toFixed(0):null,   // km→m
  d.range||'', d.v_inf?+(+d.v_inf).toFixed(1):null, d.n_imp?+d.n_imp:null
]);

// --- Close approaches next 12 months (within 10 lunar distances): des, cd(date), dist(au), v_rel, h
const cj=JSON.parse(fs.readFileSync(dir+'cad.json'));
const F=Object.fromEntries(cj.fields.map((f,i)=>[f,i]));
const AU_LD=389.174;   // lunar distances per au
const cad=cj.data.map(d=>[
  d[F.des].trim(), d[F.cd].split(' ')[0], +( +d[F.dist]*AU_LD ).toFixed(2),
  +(+d[F.v_rel]).toFixed(1), d[F.h]!=null?+(+d[F.h]).toFixed(1):null
]);

// --- Fireballs (atmospheric impacts): date, energy(kt), lat, lon (signed), vel
const fj=JSON.parse(fs.readFileSync(dir+'fireball.json'));
const G=Object.fromEntries(fj.fields.map((f,i)=>[f,i]));
const fire=fj.data.map(d=>{
  let lat=parseFloat(d[G.lat]), lon=parseFloat(d[G.lon]);
  if(!isFinite(lat)||!isFinite(lon)) return null;
  if(d[G['lat-dir']]==='S') lat=-lat; if(d[G['lon-dir']]==='W') lon=-lon;
  const en=parseFloat(d[G['impact-e']]);
  return [d[G.date].split(' ')[0], isFinite(en)?+en.toFixed(2):null, +lat.toFixed(1), +lon.toFixed(1),
    d[G.vel]?+(+d[G.vel]).toFixed(1):null];
}).filter(Boolean);

// --- Comets (SBDB): full_name, a, e, i
const kj=JSON.parse(fs.readFileSync(dir+'comets.json'));
const com=kj.data.map(d=>{
  const a=+d[1], e=+d[2], inc=+d[3];
  if(!isFinite(a)||a<=0.1) return null;
  return [+Math.min(999,a).toFixed(2), isFinite(e)?+Math.min(1,e).toFixed(3):0, isFinite(inc)?+inc.toFixed(1):0, (d[0]||'').trim()];
}).filter(Boolean);

console.log('PHAs:',pha.length,'| Sentry:',sentry.length,'| close approaches:',cad.length,'| fireballs:',fire.length,'| comets:',com.length);
const js=`/* Planetary defence & comets — NASA/JPL CNEOS (cneos.jpl.nasa.gov) & SBDB:
   PHACAT — potentially hazardous asteroids. [a au,e,i°,H mag,MOID au,name]
   SENTRY — Sentry impact-risk list (non-zero impact probability). [name,impact prob,Torino,Palermo cum,diameter m,years,v km/s,n paths]
   CADCAT — close approaches < 10 lunar distances, next 12 months. [name,date,dist LD,v km/s,H]
   FIRECAT — fireballs (real atmospheric impacts). [date,energy kt,lat°,lon°,vel km/s]
   COMCAT — comets. [a au,e,i°,name] */
const PHACAT=${JSON.stringify(pha)};
const SENTRY=${JSON.stringify(sentry)};
const CADCAT=${JSON.stringify(cad)};
const FIRECAT=${JSON.stringify(fire)};
const COMCAT=${JSON.stringify(com)};
`;
fs.writeFileSync('/home/centos-docker/www_html/app/visual-data-solar/includes/js/defence.js',js);
console.log('wrote defence.js',(js.length/1024).toFixed(0)+'KB');
