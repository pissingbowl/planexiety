// lib/api/turbulenceData.ts

export interface PIREP {
  receipt_time: string;
  observation_time: string;
  aircraft_ref: string;
  latitude: number;
  longitude: number;
  altitude_ft_msl: number;
  turbulence_type?: string;
  turbulence_intensity?: string;
  turbulence_base_ft_msl?: number;
  turbulence_top_ft_msl?: number;
  icing_type?: string;
  icing_intensity?: string;
  visibility_statute_mi?: number;
  wx_string?: string;
  temp_c?: number;
  wind_dir_degrees?: number;
  wind_speed_kt?: number;
  raw_text: string;
  report_type: 'ROUTINE' | 'URGENT';
}

export interface SIGMET {
  receipt_time: string;
  valid_time_from: string;
  valid_time_to: string;
  hazard: string;
  severity?: string;
  area: {
    type: string;
    coordinates: Array<[number, number]>;
  };
  movement?: {
    direction: number;
    speed_kt: number;
  };
  altitude_min_ft_msl?: number;
  altitude_max_ft_msl?: number;
  raw_text: string;
}

export interface AIRMET {
  receipt_time: string;
  valid_time_from: string;
  valid_time_to: string;
  hazard: string;
  severity?: string;
  area: {
    type: string;
    coordinates: Array<[number, number]>;
  };
  altitude_min_ft_msl?: number;
  altitude_max_ft_msl?: number;
  raw_text: string;
}

export interface TurbulenceAssessment {
  level: 'none' | 'light' | 'moderate' | 'severe' | 'extreme';
  confidence: 'low' | 'medium' | 'high';
  reports: PIREP[];
  sigmets: SIGMET[];
  airmets: AIRMET[];
  summary: string;
  recommendations: string[];
}

export interface RoutePoint {
  lat: number;
  lon: number;
  distance: number; // nm from departure
  bearing: number; // degrees
}

export interface TurbulenceHotSpot {
  location: { lat: number; lon: number };
  altitudeRange: { min: number; max: number };
  intensity: 'light' | 'moderate' | 'severe' | 'extreme';
  type: string;
  source: 'PIREP' | 'SIGMET' | 'AIRMET' | 'Weather' | 'JetStream';
  distance: number; // nm from current position
  timeToEncounter?: number; // minutes
  confidence: 'low' | 'medium' | 'high';
  description: string;
}

export interface EnhancedTurbulenceReport {
  // Current conditions along route
  currentConditions: {
    overall: 'smooth' | 'light' | 'moderate' | 'severe' | 'extreme';
    recentPIREPs: PIREP[];
    activeSIGMETs: SIGMET[];
    activeAIRMETs: AIRMET[];
  };
  
  // Forecast based on weather patterns
  forecast: {
    takeoff: { intensity: string; probability: number };
    climb: { intensity: string; probability: number };
    cruise: { intensity: string; probability: number };
    descent: { intensity: string; probability: number };
    approach: { intensity: string; probability: number };
  };
  
  // Specific areas of concern
  hotSpots: TurbulenceHotSpot[];
  
  // Altitude recommendations
  altitudeRecommendations: {
    optimal: number; // feet
    avoid: Array<{ min: number; max: number; reason: string }>;
    alternates: Array<{ altitude: number; conditions: string }>;
  };
  
  // Overall confidence in analysis
  confidence: {
    level: 'low' | 'medium' | 'high';
    dataPoints: number;
    coverage: number; // percentage of route covered by data
    age: string; // how recent the data is
  };
  
  // Summary for display
  summary: string;
  
  // Detailed recommendations
  recommendations: string[];
}

export interface RouteCorridorOptions {
  widthNm: number; // width of corridor in nautical miles
  altitudeMin: number; // minimum altitude in feet
  altitudeMax: number; // maximum altitude in feet
}

export interface JetStreamData {
  present: boolean;
  altitude: number; // feet
  windSpeed: number; // knots
  direction: number; // degrees
  intersectsRoute: boolean;
  turbulencePotential: 'low' | 'moderate' | 'high';
}

// Cache turbulence data
const turbulenceCache = new Map<string, { data: any; timestamp: number }>();
const TURBULENCE_CACHE_DURATION = 600000; // 10 minutes

// Track whether we're using fallback data
let usingFallbackData = false;

/**
 * Check if we're currently using fallback data
 */
export function isUsingFallbackData(): boolean {
  return usingFallbackData;
}

/**
 * Reset fallback data flag (useful for retrying API calls)
 */
export function resetFallbackDataFlag(): void {
  usingFallbackData = false;
}

/**
 * Get fallback PIREPs for demonstration when API is unavailable
 */
