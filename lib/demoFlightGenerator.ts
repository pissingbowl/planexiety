// lib/demoFlightGenerator.ts

import { AIRPORTS } from './api/flightTracking';

// Airline codes to callsign mapping
const AIRLINE_CODES: Record<string, string> = {
  'AA': 'AAL', 'DL': 'DAL', 'UA': 'UAL', 'WN': 'SWA', 'B6': 'JBU',
  'AS': 'ASA', 'NK': 'NKS', 'F9': 'FFT', 'G4': 'AAY', 'SY': 'SCX',
  'HA': 'HAL', 'BA': 'BAW', 'LH': 'DLH', 'AF': 'AFR', 'KL': 'KLM',
  'EK': 'UAE', 'QF': 'QFA', 'AC': 'ACA', 'VS': 'VIR', 'AZ': 'AZA',
  'IB': 'IBE', 'QR': 'QTR', 'SQ': 'SIA', 'CX': 'CPA', 'JL': 'JAL',
  'NH': 'ANA', 'TK': 'THY', 'EY': 'ETD', 'SV': 'SVA', 'AI': 'AIC',
  'LX': 'SWR', 'OS': 'AUA', 'SK': 'SAS', 'AY': 'FIN', 'TP': 'TAP',
  'U2': 'EZY', 'FR': 'RYR', 'WZ': 'WZZ',
};

// Common airline routes with typical flight times (in minutes)
const AIRLINE_ROUTES: Record<string, Array<{ from: string; to: string; duration: number; flightRanges?: number[] }>> = {
  'UA': [
    { from: 'DEN', to: 'ORD', duration: 150, flightRanges: [300, 699] },
    { from: 'ORD', to: 'LAX', duration: 240, flightRanges: [1000, 1499] },
    { from: 'SFO', to: 'EWR', duration: 330, flightRanges: [400, 499] },
    { from: 'LAX', to: 'JFK', duration: 320, flightRanges: [1, 99] },
    { from: 'DEN', to: 'SFO', duration: 145, flightRanges: [700, 799] },
    { from: 'ORD', to: 'BOS', duration: 165, flightRanges: [1500, 1599] },
  ],
  'DL': [
    { from: 'ATL', to: 'LAX', duration: 270, flightRanges: [100, 199] },
    { from: 'ATL', to: 'SEA', duration: 300, flightRanges: [900, 999] },
    { from: 'JFK', to: 'LAX', duration: 360, flightRanges: [400, 499] },
    { from: 'MSP', to: 'PHX', duration: 200, flightRanges: [700, 799] },
    { from: 'DTW', to: 'ATL', duration: 120, flightRanges: [1000, 1099] },
  ],
  'AA': [
    { from: 'JFK', to: 'LAX', duration: 360, flightRanges: [1, 99] },
    { from: 'DFW', to: 'LAX', duration: 180, flightRanges: [2300, 2399] },
    { from: 'MIA', to: 'ORD', duration: 180, flightRanges: [500, 599] },
    { from: 'CLT', to: 'LAX', duration: 300, flightRanges: [700, 799] },
    { from: 'PHX', to: 'ORD', duration: 210, flightRanges: [1200, 1299] },
  ],
  'WN': [
    { from: 'DEN', to: 'PHX', duration: 110, flightRanges: [400, 499] },
    { from: 'LAS', to: 'LAX', duration: 75, flightRanges: [700, 799] },
    { from: 'MCO', to: 'ATL', duration: 90, flightRanges: [1200, 1299] },
    { from: 'PHX', to: 'LAS', duration: 80, flightRanges: [1000, 1099] },
  ],
  'B6': [
    { from: 'BOS', to: 'MCO', duration: 190, flightRanges: [700, 899] },
    { from: 'JFK', to: 'LAX', duration: 360, flightRanges: [900, 999] },
    { from: 'BOS', to: 'LAS', duration: 330, flightRanges: [100, 199] },
  ],
  'AS': [
    { from: 'SEA', to: 'LAX', duration: 160, flightRanges: [100, 399] },
    { from: 'SEA', to: 'SFO', duration: 120, flightRanges: [400, 499] },
    { from: 'SEA', to: 'PHX', duration: 165, flightRanges: [500, 599] },
  ],
};

// Default routes for unknown airlines
const DEFAULT_ROUTES = [
  { from: 'JFK', to: 'LAX', duration: 360 },
  { from: 'ORD', to: 'DEN', duration: 150 },
  { from: 'ATL', to: 'MIA', duration: 110 },
  { from: 'SFO', to: 'SEA', duration: 120 },
  { from: 'BOS', to: 'DCA', duration: 90 },
];

