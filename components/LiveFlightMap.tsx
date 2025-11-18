"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";

// Only import Leaflet-dependent components on the client side
const MapContainerWrapper = dynamic(
  () => import("./MapContainerWrapper").then((mod) => mod.MapContainerWrapper),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[500px] flex items-center justify-center bg-slate-950/80 rounded-lg">
        <div className="text-center">
          <div className="animate-pulse text-sky-400 text-sm mb-2">Loading live flights...</div>
          <div className="text-xs text-gray-500">Connecting to radar network</div>
        </div>
      </div>
    )
  }
);

interface Aircraft {
  icao24: string;
  callsign: string;
  origin_country: string;
  time_position: number | null;
  last_contact: number;
  longitude: number | null;
  latitude: number | null;
  baro_altitude: number | null;
  on_ground: boolean;
  velocity: number | null;
  true_track: number | null;
  vertical_rate: number | null;
  sensors: number[] | null;
  geo_altitude: number | null;
  squawk: string | null;
  spi: boolean;
  position_source: number;
  category: number;
}

export default function LiveFlightMap() {
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // USA bounds: roughly lat 24-49, lon -125 to -66
  const USA_BOUNDS = {
    lamin: 24.0,
    lamax: 49.0,
    lomin: -125.0,
    lomax: -66.0,
  };

  const fetchFlights = async () => {
    try {
      // OpenSky Network API - free, no auth required for basic usage
      const url = `https://opensky-network.org/api/states/all?lamin=${USA_BOUNDS.lamin}&lomin=${USA_BOUNDS.lomin}&lamax=${USA_BOUNDS.lamax}&lomax=${USA_BOUNDS.lomax}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.states) {
        const parsedAircraft: Aircraft[] = data.states
          .filter((state: any[]) => state[5] !== null && state[6] !== null) // Filter out aircraft without position
          .map((state: any[]) => ({
            icao24: state[0],
            callsign: state[1] ? state[1].trim() : "N/A",
            origin_country: state[2],
            time_position: state[3],
            last_contact: state[4],
            longitude: state[5],
            latitude: state[6],
            baro_altitude: state[7],
            on_ground: state[8],
            velocity: state[9],
            true_track: state[10],
            vertical_rate: state[11],
            sensors: state[12],
            geo_altitude: state[13],
            squawk: state[14],
            spi: state[15],
            position_source: state[16],
            category: state[17] || 0,
          }));
        
        setAircraft(parsedAircraft);
        setLastUpdate(new Date());
        setError(null);
      }
    } catch (err) {
      console.error("Error fetching flight data:", err);
      setError("Unable to fetch flight data. Using simulated data.");
      // Use simulated data as fallback
      generateSimulatedFlights();
    } finally {
      setLoading(false);
    }
  };

  const generateSimulatedFlights = () => {
    // Generate realistic simulated flights across USA
    const simulatedFlights: Aircraft[] = [];
    const airlines = ["AAL", "DAL", "UAL", "SWA", "JBU", "ASA", "SKW", "NKS"];
    
    for (let i = 0; i < 150; i++) {
      const lat = USA_BOUNDS.lamin + Math.random() * (USA_BOUNDS.lamax - USA_BOUNDS.lamin);
      const lon = USA_BOUNDS.lomin + Math.random() * (USA_BOUNDS.lomax - USA_BOUNDS.lomin);
      const altitude = Math.floor(Math.random() * 12000) + 1000; // 1000-13000 meters
      const heading = Math.random() * 360;
      const speed = Math.floor(Math.random() * 300) + 150; // 150-450 m/s
      
      simulatedFlights.push({
        icao24: `SIM${i.toString().padStart(3, "0")}`,
        callsign: `${airlines[Math.floor(Math.random() * airlines.length)]}${Math.floor(Math.random() * 9000) + 1000}`,
        origin_country: "United States",
        time_position: Date.now() / 1000,
        last_contact: Date.now() / 1000,
        longitude: lon,
        latitude: lat,
        baro_altitude: altitude,
        on_ground: Math.random() < 0.1, // 10% on ground
        velocity: speed,
        true_track: heading,
        vertical_rate: (Math.random() - 0.5) * 10,
        sensors: null,
        geo_altitude: altitude,
        squawk: Math.floor(Math.random() * 7777).toString(),
        spi: false,
        position_source: 0,
        category: 0,
      });
    }
    
    setAircraft(simulatedFlights);
    setLastUpdate(new Date());
  };

  useEffect(() => {
    // Initial fetch
    fetchFlights();
    
    // Update every 30 seconds (OpenSky has rate limits)
    updateIntervalRef.current = setInterval(() => {
      fetchFlights();
    }, 30000);
    
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <div className="absolute top-2 left-2 z-[1000] bg-slate-950/90 backdrop-blur rounded-lg px-3 py-2 text-xs">
        <div className="text-sky-400 font-semibold">
          Live Flights: {aircraft.length}
        </div>
        {lastUpdate && (
          <div className="text-gray-400 text-[10px]">
            Updated: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
        {error && (
          <div className="text-yellow-400 text-[10px] mt-1">
            {error}
          </div>
        )}
      </div>

      <div className="absolute top-2 right-2 z-[1000] bg-slate-950/90 backdrop-blur rounded-lg px-3 py-2 text-[10px] space-y-1">
        <div className="text-sky-300 font-semibold mb-1">Altitude Legend</div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
          <span className="text-gray-300">Ground</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400"></span>
          <span className="text-gray-300">&lt; 10,000 ft</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-yellow-300"></span>
          <span className="text-gray-300">10-20,000 ft</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-400"></span>
          <span className="text-gray-300">20-30,000 ft</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          <span className="text-gray-300">&gt; 30,000 ft</span>
        </div>
      </div>

      <MapContainerWrapper aircraft={aircraft} loading={loading} />
    </div>
  );
}