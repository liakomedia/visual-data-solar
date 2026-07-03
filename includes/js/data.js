/* visual-data-solar — DATA. Loaded before app.js.
   P(aka, mass, diam, dist, period, disc, vis, note) — panel fields for solar-system bodies. */
const P=(aka,mass,diam,dist,period,disc,vis,note)=>({aka,mass,diam,dist,period,disc,vis,note});

const DATA={name:"The Solar System",root:true,virtual:true,children:[

{name:"The Sun",type:"star",diam:1392700,au:0,meta:P("Sol, Helios","1.989×10³⁰ kg (99.86% of the system)","1,392,700 km (109 Earths)","centre of the system","—","known since antiquity","the daytime sky",
 "A G2V yellow dwarf, ~4.6 billion years old, surface ~5,778 K. Fuses ~600 million tonnes of hydrogen every second.")},

{name:"Mercury",type:"planet",diam:4879,au:0.387,meta:P("—","3.30×10²³ kg (0.055 M⊕)","4,879 km","0.39 au · 57.9 million km","88 days","known since antiquity","twilight, near the Sun",
 "The smallest planet — scorched, cratered and airless; a year lasts just 88 days but a solar day lasts 176.")},
{name:"Venus",type:"planet",diam:12104,au:0.723,meta:P("Morning Star, Evening Star","4.87×10²⁴ kg (0.815 M⊕)","12,104 km","0.72 au · 108.2 million km","225 days","known since antiquity","brightest planet in the sky",
 "A runaway greenhouse: ~465 °C beneath crushing CO₂ clouds; it spins backwards, slower than it orbits.")},
{name:"Earth",type:"planet",diam:12742,au:1,meta:P("Terra, the Blue Planet","5.97×10²⁴ kg (1 M⊕)","12,742 km","1 au · 149.6 million km (defines the unit)","365.25 days","—","home",
 "The only world known to harbour life; 71% ocean, one large moon that stabilises its axial tilt.")},
{name:"Mars",type:"planet",diam:6779,au:1.524,meta:P("The Red Planet, Ares","6.42×10²³ kg (0.107 M⊕)","6,779 km","1.52 au · 227.9 million km","687 days","known since antiquity","bright reddish 'star'",
 "A cold desert world: Olympus Mons (the tallest volcano known), Valles Marineris, polar ice caps and ancient riverbeds.")},
{name:"Jupiter",type:"planet",diam:139820,au:5.203,meta:P("Jove","1.90×10²⁷ kg (318 M⊕)","139,820 km (11 Earths across)","5.20 au · 778.5 million km","11.9 years","known since antiquity","very bright",
 "The giant of the system — more massive than all other planets combined; the Great Red Spot is a storm larger than Earth, raging for centuries.")},
{name:"Saturn",type:"planet",diam:116460,au:9.537,meta:P("—","5.68×10²⁶ kg (95 M⊕)","116,460 km (rings span ~280,000 km)","9.54 au · 1.43 billion km","29.5 years","known since antiquity","bright; rings visible in any telescope",
 "The ringed jewel: billions of ice fragments form rings just ~10 m thick in places. Less dense than water.")},
{name:"Uranus",type:"planet",diam:50724,au:19.19,meta:P("—","8.68×10²⁵ kg (14.5 M⊕)","50,724 km","19.2 au · 2.87 billion km","84 years","W. Herschel, 1781","just visible to the naked eye",
 "An ice giant tipped 98° on its side — it rolls around its orbit, with 42-year-long polar seasons.")},
{name:"Neptune",type:"planet",diam:49244,au:30.07,meta:P("—","1.02×10²⁶ kg (17 M⊕)","49,244 km","30.1 au · 4.50 billion km","165 years","Le Verrier · Galle, 1846","telescope only",
 "The windiest world — supersonic methane winds over 2,000 km/h; found by mathematics before it was seen.")},

{name:"Ceres",type:"dwarf",diam:940,au:2.77,meta:P("1 Ceres","9.4×10²⁰ kg","940 km","2.77 au (in the main belt)","4.6 years","G. Piazzi, 1801","binoculars",
 "The largest object of the asteroid belt and the first discovered; a dwarf planet with briny ice deposits.")},
{name:"Pluto",type:"dwarf",diam:2377,au:39.48,meta:P("134340 Pluto","1.31×10²² kg","2,377 km","39.5 au (crosses inside Neptune)","248 years","C. Tombaugh, 1930","large telescope",
 "The king of the Kuiper belt, with a nitrogen-ice heart (Sputnik Planitia) and five moons — nearly a binary with Charon.")},
{name:"Haumea",type:"dwarf",diam:1600,au:43.2,meta:P("136108 Haumea","4.0×10²¹ kg","~1,600 km (elongated)","43.2 au","284 years","2004","large telescope",
 "An egg-shaped dwarf spinning every 4 hours — fast enough to stretch it — with a ring and two moons.")},
{name:"Makemake",type:"dwarf",diam:1430,au:45.8,meta:P("136472 Makemake","~3×10²¹ kg","1,430 km","45.8 au","306 years","2005","large telescope",
 "A bright, reddish classical Kuiper-belt dwarf planet with one known moon.")},
{name:"Eris",type:"dwarf",diam:2326,au:67.8,meta:P("136199 Eris","1.66×10²² kg","2,326 km","67.8 au (scattered disc)","558 years","M. Brown et al., 2005","large telescope",
 "More massive than Pluto — its discovery forced the definition of 'planet' and Pluto's reclassification.")},
{name:"Sedna",type:"dwarf",diam:1000,au:85,meta:P("90377 Sedna","~10²¹ kg","~1,000 km","~85 au now · out to 937 au","~11,400 years","M. Brown et al., 2003","large telescope",
 "A deep-red world on an extreme orbit that never comes near the planets — a clue to the outer system's history.")},

{name:"Asteroid Belt",type:"belt",region:true,au:2.7,meta:P("the main belt","~3×10²¹ kg total (4% of the Moon)","ring from 2.2 to 3.3 au","2.2–3.3 au","—","Ceres first, 1801","—",
 "Millions of rocky bodies between Mars and Jupiter — leftover building blocks that Jupiter's gravity never let become a planet. The points shown are 12,000 real orbits from NASA/JPL.")},
{name:"Kuiper Belt",type:"belt",region:true,au:40,meta:P("Edgeworth–Kuiper belt","~2% of Earth's mass","ring from 30 to 50 au","30–50 au","—","first object 1992","—",
 "The icy frontier beyond Neptune — home of Pluto, Haumea, Makemake and billions of comet nuclei. Shown with 3,000 real trans-Neptunian orbits from NASA/JPL.")},
{name:"Oort Cloud",type:"belt",region:true,au:10000,meta:P("Öpik–Oort cloud","uncertain — trillions of nuclei","spherical shell, ~2,000–100,000 au","out to ~1.5 light-years","—","hypothesised by Oort, 1950","never observed directly",
 "A vast hypothesised sphere of icy bodies marking the Sun's gravitational edge — the source of long-period comets.")},

{name:"Halley's Comet",type:"comet",diam:11,au:17.8,meta:P("1P/Halley","2.2×10¹⁴ kg","~11 km nucleus","0.6–35 au (elliptical)","~76 years","recognised periodic by Halley, 1705","naked-eye at each return",
 "The most famous comet — recorded since 240 BC; next perihelion in 2061.")},
{name:"Comet Hale–Bopp",type:"comet",diam:60,au:186,meta:P("C/1995 O1","~10¹⁶ kg","~60 km nucleus","0.9–371 au","~2,500 years","Hale & Bopp, 1995","the great comet of 1997",
 "Visible to the naked eye for a record 18 months.")},
{name:"'Oumuamua",type:"comet",diam:0.2,au:25,meta:P("1I/'Oumuamua","—","~100–200 m, cigar-shaped","interstellar — passed through in 2017","—","Pan-STARRS, 2017","was very faint",
 "The first confirmed visitor from another star system, tumbling through on a hyperbolic orbit.")},
{name:"2I/Borisov",type:"comet",diam:1,au:30,meta:P("Comet Borisov","—","~1 km nucleus","interstellar — passed through in 2019","—","G. Borisov, 2019","telescope",
 "The first clearly cometary interstellar object — chemistry unlike most home-grown comets.")},

]};

/* colour palette */
const TYPES={
 star:{c:"#ffd27f",label:"The Sun"},
 planet:{c:"#5aa9e6",label:"Planet"},
 moon:{c:"#c8ccd4",label:"Moon"},
 dwarf:{c:"#b7a17e",label:"Dwarf planet"},
 belt:{c:"#7fe0d4",label:"Belt / region"},
 comet:{c:"#8ce99a",label:"Comet"}
};
/* per-planet tints so each moon system reads as a family */
const PLANET_TINT={Mercury:"#b9b9c9",Venus:"#e8c88f",Earth:"#5aa9e6",Mars:"#e07a5f",Jupiter:"#d9a066",Saturn:"#e6d29a",Uranus:"#9fd8e0",Neptune:"#6f8fe8",Pluto:"#c9b8a8"};
