// components/FlightStatus.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { FlightPhaseWeirdThings } from "./FlightPhaseWeirdThings";
import { AccordionSection } from "./AccordionSection";
import { FlightInput } from "./FlightInput";
import { TurbulenceTooltip } from "./TurbulenceTooltip";
import type { FlightPhase } from "@/lib/flightPhaseEvents";
import { 
  searchFlight, 
  trackFlight, 
  getFlightsInArea,
  getSimulatedFlightData,
  AIRPORTS,
  type FlightData,
  type FlightRoute 
} from "@/lib/api/flightTracking";
import { 
  fetchMETAR, 
  fetchTAF,
  getFlightWeatherSummary,
  type METARData,
  type TAFData
} from "@/lib/api/aviationWeather";
import { 
  assessFlightTurbulence,
  formatPIREP,
  generateEnhancedTurbulenceReport,
  analyzeWeatherGradients,
  isUsingFallbackData,
  resetFallbackDataFlag,
  type TurbulenceAssessment,
  type EnhancedTurbulenceReport
} from "@/lib/api/turbulenceData";

// --- Tiny inline flight map ---
interface FlightMapProps {
  from: string;
  to: string;
  progressPercent: number;
}

function FlightMap({ from, to, progressPercent }: FlightMapProps) {
  const clamped = Math.min(100, Math.max(0, progressPercent));

  return (
    <div className="mb-4">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span className="font-mono text-gray-200">{from}</span>
        <span className="font-mono text-gray-200">{to}</span>
      </div>

      <div className="relative h-10 rounded-xl bg-slate-950/80 border border-slate-800 overflow-hidden">
        <div className="absolute left-4 right-4 top-1/2 h-px bg-slate-600/70" />
        
        <div
          className="absolute top-1/2 -translate-y-1/2 transition-all duration-500 ease-out"
          style={{
            left: `calc(4% + ${clamped} * 0.92%)`,
          }}
        >
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-sky-300">✈︎</span>
            <span className="text-[9px] text-slate-400 font-mono">
              {clamped.toFixed(0)}%
            </span>
          </div>
        </div>

        <div className="absolute left-4 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.7)]" />
      </div>
    </div>
  );
}

// --- Helper functions ---
function mapPhaseToFlightPhase(phase: string): FlightPhase {
  const p = phase.toLowerCase();
  if (p === "gate") return "gate";
  if (p === "taxi") return "taxi";
  if (p === "takeoff") return "takeoff";
  if (p === "climb") return "climb";
  if (p === "cruise") return "cruise";
  if (p === "descent") return "descent";
  if (p === "landing") return "landing";
  return "cruise";
}

// Function to calculate normality score based on route patterns
function getNormalityScore(departure: string, arrival: string, phase: string): { score: number; description: string } {
  // Route-specific turbulence patterns
  const routeKey = `${departure}-${arrival}`;
  const routeScores: Record<string, number> = {
    // Mountain wave routes
    'ORD-DEN': 4.2,
    'DEN-ORD': 4.3,
    'DEN-SLC': 4.4,
    'SLC-DEN': 4.4,
    'DEN-PHX': 4.1,
    'PHX-DEN': 4.1,
    
    // Jet stream routes
    'LAX-JFK': 4.5,
    'JFK-LAX': 4.6,
    'SFO-JFK': 4.5,
    'JFK-SFO': 4.6,
    'LAX-BOS': 4.4,
    'BOS-LAX': 4.5,
    'SEA-JFK': 4.5,
    'JFK-SEA': 4.6,
    
    // Convective activity routes
    'MIA-ATL': 3.8,
    'ATL-MIA': 3.8,
    'DFW-MIA': 3.9,
    'MIA-DFW': 3.9,
    'IAH-MIA': 3.7,
    'MIA-IAH': 3.7,
    'TPA-ATL': 3.8,
    'ATL-TPA': 3.8,
    
    // Coastal wind routes
    'SEA-SFO': 4.8,
    'SFO-SEA': 4.8,
    'LAX-SFO': 4.7,
    'SFO-LAX': 4.7,
    'SAN-SFO': 4.6,
    'SFO-SAN': 4.6,
    'SEA-PDX': 4.5,
    'PDX-SEA': 4.5,
    
    // Plains turbulence routes
    'DEN-DFW': 4.0,
    'DFW-DEN': 4.0,
    'DEN-MSP': 4.1,
    'MSP-DEN': 4.1,
    
    // Common smooth routes
    'LAX-PHX': 3.2,
    'PHX-LAX': 3.2,
    'LAS-LAX': 3.3,
    'LAX-LAS': 3.3,
    'SAN-PHX': 3.1,
    'PHX-SAN': 3.1,
    
    // Northeast corridor
    'BOS-DCA': 4.0,
    'DCA-BOS': 4.0,
    'JFK-BOS': 3.8,
    'BOS-JFK': 3.8,
    'LGA-BOS': 3.9,
    'BOS-LGA': 3.9,
  };
  
  // Get base score for route, default to 3.5 for unknown routes
  let baseScore = routeScores[routeKey] || 3.5;
  
  // Adjust slightly based on phase
  const phaseAdjustments: Record<string, number> = {
    'gate': -0.1,
    'taxi': -0.1,
    'takeoff': 0.1,
    'climb': 0.2,
    'cruise': 0,
    'descent': 0.1,
    'landing': 0.2,
  };
  
  const phaseAdjustment = phaseAdjustments[phase.toLowerCase()] || 0;
  let finalScore = Math.min(5.0, Math.max(0, baseScore + phaseAdjustment));
  
  // Add seasonal adjustments (simplified - in production would check actual date)
  const seasonalRoutes = ['ORD-DEN', 'DEN-ORD', 'MIA-ATL', 'ATL-MIA', 'DFW-MIA', 'MIA-DFW'];
  if (seasonalRoutes.includes(routeKey)) {
    // Add small random variation to simulate seasonal effects
    finalScore = Math.min(5.0, finalScore + (Math.random() * 0.3 - 0.15));
  }
  
  // Determine description based on score
  let description: string;
  if (finalScore >= 4.5) {
    description = "Very common for this route";
  } else if (finalScore >= 3.5) {
    description = "Common for this route";
  } else if (finalScore >= 2.5) {
    description = "Occasional for this route";
  } else if (finalScore >= 1.5) {
    description = "Uncommon for this route";
  } else {
    description = "Rare for this route";
  }
  
  return {
    score: Math.round(finalScore * 10) / 10, // Round to 1 decimal place
    description
  };
}

function formatTimeFromDate(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}

