# How the data becomes the map

Technical notes on how every referenced dataset is placed, sized and coloured in
**Visual Data Cosmos** and **Visual Data Solar**. The governing rule throughout:
**pure coordinates** — every object sits at its true sky direction, real values are never
bent for design, and wherever a compromise is unavoidable (log compression, statistical
phases, visibility floors) it is disclosed here and in the object's own panel.

---

## 1. The common geometry

**Observer.** All astronomy is measured from Earth, so every direction is computed from
the Solar System's position on the map. A catalogue's RA/Dec (equatorial J2000) becomes a
unit vector:

```
x = cos(dec)·cos(ra)      y = sin(dec)      z = cos(dec)·sin(ra)
```

+Y is celestial north. An object's map position is `observer + direction × r`, where `r`
comes from one of the radial rulers below. **Directions are always exact**; only radial
depth is compressed.

**Why compression is unavoidable.** The map spans ~20 orders of magnitude (a 22 km pulsar
to the 93-Gly observable universe). Drawn linearly, either the Solar System is sub-pixel
or the CMB is beyond any screen. Every ruler is therefore logarithmic or piecewise-linear,
built so that **ordering and ratios of real distances are preserved** even when absolute
spacing is not.

**The containment hierarchy.** The map is the real one: Laniakea ⊃ Virgo Supercluster ⊃
{Virgo Cluster, Local Group ⊃ Milky Way ⊃ Solar System}. Containers are translucent glass
you can fly through. Inside every container, children with published RA/Dec + distance are
placed at their true direction from the observer, with radii log-mapped across the parent
bubble from the children's real distance range. The chain of bubbles that contains *us* is
pinned first and sets the inner scale. Satellite swarms whose members all lie at one
distance (e.g. M32/M110 around Andromeda) keep a packed layout — an observer-ray placement
would collapse them onto a single line (max/min distance ratio < 1.6 triggers this guard).

**Sizes.** Rendered radii follow the data through power laws chosen per regime:
- generic leaf objects: radius ∝ log₁₀(true diameter);
- stars: true diameter ratio to the Sun, compressed `^0.28`, capped at 4× (a linear
  UY Scuti would fill the screen);
- planets: true ratio to their host star `^0.45` — the displayed Sun/Earth ratio is
  exactly 109^0.45 ≈ 8.3;
- moons: **true ratio `^1.0`** to their planet (the Moon renders at 27.3% of Earth,
  Ganymede at 3.8% of Jupiter), with a small visibility floor for km-scale moons —
  a to-scale Phobos would be 1/300 of Mars and invisible;
- galaxies: real diameter ratios anchored at the Milky Way (`^0.45`, clamped ×4), so
  Andromeda > Milky Way > Triangulum > LMC as in reality.

**Galaxy morphology.** Galaxy bubbles are flattened by their real type (spirals to 0.24 of
their height, lenticulars 0.42, ellipticals 0.62, irregulars 0.5). The Milky Way's disc is
oriented to the true north galactic pole (RA 192.859°, Dec +27.128°), and the bright-star
sprinkle inside it is squashed 72% into that plane, so the map's disc matches the real
galactic plane on the sky.

**The Solar System (cosmos app).** The Sun is pinned at the bubble's centre; planets ring
it on a piecewise-log au ruler (0.35–1.5 au, 1.5–60 au, 60–10⁵ au segments — the same
ruler the asteroid populations use). The Asteroid and Kuiper belts and the Oort Cloud are
concentric shells around the Sun, never floating side-bubbles. Orbital *phases* here are
statistical; radii are the true semi-major axes. Moons sit at their **exact semi-major
axis in planet radii up to 3 radii** (Phobos at its true 2.77 Mars radii), log-compressed
beyond — the real Moon at 60 Earth radii would otherwise sit past Venus, since planets are
drawn ~10⁴× larger than their orbital separations.

**The map is a timeline.** Light-travel distance in Gly equals lookback time in Gyr.
Every survey point and every named object with a Gly distance shows its cosmic date —
lookback time and the Universe's age at emission — computed with a flat-ΛCDM age formula
(H₀ = 67.7, Ωm = 0.31): `age(z) = 11.60 · asinh(1.4936 · (1+z)^−1.5)` Gyr.

