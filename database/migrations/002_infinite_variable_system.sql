-- ============================================================
-- INFINITE-VARIABLE CONTEXT ENGINE
-- Migration: 002_infinite_variable_system.sql
-- 
-- This adds meta-instrumented data points with confidence,
-- weight, provenance, and all tracking metadata
-- ============================================================

-- ============================================================
-- 1. DATA_POINTS TABLE - The foundation
-- ============================================================

CREATE TABLE IF NOT EXISTS data_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  flight_id UUID REFERENCES flights(flight_id) ON DELETE CASCADE,
  
  -- Metric identity
  metric_name TEXT NOT NULL,
  metric_category TEXT NOT NULL CHECK (metric_category IN (
    'identity',
    'environmental', 
    'physiological',
    'behavioral',
    'cognitive',
    'historical'
  )),
  
  -- Polymorphic value storage
  value_numeric DECIMAL,
  value_text TEXT,
  value_boolean BOOLEAN,
  value_json JSONB,
  
  -- ═══════════════════════════════════════════════════════════
  -- CONFIDENCE METADATA
  -- ═══════════════════════════════════════════════════════════
  confidence_level DECIMAL(3,2) CHECK (confidence_level BETWEEN 0 AND 1),
  confidence_source TEXT NOT NULL,
  confidence_method TEXT,
  confidence_conflicts BOOLEAN DEFAULT FALSE,
  confidence_last_updated TIMESTAMPTZ DEFAULT NOW(),
  
  -- ═══════════════════════════════════════════════════════════
  -- WEIGHT METADATA
  -- ═══════════════════════════════════════════════════════════
  weight_base DECIMAL(3,2) CHECK (weight_base BETWEEN 0 AND 1),
  weight_contextual DECIMAL(3,2) CHECK (weight_contextual BETWEEN 0 AND 1),
  weight_dynamic DECIMAL(3,2) CHECK (weight_dynamic BETWEEN 0 AND 1),
  weight_reasoning TEXT,
  
  -- ═══════════════════════════════════════════════════════════
  -- PROVENANCE
  -- ═══════════════════════════════════════════════════════════
  data_source TEXT NOT NULL,
  collection_method TEXT NOT NULL,
  user_provided BOOLEAN DEFAULT FALSE,
  inferred_from TEXT[],
  api_source TEXT,
  quality_of_source DECIMAL(3,2),
  
  -- ═══════════════════════════════════════════════════════════
  -- TEMPORALITY
  -- ═══════════════════════════════════════════════════════════
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  staleness_hours DECIMAL,
  decay_rate DECIMAL(3,2),
  collect_frequency TEXT,
  change_frequency TEXT,
  
  -- ═══════════════════════════════════════════════════════════
  -- IMPACT TRACKING
  -- ═══════════════════════════════════════════════════════════
  predictive_power DECIMAL(3,2) DEFAULT 0.5,
  effect_size DECIMAL,
  times_used_in_decisions INTEGER DEFAULT 0,
  outcome_correlation DECIMAL(4,3),
  collective_evidence DECIMAL(3,2) DEFAULT 0.5,
  
  -- ═══════════════════════════════════════════════════════════
  -- COST METRICS
  -- ═══════════════════════════════════════════════════════════
  collection_effort TEXT CHECK (collection_effort IN ('none', 'low', 'medium', 'high')),
  user_burden INTEGER CHECK (user_burden BETWEEN 0 AND 10),
  computational_cost TEXT,
  storage_size INTEGER,
  worth_ratio DECIMAL(3,2),
  
  -- ═══════════════════════════════════════════════════════════
  -- COMPLETE METADATA (everything else)
  -- ═══════════════════════════════════════════════════════════
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_data_points_user ON data_points(user_id);
CREATE INDEX idx_data_points_flight ON data_points(flight_id);
CREATE INDEX idx_data_points_metric ON data_points(metric_name);
CREATE INDEX idx_data_points_category ON data_points(metric_category);
CREATE INDEX idx_data_points_collected ON data_points(collected_at DESC);
CREATE INDEX idx_data_points_weight ON data_points(weight_dynamic DESC) WHERE weight_dynamic IS NOT NULL;
CREATE INDEX idx_data_points_confidence ON data_points(confidence_level DESC) WHERE confidence_level IS NOT NULL;
CREATE INDEX idx_data_points_metadata ON data_points USING gin(metadata);