function getFallbackPIREPs(centerLat: number = 39.8283, centerLon: number = -98.5795): PIREP[] {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 3600000);
  const twoHoursAgo = new Date(now.getTime() - 7200000);
  
  // Generate some realistic PIREPs near the provided location
  return [
    {
      receipt_time: now.toISOString(),
      observation_time: new Date(now.getTime() - 900000).toISOString(), // 15 mins ago
      aircraft_ref: 'B738',
      latitude: centerLat + 0.5,
      longitude: centerLon - 0.5,
      altitude_ft_msl: 35000,
      turbulence_type: 'CAT',
      turbulence_intensity: 'LGT',
      turbulence_base_ft_msl: 33000,
      turbulence_top_ft_msl: 37000,
      raw_text: '[DEMO DATA] Light clear air turbulence reported',
      report_type: 'ROUTINE'
    },
    {
      receipt_time: oneHourAgo.toISOString(),
      observation_time: new Date(oneHourAgo.getTime() - 600000).toISOString(),
      aircraft_ref: 'A320',
      latitude: centerLat - 0.3,
      longitude: centerLon + 0.4,
      altitude_ft_msl: 31000,
      turbulence_type: 'CHOP',
      turbulence_intensity: 'MOD',
      turbulence_base_ft_msl: 28000,
      turbulence_top_ft_msl: 33000,
      raw_text: '[DEMO DATA] Moderate chop reported',
      report_type: 'ROUTINE'
    },
    {
      receipt_time: twoHoursAgo.toISOString(),
      observation_time: new Date(twoHoursAgo.getTime() - 300000).toISOString(),
      aircraft_ref: 'B777',
      latitude: centerLat + 0.8,
      longitude: centerLon,
      altitude_ft_msl: 41000,
      turbulence_intensity: 'SMTH',
      raw_text: '[DEMO DATA] Smooth conditions at FL410',
      report_type: 'ROUTINE'
    }
  ];
}

/**
 * Get fallback SIGMETs for demonstration
 */
function getFallbackSIGMETs(): SIGMET[] {
  const now = new Date();
  const validFrom = new Date(now.getTime() - 1800000); // 30 mins ago
  const validTo = new Date(now.getTime() + 14400000); // 4 hours from now
  
  return [
    {
      receipt_time: validFrom.toISOString(),
      valid_time_from: validFrom.toISOString(),
      valid_time_to: validTo.toISOString(),
      hazard: 'Turbulence',
      severity: 'Severe',
      area: {
        type: 'Polygon',
        coordinates: [
          [-105, 40],
          [-105, 42],
          [-102, 42],
          [-102, 40],
          [-105, 40]
        ]
      },
      altitude_min_ft_msl: 25000,
      altitude_max_ft_msl: 45000,
      raw_text: '[DEMO DATA] SIGMET for severe turbulence over Rocky Mountains'
    }
  ];
}

/**
 * Get fallback AIRMETs for demonstration
 */
function getFallbackAIRMETs(): AIRMET[] {
  const now = new Date();
  const validFrom = new Date(now.getTime() - 3600000); // 1 hour ago
  const validTo = new Date(now.getTime() + 10800000); // 3 hours from now
  
  return [
    {
      receipt_time: validFrom.toISOString(),
      valid_time_from: validFrom.toISOString(),
      valid_time_to: validTo.toISOString(),
      hazard: 'Turbulence',
      severity: 'Moderate',
      area: {
        type: 'Polygon',
        coordinates: [
          [-100, 35],
          [-100, 38],
          [-95, 38],
          [-95, 35],
          [-100, 35]
        ]
      },
      altitude_min_ft_msl: 10000,
      altitude_max_ft_msl: 25000,
      raw_text: '[DEMO DATA] AIRMET for moderate turbulence'
    }
  ];
}

/**
 * Map turbulence intensity codes to readable format
 */
const TURBULENCE_INTENSITY_MAP: Record<string, string> = {
  'NEG': 'None',
  'SMTH-LGT': 'Smooth to Light',
  'LGT': 'Light',
  'LGT-MOD': 'Light to Moderate',
  'MOD': 'Moderate',
  'MOD-SEV': 'Moderate to Severe',
  'SEV': 'Severe',
  'EXTRM': 'Extreme',
};

/**
 * Map turbulence type codes to readable format
 */
const TURBULENCE_TYPE_MAP: Record<string, string> = {
  'CAT': 'Clear Air Turbulence',
  'CHOP': 'Chop',
  'LLWS': 'Low Level Wind Shear',
  'MTN WAVE': 'Mountain Wave',
};

/**
 * Check if a point is inside a polygon
 */
function isPointInPolygon(lat: number, lon: number, polygon: Array<[number, number]>): boolean {
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][1], yi = polygon[i][0];
    const xj = polygon[j][1], yj = polygon[j][0];
    
    const intersect = ((yi > lat) !== (yj > lat))
        && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }
  
  return inside;
}

/**
 * Calculate distance between two points
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
 * Fetch PIREPs (Pilot Reports) for a given area or flight path
 */
