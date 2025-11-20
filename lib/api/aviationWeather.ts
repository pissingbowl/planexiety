// lib/api/aviationWeather.ts

export interface METARData {
  raw_text: string;
  station_id: string;
  observation_time: string;
  temp_c: number;
  dewpoint_c: number;
  wind_dir_degrees?: number;
  wind_speed_kt?: number;
  wind_gust_kt?: number;
  visibility_statute_mi?: number;
  altimeter_in_hg?: number;
  sea_level_pressure_mb?: number;
  flight_category: 'VFR' | 'MVFR' | 'IFR' | 'LIFR';
  sky_condition: Array<{
    sky_cover: string;
    cloud_base_ft_agl?: number;
  }>;
  weather_string?: string;
  human_readable?: {
    temperature: string;
    dewpoint: string;
    wind: string;
    visibility: string;
    altimeter: string;
    sky: string;
    weather: string;
    category: string;
    time: string;
  };
}

export interface TAFData {
  raw_text: string;
  station_id: string;
  issue_time: string;
  valid_time_from: string;
  valid_time_to: string;
  forecast: Array<{
    time_from: string;
    time_to: string;
    change_indicator?: string;
    wind_dir_degrees?: number;
    wind_speed_kt?: number;
    wind_gust_kt?: number;
    visibility_statute_mi?: number;
    sky_condition?: Array<{
      sky_cover: string;
      cloud_base_ft_agl?: number;
    }>;
    weather_string?: string;
    human_readable?: {
      time: string;
      wind: string;
      visibility: string;
      sky: string;
      weather: string;
      change: string;
    };
  }>;
  human_readable?: {
    issued: string;
    validFrom: string;
    validTo: string;
  };
}

// Cache weather data to avoid excessive API calls
const weatherCache = new Map<string, { data: any; timestamp: number }>();
const WEATHER_CACHE_DURATION = 300000; // 5 minutes

/**
 * Parse METAR sky conditions to human-readable format
 */
function parseSkyConditions(conditions: Array<{ sky_cover: string; cloud_base_ft_agl?: number }>): string {
  if (!conditions || conditions.length === 0) return 'Clear skies';
  
  const descriptions = conditions.map(condition => {
    const cover = {
      'CLR': 'Clear',
      'SKC': 'Clear',
      'FEW': 'Few clouds',
      'SCT': 'Scattered clouds',
      'BKN': 'Broken clouds',
      'OVC': 'Overcast',
    }[condition.sky_cover] || condition.sky_cover;
    
    if (condition.cloud_base_ft_agl) {
      return `${cover} at ${condition.cloud_base_ft_agl.toLocaleString()} ft`;
    }
    return cover;
  });
  
  return descriptions.join(', ');
}

/**
 * Parse weather phenomena codes to human-readable format
 */
function parseWeatherString(weather: string): string {
  if (!weather) return '';
  
  const phenomena: Record<string, string> = {
    // Intensity
    '-': 'Light',
    '+': 'Heavy',
    'VC': 'In vicinity',
    
    // Descriptors
    'MI': 'Shallow',
    'PR': 'Partial',
    'BC': 'Patches',
    'DR': 'Low drifting',
    'BL': 'Blowing',
    'SH': 'Showers',
    'TS': 'Thunderstorm',
    'FZ': 'Freezing',
    
    // Precipitation
    'DZ': 'drizzle',
    'RA': 'rain',
    'SN': 'snow',
    'SG': 'snow grains',
    'IC': 'ice crystals',
    'PL': 'ice pellets',
    'GR': 'hail',
    'GS': 'small hail',
    'UP': 'unknown precipitation',
    
    // Obscuration
    'BR': 'mist',
    'FG': 'fog',
    'FU': 'smoke',
    'VA': 'volcanic ash',
    'DU': 'dust',
    'SA': 'sand',
    'HZ': 'haze',
    'PY': 'spray',
    
    // Other
    'PO': 'dust whirls',
    'SQ': 'squalls',
    'FC': 'funnel cloud',
    'SS': 'sandstorm',
    'DS': 'duststorm',
  };
  
  let result = weather;
  Object.entries(phenomena).forEach(([code, description]) => {
    result = result.replace(code, description + ' ');
  });
  
  return result.trim();
}