-- Composite indexes for common queries
CREATE INDEX idx_data_points_user_metric ON data_points(user_id, metric_name, collected_at DESC);
CREATE INDEX idx_data_points_flight_metric ON data_points(flight_id, metric_name, collected_at DESC);
CREATE INDEX idx_data_points_user_category ON data_points(user_id, metric_category, collected_at DESC);

-- Index for finding high-quality, high-weight metrics
CREATE INDEX idx_data_points_quality ON data_points(confidence_level, weight_dynamic) 
  WHERE confidence_level > 0.5 AND weight_dynamic > 0.5;

-- Updated_at trigger
CREATE TRIGGER update_data_points_updated_at 
  BEFORE UPDATE ON data_points
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 2. METRIC_HEALTH TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS metric_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT UNIQUE NOT NULL,
  
  -- Health scores (0-1)
  health_score DECIMAL(3,2) CHECK (health_score BETWEEN 0 AND 1),
  data_quality DECIMAL(3,2) CHECK (data_quality BETWEEN 0 AND 1),
  utilization DECIMAL(3,2) CHECK (utilization BETWEEN 0 AND 1),
  impact DECIMAL(3,2) CHECK (impact BETWEEN 0 AND 1),
  cost_efficiency DECIMAL(3,2) CHECK (cost_efficiency BETWEEN 0 AND 1),
  user_satisfaction DECIMAL(3,2) CHECK (user_satisfaction BETWEEN 0 AND 1),
  
  -- Lifecycle
  introduced_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  maturity_level TEXT NOT NULL CHECK (maturity_level IN ('experimental', 'beta', 'stable', 'deprecated')),
  last_review TIMESTAMPTZ,
  next_review TIMESTAMPTZ,
  retention_policy TEXT,
  
  -- Recommendations
  recommended_action TEXT CHECK (recommended_action IN ('keep', 'improve', 'deprecate', 'investigate')),
  action_reasoning TEXT,
  suggested_changes TEXT[],
  
  -- Statistics
  total_collections BIGINT DEFAULT 0,
  successful_uses BIGINT DEFAULT 0,
  failed_uses BIGINT DEFAULT 0,
  avg_confidence DECIMAL(3,2),
  avg_weight DECIMAL(3,2),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_metric_health_name ON metric_health(metric_name);
CREATE INDEX idx_metric_health_score ON metric_health(health_score DESC);
CREATE INDEX idx_metric_health_maturity ON metric_health(maturity_level);
CREATE INDEX idx_metric_health_action ON metric_health(recommended_action);

CREATE TRIGGER update_metric_health_updated_at 
  BEFORE UPDATE ON metric_health
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 3. METRIC_CORRELATIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS metric_correlations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_a TEXT NOT NULL,
  metric_b TEXT NOT NULL,
  
  -- Correlation statistics
  correlation_strength DECIMAL(4,3) CHECK (correlation_strength BETWEEN -1 AND 1),
  lag_time_seconds INTEGER DEFAULT 0,
  
  -- Statistical validity
  sample_size INTEGER,
  p_value DECIMAL,
  confidence_interval_low DECIMAL,
  confidence_interval_high DECIMAL,
  
  -- Timestamps
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_validated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(metric_a, metric_b)
);

CREATE INDEX idx_correlations_metric_a ON metric_correlations(metric_a);
CREATE INDEX idx_correlations_metric_b ON metric_correlations(metric_b);
CREATE INDEX idx_correlations_strength ON metric_correlations(ABS(correlation_strength) DESC);
CREATE INDEX idx_correlations_significant ON metric_correlations(metric_a, metric_b) 
  WHERE ABS(correlation_strength) > 0.5 AND p_value < 0.05;

-- ============================================================
-- 4. TRAIT_IDS TABLE (State compression)
-- ============================================================

CREATE TABLE IF NOT EXISTS trait_ids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  flight_id UUID REFERENCES flights(flight_id) ON DELETE CASCADE,
  
  -- The compressed state signature
  trait_hash TEXT NOT NULL,
  
  -- The state it represents (compressed)
  state_snapshot JSONB NOT NULL,
  
  -- Context
  anxiety_level NUMERIC,
  flight_phase TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- For similarity matching
  similarity_threshold DECIMAL(3,2) DEFAULT 0.8,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trait_ids_user ON trait_ids(user_id);
CREATE INDEX idx_trait_ids_flight ON trait_ids(flight_id);
CREATE INDEX idx_trait_ids_hash ON trait_ids(trait_hash);
CREATE INDEX idx_trait_ids_timestamp ON trait_ids(timestamp DESC);
CREATE INDEX idx_trait_ids_snapshot ON trait_ids USING gin(state_snapshot);

