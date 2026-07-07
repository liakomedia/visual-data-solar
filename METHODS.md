# How the data becomes the map — Visual Data Solar

Technical notes on how every referenced dataset is placed, sized, coloured and — unique to
this app — **moved** in Visual Data Solar. The governing rules: positions come from real
ephemerides and catalogues, motion runs at true rates, and wherever a value is statistical
rather than measured (an asteroid's phase along its orbit), the object's own panel says so.

---

## 1. The map clock

Everything in the app is a function of one clock, `simNow()`:

- **Real time (default):** the clock is pinned to the actual system time. Planet positions
  are re-evaluated against it continuously, so the map is always *the Solar System right
  now* — a tab left open overnight shows tomorrow's sky. Real motion is imperceptible
  minute-to-minute (Earth ≈ 1°/day) but always correct.
- **Time-lapse (⏱ control):** the same clock multiplied — 1 day/s, 1 month/s, 1 year/s.
  Nothing switches to an animation: the identical ephemeris is simply evaluated at a
  faster-running time, so every relative rate stays true (Mercury laps Neptune correctly).

The HUD and every open panel display the clock's current instant (UTC).

## 2. Planet positions — the live ephemeris

Planets (plus Pluto) use JPL's *Approximate Positions of the Planets* (Standish):
Keplerian elements with centennial rates, valid 1800–2050. Per evaluation:

1. Julian date from the map clock; centuries since J2000: `T = (JD − 2451545)/36525`.
2. Elements at date: `a, e, i, L, ϖ, Ω` each corrected by its rate × T.
3. Mean anomaly `M = L − ϖ` (normalised to ±180°); **Kepler's equation** `E − e·sin E = M`
   solved by Newton iteration (6 steps).
4. True anomaly ν from E; heliocentric ecliptic longitude λ, latitude β, and true radius
   `r = a(1 − e·cos E)` in au.

The panel's live block shows these directly: heliocentric longitude/latitude, Sun distance
and Earth distance (vector difference of the two ephemeris positions) in au and
light-minutes — for the exact displayed instant.

**The radial ruler.** True au compress onto screen radii logarithmically:
`r(au) = 8 + 56 · (log₁₀ au − log₁₀ 0.35) / (log₁₀ 60 − log₁₀ 0.35)` — Mercury's 0.39 au
lands at ~8 units, the Kuiper belt's 50 au at ~62. Ordering and log-ratios of real
distances are preserved; absolute spacing is not (a linear Solar System is ~10⁴× wider
than its planets).

**Sizes.** Planet radii follow `0.05 · diameter^0.38` (a power law keeps the real
planet ≫ moon contrast visible); the Sun is capped (a raw power-law Sun would swallow
Mercury's orbit — the classic trap of compressed rulers).

## 3. Moons — 459, orbiting for real

Source: NASA/JPL Solar System Dynamics (physical parameters + orbital elements per moon).

- **Size = true diameter ratio (`^1.0`)** to the parent planet: the Moon renders at 27.3%
  of Earth, Ganymede at 3.8% of Jupiter, Charon at 51% of Pluto — exactly the catalogue
  ratios. A small visibility floor keeps km-scale moons (Phobos, Deimos) from vanishing;
  it is the only departure from the pure ratio.
- **Orbit radius:** the true semi-major axis expressed in planet radii, drawn **exactly up
  to 3 radii** (Phobos really sits at 2.77 Mars radii) and log-compressed beyond
  (`3 + 0.75·log₁₀(aR/3)`) — the real Moon at 60 Earth radii would otherwise sit past
  Venus. Sprawling irregular-moon swarms are proportionally squashed only if they would
  invade a neighbouring planet.
- **Motion:** every moon revolves at its **true period** from the JPL elements —
  Phobos whips around Mars in its real 7.7 hours of map-clock time, the Moon takes its
  27.3 days, and **Triton orbits Neptune retrograde** (inclination > 90° or negative
  period flips the direction). Phases along the orbit are statistical (the extract has
  elements, not epochs) — the one disclosed approximation.

## 4. Asteroids, Trojans, TNOs, comets — 18,000 real orbits in motion

Source: JPL Small-Body Database (semi-major axis, eccentricity, inclination per object).

- Radius from the real `a` on the au ruler; vertical tilt from the real inclination;
  the position *along* the orbit is randomised — stated in every point's panel.
- **Each point advances at its true Kepler rate** `ω = 2π / a^1.5` (rad/year): in
  time-lapse the inner belt visibly shears past the outer belt — differential rotation
  straight from Kepler's third law, not an animation.
- **Jupiter Trojans stay clamped to the moving L4/L5 points**: the two swarms rotate with
  the live Jupiter longitude, 60° ahead and behind.
- Comets use their real `a` too — long-period comets correctly barely crawl.
- **3I/ATLAS**, the third interstellar object, is placed at its current true outbound
  distance (crossing Saturn's orbit as of July 2026).

## 5. Earth's neighbourhood

Everything Earth-anchored shares **the Moon's ruler**, so relative ordering can never
silently break (satellites must stay inside the Moon's orbit, as in reality):

- **15,932 active satellites** (CelesTrak GP): shells by real orbit size mapped through
  the moon ruler — LEO hugs the globe, geostationary sits at the outer shell edge, all
  inside the Moon. Each satellite **circles at its real period** (a LEO in ~90 simulated
  minutes); the whole population translates with Earth as it orbits.
- **Close approaches** (CNEOS CAD): each object ringed at its **real miss distance**,
  converted lunar distances → Earth radii on the same ruler — approaches nearer than the
  Moon plot inside its orbit, farther ones beyond, as physically happened.
- **Fireballs** (CNEOS) and **86 confirmed impact craters** (Earth Impact Database):
  plotted at their true latitude/longitude on Earth's textured globe.
- **PHAs and Sentry risks** (CNEOS): hazardous asteroids by real a/e/i (with the phase
  caveat); the Sentry list as a marked ring (its catalogue carries risk metrics, not
  orbits — disclosed).

## 6. Imagery and panels

- Surface imagery: Solar System Scope 2k maps (CC BY 4.0) for the Sun, planets and the
  Moon; NASA/JPL/USGS mission mosaics (Voyager, Galileo, Cassini, New Horizons, Dawn — via
  Stellarium) for the major moons and dwarf planets. Rendered unlit at full brightness;
  the global THREE revision is pinned to match the bundled renderer (a mismatch makes
  textures sample black).
- Every object's panel combines catalogue facts (mass, diameter, period, discovery) with
  the **live position block** for the current map-clock instant.

## 7. Honesty rules

1. Positions and rates come from ephemerides and catalogues; the only deliberate
   distortion is the monotone log compression of radial distance.
2. Statistical values (orbital phases; Sentry ring) are labelled in the panels
   ("true orbital rate (Kepler) · phase in orbit statistical").
3. Visibility floors and the Sun's cap exist only to keep real objects visible; every
   ratio the eye can compare derives from catalogue values.
4. Every dataset is cited in the in-app ✦ References panel and in [DATA.md](DATA.md);
   data files ship under their original source terms.

Compiled by [Liako](https://liako.eu).
