-- PlaneXiety Database Schema
-- Complete DDL for Supabase PostgreSQL
-- Based on lib/db-types.ts definitions

-- ============================================================
-- 1. USERS TABLE
-- ============================================================

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

-- Indexes for users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_last_flight ON users(last_flight_date DESC NULLS LAST);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 2. FLIGHTS TABLE
-- ============================================================

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

-- Indexes for flights
CREATE INDEX IF NOT EXISTS idx_flights_user_id ON flights(user_id);
CREATE INDEX IF NOT EXISTS idx_flights_user_completed ON flights(user_id, completed);
CREATE INDEX IF NOT EXISTS idx_flights_user_date ON flights(user_id, flight_date DESC);
CREATE INDEX IF NOT EXISTS idx_flights_active ON flights(user_id) WHERE completed = FALSE;
CREATE INDEX IF NOT EXISTS idx_flights_date ON flights(flight_date DESC);

-- Unique constraint: flight_number is unique per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_flights_user_number ON flights(user_id, flight_number);

-- ============================================================
-- 3. EMOTIONAL_SNAPSHOTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS emotional_snapshots (
  snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_id UUID NOT NULL REFERENCES flights(flight_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Flight context
  flight_phase TEXT NOT NULL CHECK (flight_phase IN ('boarding', 'door_close', 'taxi', 'takeoff', 'climb', 'cruise', 'descent', 'approach', 'landing', 'landed')),
  time_in_phase NUMERIC,
  
  -- Primary anxiety metrics
  anxiety_level NUMERIC NOT NULL CHECK (anxiety_level >= 0 AND anxiety_level <= 10),
  anxiety_trend TEXT CHECK (anxiety_trend IN ('rising', 'falling', 'stable')),
  
  -- CRITICAL: Derivatives for prediction
  anxiety_ddt NUMERIC,        -- First derivative: Δanxiety/Δt (points per minute)
  anxiety_d2dt2 NUMERIC,      -- Second derivative: acceleration
  
  -- Biometric data
  heart_rate NUMERIC,
  heart_rate_baseline NUMERIC,
  hrv NUMERIC,
  respiratory_rate NUMERIC,
  skin_conductance TEXT CHECK (skin_conductance IN ('low', 'normal', 'elevated')),
  
  -- Biometric derivatives
  hr_ddt NUMERIC,             -- Heart rate velocity
  hr_d2dt2 NUMERIC,           -- Heart rate acceleration
  
  -- Behavioral signals
  message_frequency NUMERIC,
  message_length_avg NUMERIC,
  response_latency NUMERIC,
  tool_usage_last_10min INTEGER,
  
  -- Cognitive signals
  catastrophizing BOOLEAN,
  control_seeking BOOLEAN,
  past_trigger_reference BOOLEAN,
  dissociation_indicators BOOLEAN,
  panic_language BOOLEAN,
  
  -- Environmental context
  altitude NUMERIC,
  speed NUMERIC,
  turbulence_forecast TEXT,
  
  -- Complete state snapshot (for future analysis)
  full_state JSONB
);

-- Indexes for emotional_snapshots
CREATE INDEX IF NOT EXISTS idx_snapshots_flight_id ON emotional_snapshots(flight_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_user_id ON emotional_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_flight_timestamp ON emotional_snapshots(flight_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_user_timestamp ON emotional_snapshots(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_timestamp ON emotional_snapshots(timestamp DESC);

-- Index for derivative analysis
CREATE INDEX IF NOT EXISTS idx_snapshots_derivatives ON emotional_snapshots(flight_id, anxiety_ddt, anxiety_d2dt2) WHERE anxiety_ddt IS NOT NULL;

-- ============================================================
-- 4. INTERVENTIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS interventions (
  intervention_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id UUID NOT NULL REFERENCES emotional_snapshots(snapshot_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  flight_id UUID NOT NULL REFERENCES flights(flight_id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- OTIE response details
  otie_mode TEXT NOT NULL CHECK (otie_mode IN (
    'OTIE-CLASSIC', 'OTIE-SOFT', 'OTIE-CLINICAL', 'OTIE-NERD', 
    'OTIE-MINIMAL', 'OTIE-KID', 'OTIE-MYSTIC', 'CRISIS_PROTOCOL'
  )),
  response_pattern JSONB,
  
  -- Tool interaction
  tool_offered TEXT,
  tool_accepted BOOLEAN,
  tool_launched BOOLEAN DEFAULT FALSE NOT NULL,
  
  -- Conversation
  user_message TEXT,
  otie_response TEXT,
  
  -- Escalation
  charlie_handoff BOOLEAN DEFAULT FALSE NOT NULL,
  charlie_reason TEXT,
  
  -- CRITICAL: Effectiveness tracking
  anxiety_before NUMERIC NOT NULL CHECK (anxiety_before >= 0 AND anxiety_before <= 10),
  anxiety_trend_before TEXT,
  anxiety_after NUMERIC CHECK (anxiety_after >= 0 AND anxiety_after <= 10),
  anxiety_trend_after TEXT,
  anxiety_drop NUMERIC,           -- Positive = improvement
  regulation_time NUMERIC,        -- Seconds to regulate
  effective BOOLEAN,              -- Did this intervention work?
  
  -- Intervention type
  proactive BOOLEAN DEFAULT FALSE NOT NULL,  -- Predicted vs reactive
  
  -- Context
  flight_phase TEXT,
  anxiety_ddt_before NUMERIC,
  hr_ddt_before NUMERIC
);

-- Indexes for interventions
CREATE INDEX IF NOT EXISTS idx_interventions_snapshot_id ON interventions(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_interventions_user_id ON interventions(user_id);
CREATE INDEX IF NOT EXISTS idx_interventions_flight_id ON interventions(flight_id);
CREATE INDEX IF NOT EXISTS idx_interventions_flight_timestamp ON interventions(flight_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_interventions_timestamp ON interventions(timestamp DESC);

-- CRITICAL: Indexes for learning what works
CREATE INDEX IF NOT EXISTS idx_interventions_effectiveness ON interventions(user_id, effective) WHERE effective IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_interventions_tool_effectiveness ON interventions(tool_offered, effective) WHERE tool_offered IS NOT NULL AND effective IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_interventions_mode_effectiveness ON interventions(otie_mode, effective) WHERE effective IS NOT NULL;

-- ============================================================
-- 5. AVIATION_EXPLANATIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS aviation_explanations (
  explanation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Classification
  category TEXT NOT NULL CHECK (category IN ('sound', 'motion', 'smell', 'visual')),
  phenomenon_name TEXT NOT NULL,
  sensory_channel TEXT NOT NULL CHECK (sensory_channel IN ('auditory', 'tactile', 'visual', 'olfactory')),
  
  -- Matching
  trigger_phrase TEXT NOT NULL,
  
  -- Narrative arc
  typical_fear_story TEXT,
  mundane_explanation TEXT NOT NULL,
  pilot_reality TEXT NOT NULL,
  everyday_analogy TEXT,
  
  -- OTIE voice
  otie_script_seed TEXT NOT NULL,
  
  -- Metadata
  tags TEXT[]
);

-- Indexes for aviation_explanations
CREATE INDEX IF NOT EXISTS idx_aviation_trigger_phrase ON aviation_explanations USING GIN(to_tsvector('english', trigger_phrase));
CREATE INDEX IF NOT EXISTS idx_aviation_phenomenon ON aviation_explanations(phenomenon_name);
CREATE INDEX IF NOT EXISTS idx_aviation_category ON aviation_explanations(category);
CREATE INDEX IF NOT EXISTS idx_aviation_tags ON aviation_explanations USING GIN(tags) WHERE tags IS NOT NULL;

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_aviation_fulltext ON aviation_explanations 
  USING GIN(to_tsvector('english', trigger_phrase || ' ' || phenomenon_name || ' ' || COALESCE(array_to_string(tags, ' '), '')));

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotional_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE aviation_explanations ENABLE ROW LEVEL SECURITY;

-- Policies (adjust for your auth setup)
CREATE POLICY users_select_own ON users FOR SELECT USING (true);
CREATE POLICY flights_select_own ON flights FOR SELECT USING (true);
CREATE POLICY snapshots_select_own ON emotional_snapshots FOR SELECT USING (true);
CREATE POLICY interventions_select_own ON interventions FOR SELECT USING (true);
CREATE POLICY aviation_select_all ON aviation_explanations FOR SELECT USING (true);

-- Insert policies
CREATE POLICY users_insert_service ON users FOR INSERT WITH CHECK (true);
CREATE POLICY flights_insert_service ON flights FOR INSERT WITH CHECK (true);
CREATE POLICY snapshots_insert_service ON emotional_snapshots FOR INSERT WITH CHECK (true);
CREATE POLICY interventions_insert_service ON interventions FOR INSERT WITH CHECK (true);
CREATE POLICY aviation_insert_service ON aviation_explanations FOR INSERT WITH CHECK (true);

-- Update policies
CREATE POLICY users_update_service ON users FOR UPDATE USING (true);
CREATE POLICY flights_update_service ON flights FOR UPDATE USING (true);

-- ============================================================
-- HELPFUL VIEWS
-- ============================================================

-- Active flights view
CREATE OR REPLACE VIEW active_flights AS
SELECT 
  f.*,
  u.user_name,
  EXTRACT(EPOCH FROM (NOW() - f.departure_time)) / 60 AS minutes_since_departure
FROM flights f
JOIN users u ON f.user_id = u.user_id
WHERE f.completed = FALSE
  AND f.departure_time IS NOT NULL
  AND f.departure_time <= NOW()
ORDER BY f.departure_time DESC;

-- Recent interventions with context
CREATE OR REPLACE VIEW recent_interventions_with_context AS
SELECT 
  i.*,
  s.anxiety_level,
  s.flight_phase,
  s.anxiety_ddt,
  s.anxiety_d2dt2,
  f.flight_code,
  f.route,
  u.user_name
FROM interventions i
JOIN emotional_snapshots s ON i.snapshot_id = s.snapshot_id
JOIN flights f ON i.flight_id = f.flight_id
JOIN users u ON i.user_id = u.user_id
ORDER BY i.timestamp DESC;

-- ============================================================
-- SAMPLE DATA FUNCTIONS
-- ============================================================

-- Function to get recent snapshots for a flight
CREATE OR REPLACE FUNCTION get_recent_snapshots(p_flight_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  snapshot_id UUID,
  timestamp TIMESTAMPTZ,
  anxiety_level NUMERIC,
  anxiety_ddt NUMERIC,
  flight_phase TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.snapshot_id,
    s.timestamp,
    s.anxiety_level,
    s.anxiety_ddt,
    s.flight_phase
  FROM emotional_snapshots s
  WHERE s.flight_id = p_flight_id
  ORDER BY s.timestamp DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE users IS 'User profiles with fear archetypes and progress tracking';
COMMENT ON TABLE flights IS 'Individual flight records with metadata and outcomes';
COMMENT ON TABLE emotional_snapshots IS 'Time-series emotional state with derivatives for prediction';
COMMENT ON TABLE interventions IS 'OTIE responses and their effectiveness';
COMMENT ON TABLE aviation_explanations IS 'Auto-learning knowledge base of aviation phenomena';

COMMENT ON COLUMN emotional_snapshots.anxiety_ddt IS 'First derivative: rate of anxiety change (points/min)';
COMMENT ON COLUMN emotional_snapshots.anxiety_d2dt2 IS 'Second derivative: acceleration of anxiety change';
COMMENT ON COLUMN interventions.effective IS 'Did this intervention successfully reduce anxiety?';
COMMENT ON COLUMN interventions.proactive IS 'Was this predicted/proactive (true) or reactive (false)?';
