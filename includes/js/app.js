/* visual-data-solar — engine (design & interaction model of visual-data-universe).
   Sun at the centre; planets on a log-compressed ecliptic; every known moon (NASA/JPL) around its
   planet; 18,000 real asteroid orbits as point rings; translucent belt shells; glass UI. */
window.addEventListener('error',function(e){ if(e.filename && e.filename.indexOf('3d-force-graph')>-1){ e.preventDefault(); return true; } },true);

function hash(s){ let h=0; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))>>>0; return h; }

/* ===================== BUILD NODE TREE (attach every JPL moon to its planet) ===================== */
let NODES=[], byId={}; let uid=0;
function mk(o,parent){ const id="n"+(uid++);
  const n=Object.assign({id, parent:parent?parent.id:null, childIds:[]},o);
  byId[id]=n; NODES.push(n); if(parent) parent.childIds.push(id); return n; }
const ROOT=mk({name:DATA.name, type:"root", root:true, _virtual:true});
DATA.children.forEach(c=>mk(c,ROOT));
/* moons: MOONS entries [planet,name,code,radius km,mass 1e19kg,a km,e,i°,period d] */
if(typeof MOONS!=='undefined'){
  const byName={}; NODES.forEach(n=>byName[n.name]=n);
  MOONS.forEach(m=>{
    const par=byName[m[0]]; if(!par) return;
    const name=(m[0]==='Earth'&&m[1]==='Moon')?'The Moon':m[1];
    mk({name, type:"moon", moon:m, diam:(m[3]||2)*2}, par);
  });
}

/* ===================== SIZES (log of true diameter) & POSITIONS (log-compressed orbits) ===================== */
function bodyR(n){
  if(n.region) return 0;                    // belt shells sized in layout
  if(n.type==='star') return 5.6;           // capped: raw power law (10.8) would swallow Mercury's orbit (r=8)
  const d=Math.max(0.5, n.diam||2);
  if(n.type==='moon'){                      // moons: TRUE size ratio vs their planet (^1.0 — the data,
    const par=byId[n.parent], pd=Math.max(1,(par&&par.diam)||12742);   // not a flattering power law);
    const pR=Math.max(0.12, 0.05*Math.pow(pd,0.38));                   // 0.045 floor keeps km-size moons visible
    return Math.max(0.045, pR*(d/pd));      // Ganymede 1/26 of Jupiter, the Moon 27% of Earth — as in reality
  }
  return Math.max(0.12, 0.05*Math.pow(d,0.38));   // power law → real planet≫moon contrast (Sun ~11, Jupiter ~4.5)
}

/* ===================== LIVE EPHEMERIS — real planet positions for today =====================
   JPL "Approximate Positions of the Planets" (Standish), Keplerian elements + centennial rates,
   valid 1800–2050. Gives each planet its TRUE heliocentric ecliptic longitude right now. */
const EPH={
 Mercury:[0.38709927,0.20563593,7.00497902,252.25032350,77.45779628,48.33076593, 0.00000037,0.00001906,-0.00594749,149472.67411175,0.16047689,-0.12534081],
 Venus:[0.72333566,0.00677672,3.39467605,181.97909950,131.60246718,76.67984255, 0.00000390,-0.00004107,-0.00078890,58517.81538729,0.00268329,-0.27769418],
 Earth:[1.00000261,0.01671123,-0.00001531,100.46457166,102.93768193,0.0, 0.00000562,-0.00004392,-0.01294668,35999.37244981,0.32327364,0.0],
 Mars:[1.52371034,0.09339410,1.84969142,-4.55343205,-23.94362959,49.55953891, 0.00001847,0.00007882,-0.00813131,19140.30268499,0.44441088,-0.29257343],
 Jupiter:[5.20288700,0.04838624,1.30439695,34.39644051,14.72847983,100.47390909, -0.00011607,-0.00013253,-0.00183714,3034.74612775,0.21252668,0.20469106],
 Saturn:[9.53667594,0.05386179,2.48599187,49.95424423,92.59887831,113.66242448, -0.00125060,-0.00050991,0.00193609,1222.49362201,-0.41897216,-0.28867794],
 Uranus:[19.18916464,0.04725744,0.77263783,313.23810451,170.95427630,74.01692503, -0.00196176,-0.00004397,-0.00242939,428.48202785,0.40805281,0.04240589],
 Neptune:[30.06992276,0.00859048,1.77004347,-55.12002969,44.96476227,131.78422574, 0.00026291,0.00005105,0.00035372,218.45945325,-0.32241464,-0.00508664],
 Pluto:[39.48211675,0.24882730,17.14001206,238.92903833,224.06891629,110.30393684, -0.00031596,0.00005170,0.00004818,145.20780515,-0.04062942,-0.01183482]
};
/* the map clock — real time by default, or time-lapse via the ⏱ button. Either way the
   positions come from the SAME true ephemeris, just evaluated at the map clock's moment. */
