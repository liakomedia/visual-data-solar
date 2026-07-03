# Data sources — Visual Data Solar

Every dataset used by the app, with its source and citation. The data files shipped in
this repository are compact derived extracts of these sources; they are **not** covered by
the repository's MIT licence and remain under the terms of the original providers. If you
reuse them, cite the sources below. Compiled by [Liako](https://liako.eu).

| Dataset | In-repo file | Source | Citation |
|---|---|---|---|
| Moons — physical parameters & orbits (459) | `includes/js/moons.js` | [NASA/JPL Solar System Dynamics](https://ssd.jpl.nasa.gov/sats/phys_par/) | JPL SSD |
| Asteroids & comets (18,000 real orbits) | `includes/js/asteroids.js` | [NASA/JPL Small-Body Database](https://ssd.jpl.nasa.gov/tools/sbdb_query.html) | JPL SBDB |
| Potentially hazardous asteroids | `includes/js/defence.js` | [NASA/JPL CNEOS](https://cneos.jpl.nasa.gov) | CNEOS |
| Sentry impact-risk list | `includes/js/defence.js` | [CNEOS Sentry](https://cneos.jpl.nasa.gov/sentry/) | CNEOS Sentry |
| Close approaches (next 12 months) | `includes/js/defence.js` | [CNEOS CAD](https://cneos.jpl.nasa.gov/ca/) | CNEOS |
| Fireballs (atmospheric impacts) | `includes/js/defence.js` | [CNEOS Fireballs](https://cneos.jpl.nasa.gov/fireballs/) | CNEOS |
| Active satellites (15,932) | `includes/js/satellites.js` | [CelesTrak GP catalogue](https://celestrak.org) | Kelso, CelesTrak |
| Confirmed impact structures (86) | `includes/js/craters.js` | [Earth Impact Database / Wikipedia](https://en.wikipedia.org/wiki/List_of_impact_structures_on_Earth) | PASSC Earth Impact Database |
| Planet positions (live, in-app) | computed in `includes/js/app.js` | [JPL Approximate Positions of the Planets](https://ssd.jpl.nasa.gov/planets/approx_pos.html) | Standish (JPL), Keplerian elements 1800–2050 |
| Planetary data (masses, diameters, periods) | `includes/js/data.js` | [NASA NSSDCA Planetary Fact Sheets](https://nssdc.gsfc.nasa.gov/planetary/factsheet/) | NSSDCA |

## Imagery (`includes/images/tex/`)

| Imagery | Source | Licence |
|---|---|---|
| Sun, planets, the Moon (2k maps) + Saturn ring | [Solar System Scope](https://www.solarsystemscope.com/textures/) | **CC BY 4.0** |
| Moon & dwarf-planet global mosaics (Io, Europa, Ganymede, Callisto, Titan, Enceladus, Triton, Pluto, Charon, Ceres, …) | NASA/JPL/USGS — Voyager, Galileo, Cassini, New Horizons & Dawn missions, via [Stellarium](https://github.com/Stellarium/stellarium/tree/master/textures) | NASA imagery: public domain; check per-file notes in Stellarium |

## Regenerating the data

`scripts/` holds the one-shot Node.js parsers that turned the raw downloads (JPL/CNEOS
API responses, CelesTrak GP data, impact-structure tables) into the compact JS arrays
the app ships with — kept for transparency and reproducibility.