/**
 * Convert temperature to both Celsius and Fahrenheit
 */
function formatTemperature(tempC: number): string {
  const tempF = (tempC * 9/5) + 32;
  return `${Math.round(tempC)}°C (${Math.round(tempF)}°F)`;
}

/**
 * Convert visibility to readable format
 */
function formatVisibility(visibilityMi?: number): string {
  if (!visibilityMi) return 'Unknown';
  if (visibilityMi >= 10) return '10+ miles';
  return `${visibilityMi} mile${visibilityMi !== 1 ? 's' : ''}`;
}

/**
 * Format wind information
 */
function formatWind(dir?: number, speed?: number, gust?: number): string {
  if (!speed) return 'Calm';
  
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = dir ? Math.round(dir / 22.5) % 16 : 0;
  const dirStr = dir ? directions[index] : 'Variable';
  
  let result = `${dirStr} at ${speed} knots`;
  if (gust) {
    result += `, gusting to ${gust} knots`;
  }
  return result;
}

/**
 * Fetch METAR (current weather) data for an airport
 */
export async function fetchMETAR(airportCode: string): Promise<METARData | null> {
  const cacheKey = `metar_${airportCode}`;
  const cached = weatherCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < WEATHER_CACHE_DURATION) {
    console.log('Returning cached METAR for', airportCode);
    return cached.data;
  }
  
  try {
    // Use our API route instead of direct external API call
    const url = `/api/aviation-weather?type=metar&ids=${airportCode}&format=json`;
    console.log('Fetching METAR from:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('METAR API error:', response.status);
      return null;
    }
    
    const responseData = await response.json();
    
    // Extract the actual weather data from our API response
    const data = responseData.data;
    
    if (data && data.length > 0) {
      const metar = data[0];
      
      // Add human-readable interpretation
      const humanReadable = {
        temperature: formatTemperature(metar.temp_c),
        dewpoint: formatTemperature(metar.dewpoint_c),
        wind: formatWind(metar.wind_dir_degrees, metar.wind_speed_kt, metar.wind_gust_kt),
        visibility: formatVisibility(metar.visibility_statute_mi),
        altimeter: metar.altimeter_in_hg ? `${metar.altimeter_in_hg}" Hg` : 'Unknown',
        sky: parseSkyConditions(metar.sky_condition),
        weather: parseWeatherString(metar.weather_string),
        category: metar.flight_category,
        time: new Date(metar.observation_time).toLocaleString(),
      };
      
      const result = {
        ...metar,
        human_readable: humanReadable,
      };
      
      weatherCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    }
    
    return null;
    
  } catch (error) {
    console.error('Error fetching METAR:', error);
    return null;
  }
}

/**
 * Fetch TAF (forecast) data for an airport
 */
export async function fetchTAF(airportCode: string): Promise<TAFData | null> {
  const cacheKey = `taf_${airportCode}`;
  const cached = weatherCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < WEATHER_CACHE_DURATION) {
    console.log('Returning cached TAF for', airportCode);
    return cached.data;
  }
  
  try {
    // Use our API route instead of direct external API call
    const url = `/api/aviation-weather?type=taf&ids=${airportCode}&format=json`;
    console.log('Fetching TAF from:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('TAF API error:', response.status);
      return null;
    }
    
    const responseData = await response.json();
    
    // Extract the actual weather data from our API response
    const data = responseData.data;
    
    if (data && data.length > 0) {
      const taf = data[0];
      
      // Parse forecast periods
      const parsedForecast = taf.forecast?.map((period: any) => ({
        ...period,
        human_readable: {
          time: `${new Date(period.time_from).toLocaleTimeString()} - ${new Date(period.time_to).toLocaleTimeString()}`,
          wind: formatWind(period.wind_dir_degrees, period.wind_speed_kt, period.wind_gust_kt),
          visibility: formatVisibility(period.visibility_statute_mi),
          sky: parseSkyConditions(period.sky_condition),
          weather: parseWeatherString(period.weather_string),
          change: period.change_indicator || '',
        },
      }));
      
      const result = {
        ...taf,
        forecast: parsedForecast,
        human_readable: {
          issued: new Date(taf.issue_time).toLocaleString(),
          validFrom: new Date(taf.valid_time_from).toLocaleString(),
          validTo: new Date(taf.valid_time_to).toLocaleString(),
        },
      };
      
      weatherCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    }
    
    return null;
    
  } catch (error) {
    console.error('Error fetching TAF:', error);
    return null;
  }
}

