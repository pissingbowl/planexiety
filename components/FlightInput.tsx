// components/FlightInput.tsx
"use client";

import { useState, useEffect } from "react";
import { searchFlightWithRoute, AIRPORTS, type FlightData } from "@/lib/api/flightTracking";

interface FlightInputProps {
  onFlightSelect: (flight: FlightData, departure: string, arrival: string, airline: string, flightNumber: string) => void;
  initialFlightNumber?: string;
  initialDeparture?: string;
  initialArrival?: string;
}

// Major US airlines with IATA codes
const AIRLINES = [
  { code: "UA", name: "United Airlines" },
  { code: "AA", name: "American Airlines" },
  { code: "DL", name: "Delta Air Lines" },
  { code: "WN", name: "Southwest Airlines" },
  { code: "B6", name: "JetBlue Airways" },
  { code: "AS", name: "Alaska Airlines" },
  { code: "NK", name: "Spirit Airlines" },
  { code: "F9", name: "Frontier Airlines" },
  { code: "HA", name: "Hawaiian Airlines" },
];

// Demo flights with predefined routes
const DEMO_FLIGHTS = [
  { airline: "UA", number: "1234", from: "ORD", to: "LAX", display: "UA1234 (Chicago → Los Angeles)" },
  { airline: "AA", number: "2345", from: "JFK", to: "LAX", display: "AA2345 (New York → Los Angeles)" },
  { airline: "DL", number: "987", from: "ATL", to: "SEA", display: "DL987 (Atlanta → Seattle)" },
  { airline: "WN", number: "456", from: "DEN", to: "PHX", display: "WN456 (Denver → Phoenix)" },
  { airline: "B6", number: "789", from: "BOS", to: "MCO", display: "B6789 (Boston → Orlando)" },
  { airline: "AS", number: "123", from: "SEA", to: "SFO", display: "AS123 (Seattle → San Francisco)" },
];

