#!/usr/bin/env node

/**
 * PlaneXiety Test Setup Script
 * Creates test user and flight data in Supabase
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Use proper UUIDs (let Postgres generate them, or use these fixed UUIDs for testing)
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';
const TEST_FLIGHT_ID = '00000000-0000-0000-0000-000000000002';

// Test user configuration
const TEST_USER = {
  user_id: TEST_USER_ID,
  user_name: 'Sarah Chen',
  email: 'sarah.test@planexiety.com',
  age: 32,
  fear_archetype: {
    control: 85,
    somatic: 60,
    cognitive: 45,
    trust: 70,
    trauma: 20,
  },
  preferences: {
    preferred_mode: null,
    verbosity: 'moderate',
    humor_tolerance: 'medium',
    language: 'en-US',
  },
  flight_count: 3,
  total_anxiety_reduction: 12.5,
  avg_regulation_time: 420,
  graduation_progress: 0.25,
  timezone: 'America/Chicago',
};

// Test flight configuration
const TEST_FLIGHT = {
  flight_id: TEST_FLIGHT_ID,
  user_id: TEST_USER_ID,
  flight_number: 4,
  flight_code: 'UA1549',
  route: 'ORD → LAX',
  aircraft_type: 'Boeing 737-900',
  seat_position: '14A',
  flight_date: new Date().toISOString().split('T')[0],
  departure_time: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  arrival_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
  completed: false,
  peak_anxiety: null,
  avg_anxiety: null,
  regulation_time: null,
  tools_used: null,
  charlie_handoff: false,
  weather_departure: 'Clear, light winds',
  weather_arrival: 'Partly cloudy',
  turbulence_experienced: null,
  notes: 'Test flight for system validation',
};

// Initial emotional snapshots (Postgres will generate UUIDs)
const INITIAL_SNAPSHOTS = [
  {
    flight_id: TEST_FLIGHT_ID,
    user_id: TEST_USER_ID,
    timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    flight_phase: 'boarding',
    time_in_phase: 300,
    anxiety_level: 6,
    anxiety_trend: 'stable',
    anxiety_ddt: 0,
    anxiety_d2dt2: 0,
    heart_rate: 88,
    heart_rate_baseline: 72,
  },
  {
    flight_id: TEST_FLIGHT_ID,
    user_id: TEST_USER_ID,
    timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    flight_phase: 'door_close',
    time_in_phase: 120,
    anxiety_level: 7,
    anxiety_trend: 'rising',
    anxiety_ddt: 0.2,
    anxiety_d2dt2: 0.1,
    heart_rate: 95,
    heart_rate_baseline: 72,
  },
  {
    flight_id: TEST_FLIGHT_ID,
    user_id: TEST_USER_ID,
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    flight_phase: 'takeoff',
    time_in_phase: 180,
    anxiety_level: 8,
    anxiety_trend: 'rising',
    anxiety_ddt: 0.5,
    anxiety_d2dt2: 0.2,
    heart_rate: 108,
    heart_rate_baseline: 72,
  },
  {
    flight_id: TEST_FLIGHT_ID,
    user_id: TEST_USER_ID,
    timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    flight_phase: 'climb',
    time_in_phase: 600,
    anxiety_level: 6,
    anxiety_trend: 'falling',
    anxiety_ddt: -0.3,
    anxiety_d2dt2: -0.1,
    heart_rate: 85,
    heart_rate_baseline: 72,
  },
  {
    flight_id: TEST_FLIGHT_ID,
    user_id: TEST_USER_ID,
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    flight_phase: 'cruise',
    time_in_phase: 300,
    anxiety_level: 5,
    anxiety_trend: 'stable',
    anxiety_ddt: 0,
    anxiety_d2dt2: 0,
    heart_rate: 78,
    heart_rate_baseline: 72,
  },
];

async function setupTestData() {
  console.log('🚀 PlaneXiety Test Setup Starting...\n');
  
  // Create test user
  console.log('👤 Creating test user: Sarah Chen');
  const { data: user, error: userError } = await supabase
    .from('users')
    .upsert([TEST_USER])
    .select()
    .single();
  
  if (userError) {
    console.error('❌ Failed to create user:', userError);
    return;
  }
  
  console.log('✅ User created:', user.user_id);
  
  // Create test flight
  console.log('\n✈️  Creating test flight: UA1549 (ORD → LAX)');
  const { data: flight, error: flightError } = await supabase
    .from('flights')
    .upsert([TEST_FLIGHT])
    .select()
    .single();
  
  if (flightError) {
    console.error('❌ Failed to create flight:', flightError);
    return;
  }
  
  console.log('✅ Flight created:', flight.flight_code);
  
  // Create emotional snapshots
  console.log('\n📊 Creating emotional snapshots');
  const { data: snapshots, error: snapshotError } = await supabase
    .from('emotional_snapshots')
    .upsert(INITIAL_SNAPSHOTS)
    .select();
  
  if (snapshotError) {
    console.error('❌ Failed to create snapshots:', snapshotError);
    return;
  }
  
  console.log(`✅ Created ${snapshots?.length} emotional snapshots\n`);
  
  console.log('═══════════════════════════════════════════════════════');
  console.log('✅ Test setup complete!\n');
  console.log('Test user ID:', TEST_USER_ID);
  console.log('Test flight: UA1549 (currently at cruise)');
  console.log('Current anxiety: 5/10 (stable)');
  console.log('\nNext: Test the system at http://localhost:3001');
  console.log('═══════════════════════════════════════════════════════\n');
}

setupTestData().catch(console.error);