export interface DemoFlightData {
  icao24: string;
  callsign: string;
  origin_country: string;
  time_position: number;
  last_contact: number;
  longitude: number;
  latitude: number;
  baro_altitude: number | null; // meters
  on_ground: boolean;
  velocity: number | null; // m/s
  true_track: number; // degrees
  vertical_rate: number | null; // m/s
  geo_altitude: number | null; // meters
  squawk: string;
  altitude_ft: number;
  geo_altitude_ft: number;
  velocity_kts: number;
  vertical_rate_fpm: number;
  is_demo: boolean;
  demo_info?: {
    departure: string;
    arrival: string;
    phase: string;
    progress: number;
    estimated_arrival: Date;
    total_duration_minutes: number;
  };
}

/**
 * Generate a unique ICAO24 hex code for demo flights
 */
function generateICAO24(flightNumber: string): string {
  // Generate a consistent but fake ICAO24 based on flight number
  const hash = flightNumber.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hex = (hash * 999983).toString(16).padStart(6, '0').slice(0, 6);
  return `DEMO${hex}`.toLowerCase();
}

/**
 * Convert flight number to callsign
 */
function getCallsign(flightNumber: string): string {
  const match = flightNumber.match(/^([A-Z]{2})(\d+)$/i);
  if (match) {
    const [, airline, number] = match;
    const callsignPrefix = AIRLINE_CODES[airline.toUpperCase()];
    if (callsignPrefix) {
      return `${callsignPrefix}${number}`;
    }
  }
  return flightNumber.toUpperCase();
}

/**
 * Get airline country based on airline code
 */
function getAirlineCountry(airline: string): string {
  const countryMap: Record<string, string> = {
    'AA': 'United States', 'DL': 'United States', 'UA': 'United States',
    'WN': 'United States', 'B6': 'United States', 'AS': 'United States',
    'NK': 'United States', 'F9': 'United States', 'HA': 'United States',
    'BA': 'United Kingdom', 'LH': 'Germany', 'AF': 'France',
    'KL': 'Netherlands', 'EK': 'United Arab Emirates', 'QF': 'Australia',
    'AC': 'Canada', 'JL': 'Japan', 'SQ': 'Singapore',
  };
  return countryMap[airline] || 'United States';
}

/**
 * Calculate great circle bearing between two points
 */
function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
    Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon);
  const bearing = Math.atan2(y, x);
  return (bearing * 180 / Math.PI + 360) % 360;
}

/**
 * Calculate distance between two points in km
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
 * Interpolate position along great circle route
 */
