// lib/flightPhaseEvents.ts

export type FlightPhase =
  | "gate"
  | "pushback"
  | "taxi"
  | "takeoff"
  | "climb"
  | "cruise"
  | "descent"
  | "approach"
  | "landing"
  | "taxi-in";

export interface FlightPhaseEvent {
  id: string; // unique per event so we can track "seen"
  trigger: string; // what the user notices (sound/feel/smell)
  explanation: string; // plain-language translation
  whyItExists: string; // procedure / engineering reason
  ifItFailed: string; // why it's still okay / redundant / non-catastrophic
}

export const FLIGHT_PHASE_EVENTS: Record<FlightPhase, FlightPhaseEvent[]> = {
  gate: [
    {
      id: "gate-ac-packs",
      trigger: "A sudden whoosh of air through the vents while you're still parked",
      explanation:
        "That's the airplane's air system starting up and pushing fresh, filtered air into the cabin.",
      whyItExists:
        "The packs and bleed-air system condition and pressurize the air you breathe in flight.",
      ifItFailed:
        "If part of the air system misbehaved, the crew would get loud warnings and either switch sources or delay departure. This isn't something that quietly fails while you sit there."
    },
    {
      id: "gate-power-switch",
      trigger: "Lights flicker or monitors briefly reset at the gate",
      explanation:
        "They're switching the plane from airport power to its own generator (APU) or back.",
      whyItExists:
        "Planes can take power either from the gate or from their own onboard systems. They switch sources before pushback.",
      ifItFailed:
        "If one power source had an issue, they simply stay on the other. The airplane is designed to handle power transitions cleanly without affecting safety systems."
    },
    {
      id: "gate-cargo-loading",
      trigger: "Loud banging and thumping sounds from beneath the floor",
      explanation:
        "That's cargo and luggage being loaded into the belly of the aircraft by ground crews.",
      whyItExists:
        "Baggage handlers use conveyor belts and manually position heavy containers in the cargo hold below your feet.",
      ifItFailed:
        "Cargo loading is weight-balanced and secured with nets and locks. Even if one container shifted, the cargo hold has barriers and the plane's center of gravity is calculated with margins."
    },
    {
      id: "gate-apu-whine",
      trigger: "High-pitched whining or humming, especially loud in rear seats",
      explanation:
        "That's the APU (Auxiliary Power Unit) - a small jet engine in the tail that provides power and air when the main engines aren't running.",
      whyItExists:
        "The APU runs the air conditioning and electrical systems at the gate without needing the main engines or ground power.",
      ifItFailed:
        "If the APU failed, they'd simply use ground power and air from the gate. The plane has multiple power sources, and any one is sufficient for ground operations."
    },
    {
      id: "gate-ptu-barking",
      trigger: "A loud 'barking dog' or drilling sound, especially on Airbus aircraft",
      explanation:
        "That's the PTU (Power Transfer Unit) balancing hydraulic pressure between the aircraft's hydraulic systems.",
      whyItExists:
        "When one hydraulic system has more pressure than another, the PTU automatically transfers power to equalize them.",
      ifItFailed:
        "The aircraft has three independent hydraulic systems. The PTU just helps balance them - each system can operate independently if needed."
    },
    {
      id: "gate-hydraulic-pump",
      trigger: "Electric whining or buzzing sound that cycles on and off",
      explanation:
        "That's the electric hydraulic pump maintaining pressure in the hydraulic systems while at the gate.",
      whyItExists:
        "Hydraulics power the flight controls, brakes, and landing gear. The pump keeps pressure ready even without engines running.",
      ifItFailed:
        "There are multiple hydraulic pumps - engine-driven, electric, and manual backup. Loss of one pump just means the others take over."
    },
    {
      id: "gate-cabin-hot",
      trigger: "Cabin feels unusually hot and stuffy during boarding",
      explanation:
        "The air conditioning isn't at full capacity yet since the plane is using ground power or the APU rather than the main engines.",
      whyItExists:
        "Ground-based cooling is less powerful than the aircraft's flight systems. Full cooling comes when engines start.",
      ifItFailed:
        "Temperature discomfort is just comfort, not safety. The crew can request more ground air or start engines earlier if needed."
    },
    {
      id: "gate-ac-fog",
      trigger: "Fog or mist coming from the overhead air vents",
      explanation:
        "That's just water vapor condensing when hot, humid air meets the cold air conditioning - like your breath on a cold day.",
      whyItExists:
        "In humid climates, the temperature difference between outside air and cooled cabin air creates visible condensation.",
      ifItFailed:
        "This is pure water vapor, not smoke. The air system has smoke detectors that would trigger loud alarms if there were actual smoke."
    },
    {
      id: "gate-door-pressure",
      trigger: "A popping sensation in your ears even while still at the gate",
      explanation:
        "The cabin is being slightly pressurized to test the door seals and pressurization system.",
      whyItExists:
        "Pre-flight checks include verifying the pressure vessel integrity before flight.",
      ifItFailed:
        "If pressurization tests failed, the issue would be fixed before departure. The plane can't dispatch with known pressure problems."
    },
    {
      id: "gate-galley-sounds",
      trigger: "Clattering, clicking, and mechanical sounds from the galley areas",
      explanation:
        "Flight attendants are securing galley equipment, checking catering, and preparing service items.",
      whyItExists:
        "Everything in the galley must be locked down for takeoff - carts, containers, coffee makers, and supplies.",
      ifItFailed:
        "Unsecured galley items would make noise but pose no flight safety risk. Crew procedures ensure everything is stowed."
    },
    {
      id: "gate-fuel-truck",
      trigger: "Rumbling vibration and mechanical sounds from outside",
      explanation:
        "That's the fuel truck pumping thousands of gallons of jet fuel into the wing tanks.",
      whyItExists:
        "Aircraft need precise fuel loads calculated for the route, weather, and alternates.",
      ifItFailed:
        "Fueling has multiple checks - quantity gauges, flow meters, and manual dipsticks. The crew verifies fuel load matches flight plan requirements."
    },
    {
      id: "gate-lav-service",
      trigger: "Whooshing and gurgling sounds from below the cabin",
      explanation:
        "That's the lavatory service truck emptying waste tanks and refilling water tanks.",
      whyItExists:
        "Aircraft lavatories use vacuum systems and need servicing between flights.",
      ifItFailed:
        "Lavatory issues affect comfort, not safety. Even if all lavatories failed, the flight could continue safely."
    }
  ],

  pushback: [
    {
      id: "pushback-jolt",
      trigger: "A small jolt as the plane starts moving backwards",
      explanation:
        "A tug is physically pushing the airplane away from the gate. The bump is just the tug taking up the slack.",
      whyItExists:
        "Airliners don't normally reverse under their own power near gates, so tugs handle the repositioning.",
      ifItFailed:
        "If the tug stopped or disconnected, the plane would just stop moving. Annoying for schedule, irrelevant for safety."
    },
    {
      id: "pushback-engine-start",
      trigger:
        "Deep rumble or vibration under your feet while still near the terminal",
      explanation: "That's an engine starting sequence.",
      whyItExists:
        "Engines are started one at a time, often during or right after pushback, using air from the APU.",
      ifItFailed:
        "Engines have strict start limits and monitors. If anything looked off, the start would be aborted and the crew would troubleshoot or return to gate."
    },
    {
      id: "pushback-engine-oil-smell",
      trigger: "Brief oil or mechanical smell when engines start, especially on older aircraft",
      explanation:
        "That's residual oil burning off from the engine components - completely normal during startup.",
      whyItExists:
        "Small amounts of oil accumulate in the engine when shutdown. Starting burns this off harmlessly.",
      ifItFailed:
        "Oil systems have multiple sensors and gauges. Any actual oil problem would show clear warnings to the crew."
    },
    {
      id: "pushback-asymmetric",
      trigger: "Feeling like you're turning more than going straight back",
      explanation:
        "The tug is positioning the aircraft for the correct taxi route, which often requires turning during pushback.",
      whyItExists:
        "Gate positions and taxiway layouts mean pushback isn't always straight - it's choreographed for traffic flow.",
      ifItFailed:
        "Pushback is controlled by the ground crew with the pilots monitoring. They can stop anytime if the path isn't right."
    },
    {
      id: "pushback-brake-check",
      trigger: "A firm stop during or right after pushback",
      explanation:
        "The pilots are testing the brakes before taxi to ensure they're working properly.",
      whyItExists:
        "Brake checks are standard procedure to verify both normal and alternate brake systems are functioning.",
      ifItFailed:
        "Aircraft have multiple brake systems - normal, alternate, emergency, and parking. Loss of one still leaves plenty of stopping power."
    },
    {
      id: "pushback-steering-check",
      trigger: "Nose wheel turning left and right while stopped after pushback",
      explanation:
        "The pilots are checking the nose wheel steering system before beginning taxi.",
      whyItExists:
        "Steering must be verified functional before navigating complex taxiway routes.",
      ifItFailed:
        "Even without nose wheel steering, differential braking and thrust can steer the aircraft. It would return to gate rather than continue."
    },
    {
      id: "pushback-engine-surge",
      trigger: "Engine sound suddenly increases then decreases during start",
      explanation:
        "That's the engine going through its normal start sequence - accelerating to idle speed then stabilizing.",
      whyItExists:
        "Jet engines need to reach a minimum speed for stable combustion, then settle to idle.",
      ifItFailed:
        "Engine start sequences are automated with multiple abort criteria. Any abnormality would trigger an automatic shutdown."
    }
  ],

  taxi: [
    {
      id: "taxi-bumpy-pavement",
      trigger: "Rattling or bumping like driving over a rough road",
      explanation:
        "Taxiways and ramps are huge slabs of concrete and asphalt. They're built for weight, not luxury-car smoothness.",
      whyItExists:
        "The landing gear is rugged and designed to absorb these bumps for years.",
      ifItFailed:
        "Feeling bumps on the ground is normal. If there were a real gear issue, it would show up as clear warnings to the crew, not as 'rough pavement' sensations."
    },
    {
      id: "taxi-brake-and-turns",
      trigger:
        "You feel repeated braking and sharp turns that don't seem to go in a straight line",
      explanation:
        "The pilots are following ATC instructions along taxiways and holding points. It's like following lanes and stop signs in a big invisible road system.",
      whyItExists:
        "Ground traffic is tightly choreographed so planes don't conflict with each other or vehicles.",
      ifItFailed:
        "If there were any confusion, ATC can always stop the aircraft and clarify — you're still on the ground, at taxiing speeds, with huge margins."
    },
    {
      id: "taxi-exhaust-smell",
      trigger: "Brief jet fuel or exhaust smell while taxiing",
      explanation:
        "That's exhaust from other aircraft ahead of you or nearby - the air conditioning pulls in outside air during taxi.",
      whyItExists:
        "Aircraft taxi in lines and the engines produce exhaust. Wind can blow it toward your aircraft.",
      ifItFailed:
        "The air conditioning has filters and can be switched to recirculation if needed. Exhaust smell is unpleasant but not dangerous in these amounts."
    },
    {
      id: "taxi-brake-heat",
      trigger: "Squealing or grinding sounds from the brakes during taxi",
      explanation:
        "That's normal brake operation - carbon brakes can be noisy, especially when cold or in certain weather conditions.",
      whyItExists:
        "Carbon brakes are incredibly effective but can make various sounds during normal operation.",
      ifItFailed:
        "Brake temperature and pressure are monitored. Hot brakes or brake problems would show clear warnings to the crew."
    },
    {
      id: "taxi-long-route",
      trigger: "Taxiing for what feels like forever, possibly passing the same spot twice",
      explanation:
        "ATC routes aircraft based on traffic flow, runway in use, and sequencing - sometimes the long way around.",
      whyItExists:
        "Ground movement is optimized for safety and overall efficiency, not always the shortest path for each plane.",
      ifItFailed:
        "Long taxi routes are annoying but safe. Fuel for taxi is always planned with extra margins."
    },
    {
      id: "taxi-holding-point",
      trigger: "Stopping and waiting at seemingly random spots on the taxiway",
      explanation:
        "These are holding points where ATC manages the sequence of departing and arriving aircraft.",
      whyItExists:
        "Separation between aircraft must be maintained for wake turbulence and runway occupancy time.",
      ifItFailed:
        "Holding ensures safe spacing. ATC won't clear you to continue until separation is guaranteed."
    },
    {
      id: "taxi-runway-cross",
      trigger: "A pause, then acceleration across a wide concrete area",
      explanation:
        "That's crossing an active runway - ATC cleared you to cross quickly while it's clear.",
      whyItExists:
        "Taxi routes sometimes require crossing runways. This is carefully controlled by ATC.",
      ifItFailed:
        "Runway crossings have multiple safety layers - ATC clearance, pilot verification, and ground radar monitoring."
    },
    {
      id: "taxi-light-test",
      trigger: "Bright flashing from the wings during evening or night taxi",
      explanation:
        "The crew is testing the strobe lights and landing lights before takeoff.",
      whyItExists:
        "All exterior lights are checked to ensure they're working for visibility and regulations.",
      ifItFailed:
        "Aircraft have multiple redundant lights. Loss of some lights might delay departure but doesn't affect safety."
    },
    {
      id: "taxi-deice-smell",
      trigger: "Sweet, syrupy smell during winter operations",
      explanation:
        "That's deicing fluid being sprayed on other aircraft or residual smell from your own deicing.",
      whyItExists:
        "Deicing fluid (propylene glycol) prevents ice formation on critical surfaces.",
      ifItFailed:
        "Deicing is mandatory in icing conditions. The plane won't depart if ice contamination is suspected."
    }
  ],

  takeoff: [
    {
      id: "takeoff-thrust-surge",
      trigger: "Engines suddenly get very loud and you're pressed back in your seat",
      explanation:
        "That's takeoff thrust — the engines are giving maximum power to accelerate.",
      whyItExists:
        "They use high power for a short time to get the plane safely flying, even if one engine were to fail.",
      ifItFailed:
        "Engines and procedures are certified so that the plane can either safely reject the takeoff on the runway or continue the climb on one engine. They train this constantly."
    },
    {
      id: "takeoff-rotation",
      trigger: "The nose tilts up more than feels 'car-like'",
      explanation:
        "That's called rotation — lifting the nose to let the wings generate more lift.",
      whyItExists:
        "A nose-up attitude is how wings make enough lift to climb away from the runway.",
      ifItFailed:
        "If the plane couldn't rotate properly, the takeoff would be rejected well before this point. The whole profile is planned and briefed ahead of time."
    },
    {
      id: "takeoff-gear-retraction",
      trigger: "Two distinct loud thumps shortly after leaving the ground",
      explanation:
        "That's the landing gear doors closing and gear locking into the up position - first the gear retracts, then the doors close.",
      whyItExists:
        "Gear creates massive drag. Retracting it immediately improves climb performance and fuel efficiency.",
      ifItFailed:
        "If gear didn't retract, you'd just fly with it down - louder and less efficient but completely safe. Many planes have landed with gear stuck down."
    },
    {
      id: "takeoff-buzzsaw",
      trigger: "A distinctive 'buzzsaw' or ripping sound from the engines at high power",
      explanation:
        "That's the fan blades going supersonic at their tips - the shock waves create this distinctive sound.",
      whyItExists:
        "Modern high-bypass engines have huge fans that can reach supersonic speeds at the blade tips during high thrust.",
      ifItFailed:
        "This sound is actually proof the engines are producing maximum rated thrust - exactly what you want for takeoff."
    },
    {
      id: "takeoff-flap-retraction",
      trigger: "Whirring and grinding sounds from the wings after takeoff",
      explanation:
        "That's the flaps and slats retracting as you accelerate - changing the wing back to its clean configuration.",
      whyItExists:
        "Flaps are needed for takeoff lift at low speed but create drag at higher speeds, so they're retracted in stages.",
      ifItFailed:
        "Flaps can be left extended if needed - you'd fly slower and burn more fuel but remain completely safe."
    },
    {
      id: "takeoff-power-reduction",
      trigger: "Engine sound decreases noticeably and you feel less pushed back around 1,000 feet",
      explanation:
        "That's thrust reduction for noise abatement - reducing power from takeoff thrust to climb thrust.",
      whyItExists:
        "Full power is only needed for initial climb. Reducing thrust helps with noise and engine wear.",
      ifItFailed:
        "Even at reduced thrust, the engines provide plenty of power for climbing. They could return to full power instantly if needed."
    },
    {
      id: "takeoff-acceleration",
      trigger: "Feeling pushed sideways as well as back during the takeoff roll",
      explanation:
        "That's from crosswind or the aircraft following the runway centerline which might not be perfectly straight.",
      whyItExists:
        "Pilots use rudder to keep the aircraft aligned with the runway during acceleration.",
      ifItFailed:
        "Aircraft are certified for strong crosswinds. The pilot has full control authority throughout the takeoff roll."
    },
    {
      id: "takeoff-shimmy",
      trigger: "Vibration or shimmy felt through the floor during the takeoff roll",
      explanation:
        "That's the nose wheel at high speed on the runway - like car tires at highway speeds.",
      whyItExists:
        "The nose wheel spins very fast during takeoff roll and minor imbalances create vibration.",
      ifItFailed:
        "Nose wheel shimmy is normal and stops as soon as the wheel leaves the ground. It doesn't affect the main landing gear or brakes."
    },
    {
      id: "takeoff-runway-lights",
      trigger: "Rhythmic thumping during the takeoff roll",
      explanation:
        "That's the aircraft rolling over runway centerline lights - they're recessed but you still feel them.",
      whyItExists:
        "Runway lights are embedded in the pavement for visibility in low visibility conditions.",
      ifItFailed:
        "The lights are designed to be run over by aircraft thousands of times. The landing gear doesn't even notice them."
    },
    {
      id: "takeoff-cabin-pressure",
      trigger: "Ears start popping right after takeoff",
      explanation:
        "The cabin is beginning to pressurize as you climb - your ears are equalizing with the changing pressure.",
      whyItExists:
        "Cabin pressure starts changing immediately after takeoff to reach cruise altitude pressurization.",
      ifItFailed:
        "If pressurization failed, the aircraft would level off or descend to a safe altitude. Oxygen masks are always available as backup."
    },
    {
      id: "takeoff-bank-angle",
      trigger: "Aircraft banks sharply right after takeoff",
      explanation:
        "That's the initial turn to follow the departure procedure - specific routes designed for terrain and traffic.",
      whyItExists:
        "Departure procedures ensure safe terrain clearance and separate departing aircraft from arrivals.",
      ifItFailed:
        "All turns are precisely calculated for safety. Even in an emergency, terrain clearance is always maintained."
    }
  ],

  climb: [
    {
      id: "climb-thrust-reduction",
      trigger: "Engines noticeably get quieter a minute or two after takeoff",
      explanation:
        "That's the pilots reducing power from takeoff thrust to climb thrust.",
      whyItExists:
        "Full power is only needed briefly. Reduced thrust is gentler on the engines and more comfortable for everyone.",
      ifItFailed:
        "Engines are built to safely run at higher power much longer than needed. Staying at a higher setting for a bit wouldn't suddenly cause a problem."
    },
    {
      id: "climb-through-clouds",
      trigger:
        "A rumbling or shuddering sensation when going through clouds or gray sky",
      explanation:
        "Clouds are just uneven air. The wings are slicing through slightly different pockets of air density.",
      whyItExists:
        "Anytime you pass through changing air — especially near clouds — you feel small bumps and vibrations.",
      ifItFailed:
        "Cloud turbulence is well within what the structure is tested for. Wings are designed to flex on purpose instead of crack."
    },
    {
      id: "climb-ear-popping",
      trigger: "Continuous ear popping or pressure during climb",
      explanation:
        "Your ears are adjusting as the cabin altitude increases - the cabin is pressurized to about 6,000-8,000 feet equivalent.",
      whyItExists:
        "Full sea-level pressure at cruise altitude would require an impossibly strong (heavy) fuselage.",
      ifItFailed:
        "If cabin pressure problems occurred, the climb would stop and you'd return to a lower altitude. Oxygen masks are always ready as backup."
    },
    {
      id: "climb-10000-ding",
      trigger: "Double chime sound about 5-7 minutes after takeoff",
      explanation:
        "That's the signal that you've passed 10,000 feet - crew can now move about if needed.",
      whyItExists:
        "Below 10,000 feet is considered a 'sterile cockpit' phase where crew focus solely on flying.",
      ifItFailed:
        "It's just a reminder chime. The crew knows the altitude from multiple sources regardless of the chime."
    },
    {
      id: "climb-stomach-drop",
      trigger: "Stomach-dropping sensation like a mild rollercoaster during climb",
      explanation:
        "That's the aircraft leveling off briefly or reducing climb rate - your body feels the change in vertical acceleration.",
      whyItExists:
        "ATC might assign temporary level-offs for traffic or the pilots might adjust climb rate for comfort or performance.",
      ifItFailed:
        "These are normal, controlled changes. The aircraft is following a precise flight path monitored by multiple systems."
    },
    {
      id: "climb-thermal-turbulence",
      trigger: "Bumpy air on hot days during initial climb",
      explanation:
        "That's thermal turbulence from uneven heating of the ground creating rising columns of warm air.",
      whyItExists:
        "Sun heats different surfaces differently - cities, water, fields all create different thermal patterns.",
      ifItFailed:
        "Thermal turbulence is mild and decreases with altitude. It's like driving over rumble strips - annoying but harmless."
    },
    {
      id: "climb-wake-turbulence",
      trigger: "Sudden rolling or bumping motion during climb",
      explanation:
        "Possibly wake turbulence from another aircraft that took off before you - their wingtip vortices create spinning air.",
      whyItExists:
        "All aircraft create wake vortices. ATC spaces departures to minimize encounters, but you might still feel them.",
      ifItFailed:
        "Wake turbulence feels dramatic but the aircraft handles it easily. Spacing standards ensure it's never dangerous."
    },
    {
      id: "climb-speed-changes",
      trigger: "Feeling pressed back then released multiple times during climb",
      explanation:
        "The pilots are adjusting speed for ATC requirements or optimal climb performance.",
      whyItExists:
        "Different altitudes have different speed restrictions and optimal climb speeds change with altitude.",
      ifItFailed:
        "Speed changes are normal procedure. The aircraft has huge speed margins in all phases of flight."
    },
    {
      id: "climb-turn-sensation",
      trigger: "Feeling tilted or pushed to one side for extended periods",
      explanation:
        "The aircraft is in a turn following the departure route or vectors from ATC.",
      whyItExists:
        "Departure routes include specific turns to avoid terrain, weather, or other traffic patterns.",
      ifItFailed:
        "All turns are coordinated and controlled. Even steep banks are well within aircraft capabilities."
    },
    {
      id: "climb-ac-changes",
      trigger: "Air vents suddenly blow much colder or warmer air",
      explanation:
        "The air conditioning is adjusting as the aircraft climbs through different temperatures and the engines provide different bleed air.",
      whyItExists:
        "Outside temperature drops about 2°C per 1,000 feet. The system compensates automatically.",
      ifItFailed:
        "Temperature control has multiple zones and backup modes. Uncomfortable temperature is just that - uncomfortable, not unsafe."
    }
  ],

  cruise: [
    {
      id: "cruise-light-turbulence",
      trigger: "Random small bumps or gentle rocking side to side",
      explanation:
        "That's normal light turbulence — invisible air currents the plane is flying through.",
      whyItExists:
        "Jet streams, mountain waves, and temperature layers make the air lumpy, not smooth like glass.",
      ifItFailed:
        "The structure, wings, and control systems are certified for far more severe motion than this. The bumps feel dramatic because your brain wants smooth, but the airplane is unfazed."
    },
    {
      id: "cruise-seatbelt-chime",
      trigger:
        "You hear the seatbelt chime at cruise even though things feel calm",
      explanation:
        "The pilots may have a report of rougher air ahead or are just adding a margin of safety.",
      whyItExists:
        "It's a reminder to stay seated and buckled so unexpected bumps don't turn into injuries.",
      ifItFailed:
        "Even if the chime or sign system had a glitch, the crew can still make spoken announcements. The safety piece is redundant with clear communication."
    },
    {
      id: "cruise-panel-creaking",
      trigger: "Interior panels creaking, clicking, or rattling",
      explanation:
        "That's normal flex and movement of interior panels as the fuselage flexes slightly with pressure and temperature changes.",
      whyItExists:
        "The fuselage is a pressure vessel that expands and contracts. Interior panels are designed to move without breaking.",
      ifItFailed:
        "Interior panels are cosmetic. The actual pressure vessel (the aluminum skin) is what matters for safety."
    },
    {
      id: "cruise-wing-flex",
      trigger: "Wings bouncing up and down visibly, especially in turbulence",
      explanation:
        "Wings are designed to flex dramatically - they can bend up to 26 feet in testing! This flexibility absorbs energy.",
      whyItExists:
        "Flexible wings are stronger than rigid ones. They bend to absorb loads rather than breaking.",
      ifItFailed:
        "Wings are tested to 150% of the maximum loads they'll ever see in service. The flexing you see is nowhere near their limits."
    },
    {
      id: "cruise-engine-quiet",
      trigger: "Engines sound so quiet you might worry they've stopped",
      explanation:
        "At cruise, engines run at lower power settings - typically 75-85% - much quieter than takeoff.",
      whyItExists:
        "Cruise requires much less thrust than climbing. Lower power means better fuel efficiency and less wear.",
      ifItFailed:
        "Even if an engine did fail at cruise (extremely rare), the plane flies fine on one engine and can maintain altitude."
    },
    {
      id: "cruise-clear-air-turb",
      trigger: "Sudden bumping in completely clear, blue sky",
      explanation:
        "That's Clear Air Turbulence (CAT) - invisible wind shear often near jet streams.",
      whyItExists:
        "Different air masses moving at different speeds create invisible boundaries with turbulence.",
      ifItFailed:
        "CAT can't be seen but it's well understood. Aircraft are built for turbulence far more severe than you'll ever experience."
    },
    {
      id: "cruise-mountain-wave",
      trigger: "Long, rolling motion like being on ocean swells",
      explanation:
        "That's mountain wave turbulence - air flowing over mountains creates waves that extend high into the atmosphere.",
      whyItExists:
        "Wind flowing over mountain ranges creates standing waves in the atmosphere, like water over rocks.",
      ifItFailed:
        "Mountain waves are predictable and planned for. They feel unusual but pose no threat to the aircraft."
    },
    {
      id: "cruise-cabin-cold",
      trigger: "Cabin feels very cold, especially near windows",
      explanation:
        "Outside temperature at cruise altitude is around -40 to -60°F. Despite insulation, some cold radiates through.",
      whyItExists:
        "The extreme temperature difference between outside and inside makes perfect temperature control challenging.",
      ifItFailed:
        "Blankets exist for comfort. The aircraft systems maintain safe temperatures even if comfort isn't perfect."
    },
    {
      id: "cruise-ozone-smell",
      trigger: "Sharp, slightly sweet electrical smell at high altitude",
      explanation:
        "That's ozone from the upper atmosphere - more concentrated at cruise altitudes.",
      whyItExists:
        "Ozone is naturally present at high altitudes. Some enters through the air conditioning system.",
      ifItFailed:
        "Modern aircraft have ozone converters to minimize this. Small amounts of ozone are harmless during flight duration."
    },
    {
      id: "cruise-window-frost",
      trigger: "Frost or ice crystals forming on windows, especially between panes",
      explanation:
        "The extreme cold outside causes moisture to freeze on the windows - normal at cruise altitude.",
      whyItExists:
        "Windows have multiple layers, and moisture can get between them and freeze at altitude.",
      ifItFailed:
        "Window frost doesn't affect window strength. The actual pressure-bearing panes are designed for much worse."
    },
    {
      id: "cruise-mechanical-turbulence",
      trigger: "Rhythmic bumping that seems to have a pattern",
      explanation:
        "Could be flying through the wake of another aircraft far ahead or atmospheric waves.",
      whyItExists:
        "The atmosphere has various wave patterns from terrain, weather systems, and other aircraft.",
      ifItFailed:
        "All turbulence types are within design limits. The pattern just tells you what's causing it."
    },
    {
      id: "cruise-crew-chimes",
      trigger: "Various chime patterns you hear throughout cruise",
      explanation:
        "Different chimes mean different things - crew calling each other, lavatory calls, or service signals.",
      whyItExists:
        "Crew need to communicate without using the PA system for every interaction.",
      ifItFailed:
        "Chimes are just one communication method. Crew have intercoms, hand signals, and can walk to talk."
    },
    {
      id: "cruise-altitude-changes",
      trigger: "Slight ear pressure changes during cruise",
      explanation:
        "The aircraft might be changing altitude slightly for traffic, weather, or optimization.",
      whyItExists:
        "Pilots adjust altitude for better winds, to avoid weather, or when directed by ATC.",
      ifItFailed:
        "Altitude changes are always controlled and planned. The aircraft can maintain any safe altitude indefinitely."
    },
    {
      id: "cruise-weight-shift",
      trigger: "Feeling the plane tilt slightly forward or back",
      explanation:
        "As fuel burns, the center of gravity shifts. The autopilot continuously adjusts trim to compensate.",
      whyItExists:
        "Fuel burn changes the aircraft's weight and balance throughout flight.",
      ifItFailed:
        "Trim adjustments are automatic and continuous. The aircraft remains perfectly balanced throughout flight."
    },
    {
      id: "cruise-cabin-pressure-cycles",
      trigger: "Ears popping occasionally during cruise",
      explanation:
        "Small cabin pressure adjustments as the aircraft maintains pressurization.",
      whyItExists:
        "The pressurization system makes minor adjustments to maintain target cabin altitude.",
      ifItFailed:
        "Multiple pressure controllers provide redundancy. Small pressure changes are normal and harmless."
    },
    {
      id: "cruise-electrical-sounds",
      trigger: "Humming or whining from electronics and fans",
      explanation:
        "That's cooling fans for avionics and cabin electronics - they run continuously.",
      whyItExists:
        "Electronic equipment generates heat and needs constant cooling at altitude.",
      ifItFailed:
        "Equipment has temperature monitoring. If cooling failed, non-essential systems would be turned off to protect critical ones."
    },
    {
      id: "cruise-galley-noise",
      trigger: "Rattling and clinking from galleys during cruise",
      explanation:
        "Flight attendants preparing service or turbulence moving galley items slightly.",
      whyItExists:
        "Meal service requires preparation, and minor turbulence can shift secured items.",
      ifItFailed:
        "Galley equipment is secured with latches and locks. Nothing can become truly loose."
    },
    {
      id: "cruise-lav-flush",
      trigger: "Extremely loud whoosh when someone uses the lavatory",
      explanation:
        "That's the vacuum flush system - it uses pressure differential to evacuate waste with minimal water.",
      whyItExists:
        "Vacuum systems are lighter and more reliable than traditional plumbing at altitude.",
      ifItFailed:
        "Lavatory failures are inconvenient but don't affect flight safety. Other lavatories remain available."
    },
    {
      id: "cruise-step-climb",
      trigger: "Gradual climb during cruise after hours of level flight",
      explanation:
        "That's a step climb - as fuel burns and the plane gets lighter, climbing to a higher altitude is more efficient.",
      whyItExists:
        "Lighter aircraft perform better at higher altitudes. Climbing in steps optimizes fuel burn.",
      ifItFailed:
        "If unable to climb, the flight continues at current altitude - less efficient but perfectly safe."
    },
    {
      id: "cruise-contrails",
      trigger: "Seeing white trails from the engines when you look back",
      explanation:
        "Those are contrails - water vapor from engine exhaust freezing instantly in the cold air.",
      whyItExists:
        "Jet fuel combustion produces water vapor. At -40°F or colder, it freezes immediately into ice crystals.",
      ifItFailed:
        "Contrails are just frozen water - proof your engines are running normally."
    }
  ],

  descent: [
    {
      id: "descent-stomach-drop",
      trigger:
        "A brief 'stomach drop' feeling like a tiny roller coaster dip as the plane starts down",
      explanation:
        "Your inner ear and stomach feel the change when the nose lowers slightly for descent.",
      whyItExists:
        "The plane has to trade altitude for distance — that means gradually lowering the nose and reducing power.",
      ifItFailed:
        "If anything felt off to the pilots, they can level off instantly. Descent is fully controllable, not a free fall."
    },
    {
      id: "descent-engine-quiet",
      trigger: "Engines become very quiet compared to earlier in the flight",
      explanation:
        "Less thrust is needed in descent. Gravity and airspeed are already helping the plane move forward.",
      whyItExists:
        "Idle or near-idle thrust helps slow down and descend efficiently.",
      ifItFailed:
        "Engines at low power are still fully available. If more thrust is needed for any reason, the pilots advance the throttles instantly."
    },
    {
      id: "descent-speedbrakes",
      trigger: "Rumbling or buffeting sensation during descent",
      explanation:
        "That's speedbrakes (spoilers) extending from the wings to increase drag and steepen the descent.",
      whyItExists:
        "Speedbrakes help control descent rate without gaining too much speed.",
      ifItFailed:
        "Speedbrakes are optional - pilots can control descent with power and pitch alone if needed."
    },
    {
      id: "descent-ear-pressure",
      trigger: "Increased ear popping and pressure during descent",
      explanation:
        "Cabin pressure is increasing back toward ground level as you descend.",
      whyItExists:
        "The cabin must return to airport pressure for doors to open normally at landing.",
      ifItFailed:
        "Pressurization is automatic but has manual backup. Uncomfortable pressure is just that - uncomfortable."
    },
    {
      id: "descent-temp-change",
      trigger: "Cabin temperature changes noticeably during descent",
      explanation:
        "You're descending into different outside air temperatures, affecting the air conditioning.",
      whyItExists:
        "Temperature increases about 2°C per 1,000 feet descended. The system adjusts continuously.",
      ifItFailed:
        "Temperature control has multiple modes and manual backup. Comfort might vary but safety doesn't."
    },
    {
      id: "descent-turns",
      trigger: "Multiple banking turns during descent",
      explanation:
        "The aircraft is following arrival procedures or being vectored by ATC for spacing.",
      whyItExists:
        "Arrivals are sequenced for safe spacing and to avoid conflicts with departing traffic.",
      ifItFailed:
        "All turns are calculated for passenger comfort and safety. Even if uncomfortable, they're well within limits."
    },
    {
      id: "descent-holding",
      trigger: "Flying in circles during descent",
      explanation:
        "That's a holding pattern - waiting your turn for approach due to traffic or weather.",
      whyItExists:
        "When arrivals exceed runway capacity, aircraft hold in defined patterns until cleared to approach.",
      ifItFailed:
        "Fuel for holding is always planned. If fuel runs low, you get priority for landing."
    },
    {
      id: "descent-speed-changes",
      trigger: "Feeling pushed forward then back during descent",
      explanation:
        "Speed adjustments for ATC spacing or to meet altitude/speed restrictions.",
      whyItExists:
        "Arrival procedures have specific speeds at certain points for traffic flow and safety.",
      ifItFailed:
        "Speed control is precise but has wide margins. The aircraft handles speed changes easily."
    },
    {
      id: "descent-clouds",
      trigger: "Bumping and moisture on windows descending through clouds",
      explanation:
        "Descending through cloud layers with their associated turbulence and moisture.",
      whyItExists:
        "Clouds at different levels must be penetrated during descent.",
      ifItFailed:
        "Cloud penetration is routine. Ice protection and weather radar ensure safe passage."
    },
    {
      id: "descent-cabin-lights",
      trigger: "Cabin lights dimming or brightening during descent",
      explanation:
        "Cabin crew adjusting lighting to prepare your eyes for landing conditions.",
      whyItExists:
        "If evacuation were needed, your eyes should be adjusted to outside light levels.",
      ifItFailed:
        "It's purely precautionary. Emergency lighting has its own power source regardless."
    }
  ],

  approach: [
    {
      id: "approach-flap-noise",
      trigger: "Whirring or motor-like sounds from the wings and a slight nose-up change",
      explanation:
        "That's the flaps extending, changing the wing shape for slower, more controlled flight.",
      whyItExists:
        "Flaps let the plane fly safely at lower speeds for landing without stalling.",
      ifItFailed:
        "Approach can be adjusted for different flap settings, and there are detailed procedures for flap issues. It's an inconvenience for the schedule, not an automatic emergency."
    },
    {
      id: "approach-gear-down",
      trigger: "A deep rumble or thump from below, followed by steady noise",
      explanation:
        "That's the landing gear extending and locking into place.",
      whyItExists:
        "The gear has to come down early enough for checks and to be stable for landing.",
      ifItFailed:
        "There are multiple indicators and backup procedures for gear extension. The crew isn't guessing; they have clear status before landing."
    },
    {
      id: "approach-gear-early",
      trigger: "Landing gear sounds 10 or more minutes before landing",
      explanation:
        "Gear is often extended early to increase drag and help slow down or maintain a steeper approach.",
      whyItExists:
        "Using gear as a speed brake is normal, especially when ATC keeps you high then clears you to descend quickly.",
      ifItFailed:
        "Early gear extension is a technique, not a requirement. The gear can extend anytime before landing."
    },
    {
      id: "approach-multiple-flaps",
      trigger: "Several episodes of whirring sounds from the wings",
      explanation:
        "Flaps extend in stages - each configuration for different phases of the approach.",
      whyItExists:
        "Gradual flap extension allows smooth speed reduction and maintains positive control.",
      ifItFailed:
        "Any flap configuration can be used for landing with adjusted speeds. Pilots train for this."
    },
    {
      id: "approach-power-changes",
      trigger: "Engines repeatedly getting louder and quieter",
      explanation:
        "Power adjustments to maintain the approach path and speed - like using gas and brake in a car.",
      whyItExists:
        "Precise speed and path control requires continuous power adjustments.",
      ifItFailed:
        "Go-arounds are always available if the approach becomes unstable. Safety first, always."
    },
    {
      id: "approach-banking",
      trigger: "Banking turns close to the ground",
      explanation:
        "Final turns to align with the runway or adjustments for wind.",
      whyItExists:
        "Most approaches require turning from downwind to base to final approach.",
      ifItFailed:
        "If alignment isn't achieved, pilots execute a go-around and try again. Never forced."
    },
    {
      id: "approach-turbulence",
      trigger: "Increased turbulence on approach",
      explanation:
        "Low altitude turbulence from surface heating, buildings, or terrain effects.",
      whyItExists:
        "Air near the ground is more disturbed by obstacles and temperature differences.",
      ifItFailed:
        "Approach turbulence is expected and planned for. Aircraft have plenty of control authority."
    },
    {
      id: "approach-wind-correction",
      trigger: "Aircraft seems to be flying sideways toward the runway",
      explanation:
        "That's crabbing - pointing into the wind to track straight toward the runway.",
      whyItExists:
        "Crosswinds require pointing the nose into the wind to maintain the desired track.",
      ifItFailed:
        "Crosswind techniques are fundamental pilot skills. Limits are published and conservative."
    },
    {
      id: "approach-rain-noise",
      trigger: "Loud drumming on the fuselage during approach in rain",
      explanation:
        "Rain hitting the aircraft at 150+ mph makes significant noise.",
      whyItExists:
        "You're flying through precipitation at high speed.",
      ifItFailed:
        "Rain doesn't affect aircraft performance significantly. Visibility and braking are monitored."
    },
    {
      id: "approach-go-around",
      trigger: "Sudden power increase and climb instead of landing",
      explanation:
        "That's a go-around - the safest option when the approach isn't perfect.",
      whyItExists:
        "Go-arounds ensure only stable approaches result in landing. It's professional and safe.",
      ifItFailed:
        "Go-arounds are normal procedures, not emergencies. Fuel for multiple approaches is always carried."
    }
  ],

  landing: [
    {
      id: "landing-touchdown",
      trigger: "A firm thump and squeal right as you hit the runway",
      explanation:
        "That's the tires going from zero to runway speed in an instant.",
      whyItExists:
        "The touchdown has to be firm enough for the plane to 'stick' to the runway and let brakes work.",
      ifItFailed:
        "Planes are designed for plenty of firm landings over their lifetime. A solid arrival feels big but is well within normal limits."
    },
    {
      id: "landing-reverse-thrust",
      trigger:
        "A sudden roar of engine noise right after touchdown, louder than in cruise",
      explanation:
        "That's reverse thrust, redirecting air forward to help slow down.",
      whyItExists:
        "It unloads the brakes, shortens stopping distance, and adds a layer of safety on wet or short runways.",
      ifItFailed:
        "Brakes alone can safely stop the aircraft. Reverse thrust is an extra layer, not the only way to slow down."
    },
    {
      id: "landing-spoilers",
      trigger: "Rumbling and shaking immediately after touchdown",
      explanation:
        "That's all the spoilers/speedbrakes deploying automatically to kill lift and put weight on the wheels.",
      whyItExists:
        "Spoilers ensure the aircraft stays on the ground and maximize braking effectiveness.",
      ifItFailed:
        "Spoilers can be deployed manually if automatic deployment fails. Braking is still effective without them."
    },
    {
      id: "landing-bounce",
      trigger: "Feeling a small bounce on touchdown",
      explanation:
        "The landing gear struts compressing and rebounding slightly - they're designed to absorb landing energy.",
      whyItExists:
        "Landing gear are massive shock absorbers that cushion the landing impact.",
      ifItFailed:
        "Landing gear are tested for much harder landings than you'll ever experience in service."
    },
    {
      id: "landing-braking-force",
      trigger: "Being pushed forward hard against your seatbelt",
      explanation:
        "That's maximum braking - either manual or autobrakes at high setting.",
      whyItExists:
        "Shorter runways or conditions might require firm braking to stop in the available distance.",
      ifItFailed:
        "Multiple brake systems exist. Even with failures, sufficient braking remains available."
    },
    {
      id: "landing-brake-heat",
      trigger: "Burning smell after hard braking on landing",
      explanation:
        "That's brake heat - normal after firm braking, especially on hot days or short runways.",
      whyItExists:
        "Brakes convert motion to heat. Carbon brakes can reach over 1000°F during heavy braking.",
      ifItFailed:
        "Brake temperature is monitored. Hot brakes cool down during taxi. Fire trucks are available if needed."
    },
    {
      id: "landing-crosswind",
      trigger: "Aircraft tilts or one wing drops during touchdown",
      explanation:
        "That's the pilot correcting for crosswind - keeping the aircraft aligned with the runway.",
      whyItExists:
        "Crosswind landings require specific techniques to maintain runway alignment.",
      ifItFailed:
        "Pilots train extensively for crosswind landings. Aircraft limits are conservative."
    },
    {
      id: "landing-wet-runway",
      trigger: "Longer landing roll and different sounds on wet runways",
      explanation:
        "Wet runways reduce braking friction. Pilots adjust technique and use appropriate brake settings.",
      whyItExists:
        "Water creates a layer between tires and pavement, reducing friction.",
      ifItFailed:
        "Landing distances account for wet runways. Grooved runways and anti-skid systems maintain control."
    },
    {
      id: "landing-lights-off",
      trigger: "Landing lights turn off right after touchdown",
      explanation:
        "Landing lights are turned off once on the ground to avoid blinding ground crews and other pilots.",
      whyItExists:
        "Bright landing lights are only needed for approach and touchdown visibility.",
      ifItFailed:
        "Runway and taxi lights provide adequate illumination. Landing lights aren't needed on the ground."
    },
    {
      id: "landing-immediate-taxi",
      trigger: "Quick turn off the runway while still moving fast",
      explanation:
        "High-speed turnoffs allow aircraft to clear the runway quickly for traffic behind.",
      whyItExists:
        "Runway occupancy time affects airport capacity. Quick exits improve efficiency.",
      ifItFailed:
        "If unable to make the turnoff, you simply use the next one. No pressure to force it."
    }
  ],

  "taxi-in": [
    {
      id: "taxiin-brake-pulses",
      trigger: "Repeated gentle braking and turns while rolling slowly",
      explanation:
        "The pilots are following taxi instructions back to the gate and matching ground traffic flow.",
      whyItExists:
        "Taxi routes often have multiple turns, holds, and speed adjustments near other aircraft.",
      ifItFailed:
        "At this point you're back on the ground at low speed with full braking available. This is the least risky phase of the whole trip."
    },
    {
      id: "taxiin-engine-shutdown",
      trigger:
        "Engines spool down and the cabin gets very quiet before the doors open",
      explanation:
        "The engines are being shut down now that you're parked at the gate.",
      whyItExists:
        "No need to run big jet engines when the plane is safely parked and on ground or gate power.",
      ifItFailed:
        "If there were any issue with shutdown or power transfer, doors simply wouldn't open yet. Safety systems stay powered until everything is stable."
    },
    {
      id: "taxiin-single-engine",
      trigger: "One engine shuts down while still taxiing",
      explanation:
        "That's single-engine taxi to save fuel - one engine provides plenty of power for ground operations.",
      whyItExists:
        "Fuel savings and reduced emissions by shutting down unnecessary engine after landing.",
      ifItFailed:
        "Single-engine taxi is optional. The other engine can be restarted instantly if needed."
    },
    {
      id: "taxiin-brake-cooling",
      trigger: "Fans running or whooshing sounds after parking",
      explanation:
        "That's brake cooling fans helping hot brakes cool down after landing.",
      whyItExists:
        "Carbon brakes can be very hot after landing and benefit from forced cooling.",
      ifItFailed:
        "Brakes cool naturally even without fans. Fans just speed up the process for quicker turnaround."
    },
    {
      id: "taxiin-marshaller",
      trigger: "Jerky movements approaching the gate",
      explanation:
        "Pilots are following marshaller hand signals or guidance system for precise parking.",
      whyItExists:
        "Aircraft must park precisely for jet bridge alignment and to clear other traffic.",
      ifItFailed:
        "If parking isn't perfect, the aircraft is repositioned with a tug. Minor inconvenience only."
    },
    {
      id: "taxiin-power-transfer",
      trigger: "Lights flicker or air conditioning changes at the gate",
      explanation:
        "Switching from aircraft power to ground power as engines shut down.",
      whyItExists:
        "Ground power takes over from engines to run systems while parked.",
      ifItFailed:
        "APU can provide power if ground power fails. Multiple power sources ensure continuity."
    },
    {
      id: "taxiin-parking-brake",
      trigger: "Distinct mechanical sound when stopping at the gate",
      explanation:
        "That's the parking brake being set - a separate system from the normal brakes.",
      whyItExists:
        "Parking brake ensures the aircraft won't move while parked and loading.",
      ifItFailed:
        "Wheel chocks are placed as backup. The aircraft isn't going anywhere."
    },
    {
      id: "taxiin-seatbelt-sign",
      trigger: "Seatbelt sign stays on even when parked",
      explanation:
        "Regulations require seatbelts until the aircraft is parked and engines are shut down.",
      whyItExists:
        "Safety protocol to prevent injuries from unexpected movement.",
      ifItFailed:
        "It's just a light. Crew announcements provide actual safety instructions."
    },
    {
      id: "taxiin-door-pressure",
      trigger: "Popping in ears when doors are opened",
      explanation:
        "Final pressure equalization as the cabin matches outside air pressure exactly.",
      whyItExists:
        "Slight pressure differences remain until doors open.",
      ifItFailed:
        "Pressure has already mostly equalized during approach. The final change is minimal."
    },
    {
      id: "taxiin-ground-crew",
      trigger: "Bumping and mechanical sounds after parking",
      explanation:
        "Ground crews connecting ground power, placing chocks, and preparing for unloading.",
      whyItExists:
        "Multiple ground services must connect to the aircraft for turnaround.",
      ifItFailed:
        "Ground operations are routine and monitored. Any issues just delay departure, nothing more."
    }
  ]
};