let _timeRate=1, _simMs=Date.now(), _simLastReal=null;
const _epochMs=_simMs;                 // when the statistical phases (hash angles) were laid out
function simNow(){ return _simMs; }
const kepW=a=>2*Math.PI/(Math.pow(Math.max(0.1,a),1.5)*365.25);   // true mean motion, rad/day (Kepler III)
function planetNow(name){
  const el=EPH[name]; if(!el) return null;
  const JD=simNow()/86400000+2440587.5, T=(JD-2451545)/36525, D2R=Math.PI/180;
  const e=el[1]+el[7]*T, I=(el[2]+el[8]*T)*D2R, L=el[3]+el[9]*T, w=el[4]+el[10]*T, O=(el[5]+el[11]*T)*D2R;
  let M=((L-w)%360+540)%360-180; M*=D2R;
  let E=M+e*Math.sin(M); for(let i=0;i<6;i++) E-=(E-e*Math.sin(E)-M)/(1-e*Math.cos(E));
  const nu=2*Math.atan2(Math.sqrt(1+e)*Math.sin(E/2), Math.sqrt(1-e)*Math.cos(E/2));
  const wp=w*D2R-O;                               // argument of perihelion
  const lam=O+Math.atan2(Math.sin(wp+nu)*Math.cos(I), Math.cos(wp+nu));   // true ecliptic longitude
  const beta=Math.asin(Math.sin(wp+nu)*Math.sin(I));                      // ecliptic latitude
  const a=el[0]+el[6]*T, r=a*(1-e*Math.cos(E));   // true heliocentric distance (au)
  return {lon:lam, lat:beta, r,
    vec:{x:r*Math.cos(beta)*Math.cos(lam), y:r*Math.sin(beta), z:r*Math.cos(beta)*Math.sin(lam)}};
}
const AU0=Math.log10(0.35), AU1=Math.log10(60);
const rOfAu=au=>8+(Math.log10(Math.max(0.36,Math.min(59,au)))-AU0)/(AU1-AU0)*56;   // 0.39au→~8 … 50au→~62
let jupLon=0;
function layout(){
  ROOT._p={x:0,y:0,z:0};
  NODES.forEach(n=>{ if(n.root) return;
    n._R=bodyR(n);
    const par=byId[n.parent];
    if(n.type==='moon'){ return; }          // after parents
    if(n.region){                           // belt shells: translucent spheres enclosing their zone
      n._R = n.name==='Asteroid Belt'? rOfAu(3.3)+1 : n.name==='Kuiper Belt'? rOfAu(50)+2 : 78;
      n._p={x:0,y:0,z:0}; n.fx=0; n.fy=0; n.fz=0; return; }
    if(n.type==='star'){ n._p={x:0,y:0,z:0}; }
    else { const r=rOfAu(n.au||1), live=planetNow(n.name);
      const th=live? live.lon : (hash(n.name)%3600)/3600*Math.PI*2;   // REAL position today when we have elements
      if(n.name==='Jupiter') jupLon=th;
      const y=live? Math.sin(live.lat)*r : ((hash('y'+n.name)%100)/100-0.5)*2.2;
      n._p={x:r*Math.cos(th), y, z:r*Math.sin(th)}; }
  });
  // moons: TRUE orbit radii on a log ruler of a/planet-diameter — the same ruler for every planet,
  // so Phobos really hugs Mars while the Moon and Iapetus ride far out. Sprawling irregular-moon
  // systems (Jupiter's outer swarm) are squashed proportionally only if they'd invade a neighbour.
  NODES.forEach(par=>{ if(!par.childIds.length||par.root) return;
    const moons=par.childIds.map(id=>byId[id]).filter(c=>c.type==='moon'); if(!moons.length) return;
    const pd=Math.max(1,par.diam||12742);
    const raw=moons.map(c=>{ const aR=2*(c.moon[5]||1e5)/pd;    // true a in planet RADII —
      return par._R*(aR<=3? aR : 3+0.75*Math.log10(aR/3)); });  // exact up close, firm log beyond 3 radii
    const maxAllowed=par._R*1.9+1.6, mx=Math.max(...raw);
    const sc=mx>maxAllowed? (maxAllowed-par._R)/(mx-par._R) : 1;
    par._mSc=sc;   // satellite/close-approach shells share this squash so ordering vs the Moon stays true
    moons.forEach((c,i)=>{
      const rr=par._R+(raw[i]-par._R)*sc+(c._R||0.07);
      const th=(hash(c.name)%3600)/3600*Math.PI*2, tilt=((c.moon[7]||0)*Math.PI/180)*((hash('t'+c.name)%100)/100-0.5);
      const per=c.moon[8], a=c.moon[5]||1e5;
      const w=((c.moon[7]||0)>90||per<0?-1:1)*2*Math.PI/Math.max(0.05,Math.abs(per)||Math.pow(a/384400,1.5)*27.3);
      c._mo={rr, th0:th, ct:Math.cos(tilt), st:Math.sin(tilt), w};   // real period, retrograde = backwards
      c._p={x:par._p.x+rr*Math.cos(th)*c._mo.ct, y:par._p.y+rr*c._mo.st, z:par._p.z+rr*Math.sin(th)*c._mo.ct};
    });
  });
  NODES.forEach(n=>{ const p=n._p||{x:0,y:0,z:0}; n.fx=p.x; n.fy=p.y; n.fz=p.z; n.x=p.x; n.y=p.y; n.z=p.z; });
}
layout();

function nodeColor(n){
  if(n.type==='moon'){ return PLANET_TINT[byId[n.parent].name]||TYPES.moon.c; }
  if(n.type==='planet'){ return PLANET_TINT[n.name]||TYPES.planet.c; }
  return (TYPES[n.type]||TYPES.planet).c;
}
function currentData(){ return {nodes:NODES.filter(n=>n!==ROOT), links:[]}; }

/* ===================== GRAPH ===================== */
const elGraph=document.getElementById('graph');
let Graph;
const hiddenTypes=new Set(), _legendChips=[];

/* ===================== REAL SURFACE TEXTURES (Solar System Scope / NASA imagery) ===================== */
const TEXMAP={'The Sun':'2k_sun.jpg','Mercury':'2k_mercury.jpg','Venus':'2k_venus_atmosphere.jpg','Earth':'2k_earth_daymap.jpg',
 'Mars':'2k_mars.jpg','Jupiter':'2k_jupiter.jpg','Saturn':'2k_saturn.jpg','Uranus':'2k_uranus.jpg','Neptune':'2k_neptune.jpg','The Moon':'2k_moon.jpg',
 // real spacecraft global mosaics (NASA/JPL/USGS — Voyager, Galileo, Cassini, New Horizons, Dawn; via Stellarium)
 'Io':'io.png','Europa':'europa.png','Ganymede':'ganymede.png','Callisto':'callisto.png',
 'Titan':'titan.png','Enceladus':'enceladus.png','Rhea':'rhea.png','Iapetus':'iapetus.png','Dione':'dione.png','Tethys':'tethys.png','Mimas':'mimas.png',
 'Miranda':'miranda.png','Ariel':'ariel.png','Titania':'titania.png','Oberon':'oberon.png','Umbriel':'umbriel.png',
 'Triton':'triton.png','Pluto':'pluto.png','Charon':'charon.png','Ceres':'ceres.png'};
let _texLoader=null; const _texCache={};
function tex(f){ if(!_texLoader) _texLoader=new THREE.TextureLoader();
  if(!_texCache[f]){ const t=_texLoader.load('includes/images/tex/'+f); if('colorSpace' in t) t.colorSpace='srgb'; _texCache[f]=t; }
  return _texCache[f]; }
const _spinners=[];
/* sidereal rotation period in hours; NEGATIVE = retrograde (clockwise seen from the north).
   Prograde: Sun, Mercury, Earth, Mars, Jupiter, Saturn, Neptune. Retrograde: Venus, Uranus. */
const ROT_H={'The Sun':609.12, Mercury:1407.6, Venus:-5832.5, Earth:23.9345, Mars:24.6229,
  Jupiter:9.925, Saturn:10.656, Uranus:-17.24, Neptune:16.11, Moon:655.72, Pluto:-153.3};