---

## 2. Cosmos — dataset by dataset

| Dataset | Extraction | Placement | What's real / what's not |
|---|---|---|---|
| **Yale Bright Star Catalogue** (9,096 naked-eye stars) | BSC5 fixed-width file parsed (RA, Dec, Vmag, spectral type) | Celestial sphere centred on the Solar System; radius scaled by magnitude (brighter ≈ nearer); squashed into the galactic plane | Directions exact; depth is a magnitude **proxy** (BSC has no distances). Colour = real spectral class (O–M) |
| **SDSS DR17 galaxies** (19,983) | SkyServer SQL; `specObjID % 55` **modulo sampling** for a uniform all-footprint sample (naive `TOP N` returns one dense stripe) | r linear in z from the Laniakea shell (z=0) to the deep shell (z=0.35) | RA/Dec/z all real. Colour: violet→warm by redshift. The visible wedge and empty band are the real survey footprint and zone of avoidance |
| **DESI DR1 galaxies** (22,479) | NOIRLab Astro Data Lab TAP (`desi_dr1.zpix`), uniform `random_id` sampling, z ≤ 1.6 | **Same ruler as SDSS for z ≤ 0.35** so the two surveys' cosmic web aligns — the comparison is built into the geometry — then continues to z = 1.6 (~4× deeper) | All real. Emerald→lime by z |
| **SDSS quasars** (9,428) | SkyServer SQL, z 0.1–5 | Deep shell beyond the galaxy surveys, r linear in z | All real. Orange→deep-red by z |
| **DESI DR1 quasars** (10,867) | Same TAP source, `spectype='QSO'` | **Identical ruler to the SDSS quasar shell** — its independent twin | All real. Rose→violet by z |
| **2MRS** (21,754 all-sky galaxies, Huchra+ 2012) | VizieR extract | Fills the local volume (z ≤ 0.05) the SDSS wedge misses — the only all-sky layer | All real |
| **HETDEX** (16,000 sources) | Public Source Catalog 1 | Shell by z up to ~4.2 | All real |
| **Milky Way globular clusters** (145, Harris 1996) | VizieR TSV | True 3-D: sky direction from the Sun + catalogued R☉ | Fully 3-D real |
| **Local Group dwarfs** (101, McConnachie 2012) | VizieR TSV | True 3-D from the Milky Way + catalogued distances | Fully 3-D real |
| **Virgo & Coma members** (542 + 958) | SDSS sky-box + cluster-z queries | Sky offsets across the cluster bubble; depth by z | Directions and z real |
| **M31 globulars** (625, RBC v5), M33/M81/M51/M82/M101/Cen A/Sombrero/Antennae clusters | VizieR per-catalogue extracts | Sky offsets from the host galaxy's centre; depth jittered by name-hash | Directions real; **line-of-sight depth statistical** (these catalogues have no individual distances) — noted in panels |
| **Gaia cluster stars** (Pleiades/Hyades members; 4×3,200 globular-cluster cones, DR2/DR3) | VizieR | Inside their cluster bubbles at catalogued offsets | Real |
| **Open clusters, Local Volume galaxies** (Cantat-Gaudin 2020; Karachentsev 2013) | VizieR | True 3-D (distances catalogued) | Real |
| **Exoplanets** (NASA Exoplanet Archive) | API extract | At the host system's true 3-D position | Real (host positions) |
| **Citizen candidates** (3,964 ExoFOP CTOIs; 582 Backyard Worlds brown dwarfs) | ExoFOP CSV / VizieR | Host sky positions; CTOIs carry **per-point discoverer credit** | Real |
| **Pulsars** (ATNF) | Catalogue extract | Sky direction + DM-derived distances in the disc | Real |
| **Supernova remnants** (Green 2019) | VizieR | True sky direction in the Milky Way disc | Directions real; **the catalogue has no distances** — disc-like statistical depth, disclosed in the panel |
| **Planetary nebulae** (Acker+ 1992) | VizieR | Sky directions in the disc | As above |
| **Fast radio bursts** (CHIME/FRB Cat 1) | VizieR | Direction real; depth scaled from **dispersion measure** (a proxy) | Disclosed as proxy |
| **GW events** (GWTC/GWOSC, through O4) | GWOSC event API | Radius = real luminosity distance | GW sky localisation spans hundreds of deg² — **direction statistical**, distance real |
| **Named objects** (325: stars, galaxies, quasars, BHs, record-holders) | NED/SIMBAD/literature per object | True RA/Dec + published distance on the hierarchy rulers | Real; each carries its citation (e.g. Euclid z=7.77 quasars — Yang+ 2026; MoM-z14 — Naidu+ 2025) |
| **Dark matter / dark energy / antimatter / intergalactic gas** | — | Volumetric point *fields*, not located objects | **Conceptual**: these have no coordinates to honour; rendered as pervasive fields and labelled as such |