export async function fetchPIREPs(
  centerLat?: number,
  centerLon?: number,
  radiusKm: number = 200
): Promise<PIREP[]> {
  const cacheKey = `pireps_${centerLat}_${centerLon}_${radiusKm}`;
  const cached = turbulenceCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < TURBULENCE_CACHE_DURATION) {
    console.log('Returning cached PIREPs');
    return cached.data;
  }
  
  try {
    // Use our API route instead of direct external API call
    const url = `/api/aviation-weather?type=pirep&format=json`;
    console.log('Fetching PIREPs from:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('PIREP API error:', response.status);
      return [];
    }
    
    const responseData = await response.json();
    
    // Extract the actual weather data from our API response
    const data = responseData.data;
    
    if (data && Array.isArray(data)) {
      let pireps: PIREP[] = data.map((pirep: any) => ({
        receipt_time: pirep.receipt_time,
        observation_time: pirep.observation_time,
        aircraft_ref: pirep.aircraft_ref || 'Unknown',
        latitude: parseFloat(pirep.latitude),
        longitude: parseFloat(pirep.longitude),
        altitude_ft_msl: parseInt(pirep.altitude_ft_msl),
        turbulence_type: pirep.turbulence_type,
        turbulence_intensity: pirep.turbulence_intensity,
        turbulence_base_ft_msl: pirep.turbulence_base_ft_msl ? parseInt(pirep.turbulence_base_ft_msl) : undefined,
        turbulence_top_ft_msl: pirep.turbulence_top_ft_msl ? parseInt(pirep.turbulence_top_ft_msl) : undefined,
        icing_type: pirep.icing_type,
        icing_intensity: pirep.icing_intensity,
        visibility_statute_mi: pirep.visibility_statute_mi ? parseFloat(pirep.visibility_statute_mi) : undefined,
        wx_string: pirep.wx_string,
        temp_c: pirep.temp_c ? parseFloat(pirep.temp_c) : undefined,
        wind_dir_degrees: pirep.wind_dir_degrees ? parseInt(pirep.wind_dir_degrees) : undefined,
        wind_speed_kt: pirep.wind_speed_kt ? parseInt(pirep.wind_speed_kt) : undefined,
        raw_text: pirep.raw_text,
        report_type: pirep.report_type || 'ROUTINE',
      }));
      
      // Filter by location if provided
      if (centerLat && centerLon) {
        pireps = pireps.filter(pirep => {
          const distance = calculateDistance(centerLat, centerLon, pirep.latitude, pirep.longitude);
          return distance <= radiusKm;
        });
      }
      
      // Sort by observation time (most recent first)
      pireps.sort((a, b) => 
        new Date(b.observation_time).getTime() - new Date(a.observation_time).getTime()
      );
      
      // If we got empty data, use fallback
      if (pireps.length === 0) {
        console.log('No PIREPs available from API, using fallback data');
        usingFallbackData = true;
        const fallbackData = getFallbackPIREPs(centerLat, centerLon);
        turbulenceCache.set(cacheKey, { data: fallbackData, timestamp: Date.now() });
        return fallbackData;
      }
      
      turbulenceCache.set(cacheKey, { data: pireps, timestamp: Date.now() });
      return pireps;
    }
    
    // No data from API, use fallback
    console.log('No PIREPs data from API, using fallback');
    usingFallbackData = true;
    const fallbackData = getFallbackPIREPs(centerLat, centerLon);
    turbulenceCache.set(cacheKey, { data: fallbackData, timestamp: Date.now() });
    return fallbackData;
    
  } catch (error) {
    console.error('Error fetching PIREPs:', error);
    console.log('Using fallback PIREP data for demonstration');
    usingFallbackData = true;
    const fallbackData = getFallbackPIREPs(centerLat, centerLon);
    turbulenceCache.set(cacheKey, { data: fallbackData, timestamp: Date.now() });
    return fallbackData;
  }
}

/**
 * Fetch SIGMETs (Significant Meteorological Information)
 */
export async function fetchSIGMETs(): Promise<SIGMET[]> {
  const cacheKey = 'sigmets';
  const cached = turbulenceCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < TURBULENCE_CACHE_DURATION) {
    console.log('Returning cached SIGMETs');
    return cached.data;
  }
  
  try {
    // Use our API route instead of direct external API call
    const url = `/api/aviation-weather?type=sigmet&format=json`;
    console.log('Fetching SIGMETs from:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('SIGMET API error:', response.status);
      return [];
    }
    
    const responseData = await response.json();
    
    // Extract the actual weather data from our API response
    const data = responseData.data;
    
    if (data && Array.isArray(data)) {
      const sigmets: SIGMET[] = data
        .filter((item: any) => item.airsigmet_type === 'SIGMET')
        .map((sigmet: any) => ({
          receipt_time: sigmet.receipt_time,
          valid_time_from: sigmet.valid_time_from,
          valid_time_to: sigmet.valid_time_to,
          hazard: sigmet.hazard || 'Unknown',
          severity: sigmet.severity,
          area: sigmet.area || { type: 'Polygon', coordinates: [] },
          movement: sigmet.movement,
          altitude_min_ft_msl: sigmet.altitude_min_ft_msl ? parseInt(sigmet.altitude_min_ft_msl) : undefined,
          altitude_max_ft_msl: sigmet.altitude_max_ft_msl ? parseInt(sigmet.altitude_max_ft_msl) : undefined,
          raw_text: sigmet.raw_text,
        }));
      
      // If we got empty data, use fallback
      if (sigmets.length === 0) {
        console.log('No SIGMETs available from API, using fallback data');
        usingFallbackData = true;
        const fallbackData = getFallbackSIGMETs();
        turbulenceCache.set(cacheKey, { data: fallbackData, timestamp: Date.now() });
        return fallbackData;
      }
      
      turbulenceCache.set(cacheKey, { data: sigmets, timestamp: Date.now() });
      return sigmets;
    }
    
    // No data from API, use fallback
    console.log('No SIGMETs data from API, using fallback');
    usingFallbackData = true;
    const fallbackData = getFallbackSIGMETs();
    turbulenceCache.set(cacheKey, { data: fallbackData, timestamp: Date.now() });
    return fallbackData;
    
  } catch (error) {
    console.error('Error fetching SIGMETs:', error);
    console.log('Using fallback SIGMET data for demonstration');
    usingFallbackData = true;
    const fallbackData = getFallbackSIGMETs();
    turbulenceCache.set(cacheKey, { data: fallbackData, timestamp: Date.now() });
    return fallbackData;
  }
}

/**
 * Fetch AIRMETs (Airmen's Meteorological Information)
 */
