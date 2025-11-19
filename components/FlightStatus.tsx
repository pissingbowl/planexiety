// components/FlightStatus.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { FlightPhaseWeirdThings } from "./FlightPhaseWeirdThings";
import { AccordionSection } from "./AccordionSection";
import { FlightInput } from "./FlightInput";
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
  type TurbulenceAssessment 
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

function getPilotActivity(phase: string) {
  if (phase === "climb") {
    return {
      title: "Right now the pilots are letting the airplane do the work.",
      lines: [
        "Autopilot is already on, flying a programmed route and climb profile.",
        "They're watching the flight path, talking to departure control every few minutes, and cleaning up checklists.",
        "The aircraft is trimmed and stable, climbing efficiently to cruise altitude.",
      ],
    };
  }

  if (phase === "cruise") {
    return {
      title: "In cruise, the job is mostly monitoring and talking.",
      lines: [
        "Autopilot is flying. The airplane is trimmed, stable, and following the magenta line.",
        "They check in with ATC every few minutes, review weather ahead, and plan the descent.",
        "Hands on the controls? Only for tiny adjustments when needed.",
      ],
    };
  }

  if (phase === "descent") {
    return {
      title: "During descent, it's still mostly systems and talking.",
      lines: [
        "Autopilot is flying down a planned path toward the arrival.",
        "They're briefing the approach, setting up radios, and checking in with new ATC sectors.",
        "Actual 'hand flying' is a small slice of the whole flight - most of this is supervising a very smart machine.",
      ],
    };
  }

  return {
    title: "The pilots aren't 'driving' like a car - they're supervising a system.",
    lines: [
      "Modern airliners are flown by autopilot most of the time, on routes that were planned long before you boarded.",
      "The pilots talk to ATC, manage systems, and step in if something needs a human decision.",
      "Their job is to stay ahead of the airplane with planning and procedures.",
    ],
  };
}

