// lib/db-types.ts

// Matches the `users` table
export interface DBUser {
  user_id: string;
  created_at: string;
  updated_at: string;
  user_name: string | null;
  email: string | null;
  age: number | null;
  fear_archetype: {
    control: number;
    somatic: number;
    cognitive: number;
    trust: number;
    trauma: number;
  };
  preferences: {
    preferred_mode: string | null;
    verbosity: string;
    humor_tolerance: string;
    language: string;
  };
  flight_count: number;
  total_anxiety_reduction: number;
  avg_regulation_time: number;
  graduation_progress: number;
  timezone: string | null;
  last_flight_date: string | null;
}

// Matches the `flights` table
export interface DBFlight {
  flight_id: string;
  user_id: string;
  flight_number: number;
  flight_code: string | null;
  route: string | null;
  aircraft_type: string | null;
  seat_position: string | null;
  flight_date: string;
  departure_time: string | null;
  arrival_time: string | null;
  created_at: string;
  peak_anxiety: number | null;
  avg_anxiety: number | null;
  regulation_time: number | null;
  tools_used: string[] | null;
  charlie_handoff: boolean;
  completed: boolean;
  weather_departure: string | null;
  weather_arrival: string | null;
  turbulence_experienced: string | null;
  notes: string | null;
}

// Matches the `emotional_snapshots` table
export interface DBEmotionalSnapshot {
  snapshot_id: string;
  flight_id: string;
  user_id: string;
  timestamp: string;
  flight_phase: string;
  time_in_phase: number | null;
  anxiety_level: number;
  anxiety_trend: string | null;
  anxiety_ddt: number | null;
  anxiety_d2dt2: number | null;
  heart_rate: number | null;
  heart_rate_baseline: number | null;
  hrv: number | null;
  respiratory_rate: number | null;
  skin_conductance: string | null;
  hr_ddt: number | null;
  hr_d2dt2: number | null;
  message_frequency: number | null;
  message_length_avg: number | null;
  response_latency: number | null;
  tool_usage_last_10min: number | null;
  catastrophizing: boolean | null;
  control_seeking: boolean | null;
  past_trigger_reference: boolean | null;
  dissociation_indicators: boolean | null;
  panic_language: boolean | null;
  altitude: number | null;
  speed: number | null;
  turbulence_forecast: string | null;
  full_state: any; // JSONB
}

// Matches the `interventions` table
export interface DBIntervention {
  intervention_id: string;
  snapshot_id: string;
  user_id: string;
  flight_id: string;
  timestamp: string;
  otie_mode: string;
  response_pattern: any; // JSONB
  tool_offered: string | null;
  tool_accepted: boolean | null;
  tool_launched: boolean;
  user_message: string | null;
  otie_response: string | null;
  charlie_handoff: boolean;
  charlie_reason: string | null;
  anxiety_before: number;
  anxiety_trend_before: string | null;
  anxiety_after: number | null;
  anxiety_trend_after: string | null;
  anxiety_drop: number | null;
  regulation_time: number | null;
  effective: boolean | null;
  proactive: boolean;
  flight_phase: string | null;
  anxiety_ddt_before: number | null;
  hr_ddt_before: number | null;
}
export interface DBAviationExplanation {
  explanation_id: string;      // UUID from the DB
  created_at: string;          // ISO timestamp

  // Classification
  category: 'sound' | 'motion' | 'smell' | 'visual';
  phenomenon_name: string;
  sensory_channel: 'auditory' | 'tactile' | 'visual' | 'olfactory';

  // Matching
  trigger_phrase: string;

  // Narrative Arc
  typical_fear_story: string | null;
  mundane_explanation: string;
  pilot_reality: string;
  everyday_analogy: string | null;

  // OTIE Voice
  otie_script_seed: string;

  // Metadata
  tags: string[] | null;
}

