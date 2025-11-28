/*
  # PlaneXiety Core Database Schema
  
  Creates the foundational tables for the PlaneXiety/OTIE system
*/

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_name TEXT,
  email TEXT,
  age INTEGER,
  fear_archetype JSONB NOT NULL DEFAULT '{"control": 50, "somatic": 50, "cognitive": 50, "trust": 50, "trauma": 50}'::jsonb,
  preferences JSONB NOT NULL DEFAULT '{"preferred_mode": null, "verbosity": "moderate", "humor_tolerance": "medium", "language": "en-US"}'::jsonb,
  flight_count INTEGER DEFAULT 0 NOT NULL,
  total_anxiety_reduction NUMERIC DEFAULT 0 NOT NULL,
  avg_regulation_time NUMERIC DEFAULT 0 NOT NULL,
  graduation_progress NUMERIC DEFAULT 0 NOT NULL CHECK (graduation_progress >= 0 AND graduation_progress <= 1),
  timezone TEXT,
  last_flight_date DATE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_last_flight ON users(last_flight_date DESC NULLS LAST);

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS flights (
  flight_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  flight_number INTEGER NOT NULL,
  flight_code TEXT,
  route TEXT,
  aircraft_type TEXT,
  seat_position TEXT,
  flight_date DATE NOT NULL,
  departure_time TIMESTAMPTZ,
  arrival_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  peak_anxiety NUMERIC CHECK (peak_anxiety >= 0 AND peak_anxiety <= 10),
  avg_anxiety NUMERIC CHECK (avg_anxiety >= 0 AND avg_anxiety <= 10),
  regulation_time NUMERIC,
  tools_used TEXT[],
  charlie_handoff BOOLEAN DEFAULT FALSE NOT NULL,
  completed BOOLEAN DEFAULT FALSE NOT NULL,
  weather_departure TEXT,
  weather_arrival TEXT,
  turbulence_experienced TEXT,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_flights_user_id ON flights(user_id);
CREATE INDEX IF NOT EXISTS idx_flights_user_completed ON flights(user_id, completed);
CREATE INDEX IF NOT EXISTS idx_flights_user_date ON flights(user_id, flight_date DESC);
CREATE INDEX IF NOT EXISTS idx_flights_active ON flights(user_id) WHERE completed = FALSE;
CREATE INDEX IF NOT EXISTS idx_flights_date ON flights(flight_date DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_flights_user_number ON flights(user_id, flight_number);

CREATE TABLE IF NOT EXISTS emotional_snapshots (
  snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_id UUID NOT NULL REFERENCES flights(flight_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  snapshot_timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  flight_phase TEXT NOT NULL CHECK (flight_phase IN ('boarding', 'door_close', 'taxi', 'takeoff', 'climb', 'cruise', 'descent', 'approach', 'landing', 'landed')),
  time_in_phase NUMERIC,
  anxiety_level NUMERIC NOT NULL CHECK (anxiety_level >= 0 AND anxiety_level <= 10),
  anxiety_trend TEXT CHECK (anxiety_trend IN ('rising', 'falling', 'stable')),
  anxiety_ddt NUMERIC,
  anxiety_d2dt2 NUMERIC,
  heart_rate NUMERIC,
  heart_rate_baseline NUMERIC,
  hrv NUMERIC,
  respiratory_rate NUMERIC,
  skin_conductance TEXT CHECK (skin_conductance IN ('low', 'normal', 'elevated')),
  hr_ddt NUMERIC,
  hr_d2dt2 NUMERIC,
  message_frequency NUMERIC,
  message_length_avg NUMERIC,
  response_latency NUMERIC,
  tool_usage_last_10min INTEGER,
  catastrophizing BOOLEAN,
  control_seeking BOOLEAN,
  past_trigger_reference BOOLEAN,
  dissociation_indicators BOOLEAN,
  panic_language BOOLEAN,
  altitude NUMERIC,
  speed NUMERIC,
  turbulence_forecast TEXT,
  full_state JSONB
);

CREATE INDEX IF NOT EXISTS idx_snapshots_flight_id ON emotional_snapshots(flight_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_user_id ON emotional_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_flight_timestamp ON emotional_snapshots(flight_id, snapshot_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_user_timestamp ON emotional_snapshots(user_id, snapshot_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_timestamp ON emotional_snapshots(snapshot_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_derivatives ON emotional_snapshots(flight_id, anxiety_ddt, anxiety_d2dt2) WHERE anxiety_ddt IS NOT NULL;

CREATE TABLE IF NOT EXISTS interventions (
  intervention_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id UUID NOT NULL REFERENCES emotional_snapshots(snapshot_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  flight_id UUID NOT NULL REFERENCES flights(flight_id) ON DELETE CASCADE,
  intervention_timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  otie_mode TEXT NOT NULL CHECK (otie_mode IN (
    'OTIE-CLASSIC', 'OTIE-SOFT', 'OTIE-CLINICAL', 'OTIE-NERD', 
    'OTIE-MINIMAL', 'OTIE-KID', 'OTIE-MYSTIC', 'CRISIS_PROTOCOL'
  )),
  response_pattern JSONB,
  tool_offered TEXT,
  tool_accepted BOOLEAN,
  tool_launched BOOLEAN DEFAULT FALSE NOT NULL,
  user_message TEXT,
  otie_response TEXT,
  charlie_handoff BOOLEAN DEFAULT FALSE NOT NULL,
  charlie_reason TEXT,
  anxiety_before NUMERIC NOT NULL CHECK (anxiety_before >= 0 AND anxiety_before <= 10),
  anxiety_trend_before TEXT,
  anxiety_after NUMERIC CHECK (anxiety_after >= 0 AND anxiety_after <= 10),
  anxiety_trend_after TEXT,
  anxiety_drop NUMERIC,
  regulation_time NUMERIC,
  effective BOOLEAN,
  proactive BOOLEAN DEFAULT FALSE NOT NULL,
  flight_phase TEXT,
  anxiety_ddt_before NUMERIC,
  hr_ddt_before NUMERIC
);

CREATE INDEX IF NOT EXISTS idx_interventions_snapshot_id ON interventions(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_interventions_user_id ON interventions(user_id);
CREATE INDEX IF NOT EXISTS idx_interventions_flight_id ON interventions(flight_id);
CREATE INDEX IF NOT EXISTS idx_interventions_flight_timestamp ON interventions(flight_id, intervention_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_interventions_timestamp ON interventions(intervention_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_interventions_effectiveness ON interventions(user_id, effective) WHERE effective IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_interventions_tool_effectiveness ON interventions(tool_offered, effective) WHERE tool_offered IS NOT NULL AND effective IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_interventions_mode_effectiveness ON interventions(otie_mode, effective) WHERE effective IS NOT NULL;

CREATE TABLE IF NOT EXISTS aviation_explanations (
  explanation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('sound', 'motion', 'smell', 'visual')),
  phenomenon_name TEXT NOT NULL,
  sensory_channel TEXT NOT NULL CHECK (sensory_channel IN ('auditory', 'tactile', 'visual', 'olfactory')),
  trigger_phrase TEXT NOT NULL,
  typical_fear_story TEXT,
  mundane_explanation TEXT NOT NULL,
  pilot_reality TEXT NOT NULL,
  everyday_analogy TEXT,
  otie_script_seed TEXT NOT NULL,
  tags TEXT[]
);

CREATE INDEX IF NOT EXISTS idx_aviation_phenomenon ON aviation_explanations(phenomenon_name);
CREATE INDEX IF NOT EXISTS idx_aviation_category ON aviation_explanations(category);
CREATE INDEX IF NOT EXISTS idx_aviation_trigger ON aviation_explanations(trigger_phrase);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotional_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE aviation_explanations ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_own ON users FOR SELECT USING (true);
CREATE POLICY flights_select_own ON flights FOR SELECT USING (true);
CREATE POLICY snapshots_select_own ON emotional_snapshots FOR SELECT USING (true);
CREATE POLICY interventions_select_own ON interventions FOR SELECT USING (true);
CREATE POLICY aviation_select_all ON aviation_explanations FOR SELECT USING (true);

CREATE POLICY users_insert_service ON users FOR INSERT WITH CHECK (true);
CREATE POLICY flights_insert_service ON flights FOR INSERT WITH CHECK (true);
CREATE POLICY snapshots_insert_service ON emotional_snapshots FOR INSERT WITH CHECK (true);
CREATE POLICY interventions_insert_service ON interventions FOR INSERT WITH CHECK (true);
CREATE POLICY aviation_insert_service ON aviation_explanations FOR INSERT WITH CHECK (true);

CREATE POLICY users_update_service ON users FOR UPDATE USING (true);
CREATE POLICY flights_update_service ON flights FOR UPDATE USING (true);

COMMENT ON TABLE users IS 'User profiles with fear archetypes and progress tracking';
COMMENT ON TABLE flights IS 'Individual flight records with metadata and outcomes';
COMMENT ON TABLE emotional_snapshots IS 'Time-series emotional state with derivatives for prediction';
COMMENT ON TABLE interventions IS 'OTIE responses and their effectiveness';
COMMENT ON TABLE aviation_explanations IS 'Auto-learning knowledge base of aviation phenomena';