export async function fetchAIRMETs(): Promise<AIRMET[]> {
  const cacheKey = 'airmets';
  const cached = turbulenceCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < TURBULENCE_CACHE_DURATION) {
    console.log('Returning cached AIRMETs');
    return cached.data;
  }
  
  try {
    // Use our API route instead of direct external API call
    const url = `/api/aviation-weather?type=airmet&format=json`;
    console.log('Fetching AIRMETs from:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('AIRMET API error:', response.status);
      return [];
    }
    
    const responseData = await response.json();
    
    // Extract the actual weather data from our API response
    const data = responseData.data;
    
    if (data && Array.isArray(data)) {
      const airmets: AIRMET[] = data
        .filter((item: any) => item.airsigmet_type === 'AIRMET')
        .map((airmet: any) => ({
          receipt_time: airmet.receipt_time,
          valid_time_from: airmet.valid_time_from,
          valid_time_to: airmet.valid_time_to,
          hazard: airmet.hazard || 'Unknown',
          severity: airmet.severity,
          area: airmet.area || { type: 'Polygon', coordinates: [] },
          altitude_min_ft_msl: airmet.altitude_min_ft_msl ? parseInt(airmet.altitude_min_ft_msl) : undefined,
          altitude_max_ft_msl: airmet.altitude_max_ft_msl ? parseInt(airmet.altitude_max_ft_msl) : undefined,
          raw_text: airmet.raw_text,
        }));
      
      // If we got empty data, use fallback
      if (airmets.length === 0) {
        console.log('No AIRMETs available from API, using fallback data');
        usingFallbackData = true;
        const fallbackData = getFallbackAIRMETs();
        turbulenceCache.set(cacheKey, { data: fallbackData, timestamp: Date.now() });
        return fallbackData;
      }
      
      turbulenceCache.set(cacheKey, { data: airmets, timestamp: Date.now() });
      return airmets;
    }
    
    // No data from API, use fallback
    console.log('No AIRMETs data from API, using fallback');
    usingFallbackData = true;
    const fallbackData = getFallbackAIRMETs();
    turbulenceCache.set(cacheKey, { data: fallbackData, timestamp: Date.now() });
    return fallbackData;
    
  } catch (error) {
    console.error('Error fetching AIRMETs:', error);
    console.log('Using fallback AIRMET data for demonstration');
    usingFallbackData = true;
    const fallbackData = getFallbackAIRMETs();
    turbulenceCache.set(cacheKey, { data: fallbackData, timestamp: Date.now() });
    return fallbackData;
  }
}

/**
 * Assess turbulence conditions along a flight path
 */
export async function assessFlightTurbulence(
  currentLat: number,
  currentLon: number,
  altitude: number,
  departureAirport: string,
  arrivalAirport: string
): Promise<TurbulenceAssessment> {
  try {
    // Fetch all turbulence data in parallel
    const [pireps, sigmets, airmets] = await Promise.all([
      fetchPIREPs(currentLat, currentLon, 300),
      fetchSIGMETs(),
      fetchAIRMETs(),
    ]);
    
    // Filter PIREPs for turbulence reports
    const turbulencePireps = pireps.filter(p => 
      p.turbulence_intensity && p.turbulence_intensity !== 'NEG'
    );
    
    // Filter SIGMETs/AIRMETs for turbulence
    const turbulenceSigmets = sigmets.filter(s => 
      s.hazard && (s.hazard.includes('TURB') || s.hazard.includes('MTN WAVE'))
    );
    
    const turbulenceAirmets = airmets.filter(a => 
      a.hazard && a.hazard.includes('TURB')
    );
    
    // Check if current position is in any SIGMET/AIRMET area
    const inSigmet = turbulenceSigmets.some(s => {
      if (s.area && s.area.coordinates) {
        return isPointInPolygon(currentLat, currentLon, s.area.coordinates);
      }
      return false;
    });
    
    const inAirmet = turbulenceAirmets.some(a => {
      if (a.area && a.area.coordinates) {
        return isPointInPolygon(currentLat, currentLon, a.area.coordinates);
      }
      return false;
    });
    
    // Find nearby turbulence reports (within 100km and similar altitude)
    const nearbyTurbulence = turbulencePireps.filter(p => {
      const distance = calculateDistance(currentLat, currentLon, p.latitude, p.longitude);
      const altDiff = Math.abs(altitude - p.altitude_ft_msl);
      return distance < 100 && altDiff < 5000; // Within 100km and 5000ft altitude
    });
    
    // Determine overall turbulence level
    let level: TurbulenceAssessment['level'] = 'none';
    let confidence: TurbulenceAssessment['confidence'] = 'low';
    const recommendations: string[] = [];
    
    if (inSigmet) {
      level = 'severe';
      confidence = 'high';
      recommendations.push('Aircraft is in SIGMET area - expect significant turbulence');
      recommendations.push('Pilots will likely request altitude changes or route deviations');
    } else if (nearbyTurbulence.some(p => p.turbulence_intensity === 'SEV' || p.turbulence_intensity === 'EXTRM')) {
      level = 'severe';
      confidence = 'high';
      recommendations.push('Severe turbulence reported nearby - fasten seatbelt immediately');
    } else if (inAirmet || nearbyTurbulence.some(p => p.turbulence_intensity === 'MOD')) {
      level = 'moderate';
      confidence = 'medium';
      recommendations.push('Moderate turbulence likely - keep seatbelt fastened');
      recommendations.push('Service may be suspended temporarily');
    } else if (nearbyTurbulence.some(p => p.turbulence_intensity === 'LGT')) {
      level = 'light';
      confidence = 'medium';
      recommendations.push('Light turbulence possible - normal for most flights');
    } else {
      level = 'none';
      confidence = turbulencePireps.length > 0 ? 'medium' : 'low';
      recommendations.push('No significant turbulence reported in your area');
    }
    
    // Generate summary
    let summary = '';
    if (level === 'severe') {
      summary = 'Significant turbulence expected. This is uncommon but the aircraft is designed to handle it safely.';
    } else if (level === 'moderate') {
      summary = 'Moderate bumps likely. This is normal and poses no danger to the aircraft.';
    } else if (level === 'light') {
      summary = 'Light chop possible, but everything is on profile. The aircraft handles this effortlessly.';
    } else {
      summary = 'Smooth conditions expected. Any bumps will be minor and brief.';
    }
    
    // Add specific report details to summary
    if (nearbyTurbulence.length > 0) {
      const latest = nearbyTurbulence[0];
      const time = new Date(latest.observation_time);
      const minutesAgo = Math.round((Date.now() - time.getTime()) / 60000);
      summary += ` Recent report from ${latest.aircraft_ref} ${minutesAgo} minutes ago.`;
    }
    
    return {
      level,
      confidence,
      reports: turbulencePireps.slice(0, 10), // Limit to 10 most recent
      sigmets: turbulenceSigmets,
      airmets: turbulenceAirmets,
      summary,
      recommendations,
    };
    
  } catch (error) {
    console.error('Error assessing flight turbulence:', error);
    
    return {
      level: 'none',
      confidence: 'low',
      reports: [],
      sigmets: [],
      airmets: [],
      summary: 'Unable to fetch turbulence data. Using default smooth conditions estimate.',
      recommendations: ['Keep seatbelt fastened when seated as a precaution'],
    };
  }
}

