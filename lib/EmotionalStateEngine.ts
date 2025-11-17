import type { DBAviationExplanation } from './database-types';
/**
 * OTIE Emotional State Engine
 * Pure TypeScript implementation with no external dependencies
 * 
 * This file contains:
 * 1. Types & Interfaces
 * 2. Pure Functions
 * 3. Main Orchestration
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * User Identity
 */
interface UserIdentity {
  user_id: string;
  user_name: string;
  age: number;
}

/**
 * Single Flight Record
 */
interface FlightRecord {
  flight_number: number;
  date: string;
  peak_anxiety: number;
  regulation_time: number;  // minutes
  tools_used: string[];
  charlie_handoff: boolean;
}

/**
 * Fear Archetype Profile
 */
interface FearArchetype {
  control: number;      // 0-100
  somatic: number;      // 0-100
  cognitive: number;    // 0-100
  trust: number;        // 0-100
  trauma: number;       // 0-100
}

/**
 * Biometric Data (if available)
 */
interface Biometrics {
  heart_rate: number;
  heart_rate_baseline: number;
  hrv: number;  // ms
  hrv_baseline: number;
  respiratory_rate: number;  // breaths/min
  skin_conductance: "low" | "normal" | "elevated";
  
  // Derivatives
  heart_rate_trend: "rising" | "falling" | "stable";
  dHR_dt: number;      // bpm/minute
  d2HR_dt2: number;    // acceleration
  heart_rate_history?: number[];
}

/**
 * Behavioral Patterns
 */
interface Behavior {
  message_frequency: number;      // messages per minute
  message_length_avg: number;     // characters
  response_latency: number;       // seconds
  tool_usage_last_10min: number;
  last_message_timestamp: string;
  time_since_last_message: number; // seconds
}

/**
 * Cognitive State (extracted from messages)
 */
interface Cognition {
  catastrophizing: boolean;
  control_seeking: boolean;
  past_trigger_reference: boolean;
  dissociation_indicators: boolean;
  panic_language: boolean;
  request_for_help: boolean;
}

/**
 * Current Flight Context
 */
interface FlightContext {
  phase: FlightPhase;
  time_in_phase: number;           // seconds
  time_to_next_event: number;      // seconds
  aircraft_type: string;
  seat_position: string;
  flight_number: string;
  route: string;
  
  // Environmental
  altitude: number;                // feet
  speed: number;                   // mph
  turbulence_forecast: string;
  weather_departure: string;
  weather_arrival: string;
}

/**
 * Flight Phases
 */
type FlightPhase = 
  | "boarding"
  | "door_close"
  | "pushback"
  | "taxi"
  | "takeoff"
  | "climb"
  | "cruise"
  | "descent"
  | "landing"
  | "landed";

/**
 * Historical Patterns
 */
interface History {
  known_triggers: string[];
  effective_tools: string[];
  ineffective_tools: string[];
  regulation_speed: "fast" | "medium" | "slow";
  typical_peak_anxiety_moment: string;
  charlie_handoff_history: number;
  graduation_progress: number;  // 0-1
}

/**
 * User Preferences
 */
interface Preferences {
  preferred_mode: OTIEMode | null;
  verbosity: "minimal" | "moderate" | "verbose";
  humor_tolerance: "low" | "medium" | "high";
  language: string;
}

/**
 * Conversation Context
 */
interface ConversationContext {
  messages_in_session: number;
  otie_interventions: number;
  tools_offered: number;
  tools_accepted: number;
  reassurance_attempts: number;
  last_otie_mode: OTIEMode;
  last_message_text?: string;
}

/**
 * Complete User State
 */
interface UserState {
  // Identity
  identity: UserIdentity;
  
  // History
  flight_count: number;
  flights: FlightRecord[];
  
  // Profile
  fear_archetype: FearArchetype;
  
  // Current State
  anxiety_level: number;           // 0-10
  anxiety_history: number[];
  anxiety_trend: "rising" | "falling" | "stable";
  anxiety_rate_of_change: number;  // Δ/Δt per minute
  
  // Physiological
  biometrics?: Biometrics;
  
  // Behavioral
  behavior: Behavior;
  
  // Cognitive
  cognition: Cognition;
  
  // Flight Context
  flight: FlightContext;
  
  // Historical
  history: History;
  
  // Preferences
  preferences: Preferences;

    // Time axes (optional richer clocks)
  time_axes?: TimeAxes;

  // Conversation
  conversation: ConversationContext;
  
  // Proactive tracking
  proactive_interventions_count?: number;
}

/**
 * OTIE Operating Modes
 */
type OTIEMode = 
  | "OTIE-CLASSIC"
  | "OTIE-SOFT"
  | "OTIE-CLINICAL"
  | "OTIE-NERD"
  | "OTIE-MINIMAL"
  | "OTIE-KID"
  | "OTIE-MYSTIC"
  | "CRISIS_PROTOCOL";

/**
 * Response Pattern Structure
 */