let _spinLast=null;
function nodeMesh(n){
  const region=!!n.region, col=nodeColor(n);
  const texFile=TEXMAP[n.name];
  if(texFile){                                    // real imagery for the Sun, planets & the Moon
    const g=new THREE.Group();
    const geo=new THREE.SphereGeometry(1,40,28);
    const mat=new THREE.MeshBasicMaterial({map:tex(texFile)});   // unlit: full-brightness imagery (cross-THREE lighting is unreliable)
    const sph=new THREE.Mesh(geo,mat); sph._body=n.name; g.add(sph); _spinners.push(sph);
    if(n.name==='Saturn'){                        // the rings, with real ring imagery
      const rg=new THREE.RingGeometry(1.35,2.35,72); const uv=rg.attributes.uv, ps=rg.attributes.position;
      for(let i=0;i<uv.count;i++){ const r=Math.hypot(ps.getX(i),ps.getY(i)); uv.setXY(i,(r-1.35)/1.0,0.5); }
      const rt=tex('2k_saturn_ring_alpha.png');
      const ring=new THREE.Mesh(rg,new THREE.MeshBasicMaterial({map:rt,color:0xd8c9a3,side:THREE.DoubleSide,transparent:true,opacity:0.9,depthWrite:false}));
      ring.rotation.x=Math.PI/2-0.47; g.add(ring);
    }
    g.scale.setScalar(Math.max(1e-4,n._R||1)); return g;
  }
  const geo=new THREE.SphereGeometry(1, region?30:18, region?22:14);
  const mat=new THREE.MeshLambertMaterial({color:col, transparent:true, opacity:region?0.055:0.96,
    depthWrite:!region, emissive:col, emissiveIntensity:region?0.22:0.12});
  const m=new THREE.Mesh(geo,mat); m.scale.setScalar(Math.max(1e-4,n._R||1)); return m;
}
let _camAnim=null;
function easeCam(toPos,toTarget,ms){
  const run=(now)=>{ const cam=Graph.camera&&Graph.camera(), ctr=Graph.controls&&Graph.controls();
    if(!cam||!ctr) return;
    if(!run._s){ run._s=now; run._p0=cam.position.clone(); run._t0=ctr.target.clone(); }
    const k=Math.min(1,(now-run._s)/ms), e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
    cam.position.set(run._p0.x+(toPos.x-run._p0.x)*e, run._p0.y+(toPos.y-run._p0.y)*e, run._p0.z+(toPos.z-run._p0.z)*e);
    ctr.target.set(run._t0.x+(toTarget.x-run._t0.x)*e, run._t0.y+(toTarget.y-run._t0.y)*e, run._t0.z+(toTarget.z-run._t0.z)*e);
    ctr.update(); if(k<1) _camAnim=requestAnimationFrame(run); };
  cancelAnimationFrame(_camAnim); _camAnim=requestAnimationFrame(run);
}
function fitTop(){ setTimeout(()=>easeCam({x:0,y:34,z:132},{x:0,y:0,z:0},700),200); }
function flyTo(n){ if(!Graph||n.x==null) return;
  const _moons=(n.childIds||[]).map(id=>byId[id]).filter(k=>k&&k.type==='moon');   // frame the WHOLE moon
  const ring=_moons.length? Math.max(..._moons.map(k=>Math.hypot(k.x-n.x,k.y-n.y,k.z-n.z))) : 0;   // system
  const d=Math.max((n._R||1)*3.4+2.2, ring*1.6);
  const cam=Graph.cameraPosition(), dx=cam.x-n.x, dy=cam.y-n.y, dz=cam.z-n.z, L=Math.hypot(dx,dy,dz);
  const ux=L>1?dx/L:0, uy=L>1?dy/L:0.25, uz=L>1?dz/L:1;
  easeCam({x:n.x+ux*d,y:n.y+uy*d,z:n.z+uz*d},{x:n.x,y:n.y,z:n.z},800);
}
function boot(){
  if(typeof ForceGraph3D==='undefined'||typeof THREE==='undefined'){ setTimeout(boot,120); return; }
  document.getElementById('loading').classList.add('done');
  Graph=ForceGraph3D({controlType:'orbit'})(elGraph)
   .enableNodeDrag(false).backgroundColor('#05070e')
   .nodeRelSize(1).nodeThreeObject(nodeMesh).nodeLabel(()=>null)
   .linkVisibility(false).onBackgroundClick(()=>{})
   .graphData(currentData());
  Graph.d3Force('charge',null); Graph.d3Force('link',null); Graph.d3Force('center',null);
  Graph.cooldownTicks(0);
  buildAsteroids(); buildDefence(); buildLegend(); updateHud(); syncLabels(); fitTop();
}

