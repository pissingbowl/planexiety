// lib/mockUserState.ts
import type { UserState, FlightPhase } from "./EmotionalStateEngine";

// convenience so TS doesn't yell if we mistype a phase
const PHASE: FlightPhase = "door_close";

export const mockUserState: UserState = {
  // Identity
  identity: {
    user_id: "test-user-1",
    user_name: "Test User",
    age: 35,
  },

  // History
  flight_count: 1,
  flights: [
    {
      flight_number: 1,
      date: new Date().toISOString().slice(0, 10),
      peak_anxiety: 8,
      regulation_time: 15,
      tools_used: ["4-7-8_breathing"],
      charlie_handoff: false,
    },
  ],

  // Profile
  fear_archetype: {
    control: 80,
    somatic: 60,
    cognitive: 50,
    trust: 40,
    trauma: 20,
  },

  // Current State
  anxiety_level: 7,
  anxiety_history: [4, 5, 6, 7],
  anxiety_trend: "rising",
  anxiety_rate_of_change: 1.0,

  // Physiological
  biometrics: {
    heart_rate: 105,
    heart_rate_baseline: 75,
    hrv: 50,
    hrv_baseline: 65,
    respiratory_rate: 20,
    skin_conductance: "normal",
    heart_rate_trend: "rising",
    dHR_dt: 6,
    d2HR_dt2: 0.5,
    heart_rate_history: [90, 96, 105],
  },

  // Behavioral
  behavior: {
    message_frequency: 3, // msgs/min
    message_length_avg: 40,
    response_latency: 8,
    tool_usage_last_10min: 1,
    last_message_timestamp: new Date().toISOString(),
    time_since_last_message: 30,
  },

  // Cognitive
  cognition: {
    catastrophizing: true,
    control_seeking: true,
    past_trigger_reference: false,
    dissociation_indicators: false,
    panic_language: false,
    request_for_help: true,
  },

  // Flight Context
  flight: {
    phase: PHASE,
    time_in_phase: 60,
    time_to_next_event: 120,
    aircraft_type: "737-800",
    seat_position: "12A",
    flight_number: "UA123",
    route: "ORD-LAX",
    altitude: 0,
    speed: 0,
    turbulence_forecast: "none",
    weather_departure: "clear",
    weather_arrival: "clear",
  },

  // Historical patterns
  history: {
    known_triggers: ["door_close"],
    effective_tools: ["4-7-8_breathing"],
    ineffective_tools: [],
    regulation_speed: "medium",
    typical_peak_anxiety_moment: "door_close",
    charlie_handoff_history: 0,
    graduation_progress: 0,
  },

  // Preferences
  preferences: {
    preferred_mode: null,
    verbosity: "moderate",
    humor_tolerance: "medium",
    language: "en",
  },

  // Conversation context
  conversation: {
    messages_in_session: 3,
    otie_interventions: 1,
    tools_offered: 1,
    tools_accepted: 1,
    reassurance_attempts: 1,
    last_otie_mode: "OTIE-CLASSIC",
    last_message_text: "The door just closed and I'm freaking out.",
  },

  // Proactive tracking
  proactive_interventions_count: 0,
};