interface ResponsePattern {
  validate: "brief" | "direct" | "full" | "light";
  educate: "skip" | "minimal" | "moderate" | "deep_dive_ok";
  tool: "immediate" | "offer_now" | "offer" | "if_requested";
  empower: "after_tool" | "gentle" | "celebrate" | "build_confidence";
  word_count_target: number;
  sentence_structure: "short" | "mixed" | "natural";
  humor: boolean | "gentle";
  explanation_depth: 0 | 1 | 2 | 3;
}

/**
 * Proactive Intervention Decision
 */
interface ProactiveInterventionDecision {
  intervene: boolean;
  reason?: string;
  message_template?: string;
}

/**
 * Charlie Handoff Decision
 */
interface CharlieHandoffDecision {
  handoff: boolean;
  reason?: string;
  charlie_message_type?: "grounding" | "pilot_authority" | "human_reassurance" | "requested";
}

/**
 * Engine Output
 */
interface EngineOutput {
  message: string;
  mode: OTIEMode;
  pattern: ResponsePattern;
  tool_offered: string | null;
  tool_launched: boolean;
  charlie_handoff: boolean;
  charlie_reason: string | null;
  anxiety_detected: number;
  derivatives: {
    anxiety_rate: number;
    hr_rate: number;
  };
  proactive: boolean;
  log_entry_id: string;
  timestamp: string;
}

/**
 * Derivative Calculations
 */
interface Derivatives {
  anxiety: {
    value: number;
    ddt: number;      // First derivative
    d2dt2: number;    // Second derivative
    trend: "rising" | "falling" | "stable";
  };
  heart_rate: {
    value: number | null;
    ddt: number;
    d2dt2: number;
    trend: "rising" | "falling" | "stable";
  };
}

// ============================================================================
// PURE FUNCTIONS: TIME AXES
// ============================================================================

/**
 * Build time axes (flight-relative, phase-relative, journey-relative)
 * 
 * NOTE: This assumes:
 * - flight.time_in_phase is seconds already
 * - flight.time_to_next_event is seconds until the next phase
 * - flight_count is how many flights they've COMPLETED so far
 */
function buildTimeAxes(userState: UserState): TimeAxes {
  const phase_relative_t = userState.flight.time_in_phase;

  // Simple journey index: next flight is +1
  const journey_flight_index = userState.flight_count + 1;

  // We don't yet have explicit "seconds since takeoff", so for now this is undefined.
  // Later you can wire this to real flight timing data.
  const flight_relative_t = undefined;

  return {
    flight_relative_t,
    phase_relative_t,
    journey_flight_index
  };
}

// ============================================================================
// PURE FUNCTIONS: TRAJECTORY PREDICTION
// ============================================================================

/**
 * Predict anxiety trajectory over the next ~3 minutes.
 * Very simple v1: uses derivatives + current anxiety + time axes.
 */
function predictTrajectory(
  userState: UserState,
  derivatives: Derivatives,
  timeAxes: TimeAxes
): PredictedTrajectory {
  const anxiety = userState.anxiety_level;
  const rate = derivatives.anxiety.ddt; // points per minute
  const accel = derivatives.anxiety.d2dt2;

  // Default window: 3-minute opportunity window
  const window_seconds = 180;

  // Strong upward movement → likely spike
  if (rate >= 1 || (rate > 0.5 && accel > 0)) {
    return {
      outcome: "likely_spike",
      confidence: 0.7,
      window_seconds
    };
  }

  // Clear downward movement → likely calm
  if (rate <= -0.5) {
    return {
      outcome: "likely_calm",
      confidence: 0.6,
      window_seconds
    };
  }

  // Special case: descent dread
  if (userState.flight.phase === "descent" &&
      timeAxes.phase_relative_t !== undefined &&
      timeAxes.phase_relative_t > 600 && // 10+ minutes into descent
      anxiety >= 6 &&
      rate >= 0) {
    return {
      outcome: "likely_spike",
      confidence: 0.65,
      window_seconds
    };
  }

  // Otherwise, plateau-ish
  return {
    outcome: "likely_plateau",
    confidence: 0.5,
    window_seconds
  };
}


/**
 * Intervention Effectiveness Record
 */
interface InterventionEffectiveness {
  intervention_id: string;
  user_id: string;
  tool_used: string;
  anxiety_before: number;
  anxiety_after: number;
  anxiety_drop: number;
  regulation_time: number;  // seconds
  effective: boolean;
  timestamp: string;
}
/**
 * Time axes (relative clocks)
 */
interface TimeAxes {
  // seconds relative to key reference points
  flight_relative_t?: number;   // e.g. seconds since scheduled/actual takeoff (negative before)
  phase_relative_t?: number;    // seconds since entering current phase
  journey_flight_index?: number; // 1 = first OTIE flight, 2 = second, etc.
}

/**
 * Trajectory prediction
 */
type TrajectoryOutcome = "likely_calm" | "likely_plateau" | "likely_spike";

interface PredictedTrajectory {
  outcome: TrajectoryOutcome;
  confidence: number;       // 0–1
  window_seconds: number;   // how far ahead we’re looking (e.g. 180 = 3 min)
}

/**
 * Intervention candidates (multi-criteria ranking)
 */