// --- Main Component ---
export default function FlightStatus() {
  // Flight tracking state
  const [flightData, setFlightData] = useState<FlightData | null>(null);
  const [flightRoute, setFlightRoute] = useState<FlightRoute | null>(null);
  const [departureAirport, setDepartureAirport] = useState<string>("ORD");
  const [arrivalAirport, setArrivalAirport] = useState<string>("LAX");
  const [isTracking, setIsTracking] = useState(false);
  
  // Weather state
  const [weatherData, setWeatherData] = useState<{
    departure: { metar: METARData | null; taf: TAFData | null };
    arrival: { metar: METARData | null; taf: TAFData | null };
    summary: string;
  } | null>(null);
  
  // Turbulence state
  const [turbulenceData, setTurbulenceData] = useState<TurbulenceAssessment | null>(null);
  
  // Nearby flights state
  const [nearbyFlights, setNearbyFlights] = useState<FlightData[]>([]);
  
  // UI state
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [nerdOpen, setNerdOpen] = useState(false);
  
  // Update interval ref
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use simulated data as default
  const [simulatedProgress, setSimulatedProgress] = useState(35);
  const simulatedRoute = getSimulatedFlightData(departureAirport, arrivalAirport, simulatedProgress);
  
  // Handle flight selection from input
  const handleFlightSelect = async (flight: FlightData, departure: string, arrival: string) => {
    setFlightData(flight);
    setDepartureAirport(departure);
    setArrivalAirport(arrival);
    setIsTracking(true);
    
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
    const assessment = await assessFlightTurbulence(lat, lon, alt, dep, arr);
    setTurbulenceData(assessment);
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
  const normalizedPhase = mapPhaseToFlightPhase(phase);
  const estimatedArrival = currentRoute.estimatedArrival;
  const timeRemaining = formatTimeRemaining(estimatedArrival);
  const arrivalTime = formatTimeFromDate(estimatedArrival);
  const pilotActivity = getPilotActivity(phase);
  
  // Get airline and flight number from callsign
  const getFlightInfo = () => {
    if (flightData?.callsign) {
      // Parse airline and number from callsign like "UAL1234"
      const match = flightData.callsign.match(/^([A-Z]+)(\d+)$/);
      if (match) {
        const [, airline, number] = match;
        const airlineMap: Record<string, string> = {
          'AAL': 'American',
          'DAL': 'Delta',
          'UAL': 'United',
          'SWA': 'Southwest',
          'JBU': 'JetBlue',
          'ASA': 'Alaska',
        };
        return {
          airline: airlineMap[airline] || airline,
          flightNumber: `${airline}${number}`,
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

        {/* Phase timeline */}
        <div className="mt-4">
          <div className="flex justify-between text-[10px] text-slate-400 uppercase tracking-[0.2em]">
            {["Gate", "Taxi", "Takeoff", "Climb", "Cruise", "Descent", "Landing"].map(
              p => {
                const isCurrent = p.toLowerCase() === phase.toLowerCase();
                return (
                  <span
                    key={p}
                    className={
                      "flex-1 text-center transition-colors duration-200 " +
                      (isCurrent ? "text-sky-400 font-semibold" : "")
                    }
                  >
                    {p}
                  </span>
                );
              }
            )}
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
              {arrivalTime}
            </p>
          </div>
        </div>

        {/* Summary status */}
        <div className="mt-3 text-sm text-gray-300">
          {getTurbulenceSummary()}
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
                  {turbulenceData ? (
                    <>
                      {/* Current Assessment */}
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
                    <div className="space-y-3 text-sm text-gray-200">
                      <div>
                        <div className="text-xs font-semibold tracking-wide text-gray-400">
                          WHAT YOU'RE NOTICING
                        </div>
                        <p>
                          The bumps feel bigger than they probably are, and your stomach does tiny
                          "drop" sensations when the air changes.
                        </p>
                      </div>

                      <div>
                        <div className="text-xs font-semibold tracking-wide text-gray-400">
                          WHY THIS EXISTS
                        </div>
                        <p>
                          The jet is moving through different layers of air speed and temperature.
                          The wings are designed to flex and absorb that energy instead of fighting it.
                        </p>
                      </div>

                      <div>
                        <div className="text-xs font-semibold tracking-wide text-gray-400">
                          IF THIS PART MISBEHAVED
                        </div>
                        <p>
                          If anything about the aircraft's response wasn't normal, the pilots would
                          see it in their instruments long before you could feel it. They also have
                          strict speed limits and routes for rough air, which they're already following.
                        </p>
                      </div>
                    </div>
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
                  <div className="bg-white/[0.03] rounded-lg p-3">
                    <h4 className="text-sm font-medium text-sky-400 mb-2">{pilotActivity.title}</h4>
                    <ul className="space-y-2">
                      {pilotActivity.lines.map((line, idx) => (
                        <li key={idx} className="flex gap-2 text-sm text-slate-300">
                          <span className="text-sky-400">•</span>
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <div className="text-xs font-semibold tracking-[0.2em] uppercase text-sky-400 mb-3">
                        What they're actually doing
                      </div>
                      <ul className="space-y-2.5 text-slate-200 text-sm leading-relaxed">
                        <li className="flex gap-2"><span className="text-sky-400">•</span> Monitoring the autopilot and flight path, not hand-flying the whole time.</li>
                        <li className="flex gap-2"><span className="text-sky-400">•</span> Talking with ATC, watching the weather ahead, and planning the next phase.</li>
                        <li className="flex gap-2"><span className="text-sky-400">•</span> Cross-checking instruments and system messages, most of which are boringly normal.</li>
                        <li className="flex gap-2"><span className="text-sky-400">•</span> Staying ahead of the airplane with checklists and briefings instead of reacting last-second.</li>
                      </ul>
                    </div>

                    <div>
                      <div className="text-xs font-semibold tracking-[0.2em] uppercase text-sky-400 mb-3">
                        What a frightened mind imagines
                      </div>
                      <ul className="space-y-2.5 text-slate-300/80 text-sm leading-relaxed">
                        <li className="flex gap-2"><span className="text-slate-500">•</span> White-knuckle "steering" the jet every second to keep it from falling.</li>
                        <li className="flex gap-2"><span className="text-slate-500">•</span> Fighting the turbulence like it's a storm in a movie.</li>
                        <li className="flex gap-2"><span className="text-slate-500">•</span> Hoping nothing breaks because there's no backup plan.</li>
                        <li className="flex gap-2"><span className="text-slate-500">•</span> Being surprised by every sound or motion instead of expecting them.</li>
                      </ul>
                    </div>
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