-- Index for similarity queries
CREATE INDEX idx_trait_ids_anxiety_phase ON trait_ids(anxiety_level, flight_phase);

-- ============================================================
-- 5. POPULATION_INTELLIGENCE TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS population_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What worked
  trait_hash TEXT NOT NULL,
  intervention_type TEXT NOT NULL,
  otie_mode TEXT,
  tool_offered TEXT,
  
  -- How well it worked
  effectiveness DECIMAL(3,2) CHECK (effectiveness BETWEEN 0 AND 1),
  anxiety_delta NUMERIC,
  regulation_time NUMERIC,
  
  -- Context
  anxiety_level NUMERIC,
  flight_phase TEXT,
  user_count INTEGER DEFAULT 1,
  
  -- Statistics
  success_count INTEGER DEFAULT 0,
  attempt_count INTEGER DEFAULT 0,
  success_rate DECIMAL(3,2),
  
  -- Timestamps
  first_observed TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(trait_hash, intervention_type, otie_mode)
);

CREATE INDEX idx_population_trait ON population_intelligence(trait_hash);
CREATE INDEX idx_population_intervention ON population_intelligence(intervention_type);
CREATE INDEX idx_population_mode ON population_intelligence(otie_mode);
CREATE INDEX idx_population_effectiveness ON population_intelligence(effectiveness DESC);
CREATE INDEX idx_population_success_rate ON population_intelligence(success_rate DESC);

-- Composite index for finding best interventions
CREATE INDEX idx_population_best_interventions ON population_intelligence(
  trait_hash, 
  success_rate DESC, 
  effectiveness DESC
) WHERE attempt_count >= 3;

-- ============================================================
-- 6. IDENTITY_PROFILES TABLE (expanded user data)
-- ============================================================

CREATE TABLE IF NOT EXISTS identity_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  
  -- ═══════════════════════════════════════════════════════════
  -- PSYCHOLOGICAL ARCHITECTURE
  -- ═══════════════════════════════════════════════════════════
  
  coping_style JSONB DEFAULT '{
    "technical": 50,
    "emotional": 50,
    "distraction": 50,
    "embodied": 50,
    "community": 50
  }'::jsonb,
  
  personality JSONB DEFAULT '{}'::jsonb,
  
  -- ═══════════════════════════════════════════════════════════
  -- AVIATION BACKGROUND
  -- ═══════════════════════════════════════════════════════════
  
  aviation_background JSONB DEFAULT '{
    "totalFlights": 0,
    "pilotInFamily": false,
    "aviationCareer": false,
    "engineeringBackground": false
  }'::jsonb,
  
  first_fearful_flight JSONB,
  
  -- ═══════════════════════════════════════════════════════════
  -- SENSORY PROFILE
  -- ═══════════════════════════════════════════════════════════
  
  sensory_profile JSONB DEFAULT '{
    "soundSensitivity": 50,
    "motionSensitivity": 50,
    "visualSensitivity": 50,
    "interoception": 50
  }'::jsonb,
  
  specific_triggers JSONB DEFAULT '{
    "sounds": [],
    "sensations": [],
    "visuals": []
  }'::jsonb,
  
  -- ═══════════════════════════════════════════════════════════
  -- HEALTH CONTEXT
  -- ═══════════════════════════════════════════════════════════
  
  health_context JSONB DEFAULT '{}'::jsonb,
  
  -- ═══════════════════════════════════════════════════════════
  -- LIFE CONTEXT
  -- ═══════════════════════════════════════════════════════════
  
  life_context JSONB DEFAULT '{}'::jsonb,
  
  -- ═══════════════════════════════════════════════════════════
  -- DIGITAL PROFILE
  -- ═══════════════════════════════════════════════════════════
  
  digital_profile JSONB DEFAULT '{
    "techSavviness": 50,
    "wearableComfort": 50,
    "dataShareWillingness": 50
  }'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_identity_profiles_user ON identity_profiles(user_id);

CREATE TRIGGER update_identity_profiles_updated_at 
  BEFORE UPDATE ON identity_profiles
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 7. FLIGHT_CONTEXT TABLE (expanded flight data)
-- ============================================================