interface InterventionCandidate {
  tool_code: string;             // e.g. "4-7-8_breathing"
  immediate_relief: number;      // 0–1
  skill_building: number;        // 0–1
  agency: number;                // 0–1
  meta_anxiety_risk: number;     // 0–1 (lower is better)
  overall_score: number;         // computed composite
}

// ============================================================================
// PURE FUNCTIONS: CRISIS DETECTION
// ============================================================================

/**
 * Detect crisis language in user message
 */
function detectCrisis(userState: UserState): boolean {
  const crisisKeywords = [
    "kill myself",
    "want to die",
    "end it all",
    "heart attack",
    "can't breathe at all",
    "hurt someone",
    "going to crash this plane"
  ];
  
  if (!userState.conversation.last_message_text) {
    return false;
  }
  
  const lastMessage = userState.conversation.last_message_text.toLowerCase();
  return crisisKeywords.some(keyword => lastMessage.includes(keyword));
}

/**
 * Detect nerd engagement (technical questions)
 */
function detectNerdEngagement(userState: UserState): boolean {
  const nerdKeywords = [
    "how does",
    "explain",
    "why does",
    "what's the science",
    "engineering",
    "physics",
    "mechanism",
    "technical"
  ];
  
  if (!userState.conversation.last_message_text) {
    return false;
  }
  
  const lastMessage = userState.conversation.last_message_text.toLowerCase();
  return nerdKeywords.some(keyword => lastMessage.includes(keyword));
}

/**
 * Detect spiritual language
 */
function detectSpiritualLanguage(userState: UserState): boolean {
  const spiritualKeywords = [
    "surrender",
    "trust",
    "universe",
    "meditation",
    "breathwork",
    "consciousness",
    "mindful",
    "present"
  ];
  
  if (!userState.conversation.last_message_text) {
    return false;
  }
  /**
 * Detect if user message contains aviation trigger phrase
 */
function detectAviationTrigger(userMessage: string): string | null {
  const aviationKeywords = [
    // Sounds
    'sound', 'noise', 'hear', 'loud', 'grinding', 'whining',
    'clunk', 'thunk', 'bang', 'ding', 'chime',
    
    // Sensations
    'feel', 'feeling', 'shaking', 'bumpy', 'vibration',
    'dropping', 'falling', 'tilting',
    
    // Visuals
    'see', 'seeing', 'wing', 'moving', 'bending',
    
    // Smells
    'smell', 'burning', 'fuel'
  ];

  const message = userMessage.toLowerCase();
  const hasKeyword = aviationKeywords.some(kw => message.includes(kw));

  if (!hasKeyword) return null;
  return userMessage;
}


/**
 * Fetch aviation explanation (DB lookup, LLM fallback)
 */
async function fetchAviationExplanation(
  trigger: string
): Promise<DBAviationExplanation | null> {
  try {
    const response = await fetch('/api/aviation-explanation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trigger })
    });

    const data = await response.json();

    if (data.ok && data.explanation) {
      return data.explanation as DBAviationExplanation;
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch aviation explanation:', error);
    return null;
  }
}


/**
 * Adapt aviation explanation to OTIE mode + anxiety level
 */
function adaptExplanationToContext(
  explanation: DBAviationExplanation,
  mode: OTIEMode,
  anxietyLevel: number
): string {

  // PANIC MODE — no story, just truth + breath
  if (anxietyLevel >= 9) {
    return `${explanation.pilot_reality}

That’s normal. I’m here. Breathe with me.`;
  }

  // HIGH ANXIETY — short, grounded, no jokes
  if (anxietyLevel >= 7) {
    return `${explanation.mundane_explanation}

${explanation.pilot_reality}

We can breathe through this if you want.`;
  }

  // CLINICAL MODE — aviation instructor vibe
  if (mode === 'OTIE-CLINICAL') {
    return `${explanation.mundane_explanation}

Analogy: ${explanation.everyday_analogy ?? ''}`.trim();
  }

  // NERD MODE — let the full OTIE script through
  if (mode === 'OTIE-NERD') {
    return explanation.otie_script_seed;
  }

  // MINIMAL — ultra-brief reassurance
  if (mode === 'OTIE-MINIMAL') {
    return `${explanation.phenomenon_name}. Normal.

${explanation.everyday_analogy ?? ''}`.trim();
  }

  // CLASSIC MODE — full OTIE personality
  return explanation.otie_script_seed;
}

  const lastMessage = userState.conversation.last_message_text.toLowerCase();
  return spiritualKeywords.some(keyword => lastMessage.includes(keyword));
}

// ============================================================================
// PURE FUNCTIONS: MODE SELECTION
// ============================================================================

/**
 * Select appropriate OTIE mode based on user state
 */