export function FlightInput({ 
  onFlightSelect, 
  initialFlightNumber = "",
  initialDeparture = "",
  initialArrival = "" 
}: FlightInputProps) {
  const [selectedAirline, setSelectedAirline] = useState<string>("");
  const [flightNumber, setFlightNumber] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [detectedRoute, setDetectedRoute] = useState<{ from: string; to: string } | null>(null);
  
  // Load saved flight from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('otie_flight');
    if (saved) {
      try {
        const savedData = JSON.parse(saved);
        
        // Handle both old and new formats
        if (savedData.airline && savedData.flightNumber) {
          // New format
          setSelectedAirline(savedData.airline);
          setFlightNumber(savedData.flightNumber);
          if (savedData.departure && savedData.arrival) {
            setDetectedRoute({ from: savedData.departure, to: savedData.arrival });
          }
        } else if (savedData.flight) {
          // Old format - try to parse it
          const match = savedData.flight.match(/^([A-Z]{2})(\d+)$/);
          if (match) {
            setSelectedAirline(match[1]);
            setFlightNumber(match[2]);
            if (savedData.departure && savedData.arrival) {
              setDetectedRoute({ from: savedData.departure, to: savedData.arrival });
            }
          }
        }
      } catch (e) {
        console.error('Error loading saved flight:', e);
      }
    }
    
    // If we have initial values from props, parse them
    if (initialFlightNumber) {
      const match = initialFlightNumber.match(/^([A-Z]{2})(\d+)$/);
      if (match) {
        setSelectedAirline(match[1]);
        setFlightNumber(match[2]);
      }
    }
    if (initialDeparture && initialArrival) {
      setDetectedRoute({ from: initialDeparture, to: initialArrival });
    }
  }, [initialFlightNumber, initialDeparture, initialArrival]);
  
  const handleSearch = async () => {
    // Validate inputs
    if (!selectedAirline) {
      setError("Please select an airline");
      return;
    }
    
    if (!flightNumber) {
      setError("Please enter a flight number");
      return;
    }
    
    // Only allow numeric flight numbers
    if (!/^\d+$/.test(flightNumber)) {
      setError("Flight number should only contain digits (e.g., 1234)");
      return;
    }
    
    setSearching(true);
    setError(null);
    setSuccess(false);
    setDetectedRoute(null);
    
    try {
      const fullFlightNumber = `${selectedAirline}${flightNumber}`;
      const result = await searchFlightWithRoute(fullFlightNumber);
      
      if (result) {
        const { flightData, departure, arrival } = result;
        
        // Save to localStorage in new format
        localStorage.setItem('otie_flight', JSON.stringify({
          airline: selectedAirline,
          flightNumber: flightNumber,
          departure: departure,
          arrival: arrival,
          fullFlight: fullFlightNumber,
        }));
        
        setDetectedRoute({ from: departure, to: arrival });
        setSuccess(true);
        onFlightSelect(flightData, departure, arrival, selectedAirline, flightNumber);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(`Could not find flight ${fullFlightNumber} or detect its route. Please try another flight.`);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError("Error searching for flight. Please try again.");
    } finally {
      setSearching(false);
    }
  };
  
  const handleQuickSelect = (demo: typeof DEMO_FLIGHTS[0]) => {
    setSelectedAirline(demo.airline);
    setFlightNumber(demo.number);
    // Trigger search immediately after setting values
    setTimeout(() => {
      const searchButton = document.querySelector('[data-search-button]') as HTMLButtonElement;
      if (searchButton) {
        searchButton.click();
      }
    }, 100);
  };
  
  const handleClearFlight = () => {
    localStorage.removeItem('otie_flight');
    setSelectedAirline("");
    setFlightNumber("");
    setDetectedRoute(null);
    setError(null);
    setSuccess(false);
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !searching) {
      handleSearch();
    }
  };
  
  return (
    <div className="w-full max-w-2xl mx-auto mb-6">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/2 p-4 shadow-[0_10px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-400">
            Track Your Flight
          </h3>
          {(selectedAirline || flightNumber) && (
            <button
              onClick={handleClearFlight}
              className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        
        {/* Simplified inputs: Airline dropdown + Flight number */}
        <div className="grid grid-cols-1 sm:grid-cols-[200px,1fr,auto] gap-3">
          {/* Airline Dropdown */}
          <select
            value={selectedAirline}
            onChange={(e) => setSelectedAirline(e.target.value)}
            className="px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all cursor-pointer"
          >
            <option value="" className="bg-slate-900 text-slate-400">
              Select Airline
            </option>
            {AIRLINES.map((airline) => (
              <option 
                key={airline.code} 
                value={airline.code}
                className="bg-slate-900"
              >
                {airline.name} ({airline.code})
              </option>
            ))}
          </select>
          
          {/* Flight Number Input */}
          <input
            type="text"
            placeholder="Flight number (e.g., 1234)"
            value={flightNumber}
            onChange={(e) => setFlightNumber(e.target.value.replace(/\D/g, ''))}
            onKeyPress={handleKeyPress}
            maxLength={5}
            className="px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
          />
          
          {/* Track Button */}
          <button
            onClick={handleSearch}
            disabled={searching}
            data-search-button
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
        
        {/* Detected route display */}
        {detectedRoute && (
          <div className="mt-3 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg">
            <p className="text-xs text-slate-400">
              Route detected: 
              <span className="text-white ml-2 font-medium">
                {AIRPORTS[detectedRoute.from]?.name || detectedRoute.from} → {AIRPORTS[detectedRoute.to]?.name || detectedRoute.to}
              </span>
            </p>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="mt-3 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}
        
        {/* Success message */}
        {success && (
          <div className="mt-3 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <p className="text-xs text-emerald-400">
              ✓ Flight {selectedAirline}{flightNumber} found and tracking started!
            </p>
          </div>
        )}
        
        {/* Demo flights for quick selection */}
        <div className="mt-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
            Popular Flights (Demo)
          </p>
          <div className="flex flex-wrap gap-2">
            {DEMO_FLIGHTS.map((demo) => (
              <button
                key={`${demo.airline}${demo.number}`}
                onClick={() => handleQuickSelect(demo)}
                className="px-3 py-1 text-xs bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-slate-600 rounded-full text-slate-300 hover:text-white transition-all duration-200"
              >
                {demo.display}
              </button>
            ))}
          </div>
        </div>
        
        {/* Help text */}
        <div className="mt-3 text-[10px] text-slate-500">
          <p>
            Simply select an airline and enter the flight number. We'll automatically detect the route!
          </p>
        </div>
      </div>
    </div>
  );
}