/* ===================== ASTEROID RINGS (real JPL orbits; trojans at Jupiter's L4/L5) ===================== */
let _astClouds=[];
function buildAsteroids(){
  if(typeof ASTCAT==='undefined'||!Graph.scene) return;
  const CCOL=[0xd9c58f,0x7fe0d4,0x9fc9ff], CLS=['Main-belt asteroid','Jupiter trojan','Trans-Neptunian object'];
  const groups=[[],[],[]];
  ASTCAT.forEach((g,idx)=>{
    const a=Math.max(1.6,Math.min(59,g[0])), rr=rOfAu(a);
    let th;
    if(g[3]===1){ const lead=(hash('L'+idx)%2)?1:-1;   // trojans cluster 60° ahead/behind Jupiter
      th=jupLon+lead*Math.PI/3+(((hash('j'+idx)%1000)/1000)-0.5)*0.62; }
    else th=((hash('a'+idx)%3600)/3600)*Math.PI*2;
    const tilt=((g[2]||0)*Math.PI/180)*(((hash('b'+idx)%200)/100)-1)*0.5;
    groups[g[3]].push(rr*Math.cos(th)*Math.cos(tilt), rr*Math.sin(tilt), rr*Math.sin(th)*Math.cos(tilt), idx);
  });
  groups.forEach((arr,cls)=>{
    const pos=new Float32Array(arr.length/4*3), map=[];
    for(let i=0,j=0;i<arr.length;i+=4,j+=3){ pos[j]=arr[i]; pos[j+1]=arr[i+1]; pos[j+2]=arr[i+2]; map.push(arr[i+3]); }
    const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    const mat=new THREE.PointsMaterial({color:CCOL[cls], size:1.5, transparent:true, opacity:0.85,
      sizeAttenuation:false, depthWrite:false, blending:THREE.AdditiveBlending});
    const pts=new THREE.Points(geo,mat); pts.frustumCulled=false; Graph.scene().add(pts);
    if(cls===1) pts.userData.jupLon0=jupLon;   // Trojans stay clamped to Jupiter's L4/L5 instead
    else{ const w=new Float32Array(map.length);              // everyone else orbits at its TRUE rate
      for(let i=0;i<map.length;i++) w[i]=kepW(ASTCAT[map[i]][0]);
      pts.userData.orbit={base:pos.slice(0), w, cx:0, cz:0}; }
    _astClouds.push({pts,map,cls,label:CLS[cls]});
  });
}
/* ===================== PLANETARY DEFENCE & COMETS (NASA/JPL CNEOS) ===================== */
let _xClouds=[];
function addCloud(pos,color,size,data,label,panelFn,map){
  const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  const mat=new THREE.PointsMaterial({color,size,transparent:true,opacity:0.9,
    sizeAttenuation:false,depthWrite:false,blending:THREE.AdditiveBlending});
  const pts=new THREE.Points(geo,mat); pts.frustumCulled=false; Graph.scene().add(pts);
  _xClouds.push({pts,data,label,panelFn,map}); return pts;
}
function estDiam(H){ return H==null?null:Math.round(3553*Math.pow(10,-0.2*H)*1000); }   // m, albedo 0.14
function buildDefence(){
  if(!Graph.scene) return;
  const earth=NODES.find(n=>n.name==='Earth');
  // Potentially hazardous asteroids — inner-system swarm from real orbits
  if(typeof PHACAT!=='undefined'){
    const pos=[]; PHACAT.forEach((g,i)=>{ const rr=rOfAu(Math.max(0.4,Math.min(4,g[0])));
      const th=((hash('p'+i)%3600)/3600)*Math.PI*2, tilt=((g[2]||0)*Math.PI/180)*(((hash('q'+i)%200)/100)-1)*0.5;
      pos.push(rr*Math.cos(th)*Math.cos(tilt), rr*Math.sin(tilt), rr*Math.sin(th)*Math.cos(tilt)); });
    const phc=addCloud(pos,0xff6b5e,1.7,PHACAT,'Potentially hazardous asteroid',
      g=>[['Name',g[5]||'—'],['Semi-major axis',g[0]+' au'],['Est. diameter',estDiam(g[3])?estDiam(g[3]).toLocaleString()+' m':'—'],
          ['Min. orbit distance to Earth',g[4]!=null?(g[4]*389.174).toFixed(1)+' lunar distances':'—'],
          ['Eccentricity',g[1]],['Inclination',g[2]+'°']]);
    const phw=new Float32Array(PHACAT.length); PHACAT.forEach((g,i)=>phw[i]=kepW(g[0]));
    phc.userData.orbit={base:Float32Array.from(pos), w:phw, cx:0, cz:0};
  }
  // Sentry impact-risk list — objects with a non-zero computed impact probability
  if(typeof SENTRY!=='undefined'){
    const pos=[]; SENTRY.forEach((g,i)=>{ const rr=rOfAu(1)+(((hash('s'+i)%200)/100)-1)*2.6;
      const th=((hash('t'+i)%3600)/3600)*Math.PI*2, y=(((hash('u'+i)%100)/50)-1)*1.4;
      pos.push(rr*Math.cos(th), y, rr*Math.sin(th)); });
    addCloud(pos,0xff9df5,1.8,SENTRY,'Sentry impact-risk object',
      g=>[['Object',g[0]],['Cumulative impact probability',g[1]],['Torino scale',g[2]!=null?g[2]:'—'],
          ['Palermo scale (cum.)',g[3]!=null?g[3]:'—'],['Est. diameter',g[4]!=null?g[4].toLocaleString()+' m':'—'],
          ['Potential impact years',g[5]||'—'],['Velocity',g[6]!=null?g[6]+' km/s':'—']]);
  }
  // Close approaches within 10 lunar distances, next 12 months — a ring around Earth itself
  if(typeof CADCAT!=='undefined' && earth){
    const eR2=earth._R||1.8, mSc2=earth._mSc||1, mRul2=aR=>aR<=3? aR : 3+0.75*Math.log10(aR/3);
    // miss distance in lunar distances → Earth radii (1 LD = 60.3 R⊕) on the Moon's own ruler:
    // approaches nearer than the Moon plot inside its orbit, farther ones beyond — as in reality
    const pos=[]; CADCAT.forEach((g,i)=>{ const rr=Math.max(eR2*1.15, eR2*(1+(mRul2(Math.max(1.05,g[2]*60.3))-1)*mSc2));
      const th=((hash('c'+i)%3600)/3600)*Math.PI*2, ph=(((hash('d'+i)%100)/50)-1)*0.8;
      pos.push(earth.x+rr*Math.cos(th)*Math.cos(ph), earth.y+rr*Math.sin(ph), earth.z+rr*Math.sin(th)*Math.cos(ph)); });
    addCloud(pos,0x9ff2ff,2.6,CADCAT,'Close approach (next 12 months)',
      g=>[['Object',g[0]],['Date',g[1]],['Miss distance',g[2]+' lunar distances ('+Math.round(g[2]*384400).toLocaleString()+' km)'],
          ['Relative velocity',g[3]+' km/s'],['Abs. magnitude H',g[4]!=null?g[4]:'—']])
      .userData.earthAnchor={x:earth.x,y:earth.y,z:earth.z};   // rides with Earth in real time
  }
  // Fireballs — real atmospheric impacts plotted on Earth's surface at their true lat/lon
  if(typeof FIRECAT!=='undefined' && earth){
    const R=(earth._R||1.8)*1.03, pos=[];
    FIRECAT.forEach(g=>{ const la=g[2]*Math.PI/180, lo=g[3]*Math.PI/180;
      pos.push(earth.x+R*Math.cos(la)*Math.cos(lo), earth.y+R*Math.sin(la), earth.z+R*Math.cos(la)*Math.sin(lo)); });
    addCloud(pos,0xffb347,1.7,FIRECAT,'Fireball · atmospheric impact',
      g=>[['Date',g[0]],['Impact energy',g[1]!=null?g[1]+' kt TNT':'—'],['Latitude',g[2]+'°'],['Longitude',g[3]+'°'],
          ['Velocity',g[4]!=null?g[4]+' km/s':'—']])
      .userData.earthAnchor={x:earth.x,y:earth.y,z:earth.z};
  }
  // Artificial satellites — every active object in the CelesTrak catalogue, shells by real orbit size
  if(typeof SATCAT!=='undefined' && earth){
    const eR=(earth._R||1.8), pos=[];
    const mSc=earth._mSc||1, mRul=aR=>aR<=3? aR : 3+0.75*Math.log10(aR/3);   // the MOON's ruler + squash —
    SATCAT.forEach((g,i)=>{ const a=Math.max(6500,Math.min(50000,g[1]));     // so GEO stays inside the Moon
      const rr=Math.max(eR*1.03, eR*(1+(mRul(Math.max(1.02,a/6371))-1)*mSc));
      const inc=(g[2]||0)*Math.PI/180, th=((hash('sa'+i)%3600)/3600)*Math.PI*2, u=((hash('sb'+i)%3600)/3600)*Math.PI*2;
      const y=rr*Math.sin(u)*Math.sin(inc);
      const proj=Math.sqrt(Math.max(0,rr*rr-y*y));
      pos.push(earth.x+proj*Math.cos(th), earth.y+y, earth.z+proj*Math.sin(th)); });
    addCloud(pos,0xbfe9ff,1.1,SATCAT,'Artificial satellite · CelesTrak',
      g=>[['Name',g[0]],['Orbit',(g[1]-6371)>30000?'geostationary-class':(g[1]-6371)>1600?'medium Earth orbit':'low Earth orbit'],
          ['Mean altitude','~'+(g[1]-6371).toLocaleString()+' km'],['Period',g[3]+' min'],['Inclination',g[2]+'°'],['Launched',g[4]||'—']]);
    _xClouds[_xClouds.length-1].pts.userData.earthAnchor={x:earth.x,y:earth.y,z:earth.z};
    const stw=new Float32Array(SATCAT.length);               // real orbital period per satellite
    SATCAT.forEach((g,i)=>stw[i]=2*Math.PI*1440/Math.max(80,g[3]||1436));   // rad/day
    _xClouds[_xClouds.length-1].pts.userData.orbit={base:Float32Array.from(pos), w:stw, cx:earth.x, cz:earth.z};
  }
  // Confirmed impact structures — Earth's scars, at their true coordinates
  if(typeof CRATERCAT!=='undefined' && earth){
    const R=(earth._R||1.8)*1.04, pos=[];
    CRATERCAT.forEach(g=>{ const la=g[4]*Math.PI/180, lo=g[5]*Math.PI/180;
      pos.push(earth.x+R*Math.cos(la)*Math.cos(lo), earth.y+R*Math.sin(la), earth.z+R*Math.cos(la)*Math.sin(lo)); });
    addCloud(pos,0xff8c42,2.6,CRATERCAT,'Impact structure · confirmed',
      g=>[['Name',g[0]],['Country',g[1]],['Diameter',g[2]!=null?g[2]+' km':'—'],['Age',g[3]+' million years'],
          ['Latitude',g[4]+'°'],['Longitude',g[5]+'°']])
      .userData.earthAnchor={x:earth.x,y:earth.y,z:earth.z};
  }
  // Comets — isotropic swarm (long-period comets come from every direction)
  if(typeof COMCAT!=='undefined'){
    const pos=[]; COMCAT.forEach((g,i)=>{ const rr=rOfAu(Math.max(0.5,Math.min(59,g[0])));
      const th=((hash('k'+i)%3600)/3600)*Math.PI*2, tilt=((g[2]||0)*Math.PI/180)*(((hash('l'+i)%200)/100)-1);
      pos.push(rr*Math.cos(th)*Math.cos(tilt), rr*Math.sin(tilt), rr*Math.sin(th)*Math.cos(tilt)); });
    const cmc=addCloud(pos,0x8ce99a,1.6,COMCAT,'Comet · JPL SBDB',
      g=>[['Name',g[3]||'—'],['Semi-major axis',g[0]>=999?'~parabolic (long-period)':g[0]+' au'],['Eccentricity',g[1]],['Inclination',g[2]+'°']]);
    const cmw=new Float32Array(COMCAT.length); COMCAT.forEach((g,i)=>cmw[i]=kepW(g[0]));   // real a → long-period comets barely crawl
    cmc.userData.orbit={base:Float32Array.from(pos), w:cmw, cx:0, cz:0};
  }
}
function pickXCloud(e){
  if(!_ray) _ray=new THREE.Raycaster();
  const rect=elGraph.getBoundingClientRect();
  _ray.setFromCamera({x:((e.clientX-rect.left)/rect.width)*2-1, y:-((e.clientY-rect.top)/rect.height)*2+1}, Graph.camera());
  const cam=Graph.cameraPosition();
  _ray.params.Points.threshold=Math.max(0.2, Math.hypot(cam.x,cam.y,cam.z)/320);
  for(const xc of _xClouds){ if(!xc.pts.visible) continue;
    const h=_ray.intersectObject(xc.pts,false); if(h.length) return {xc,i:h[0].index}; }
  return null;
}
function showXPanel(hit){
  const g=hit.xc.data[hit.i]; if(!g) return; pph.style.display='none';
  let h=`<span class="tag" style="background:#ff9d76;color:#04121a;border-color:#ff9d76">${hit.xc.label} · NASA/JPL</span>`;
  h+=`<h2>${hit.xc.label.split(' ·')[0]}</h2><div class="rows">`+hit.xc.panelFn(g).map(r=>row(r[0],r[1])).join('')+`</div>`;
  h+=`<div class="note" style="font-style:normal;color:#dbe4ff">Live planetary-defence data from NASA/JPL CNEOS — see References.</div>`;
  pbd.innerHTML=h; panel.classList.add('open');
}
let _ray=null;                                    // lazy: THREE arrives via deferred ES module
function pickAsteroid(e){
  if(!_ray) _ray=new THREE.Raycaster();
  const rect=elGraph.getBoundingClientRect();
  _ray.setFromCamera({x:((e.clientX-rect.left)/rect.width)*2-1, y:-((e.clientY-rect.top)/rect.height)*2+1}, Graph.camera());
  const cam=Graph.cameraPosition();
  _ray.params.Points.threshold=Math.max(0.25, Math.hypot(cam.x,cam.y,cam.z)/300);
  for(const ac of _astClouds){ if(!ac.pts.visible) continue;
    const h=_ray.intersectObject(ac.pts,false); if(h.length) return {ac,i:h[0].index}; }
  return null;
}
function showAsteroidPanel(hit){
  const g=ASTCAT[hit.ac.map[hit.i]]; if(!g) return; pph.style.display='none';
  let h=`<span class="tag" style="background:#d9c58f;color:#04121a;border-color:#d9c58f">${hit.ac.label} · JPL SBDB</span>`;
  h+=`<h2>${hit.ac.label}</h2><div class="rows">`;
  h+=row('Semi-major axis',g[0]+' au')+row('Eccentricity',g[1])+row('Inclination',g[2]+'°');
  h+=row('Position','orbits at its true rate (Kepler, from real a) — phase in orbit randomised')+`</div>`;
  h+=`<div class="note" style="font-style:normal;color:#dbe4ff">One of 18,000 real orbits from the NASA/JPL Small-Body Database (1.55 million known).</div>`;
  pbd.innerHTML=h; panel.classList.add('open');
}