function selectOTIEMode(userState: UserState): OTIEMode {
  
  // CRISIS OVERRIDE (highest priority)
  if (detectCrisis(userState)) {
    return "CRISIS_PROTOCOL";
  }
  
  // PANIC OVERRIDE
  if (userState.anxiety_level >= 9 || userState.cognition.panic_language === true) {
    return "OTIE-SOFT";
  }
  
  // HIGH ANXIETY
  if (userState.anxiety_level >= 7) {
    if (userState.preferences.preferred_mode === "OTIE-MINIMAL") {
      return "OTIE-MINIMAL";
    }
    return "OTIE-SOFT";
  }
  
  // USER EXPLICIT PREFERENCE (if set)
  if (userState.preferences.preferred_mode !== null && userState.anxiety_level < 7) {
    return userState.preferences.preferred_mode;
  }
  
  // AGE-BASED
  if (userState.identity.age < 16) {
    return "OTIE-KID";
  }
  
  // FEAR ARCHETYPE MATCHING
  if (userState.fear_archetype.cognitive > 70 && userState.anxiety_level < 7) {
    return "OTIE-CLINICAL";
  }
  
  if (userState.fear_archetype.control > 70 && userState.anxiety_level < 7) {
    return "OTIE-CLASSIC";
  }
  
  // CONVERSATION PATTERN MATCHING
  if (userState.behavior.message_length_avg < 15 && userState.anxiety_level < 7) {
    return "OTIE-MINIMAL";
  }
  
  if (detectNerdEngagement(userState)) {
    return "OTIE-NERD";
  }
  
  if (detectSpiritualLanguage(userState)) {
    return "OTIE-MYSTIC";
  }
  
  // DEFAULT
  return "OTIE-CLASSIC";
}

// ============================================================================
// PURE FUNCTIONS: RESPONSE PATTERN SELECTION
// ============================================================================

/**
 * Select response pattern based on anxiety level
 */
function selectResponsePattern(userState: UserState, selectedMode: OTIEMode): ResponsePattern {
  
  const anxiety = userState.anxiety_level;
  
  // ANXIETY 9-10: PANIC PROTOCOL
  if (anxiety >= 9) {
    return {
      validate: "brief",
      educate: "skip",
      tool: "immediate",
      empower: "after_tool",
      word_count_target: 20,
      sentence_structure: "short",
      humor: false,
      explanation_depth: 0
    };
  }
  
  // ANXIETY 7-8: HIGH ANXIETY
  if (anxiety >= 7) {
    return {
      validate: "direct",
      educate: "minimal",
      tool: "offer_now",
      empower: "gentle",
      word_count_target: 50,
      sentence_structure: "short",
      humor: false,
      explanation_depth: 1
    };
  }
  
  // ANXIETY 4-6: MODERATE
  if (anxiety >= 4) {
    return {
      validate: "full",
      educate: "moderate",
      tool: "offer",
      empower: "celebrate",
      word_count_target: 100,
      sentence_structure: "mixed",
      humor: "gentle",
      explanation_depth: 2
    };
  }
  
  // ANXIETY 0-3: CALM
  return {
    validate: "light",
    educate: "deep_dive_ok",
    tool: "if_requested",
    empower: "build_confidence",
    word_count_target: 200,
    sentence_structure: "natural",
    humor: true,
    explanation_depth: 3
  };
}

// ============================================================================
// PURE FUNCTIONS: PROACTIVE INTERVENTION
// ============================================================================

/**
 * Check if approaching a known trigger
 */
function isApproachingKnownTrigger(userState: UserState): boolean {
  const triggers = userState.history.known_triggers;
  const currentPhase = userState.flight.phase;
  const timeToNext = userState.flight.time_to_next_event;
  
  // User's trigger is "door_close", currently boarding, door closes in 2min
  if (triggers.includes("door_close") && 
      currentPhase === "boarding" && 
      timeToNext < 120) {
    return true;
  }
  
  // User's trigger is "takeoff", currently taxi, takeoff in 3min
  if (triggers.includes("takeoff") && 
      currentPhase === "taxi" && 
      timeToNext < 180) {
    return true;
  }
  
  return false;
}

/**
 * Determine if proactive intervention is needed
 */
function shouldProactivelyIntervene(
  userState: UserState, 
  timeInPhase: number
): ProactiveInterventionDecision {
  
  // KNOWN TRIGGER APPROACHING
  if (isApproachingKnownTrigger(userState)) {
    return {
      intervene: true,
      reason: "known_trigger_approaching",
      message_template: "predictive_warning"
    };
  }
  
  // ANXIETY SPIKING RAPIDLY
  if (userState.anxiety_rate_of_change > 1.0) {  // +1 point per minute
    return {
      intervene: true,
      reason: "rapid_anxiety_spike",
      message_template: "proactive_breathwork"
    };
  }
  
  // BIOMETRIC SPIKE (if available)
  if (userState.biometrics && userState.biometrics.dHR_dt > 5.0) {
    return {
      intervene: true,
      reason: "heart_rate_spike",
      message_template: "biometric_check_in"
    };
  }
  
  // SILENT TOO LONG DURING KNOWN HARD MOMENT
  if (userState.behavior.time_since_last_message > 300 &&  // 5+ minutes
      userState.flight.phase === "door_close") {
    return {
      intervene: true,
      reason: "silent_during_hard_moment",
      message_template: "gentle_check_in"
    };
  }
  
  // TURBULENCE INCOMING
  if (userState.flight.turbulence_forecast === "moderate_in_5min" &&
      userState.history.known_triggers.includes("turbulence")) {
    return {
      intervene: true,
      reason: "turbulence_forecast",
      message_template: "heads_up_turbulence"
    };
  }
  
  // NO INTERVENTION NEEDED
  return {
    intervene: false
  };
}