function formatTimeRemaining(estimatedArrival: Date): string {
  const now = Date.now();
  const remaining = Math.max(0, estimatedArrival.getTime() - now);
  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.round((remaining % 3600000) / 60000);
  if (hours <= 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

function getEnhancedPilotActivity(phase: string) {
  const p = phase.toLowerCase();
  
  if (p === "gate") {
    return {
      summary: "At the gate, pilots are running through methodical pre-flight preparations.",
      actualActivities: [
        "Programming the flight computer with the exact route, weights, and weather",
        "Reviewing paperwork: weather reports, NOTAMs, weight and balance calculations",
        "Running pre-flight checks on all aircraft systems",
        "Coordinating with ground crew, fuelers, and dispatch",
        "Briefing the cabin crew on flight time, weather, and any special considerations"
      ],
      anxiousThoughts: [
        "Pilots are just sitting there waiting to leave",
        "They're hoping the plane works when they start it",
        "Nobody's checking if everything is safe",
        "They're making it up as they go along",
        "Last-minute scrambling to figure out the flight"
      ]
    };
  }
  
  if (p === "taxi") {
    return {
      summary: "During taxi, pilots are following precise ground procedures while preparing for takeoff.",
      actualActivities: [
        "Following specific taxi routes given by ground control",
        "Running through engine warm-up procedures and system checks",
        "Setting takeoff configuration: flaps, trim, thrust settings",
        "Reviewing the takeoff briefing: speeds, procedures, emergency actions",
        "Monitoring other aircraft and following ground markings"
      ],
      anxiousThoughts: [
        "They're just driving around randomly looking for the runway",
        "The plane might not have enough power to take off",
        "They're not sure which runway to use",
        "No one's watching for other planes",
        "They're rushing because they're late"
      ]
    };
  }
  
  if (p === "takeoff") {
    return {
      summary: "Right now their attention is focused on flying the takeoff profile they briefed before departure.",
      actualActivities: [
        "Following the exact takeoff profile: V1 (decision speed), VR (rotation), V2 (climb)",
        "Monitoring engine parameters and aircraft acceleration",
        "Pilot flying focuses on the takeoff, pilot monitoring calls out speeds",
        "Ready to execute specific procedures for any abnormality",
        "Transitioning to climb configuration at safe altitude"
      ],
      anxiousThoughts: [
        "They're pulling back as hard as they can to get airborne",
        "Hope we have enough speed to get off the ground",
        "What if an engine fails right now?",
        "They're fighting to keep the plane straight",
        "This is the most dangerous part and anything could happen"
      ]
    };
  }
  
  if (p === "climb") {
    return {
      summary: "In climb, the autopilot is engaged and pilots are managing the climb profile while coordinating with ATC.",
      actualActivities: [
        "Autopilot engaged, following the programmed departure procedure",
        "Monitoring engine performance and fuel flow",
        "Complying with ATC altitude and heading clearances",
        "Retracting flaps on schedule and accelerating to climb speed",
        "Running after-takeoff checklists and cleaning up the cockpit"
      ],
      anxiousThoughts: [
        "They're struggling to gain altitude",
        "The plane is barely climbing and might stall",
        "They're hand-flying through dangerous altitudes",
        "No one knows where other planes are",
        "The engines are straining to climb"
      ]
    };
  }
  
  if (p === "cruise") {
    return {
      summary: "In cruise, the job is mostly monitoring and talking.",
      actualActivities: [
        "Autopilot maintaining altitude, speed, and navigation",
        "Monitoring fuel burn against flight plan",
        "Checking weather ahead and at destination",
        "Position reports to ATC and frequency changes",
        "Reviewing approach charts and planning descent",
        "One pilot can leave for physiological needs while other monitors"
      ],
      anxiousThoughts: [
        "Both pilots might fall asleep with nothing to do",
        "No one's actually flying the plane",
        "They're not paying attention anymore",
        "The autopilot could fail any second",
        "They're just hoping nothing goes wrong",
        "Turbulence could flip the plane over"
      ]
    };
  }
  
  if (p === "descent") {
    return {
      summary: "They're setting up and double-checking the plan for landing.",
      actualActivities: [
        "Programming the descent profile into the flight computer",
        "Briefing the approach: runway, weather, minimums, missed approach",
        "Setting up navigation radios and approach systems",
        "Coordinating with ATC for descent clearance and vectors",
        "Managing speed and configuration changes during descent",
        "Preparing the cabin through flight attendant coordination"
      ],
      anxiousThoughts: [
        "They're diving toward the ground too fast",
        "Losing altitude means losing control",
        "The pilots don't know where the airport is",
        "They're making up the approach as they go",
        "The plane is falling and they're trying to save it",
        "Ears popping means something's wrong"
      ]
    };
  }
  
  if (p === "landing") {
    return {
      summary: "During approach and landing, pilots are executing a precisely briefed procedure with multiple decision points.",
      actualActivities: [
        "Following the instrument approach procedure exactly",
        "Pilot flying focuses on approach, pilot monitoring calls out deviations",
        "Configuring aircraft: gear down, flaps, speed brakes armed",
        "Decision at minimums: land or go around based on visual conditions",
        "Transitioning from instruments to visual for touchdown",
        "Managing crosswinds with precise control inputs"
      ],
      anxiousThoughts: [
        "They're trying to find the runway in bad weather",
        "Coming in too fast and might overshoot",
        "Fighting the controls in the wind",
        "Hoping the brakes work when we touch down",
        "This is the most dangerous part of flight",
        "One mistake and we crash"
      ]
    };
  }
  
  // Default return
  return {
    summary: "Pilots are managing systems and following procedures for this phase of flight.",
    actualActivities: [
      "Monitoring aircraft systems and flight progress",
      "Communicating with air traffic control",
      "Following standard operating procedures",
      "Cross-checking instruments and parameters",
      "Staying ahead of the aircraft with planning"
    ],
    anxiousThoughts: [
      "The pilots don't know what they're doing",
      "They're making it up as they go",
      "Something could go wrong any moment",
      "No one's really in control",
      "They're just hoping for the best"
    ]
  };
}

// --- BumpMeter Component ---
interface BumpMeterProps {
  currentLevel: 'smooth' | 'light' | 'moderate' | 'severe';
}

function BumpMeter({ currentLevel }: BumpMeterProps) {
  // Map turbulence level to numeric value
  const getLevelValue = (level: string): number => {
    switch(level) {
      case 'smooth': return 0.5;
      case 'light': return 2.5;
      case 'moderate': return 4.5;
      case 'severe': return 6.5;
      default: return 1;
    }
  };
  
  const currentValue = getLevelValue(currentLevel);
  
  return (
    <div className="mb-4">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
        Bump Meter
      </h4>
      
      {/* Main meter container */}
      <div className="bg-white/[0.03] rounded-lg p-4 border border-white/5">
        {/* Bar with gradient */}
        <div className="relative h-12 rounded-lg bg-gradient-to-r from-emerald-900/30 via-amber-900/30 to-orange-900/30 border border-white/5 overflow-hidden">
          {/* Background gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent" />
          
          {/* Current bumps marker */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 transition-all duration-500"
            style={{left: `${currentValue * 10}%`}}
          >
            <div className="relative">
              {/* Marker line */}
              <div className="absolute left-1/2 -translate-x-1/2 w-0.5 h-16 bg-sky-400 shadow-[0_0_4px_rgba(56,189,248,0.8)]" />
              {/* Marker dot */}
              <div className="absolute left-1/2 -translate-x-1/2 top-6 w-3 h-3 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)] border border-white/20" />
              {/* Label */}
              <div className="absolute left-1/2 -translate-x-1/2 -top-6 whitespace-nowrap">
                <span className="text-[10px] uppercase tracking-wider text-sky-400 font-medium px-1.5 py-0.5 bg-slate-950/80 rounded backdrop-blur-sm border border-sky-400/20">
                  Current bumps
                </span>
              </div>
            </div>
          </div>
          
          {/* Certified limit marker */}
          <div className="absolute top-1/2 -translate-y-1/2 right-0">
            <div className="relative">
              {/* Marker line */}
              <div className="absolute right-0 w-0.5 h-16 bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.8)]" />
              {/* Marker dot */}
              <div className="absolute right-[-1.5px] top-6 w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] border border-white/20" />
              {/* Label */}
              <div className="absolute right-0 -bottom-8 whitespace-nowrap">
                <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-medium px-1.5 py-0.5 bg-slate-950/80 rounded backdrop-blur-sm border border-emerald-400/20">
                  Certified limit
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Scale numbers */}
        <div className="flex justify-between mt-8 mb-3 px-1">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
            <span 
              key={n} 
              className={`text-[10px] font-mono ${
                n <= currentValue ? 'text-sky-400' : 
                n === 10 ? 'text-emerald-400' : 
                'text-slate-600'
              }`}
            >
              {n}
            </span>
          ))}
        </div>
        
        {/* Severity scale labels */}
        <div className="flex justify-between mb-3 text-[9px] uppercase tracking-wider">
          <span className="text-emerald-400/70">Smooth</span>
          <span className="text-yellow-400/70">Light</span>
          <span className="text-amber-400/70">Moderate</span>
          <span className="text-orange-400/70">Severe</span>
          <span className="text-red-400/70">Extreme</span>
        </div>
        
        {/* Explanation text */}
        <div className="mt-4 p-3 bg-white/[0.02] rounded-lg border border-white/5">
          <p className="text-sm text-slate-300 leading-relaxed">
            These bumps are around <span className="text-sky-400 font-semibold">{currentValue.toFixed(1)}/10</span>. 
            Airliners are designed and tested beyond <span className="text-emerald-400 font-semibold">10/10</span> in controlled conditions, 
            so you're <span className="text-emerald-400 font-semibold">far inside the comfort zone</span>.
          </p>
          <p className="text-xs text-slate-400 mt-2">
            The aircraft structure can handle forces many times stronger than any turbulence you'll ever encounter in commercial flight.
          </p>
        </div>
      </div>
    </div>
  );
}

// --- Micro-Task Focus Suggestions ---
interface MicroTaskSuggestion {
  text: string;
  icon?: string;
}

