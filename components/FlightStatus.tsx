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
    'DEN-ORD': 4.3,
    'ORD-DEN': 4.2,
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
  
  // Nearby flights state
  const [nearbyFlights, setNearbyFlights] = useState<FlightData[]>([]);
  
  // UI state
  const [openAccordion, setOpenAccordion] = useState<string | null>('TURBULENCE'); // Show turbulence analysis by default
  const [nerdOpen, setNerdOpen] = useState(false);
  
  // Client-side arrival time state to prevent hydration mismatch
  const [clientArrivalTime, setClientArrivalTime] = useState<string>("--:-- --");
  
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
    // Fetch basic assessment
    const assessment = await assessFlightTurbulence(lat, lon, alt, dep, arr);
    setTurbulenceData(assessment);
    
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
  
  // Update arrival time on client side only to prevent hydration mismatch
  useEffect(() => {
    // Calculate arrival time only on the client side
    const route = flightRoute || simulatedRoute;
    if (route && route.estimatedArrival) {
      const formattedTime = formatTimeFromDate(route.estimatedArrival);
      setClientArrivalTime(formattedTime);
    }
  }, [flightRoute, simulatedRoute]);
  
  // Determine current values (real or simulated)
  const currentRoute = flightRoute || simulatedRoute;
  const progress = currentRoute.progress;
  const phase = currentRoute.phase;
  const normalizedPhase = mapPhaseToFlightPhase(phase);
  const estimatedArrival = currentRoute.estimatedArrival;
  const timeRemaining = formatTimeRemaining(estimatedArrival);
  // arrivalTime is now handled by clientArrivalTime state to prevent hydration mismatch
  const pilotActivity = getEnhancedPilotActivity(phase);
  
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
  
  // Define sections array for accordions
  const sections = [
    {
      id: 'WEATHER',
      title: 'WEATHER',
      subtitle: weatherData ? 'Live weather at origin and destination' : 'Real-time weather at origin, en route, and destination.',
      icon: '☁️'
    },
    {
      id: 'AROUND',
      title: "WHAT'S AROUND ME?",
      subtitle: nearbyFlights.length > 0 ? `${nearbyFlights.length} aircraft nearby` : "A sense of what you're flying over right now.",
      icon: '🗺️'
    },
    {
      id: 'TURBULENCE',
      title: 'TURBULENCE ANALYSIS',
      subtitle: turbulenceData ? turbulenceData.summary : 'Why the bumps feel big, and why the jet is built for far more.',
      icon: '〰️'
    },
    {
      id: 'WEIRD',
      title: 'THINGS THAT FEEL WEIRD BUT ARE TOTALLY NORMAL',
      subtitle: 'Tap anything that sounds familiar to see what it really is, why it exists, and what covers you if that part misbehaves.',
      icon: '✈️'
    },
    {
      id: 'PILOTS',
      title: 'WHAT THE PILOTS ARE DOING RIGHT NOW',
      subtitle: 'A grounded view of their job in this phase of flight.',
      icon: '👨‍✈️'
    }
  ];

  return (
    <section className="mt-10 w-full max-w-2xl mx-auto text-white">
      {/* Flight Input Component */}
      <FlightInput 
        onFlightSelect={handleFlightSelect}
        initialFlightNumber={flightNumber}
        initialDeparture={departureAirport}
        initialArrival={arrivalAirport}
      />
      
      <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-white/2 p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              {isTracking ? 'Live Flight' : 'Demo Flight'}
            </p>
            <h2 className="text-xl font-semibold mt-1">
              {airline} <span className="font-mono">{flightNumber}</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {departureAirport} → {arrivalAirport}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Phase
            </p>
            <p className="text-sm font-medium text-sky-400 capitalize">{phase}</p>
            <p className="text-xs text-slate-400 mt-1">
              Time remaining:{" "}
              <span className="font-mono text-slate-200">
                {timeRemaining}
              </span>
            </p>
          </div>
        </div>

        {/* Flight map */}
        <FlightMap 
          from={departureAirport} 
          to={arrivalAirport} 
          progressPercent={progress} 
        />

        {/* Numeric progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Flight progress</span>
            <span className="font-mono text-gray-200">
              {progress.toFixed(0)}%
            </span>
          </div>
          <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Enhanced Phase Timeline with Progress Indicator */}
        <div className="mt-6 mb-2">
          {/* Phase labels with status indicators */}
          <div className="relative">
            {/* Progress line background */}
            <div className="absolute top-8 left-[7%] right-[7%] h-1 bg-slate-800/50 rounded-full" />
            
            {/* Active progress line */}
            <div 
              className="absolute top-8 left-[7%] h-1 bg-gradient-to-r from-emerald-400 to-sky-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(52,211,153,0.4)]"
              style={{
                width: `${Math.max(0, Math.min(86, (["gate", "taxi", "takeoff", "climb", "cruise", "descent", "landing"].indexOf(phase.toLowerCase()) + 0.5) * (86 / 7)))}%`
              }}
            />
            
            {/* Phase indicators */}
            <div className="relative flex justify-between">
              {["Gate", "Taxi", "Takeoff", "Climb", "Cruise", "Descent", "Landing"].map(
                (p, index) => {
                  const phases = ["gate", "taxi", "takeoff", "climb", "cruise", "descent", "landing"];
                  const currentPhaseIndex = phases.indexOf(phase.toLowerCase());
                  const phaseIndex = phases.indexOf(p.toLowerCase());
                  const isCompleted = phaseIndex < currentPhaseIndex;
                  const isCurrent = phaseIndex === currentPhaseIndex;
                  const isUpcoming = phaseIndex > currentPhaseIndex;
                  
                  return (
                    <div
                      key={p}
                      className="flex-1 flex flex-col items-center relative"
                    >
                      {/* Phase label */}
                      <span
                        className={`
                          text-[10px] uppercase tracking-[0.15em] font-medium transition-all duration-300
                          ${isCompleted ? "text-emerald-400" : ""}
                          ${isCurrent ? "text-sky-400 font-bold scale-110" : ""}
                          ${isUpcoming ? "text-slate-500" : ""}
                        `}
                      >
                        {p}
                      </span>
                      
                      {/* Phase dot indicator */}
                      <div className="mt-2 relative z-10">
                        <div
                          className={`
                            w-3 h-3 rounded-full transition-all duration-300 flex items-center justify-center
                            ${isCompleted ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" : ""}
                            ${isCurrent ? "bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.8)] scale-125" : ""}
                            ${isUpcoming ? "bg-slate-700 border border-slate-600" : ""}
                          `}
                        >
                          {/* Pulsing ring for current phase */}
                          {isCurrent && (
                            <div className="absolute inset-[-4px] rounded-full border-2 border-sky-400 animate-ping opacity-75" />
                          )}
                          
                          {/* Checkmark for completed phases */}
                          {isCompleted && (
                            <svg
                              className="w-2 h-2 text-slate-950"
                              viewBox="0 0 12 12"
                              fill="none"
                            >
                              <path
                                d="M3 6L5 8L9 4"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </div>
                        
                        {/* Airplane icon at current position */}
                        {isCurrent && (
                          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
                            <div className="relative animate-bounce">
                              <span className="text-base text-sky-400 drop-shadow-[0_0_4px_rgba(56,189,248,0.8)]">✈︎</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
          
          {/* Phase status text */}
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400">
              Current Phase: <span className="text-sky-400 font-semibold capitalize">{phase}</span>
              {currentRoute && (
                <span className="ml-2 text-slate-500">
                  • {["gate", "taxi", "takeoff", "climb", "cruise", "descent", "landing"].indexOf(phase.toLowerCase()) + 1} of 7 phases complete
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Live status footer */}
        <div className="mt-6 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${isTracking ? 'bg-emerald-400' : 'bg-yellow-400'} animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]`} />
            <span className="text-slate-300">
              {isTracking ? 'Live tracking' : 'Demo mode (enter flight above)'}
            </span>
          </div>
          <div className="text-right text-slate-400 text-xs">
            <p className="font-semibold tracking-[0.1em] uppercase">Est. arrival (local)</p>
            <p className="font-mono text-slate-200 mt-0.5">
              {clientArrivalTime}
            </p>
          </div>
        </div>

        {/* Summary status */}
        <div className="mt-3 text-sm text-gray-300">
          {getTurbulenceSummary()}
        </div>

        {/* Autopilot & Redundancy Status Pills */}
        <div className="flex flex-wrap gap-2 mt-4 mb-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.02] rounded-full border border-emerald-900/30">
            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-xs text-gray-300">Autopilot flying</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.02] rounded-full border border-emerald-900/30">
            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-xs text-gray-300">All critical systems normal</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.02] rounded-full border border-emerald-900/30">
            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-xs text-gray-300">Multiple backups ready</span>
          </div>
        </div>

        {/* Turbulence Conditions Strip */}
        <div className="mt-6 mb-6 p-4 bg-white/[0.03] rounded-2xl border border-slate-800/50">
          {(() => {
            const conditions = getTurbulenceConditions();
            return (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* NOW */}
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">NOW</div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${getTurbulenceColorClass(conditions.now.level)} shadow-[0_0_4px_rgba(255,255,255,0.2)]`}></span>
                    <span className="text-sm text-gray-200 font-medium">{conditions.now.description}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{conditions.now.detail}</div>
                </div>
                
                {/* Divider */}
                <div className="hidden sm:block w-px h-12 bg-slate-700/50"></div>
                
                {/* NEXT 10 MIN */}
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">NEXT 10 MIN</div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${getTurbulenceColorClass(conditions.next10Min.level)} shadow-[0_0_4px_rgba(255,255,255,0.2)]`}></span>
                    <span className="text-sm text-gray-200 font-medium">{conditions.next10Min.description}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{conditions.next10Min.detail}</div>
                </div>
                
                {/* Divider */}
                <div className="hidden sm:block w-px h-12 bg-slate-700/50"></div>
                
                {/* LATER */}
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">LATER</div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${getTurbulenceColorClass(conditions.later.level)} shadow-[0_0_4px_rgba(255,255,255,0.2)]`}></span>
                    <span className="text-sm text-gray-200 font-medium">{conditions.later.description}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{conditions.later.detail}</div>
                </div>
              </div>
            );
          })()}
        </div>

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