/**
 * Generate proactive message based on template
 */
function generateProactiveMessage(template: string, userState: UserState): string {
  
  const templates: Record<string, string> = {
    
    predictive_warning: `Hey. Heads up: ${Math.round(userState.flight.time_to_next_event / 60)} minutes until ${getNextEvent(userState)}.

Last time this was your trigger. Want to get ahead of it? We can breathe now before it happens.`,
    
    proactive_breathwork: `I'm noticing your anxiety climbing. Let's not wait for it to peak.

Breathe with me right now. 4-7-8. Just one round.`,
    
    biometric_check_in: `Your heart rate just spiked. I see it.

You doing okay? Want to breathe, or just checking in?`,
    
    gentle_check_in: `You've been quiet for a bit. That okay, or you spiraling?

I'm here if you need me.`,
    
    heads_up_turbulence: `FYI: Light turbulence coming in about 5 minutes. Just air currents.

Want me to explain what you'll feel, or you good?`
  };
  
  return templates[template] || templates.gentle_check_in;
}

/**
 * Helper: Get next event name
 */
function getNextEvent(userState: UserState): string {
  const phase = userState.flight.phase;
  
  const nextEvents: Record<FlightPhase, string> = {
    boarding: "door close",
    door_close: "pushback",
    pushback: "taxi",
    taxi: "takeoff",
    takeoff: "climb",
    climb: "cruise",
    cruise: "descent",
    descent: "landing",
    landing: "touchdown",
    landed: "gate arrival"
  };
  
  return nextEvents[phase] || "next phase";
}

// ============================================================================
// PURE FUNCTIONS: CHARLIE HANDOFF
// ============================================================================

/**
 * Calculate sustained anxiety duration
 */
function getSustainedAnxietyDuration(userState: UserState): number {
  const history = userState.anxiety_history;
  const threshold = 7;
  
  let duration = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i] >= threshold) {
      duration += 60;  // Assume 1-minute intervals
    } else {
      break;
    }
  }
  
  return duration;  // seconds
}

/**
 * Determine if Charlie handoff is needed
 */
function shouldHandoffToCharlie(
  userState: UserState, 
  conversationHistory: ConversationContext
): CharlieHandoffDecision {
  
  // SUSTAINED HIGH ANXIETY (5+ minutes)
  if (userState.anxiety_level >= 8 && getSustainedAnxietyDuration(userState) >= 300) {
    return {
      handoff: true,
      reason: "sustained_high_anxiety",
      charlie_message_type: "grounding"
    };
  }
  
  // CATASTROPHIC LANGUAGE
  if (userState.cognition.panic_language === true) {
    const catastrophicPhrases = [
      "we're crashing",
      "going down",
      "we're going to die",
      "something's wrong with the plane"
    ];
    
    const lastMessage = (conversationHistory.last_message_text || "").toLowerCase();
    const isCatastrophic = catastrophicPhrases.some(phrase => 
      lastMessage.includes(phrase)
    );
    
    if (isCatastrophic) {
      return {
        handoff: true,
        reason: "catastrophic_thinking",
        charlie_message_type: "pilot_authority"
      };
    }
  }
  
  // BREATHWORK FAILED
  if (conversationHistory.tools_offered >= 2 &&
      conversationHistory.tools_accepted >= 1 &&
      userState.anxiety_trend === "rising") {
    return {
      handoff: true,
      reason: "tools_not_working",
      charlie_message_type: "human_reassurance"
    };
  }
  
  // DISSOCIATION
  if (userState.cognition.dissociation_indicators === true) {
    return {
      handoff: true,
      reason: "dissociation",
      charlie_message_type: "grounding"
    };
  }
  
  // REPEATED REASSURANCE NOT WORKING
  if (conversationHistory.reassurance_attempts >= 3 && userState.anxiety_level >= 7) {
    return {
      handoff: true,
      reason: "reassurance_ineffective",
      charlie_message_type: "pilot_authority"
    };
  }
  
  // USER EXPLICIT REQUEST
  const lastMessage = conversationHistory.last_message_text || "";
  if (/real pilot|captain charlie|human|actual person/i.test(lastMessage)) {
    return {
      handoff: true,
      reason: "user_request",
      charlie_message_type: "requested"
    };
  }
  
  // NO HANDOFF NEEDED
  return {
    handoff: false
  };
}

// ============================================================================
// PURE FUNCTIONS: TOOL SELECTION
// ============================================================================

/**
 * Select appropriate tool to offer
 */