function getMicroTaskSuggestion(phase: string, turbulenceLevel: 'smooth' | 'light' | 'moderate' | 'severe'): MicroTaskSuggestion {
  const suggestions: Record<string, Record<string, MicroTaskSuggestion[]>> = {
    gate: {
      smooth: [
        { text: "Notice three textures around you - the seat fabric, your clothing, the armrest.", icon: "👐" },
        { text: "Take a moment to set an intention for your journey today.", icon: "✨" },
        { text: "While we prepare, count five blue things you can see from your seat.", icon: "👁️" },
        { text: "Feel your feet on the floor. Notice how solid the ground feels right now.", icon: "🦶" }
      ]
    },
    taxi: {
      smooth: [
        { text: "As we roll to the runway, notice the rhythm of the taxi. Like a gentle train ride.", icon: "🚂" },
        { text: "Watch the ground crew outside. Notice their practiced, confident movements.", icon: "👷" },
        { text: "Feel the subtle turns as we navigate. The pilots know every inch of this path.", icon: "🧭" },
        { text: "Listen to the engine's steady hum. It's warming up, getting ready, just like you.", icon: "🎵" }
      ]
    },
    takeoff: {
      smooth: [
        { text: "Feel your back against the seat as we climb. Count five things you can see.", icon: "🪑" },
        { text: "Notice the gentle push into your seat. That's physics keeping you safe.", icon: "🚀" },
        { text: "As we lift off, imagine roots extending from you into the aircraft structure.", icon: "🌳" },
        { text: "The engines are doing exactly what they love to do. Listen to their confidence.", icon: "💪" }
      ],
      light: [
        { text: "Little bumps on takeoff are just air pockets. Breathe out longer than you breathe in.", icon: "💨" },
        { text: "Press your feet gently into the floor. You're connected to 400 tons of solid aircraft.", icon: "⚓" },
        { text: "These wobbles are like driving over a small pothole - noticeable but harmless.", icon: "🛡️" }
      ]
    },
    climb: {
      smooth: [
        { text: "We're climbing steadily. Watch the clouds change as we rise through layers.", icon: "☁️" },
        { text: "Notice how your ears adjust to altitude. Your body knows exactly what to do.", icon: "👂" },
        { text: "Feel the aircraft settle into its climb rhythm. Smooth and purposeful.", icon: "📈" },
        { text: "Look at the wing tip. See how steady it is, even at this angle?", icon: "🦅" }
      ],
      light: [
        { text: "Climbing through weather layers creates ripples. Notice them, then let them pass.", icon: "🌊" },
        { text: "For the next minute, count your breaths. Aim for 12-15 calm, easy breaths.", icon: "🫁" },
        { text: "These bumps are like walking on uneven pavement - irregular but totally safe.", icon: "🚶" }
      ],
      moderate: [
        { text: "During these bumps, hold your armrest gently. Breathe in for 4, hold for 4, out for 6.", icon: "🧘" },
        { text: "The plane is built for this. You're in a fortress designed for exactly these conditions.", icon: "🏰" },
        { text: "Focus on something stationary in the cabin. Notice how little it actually moves.", icon: "📍" }
      ]
    },
    cruise: {
      smooth: [
        { text: "While we cross this cloud layer, just notice the feeling of your feet on the floor.", icon: "🦶" },
        { text: "Perfect cruise conditions. Take a moment to appreciate this engineering marvel.", icon: "✈️" },
        { text: "Look out the window. You're seeing a view only 0.001% of humans see today.", icon: "🌍" },
        { text: "Notice the quiet hum of cruise flight. This is the aircraft's happy place.", icon: "😌" }
      ],
      light: [
        { text: "For the next 60 seconds, match your exhale to an imaginary gentle wave.", icon: "🌊" },
        { text: "Light chop at cruise is like a boat on calm water - just little ripples passing under.", icon: "⛵" },
        { text: "Place your hand on your chest. Feel your steady heartbeat through the gentle motion.", icon: "💙" },
        { text: "These small movements are the atmosphere's texture. You're feeling the sky itself.", icon: "🌤️" }
      ],
      moderate: [
        { text: "Hold something solid. Breathe in for 4, hold for 4, out for 6.", icon: "🫁" },
        { text: "Moderate turbulence uses less than 1% of what this aircraft is built to handle.", icon: "💪" },
        { text: "Focus on your breath. Make each exhale a little longer, a little softer.", icon: "💨" },
        { text: "Press your feet down. Feel how the floor pushes back. That's thousands of pounds of structure.", icon: "🦾" }
      ],
      severe: [
        { text: "This will pass soon. Keep breathing. The aircraft is performing perfectly.", icon: "🛡️" },
        { text: "Hold your armrest firmly. You're secured to an incredibly strong structure.", icon: "⚓" },
        { text: "Focus only on the next breath. In through nose, out through mouth.", icon: "🫁" },
        { text: "The pilots train for this exact scenario hundreds of times. They've got this.", icon: "👨‍✈️" }
      ]
    },
    descent: {
      smooth: [
        { text: "We're descending smoothly. Notice how controlled each altitude change feels.", icon: "📉" },
        { text: "Feel your ears adjust. Yawn or swallow - your body knows what to do.", icon: "👂" },
        { text: "Watch the ground slowly grow clearer. We're returning to earth on a precise path.", icon: "🎯" },
        { text: "The descent is computer-calculated. Notice the steady, predictable rate.", icon: "💻" }
      ],
      light: [
        { text: "Descent through cloud layers creates texture. Like driving down a bumpy hill.", icon: "⛰️" },
        { text: "For the next minute, alternate focusing between near and far objects.", icon: "👀" },
        { text: "These movements are the atmosphere welcoming us back to lower altitudes.", icon: "🌍" }
      ],
      moderate: [
        { text: "Descending through weather is like walking down stairs in wind - bumpy but controlled.", icon: "🪜" },
        { text: "Keep your feet flat on the floor. Feel the solid connection.", icon: "🦶" },
        { text: "Breathe with the motion: in for 3, hold for 3, out for 5.", icon: "🫁" }
      ]
    },
    landing: {
      smooth: [
        { text: "Watch the ground approach. Notice how smoothly the pilots guide us down.", icon: "🛬" },
        { text: "Feel the aircraft respond to tiny adjustments. Such precise control.", icon: "🎮" },
        { text: "We're following an exact glide path. Like sliding down an invisible rail.", icon: "📐" },
        { text: "Notice the wing flaps adjusting. The aircraft is configuring itself perfectly.", icon: "🦅" }
      ],
      light: [
        { text: "Little movements on approach are normal. The pilots are fine-tuning our path.", icon: "🎯" },
        { text: "Focus on the horizon if you can see it. Notice how stable it actually is.", icon: "🌅" },
        { text: "These adjustments are like parking a car - small corrections for perfect alignment.", icon: "🚗" }
      ],
      moderate: [
        { text: "Final approach corrections feel bigger than they are. Trust the process.", icon: "✈️" },
        { text: "The pilots do this multiple times daily. This is routine for them.", icon: "👨‍✈️" },
        { text: "Breathe steadily. We'll be on the ground in moments.", icon: "🫁" }
      ]
    }
  };

  // Get suggestions for current phase and turbulence level
  const phaseSuggestions = suggestions[phase.toLowerCase()] || suggestions.cruise;
  const levelSuggestions = phaseSuggestions[turbulenceLevel] || phaseSuggestions.smooth || [
    { text: "Take a moment to notice your breath. You're doing great.", icon: "😊" }
  ];

  // Randomly select a suggestion with deterministic fallback based on current time
  const index = Math.floor(Date.now() / 30000) % levelSuggestions.length; // Changes every 30 seconds
  return levelSuggestions[index];
}