function interpolatePosition(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
  fraction: number
): { lat: number; lon: number } {
  const lat1Rad = lat1 * Math.PI / 180;
  const lon1Rad = lon1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  const lon2Rad = lon2 * Math.PI / 180;

  const d = 2 * Math.asin(Math.sqrt(
    Math.pow(Math.sin((lat2Rad - lat1Rad) / 2), 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.pow(Math.sin((lon2Rad - lon1Rad) / 2), 2)
  ));

  const a = Math.sin((1 - fraction) * d) / Math.sin(d);
  const b = Math.sin(fraction * d) / Math.sin(d);

  const x = a * Math.cos(lat1Rad) * Math.cos(lon1Rad) + b * Math.cos(lat2Rad) * Math.cos(lon2Rad);
  const y = a * Math.cos(lat1Rad) * Math.sin(lon1Rad) + b * Math.cos(lat2Rad) * Math.sin(lon2Rad);
  const z = a * Math.sin(lat1Rad) + b * Math.sin(lat2Rad);

  const lat = Math.atan2(z, Math.sqrt(x * x + y * y)) * 180 / Math.PI;
  const lon = Math.atan2(y, x) * 180 / Math.PI;

  return { lat, lon };
}

/**
 * Get flight phase and altitude based on progress
 */
function getFlightPhase(progress: number, distance: number): {
  phase: string;
  altitude_ft: number;
  velocity_kts: number;
  vertical_rate_fpm: number;
  on_ground: boolean;
} {
  // Calculate phase boundaries based on distance
  const takeoffDist = Math.min(50, distance * 0.05); // 5% or 50km
  const climbDist = Math.min(200, distance * 0.15); // 15% or 200km
  const descentDist = Math.min(200, distance * 0.15); // 15% or 200km
  const landingDist = Math.min(50, distance * 0.05); // 5% or 50km

  const takeoffEnd = takeoffDist / distance * 100;
  const climbEnd = (takeoffDist + climbDist) / distance * 100;
  const descentStart = 100 - (descentDist + landingDist) / distance * 100;
  const landingStart = 100 - landingDist / distance * 100;

  if (progress <= 0) {
    return {
      phase: 'gate',
      altitude_ft: 0,
      velocity_kts: 0,
      vertical_rate_fpm: 0,
      on_ground: true,
    };
  } else if (progress < takeoffEnd) {
    // Takeoff phase
    const takeoffProgress = progress / takeoffEnd;
    return {
      phase: 'takeoff',
      altitude_ft: Math.round(takeoffProgress * 10000),
      velocity_kts: Math.round(150 + takeoffProgress * 100),
      vertical_rate_fpm: 2500,
      on_ground: false,
    };
  } else if (progress < climbEnd) {
    // Climb phase
    const climbProgress = (progress - takeoffEnd) / (climbEnd - takeoffEnd);
    const cruiseAlt = 35000 + Math.random() * 6000; // 35000-41000 ft
    return {
      phase: 'climb',
      altitude_ft: Math.round(10000 + climbProgress * (cruiseAlt - 10000)),
      velocity_kts: Math.round(250 + climbProgress * 230),
      vertical_rate_fpm: Math.round(1800 - climbProgress * 800),
      on_ground: false,
    };
  } else if (progress < descentStart) {
    // Cruise phase
    const cruiseAlt = 35000 + Math.random() * 6000;
    const cruiseSpeed = 450 + Math.random() * 100; // 450-550 kts
    return {
      phase: 'cruise',
      altitude_ft: Math.round(cruiseAlt),
      velocity_kts: Math.round(cruiseSpeed),
      vertical_rate_fpm: Math.round(-50 + Math.random() * 100),
      on_ground: false,
    };
  } else if (progress < landingStart) {
    // Descent phase
    const descentProgress = (progress - descentStart) / (landingStart - descentStart);
    const cruiseAlt = 38000;
    return {
      phase: 'descent',
      altitude_ft: Math.round(cruiseAlt - descentProgress * (cruiseAlt - 3000)),
      velocity_kts: Math.round(480 - descentProgress * 230),
      vertical_rate_fpm: -1500,
      on_ground: false,
    };
  } else if (progress < 100) {
    // Landing phase
    const landingProgress = (progress - landingStart) / (100 - landingStart);
    return {
      phase: 'landing',
      altitude_ft: Math.round(3000 * (1 - landingProgress)),
      velocity_kts: Math.round(250 - landingProgress * 100),
      vertical_rate_fpm: -800,
      on_ground: false,
    };
  } else {
    // At destination gate
    return {
      phase: 'gate',
      altitude_ft: 0,
      velocity_kts: 0,
      vertical_rate_fpm: 0,
      on_ground: true,
    };
  }
}

/**
 * Determine route for a flight
 */
function determineRoute(flightNumber: string): { from: string; to: string; duration: number } {
  const match = flightNumber.match(/^([A-Z]{2})(\d+)$/i);
  if (!match) {
    // Not a valid flight number format, use a default route
    const route = DEFAULT_ROUTES[Math.floor(Math.random() * DEFAULT_ROUTES.length)];
    return route;
  }

  const [, airline, numberStr] = match;
  const number = parseInt(numberStr, 10);
  const airlineRoutes = AIRLINE_ROUTES[airline.toUpperCase()];

  if (!airlineRoutes) {
    // Unknown airline, use default routes
    const route = DEFAULT_ROUTES[number % DEFAULT_ROUTES.length];
    return route;
  }

  // Try to find a route that matches the flight number range
  for (const route of airlineRoutes) {
    if (route.flightRanges) {
      for (let i = 0; i < route.flightRanges.length; i += 2) {
        if (number >= route.flightRanges[i] && number <= route.flightRanges[i + 1]) {
          return {
            from: route.from,
            to: route.to,
            duration: route.duration,
          };
        }
      }
    }
  }

  // No range match, use a route based on the number
  const route = airlineRoutes[number % airlineRoutes.length];
  return {
    from: route.from,
    to: route.to,
    duration: route.duration,
  };
}

/**
 * Generate realistic demo flight data
 */
export function generateDemoFlight(flightNumber: string): DemoFlightData {
  const route = determineRoute(flightNumber);
  const departure = AIRPORTS[route.from];
  const arrival = AIRPORTS[route.to];

  if (!departure || !arrival) {
    throw new Error(`Airport not found for route ${route.from} to ${route.to}`);
  }

  // Calculate flight start time based on current time and a random offset
  const now = new Date();
  const flightDurationMs = route.duration * 60 * 1000;
  
  // Generate a random start time within the last duration period
  // This ensures flights are always "in progress" when queried
  const randomOffset = Math.random() * 0.8; // 0 to 80% through the flight
  const flightStartTime = new Date(now.getTime() - (flightDurationMs * randomOffset));
  const elapsedTime = now.getTime() - flightStartTime.getTime();
  const progress = Math.min(100, (elapsedTime / flightDurationMs) * 100);

  // Calculate current position along the route
  const position = interpolatePosition(
    departure.lat, departure.lon,
    arrival.lat, arrival.lon,
    progress / 100
  );

  // Get flight phase and parameters
  const distance = calculateDistance(departure.lat, departure.lon, arrival.lat, arrival.lon);
  const phaseData = getFlightPhase(progress, distance);

  // Calculate heading
  const heading = calculateBearing(
    position.lat, position.lon,
    arrival.lat, arrival.lon
  );

  // Get airline info
  const match = flightNumber.match(/^([A-Z]{2})(\d+)$/i);
  const airline = match ? match[1].toUpperCase() : 'XX';
  const country = getAirlineCountry(airline);

  // Convert to metric units for raw data
  const altitude_m = phaseData.altitude_ft * 0.3048;
  const velocity_ms = phaseData.velocity_kts * 0.514444;
  const vertical_rate_ms = phaseData.vertical_rate_fpm * 0.00508;

  // Generate squawk code
  const squawk = phaseData.on_ground ? '0000' : '1200';

  // Calculate estimated arrival
  const remainingTime = flightDurationMs * (1 - progress / 100);
  const estimatedArrival = new Date(now.getTime() + remainingTime);

  return {
    icao24: generateICAO24(flightNumber),
    callsign: getCallsign(flightNumber),
    origin_country: country,
    time_position: Math.floor(now.getTime() / 1000),
    last_contact: Math.floor(now.getTime() / 1000),
    longitude: position.lon,
    latitude: position.lat,
    baro_altitude: phaseData.on_ground ? null : altitude_m,
    on_ground: phaseData.on_ground,
    velocity: phaseData.on_ground ? null : velocity_ms,
    true_track: heading,
    vertical_rate: phaseData.on_ground ? null : vertical_rate_ms,
    geo_altitude: phaseData.on_ground ? null : altitude_m,
    squawk: squawk,
    altitude_ft: phaseData.altitude_ft,
    geo_altitude_ft: phaseData.altitude_ft,
    velocity_kts: phaseData.velocity_kts,
    vertical_rate_fpm: phaseData.vertical_rate_fpm,
    is_demo: true,
    demo_info: {
      departure: route.from,
      arrival: route.to,
      phase: phaseData.phase,
      progress: progress,
      estimated_arrival: estimatedArrival,
      total_duration_minutes: route.duration,
    },
  };
}

/**
 * Generate multiple demo flights for an area
 */
export function generateDemoFlightsInArea(
  minLat: number,
  minLon: number,
  maxLat: number,
  maxLon: number,
  count: number = 10
): DemoFlightData[] {
  const flights: DemoFlightData[] = [];
  const commonFlights = ['UA456', 'DL123', 'AA100', 'WN737', 'B6915', 'AS301', 'UA622', 'DL987', 'AA2345'];

  for (let i = 0; i < Math.min(count, commonFlights.length); i++) {
    try {
      const flight = generateDemoFlight(commonFlights[i]);
      
      // Check if flight is within the requested area
      if (flight.latitude >= minLat && flight.latitude <= maxLat &&
          flight.longitude >= minLon && flight.longitude <= maxLon) {
        flights.push(flight);
      }
    } catch (error) {
      console.error(`Error generating demo flight ${commonFlights[i]}:`, error);
    }
  }

  // If we don't have enough flights in the area, generate some random ones
  const airlines = ['UA', 'DL', 'AA', 'WN', 'B6', 'AS'];
  while (flights.length < count && flights.length < 20) {
    const airline = airlines[Math.floor(Math.random() * airlines.length)];
    const flightNum = Math.floor(Math.random() * 9000) + 1000;
    const flightNumber = `${airline}${flightNum}`;
    
    try {
      const flight = generateDemoFlight(flightNumber);
      if (flight.latitude >= minLat && flight.latitude <= maxLat &&
          flight.longitude >= minLon && flight.longitude <= maxLon) {
        flights.push(flight);
      }
    } catch (error) {
      // Skip this flight
    }
  }

  return flights;
}