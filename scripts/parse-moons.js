// Parse JPL SSD planetary-satellite pages (phys_par + elem) → moons.js
const fs=require('fs');
const dir='/tmp/claude-0/-home-centos-docker/98cb5152-5781-4d92-adf6-9fc3a3a88036/scratchpad/';
const rows=html=>{   // page uses MULTIPLE tbodys and omits some </td> closers (cells merge "value sigma ref")
  const out=[];
  html.split(/<tbody[^>]*>/i).slice(1).forEach(seg=>{
    const body=seg.split(/<\/tbody>/i)[0];
    body.split(/<tr[^>]*>/i).slice(1).forEach(r=>{
      out.push([...r.matchAll(/<td[^>]*>([\s\S]*?)(?=<td|<\/tr|$)/gi)]
        .map(m=>m[1].replace(/<[^>]*>/g,' ').replace(/&nbsp;|&amp;/g,' ').replace(/\s+/g,' ').trim()));
    });
  });
  return out;
};
// --- physical parameters: [planet, satellite, code, "GM sig ref", "radius sig ref", "density sig ref"]
const phys={};
rows(fs.readFileSync(dir+'satphys.html','utf8')).forEach(c=>{
  if(c.length<5||!c[1]) return;
  // rows come as 12 separate cells [gm,sig,ref,rad,sig,ref,den,sig,ref] or merged triplets — flatten to tokens
  const toks=c.slice(3).join(' ').split(/\s+/).filter(Boolean);
  const gm=parseFloat(toks[0]), rad=parseFloat(toks[3]);
  phys[c[1]]={planet:c[0], code:c[2], gm:isFinite(gm)?gm:null, radius:isFinite(rad)?rad:null};
});
// --- mean elements: [ID, planet, satellite, code, ephem, frame, epoch, a, e, w, M, i, node, ...]
const elems={};
rows(fs.readFileSync(dir+'satelem.html','utf8')).forEach(c=>{
  if(c.length<12||!c[2]) return;
  const a=parseFloat(c[7]), e=parseFloat(c[8]), inc=parseFloat(c[11]);
  if(!isFinite(a)) return;
  if(!elems[c[2]]||true) elems[c[2]]={planet:c[1], a, e:isFinite(e)?e:0, i:isFinite(inc)?inc:0};
});
// planet GM (km³/s²) for period computation
const PGM={Earth:398600.4,Mars:42828.4,Jupiter:126686531,Saturn:37931206,Uranus:5793951,Neptune:6835100,Pluto:869.6};
const out=[];
const names=new Set([...Object.keys(phys),...Object.keys(elems)]);
names.forEach(n=>{
  const p=phys[n]||{}, e=elems[n]||{};
  const planet=p.planet||e.planet; if(!planet||planet==='Sun') return;
  let period=null;
  if(e.a && PGM[planet]) period=+(2*Math.PI*Math.sqrt(Math.pow(e.a,3)/PGM[planet])/86400).toFixed(2);
  out.push([planet, n, p.code||'', p.radius!=null?+p.radius.toFixed(1):null,
    p.gm!=null?+(p.gm/6.674e-2).toFixed(2):null,   // GM km³/s² → mass in 1e19 kg units (GM/G, G=6.674e-20 → ×1e19... see note)
    e.a?Math.round(e.a):null, e.e!=null?+e.e.toFixed(3):null, e.i!=null?+e.i.toFixed(1):null, period]);
});
// tidy: mass units — GM[km³/s²]/G[6.674e-20 km³/(kg s²)] = kg → /1e19 gives 1e19-kg units; we did /6.674e-2 = ×1e19 kg ✓
out.sort((a,b)=>a[0].localeCompare(b[0])||((b[3]||0)-(a[3]||0)));
const byPlanet={}; out.forEach(m=>byPlanet[m[0]]=(byPlanet[m[0]]||0)+1);
console.log('moons total:',out.length, byPlanet);
console.log('sample Ganymede:', JSON.stringify(out.find(m=>m[1]==='Ganymede')));
const js=`/* All known planetary satellites — NASA/JPL Solar System Dynamics (ssd.jpl.nasa.gov):
   physical parameters (sats/phys_par) + mean orbital elements (sats/elem); period computed via Kepler.
   Entry: [planet, name, IAU code, mean radius km, mass 1e19 kg, a km, e, i°, period days] */
const MOONS=${JSON.stringify(out)};
`;
fs.writeFileSync('/home/centos-docker/www_html/app/visual-data-solar/includes/js/moons.js',js);
console.log('wrote moons.js',(js.length/1024).toFixed(0)+'KB');