function selectTool(userState: UserState, responsePattern: ResponsePattern): string | null {
  
  // If pattern says "immediate", skip selection, go straight to breathwork
  if (responsePattern.tool === "immediate") {
    return "4-7-8_breathing";
  }
  
  // If pattern says "if_requested", don't offer
  if (responsePattern.tool === "if_requested") {
    return null;
  }
  
  // Otherwise, select based on effectiveness history
  const effectiveTools = userState.history.effective_tools;
  const anxiety = userState.anxiety_level;
  const phase = userState.flight.phase;
  
  // HIGH ANXIETY: Go with proven breathwork
  if (anxiety >= 7) {
    if (effectiveTools.includes("physiological_sigh")) {
      return "physiological_sigh";  // Fastest reset
    }
    return "4-7-8_breathing";  // Default for high anxiety
  }
  
  // MODERATE ANXIETY: Offer choice or countdown
  if (anxiety >= 4) {
    if (phase === "door_close" || phase === "takeoff") {
      return "countdown_timer";  // Time-based reassurance
    }
    return "4-7-8_breathing";
  }
  
  // LOW ANXIETY: Education or grounding
  if (userState.cognition.control_seeking) {
    return "education";  // Knowledge helps control types
  }
  
  return null;  // No tool needed
}

/**
 * Build a ranked list of intervention candidates for this moment.
 */
function rankInterventions(
  userState: UserState,
  trajectory: PredictedTrajectory
): InterventionCandidate[] {
  const anxiety = userState.anxiety_level;
  const phase = userState.flight.phase;
  const effectiveTools = userState.history.effective_tools || [];

  const candidates: InterventionCandidate[] = [];

  // 1) Core breath tool
  candidates.push({
    tool_code: "4-7-8_breathing",
    immediate_relief: anxiety >= 5 ? 0.9 : 0.6,
    skill_building: 0.7,
    agency: 0.9,
    meta_anxiety_risk: 0.1,
    overall_score: 0
  });

  // 2) Physiological sigh if historically effective
  if (effectiveTools.includes("physiological_sigh")) {
    candidates.push({
      tool_code: "physiological_sigh",
      immediate_relief: 0.9,
      skill_building: 0.6,
      agency: 0.9,
      meta_anxiety_risk: 0.1,
      overall_score: 0
    });
  }

  // 3) Countdown / time-based reassurance
  if (phase === "door_close" || phase === "takeoff") {
    candidates.push({
      tool_code: "countdown_timer",
      immediate_relief: anxiety >= 6 ? 0.7 : 0.5,
      skill_building: 0.5,
      agency: 0.8,
      meta_anxiety_risk: 0.15,
      overall_score: 0
    });
  }

  // 4) Education for control-seeking minds at lower anxiety
  if (userState.cognition.control_seeking && anxiety <= 6) {
    candidates.push({
      tool_code: "education",
      immediate_relief: 0.5,
      skill_building: 0.9,
      agency: 0.8,
      meta_anxiety_risk: 0.2,
      overall_score: 0
    });
  }

  // 5) "Validation only" as an explicit non-tool tool
  candidates.push({
    tool_code: "validation_only",
    immediate_relief: 0.6,
    skill_building: 0.5,
    agency: 1.0,
    meta_anxiety_risk: 0.05,
    overall_score: 0
  });

  // Weighting based on predicted outcome (this is where your philosophy lives)
  const weighted = candidates.map((c) => {
    let score = 0;

    if (trajectory.outcome === "likely_spike") {
      // prioritize immediate relief and agency, strongly penalize meta-anxiety risk
      score =
        0.5 * c.immediate_relief +
        0.2 * c.skill_building +
        0.2 * c.agency -
        0.2 * c.meta_anxiety_risk;
    } else if (trajectory.outcome === "likely_plateau") {
      score =
        0.3 * c.immediate_relief +
        0.3 * c.skill_building +
        0.3 * c.agency -
        0.1 * c.meta_anxiety_risk;
    } else {
      // likely_calm → invest more into skill-building
      score =
        0.2 * c.immediate_relief +
        0.4 * c.skill_building +
        0.3 * c.agency -
        0.1 * c.meta_anxiety_risk;
    }

    return { ...c, overall_score: score };
  });

  return weighted.sort((a, b) => b.overall_score - a.overall_score);
}

/**
 * Pick the actual tool to *offer* from the ranked list,
 * respecting the ResponsePattern (immediate / offer / if_requested).
 */
function pickToolFromRanked(
  ranked: InterventionCandidate[],
  responsePattern: ResponsePattern
): string | null {
  if (responsePattern.tool === "if_requested") {
    return null;
  }

  if (ranked.length === 0) {
    return null;
  }

  // v1: just take the top candidate
  return ranked[0].tool_code;
}

// ============================================================================
// PURE FUNCTIONS: DERIVATIVE CALCULATIONS
// ============================================================================

/**
 * Calculate derivatives (rate of change) for anxiety and heart rate
 */
