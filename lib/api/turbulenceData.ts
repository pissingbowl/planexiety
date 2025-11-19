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

// Cache turbulence data
const turbulenceCache = new Map<string, { data: any; timestamp: number }>();
const TURBULENCE_CACHE_DURATION = 600000; // 10 minutes

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
    const url = `https://aviationweather.gov/api/data/pirep?format=json`;
    console.log('Fetching PIREPs from:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('PIREP API error:', response.status);
      return [];
    }
    
    const data = await response.json();
    
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
      
      turbulenceCache.set(cacheKey, { data: pireps, timestamp: Date.now() });
      return pireps;
    }
    
    return [];
    
  } catch (error) {
    console.error('Error fetching PIREPs:', error);
    return [];
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
    const url = `https://aviationweather.gov/api/data/airsigmet?format=json&type=sigmet`;
    console.log('Fetching SIGMETs from:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('SIGMET API error:', response.status);
      return [];
    }
    
    const data = await response.json();
    
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
      
      turbulenceCache.set(cacheKey, { data: sigmets, timestamp: Date.now() });
      return sigmets;
    }
    
    return [];
    
  } catch (error) {
    console.error('Error fetching SIGMETs:', error);
    return [];
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
    const url = `https://aviationweather.gov/api/data/airsigmet?format=json&type=airmet`;
    console.log('Fetching AIRMETs from:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('AIRMET API error:', response.status);
      return [];
    }
    
    const data = await response.json();
    
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
      
      turbulenceCache.set(cacheKey, { data: airmets, timestamp: Date.now() });
      return airmets;
    }
    
    return [];
    
  } catch (error) {
    console.error('Error fetching AIRMETs:', error);
    return [];
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