/**
 * Format PIREP for display
 */
export function formatPIREP(pirep: PIREP): string {
  let result = `${pirep.aircraft_ref} at ${Math.round(pirep.altitude_ft_msl / 100)}00ft: `;
  
  if (pirep.turbulence_intensity) {
    const intensity = TURBULENCE_INTENSITY_MAP[pirep.turbulence_intensity] || pirep.turbulence_intensity;
    const type = pirep.turbulence_type ? TURBULENCE_TYPE_MAP[pirep.turbulence_type] || pirep.turbulence_type : '';
    result += `${intensity} ${type}`.trim();
  }
  
  if (pirep.icing_intensity) {
    result += `, ${pirep.icing_intensity} icing`;
  }
  
  const time = new Date(pirep.observation_time);
  const minutesAgo = Math.round((Date.now() - time.getTime()) / 60000);
  result += ` (${minutesAgo} min ago)`;
  
  return result;
}

/**
 * Convert kilometers to nautical miles
 */
function kmToNm(km: number): number {
  return km * 0.539957;
}

/**
 * Convert nautical miles to kilometers
 */
function nmToKm(nm: number): number {
  return nm * 1.852;
}

/**
 * Calculate great circle route between two airports
 * Returns waypoints every 50nm along the route
 */
export function calculateGreatCircleRoute(
  depLat: number,
  depLon: number,
  arrLat: number,
  arrLon: number,
  intervalNm: number = 50
): RoutePoint[] {
  const route: RoutePoint[] = [];
  
  // Convert to radians
  const lat1 = depLat * Math.PI / 180;
  const lon1 = depLon * Math.PI / 180;
  const lat2 = arrLat * Math.PI / 180;
  const lon2 = arrLon * Math.PI / 180;
  
  // Calculate total distance
  const totalDistanceKm = calculateDistance(depLat, depLon, arrLat, arrLon);
  const totalDistanceNm = kmToNm(totalDistanceKm);
  
  // Calculate initial bearing
  const dLon = lon2 - lon1;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const initialBearing = Math.atan2(y, x) * 180 / Math.PI;
  const normalizedBearing = (initialBearing + 360) % 360;
  
  // Add departure point
  route.push({
    lat: depLat,
    lon: depLon,
    distance: 0,
    bearing: normalizedBearing
  });
  
  // Calculate intermediate points
  const numPoints = Math.floor(totalDistanceNm / intervalNm);
  
  for (let i = 1; i <= numPoints; i++) {
    const fraction = (i * intervalNm) / totalDistanceNm;
    
    // Calculate intermediate point using great circle interpolation
    const a = Math.sin((1 - fraction) * Math.acos(Math.sin(lat1) * Math.sin(lat2) + 
               Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1))) / 
               Math.sin(Math.acos(Math.sin(lat1) * Math.sin(lat2) + 
               Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1)));
    const b = Math.sin(fraction * Math.acos(Math.sin(lat1) * Math.sin(lat2) + 
               Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1))) / 
               Math.sin(Math.acos(Math.sin(lat1) * Math.sin(lat2) + 
               Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1)));
    
    const x = a * Math.cos(lat1) * Math.cos(lon1) + b * Math.cos(lat2) * Math.cos(lon2);
    const y = a * Math.cos(lat1) * Math.sin(lon1) + b * Math.cos(lat2) * Math.sin(lon2);
    const z = a * Math.sin(lat1) + b * Math.sin(lat2);
    
    const lat = Math.atan2(z, Math.sqrt(x * x + y * y)) * 180 / Math.PI;
    const lon = Math.atan2(y, x) * 180 / Math.PI;
    
    route.push({
      lat,
      lon,
      distance: i * intervalNm,
      bearing: normalizedBearing
    });
  }
  
  // Add arrival point
  route.push({
    lat: arrLat,
    lon: arrLon,
    distance: totalDistanceNm,
    bearing: normalizedBearing
  });
  
  return route;
}