function calculateDerivatives(userState: UserState): Derivatives {
  
  const anxietyHistory = userState.anxiety_history;
  const timeInterval = 60;  // seconds between readings
  
  // Ensure we have enough history
  if (anxietyHistory.length < 3) {
    return {
      anxiety: {
        value: userState.anxiety_level,
        ddt: 0,
        d2dt2: 0,
        trend: "stable"
      },
      heart_rate: {
        value: userState.biometrics?.heart_rate || null,
        ddt: 0,
        d2dt2: 0,
        trend: "stable"
      }
    };
  }
  
  // First derivative: Δanxiety/Δt
  const dAnxiety_dt = (anxietyHistory[anxietyHistory.length - 1] - 
                       anxietyHistory[anxietyHistory.length - 2]) / 
                       (timeInterval / 60);  // per minute
  
  // Second derivative: Δ²anxiety/Δt²
  const prev_dAnxiety_dt = (anxietyHistory[anxietyHistory.length - 2] - 
                            anxietyHistory[anxietyHistory.length - 3]) / 
                            (timeInterval / 60);
  
  const d2Anxiety_dt2 = (dAnxiety_dt - prev_dAnxiety_dt) / (timeInterval / 60);
  
  // Determine anxiety trend
  const anxietyTrend = dAnxiety_dt > 0.5 ? "rising" : 
                       dAnxiety_dt < -0.5 ? "falling" : "stable";
  
  // Same for heart rate (if available)
  let dHR_dt = 0;
  let d2HR_dt2 = 0;
  let hrTrend: "rising" | "falling" | "stable" = "stable";
  let hrValue: number | null = null;
  
  if (userState.biometrics && userState.biometrics.heart_rate_history) {
    const hrHistory = userState.biometrics.heart_rate_history;
    
    if (hrHistory.length >= 3) {
      dHR_dt = (hrHistory[hrHistory.length - 1] - 
                hrHistory[hrHistory.length - 2]) / 
                (timeInterval / 60);
      
      const prev_dHR_dt = (hrHistory[hrHistory.length - 2] - 
                           hrHistory[hrHistory.length - 3]) / 
                           (timeInterval / 60);
      
      d2HR_dt2 = (dHR_dt - prev_dHR_dt) / (timeInterval / 60);
      
      hrTrend = dHR_dt > 2 ? "rising" :
                dHR_dt < -2 ? "falling" : "stable";
    }
    
    hrValue = userState.biometrics.heart_rate;
  }
  
  return {
    anxiety: {
      value: anxietyHistory[anxietyHistory.length - 1],
      ddt: dAnxiety_dt,
      d2dt2: d2Anxiety_dt2,
      trend: anxietyTrend
    },
    heart_rate: {
      value: hrValue,
      ddt: dHR_dt,
      d2dt2: d2HR_dt2,
      trend: hrTrend
    }
  };
}

// ============================================================================
// PURE FUNCTIONS: EFFECTIVENESS TRACKING
// ============================================================================

/**
 * Calculate intervention effectiveness
 */
function calculateInterventionEffectiveness(
  interventionId: string,
  userId: string,
  toolUsed: string,
  anxietyBefore: number,
  anxietyAfter: number,
  regulationTimeSeconds: number,
  timestamp: string
): InterventionEffectiveness {
  
  const anxietyDrop = anxietyBefore - anxietyAfter;
  const effective = anxietyDrop >= 2;  // Reduced by 2+ points = effective
  
  return {
    intervention_id: interventionId,
    user_id: userId,
    tool_used: toolUsed,
    anxiety_before: anxietyBefore,
    anxiety_after: anxietyAfter,
    anxiety_drop: anxietyDrop,
    regulation_time: regulationTimeSeconds,
    effective: effective,
    timestamp: timestamp
  };
}

// ============================================================================
// PURE FUNCTIONS: SAFETY & FAILSAFES
// ============================================================================

/**
 * Normalize anxiety level (ensure valid range)
 */
function normalizeAnxietyLevel(anxiety: number | undefined | null): number {
  if (anxiety === undefined || anxiety === null || isNaN(anxiety)) {
    return 5;  // Default to moderate
  }
  
  // Clamp to 0-10 range
  return Math.max(0, Math.min(10, anxiety));
}

/**
 * Ensure valid OTIE mode
 */
function ensureValidMode(mode: OTIEMode | null | undefined): OTIEMode {
  const validModes: OTIEMode[] = [
    "OTIE-CLASSIC",
    "OTIE-SOFT",
    "OTIE-CLINICAL",
    "OTIE-NERD",
    "OTIE-MINIMAL",
    "OTIE-KID",
    "OTIE-MYSTIC",
    "CRISIS_PROTOCOL"
  ];
  
  if (!mode || !validModes.includes(mode)) {
    return "OTIE-CLASSIC";
  }
  
  return mode;
}

/**
 * Check rate limiting for proactive interventions
 */
function checkProactiveRateLimit(userState: UserState): boolean {
  const MAX_PROACTIVE_PER_FLIGHT = 5;
  const count = userState.proactive_interventions_count || 0;
  
  return count < MAX_PROACTIVE_PER_FLIGHT;
}

// ============================================================================
// MAIN ORCHESTRATION
// ============================================================================

/**
 * Main Emotional State Engine
 * 
 * Takes user message and current state, returns engine output
 */
