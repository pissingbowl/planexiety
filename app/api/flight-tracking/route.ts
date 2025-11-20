// app/api/flight-tracking/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { generateDemoFlight, generateDemoFlightsInArea } from '@/lib/demoFlightGenerator';

// OpenSky Network API base URL
const OPENSKY_BASE = 'https://opensky-network.org/api';

// Comprehensive airline codes mapped to their callsign prefixes
const AIRLINE_CODES: Record<string, string> = {
  // Major US Airlines
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
  
  // International Airlines
  'BA': 'BAW', // British Airways
  'LH': 'DLH', // Lufthansa
  'AF': 'AFR', // Air France
  'KL': 'KLM', // KLM
  'EK': 'UAE', // Emirates
  'QF': 'QFA', // Qantas
  'AC': 'ACA', // Air Canada
  'VS': 'VIR', // Virgin Atlantic
  'AZ': 'AZA', // Alitalia
  'IB': 'IBE', // Iberia
  'QR': 'QTR', // Qatar Airways
  'SQ': 'SIA', // Singapore Airlines
  'CX': 'CPA', // Cathay Pacific
  'JL': 'JAL', // Japan Airlines
  'NH': 'ANA', // All Nippon Airways
  'TK': 'THY', // Turkish Airlines
  'EY': 'ETD', // Etihad
  'SV': 'SVA', // Saudia
  'AI': 'AIC', // Air India
  'LX': 'SWR', // Swiss
  'OS': 'AUA', // Austrian
  'SK': 'SAS', // SAS
  'AY': 'FIN', // Finnair
  'TP': 'TAP', // TAP Portugal
  'AB': 'BER', // Air Berlin
  'U2': 'EZY', // easyJet
  'FR': 'RYR', // Ryanair
  'WZ': 'WZZ', // Wizz Air
};

// Sample flights that are commonly in the air (for demo/fallback)
const SAMPLE_FLIGHTS = [
  { flight: "UA456", callsign: "UAL456", route: "SFO to EWR", description: "United transcontinental" },
  { flight: "DL123", callsign: "DAL123", route: "ATL to LAX", description: "Delta cross-country" },
  { flight: "AA100", callsign: "AAL100", route: "JFK to LHR", description: "American transatlantic" },
  { flight: "WN737", callsign: "SWA737", route: "DEN to PHX", description: "Southwest regional" },
  { flight: "B6915", callsign: "JBU915", route: "BOS to MCO", description: "JetBlue vacation route" },
  { flight: "AS301", callsign: "ASA301", route: "SEA to LAX", description: "Alaska west coast" },
  { flight: "BA112", callsign: "BAW112", route: "LHR to JFK", description: "British Airways transatlantic" },
  { flight: "LH400", callsign: "DLH400", route: "FRA to JFK", description: "Lufthansa international" },
];

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
 * Parse OpenSky state vector into a more readable format
 */
function parseStateVector(state: any[]) {
  return {
    icao24: state[0],
    callsign: state[1] ? state[1].trim() : null,
    origin_country: state[2],
    time_position: state[3],
    last_contact: state[4],
    longitude: state[5],
    latitude: state[6],
    baro_altitude: state[7], // meters
    on_ground: state[8],
    velocity: state[9], // m/s
    true_track: state[10], // degrees
    vertical_rate: state[11], // m/s
    sensors: state[12],
    geo_altitude: state[13], // meters
    squawk: state[14],
    spi: state[15],
    position_source: state[16],
    category: state[17] || 0,
  };
}

/**
 * Convert meters to feet and m/s to knots for aviation standard units
 */
function convertToAviationUnits(flight: any) {
  return {
    ...flight,
    altitude_ft: flight.baro_altitude ? Math.round(flight.baro_altitude * 3.28084) : null,
    geo_altitude_ft: flight.geo_altitude ? Math.round(flight.geo_altitude * 3.28084) : null,
    velocity_kts: flight.velocity ? Math.round(flight.velocity * 1.94384) : null,
    vertical_rate_fpm: flight.vertical_rate ? Math.round(flight.vertical_rate * 196.85) : null,
  };
}

