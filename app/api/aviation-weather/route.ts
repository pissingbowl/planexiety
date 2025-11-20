// app/api/aviation-weather/route.ts

import { NextRequest, NextResponse } from 'next/server';

// Aviation Weather API base URL
const AVIATION_WEATHER_BASE = 'https://aviationweather.gov/api/data';

/**
 * GET handler for aviation weather data proxy
 * Handles METAR, TAF, PIREP, SIGMET, and AIRMET requests
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const dataType = searchParams.get('type') || 'metar';
    const ids = searchParams.get('ids');
    const format = searchParams.get('format') || 'json';
    
    // Build the appropriate URL based on data type
    let url: string;
    const params = new URLSearchParams();
    params.set('format', format);
    
    switch (dataType.toLowerCase()) {
      case 'metar':
        url = `${AVIATION_WEATHER_BASE}/metar`;
        if (ids) params.set('ids', ids);
        break;
        
      case 'taf':
        url = `${AVIATION_WEATHER_BASE}/taf`;
        if (ids) params.set('ids', ids);
        break;
        
      case 'pirep':
        url = `${AVIATION_WEATHER_BASE}/pirep`;
        // PIREPs don't typically filter by IDs, but may have other params
        break;
        
      case 'sigmet':
        url = `${AVIATION_WEATHER_BASE}/airsigmet`;
        params.set('type', 'sigmet');
        break;
        
      case 'airmet':
        url = `${AVIATION_WEATHER_BASE}/airsigmet`;
        params.set('type', 'airmet');
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid data type specified' },
          { status: 400 }
        );
    }
    
    // Construct the full URL with parameters
    const fullUrl = `${url}?${params.toString()}`;
    console.log('Fetching aviation weather data from:', fullUrl);
    
    // Fetch data from the aviation weather API
    const response = await fetch(fullUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'OTIE-Flight-Companion/1.0',
      },
      next: {
        revalidate: 300, // Cache for 5 minutes
      },
    });
    
    if (!response.ok) {
      console.error('Aviation Weather API error:', response.status, response.statusText);
      
      // Return appropriate error message
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Weather data not found for the specified location' },
          { status: 404 }
        );
      } else if (response.status === 503) {
        return NextResponse.json(
          { error: 'Aviation Weather service temporarily unavailable' },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { error: `Aviation Weather API error: ${response.status}` },
        { status: response.status }
      );
    }
    
    // Parse the response
    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // If not JSON, return as text (some endpoints return XML or raw text)
      const text = await response.text();
      data = { raw: text };
    }
    
    // Add metadata to the response
    const enrichedResponse = {
      type: dataType,
      timestamp: new Date().toISOString(),
      data: data,
      success: true,
    };
    
    // Return the data with appropriate headers
    return NextResponse.json(enrichedResponse, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
    
  } catch (error) {
    console.error('Error in aviation-weather API route:', error);
    
    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { 
          error: 'Unable to connect to Aviation Weather service',
          details: 'The service might be temporarily unavailable. Please try again later.',
        },
        { status: 503 }
      );
    }
    
    // Generic error response
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * POST handler for batch weather requests
 * Allows fetching multiple weather data types in a single request
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requests } = body;
    
    if (!requests || !Array.isArray(requests)) {
      return NextResponse.json(
        { error: 'Invalid request format. Expected { requests: [...] }' },
        { status: 400 }
      );
    }
    
    // Process all requests in parallel
    const results = await Promise.allSettled(
      requests.map(async (req: any) => {
        const params = new URLSearchParams();
        params.set('format', 'json');
        
        let url: string;
        
        switch (req.type?.toLowerCase()) {
          case 'metar':
            url = `${AVIATION_WEATHER_BASE}/metar`;
            if (req.ids) params.set('ids', req.ids);
            break;
            
          case 'taf':
            url = `${AVIATION_WEATHER_BASE}/taf`;
            if (req.ids) params.set('ids', req.ids);
            break;
            
          case 'pirep':
            url = `${AVIATION_WEATHER_BASE}/pirep`;
            break;
            
          case 'sigmet':
            url = `${AVIATION_WEATHER_BASE}/airsigmet`;
            params.set('type', 'sigmet');
            break;
            
          case 'airmet':
            url = `${AVIATION_WEATHER_BASE}/airsigmet`;
            params.set('type', 'airmet');
            break;
            
          default:
            throw new Error(`Invalid data type: ${req.type}`);
        }
        
        const response = await fetch(`${url}?${params.toString()}`, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'OTIE-Flight-Companion/1.0',
          },
        });
        
        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }
        
        const data = await response.json();
        
        return {
          type: req.type,
          ids: req.ids,
          data: data,
        };
      })
    );
    
    // Format the results
    const formattedResults = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return {
          ...result.value,
          success: true,
        };
      } else {
        return {
          type: requests[index].type,
          ids: requests[index].ids,
          success: false,
          error: result.reason.message,
        };
      }
    });
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      results: formattedResults,
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
    
  } catch (error) {
    console.error('Error in aviation-weather POST handler:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}