// --- Main Component ---
export default function FlightStatus() {
  // Flight tracking state
  const [flightData, setFlightData] = useState<FlightData | null>(null);
  const [flightRoute, setFlightRoute] = useState<FlightRoute | null>(null);
  const [departureAirport, setDepartureAirport] = useState<string>("ORD");
  const [arrivalAirport, setArrivalAirport] = useState<string>("LAX");
  const [isTracking, setIsTracking] = useState(false);
  const [userFlightInfo, setUserFlightInfo] = useState<{ airline: string; number: string } | null>(null);
  
  // Weather state
  const [weatherData, setWeatherData] = useState<{
    departure: { metar: METARData | null; taf: TAFData | null };
    arrival: { metar: METARData | null; taf: TAFData | null };
    summary: string;
  } | null>(null);
  
  // Turbulence state
  const [turbulenceData, setTurbulenceData] = useState<TurbulenceAssessment | null>(null);
  const [enhancedTurbulenceReport, setEnhancedTurbulenceReport] = useState<EnhancedTurbulenceReport | null>(null);
  const [isUsingFallbackTurbulenceData, setIsUsingFallbackTurbulenceData] = useState(false);
  
  // Nearby flights state
  const [nearbyFlights, setNearbyFlights] = useState<FlightData[]>([]);
  
  // UI state
  const [openAccordion, setOpenAccordion] = useState<string | null>('TURBULENCE'); // Show turbulence analysis by default
  const [nerdOpen, setNerdOpen] = useState(false);
  
  // Client-side arrival time state to prevent hydration mismatch
  const [clientArrivalTime, setClientArrivalTime] = useState<string>("--:-- --");
  
  // Micro-task suggestion state
  const [currentSuggestion, setCurrentSuggestion] = useState<MicroTaskSuggestion | null>(null);
  
  // Stability indicator state
  const [lastChangeTimestamp, setLastChangeTimestamp] = useState<number>(Date.now());
  const [showStabilityIndicator, setShowStabilityIndicator] = useState(false);
  const [minutesSinceChange, setMinutesSinceChange] = useState(0);
  const previousPhaseRef = useRef<string>("");
  const previousTurbulenceRef = useRef<string>("");
  
  // Update interval ref
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use simulated data as default
  const [simulatedProgress, setSimulatedProgress] = useState(35);
  const simulatedRoute = getSimulatedFlightData(departureAirport, arrivalAirport, simulatedProgress);
  
  // Handle flight selection from input
  const handleFlightSelect = async (flight: FlightData, departure: string, arrival: string, airline: string, flightNumber: string) => {
    setFlightData(flight);
    setDepartureAirport(departure);
    setArrivalAirport(arrival);
    setIsTracking(true);
    setUserFlightInfo({ airline, number: flightNumber });
    
    // Start tracking this flight
    const route = await trackFlight(flight, departure, arrival);
    if (route) {
      setFlightRoute(route);
    }
    
    // Fetch weather data
    fetchWeatherData(departure, arrival);
    
    // Fetch turbulence data if we have position
    if (flight.latitude && flight.longitude && flight.baro_altitude) {
      const altitudeFeet = flight.baro_altitude * 3.28084;
      fetchTurbulenceData(flight.latitude, flight.longitude, altitudeFeet, departure, arrival);
    }
    
    // Fetch nearby flights
    if (flight.latitude && flight.longitude) {
      fetchNearbyFlights(flight.latitude, flight.longitude);
    }
  };
  
  // Fetch weather data
  const fetchWeatherData = async (dep: string, arr: string) => {
    const weatherSummary = await getFlightWeatherSummary(dep, arr);
    if (weatherSummary) {
      setWeatherData(weatherSummary);
    }
  };
  
  // Fetch turbulence data
  const fetchTurbulenceData = async (
    lat: number, 
    lon: number, 
    alt: number, 
    dep: string, 
    arr: string
  ) => {
    // Reset fallback flag before fetching
    resetFallbackDataFlag();
    
    // Fetch basic assessment
    const assessment = await assessFlightTurbulence(lat, lon, alt, dep, arr);
    setTurbulenceData(assessment);
    
    // Check if we're using fallback data
    const usingFallback = isUsingFallbackData();
    setIsUsingFallbackTurbulenceData(usingFallback);
    
    // Generate enhanced report if we have airport data
    const depAirport = AIRPORTS[dep];
    const arrAirport = AIRPORTS[arr];
    
    if (depAirport && arrAirport) {
      const enhancedReport = await generateEnhancedTurbulenceReport(
        { code: dep, lat: depAirport.lat, lon: depAirport.lon },
        { code: arr, lat: arrAirport.lat, lon: arrAirport.lon },
        { lat, lon, altitude: alt },
        35000, // Default cruise altitude
        450 // Default ground speed in knots
      );
      setEnhancedTurbulenceReport(enhancedReport);
      
      // Analyze weather gradients if we have weather data
      if (weatherData) {
        const gradients = analyzeWeatherGradients(
          weatherData.departure.metar,
          weatherData.arrival.metar,
          [] // Could add route METARs here
        );
        console.log('Weather gradient analysis:', gradients);
      }
    }
    
    // Log if we're using fallback data
    if (usingFallback) {
      console.log('Using demonstration turbulence data - actual aviation weather API unavailable');
    }
  };
  
  // Fetch nearby flights
  const fetchNearbyFlights = async (lat: number, lon: number) => {
    const nearby = await getFlightsInArea(lat, lon, 100); // 100km radius
    setNearbyFlights(nearby.slice(0, 10)); // Limit to 10 nearest
  };
  
  // Update flight data periodically
  useEffect(() => {
    if (!isTracking || !flightData) return;
    
    const updateData = async () => {
      // Re-fetch flight position
      if (flightData.callsign) {
        const updated = await searchFlight(flightData.callsign);
        if (updated) {
          setFlightData(updated);
          
          // Update route
          const route = await trackFlight(updated, departureAirport, arrivalAirport);
          if (route) {
            setFlightRoute(route);
          }
          
          // Update turbulence if position available
          if (updated.latitude && updated.longitude && updated.baro_altitude) {
            const altitudeFeet = updated.baro_altitude * 3.28084;
            fetchTurbulenceData(
              updated.latitude, 
              updated.longitude, 
              altitudeFeet, 
              departureAirport, 
              arrivalAirport
            );
            
            // Update nearby flights
            fetchNearbyFlights(updated.latitude, updated.longitude);
          }
        }
      }
    };
    
    // Initial update
    updateData();
    
    // Set up interval for updates (every 30 seconds)
    updateIntervalRef.current = setInterval(updateData, 30000);
    
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [isTracking, flightData?.callsign, departureAirport, arrivalAirport]);
  
  // Update simulated progress for demo
  useEffect(() => {
    if (isTracking) return; // Don't simulate if tracking real flight
    
    const interval = setInterval(() => {
      setSimulatedProgress(prev => {
        if (prev >= 100) return 100;
        return prev + 0.5;
      });
    }, 2000);
    
    return () => clearInterval(interval);
  }, [isTracking]);
  
  // Determine current values (real or simulated)
  const currentRoute = flightRoute || simulatedRoute;
  const progress = currentRoute.progress;
  const phase = currentRoute.phase;
  
  // Update arrival time on client side only to prevent hydration mismatch
  useEffect(() => {
    // Calculate arrival time only on the client side
    const route = flightRoute || simulatedRoute;
    if (route && route.estimatedArrival) {
      const formattedTime = formatTimeFromDate(route.estimatedArrival);
      setClientArrivalTime(formattedTime);
    }
  }, [flightRoute, simulatedRoute]);
  
  // Monitor phase and turbulence changes for stability indicator
  useEffect(() => {
    const currentTurbulenceLevel = turbulenceData?.level || 'smooth';
    
    // Check if phase or turbulence level has changed
    if (phase !== previousPhaseRef.current || currentTurbulenceLevel !== previousTurbulenceRef.current) {
      // Update timestamp when meaningful change occurs
      setLastChangeTimestamp(Date.now());
      setShowStabilityIndicator(false); // Hide indicator on new change
      setMinutesSinceChange(0);
      
      // Update refs for next comparison
      previousPhaseRef.current = phase;
      previousTurbulenceRef.current = currentTurbulenceLevel;
    }
    
    // Set up interval to check time since last change
    const checkInterval = setInterval(() => {
      const timeSinceChange = Date.now() - lastChangeTimestamp;
      const minutes = Math.floor(timeSinceChange / 60000);
      setMinutesSinceChange(minutes);
      
      // Show indicator if no changes for 5+ minutes and not at gate
      if (timeSinceChange >= 300000 && phase !== 'gate') {
        setShowStabilityIndicator(true);
      } else {
        setShowStabilityIndicator(false);
      }
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(checkInterval);
  }, [phase, turbulenceData?.level, lastChangeTimestamp]);
  
  // Update micro-task suggestions when phase or turbulence changes
  useEffect(() => {
    // Determine current turbulence level
    let turbulenceLevel: 'smooth' | 'light' | 'moderate' | 'severe' = 'smooth';
    
    if (turbulenceData) {
      if (turbulenceData.level === 'severe' || turbulenceData.level === 'extreme') {
        turbulenceLevel = 'severe';
      } else if (turbulenceData.level === 'moderate') {
        turbulenceLevel = 'moderate';
      } else if (turbulenceData.level === 'light') {
        turbulenceLevel = 'light';
      }
    }
    
    // Get suggestion for current phase and turbulence
    const suggestion = getMicroTaskSuggestion(phase, turbulenceLevel);
    setCurrentSuggestion(suggestion);
    
    // Set up interval to rotate suggestions
    const interval = setInterval(() => {
      const newSuggestion = getMicroTaskSuggestion(phase, turbulenceLevel);
      setCurrentSuggestion(newSuggestion);
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [phase, turbulenceData?.level]);
  
  const normalizedPhase = mapPhaseToFlightPhase(phase);
  const estimatedArrival = currentRoute.estimatedArrival;
  const timeRemaining = formatTimeRemaining(estimatedArrival);
  // arrivalTime is now handled by clientArrivalTime state to prevent hydration mismatch
  const pilotActivity = getEnhancedPilotActivity(phase);
  
  // Generate stability indicator message
  const getStabilityMessage = () => {
    const messages: Record<string, string[]> = {
      taxi: [
        `No new changes from the cockpit. Still taxiing to position.`,
        `Everything steady for the last ${minutesSinceChange} minutes.`,
        `All quiet on the flight deck. Standard taxi operations.`
      ],
      takeoff: [
        `Smooth and unchanging - exactly what we want during takeoff.`,
        `No updates for ${minutesSinceChange} minutes. Climbing as planned.`,
        `Everything's steady. Standard takeoff profile.`
      ],
      climb: [
        `No new changes. Just a steady climb to cruise altitude.`,
        `All systems normal for ${minutesSinceChange} minutes now.`,
        `Smooth climb continues. No turbulence changes.`
      ],
      cruise: [
        `No new changes from the cockpit. Just boring cruise.`,
        `Everything steady for the last ${minutesSinceChange} minutes.`,
        `Smooth and unchanging - exactly what we want.`,
        `No updates means all is well up front.`,
        `${minutesSinceChange} minutes of peaceful cruise flight.`
      ],
      descent: [
        `Steady descent for ${minutesSinceChange} minutes. All normal.`,
        `No changes during descent. Smooth approach ahead.`,
        `Everything stable as we descend.`
      ],
      landing: [
        `Approach stable for ${minutesSinceChange} minutes.`,
        `No new updates. Standard approach continues.`,
        `All steady on final approach.`
      ]
    };
    
    const phaseMessages = messages[phase.toLowerCase()] || messages.cruise;
    const index = Math.floor(Date.now() / 60000) % phaseMessages.length;
    return phaseMessages[index];
  };
  
  // Get airline and flight number - use the original user input if available
  const getFlightInfo = () => {
    // If we have the original user flight info, use that
    if (userFlightInfo) {
      const airlineNameMap: Record<string, string> = {
        'AA': 'American',
        'DL': 'Delta',
        'UA': 'United',
        'WN': 'Southwest',
        'B6': 'JetBlue',
        'AS': 'Alaska',
        'F9': 'Frontier',
        'NK': 'Spirit',
        'G4': 'Allegiant',
        'HA': 'Hawaiian',
      };
      
      const airlineName = airlineNameMap[userFlightInfo.airline] || userFlightInfo.airline;
      
      return {
        airline: airlineName,
        flightNumber: `${userFlightInfo.airline}${userFlightInfo.number}`,
      };
    }
    
    // Fallback to parsing from callsign if no user info stored
    if (flightData?.callsign) {
      // Parse airline and number from callsign like "UAL1234"
      const match = flightData.callsign.match(/^([A-Z]+)(\d+)$/);
      if (match) {
        const [, airlineCode, number] = match;
        const airlineMap: Record<string, string> = {
          'AAL': 'American',
          'DAL': 'Delta',
          'UAL': 'United',
          'SWA': 'Southwest',
          'JBU': 'JetBlue',
          'ASA': 'Alaska',
          'FFT': 'Frontier',
          'TVF': 'Frontier', // TVF is also used for Frontier
          'NKS': 'Spirit',
          'AAY': 'Allegiant',
        };
        
        // Get airline name from map or use a cleaner format for unknown airlines
        const airlineName = airlineMap[airlineCode];
        
        return {
          airline: airlineName || `${airlineCode}`,
          // If we have the airline name, show it with number. Otherwise, just show the code with number, no duplication
          flightNumber: airlineName ? `${number}` : `${airlineCode} ${number}`,
        };
      }
      return {
        airline: 'Flight',
        flightNumber: flightData.callsign,
      };
    }
    return {
      airline: 'United',
      flightNumber: 'UA1234',
    };
  };
  
  const { airline, flightNumber } = getFlightInfo();
  
  // Turbulence summary for status line
  const getTurbulenceSummary = () => {
    if (!turbulenceData) return "Light chop possible, but everything is on profile.";
    return turbulenceData.summary;
  };
  
  // Types for turbulence conditions
  type TurbulenceLevel = "smooth" | "light" | "moderate" | "severe";
  
  interface TurbulenceCondition {
    level: TurbulenceLevel;
    description: string;
    detail: string;
  }
  
  // Function to derive turbulence conditions based on phase and data
  const getTurbulenceConditions = (): { now: TurbulenceCondition; next10Min: TurbulenceCondition; later: TurbulenceCondition } => {
    // Determine base conditions from turbulence data
    const currentLevel: TurbulenceLevel = turbulenceData?.level === 'severe' || turbulenceData?.level === 'extreme' ? 'severe' :
                                           turbulenceData?.level === 'moderate' ? 'moderate' :
                                           turbulenceData?.level === 'light' ? 'light' : 'smooth';
    
    // Phase-specific conditions
    if (phase === "gate" || phase === "taxi") {
      return {
        now: {
          level: "smooth",
          description: "On the ground",
          detail: "Preparing for departure"
        },
        next10Min: {
          level: "smooth",
          description: "Taxi & lineup",
          detail: "Rolling to runway"
        },
        later: {
          level: currentLevel,
          description: currentLevel === "smooth" ? "Smooth climb expected" : 
                      currentLevel === "light" ? "Light bumps in climb" :
                      currentLevel === "moderate" ? "Some chop during climb" : "Bumpy climb ahead",
          detail: `Through ${Math.round(flightData?.baro_altitude ? flightData.baro_altitude * 3.28084 / 1000 : 10)},000ft`
        }
      };
    } else if (phase === "takeoff" || phase === "climb") {
      return {
        now: {
          level: phase === "takeoff" ? "light" : currentLevel,
          description: phase === "takeoff" ? "Normal takeoff bumps" : 
                      currentLevel === "smooth" ? "Smooth climb" :
                      currentLevel === "light" ? "Light turbulence" : 
                      currentLevel === "moderate" ? "Moderate chop" : "Bumpy conditions",
          detail: phase === "takeoff" ? "Climbing through low altitude" : `Passing ${Math.round((flightData?.baro_altitude || 5000) * 3.28084 / 1000)},000ft`
        },
        next10Min: {
          level: currentLevel,
          description: currentLevel === "smooth" ? "Continuing smooth" :
                      currentLevel === "light" ? "Light chop ahead" :
                      currentLevel === "moderate" ? "Moderate bumps" : "Stay seated",
          detail: enhancedTurbulenceReport?.hotSpots[0]?.timeToEncounter && enhancedTurbulenceReport.hotSpots[0].timeToEncounter <= 10 
                  ? enhancedTurbulenceReport.hotSpots[0].description 
                  : "Climbing to cruise"
        },
        later: {
          level: currentLevel,
          description: "Cruise conditions",
          detail: `Level at ${Math.round(35000 / 1000)},000ft`
        }
      };
    } else if (phase === "cruise") {
      const nextSpot = enhancedTurbulenceReport?.hotSpots.find(s => s.timeToEncounter && s.timeToEncounter <= 10);
      const laterSpot = enhancedTurbulenceReport?.hotSpots.find(s => s.timeToEncounter && s.timeToEncounter > 10);
      
      return {
        now: {
          level: currentLevel,
          description: currentLevel === "smooth" ? "Smooth ride" :
                      currentLevel === "light" ? "Light bumps" :
                      currentLevel === "moderate" ? "Moderate turbulence" : "Rough air",
          detail: `Cruising at ${Math.round((flightData?.baro_altitude || 35000) * 3.28084 / 1000)},000ft`
        },
        next10Min: {
          level: nextSpot ? (nextSpot.intensity === 'severe' || nextSpot.intensity === 'extreme' ? 'severe' :
                            nextSpot.intensity === 'moderate' ? 'moderate' : 'light') : currentLevel,
          description: nextSpot ? `${nextSpot.type}` : "Continuing cruise",
          detail: nextSpot ? `${nextSpot.description}` : "Steady conditions"
        },
        later: {
          level: laterSpot ? (laterSpot.intensity === 'severe' || laterSpot.intensity === 'extreme' ? 'severe' :
                             laterSpot.intensity === 'moderate' ? 'moderate' : 'light') : "smooth",
          description: "Descent preparation",
          detail: `Approaching ${arrivalAirport}`
        }
      };
    } else if (phase === "descent" || phase === "landing") {
      return {
        now: {
          level: currentLevel,
          description: phase === "landing" ? "Final approach" : 
                      currentLevel === "smooth" ? "Smooth descent" :
                      currentLevel === "light" ? "Light turbulence" : "Bumpy descent",
          detail: `Descending through ${Math.round((flightData?.baro_altitude || 10000) * 3.28084 / 1000)},000ft`
        },
        next10Min: {
          level: phase === "landing" ? "light" : currentLevel,
          description: phase === "landing" ? "Landing sequence" : "Continuing descent",
          detail: phase === "landing" ? `Runway in sight` : "Approach preparation"
        },
        later: {
          level: "smooth",
          description: "At the gate",
          detail: `Welcome to ${arrivalAirport}`
        }
      };
    }
    
    // Default fallback
    return {
      now: {
        level: currentLevel,
        description: currentLevel === "smooth" ? "Smooth" : 
                    currentLevel === "light" ? "Light bumps" :
                    currentLevel === "moderate" ? "Moderate bumps" : "Rough air",
        detail: "Current conditions"
      },
      next10Min: {
        level: currentLevel,
        description: "Steady conditions",
        detail: "No significant changes"
      },
      later: {
        level: "smooth",
        description: "Expected smooth",
        detail: "Rest of flight"
      }
    };
  };
  
  // Get color class for turbulence level
  const getTurbulenceColorClass = (level: TurbulenceLevel): string => {
    switch(level) {
      case "smooth": return "bg-emerald-400/60";
      case "light": return "bg-sky-400/60";
      case "moderate": return "bg-amber-400/60";
      case "severe": return "bg-orange-400/60";
      default: return "bg-emerald-400/60";
    }
  };
  
  // Define sections array for accordions - Specific order for anxiety reduction
  const sections = [
    {
      id: 'WEATHER',
      title: 'Weather Along Your Route',
      subtitle: weatherData ? 'Live conditions at departure and arrival' : 'Current weather affecting your journey',
      icon: '☁️'
    },
    {
      id: 'AROUND',
      title: "What's Around Me",
      subtitle: nearbyFlights.length > 0 ? `${nearbyFlights.length} other planes sharing your airspace` : "See who else is up here with you",
      icon: '🗺️'
    },
    {
      id: 'TURBULENCE',
      title: "Today's Turbulence Report",
      subtitle: 'Understanding the bumps and why they\'re normal',
      icon: '〰️'
    },
    {
      id: 'WEIRD',
      title: 'Things that feel weird but are totally normal',
      subtitle: 'Those strange sounds and sensations explained',
      icon: '✈️'
    },
    {
      id: 'PILOTS',
      title: 'What the pilots are doing right now',
      subtitle: `During ${phase}: exactly what\'s happening up front`,
      icon: '👨‍✈️'
    }
  ];

  return (
    <section className="mt-10 w-full max-w-2xl mx-auto text-white">
      {/* Flight Input Component - TOP */}
      <FlightInput 
        onFlightSelect={handleFlightSelect}
        initialFlightNumber={flightNumber}
        initialDeparture={departureAirport}
        initialArrival={arrivalAirport}
      />
      
      <div className="rounded-3xl border border-slate-800/50 bg-white/[0.03] backdrop-blur-sm p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
        {/* Header with Live Tracking Status - Following Flight Input */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
              {isTracking ? 'Live Flight' : 'Demo Flight'}
            </p>
            <h2 className="text-xl font-semibold mt-1 text-gray-200">
              {airline} <span className="font-mono">{flightNumber}</span>
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {departureAirport} → {arrivalAirport}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
              Current Phase
            </p>
            <p className="text-sm font-medium text-sky-400 capitalize">{phase}</p>
            <p className="text-xs text-gray-400 mt-1">
              Time remaining:{" "}
              <span className="font-mono text-gray-200">
                {timeRemaining}
              </span>
            </p>
          </div>
        </div>

        {/* Flight map with better spacing */}
        <FlightMap 
          from={departureAirport} 
          to={arrivalAirport} 
          progressPercent={progress} 
        />

        {/* Live tracking indicator with phase progress */}
        <div className="mt-6 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-white/[0.02] rounded-2xl border border-slate-800/30">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${isTracking ? 'bg-emerald-400' : 'bg-yellow-400'} animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]`} />
            <span className="text-sm text-gray-300">
              {isTracking ? 'Live tracking active' : 'Demo mode - enter flight above'}
            </span>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-gray-400">Arrival (local)</p>
            <p className="font-mono text-sm text-gray-200">
              {clientArrivalTime}
            </p>
          </div>
        </div>

        {/* Autopilot & Systems Status Pills - High Priority Visual */}
        <div className="flex flex-wrap gap-2 mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.03] rounded-full border border-emerald-900/30 transition-all duration-200 hover:bg-white/[0.05]">
            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-xs text-gray-300">Autopilot engaged</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.03] rounded-full border border-emerald-900/30 transition-all duration-200 hover:bg-white/[0.05]">
            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-xs text-gray-300">All systems normal</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.03] rounded-full border border-emerald-900/30 transition-all duration-200 hover:bg-white/[0.05]">
            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-xs text-gray-300">Triple redundancy active</span>
          </div>
        </div>

        {/* NOW/NEXT/LATER Turbulence Strip - Critical Information */}
        <div className="mb-8 p-5 bg-white/[0.04] rounded-3xl border border-slate-800/50 backdrop-blur-sm">
          {(() => {
            const conditions = getTurbulenceConditions();
            return (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                {/* NOW */}
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 font-medium">NOW</div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${getTurbulenceColorClass(conditions.now.level)} shadow-[0_0_6px_rgba(255,255,255,0.3)]`}></span>
                    <span className="text-sm text-gray-200 font-medium">{conditions.now.description}</span>
                  </div>
                  <div className="text-xs text-gray-400">{conditions.now.detail}</div>
                </div>
                
                {/* Visual divider on desktop */}
                <div className="hidden sm:block w-px h-14 bg-slate-700/50"></div>
                
                {/* NEXT 10 MIN */}
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 font-medium">NEXT 10 MIN</div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${getTurbulenceColorClass(conditions.next10Min.level)} shadow-[0_0_6px_rgba(255,255,255,0.3)]`}></span>
                    <span className="text-sm text-gray-200 font-medium">{conditions.next10Min.description}</span>
                  </div>
                  <div className="text-xs text-gray-400">{conditions.next10Min.detail}</div>
                </div>
                
                {/* Visual divider on desktop */}
                <div className="hidden sm:block w-px h-14 bg-slate-700/50"></div>
                
                {/* LATER */}
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 font-medium">LATER</div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${getTurbulenceColorClass(conditions.later.level)} shadow-[0_0_6px_rgba(255,255,255,0.3)]`}></span>
                    <span className="text-sm text-gray-200 font-medium">{conditions.later.description}</span>
                  </div>
                  <div className="text-xs text-gray-400">{conditions.later.detail}</div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Stability Indicator - Shows when no changes for 5+ minutes */}
        <div 
          className={`
            overflow-hidden transition-all duration-500 ease-in-out
            ${showStabilityIndicator ? 'max-h-20 opacity-100 mb-8' : 'max-h-0 opacity-0'}
          `}
        >
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-slate-800/30 to-sky-900/20 rounded-2xl border border-slate-700/30 backdrop-blur-sm">
            <div className="flex items-center justify-center w-6 h-6">
              <svg 
                className="w-4 h-4 text-sky-400/70" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
            <p className="text-xs text-gray-400 flex-1">
              <span className="inline-flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400/50 animate-pulse" />
                {getStabilityMessage()}
              </span>
            </p>
          </div>
        </div>

        {/* Bump Meter - Critical Visual Information */}
        <div className="mb-8">
          <BumpMeter 
            currentLevel={
              enhancedTurbulenceReport?.currentConditions.overall === 'severe' || 
              enhancedTurbulenceReport?.currentConditions.overall === 'extreme' ||
              turbulenceData?.level === 'severe' || 
              turbulenceData?.level === 'extreme' ? 'severe' :
              enhancedTurbulenceReport?.currentConditions.overall === 'moderate' ||
              turbulenceData?.level === 'moderate' ? 'moderate' :
              enhancedTurbulenceReport?.currentConditions.overall === 'light' ||
              turbulenceData?.level === 'light' ? 'light' : 
              'smooth'
            }
          />
        </div>

        {/* Normality Score Chip */}
        {(() => {
          const normalityData = getNormalityScore(departureAirport, arrivalAirport, phase);
          return (
            <div className="mb-8 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/[0.04] rounded-full border border-slate-700/50 backdrop-blur-sm">
                <span className="text-xs text-gray-400">Normality</span>
                <span className="text-xs text-gray-400">·</span>
                <span className="text-sm text-sky-300 font-medium">{normalityData.score.toFixed(1)}/5</span>
                <span className="text-xs text-gray-400">·</span>
                <span className="text-xs text-gray-300">{normalityData.description}</span>
              </div>
              <p className="text-xs text-gray-400 italic">
                {normalityData.score >= 4 ? "Everything happening is routine" : 
                 normalityData.score >= 3 ? "Standard conditions for this route" :
                 normalityData.score >= 2 ? "Less common but still normal" : 
                 "Unusual conditions but plane designed for this"}
              </p>
            </div>
          );
        })()}

        {/* Micro-Task Focus Suggestion Tile - "FOR THE NEXT MINUTE" */}
        {currentSuggestion && (
          <div className="mb-8">
            <div className="bg-white/[0.04] border border-slate-800/50 rounded-3xl p-6 backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.05]">
              {/* Header with soft gradient accent */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400/20 to-emerald-400/20 flex items-center justify-center">
                  <span className="text-lg">🧘</span>
                </div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-400/80">
                  For the next minute
                </h3>
              </div>
              
              {/* Suggestion content */}
              <div className="space-y-3">
                <p className="text-base leading-relaxed text-gray-200">
                  {currentSuggestion.text}
                </p>
                
                {/* Visual breathing guide (appears for turbulence) */}
                {(turbulenceData?.level === 'moderate' || turbulenceData?.level === 'severe') && (
                  <div className="mt-4 p-3 bg-white/[0.02] rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                      <span className="text-xs text-gray-400 uppercase tracking-wider">
                        Breathing guide
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 h-2 rounded-full bg-gradient-to-r from-sky-400/30 to-sky-400/10 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-sky-400/60 to-transparent animate-breathe" />
                      </div>
                    </div>
                    <div className="flex justify-between mt-1 text-[10px] text-gray-500">
                      <span>Breathe in</span>
                      <span>Hold</span>
                      <span>Breathe out</span>
                    </div>
                  </div>
                )}
                
                {/* Optional icon accent */}
                {currentSuggestion.icon && (
                  <div className="flex justify-end">
                    <span className="text-2xl opacity-50">{currentSuggestion.icon}</span>
                  </div>
                )}
              </div>
              
              {/* Subtle footer */}
              <div className="mt-4 pt-3 border-t border-white/5">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                  {phase === 'cruise' ? 'Steady as she goes' : 
                   phase === 'takeoff' || phase === 'climb' ? 'Climbing smoothly' :
                   phase === 'descent' || phase === 'landing' ? 'Returning to earth' :
                   'Preparing for journey'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Accordion sections */}
        <div className="mt-6 space-y-3">
          {sections.map((section) => (
            <AccordionSection
              key={section.id}
              title={section.title}
              subtitle={section.subtitle}
              icon={section.icon}
              isOpen={openAccordion === section.id}
              onToggle={() => setOpenAccordion(openAccordion === section.id ? null : section.id)}
            >
              {/* WEATHER Section */}
              {section.id === 'WEATHER' && (
                <div className="space-y-4">
                  {weatherData ? (
                    <>
                      {/* Departure Weather */}
                      <div className="border-l-2 border-emerald-400 pl-4">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">
                          Departure ({departureAirport})
                        </h4>
                        {weatherData.departure.metar ? (
                          <div className="space-y-1 text-sm text-slate-300">
                            <p>Conditions: <span className="text-slate-100">{weatherData.departure.metar.flight_category}</span></p>
                            <p>Temperature: <span className="text-slate-100">{weatherData.departure.metar.human_readable?.temperature}</span></p>
                            <p>Wind: <span className="text-slate-100">{weatherData.departure.metar.human_readable?.wind}</span></p>
                            <p>Visibility: <span className="text-slate-100">{weatherData.departure.metar.human_readable?.visibility}</span></p>
                            <p>Sky: <span className="text-slate-100">{weatherData.departure.metar.human_readable?.sky}</span></p>
                            {weatherData.departure.metar.human_readable?.weather && (
                              <p>Weather: <span className="text-slate-100">{weatherData.departure.metar.human_readable.weather}</span></p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-400">Weather data not available</p>
                        )}
                      </div>
                      
                      {/* Arrival Weather */}
                      <div className="border-l-2 border-sky-400 pl-4">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-sky-400 mb-2">
                          Arrival ({arrivalAirport})
                        </h4>
                        {weatherData.arrival.metar ? (
                          <div className="space-y-1 text-sm text-slate-300">
                            <p>Conditions: <span className="text-slate-100">{weatherData.arrival.metar.flight_category}</span></p>
                            <p>Temperature: <span className="text-slate-100">{weatherData.arrival.metar.human_readable?.temperature}</span></p>
                            <p>Wind: <span className="text-slate-100">{weatherData.arrival.metar.human_readable?.wind}</span></p>
                            <p>Visibility: <span className="text-slate-100">{weatherData.arrival.metar.human_readable?.visibility}</span></p>
                            <p>Sky: <span className="text-slate-100">{weatherData.arrival.metar.human_readable?.sky}</span></p>
                            {weatherData.arrival.metar.human_readable?.weather && (
                              <p>Weather: <span className="text-slate-100">{weatherData.arrival.metar.human_readable.weather}</span></p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-400">Weather data not available</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-slate-300">
                      Enter your flight number above to see live weather data for your departure and arrival airports.
                    </p>
                  )}
                </div>
              )}
              
              {/* WHAT'S AROUND ME Section */}
              {section.id === 'AROUND' && (
                <div className="space-y-3">
                  {nearbyFlights.length > 0 ? (
                    <>
                      <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">
                        Aircraft within 100km of your position:
                      </p>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {nearbyFlights.map((flight, idx) => {
                          const altitudeFt = flight.baro_altitude ? Math.round(flight.baro_altitude * 3.28) : 0;
                          const speedKts = flight.velocity ? Math.round(flight.velocity * 1.94) : 0;
                          return (
                            <div key={idx} className="bg-white/[0.03] rounded-lg px-3 py-2 text-sm">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="font-mono text-sky-400">{flight.callsign || 'Unknown'}</span>
                                  <p className="text-xs text-slate-400 mt-0.5">
                                    {altitudeFt.toLocaleString()} ft | {speedKts} kts
                                  </p>
                                </div>
                                <span className="text-xs text-slate-500">
                                  {flight.origin_country}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : isTracking ? (
                    <p className="text-slate-300">
                      Searching for nearby aircraft... This will update when flight position is available.
                    </p>
                  ) : (
                    <p className="text-slate-300">
                      Enter your flight number above to see nearby aircraft in real-time.
                    </p>
                  )}
                </div>
              )}
              
              {/* TURBULENCE ANALYSIS Section */}
              {section.id === 'TURBULENCE' && (
                <div className="space-y-3">
                  {/* Fallback Data Indicator */}
                  {isUsingFallbackTurbulenceData && (
                    <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-3 mb-3">
                      <div className="flex items-start gap-2">
                        <span className="text-amber-400 text-sm">ℹ️</span>
                        <div className="text-xs text-amber-300">
                          <p className="font-semibold mb-1">Using Demonstration Data</p>
                          <p className="opacity-90">Live aviation weather data is currently unavailable. Showing representative turbulence conditions for this route.</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Main summary text */}
                  <p className="text-sm text-slate-300">
                    {turbulenceData ? turbulenceData.summary : "Light chop possible, but everything is on profile. The aircraft is designed for far more than you'll experience today."}
                  </p>
                  
                  {/* Normality Score Chip */}
                  {(() => {
                    const normalityData = getNormalityScore(departureAirport, arrivalAirport, phase);
                    return (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] rounded-full border border-slate-700/50 backdrop-blur-sm">
                        <span className="text-xs text-gray-400">Normality</span>
                        <span className="text-xs text-gray-400">·</span>
                        <span className="text-xs text-sky-300 font-medium">{normalityData.score.toFixed(1)} / 5</span>
                        <span className="text-xs text-gray-400">·</span>
                        <span className="text-xs text-gray-300">{normalityData.description}</span>
                      </div>
                    );
                  })()}
                  
                  {/* Bump Meter - Always show, with demo data if no real data */}
                  <BumpMeter 
                    currentLevel={
                      enhancedTurbulenceReport?.currentConditions.overall === 'severe' || 
                      enhancedTurbulenceReport?.currentConditions.overall === 'extreme' ||
                      turbulenceData?.level === 'severe' || 
                      turbulenceData?.level === 'extreme' ? 'severe' :
                      enhancedTurbulenceReport?.currentConditions.overall === 'moderate' ||
                      turbulenceData?.level === 'moderate' ? 'moderate' :
                      enhancedTurbulenceReport?.currentConditions.overall === 'light' ||
                      turbulenceData?.level === 'light' ? 'light' : 
                      'smooth' // Default to smooth for demo
                    }
                  />
                  
                  {enhancedTurbulenceReport ? (
                    <>
                      {/* Current Conditions Summary */}
                      <div className="bg-white/[0.03] rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs uppercase tracking-wider text-slate-400">
                            Route Analysis
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              enhancedTurbulenceReport.currentConditions.overall === 'severe' || 
                              enhancedTurbulenceReport.currentConditions.overall === 'extreme' ? 'bg-red-500/20 text-red-400' :
                              enhancedTurbulenceReport.currentConditions.overall === 'moderate' ? 'bg-orange-500/20 text-orange-400' :
                              enhancedTurbulenceReport.currentConditions.overall === 'light' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-green-500/20 text-green-400'
                            }`}>
                              {enhancedTurbulenceReport.currentConditions.overall.toUpperCase()}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full border ${
                              enhancedTurbulenceReport.confidence.level === 'high' ? 'border-green-500/30 text-green-400' :
                              enhancedTurbulenceReport.confidence.level === 'medium' ? 'border-yellow-500/30 text-yellow-400' :
                              'border-red-500/30 text-red-400'
                            }`}>
                              {enhancedTurbulenceReport.confidence.level.toUpperCase()} CONFIDENCE
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-slate-300 mb-3">{enhancedTurbulenceReport.summary}</p>
                        
                        {/* Data Quality Indicators */}
                        <div className="flex gap-4 text-xs text-slate-400">
                          <span>{enhancedTurbulenceReport.confidence.dataPoints} reports</span>
                          <span>{enhancedTurbulenceReport.confidence.coverage}% route coverage</span>
                          <span>Data: {enhancedTurbulenceReport.confidence.age}</span>
                        </div>
                      </div>
                      
                      {/* Phase-by-Phase Forecast */}
                      {enhancedTurbulenceReport.forecast && (
                        <div>
                          <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">
                            Phase-by-Phase Forecast
                          </p>
                          <div className="grid grid-cols-5 gap-2">
                            {Object.entries(enhancedTurbulenceReport.forecast).map(([phase, data]) => (
                              <div key={phase} className="bg-white/[0.03] rounded-lg p-2 text-center">
                                <div className="text-[10px] uppercase text-slate-500 mb-1">
                                  {phase}
                                </div>
                                <div className={`text-xs font-medium ${
                                  data.intensity.includes('Severe') ? 'text-red-400' :
                                  data.intensity.includes('Moderate') ? 'text-orange-400' :
                                  data.intensity.includes('Light') ? 'text-yellow-400' :
                                  'text-green-400'
                                }`}>
                                  {data.intensity}
                                </div>
                                <div className="text-[10px] text-slate-500 mt-1">
                                  {data.probability}%
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Turbulence Hot Spots */}
                      {enhancedTurbulenceReport.hotSpots.length > 0 && (
                        <div>
                          <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">
                            Turbulence Hot Spots Along Route
                          </p>
                          <div className="space-y-2">
                            {enhancedTurbulenceReport.hotSpots.map((spot, idx) => (
                              <div key={idx} className="bg-white/[0.03] rounded-lg p-2">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                                        spot.intensity === 'extreme' ? 'bg-red-600/20 text-red-400' :
                                        spot.intensity === 'severe' ? 'bg-red-500/20 text-red-400' :
                                        spot.intensity === 'moderate' ? 'bg-orange-500/20 text-orange-400' :
                                        'bg-yellow-500/20 text-yellow-400'
                                      }`}>
                                        {spot.intensity.toUpperCase()}
                                      </span>
                                      <TurbulenceTooltip 
                                        type={spot.type} 
                                        className="text-xs text-slate-500"
                                        showIcon={true}
                                      />
                                      <span className="text-[10px] text-slate-600">
                                        ({spot.source})
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-300">
                                      {spot.description}
                                    </p>
                                    <div className="flex gap-3 mt-1 text-[10px] text-slate-500">
                                      <span>FL{Math.round(spot.altitudeRange.min/100)}-{Math.round(spot.altitudeRange.max/100)}</span>
                                      <span>{spot.distance.toFixed(0)}nm away</span>
                                      {spot.timeToEncounter && (
                                        <span>{Math.round(spot.timeToEncounter)} min</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className={`ml-2 text-xs font-semibold ${
                                    spot.confidence === 'high' ? 'text-green-400' :
                                    spot.confidence === 'medium' ? 'text-yellow-400' :
                                    'text-red-400'
                                  }`}>
                                    {spot.confidence[0].toUpperCase()}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Altitude Recommendations */}
                      {enhancedTurbulenceReport.altitudeRecommendations && (
                        <div>
                          <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">
                            Altitude Recommendations
                          </p>
                          <div className="bg-white/[0.03] rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-slate-400">Optimal Cruise</span>
                              <span className="text-sm font-mono text-sky-400">
                                FL{Math.round(enhancedTurbulenceReport.altitudeRecommendations.optimal / 100)}
                              </span>
                            </div>
                            
                            {enhancedTurbulenceReport.altitudeRecommendations.avoid.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-white/5">
                                <p className="text-xs text-red-400 mb-1">Avoid:</p>
                                {enhancedTurbulenceReport.altitudeRecommendations.avoid.map((range, idx) => (
                                  <p key={idx} className="text-xs text-slate-400">
                                    FL{Math.round(range.min/100)}-{Math.round(range.max/100)}: {range.reason}
                                  </p>
                                ))}
                              </div>
                            )}
                            
                            {enhancedTurbulenceReport.altitudeRecommendations.alternates.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-white/5">
                                <p className="text-xs text-green-400 mb-1">Alternates:</p>
                                {enhancedTurbulenceReport.altitudeRecommendations.alternates.map((alt, idx) => (
                                  <p key={idx} className="text-xs text-slate-400">
                                    FL{Math.round(alt.altitude/100)}: {alt.conditions}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Recent PIREPs */}
                      {enhancedTurbulenceReport.currentConditions.recentPIREPs.length > 0 && (
                        <div>
                          <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">
                            Recent Pilot Reports Along Route
                          </p>
                          <div className="space-y-1 text-xs text-slate-400">
                            {enhancedTurbulenceReport.currentConditions.recentPIREPs.slice(0, 3).map((pirep, idx) => (
                              <p key={idx}>{formatPIREP(pirep)}</p>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Recommendations */}
                      {enhancedTurbulenceReport.recommendations.length > 0 && (
                        <div>
                          <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">
                            Recommendations
                          </p>
                          <ul className="space-y-1">
                            {enhancedTurbulenceReport.recommendations.map((rec, idx) => (
                              <li key={idx} className="flex gap-2 text-sm text-slate-300">
                                <span className="text-sky-400">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Active Advisories */}
                      {(enhancedTurbulenceReport.currentConditions.activeSIGMETs.length > 0 || 
                        enhancedTurbulenceReport.currentConditions.activeAIRMETs.length > 0) && (
                        <div>
                          <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">
                            Active Advisories
                          </p>
                          {enhancedTurbulenceReport.currentConditions.activeSIGMETs.map((sigmet, idx) => (
                            <div key={`sigmet-${idx}`} className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 mb-2">
                              <span className="text-xs font-semibold text-red-400">SIGMET:</span>
                              <span className="text-xs text-slate-300 ml-2">{sigmet.hazard}</span>
                            </div>
                          ))}
                          {enhancedTurbulenceReport.currentConditions.activeAIRMETs.map((airmet, idx) => (
                            <div key={`airmet-${idx}`} className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2 mb-2">
                              <span className="text-xs font-semibold text-yellow-400">AIRMET:</span>
                              <span className="text-xs text-slate-300 ml-2">{airmet.hazard}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : turbulenceData ? (
                    <>
                      {/* Fallback to basic turbulence data */}
                      <div className="bg-white/[0.03] rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs uppercase tracking-wider text-slate-400">
                            Current Assessment
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            turbulenceData.level === 'severe' ? 'bg-red-500/20 text-red-400' :
                            turbulenceData.level === 'moderate' ? 'bg-yellow-500/20 text-yellow-400' :
                            turbulenceData.level === 'light' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-green-500/20 text-green-400'
                          }`}>
                            {turbulenceData.level.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300">{turbulenceData.summary}</p>
                      </div>
                      
                      {/* Recommendations */}
                      {turbulenceData.recommendations.length > 0 && (
                        <div>
                          <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">
                            Recommendations
                          </p>
                          <ul className="space-y-1">
                            {turbulenceData.recommendations.map((rec, idx) => (
                              <li key={idx} className="flex gap-2 text-sm text-slate-300">
                                <span className="text-sky-400">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Recent Pilot Reports */}
                      {turbulenceData.reports.length > 0 && (
                        <div>
                          <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">
                            Recent Pilot Reports
                          </p>
                          <div className="space-y-1 text-xs text-slate-400">
                            {turbulenceData.reports.slice(0, 3).map((pirep, idx) => (
                              <p key={idx}>{formatPIREP(pirep)}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-slate-300">
                      Enter your flight number above to see comprehensive turbulence analysis for your specific route.
                    </p>
                  )}
                </div>
              )}
              
              {/* WEIRD THINGS Section */}
              {section.id === 'WEIRD' && (
                <FlightPhaseWeirdThings phase={normalizedPhase} />
              )}
              
              {/* PILOTS Section */}
              {section.id === 'PILOTS' && (
                <div className="space-y-4">
                  {/* Phase-aware summary */}
                  <div className="bg-white/[0.03] rounded-lg p-4 border border-white/5">
                    <p className="text-sm text-slate-200 leading-relaxed">
                      {pilotActivity.summary}
                    </p>
                  </div>
                  
                  {/* Two-column comparison layout */}
                  <div className="grid gap-4 md:gap-6 md:grid-cols-2">
                    {/* Actual activities column */}
                    <div className="bg-white/[0.02] rounded-lg p-4 border border-white/5">
                      <div className="text-xs font-semibold tracking-[0.2em] uppercase text-emerald-400 mb-4">
                        What they're actually doing
                      </div>
                      <ul className="space-y-3">
                        {pilotActivity.actualActivities.map((activity, idx) => (
                          <li key={idx} className="flex gap-2 text-sm text-slate-200 leading-relaxed">
                            <span className="text-emerald-400 mt-0.5">•</span>
                            <span>{activity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Anxious thoughts column */}
                    <div className="bg-white/[0.02] rounded-lg p-4 border border-white/5">
                      <div className="text-xs font-semibold tracking-[0.2em] uppercase text-orange-400 mb-4">
                        What a frightened mind imagines
                      </div>
                      <ul className="space-y-3">
                        {pilotActivity.anxiousThoughts.map((thought, idx) => (
                          <li key={idx} className="flex gap-2 text-sm text-slate-300/80 leading-relaxed">
                            <span className="text-slate-500 mt-0.5">•</span>
                            <span>{thought}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  {/* Additional context note */}
                  <div className="bg-white/[0.02] rounded-lg p-3 border border-white/5">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      <span className="text-sky-400 font-medium">Remember:</span> Commercial aviation operates on redundancy, procedures, and multiple layers of safety. 
                      Every phase is planned, briefed, and executed systematically.
                    </p>
                  </div>
                </div>
              )}
            </AccordionSection>
          ))}
        </div>

        {/* Micro-Task Focus Suggestion Tile */}
        {currentSuggestion && (
          <div className="mt-6">
            <div className="bg-white/[0.03] border border-slate-800/50 rounded-3xl p-6 backdrop-blur-sm">
              {/* Header with soft gradient accent */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400/20 to-emerald-400/20 flex items-center justify-center">
                  <span className="text-lg">🧘</span>
                </div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-400/80">
                  For the next minute
                </h3>
              </div>
              
              {/* Suggestion content */}
              <div className="space-y-3">
                <p className="text-base leading-relaxed text-slate-200">
                  {currentSuggestion.text}
                </p>
                
                {/* Visual breathing guide (appears for turbulence) */}
                {(turbulenceData?.level === 'moderate' || turbulenceData?.level === 'severe') && (
                  <div className="mt-4 p-3 bg-white/[0.02] rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                      <span className="text-xs text-slate-400 uppercase tracking-wider">
                        Breathing guide
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 h-2 rounded-full bg-gradient-to-r from-sky-400/30 to-sky-400/10 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-sky-400/60 to-transparent animate-breathe" />
                      </div>
                    </div>
                    <div className="flex justify-between mt-1 text-[10px] text-slate-500">
                      <span>Breathe in</span>
                      <span>Hold</span>
                      <span>Breathe out</span>
                    </div>
                  </div>
                )}
                
                {/* Optional icon accent */}
                {currentSuggestion.icon && (
                  <div className="flex justify-end">
                    <span className="text-2xl opacity-50">{currentSuggestion.icon}</span>
                  </div>
                )}
              </div>
              
              {/* Subtle footer */}
              <div className="mt-4 pt-3 border-t border-white/5">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                  {phase === 'cruise' ? 'Steady as she goes' : 
                   phase === 'takeoff' || phase === 'climb' ? 'Climbing smoothly' :
                   phase === 'descent' || phase === 'landing' ? 'Returning to earth' :
                   'Preparing for journey'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Real-time data indicators */}
        {isTracking && (
          <div className="mt-6 flex flex-wrap gap-2">
            {flightData && (
              <span className="text-[10px] px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400">
                ✓ Flight tracking active
              </span>
            )}
            {weatherData && (
              <span className="text-[10px] px-2 py-1 bg-sky-500/10 border border-sky-500/30 rounded-full text-sky-400">
                ✓ Weather data live
              </span>
            )}
            {turbulenceData && (
              <span className="text-[10px] px-2 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-yellow-400">
                ✓ Turbulence monitoring
              </span>
            )}
          </div>
        )}
      </div>
    </section>
  );
}