/* ===================== REAL-TIME ORBITS =====================
   planetNow() reads the actual clock — re-evaluate it continuously so every body with real
   elements keeps its TRUE position as time passes. The motion is genuinely real-time
   (Mercury drifts ~4°/day — invisible minute to minute, but the map is always right, and a
   tab left open follows the sky). Moon systems ride with their planet; Earth's satellite /
   close-approach / fireball / crater clouds translate with Earth. */
let _liveLast=0, _domLast=0, _orbLast=0, _earthNode=null;
function liveTick(now){
  if(_simLastReal==null) _simLastReal=now;
  if(_timeRate===1){ _simMs=Date.now(); }                      // real time: pinned to the true clock
  else _simMs+=(now-_simLastReal)*_timeRate;                   // time-lapse: same ephemeris, faster clock
  _simLastReal=now;
  if(_timeRate===1 && now-_liveLast<1000) return;   // real time: once a second ≫ any real angular rate
  _liveLast=now;                                    // time-lapse: every frame (motion is visible)
  const simD=(simNow()-_epochMs)/86400000;   // days since the statistical phases were laid out
  NODES.forEach(n=>{
    if(n.root||n.region||n.type==='star'||n.type==='moon') return;
    const live=planetNow(n.name);
    let x,y,z;
    if(live){ const r=rOfAu(n.au||1);
      x=r*Math.cos(live.lon); y=Math.sin(live.lat)*r; z=r*Math.sin(live.lon); }
    else if(n.au){   // no published elements (Ceres, Eris, comets…): TRUE Kepler rate, statistical phase
      if(n._th0==null){ n._th0=Math.atan2(n.z,n.x); n._r0=Math.hypot(n.x,n.z); n._y0=n.y; }
      const th=n._th0+kepW(n.au)*simD;
      x=n._r0*Math.cos(th); y=n._y0; z=n._r0*Math.sin(th); }
    else return;
    const dx=x-n.x, dy=y-n.y, dz=z-n.z;
    if(!dx&&!dy&&!dz) return;
    if(n.name==='Jupiter') jupLon=live.lon;
    n._p={x,y,z}; n.x=n.fx=x; n.y=n.fy=y; n.z=n.fz=z;
    if(n.__threeObj) n.__threeObj.position.set(x,y,z);
    n.childIds.forEach(id=>{ const c=byId[id];    // moons ORBIT their planet at their true period
      if(c._mo){ const th=c._mo.th0+c._mo.w*simD;
        c.x=c.fx=x+c._mo.rr*Math.cos(th)*c._mo.ct;
        c.y=c.fy=y+c._mo.rr*c._mo.st;
        c.z=c.fz=z+c._mo.rr*Math.sin(th)*c._mo.ct;
        if(c._p){ c._p.x=c.x; c._p.y=c.y; c._p.z=c.z; } }
      else{ c.x=c.fx=c.x+dx; c.y=c.fy=c.y+dy; c.z=c.fz=c.z+dz;
        if(c._p){ c._p.x+=dx; c._p.y+=dy; c._p.z+=dz; } }
      if(c.__threeObj) c.__threeObj.position.set(c.x,c.y,c.z); });
  });
  if(!_earthNode) _earthNode=NODES.find(n=>n.name==='Earth');
  if(_earthNode) _xClouds.forEach(xc=>{ const a=xc.pts.userData.earthAnchor;
    if(a) xc.pts.position.set(_earthNode.x-a.x, _earthNode.y-a.y, _earthNode.z-a.z); });
  // the Trojan swarms stay clamped to Jupiter's L4/L5 as it moves
  _astClouds.forEach(ac=>{ const j0=ac.pts.userData.jupLon0;
    if(j0!=null) ac.pts.rotation.y=-(jupLon-j0); });
  // every catalogue point orbits at its TRUE rate (Kepler III from its real a; satellites
  // by their real period) — phases are statistical, as each panel discloses
  if(now-_orbLast>120){ _orbLast=now;
    const upd=pts=>{ const ob=pts.userData.orbit; if(!ob) return;
      const arr=pts.geometry.attributes.position.array, b=ob.base;
      for(let i=0,j=0;j<arr.length;i++,j+=3){
        const A=ob.w[i]*simD, c=Math.cos(A), s=Math.sin(A);
        const px=b[j]-ob.cx, pz=b[j+2]-ob.cz;
        arr[j]=ob.cx+px*c-pz*s; arr[j+2]=ob.cz+px*s+pz*c; }   // θ → θ+A about the orbit centre
      pts.geometry.attributes.position.needsUpdate=true; };
    _astClouds.forEach(ac=>upd(ac.pts)); _xClouds.forEach(xc=>upd(xc.pts));
  }
  if(now-_domLast<500) return; _domLast=now;
  updateHud();   // the HUD clock ticks with the map clock
  // the open panel's "Position now" block ticks with the ephemeris
  const lr=document.getElementById('liverows');
  if(lr && _panelN && panel.classList.contains('open')) lr.innerHTML=livePosRows(_panelN);
}