/**
 * Check if a point is within a route corridor
 */
export function isPointInCorridor(
  pointLat: number,
  pointLon: number,
  route: RoutePoint[],
  corridorWidthNm: number
): boolean {
  // Check distance to each segment of the route
  for (let i = 0; i < route.length - 1; i++) {
    const segmentStart = route[i];
    const segmentEnd = route[i + 1];
    
    // Calculate perpendicular distance to segment
    const distanceToSegment = calculateDistanceToSegment(
      pointLat,
      pointLon,
      segmentStart.lat,
      segmentStart.lon,
      segmentEnd.lat,
      segmentEnd.lon
    );
    
    if (kmToNm(distanceToSegment) <= corridorWidthNm / 2) {
      return true;
    }
  }
  
  return false;
}

/**
 * Calculate perpendicular distance from a point to a line segment
 */
function calculateDistanceToSegment(
  pointLat: number,
  pointLon: number,
  segmentStartLat: number,
  segmentStartLon: number,
  segmentEndLat: number,
  segmentEndLon: number
): number {
  const A = calculateDistance(pointLat, pointLon, segmentStartLat, segmentStartLon);
  const B = calculateDistance(pointLat, pointLon, segmentEndLat, segmentEndLon);
  const C = calculateDistance(segmentStartLat, segmentStartLon, segmentEndLat, segmentEndLon);
  
  if (C === 0) return A;
  
  const s = (A + B + C) / 2;
  const area = Math.sqrt(Math.max(0, s * (s - A) * (s - B) * (s - C)));
  const distance = (2 * area) / C;
  
  return distance;
}

/**
 * Filter PIREPs along a specific route corridor
 */
export async function getRoutePIREPs(
  route: RoutePoint[],
  options: RouteCorridorOptions
): Promise<PIREP[]> {
  // Fetch all PIREPs
  const allPIREPs = await fetchPIREPs();
  
  // Filter PIREPs within route corridor and altitude range
  const routePIREPs = allPIREPs.filter(pirep => {
    // Check if PIREP is within the route corridor
    if (!isPointInCorridor(pirep.latitude, pirep.longitude, route, options.widthNm)) {
      return false;
    }
    
    // Check altitude
    if (pirep.altitude_ft_msl < options.altitudeMin || 
        pirep.altitude_ft_msl > options.altitudeMax) {
      return false;
    }
    
    return true;
  });
  
  // Sort by proximity to route centerline
  routePIREPs.sort((a, b) => {
    const distA = Math.min(...route.map(point => 
      calculateDistance(a.latitude, a.longitude, point.lat, point.lon)
    ));
    const distB = Math.min(...route.map(point => 
      calculateDistance(b.latitude, b.longitude, point.lat, point.lon)
    ));
    return distA - distB;
  });
  
  return routePIREPs;
}

/**
 * Analyze jet stream interaction with route
 */
export async function analyzeJetStream(
  route: RoutePoint[],
  cruiseAltitude: number
): Promise<JetStreamData> {
  // Typical jet stream altitudes: 25,000-40,000 feet
  const jetStreamMinAlt = 25000;
  const jetStreamMaxAlt = 40000;
  
  // Check if cruise altitude is in jet stream range
  const inJetStreamAltitude = cruiseAltitude >= jetStreamMinAlt && 
                               cruiseAltitude <= jetStreamMaxAlt;
  
  if (!inJetStreamAltitude) {
    return {
      present: false,
      altitude: 0,
      windSpeed: 0,
      direction: 0,
      intersectsRoute: false,
      turbulencePotential: 'low'
    };
  }
  
  // For demo purposes, simulate jet stream data
  // In production, this would fetch actual wind data from aviation weather APIs
  const jetStreamData: JetStreamData = {
    present: true,
    altitude: 35000,
    windSpeed: 120, // knots - typical jet stream speed
    direction: 270, // westerly
    intersectsRoute: true,
    turbulencePotential: 'moderate'
  };
  
  // Determine turbulence potential based on wind speed
  if (jetStreamData.windSpeed > 150) {
    jetStreamData.turbulencePotential = 'high';
  } else if (jetStreamData.windSpeed > 100) {
    jetStreamData.turbulencePotential = 'moderate';
  } else {
    jetStreamData.turbulencePotential = 'low';
  }
  
  return jetStreamData;
}

/**
 * Analyze weather gradients for turbulence potential
 */
export function analyzeWeatherGradients(
  departureMETAR: any,
  arrivalMETAR: any,
  routeMETARs: any[]
): { potential: 'low' | 'moderate' | 'high'; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;
  
  // Check temperature gradients
  if (departureMETAR && arrivalMETAR) {
    const tempDiff = Math.abs(departureMETAR.temp_c - arrivalMETAR.temp_c);
    if (tempDiff > 20) {
      reasons.push('Significant temperature gradient along route');
      score += 3;
    } else if (tempDiff > 10) {
      reasons.push('Moderate temperature gradient');
      score += 1;
    }
  }
  
  // Check wind differences
  if (departureMETAR?.wind_speed_kt && arrivalMETAR?.wind_speed_kt) {
    const windDiff = Math.abs(departureMETAR.wind_speed_kt - arrivalMETAR.wind_speed_kt);
    if (windDiff > 30) {
      reasons.push('Strong wind gradient');
      score += 3;
    } else if (windDiff > 15) {
      reasons.push('Moderate wind gradient');
      score += 2;
    }
  }
  
  // Check for frontal activity
  const hasThunderstorms = [departureMETAR, arrivalMETAR, ...routeMETARs].some(
    m => m?.weather_string?.includes('TS')
  );
  if (hasThunderstorms) {
    reasons.push('Thunderstorms along route');
    score += 5;
  }
  
  // Determine potential
  let potential: 'low' | 'moderate' | 'high';
  if (score >= 6) {
    potential = 'high';
  } else if (score >= 3) {
    potential = 'moderate';
  } else {
    potential = 'low';
  }
  
  if (reasons.length === 0) {
    reasons.push('Stable weather conditions along route');
  }
  
  return { potential, reasons };
}

