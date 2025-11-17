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
  ifItFailed: string; // why it’s still okay / redundant / non-catastrophic
}

export const FLIGHT_PHASE_EVENTS: Record<FlightPhase, FlightPhaseEvent[]> = {
  gate: [
    {
      id: "gate-ac-packs",
      trigger: "A sudden whoosh of air through the vents while you’re still parked",
      explanation:
        "That’s the airplane’s air system starting up and pushing fresh, filtered air into the cabin.",
      whyItExists:
        "The packs and bleed-air system condition and pressurize the air you breathe in flight.",
      ifItFailed:
        "If part of the air system misbehaved, the crew would get loud warnings and either switch sources or delay departure. This isn’t something that quietly fails while you sit there."
    },
    {
      id: "gate-power-switch",
      trigger: "Lights flicker or monitors briefly reset at the gate",
      explanation:
        "They’re switching the plane from airport power to its own generator (APU) or back.",
      whyItExists:
        "Planes can take power either from the gate or from their own onboard systems. They switch sources before pushback.",
      ifItFailed:
        "If one power source had an issue, they simply stay on the other. The airplane is designed to handle power transitions cleanly without affecting safety systems."
    }
  ],

  pushback: [
    {
      id: "pushback-jolt",
      trigger: "A small jolt as the plane starts moving backwards",
      explanation:
        "A tug is physically pushing the airplane away from the gate. The bump is just the tug taking up the slack.",
      whyItExists:
        "Airliners don’t normally reverse under their own power near gates, so tugs handle the repositioning.",
      ifItFailed:
        "If the tug stopped or disconnected, the plane would just stop moving. Annoying for schedule, irrelevant for safety."
    },
    {
      id: "pushback-engine-start",
      trigger:
        "Deep rumble or vibration under your feet while still near the terminal",
      explanation: "That’s an engine starting sequence.",
      whyItExists:
        "Engines are started one at a time, often during or right after pushback, using air from the APU.",
      ifItFailed:
        "Engines have strict start limits and monitors. If anything looked off, the start would be aborted and the crew would troubleshoot or return to gate."
    }
  ],

  taxi: [
    {
      id: "taxi-bumpy-pavement",
      trigger: "Rattling or bumping like driving over a rough road",
      explanation:
        "Taxiways and ramps are huge slabs of concrete and asphalt. They’re built for weight, not luxury-car smoothness.",
      whyItExists:
        "The landing gear is rugged and designed to absorb these bumps for years.",
      ifItFailed:
        "Feeling bumps on the ground is normal. If there were a real gear issue, it would show up as clear warnings to the crew, not as ‘rough pavement’ sensations."
    },
    {
      id: "taxi-brake-and-turns",
      trigger:
        "You feel repeated braking and sharp turns that don’t seem to go in a straight line",
      explanation:
        "The pilots are following ATC instructions along taxiways and holding points. It’s like following lanes and stop signs in a big invisible road system.",
      whyItExists:
        "Ground traffic is tightly choreographed so planes don’t conflict with each other or vehicles.",
      ifItFailed:
        "If there were any confusion, ATC can always stop the aircraft and clarify — you’re still on the ground, at taxiing speeds, with huge margins."
    }
  ],

  takeoff: [
    {
      id: "takeoff-thrust-surge",
      trigger: "Engines suddenly get very loud and you’re pressed back in your seat",
      explanation:
        "That’s takeoff thrust — the engines are giving maximum power to accelerate.",
      whyItExists:
        "They use high power for a short time to get the plane safely flying, even if one engine were to fail.",
      ifItFailed:
        "Engines and procedures are certified so that the plane can either safely reject the takeoff on the runway or continue the climb on one engine. They train this constantly."
    },
    {
      id: "takeoff-rotation",
      trigger: "The nose tilts up more than feels ‘car-like’",
      explanation:
        "That’s called rotation — lifting the nose to let the wings generate more lift.",
      whyItExists:
        "A nose-up attitude is how wings make enough lift to climb away from the runway.",
      ifItFailed:
        "If the plane couldn’t rotate properly, the takeoff would be rejected well before this point. The whole profile is planned and briefed ahead of time."
    }
  ],

  climb: [
    {
      id: "climb-thrust-reduction",
      trigger: "Engines noticeably get quieter a minute or two after takeoff",
      explanation:
        "That’s the pilots reducing power from takeoff thrust to climb thrust.",
      whyItExists:
        "Full power is only needed briefly. Reduced thrust is gentler on the engines and more comfortable for everyone.",
      ifItFailed:
        "Engines are built to safely run at higher power much longer than needed. Staying at a higher setting for a bit wouldn’t suddenly cause a problem."
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
    }
  ],

  cruise: [
    {
      id: "cruise-light-turbulence",
      trigger: "Random small bumps or gentle rocking side to side",
      explanation:
        "That’s normal light turbulence — invisible air currents the plane is flying through.",
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
        "It’s a reminder to stay seated and buckled so unexpected bumps don’t turn into injuries.",
      ifItFailed:
        "Even if the chime or sign system had a glitch, the crew can still make spoken announcements. The safety piece is redundant with clear communication."
    }
  ],

  descent: [
    {
      id: "descent-stomach-drop",
      trigger:
        "A brief ‘stomach drop’ feeling like a tiny roller coaster dip as the plane starts down",
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
    }
  ],

  approach: [
    {
      id: "approach-flap-noise",
      trigger: "Whirring or motor-like sounds from the wings and a slight nose-up change",
      explanation:
        "That’s the flaps extending, changing the wing shape for slower, more controlled flight.",
      whyItExists:
        "Flaps let the plane fly safely at lower speeds for landing without stalling.",
      ifItFailed:
        "Approach can be adjusted for different flap settings, and there are detailed procedures for flap issues. It’s an inconvenience for the schedule, not an automatic emergency."
    },
    {
      id: "approach-gear-down",
      trigger: "A deep rumble or thump from below, followed by steady noise",
      explanation:
        "That’s the landing gear extending and locking into place.",
      whyItExists:
        "The gear has to come down early enough for checks and to be stable for landing.",
      ifItFailed:
        "There are multiple indicators and backup procedures for gear extension. The crew isn’t guessing; they have clear status before landing."
    }
  ],

  landing: [
    {
      id: "landing-touchdown",
      trigger: "A firm thump and squeal right as you hit the runway",
      explanation:
        "That’s the tires going from zero to runway speed in an instant.",
      whyItExists:
        "The touchdown has to be firm enough for the plane to ‘stick’ to the runway and let brakes work.",
      ifItFailed:
        "Planes are designed for plenty of firm landings over their lifetime. A solid arrival feels big but is well within normal limits."
    },
    {
      id: "landing-reverse-thrust",
      trigger:
        "A sudden roar of engine noise right after touchdown, louder than in cruise",
      explanation:
        "That’s reverse thrust, redirecting air forward to help slow down.",
      whyItExists:
        "It unloads the brakes, shortens stopping distance, and adds a layer of safety on wet or short runways.",
      ifItFailed:
        "Brakes alone can safely stop the aircraft. Reverse thrust is an extra layer, not the only way to slow down."
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
        "At this point you’re back on the ground at low speed with full braking available. This is the least risky phase of the whole trip."
    },
    {
      id: "taxiin-engine-shutdown",
      trigger:
        "Engines spool down and the cabin gets very quiet before the doors open",
      explanation:
        "The engines are being shut down now that you’re parked at the gate.",
      whyItExists:
        "No need to run big jet engines when the plane is safely parked and on ground or gate power.",
      ifItFailed:
        "If there were any issue with shutdown or power transfer, doors simply wouldn’t open yet. Safety systems stay powered until everything is stable."
    }
  ]
};