/* ===================== LABELS (angular size + hide when inside) ===================== */
const labelLayer=document.createElement('div');
labelLayer.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:5;overflow:hidden';
document.body.appendChild(labelLayer);
const labelEls={};
function syncLabels(){
  NODES.forEach(n=>{ if(n===ROOT||labelEls[n.id]) return;
    const col=nodeColor(n);
    const el=document.createElement('div'); el.textContent=n.name;
    el.style.cssText=`position:absolute;left:0;top:0;opacity:0;transform:translate(-9999px,-9999px);`+
      `font:600 ${n.type==='moon'?9.5:12}px 'Space Grotesk',system-ui,sans-serif;color:#eaf0ff;white-space:nowrap;padding:2px 7px;`+
      `border-radius:6px;background:rgba(6,9,18,.62);border:1px solid ${col}66;backdrop-filter:blur(3px);text-shadow:0 1px 3px #000;will-change:transform`;
    labelLayer.appendChild(el); labelEls[n.id]=el; });
}
function tickLabels(){
  requestAnimationFrame(tickLabels);
  if(!Graph||!Graph.graph2ScreenCoords) return;
  liveTick(performance.now());   // real-time ephemeris — planets keep moving as the clock runs
  // spin each body at its true sidereal rate & direction, driven by the sim-clock so it
  // scales with the ⏱ time-lapse (retrograde for Venus & Uranus, prograde for the rest)
  if(_spinLast==null) _spinLast=simNow();
  const dSim=simNow()-_spinLast; _spinLast=simNow();
  if(dSim) _spinners.forEach(sp=>{ const h=ROT_H[sp._body]; if(!h) return;
    sp.rotation.y=(sp.rotation.y + dSim/(h*3600000)*2*Math.PI) % (2*Math.PI); });
  const W2=elGraph.clientWidth, H2=elGraph.clientHeight, SMALL=window.innerWidth<640, MAX=SMALL?12:44;
  let cam; try{ cam=Graph.cameraPosition(); }catch(e){ return; }
  const cand=[];
  for(const id in labelEls){ const n=byId[id], el=labelEls[id];
    if(hiddenTypes.has(n.type)){ el.style.opacity=0; continue; }
    const cd=Math.hypot(n.x-cam.x,n.y-cam.y,n.z-cam.z);
    if(n.region && cd<(n._R||0)*1.25){ el.style.opacity=0; continue; }   // inside a belt shell → no label
    const ly=n.region? n.y+(n._R||0)*0.74 : n.y;   // belt shells are Sun-centred — label the shell's crown, not the Sun
    let c; try{ c=Graph.graph2ScreenCoords(n.x,ly,n.z); }catch(e){ el.style.opacity=0; continue; }
    if(!c||isNaN(c.x)||c.x<-60||c.y<-30||c.x>W2+60||c.y>H2+30){ el.style.opacity=0; continue; }
    const base=n.region?(n._R*0.14):(n._R||0.5);
    cand.push({n,el,c,cd,ang:base/Math.max(4,cd)});
  }
  // big solid discs (the Sun, planets) occlude the labels of things BEHIND them
  const SOLID={star:1,planet:1,moon:1,dwarf:1};
  const f2=H2/(2*Math.tan(22.5*Math.PI/180)), occ=[];
  let vd=null; try{ vd=Graph.camera().getWorldDirection(new THREE.Vector3()); }catch(e){}
  if(vd) NODES.forEach(m=>{ if(!SOLID[m.type]||m.x==null||!m._R) return;
    // bodies BEHIND the camera project to ghost screen coords — they can't occlude anything
    if((m.x-cam.x)*vd.x+(m.y-cam.y)*vd.y+(m.z-cam.z)*vd.z<=0) return;
    const cdm=Math.hypot(m.x-cam.x,m.y-cam.y,m.z-cam.z), px=m._R/Math.max(0.05,cdm)*f2;
    if(px<26) return;
    let s; try{ s=Graph.graph2ScreenCoords(m.x,m.y,m.z); }catch(e){ return; }
    if(!s||isNaN(s.x)) return; occ.push({n:m,x:s.x,y:s.y,r:px,cd:cdm}); });
  cand.sort((a,b)=>b.ang-a.ang);
  const placed=[]; let shown=0;
  cand.forEach(o=>{
    if(occ.some(q=>q.n!==o.n && q.cd<o.cd && Math.hypot(q.x-o.c.x,q.y-o.c.y)<q.r*0.9)){ o.el.style.opacity=0; return; }
    if(shown>=MAX || o.ang<0.012 || placed.some(q=>Math.abs(q.x-o.c.x)<70 && Math.abs(q.y-o.c.y)<16)){ o.el.style.opacity=0; return; }
    placed.push(o.c); shown++;
    o.el.style.opacity=0.96; o.el.style.transform=`translate(-50%,-150%) translate(${o.c.x}px,${o.c.y}px)`;
  });
}
requestAnimationFrame(tickLabels);
boot();

/* ===================== PICKING (smallest visible bubble under the cursor) ===================== */
function pickNodeAt(e){
  if(!Graph||!Graph.camera) return null;
  if(!_ray) _ray=new THREE.Raycaster();
  const rect=elGraph.getBoundingClientRect();
  _ray.setFromCamera({x:((e.clientX-rect.left)/rect.width)*2-1, y:-((e.clientY-rect.top)/rect.height)*2+1}, Graph.camera());
  const meshes=[], m2n=new Map();
  NODES.forEach(n=>{ const o=n.__threeObj; if(o&&o.visible){ meshes.push(o); m2n.set(o,n); } });
  const hits=_ray.intersectObjects(meshes,true);   // recursive: textured bodies are Groups (sphere + ring children)
  const cam=Graph.cameraPosition(), H=elGraph.clientHeight||800, f=H/(2*Math.tan(22.5*Math.PI/180));
  let best=null, anyBest=null;
  hits.forEach(h=>{ let o=h.object; while(o&&!m2n.has(o)) o=o.parent; const n=o&&m2n.get(o); if(!n) return;
    if(!anyBest||(n._R||1)<(anyBest._R||1)) anyBest=n;
    const d=Math.hypot(n.x-cam.x,n.y-cam.y,n.z-cam.z), px=(n._R||1)/Math.max(0.5,d)*f;
    if(px<4) return;
    if(!best||(n._R||1)<(best._R||1)) best=n; });
  return best||anyBest;
}
/* desktop hover: the description panel follows WHATEVER is under the cursor — solid bodies,
   asteroid/comet/defence/satellite/crater points — same priority chain as a tap. */