/**
 * Generate comprehensive turbulence report for a flight route
 */
export async function generateEnhancedTurbulenceReport(
  departureAirport: { code: string; lat: number; lon: number },
  arrivalAirport: { code: string; lat: number; lon: number },
  currentPosition: { lat: number; lon: number; altitude: number },
  cruiseAltitude: number,
  groundSpeed: number = 450 // knots
): Promise<EnhancedTurbulenceReport> {
  try {
    // Calculate route
    const route = calculateGreatCircleRoute(
      departureAirport.lat,
      departureAirport.lon,
      arrivalAirport.lat,
      arrivalAirport.lon
    );
    
    // Define route corridor
    const corridorOptions: RouteCorridorOptions = {
      widthNm: 100,
      altitudeMin: 0,
      altitudeMax: 45000
    };
    
    // Fetch all data in parallel
    const [routePIREPs, sigmets, airmets, jetStream] = await Promise.all([
      getRoutePIREPs(route, corridorOptions),
      fetchSIGMETs(),
      fetchAIRMETs(),
      analyzeJetStream(route, cruiseAltitude)
    ]);
    
    // Filter turbulence-related data
    const turbulencePIREPs = routePIREPs.filter(p => 
      p.turbulence_intensity && p.turbulence_intensity !== 'NEG'
    );
    
    const turbulenceSIGMETs = sigmets.filter(s => 
      s.hazard?.includes('TURB') || s.hazard?.includes('MTN WAVE')
    );
    
    const turbulenceAIRMETs = airmets.filter(a => 
      a.hazard?.includes('TURB')
    );
    
    // Identify hot spots
    const hotSpots: TurbulenceHotSpot[] = [];
    
    // Add PIREP-based hot spots
    turbulencePIREPs.forEach(pirep => {
      const distance = calculateDistance(
        currentPosition.lat,
        currentPosition.lon,
        pirep.latitude,
        pirep.longitude
      );
      
      const intensity = mapIntensityToLevel(pirep.turbulence_intensity || 'LGT');
      
      hotSpots.push({
        location: { lat: pirep.latitude, lon: pirep.longitude },
        altitudeRange: {
          min: pirep.turbulence_base_ft_msl || pirep.altitude_ft_msl - 2000,
          max: pirep.turbulence_top_ft_msl || pirep.altitude_ft_msl + 2000
        },
        intensity,
        type: TURBULENCE_TYPE_MAP[pirep.turbulence_type || ''] || 'General',
        source: 'PIREP',
        distance: kmToNm(distance),
        timeToEncounter: groundSpeed > 0 ? (kmToNm(distance) / groundSpeed) * 60 : undefined,
        confidence: 'high',
        description: formatPIREP(pirep)
      });
    });
    
    // Add jet stream hot spot if applicable
    if (jetStream.intersectsRoute && jetStream.turbulencePotential !== 'low') {
      hotSpots.push({
        location: { lat: currentPosition.lat, lon: currentPosition.lon },
        altitudeRange: {
          min: jetStream.altitude - 3000,
          max: jetStream.altitude + 3000
        },
        intensity: jetStream.turbulencePotential === 'high' ? 'severe' : 'moderate',
        type: 'Clear Air Turbulence',
        source: 'JetStream',
        distance: 0,
        confidence: 'medium',
        description: `Jet stream at FL${Math.round(jetStream.altitude/100)}, winds ${jetStream.windSpeed}kt`
      });
    }
    
    // Sort hot spots by distance
    hotSpots.sort((a, b) => a.distance - b.distance);
    
    // Determine current conditions
    const nearbyTurbulence = turbulencePIREPs.filter(p => {
      const distance = calculateDistance(currentPosition.lat, currentPosition.lon, p.latitude, p.longitude);
      const altDiff = Math.abs(currentPosition.altitude - p.altitude_ft_msl);
      return kmToNm(distance) < 50 && altDiff < 5000;
    });
    
    let currentOverall: 'smooth' | 'light' | 'moderate' | 'severe' | 'extreme' = 'smooth';
    if (nearbyTurbulence.some(p => p.turbulence_intensity === 'EXTRM')) {
      currentOverall = 'extreme';
    } else if (nearbyTurbulence.some(p => p.turbulence_intensity === 'SEV')) {
      currentOverall = 'severe';
    } else if (nearbyTurbulence.some(p => p.turbulence_intensity === 'MOD' || p.turbulence_intensity === 'MOD-SEV')) {
      currentOverall = 'moderate';
    } else if (nearbyTurbulence.some(p => p.turbulence_intensity === 'LGT' || p.turbulence_intensity === 'LGT-MOD')) {
      currentOverall = 'light';
    }
    
    // Generate forecast
    const forecast = {
      takeoff: { intensity: 'Light', probability: 20 },
      climb: { intensity: 'Light to Moderate', probability: 30 },
      cruise: { 
        intensity: jetStream.turbulencePotential === 'high' ? 'Moderate' : 'Light',
        probability: jetStream.turbulencePotential === 'high' ? 60 : 25
      },
      descent: { intensity: 'Light', probability: 25 },
      approach: { intensity: 'Light', probability: 20 }
    };
    
    // Generate altitude recommendations
    const altitudeRecommendations = {
      optimal: cruiseAltitude,
      avoid: [] as Array<{ min: number; max: number; reason: string }>,
      alternates: [] as Array<{ altitude: number; conditions: string }>
    };
    
    // Add jet stream avoidance if necessary
    if (jetStream.turbulencePotential === 'high') {
      altitudeRecommendations.avoid.push({
        min: jetStream.altitude - 3000,
        max: jetStream.altitude + 3000,
        reason: 'Strong jet stream turbulence'
      });
      
      altitudeRecommendations.alternates.push({
        altitude: jetStream.altitude - 5000,
        conditions: 'Below jet stream, smoother conditions'
      });
    }
    
    // Calculate confidence metrics
    const dataAge = turbulencePIREPs.length > 0 
      ? Math.round((Date.now() - new Date(turbulencePIREPs[0].observation_time).getTime()) / 60000)
      : 999;
    
    let confidenceLevel: 'low' | 'medium' | 'high' = 'medium';
    const dataPoints = turbulencePIREPs.length + turbulenceSIGMETs.length + turbulenceAIRMETs.length;
    
    if (dataPoints > 10 && dataAge < 30) {
      confidenceLevel = 'high';
    } else if (dataPoints < 3 || dataAge > 180) {
      confidenceLevel = 'low';
    }
    
    const confidence = {
      level: confidenceLevel,
      dataPoints: dataPoints,
      coverage: Math.min(100, (turbulencePIREPs.length * 10)),
      age: dataAge < 30 ? 'Very recent' : dataAge < 60 ? 'Recent' : dataAge < 180 ? 'Moderate' : 'Dated'
    };
    
    // Generate summary
    let summary = '';
    if (currentOverall === 'extreme') {
      summary = 'Extreme turbulence reported! Expect very rough conditions.';
    } else if (currentOverall === 'severe') {
      summary = 'Significant turbulence reported along your route. Expect rough conditions.';
    } else if (currentOverall === 'moderate') {
      summary = 'Moderate turbulence likely. Keep seatbelts fastened and secure loose items.';
    } else if (currentOverall === 'light') {
      summary = 'Light chop expected, typical for this route and altitude.';
    } else {
      summary = 'Smooth conditions anticipated for most of the flight.';
    }
    
    if (hotSpots.length > 0) {
      summary += ` ${hotSpots.length} area${hotSpots.length > 1 ? 's' : ''} of potential turbulence identified.`;
    }
    
    // Generate recommendations
    const recommendations: string[] = [];
    
    if (currentOverall === 'extreme') {
      recommendations.push('Remain seated with seatbelt tightly fastened');
      recommendations.push('Flight crew will suspend all service');
      recommendations.push('Secure all items and brace for severe turbulence');
    } else if (currentOverall === 'severe') {
      recommendations.push('Remain seated with seatbelt fastened');
      recommendations.push('Flight attendants may suspend service');
      recommendations.push('Secure all loose items immediately');
    } else if (currentOverall === 'moderate') {
      recommendations.push('Keep seatbelt fastened when seated');
      recommendations.push('Use caution when moving about the cabin');
    } else {
      recommendations.push('Normal precautions - keep seatbelt loosely fastened');
    }
    
    if (jetStream.intersectsRoute && jetStream.turbulencePotential !== 'low') {
      recommendations.push(`Expect clear air turbulence near FL${Math.round(cruiseAltitude/100)}`);
    }
    
    return {
      currentConditions: {
        overall: currentOverall,
        recentPIREPs: turbulencePIREPs.slice(0, 5),
        activeSIGMETs: turbulenceSIGMETs,
        activeAIRMETs: turbulenceAIRMETs
      },
      forecast,
      hotSpots: hotSpots.slice(0, 5), // Limit to top 5
      altitudeRecommendations,
      confidence,
      summary,
      recommendations
    };
    
  } catch (error) {
    console.error('Error generating enhanced turbulence report:', error);
    
    // Return default report
    return {
      currentConditions: {
        overall: 'smooth',
        recentPIREPs: [],
        activeSIGMETs: [],
        activeAIRMETs: []
      },
      forecast: {
        takeoff: { intensity: 'Light', probability: 15 },
        climb: { intensity: 'Light', probability: 20 },
        cruise: { intensity: 'None to Light', probability: 10 },
        descent: { intensity: 'Light', probability: 20 },
        approach: { intensity: 'Light', probability: 15 }
      },
      hotSpots: [],
      altitudeRecommendations: {
        optimal: cruiseAltitude,
        avoid: [],
        alternates: []
      },
      confidence: {
        level: 'low',
        dataPoints: 0,
        coverage: 0,
        age: 'Unknown'
      },
      summary: 'Limited turbulence data available. Expect typical conditions for this route.',
      recommendations: ['Keep seatbelt fastened when seated as standard precaution']
    };
  }
}

/**
 * Map intensity string to level
 */
function mapIntensityToLevel(intensity: string): 'light' | 'moderate' | 'severe' | 'extreme' {
  if (intensity === 'EXTRM') return 'extreme';
  if (intensity === 'SEV' || intensity === 'MOD-SEV') return 'severe';
  if (intensity === 'MOD' || intensity === 'LGT-MOD') return 'moderate';
  return 'light';
}