/**
 * GET handler for flight tracking data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const flightNumber = searchParams.get('flight');
    const icao24 = searchParams.get('icao24');
    const bbox = searchParams.get('bbox'); // Format: "min_lat,min_lon,max_lat,max_lon"
    const all = searchParams.get('all') === 'true';
    
    // Build the URL based on parameters
    let url = `${OPENSKY_BASE}/states/all`;
    const params = new URLSearchParams();
    
    if (flightNumber) {
      // Convert flight number to callsign
      const callsign = convertFlightNumberToCallsign(flightNumber);
      console.log(`Converting flight ${flightNumber} to callsign ${callsign}`);
      
      // OpenSky doesn't support direct callsign filtering in the URL,
      // so we'll fetch all and filter
      url = `${OPENSKY_BASE}/states/all`;
    } else if (icao24) {
      params.set('icao24', icao24.toLowerCase());
    } else if (bbox) {
      // Parse bounding box
      const [lamin, lomin, lamax, lomax] = bbox.split(',').map(Number);
      params.set('lamin', lamin.toString());
      params.set('lomin', lomin.toString());
      params.set('lamax', lamax.toString());
      params.set('lomax', lomax.toString());
    }
    
    // Construct full URL
    const fullUrl = params.toString() ? `${url}?${params.toString()}` : url;
    console.log('Fetching flight data from OpenSky:', fullUrl);
    
    // Fetch data from OpenSky Network
    const response = await fetch(fullUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'OTIE-Flight-Companion/1.0',
      },
      next: {
        revalidate: 30, // Cache for 30 seconds
      },
    });
    
    if (!response.ok) {
      console.error('OpenSky API error:', response.status, response.statusText);
      
      // When OpenSky is unavailable, return demo data
      if (flightNumber) {
        console.log(`OpenSky unavailable, generating demo data for ${flightNumber}...`);
        try {
          const demoFlight = generateDemoFlight(flightNumber);
          return NextResponse.json({
            timestamp: new Date().toISOString(),
            flight: demoFlight,
            message: 'Flight data (demo - OpenSky unavailable)',
            is_demo: true,
            demo_notice: `OpenSky Network is currently unavailable. Showing simulated flight data for ${flightNumber}.`,
            total: 1,
          });
        } catch (demoError) {
          const fallbackDemoFlight = generateDemoFlight('UA456');
          return NextResponse.json({
            timestamp: new Date().toISOString(),
            flight: { ...fallbackDemoFlight, callsign: convertFlightNumberToCallsign(flightNumber) },
            message: 'Flight data (demo - OpenSky unavailable)',
            is_demo: true,
            demo_notice: `OpenSky Network is currently unavailable. Showing simulated flight data.`,
            total: 1,
          });
        }
      } else if (bbox) {
        // For area searches, generate demo flights in the area
        console.log(`OpenSky unavailable, generating demo flights for area...`);
        const [lamin, lomin, lamax, lomax] = bbox.split(',').map(Number);
        const demoFlights = generateDemoFlightsInArea(lamin, lomin, lamax, lomax, 10);
        return NextResponse.json({
          timestamp: new Date().toISOString(),
          flights: demoFlights,
          message: 'Flight data (demo - OpenSky unavailable)',
          is_demo: true,
          demo_notice: 'OpenSky Network is currently unavailable. Showing simulated flight data.',
          total: demoFlights.length,
        });
      }
      
      // For other cases, return error but with helpful message
      return NextResponse.json({
        timestamp: new Date().toISOString(),
        flights: [],
        message: `OpenSky Network unavailable (${response.status}). Try searching for specific flights like UA622, DL123, or AA456 to see demo data.`,
        is_demo: false,
        total: 0,
      });
    }
    
    // Parse response
    const data = await response.json();
    
    if (!data || !data.states) {
      return NextResponse.json({
        timestamp: new Date().toISOString(),
        flights: [],
        message: 'No flight data available',
        total: 0,
      });
    }
    
    // Parse state vectors
    let flights = data.states.map(parseStateVector).map(convertToAviationUnits);
    
    // Filter by flight number if provided
    if (flightNumber) {
      const callsign = convertFlightNumberToCallsign(flightNumber);
      
      // Try exact match first
      flights = flights.filter((f: any) => 
        f.callsign && f.callsign.trim().toUpperCase() === callsign
      );
      
      // If no exact match, try contains match
      if (flights.length === 0) {
        flights = data.states.map(parseStateVector).map(convertToAviationUnits)
          .filter((f: any) => 
            f.callsign && f.callsign.toUpperCase().includes(callsign)
          );
      }
      
      // If still no match, generate demo flight data
      if (flights.length === 0) {
        console.log(`Flight ${flightNumber} not found in OpenSky, generating demo data...`);
        
        try {
          // Generate demo flight data
          const demoFlight = generateDemoFlight(flightNumber);
          
          return NextResponse.json({
            timestamp: new Date().toISOString(),
            flight: demoFlight,
            message: 'Flight data (demo)',
            is_demo: true,
            demo_notice: `This is simulated flight data for testing. Real-time tracking not available for ${flightNumber}.`,
            total: 1,
          }, {
            headers: {
              'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
            },
          });
        } catch (demoError) {
          console.error(`Error generating demo flight for ${flightNumber}:`, demoError);
          
          // If demo generation fails, return a generic demo flight
          const fallbackDemoFlight = generateDemoFlight('UA456'); // Use a known good route
          return NextResponse.json({
            timestamp: new Date().toISOString(),
            flight: { ...fallbackDemoFlight, callsign: callsign },
            message: 'Flight data (demo)',
            is_demo: true,
            demo_notice: `This is simulated flight data for testing. Real-time tracking not available for ${flightNumber}.`,
            total: 1,
          }, {
            headers: {
              'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
            },
          });
        }
      }
    }
    
    // Return single flight if searching for specific flight
    if (flightNumber && flights.length > 0) {
      return NextResponse.json({
        timestamp: new Date().toISOString(),
        flight: flights[0],
        message: 'Flight found',
        total: 1,
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      });
    }
    
    // Return all flights for area search or all flights
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      flights: all ? flights : flights.slice(0, 100), // Limit to 100 flights unless "all" is specified
      total: flights.length,
      message: flights.length > 0 ? 'Flights found' : 'No flights in specified area',
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
    
  } catch (error) {
    console.error('Error in flight-tracking API route:', error);
    
    // When there's any error, try to return demo data instead
    const { searchParams } = request.nextUrl;
    const flightNumber = searchParams.get('flight');
    const bbox = searchParams.get('bbox');
    
    if (flightNumber) {
      console.log(`Error fetching real data, generating demo for ${flightNumber}...`);
      try {
        const demoFlight = generateDemoFlight(flightNumber);
        return NextResponse.json({
          timestamp: new Date().toISOString(),
          flight: demoFlight,
          message: 'Flight data (demo)',
          is_demo: true,
          demo_notice: `Using simulated flight data for ${flightNumber}.`,
          total: 1,
        });
      } catch (demoError) {
        // Even demo generation failed, use a fallback
        const fallbackDemoFlight = generateDemoFlight('UA456');
        return NextResponse.json({
          timestamp: new Date().toISOString(),
          flight: { ...fallbackDemoFlight, callsign: convertFlightNumberToCallsign(flightNumber) },
          message: 'Flight data (demo)',
          is_demo: true,
          demo_notice: `Using simulated flight data.`,
          total: 1,
        });
      }
    } else if (bbox) {
      console.log(`Error fetching real data, generating demo flights for area...`);
      const [lamin, lomin, lamax, lomax] = bbox.split(',').map(Number);
      const demoFlights = generateDemoFlightsInArea(lamin, lomin, lamax, lomax, 10);
      return NextResponse.json({
        timestamp: new Date().toISOString(),
        flights: demoFlights,
        message: 'Flight data (demo)',
        is_demo: true,
        demo_notice: 'Using simulated flight data.',
        total: demoFlights.length,
      });
    }
    
    // For other cases, still return an empty list but with helpful message
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      flights: [],
      message: 'Service temporarily unavailable. Search for specific flights like UA622, DL123, or AA456 to see demo data.',
      is_demo: false,
      total: 0,
    });
  }
}

/**
 * POST handler for batch flight tracking requests
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { flights } = body;
    
    if (!flights || !Array.isArray(flights)) {
      return NextResponse.json(
        { error: 'Invalid request format. Expected { flights: [...] }' },
        { status: 400 }
      );
    }
    
    // Fetch all current flight data once
    const response = await fetch(`${OPENSKY_BASE}/states/all`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'OTIE-Flight-Companion/1.0',
      },
    });
    
    if (!response.ok) {
      throw new Error(`OpenSky API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || !data.states) {
      return NextResponse.json({
        timestamp: new Date().toISOString(),
        results: flights.map(f => ({
          flight: f,
          found: false,
          data: null,
        })),
      });
    }
    
    // Parse all flights
    const allFlights = data.states.map(parseStateVector).map(convertToAviationUnits);
    
    // Find requested flights
    const results = flights.map((flightNumber: string) => {
      const callsign = convertFlightNumberToCallsign(flightNumber);
      const found = allFlights.find((f: any) => 
        f.callsign && f.callsign.toUpperCase().includes(callsign)
      );
      
      return {
        flight: flightNumber,
        callsign: callsign,
        found: !!found,
        data: found || null,
      };
    });
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      results: results,
      total_tracked: allFlights.length,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
    
  } catch (error) {
    console.error('Error in flight-tracking POST handler:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}