let _pickedNode=null,_pickLast=0,_hoverKey=null;
elGraph.addEventListener('pointermove',e=>{
  if(_touchMode) return;
  const now=performance.now(); if(now-_pickLast<80) return; _pickLast=now;
  const node=pickNodeAt(e); _pickedNode=node;
  let hit=null;
  if(node && !node.region) hit={key:'n'+node.id, show:()=>showPanel(node)};
  else{
    const xh=pickXCloud(e);
    if(xh) hit={key:'x'+xh.xc.label+':'+xh.i, show:()=>showXPanel(xh)};
    else{ const ah=pickAsteroid(e);
      if(ah) hit={key:'a'+ah.ac.cls+':'+ah.i, show:()=>showAsteroidPanel(ah)};
      else if(node) hit={key:'n'+node.id, show:()=>showPanel(node)}; }   // belt shell only as last resort
  }
  elGraph.style.cursor=hit?'pointer':'grab';
  if(hit && hit.key!==_hoverKey){ _hoverKey=hit.key; hit.show(); }
  if(!hit) _hoverKey=null;
});
let _downXY=null,_activePointers=0,_multi=false,_touchMode=false,_downT=0;
elGraph.addEventListener('pointerdown',e=>{ _activePointers++; if(e.pointerType==='touch') _touchMode=true;
  if(_activePointers>1){ _multi=true; _downXY=null; return; }
  _multi=false; _downXY=[e.clientX,e.clientY]; _downT=performance.now(); },true);
const _endPtr=()=>{ _activePointers=Math.max(0,_activePointers-1); if(!_activePointers) _multi=false; };
elGraph.addEventListener('pointercancel',()=>{ _downXY=null; _endPtr(); },true);
elGraph.addEventListener('pointerup',e=>{ const wasMulti=_multi, dxy=_downXY; _endPtr();
  if(wasMulti||!dxy) return;
  const moved=Math.hypot(e.clientX-dxy[0],e.clientY-dxy[1]); _downXY=null;
  if(moved>=8||performance.now()-_downT>600) return;
  const node=pickNodeAt(e);
  if(node && !node.region){ onClick(node); return; }
  const xh=pickXCloud(e); if(xh){ showXPanel(xh); return; }
  const ah=pickAsteroid(e); if(ah){ showAsteroidPanel(ah); return; }
  if(node) onClick(node);
},true);
function onClick(n){ showPanel(n); updateCrumbs(n); flyTo(n); }

/* ===================== PANEL ===================== */
const panel=document.getElementById('panel'), pph=document.getElementById('pph'), pbd=document.getElementById('pbd');
document.getElementById('pclose').onclick=()=>panel.classList.remove('open');
function row(l,v){return `<div class="row"><div class="lab">${l}</div><div class="val">${v}</div></div>`;}
/* live "where is it RIGHT NOW" block — true ephemeris values, refreshed every second while
   the panel is open (liveTick rewrites #liverows). Only shown where the data is real:
   the Sun, the eight planets & Pluto (JPL elements) and their moons (they ride with the planet);
   bodies without Keplerian elements get an honest note instead. */
const LTMIN=8.3167464;   // light-minutes per au
function fmtDeg(rad){ let d=(rad*180/Math.PI)%360; if(d<0)d+=360; return d.toFixed(2)+'°'; }
function livePosRows(n){
  const E=planetNow('Earth'); if(!E) return '';
  const st=new Date(simNow()).toISOString();
  const cap=t=>`<div class="years" style="margin-top:9px">Position ${_timeRate===1?'now — live':'— time-lapse'} · ${st.slice(0,10)} ${st.slice(11,19)} UTC${t?' · '+t:''}</div>`;
  if(n.name==='The Sun')
    return cap()+`<div class="rows">`+row('Earth → Sun distance',E.r.toFixed(4)+' au ('+(E.r*LTMIN).toFixed(1)+' light-min)')
      +row('Earth heliocentric longitude',fmtDeg(E.lon))+`</div>`;
  const isMoon=n.type==='moon', body=isMoon? byId[n.parent] : n;
  const P=planetNow(body.name);
  if(!P){ if(n.region||n.root) return '';
    return cap()+`<div class="rows">`+row('Live ephemeris','—')+
      row('Placement',(n.au?('true semi-major axis '+n.au+' au · true orbital rate (Kepler)'):'catalogue data')+' · phase in orbit statistical')+`</div>`; }
  const dE=body.name==='Earth'? 0 : Math.hypot(P.vec.x-E.vec.x, P.vec.y-E.vec.y, P.vec.z-E.vec.z);
  let rows=row('Heliocentric longitude',fmtDeg(P.lon))+row('Heliocentric latitude',(P.lat*180/Math.PI).toFixed(2)+'°')
    +row('Sun distance',P.r.toFixed(4)+' au ('+(P.r*LTMIN).toFixed(1)+' light-min)');
  if(body.name!=='Earth') rows+=row('Earth distance',dE.toFixed(4)+' au ('+(dE*LTMIN).toFixed(1)+' light-min)');
  return cap(isMoon?('rides with '+body.name):'')+`<div class="rows">${rows}</div>`;
}
let _panelN=null;
function showPanel(n){
  _panelN=n;
  const col=nodeColor(n); pph.style.display='none';
  let h=`<span class="tag" style="background:${col};color:#04121a;border-color:${col}">${(TYPES[n.type]||{label:n.type}).label}${n.type==='moon'?' · '+byId[n.parent].name:''}</span>`;
  h+=`<h2>${n.name}</h2>`;
  if(n.type==='moon' && n.moon){
    const m=n.moon;
    if(m[2]) h+=`<div class="years">Satellite code ${m[2]} · ${m[0]} ${['I','II','III','IV'][+String(m[2]).slice(-2)-1]||''}</div>`;
    let rows='';
    if(m[3]) rows+=row('Mean radius',m[3].toLocaleString()+' km');
    if(m[4]) rows+=row('Mass',(m[4]>=1e5?(m[4]/1e4).toFixed(2)+'×10²³':m[4].toLocaleString()+'×10¹⁹')+' kg');
    if(m[5]) rows+=row('Orbit radius',m[5].toLocaleString()+' km');
    if(m[8]) rows+=row('Orbital period',m[8]+' days');
    if(m[6]!=null) rows+=row('Eccentricity',m[6]);
    if(m[7]!=null) rows+=row('Inclination',m[7]+'°'+(m[7]>90?' (retrograde)':''));
    h+=`<div class="rows">${rows}</div>`;
    h+=`<div class="note" style="font-style:normal;color:#dbe4ff">One of ${byId[n.parent].childIds.length.toLocaleString()} catalogued moons of ${m[0]} — data from NASA/JPL Solar System Dynamics.</div>`;
  } else if(n.meta){
    const m=n.meta, order=[['aka','Also known as'],['mass','Mass'],['diam','Diameter'],['dist','Distance'],['period','Orbital period'],['disc','Discovered'],['vis','Visibility']];
    let rows=''; order.forEach(([k,l])=>{ const v=m[k]; if(v&&v!=='—') rows+=row(l,v); });
    h+=`<div class="rows">${rows}</div>`;
    if(m.note) h+=`<div class="note" style="font-style:normal;color:#dbe4ff">${m.note}</div>`;
  }
  h+=`<div id="liverows">${livePosRows(n)}</div>`;
  pbd.innerHTML=h; panel.classList.add('open');
}

/* ===================== CRUMBS / LEGEND / HUD / SEARCH / CONTROLS ===================== */
function goTo(p){ if(p===ROOT||p._virtual){ updateCrumbs(ROOT); panel.classList.remove('open'); fitTop(); return; }
  updateCrumbs(p); showPanel(p); flyTo(p); }
