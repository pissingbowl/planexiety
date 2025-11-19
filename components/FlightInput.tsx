// components/FlightInput.tsx
"use client";

import { useState, useEffect } from "react";
import { searchFlight, AIRPORTS, type FlightData } from "@/lib/api/flightTracking";

interface FlightInputProps {
  onFlightSelect: (flight: FlightData, departure: string, arrival: string) => void;
  initialFlightNumber?: string;
  initialDeparture?: string;
  initialArrival?: string;
}

export function FlightInput({ 
  onFlightSelect, 
  initialFlightNumber = "",
  initialDeparture = "",
  initialArrival = "" 
}: FlightInputProps) {
  const [flightNumber, setFlightNumber] = useState(initialFlightNumber);
  const [departure, setDeparture] = useState(initialDeparture);
  const [arrival, setArrival] = useState(initialArrival);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Popular routes for quick selection
  const popularRoutes = [
    { flight: "UA1234", from: "ORD", to: "LAX" },
    { flight: "AA2345", from: "JFK", to: "LAX" },
    { flight: "DL987", from: "ATL", to: "SEA" },
    { flight: "WN456", from: "DEN", to: "PHX" },
  ];
  
  // Load saved flight from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('otie_flight');
    if (saved) {
      try {
        const { flight, departure, arrival } = JSON.parse(saved);
        if (flight && departure && arrival) {
          setFlightNumber(flight);
          setDeparture(departure);
          setArrival(arrival);
          // Auto-search for the saved flight
          handleSearch(flight, departure, arrival);
        }
      } catch (e) {
        console.error('Error loading saved flight:', e);
      }
    }
  }, []);
  
  const handleSearch = async (
    flightNum: string = flightNumber, 
    dep: string = departure, 
    arr: string = arrival
  ) => {
    // Validate inputs
    if (!flightNum || !dep || !arr) {
      setError("Please enter flight number and both airport codes");
      return;
    }
    
    if (!AIRPORTS[dep.toUpperCase()]) {
      setError(`Unknown departure airport: ${dep}`);
      return;
    }
    
    if (!AIRPORTS[arr.toUpperCase()]) {
      setError(`Unknown arrival airport: ${arr}`);
      return;
    }
    
    setSearching(true);
    setError(null);
    setSuccess(false);
    
    try {
      const flightData = await searchFlight(flightNum);
      
      if (flightData) {
        // Save to localStorage
        localStorage.setItem('otie_flight', JSON.stringify({
          flight: flightNum,
          departure: dep.toUpperCase(),
          arrival: arr.toUpperCase(),
        }));
        
        setSuccess(true);
        onFlightSelect(flightData, dep.toUpperCase(), arr.toUpperCase());
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } else {
        // If real flight not found, use simulated data
        setError(`Flight ${flightNum} not found. Using simulated data.`);
        
        // Create simulated flight data
        const simulatedFlight: FlightData = {
          icao24: `SIM${Date.now()}`,
          callsign: flightNum.toUpperCase(),
          origin_country: "United States",
          time_position: Date.now() / 1000,
          last_contact: Date.now() / 1000,
          longitude: -100, // Somewhere over central US
          latitude: 40,
          baro_altitude: 10668, // ~35000 ft
          on_ground: false,
          velocity: 240, // ~465 kts
          true_track: 270, // Westbound
          vertical_rate: 0,
          geo_altitude: 10668,
          squawk: "1234",
          category: 0,
        };
        
        // Save to localStorage even for simulated
        localStorage.setItem('otie_flight', JSON.stringify({
          flight: flightNum,
          departure: dep.toUpperCase(),
          arrival: arr.toUpperCase(),
        }));
        
        onFlightSelect(simulatedFlight, dep.toUpperCase(), arr.toUpperCase());
      }
    } catch (err) {
      console.error('Search error:', err);
      setError("Error searching for flight. Please try again.");
    } finally {
      setSearching(false);
    }
  };
  
  const handleQuickSelect = (route: typeof popularRoutes[0]) => {
    setFlightNumber(route.flight);
    setDeparture(route.from);
    setArrival(route.to);
    handleSearch(route.flight, route.from, route.to);
  };
  
  const handleClearFlight = () => {
    localStorage.removeItem('otie_flight');
    setFlightNumber("");
    setDeparture("");
    setArrival("");
    setError(null);
    setSuccess(false);
  };
  
  return (
    <div className="w-full max-w-2xl mx-auto mb-6">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/2 p-4 shadow-[0_10px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-400">
            Track Your Flight
          </h3>
          {(flightNumber || departure || arrival) && (
            <button
              onClick={handleClearFlight}
              className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Flight # (UA1234)"
            value={flightNumber}
            onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
            className="px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
          />
          
          <input
            type="text"
            placeholder="From (ORD)"
            value={departure}
            onChange={(e) => setDeparture(e.target.value.toUpperCase())}
            maxLength={3}
            className="px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
          />
          
          <input
            type="text"
            placeholder="To (LAX)"
            value={arrival}
            onChange={(e) => setArrival(e.target.value.toUpperCase())}
            maxLength={3}
            className="px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
          />
          
          <button
            onClick={() => handleSearch()}
            disabled={searching}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            {searching ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Searching...
              </span>
            ) : (
              "Track Flight"
            )}
          </button>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="mt-3 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}
        
        {/* Success message */}
        {success && (
          <div className="mt-3 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <p className="text-xs text-emerald-400">✓ Flight found and tracking started!</p>
          </div>
        )}
        
        {/* Quick select popular routes */}
        <div className="mt-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
            Popular Routes (Demo)
          </p>
          <div className="flex flex-wrap gap-2">
            {popularRoutes.map((route) => (
              <button
                key={route.flight}
                onClick={() => handleQuickSelect(route)}
                className="px-3 py-1 text-xs bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-slate-600 rounded-full text-slate-300 hover:text-white transition-all duration-200"
              >
                {route.flight} ({route.from}→{route.to})
              </button>
            ))}
          </div>
        </div>
        
        {/* Supported airports hint */}
        <div className="mt-3 text-[10px] text-slate-500">
          <details className="cursor-pointer">
            <summary className="hover:text-slate-400 transition-colors">
              Supported airports ({Object.keys(AIRPORTS).length})
            </summary>
            <div className="mt-2 grid grid-cols-6 gap-1 text-slate-400">
              {Object.keys(AIRPORTS).map(code => (
                <span key={code} className="font-mono">{code}</span>
              ))}
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}