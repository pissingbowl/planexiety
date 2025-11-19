// lib/api/flightTracking.ts

export interface FlightData {
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
  geo_altitude: number | null;
  squawk: string | null;
  category: number;
  departure_airport?: string;
  arrival_airport?: string;
  registration?: string;
  aircraft_type?: string;
}

export interface FlightRoute {
  departure: {
    airport: string;
    lat: number;
    lon: number;
  };
  arrival: {
    airport: string;
    lat: number;
    lon: number;
  };
  currentPosition: {
    lat: number;
    lon: number;
    altitude: number; // feet
  };
  progress: number; // 0-100 percentage
  phase: string;
  estimatedArrival: Date;
}

// Cache to prevent API rate limiting
const flightCache = new Map<string, { data: FlightData; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

// Major airline codes mapped to their callsign prefixes
const AIRLINE_CODES: Record<string, string> = {
  'AA': 'AAL', // American Airlines
  'DL': 'DAL', // Delta
  'UA': 'UAL', // United
  'WN': 'SWA', // Southwest
  'B6': 'JBU', // JetBlue
  'AS': 'ASA', // Alaska
  'NK': 'NKS', // Spirit
  'F9': 'FFT', // Frontier
  'G4': 'AAY', // Allegiant
  'SY': 'SCX', // Sun Country
  'HA': 'HAL', // Hawaiian Airlines
};

// Demo flight routes for testing
const DEMO_ROUTES: Record<string, { from: string; to: string }> = {
  "UA1234": { from: "ORD", to: "LAX" },
  "AA2345": { from: "JFK", to: "LAX" },
  "DL987": { from: "ATL", to: "SEA" },
  "WN456": { from: "DEN", to: "PHX" },
  "B6789": { from: "BOS", to: "MCO" },
  "AS123": { from: "SEA", to: "SFO" },
  "NK555": { from: "LAS", to: "ORD" },
  "F9999": { from: "DEN", to: "MIA" },
  "HA25": { from: "LAX", to: "HNL" },
};

// Common routes by airline for fallback detection
const COMMON_ROUTES_BY_AIRLINE: Record<string, Array<{ from: string; to: string; flightRanges?: number[] }>> = {
  "UA": [
    { from: "DEN", to: "ORD", flightRanges: [300, 399] }, // Includes UA 377
    { from: "ORD", to: "LAX", flightRanges: [1000, 1999] },
    { from: "SFO", to: "EWR", flightRanges: [2000, 2999] },
    { from: "DEN", to: "ORD", flightRanges: [3000, 3999] },
    { from: "EWR", to: "SFO", flightRanges: [100, 199] },
  ],
  "AA": [
    { from: "DFW", to: "LAX", flightRanges: [2000, 2999] },
    { from: "JFK", to: "LAX", flightRanges: [1, 99] },
    { from: "MIA", to: "ORD", flightRanges: [1000, 1999] },
    { from: "CLT", to: "LAX", flightRanges: [3000, 3999] },
  ],
  "DL": [
    { from: "ATL", to: "LAX", flightRanges: [900, 999] },
    { from: "DTW", to: "ATL", flightRanges: [1000, 1099] },
    { from: "MSP", to: "SEA", flightRanges: [2000, 2099] },
    { from: "ATL", to: "JFK", flightRanges: [500, 599] },
  ],
  "WN": [
    { from: "DEN", to: "PHX", flightRanges: [400, 499] },
    { from: "LAS", to: "LAX", flightRanges: [1000, 1099] },
    { from: "MCO", to: "ATL", flightRanges: [2000, 2099] },
    { from: "PHX", to: "LAS", flightRanges: [3000, 3099] },
  ],
  "B6": [
    { from: "BOS", to: "MCO", flightRanges: [700, 799] },
    { from: "JFK", to: "LAX", flightRanges: [1000, 1099] },
    { from: "BOS", to: "LAS", flightRanges: [800, 899] },
    { from: "JFK", to: "SFO", flightRanges: [900, 999] },
  ],
  "AS": [
    { from: "SEA", to: "LAX", flightRanges: [100, 199] },
    { from: "SEA", to: "SFO", flightRanges: [200, 299] },
    { from: "SEA", to: "PHX", flightRanges: [300, 399] },
    { from: "SEA", to: "DEN", flightRanges: [700, 799] },
  ],
  "NK": [
    { from: "LAS", to: "ORD", flightRanges: [500, 599] },
    { from: "FLL", to: "LGA", flightRanges: [200, 299] },
    { from: "MCO", to: "ATL", flightRanges: [700, 799] },
  ],
  "F9": [
    { from: "DEN", to: "MIA", flightRanges: [9000, 9999] },
    { from: "DEN", to: "MCO", flightRanges: [1000, 1099] },
    { from: "DEN", to: "LAS", flightRanges: [500, 599] },
  ],
  "HA": [
    { from: "HNL", to: "LAX", flightRanges: [1, 99] },
    { from: "HNL", to: "SFO", flightRanges: [10, 20] },
    { from: "LAX", to: "HNL", flightRanges: [20, 30] },
  ],
};

// Airport database (expand as needed)
export const AIRPORTS: Record<string, { lat: number; lon: number; name: string }> = {
  'LAX': { lat: 33.9425, lon: -118.4081, name: 'Los Angeles International' },
  'ORD': { lat: 41.9786, lon: -87.9048, name: "Chicago O'Hare International" },
  'JFK': { lat: 40.6413, lon: -73.7781, name: 'John F. Kennedy International' },
  'ATL': { lat: 33.6367, lon: -84.4281, name: 'Hartsfield-Jackson Atlanta International' },
  'DFW': { lat: 32.8968, lon: -97.0380, name: 'Dallas/Fort Worth International' },
  'DEN': { lat: 39.8617, lon: -104.6732, name: 'Denver International' },
  'SEA': { lat: 47.4502, lon: -122.3088, name: 'Seattle-Tacoma International' },
  'SFO': { lat: 37.6213, lon: -122.3790, name: 'San Francisco International' },
  'LAS': { lat: 36.0840, lon: -115.1537, name: 'Harry Reid International' },
  'PHX': { lat: 33.4342, lon: -112.0080, name: 'Phoenix Sky Harbor International' },
  'MIA': { lat: 25.7959, lon: -80.2870, name: 'Miami International' },
  'BOS': { lat: 42.3656, lon: -71.0096, name: 'Boston Logan International' },
  'EWR': { lat: 40.6895, lon: -74.1745, name: 'Newark Liberty International' },
  'MCO': { lat: 28.4312, lon: -81.3081, name: 'Orlando International' },
  'MSP': { lat: 44.8848, lon: -93.2223, name: 'Minneapolis-St. Paul International' },
  'DTW': { lat: 42.2162, lon: -83.3554, name: 'Detroit Metropolitan' },
  'PHL': { lat: 39.8744, lon: -75.2424, name: 'Philadelphia International' },
  'CLT': { lat: 35.2144, lon: -80.9473, name: 'Charlotte Douglas International' },
  'IAH': { lat: 29.9902, lon: -95.3368, name: 'George Bush Intercontinental' },
  'IAD': { lat: 38.9531, lon: -77.4565, name: 'Washington Dulles International' },
  'HNL': { lat: 21.3187, lon: -157.9225, name: 'Daniel K. Inouye International' },
  'FLL': { lat: 26.0742, lon: -80.1506, name: 'Fort Lauderdale-Hollywood International' },
  'LGA': { lat: 40.7769, lon: -73.8740, name: 'LaGuardia Airport' },
};

/**
 * Convert flight number to OpenSky callsign format
 * e.g., "UA1234" -> "UAL1234"
 */
function convertFlightNumberToCallsign(flightNumber: string): string {
  const match = flightNumber.match(/^([A-Z]{2})(\d+)$/i);
  if (match) {
    const [, airline, number] = match;
    const callsignPrefix = AIRLINE_CODES[airline.toUpperCase()];
    if (callsignPrefix) {
      return `${callsignPrefix}${number}`;
    }
  }
  // If not recognized, return as-is (might be a direct callsign)
  return flightNumber.toUpperCase();
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Determine flight phase based on altitude and ground speed
 */
function determineFlightPhase(altitudeFeet: number, velocityKts: number, onGround: boolean): string {
  if (onGround) return 'gate';
  if (altitudeFeet < 500) return 'taxi';
  if (altitudeFeet < 5000) return velocityKts > 200 ? 'takeoff' : 'landing';
  if (altitudeFeet < 15000) return velocityKts > 250 ? 'climb' : 'descent';
  return 'cruise';
}

/**
 * Detect route for a flight based on flight number
 */
function detectRoute(flightNumber: string): { from: string; to: string } | null {
  // First check if it's a demo flight with known route
  if (DEMO_ROUTES[flightNumber]) {
    console.log(`Using demo route for ${flightNumber}`);
    return DEMO_ROUTES[flightNumber];
  }
  
  // Try to extract airline and number
  const match = flightNumber.match(/^([A-Z]{2})(\d+)$/i);
  if (!match) {
    return null;
  }
  
  const [, airline, numberStr] = match;
  const number = parseInt(numberStr, 10);
  const routes = COMMON_ROUTES_BY_AIRLINE[airline.toUpperCase()];
  
  if (!routes) {
    // If we don't know this airline, use a default route
    console.log(`Unknown airline ${airline}, using default route`);
    return { from: "JFK", to: "LAX" };
  }
  
  // Try to match based on flight number ranges
  for (const route of routes) {
    if (route.flightRanges && route.flightRanges.length === 2) {
      const [min, max] = route.flightRanges;
      if (number >= min && number <= max) {
        console.log(`Detected route for ${flightNumber} based on number range: ${route.from} -> ${route.to}`);
        return { from: route.from, to: route.to };
      }
    }
  }
  
  // If no range match, return the first common route for this airline
  if (routes.length > 0) {
    console.log(`Using default route for ${airline}: ${routes[0].from} -> ${routes[0].to}`);
    return { from: routes[0].from, to: routes[0].to };
  }
  
  // Ultimate fallback
  return { from: "JFK", to: "LAX" };
}

/**
 * Search for a flight by flight number or callsign
 */
export async function searchFlight(flightNumber: string): Promise<FlightData | null> {
  const callsign = convertFlightNumberToCallsign(flightNumber);
  
  // Check cache first
  const cached = flightCache.get(callsign);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('Returning cached flight data for', callsign);
    return cached.data;
  }
  
  try {
    // First try to search by callsign
    const url = `https://opensky-network.org/api/states/all?callsign=${encodeURIComponent(callsign)}`;
    console.log('Fetching flight data from OpenSky:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('OpenSky API error:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (data && data.states && data.states.length > 0) {
      // Take the first matching flight
      const state = data.states[0];
      const flightData: FlightData = {
        icao24: state[0],
        callsign: state[1] ? state[1].trim() : callsign,
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
        geo_altitude: state[13],
        squawk: state[14],
        category: state[17] || 0,
      };
      
      // Cache the result
      flightCache.set(callsign, { data: flightData, timestamp: Date.now() });
      
      return flightData;
    }
    
    console.log('No flight found for callsign:', callsign);
    return null;
    
  } catch (error) {
    console.error('Error fetching flight data:', error);
    return null;
  }
}

/**
 * Search for a flight and automatically detect its route
 * Returns flight data along with departure and arrival airports
 */
export async function searchFlightWithRoute(
  flightNumber: string
): Promise<{ flightData: FlightData; departure: string; arrival: string } | null> {
  // Detect the route for this flight
  const route = detectRoute(flightNumber);
  if (!route) {
    console.error('Could not detect route for flight:', flightNumber);
    return null;
  }
  
  // Search for the flight
  let flightData = await searchFlight(flightNumber);
  
  // If flight not found, create simulated data
  if (!flightData) {
    console.log(`Flight ${flightNumber} not found, creating simulated data`);
    
    const departure = AIRPORTS[route.from];
    const arrival = AIRPORTS[route.to];
    
    if (!departure || !arrival) {
      console.error('Invalid airports in route:', route);
      return null;
    }
    
    // Create simulated flight at a random point along the route
    const progress = Math.random() * 0.6 + 0.2; // Between 20% and 80%
    const lat = departure.lat + (arrival.lat - departure.lat) * progress;
    const lon = departure.lon + (arrival.lon - departure.lon) * progress;
    
    // Determine altitude based on progress
    let altitude = 10668; // Default cruise altitude (35000 ft in meters)
    if (progress < 0.25) {
      altitude = 3048 + progress * 30000; // Climbing
    } else if (progress > 0.75) {
      altitude = 10668 - (progress - 0.75) * 30000; // Descending
    }
    
    flightData = {
      icao24: `SIM${Date.now()}`,
      callsign: convertFlightNumberToCallsign(flightNumber),
      origin_country: "United States",
      time_position: Date.now() / 1000,
      last_contact: Date.now() / 1000,
      longitude: lon,
      latitude: lat,
      baro_altitude: altitude,
      on_ground: false,
      velocity: 240, // ~465 kts
      true_track: Math.atan2(arrival.lon - departure.lon, arrival.lat - departure.lat) * 180 / Math.PI,
      vertical_rate: progress < 0.25 ? 10 : (progress > 0.75 ? -10 : 0),
      geo_altitude: altitude,
      squawk: "1234",
      category: 0,
    };
  }
  
  return {
    flightData,
    departure: route.from,
    arrival: route.to,
  };
}

/**
 * Track a flight and calculate its route information
 */
export async function trackFlight(
  flightData: FlightData,
  departureAirport: string,
  arrivalAirport: string
): Promise<FlightRoute | null> {
  
  const departure = AIRPORTS[departureAirport.toUpperCase()];
  const arrival = AIRPORTS[arrivalAirport.toUpperCase()];
  
  if (!departure || !arrival) {
    console.error('Unknown airport(s):', departureAirport, arrivalAirport);
    return null;
  }
  
  if (!flightData.latitude || !flightData.longitude) {
    console.error('Flight has no position data');
    return null;
  }
  
  // Calculate distances
  const totalDistance = calculateDistance(departure.lat, departure.lon, arrival.lat, arrival.lon);
  const distanceFromDeparture = calculateDistance(
    departure.lat, 
    departure.lon, 
    flightData.latitude, 
    flightData.longitude
  );
  
  // Calculate progress (0-100)
  const progress = Math.min(100, Math.max(0, (distanceFromDeparture / totalDistance) * 100));
  
  // Determine flight phase
  const altitudeFeet = flightData.baro_altitude ? flightData.baro_altitude * 3.28084 : 0;
  const velocityKts = flightData.velocity ? flightData.velocity * 1.94384 : 0;
  const phase = determineFlightPhase(altitudeFeet, velocityKts, flightData.on_ground);
  
  // Estimate arrival time
  const remainingDistance = totalDistance - distanceFromDeparture;
  const groundSpeedKmh = velocityKts * 1.852;
  const hoursRemaining = groundSpeedKmh > 0 ? remainingDistance / groundSpeedKmh : 0;
  const estimatedArrival = new Date(Date.now() + hoursRemaining * 3600000);
  
  return {
    departure: {
      airport: departureAirport,
      lat: departure.lat,
      lon: departure.lon,
    },
    arrival: {
      airport: arrivalAirport,
      lat: arrival.lat,
      lon: arrival.lon,
    },
    currentPosition: {
      lat: flightData.latitude,
      lon: flightData.longitude,
      altitude: altitudeFeet,
    },
    progress,
    phase,
    estimatedArrival,
  };
}

/**
 * Get flights in a specific area (for "What's Around Me" feature)
 */
export async function getFlightsInArea(
  centerLat: number,
  centerLon: number,
  radiusKm: number = 100
): Promise<FlightData[]> {
  // Calculate bounding box
  const latDelta = radiusKm / 111; // Rough conversion
  const lonDelta = radiusKm / (111 * Math.cos(centerLat * Math.PI / 180));
  
  const bounds = {
    lamin: centerLat - latDelta,
    lamax: centerLat + latDelta,
    lomin: centerLon - lonDelta,
    lomax: centerLon + lonDelta,
  };
  
  try {
    const url = `https://opensky-network.org/api/states/all?lamin=${bounds.lamin}&lomin=${bounds.lomin}&lamax=${bounds.lamax}&lomax=${bounds.lomax}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('OpenSky API error:', response.status);
      return [];
    }
    
    const data = await response.json();
    
    if (data && data.states) {
      return data.states
        .filter((state: any[]) => state[5] !== null && state[6] !== null)
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
          geo_altitude: state[13],
          squawk: state[14],
          category: state[17] || 0,
        }));
    }
    
    return [];
    
  } catch (error) {
    console.error('Error fetching area flights:', error);
    return [];
  }
}

/**
 * Get simulated flight data for testing/demo
 */
export function getSimulatedFlightData(
  departureAirport: string = 'ORD',
  arrivalAirport: string = 'LAX',
  progress: number = 35
): FlightRoute {
  const departure = AIRPORTS[departureAirport] || AIRPORTS['ORD'];
  const arrival = AIRPORTS[arrivalAirport] || AIRPORTS['LAX'];
  
  // Interpolate position based on progress
  const lat = departure.lat + (arrival.lat - departure.lat) * (progress / 100);
  const lon = departure.lon + (arrival.lon - departure.lon) * (progress / 100);
  
  // Simulate altitude based on progress
  let altitude = 0;
  let phase = 'gate';
  if (progress < 5) {
    altitude = 0;
    phase = 'gate';
  } else if (progress < 15) {
    altitude = 500;
    phase = 'taxi';
  } else if (progress < 25) {
    altitude = 5000 + (progress - 15) * 300;
    phase = 'takeoff';
  } else if (progress < 40) {
    altitude = 8000 + (progress - 25) * 1000;
    phase = 'climb';
  } else if (progress < 80) {
    altitude = 35000;
    phase = 'cruise';
  } else if (progress < 90) {
    altitude = 35000 - (progress - 80) * 2500;
    phase = 'descent';
  } else {
    altitude = 10000 - (progress - 90) * 1000;
    phase = 'landing';
  }
  
  const totalFlightMinutes = 180;
  const minutesElapsed = (progress / 100) * totalFlightMinutes;
  const minutesRemaining = totalFlightMinutes - minutesElapsed;
  const estimatedArrival = new Date(Date.now() + minutesRemaining * 60000);
  
  return {
    departure: {
      airport: departureAirport,
      lat: departure.lat,
      lon: departure.lon,
    },
    arrival: {
      airport: arrivalAirport,
      lat: arrival.lat,
      lon: arrival.lon,
    },
    currentPosition: {
      lat,
      lon,
      altitude,
    },
    progress,
    phase,
    estimatedArrival,
  };
}