function updateCrumbs(n){
  const path=[]; let c=n; while(c){path.unshift(c);c=c.parent?byId[c.parent]:null;}
  const el=document.getElementById('crumbs'); el.innerHTML='';
  path.forEach((p,i)=>{ const s=document.createElement('span'); s.className='crumb'+(i===path.length-1?' active':'');
    s.textContent=p._virtual?'☉ Solar System':p.name; s.onclick=()=>goTo(p); el.appendChild(s); });
  if(n!==ROOT && n.childIds.length){
    const sep=document.createElement('span'); sep.className='crumb-sep'; sep.textContent='▸'; el.appendChild(sep);
    n.childIds.slice(0,12).forEach(id=>{ const cn=byId[id]; const s=document.createElement('span'); s.className='crumb child';
      s.style.borderColor=nodeColor(cn); s.textContent=cn.name; s.onclick=()=>goTo(cn); el.appendChild(s); });
    if(n.childIds.length>12){ const s=document.createElement('span'); s.className='crumb child'; s.textContent='+'+(n.childIds.length-12)+' more moons'; el.appendChild(s); }
  }
}
function refreshLegendChips(){ _legendChips.forEach(c=>c.el.classList.toggle('off',!c.isOn())); }
function mkToggle(el,html,isOn,onToggle){
  const s=document.createElement('span'); s.className='lg tgl'+(isOn()?'':' off'); s.innerHTML=html;
  s.title='Click to show / hide';
  s.onclick=()=>{ onToggle(); s.classList.toggle('off', !isOn()); _syncLegendMaster(); };
  el.appendChild(s); _legendChips.push({el:s,isOn,toggle:onToggle}); return s;
}
function applyTypeVisibility(){ NODES.forEach(n=>{ const o=n.__threeObj; if(o) o.visible=!hiddenTypes.has(n.type); }); }

/* master tick box: one click selects / unselects every legend layer; shows a dash when mixed */
function _syncLegendMaster(){ const cb=document.getElementById('legend-all'); if(!cb) return;
  const on=_legendChips.filter(c=>c.isOn()).length;
  cb.checked = on===_legendChips.length; cb.indeterminate = on>0 && on<_legendChips.length; }
function _wireLegendMaster(el){
  el.insertAdjacentHTML('afterbegin',
    '<label class="lg" style="width:100%;cursor:pointer;user-select:none;margin-bottom:2px;color:#eaf0ff">'+
    '<input type="checkbox" id="legend-all" checked style="accent-color:#67e8f9;margin:0 7px 0 0;cursor:pointer;vertical-align:-2px">select / unselect all</label>');
  document.getElementById('legend-all').onchange=e=>{ const on=e.target.checked;
    _legendChips.forEach(c=>{ if(c.toggle && c.isOn()!==on) c.toggle(); });
    refreshLegendChips(); _syncLegendMaster();
    if(typeof bFields!=='undefined' && bFields){ fieldsOn=on; bFields.classList.toggle('active',on); } };
}
function buildLegend(){
  const el=document.getElementById('legend'); el.innerHTML='<b>OBJECT TYPES · click to hide / show</b>'; _wireLegendMaster(el);
  ['star','planet','moon','dwarf','belt','comet'].forEach(k=>{
    mkToggle(el,`<span class="sw" style="background:${TYPES[k].c}"></span>${TYPES[k].label}`,
      ()=>!hiddenTypes.has(k), ()=>{ hiddenTypes.has(k)?hiddenTypes.delete(k):hiddenTypes.add(k); applyTypeVisibility(); });
  });
  el.insertAdjacentHTML('beforeend','<b style="margin-top:6px">ASTEROIDS · NASA/JPL · click to hide / show</b>');
  setTimeout(()=>{ _astClouds.forEach(ac=>{
    const col='#'+ac.pts.material.color.getHexString();
    mkToggle(el,`<span class="sw" style="background:${col};border-radius:50%"></span>${ac.label.toLowerCase()}s`,
      ()=>ac.pts.visible, ()=>{ ac.pts.visible=!ac.pts.visible; }); });
    el.insertAdjacentHTML('beforeend','<b style="margin-top:6px">EARTH DEFENCE & COMETS · NASA/JPL CNEOS</b>');
    const SHORT={'Potentially hazardous asteroid':'hazardous asteroids (PHAs)','Sentry impact-risk object':'Sentry risk list',
      'Close approach (next 12 months)':'close approaches','Fireball · atmospheric impact':'fireballs','Comet · JPL SBDB':'comets',
      'Artificial satellite · CelesTrak':'satellites (active)','Impact structure · confirmed':'impact craters'};
    _xClouds.forEach(xc=>{ const col='#'+xc.pts.material.color.getHexString();
      mkToggle(el,`<span class="sw" style="background:${col};border-radius:50%"></span>${SHORT[xc.label]||xc.label}`,
        ()=>xc.pts.visible, ()=>{ xc.pts.visible=!xc.pts.visible; }); });
  },900);
}
const RATES=[[1,'⏱ Real time'],[86400,'⏩ 1 day / s'],[2592000,'⏩ 1 month / s'],[31557600,'⏩ 1 year / s']];
let _rateIx=0;
function updateHud(){
  const moons=NODES.filter(n=>n.type==='moon').length, ast=(typeof ASTCAT!=='undefined')?ASTCAT.length:0;
  const t=new Date(simNow()).toISOString();
  const mode=_timeRate===1?'live ephemeris':'time-lapse '+RATES[_rateIx][1].replace('⏩ ','');
  document.getElementById('hud').innerHTML=`the Sun · 8 planets · ${NODES.filter(n=>n.type==='dwarf').length} dwarf planets · ${moons} moons · ${ast.toLocaleString()} asteroid orbits<br/>${mode} — positions for ${t.slice(0,10)} ${t.slice(11,16)} UTC · drag to orbit · tap anything for its data`;
}
const bTime=document.getElementById('bTime');
if(bTime) bTime.onclick=()=>{ _rateIx=(_rateIx+1)%RATES.length; _timeRate=RATES[_rateIx][0];
  bTime.textContent=RATES[_rateIx][1]; bTime.classList.toggle('active',_timeRate!==1);
  if(_timeRate===1) _simMs=Date.now();   // back to real time = snap to the true clock
  updateHud(); };
const q=document.getElementById('q');
q.addEventListener('keydown',e=>{ if(e.key!=='Enter') return; const term=q.value.trim().toLowerCase(); if(!term) return;
  const hit=NODES.find(n=>n!==ROOT&&n.name.toLowerCase().includes(term));
  if(hit){ showPanel(hit); updateCrumbs(hit); flyTo(hit); } });
const bAll=document.getElementById('bAll'); if(bAll){ bAll.textContent='Overview'; bAll.onclick=()=>{ updateCrumbs(ROOT); panel.classList.remove('open'); fitTop(); }; }
document.getElementById('bFit').onclick=()=>fitTop();
document.getElementById('bReset').onclick=()=>{ updateCrumbs(ROOT); panel.classList.remove('open'); fitTop(); };
const citeBtn=document.getElementById('cite-btn'), citeBody=document.getElementById('cite-body');
if(citeBtn&&citeBody) citeBtn.onclick=()=>{ citeBody.hidden=!citeBody.hidden; citeBtn.classList.toggle('open',!citeBody.hidden); };
const legendBtn=document.getElementById('legend-btn'), legendEl=document.getElementById('legend');
if(legendBtn&&legendEl) legendBtn.onclick=()=>{ legendEl.classList.toggle('open'); legendBtn.classList.toggle('open', legendEl.classList.contains('open')); };
window.addEventListener('resize',()=>{ if(Graph){Graph.width(elGraph.clientWidth).height(elGraph.clientHeight);} });