CREATE TABLE IF NOT EXISTS flight_context (
  flight_id UUID PRIMARY KEY REFERENCES flights(flight_id) ON DELETE CASCADE,
  
  -- ═══════════════════════════════════════════════════════════
  -- DETAILED FLIGHT INFO
  -- ═══════════════════════════════════════════════════════════
  
  aircraft_details JSONB DEFAULT '{}'::jsonb,
  flight_data JSONB DEFAULT '{}'::jsonb,
  weather_data JSONB DEFAULT '{}'::jsonb,
  
  -- ═══════════════════════════════════════════════════════════
  -- PRE-FLIGHT STATE
  -- ═══════════════════════════════════════════════════════════
  
  preflight_sleep JSONB DEFAULT '{}'::jsonb,
  preflight_nutrition JSONB DEFAULT '{}'::jsonb,
  preflight_physical JSONB DEFAULT '{}'::jsonb,
  journey_to_airport JSONB DEFAULT '{}'::jsonb,
  airport_experience JSONB DEFAULT '{}'::jsonb,
  boarding_experience JSONB DEFAULT '{}'::jsonb,
  
  -- ═══════════════════════════════════════════════════════════
  -- SOCIAL CONTEXT
  -- ═══════════════════════════════════════════════════════════
  
  companion_info JSONB DEFAULT '{}'::jsonb,
  seatmate_info JSONB DEFAULT '{}'::jsonb,
  crew_observations JSONB DEFAULT '{}'::jsonb,
  
  -- ═══════════════════════════════════════════════════════════
  -- TRIP CONTEXT
  -- ═══════════════════════════════════════════════════════════
  
  trip_purpose TEXT,
  trip_context JSONB DEFAULT '{}'::jsonb,
  destination_context JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_flight_context_flight ON flight_context(flight_id);

CREATE TRIGGER update_flight_context_updated_at 
  BEFORE UPDATE ON flight_context
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 8. BEHAVIORAL_PATTERNS TABLE (app interaction history)
-- ============================================================

CREATE TABLE IF NOT EXISTS behavioral_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  flight_id UUID REFERENCES flights(flight_id) ON DELETE CASCADE,
  
  -- Time window
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  
  -- ═══════════════════════════════════════════════════════════
  -- APP INTERACTION
  -- ═══════════════════════════════════════════════════════════
  
  messages_sent INTEGER DEFAULT 0,
  messages_per_minute DECIMAL,
  avg_message_length DECIMAL,
  avg_response_time DECIMAL,
  
  tool_launches INTEGER DEFAULT 0,
  tool_completions INTEGER DEFAULT 0,
  tool_abandons INTEGER DEFAULT 0,
  
  -- ═══════════════════════════════════════════════════════════
  -- LINGUISTIC MARKERS
  -- ═══════════════════════════════════════════════════════════
  
  sentiment_score DECIMAL CHECK (sentiment_score BETWEEN -1 AND 1),
  urgency_markers INTEGER DEFAULT 0,
  catastrophizing_detected BOOLEAN DEFAULT FALSE,
  panic_language_detected BOOLEAN DEFAULT FALSE,
  
  linguistic_analysis JSONB DEFAULT '{}'::jsonb,
  
  -- ═══════════════════════════════════════════════════════════
  -- PATTERNS
  -- ═══════════════════════════════════════════════════════════
  
  patterns JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_behavioral_patterns_user ON behavioral_patterns(user_id);
CREATE INDEX idx_behavioral_patterns_flight ON behavioral_patterns(flight_id);
CREATE INDEX idx_behavioral_patterns_timestamp ON behavioral_patterns(timestamp DESC);
CREATE INDEX idx_behavioral_patterns_window ON behavioral_patterns(window_start, window_end);

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE data_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_correlations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trait_ids ENABLE ROW LEVEL SECURITY;
ALTER TABLE population_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE flight_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavioral_patterns ENABLE ROW LEVEL SECURITY;

-- Select policies
CREATE POLICY data_points_select_own ON data_points FOR SELECT USING (true);
CREATE POLICY metric_health_select_all ON metric_health FOR SELECT USING (true);
CREATE POLICY correlations_select_all ON metric_correlations FOR SELECT USING (true);
CREATE POLICY trait_ids_select_own ON trait_ids FOR SELECT USING (true);
CREATE POLICY population_select_all ON population_intelligence FOR SELECT USING (true);
CREATE POLICY identity_profiles_select_own ON identity_profiles FOR SELECT USING (true);
CREATE POLICY flight_context_select_own ON flight_context FOR SELECT USING (true);
CREATE POLICY behavioral_patterns_select_own ON behavioral_patterns FOR SELECT USING (true);

-- Insert policies
CREATE POLICY data_points_insert_service ON data_points FOR INSERT WITH CHECK (true);
CREATE POLICY metric_health_insert_service ON metric_health FOR INSERT WITH CHECK (true);
CREATE POLICY correlations_insert_service ON metric_correlations FOR INSERT WITH CHECK (true);
CREATE POLICY trait_ids_insert_service ON trait_ids FOR INSERT WITH CHECK (true);
CREATE POLICY population_insert_service ON population_intelligence FOR INSERT WITH CHECK (true);
CREATE POLICY identity_profiles_insert_service ON identity_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY flight_context_insert_service ON flight_context FOR INSERT WITH CHECK (true);
CREATE POLICY behavioral_patterns_insert_service ON behavioral_patterns FOR INSERT WITH CHECK (true);

-- Update policies
CREATE POLICY data_points_update_service ON data_points FOR UPDATE USING (true);
CREATE POLICY metric_health_update_service ON metric_health FOR UPDATE USING (true);
CREATE POLICY population_update_service ON population_intelligence FOR UPDATE USING (true);
CREATE POLICY identity_profiles_update_service ON identity_profiles FOR UPDATE USING (true);
CREATE POLICY flight_context_update_service ON flight_context FOR UPDATE USING (true);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Function to get current complete state for a user
CREATE OR REPLACE FUNCTION get_user_complete_state(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'identity', (
      SELECT jsonb_object_agg(metric_name, value_json)
      FROM data_points
      WHERE user_id = p_user_id 
        AND metric_category = 'identity'
        AND collected_at = (
          SELECT MAX(collected_at) 
          FROM data_points dp2 
          WHERE dp2.user_id = p_user_id 
            AND dp2.metric_name = data_points.metric_name
        )
    ),
    'physiological', (
      SELECT jsonb_object_agg(metric_name, value_numeric)
      FROM data_points
      WHERE user_id = p_user_id 
        AND metric_category = 'physiological'
        AND collected_at > NOW() - INTERVAL '5 minutes'
    ),
    'cognitive', (
      SELECT jsonb_object_agg(metric_name, value_numeric)
      FROM data_points
      WHERE user_id = p_user_id 
        AND metric_category = 'cognitive'
        AND collected_at > NOW() - INTERVAL '5 minutes'
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to update metric health after use
CREATE OR REPLACE FUNCTION update_metric_health_on_use(
  p_metric_name TEXT,
  p_was_successful BOOLEAN
) RETURNS VOID AS $$
BEGIN
  INSERT INTO metric_health (
    metric_name,
    total_collections,
    successful_uses,
    failed_uses,
    maturity_level,
    introduced_date
  ) VALUES (
    p_metric_name,
    1,
    CASE WHEN p_was_successful THEN 1 ELSE 0 END,
    CASE WHEN NOT p_was_successful THEN 1 ELSE 0 END,
    'experimental',
    NOW()
  )
  ON CONFLICT (metric_name) DO UPDATE SET
    total_collections = metric_health.total_collections + 1,
    successful_uses = metric_health.successful_uses + 
      CASE WHEN p_was_successful THEN 1 ELSE 0 END,
    failed_uses = metric_health.failed_uses + 
      CASE WHEN NOT p_was_successful THEN 1 ELSE 0 END,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE data_points IS 'Meta-instrumented data points with confidence, weight, provenance tracking';
COMMENT ON TABLE metric_health IS 'Health tracking for each metric to identify what works';
COMMENT ON TABLE metric_correlations IS 'Discovered correlations between metrics';
COMMENT ON TABLE trait_ids IS 'Compressed state signatures for similarity matching';
COMMENT ON TABLE population_intelligence IS 'Collective learning - what works for similar users';
COMMENT ON TABLE identity_profiles IS 'Expanded user identity data (psychological, sensory, health)';
COMMENT ON TABLE flight_context IS 'Expanded flight context (pre-flight, social, trip details)';
COMMENT ON TABLE behavioral_patterns IS 'App interaction patterns and linguistic analysis';

COMMENT ON COLUMN data_points.weight_dynamic IS 'Real-time calculated weight based on current context';
COMMENT ON COLUMN data_points.confidence_level IS 'How confident we are in this data point (0-1)';
COMMENT ON COLUMN data_points.predictive_power IS 'How well this metric predicts outcomes (0-1)';
COMMENT ON COLUMN population_intelligence.trait_hash IS 'Links to similar user states for collective intelligence';