---

## 3. Solar — dataset by dataset

| Dataset | Extraction | Placement / motion | What's real / what's not |
|---|---|---|---|
| **Planet positions** | JPL *Approximate Positions of the Planets* (Standish Keplerian elements + centennial rates, valid 1800–2050) | Kepler's equation solved per frame for **the actual clock time**; true heliocentric longitude/latitude/r on a log-au ruler. Re-evaluated continuously — a tab left open follows the sky. The ⏱ control runs the *same ephemeris* on a faster clock (1 day/s · 1 month/s · 1 year/s) | Fully real, live |
| **459 moons** (JPL SSD) | Physical parameters + orbital elements | Exact semi-major axis in planet radii ≤ 3, log beyond; **revolve at their true periods** (Triton retrograde); sizes = true diameter ratio | Orbit radius, period, direction real; orbital *phase* statistical |
| **18,000 asteroids** (JPL SBDB) | a/e/i extract (main belt, Trojans, TNOs) | Radius from real a; tilt from real i; each point advances at its true Kepler rate ω = 2π/a^1.5 — the inner belt visibly shears past the outer. Trojans stay clamped to Jupiter's moving L4/L5 | a/e/i and rates real; phase along orbit randomised (stated in every panel) |
| **Comets** (SBDB) | a/e/i | As asteroids; long-period comets correctly barely crawl | Same disclosure |
| **15,932 satellites** (CelesTrak GP) | Period/inclination/altitude | Shells by real orbit size on the same ruler as the Moon (GEO stays inside the Moon's orbit); each circles Earth at its **real period** | Orbit size/period real; phase statistical |
| **Planetary defence** (NASA/JPL CNEOS) | Sentry, PHAs, close approaches, fireballs APIs | PHAs by real a/e/i; close approaches ringed by **real miss distance** (mapped on the Moon's ruler, so < 1 lunar distance plots inside the Moon's orbit); fireballs at their true impact lat/lon on Earth's globe | Real, with the same phase caveat for PHAs |
| **86 impact craters** | Earth Impact Database | True lat/lon on Earth's surface | Real |
| **Imagery** | Solar System Scope (CC BY 4.0) + NASA/JPL/USGS mission mosaics via Stellarium | Textured spheres | Real photography/mosaics |
| **Live panels** | computed | Every body shows heliocentric longitude/latitude, Sun distance and Earth distance in au + light-minutes for the displayed instant | Real |

---

## 4. Honesty rules

1. **Direction beats depth.** Sky directions are never altered. Radial compression is the
   one deliberate distortion, and it is monotone: farther is always drawn farther.
2. **Statistical means labelled.** Wherever a phase, depth or direction is randomised
   because the source has no such measurement, the object's panel says so.
3. **Floors and caps are minimal.** Visibility floors (e.g. km-scale moons) and size caps
   (supergiant stars) exist only to keep real objects visible/on-screen; every ratio the
   eye can compare is derived from catalogue values.
4. **Every dataset is cited** in the in-app ✦ References panel and in
   [DATA.md](DATA.md), and the data files ship in the repo under their original terms.

Compiled by [Liako](https://liako.eu).