/**
 * Get weather summary for both departure and arrival airports
 */
export async function getFlightWeatherSummary(
  departureAirport: string,
  arrivalAirport: string
): Promise<{
  departure: { metar: METARData | null; taf: TAFData | null };
  arrival: { metar: METARData | null; taf: TAFData | null };
  summary: string;
} | null> {
  try {
    // Fetch all weather data in parallel
    const [depMETAR, depTAF, arrMETAR, arrTAF] = await Promise.all([
      fetchMETAR(departureAirport),
      fetchTAF(departureAirport),
      fetchMETAR(arrivalAirport),
      fetchTAF(arrivalAirport),
    ]);
    
    // Generate summary
    let summary = '';
    
    if (depMETAR) {
      summary += `Departure (${departureAirport}): ${depMETAR.flight_category} conditions, `;
      summary += `${depMETAR.human_readable?.temperature}, `;
      summary += `${depMETAR.human_readable?.wind}. `;
    }
    
    if (arrMETAR) {
      summary += `Arrival (${arrivalAirport}): ${arrMETAR.flight_category} conditions, `;
      summary += `${arrMETAR.human_readable?.temperature}, `;
      summary += `${arrMETAR.human_readable?.wind}.`;
    }
    
    if (!depMETAR && !arrMETAR) {
      summary = 'Weather data temporarily unavailable.';
    }
    
    return {
      departure: { metar: depMETAR, taf: depTAF },
      arrival: { metar: arrMETAR, taf: arrTAF },
      summary,
    };
    
  } catch (error) {
    console.error('Error fetching flight weather summary:', error);
    return null;
  }
}

/**
 * Check if weather conditions might cause turbulence
 */
export function assessTurbulencePotential(metar: METARData): {
  level: 'low' | 'moderate' | 'high';
  reasons: string[];
} {
  const reasons: string[] = [];
  let score = 0;
  
  // Check wind conditions
  if (metar.wind_speed_kt && metar.wind_speed_kt > 25) {
    reasons.push(`Strong winds (${metar.wind_speed_kt} kt)`);
    score += 2;
  }
  
  if (metar.wind_gust_kt && metar.wind_gust_kt > 30) {
    reasons.push(`Wind gusts (${metar.wind_gust_kt} kt)`);
    score += 3;
  }
  
  // Check for convective activity
  if (metar.weather_string?.includes('TS')) {
    reasons.push('Thunderstorms in area');
    score += 5;
  }
  
  if (metar.weather_string?.includes('CB')) {
    reasons.push('Cumulonimbus clouds');
    score += 4;
  }
  
  // Check visibility (could indicate weather fronts)
  if (metar.visibility_statute_mi && metar.visibility_statute_mi < 3) {
    reasons.push('Low visibility conditions');
    score += 1;
  }
  
  // Determine level
  let level: 'low' | 'moderate' | 'high';
  if (score >= 6) {
    level = 'high';
  } else if (score >= 3) {
    level = 'moderate';
  } else {
    level = 'low';
  }
  
  if (reasons.length === 0) {
    reasons.push('Clear conditions with minimal turbulence expected');
  }
  
  return { level, reasons };
}