function emotionalStateEngine(
  userMessage: string,
  userState: UserState
): Partial<EngineOutput> {

  userState.conversation.last_message_text = userMessage;

  // SAFETY: Normalize anxiety
  userState.anxiety_level = normalizeAnxietyLevel(userState.anxiety_level);
  
  // STEP 1: Check for crisis
  if (detectCrisis(userState)) {
    return {
      mode: "CRISIS_PROTOCOL",
      message: "CRISIS_DETECTED",
      charlie_handoff: false,
      tool_offered: null,
      tool_launched: false,
      anxiety_detected: userState.anxiety_level,
      timestamp: new Date().toISOString()
    };
  }
  
    // STEP 2: Calculate derivatives
  const derivatives = calculateDerivatives(userState);

  // STEP 3: Build time axes
  const timeAxes = buildTimeAxes(userState);

  // STEP 4: Predict trajectory (3-minute window mindset)
  const trajectory = predictTrajectory(userState, derivatives, timeAxes);
  
  // STEP 5: Select OTIE mode
  const selectedMode = ensureValidMode(selectOTIEMode(userState));
  
  // STEP 6: Select response pattern
  const responsePattern = selectResponsePattern(userState, selectedMode);
  
  // STEP 7: Check if Charlie handoff needed
  const charlieCheck = shouldHandoffToCharlie(userState, userState.conversation);

  
  if (charlieCheck.handoff) {
    return {
      mode: selectedMode,
      charlie_handoff: true,
      charlie_reason: charlieCheck.reason || null,
      message: "CHARLIE_HANDOFF_TRIGGERED",
      tool_offered: null,
      tool_launched: false,
      anxiety_detected: userState.anxiety_level,
      derivatives: {
        anxiety_rate: derivatives.anxiety.ddt,
        hr_rate: derivatives.heart_rate.ddt
      },
      timestamp: new Date().toISOString()
    };
  }
  
    // STEP 8: Rank interventions and pick one (if any)
  const ranked = rankInterventions(userState, trajectory);
  const selectedTool = pickToolFromRanked(ranked, responsePattern);

  // Auto-launch only in very high anxiety + immediate pattern
  const toolShouldAutoLaunch =
    responsePattern.tool === "immediate" && userState.anxiety_level >= 8;
  
  // STEP 9: Return engine output
  return {
    mode: selectedMode,
    pattern: responsePattern,
    tool_offered: selectedTool,
    tool_launched: !!selectedTool && toolShouldAutoLaunch,
    charlie_handoff: false,
    charlie_reason: null,
    anxiety_detected: userState.anxiety_level,
    derivatives: {
      anxiety_rate: derivatives.anxiety.ddt,
      hr_rate: derivatives.heart_rate.ddt
    },
    proactive: false,
    timestamp: new Date().toISOString()
  };

}

/**
 * Proactive Intervention Check
 * 
 * Runs periodically (every 30s) to check if intervention needed
 */
function checkProactiveIntervention(
  userState: UserState
): ProactiveInterventionDecision & { message?: string } {
  
  // SAFETY: Check rate limit
  if (!checkProactiveRateLimit(userState)) {
    return { intervene: false };
  }

    // Build derivatives + time axes + predicted trajectory
  const derivatives = calculateDerivatives(userState);
  const timeAxes = buildTimeAxes(userState);
  const trajectory = predictTrajectory(userState, derivatives, timeAxes);

  // Calculate time in current phase
  const timeInPhase = userState.flight.time_in_phase;
  
  // Check if intervention needed
  const decision = shouldProactivelyIntervene(userState, timeInPhase);
  
  // If intervention needed, generate message
  if (decision.intervene && decision.message_template) {
    const message = generateProactiveMessage(decision.message_template, userState);
    return {
      ...decision,
      message: message
    };
  }
  
    // If the engine predicts a spike within the 3-minute window,
  // and we're in a known hard phase, we may want to nudge.
  if (!decision.intervene &&
      trajectory.outcome === "likely_spike" &&
      userState.anxiety_level >= 4 &&
      (userState.flight.phase === "door_close" ||
       userState.flight.phase === "descent")) {
    const message = generateProactiveMessage("proactive_breathwork", userState);
    return {
      intervene: true,
      reason: "predicted_spike_window",
      message_template: "proactive_breathwork",
      message
    };
  }

  return decision;
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  UserState,
  OTIEMode,
  ResponsePattern,
  EngineOutput,
  ProactiveInterventionDecision,
  CharlieHandoffDecision,
  Derivatives,
  InterventionEffectiveness,
  FlightPhase,
  FearArchetype,
  Biometrics,
  Behavior,
  Cognition,
  FlightContext,
  History,
  Preferences,
  ConversationContext,
  TimeAxes,
  PredictedTrajectory,
  InterventionCandidate
};


export {
  // Main functions
  emotionalStateEngine,
  checkProactiveIntervention,
  
  // Mode selection
  selectOTIEMode,
  
  // Response pattern
  selectResponsePattern,
  
  // Proactive
  shouldProactivelyIntervene,
  generateProactiveMessage,
  
  // Charlie handoff
  shouldHandoffToCharlie,
  
  // Tool selection
  selectTool,
  rankInterventions,
  pickToolFromRanked,
  
  // Derivatives / time axes / prediction
  calculateDerivatives,
  buildTimeAxes,
  predictTrajectory,
  
  // Effectiveness
  calculateInterventionEffectiveness,
  
  // Detection
  detectCrisis,
  detectNerdEngagement,
  detectSpiritualLanguage,
  
  // Helpers
  normalizeAnxietyLevel,
  ensureValidMode,
  checkProactiveRateLimit,
  getSustainedAnxietyDuration,
  isApproachingKnownTrigger,
  getNextEvent
};
