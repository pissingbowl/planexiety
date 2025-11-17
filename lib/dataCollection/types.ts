// ═══════════════════════════════════════════════════════════
// INFINITE-VARIABLE CONTEXT ENGINE - TYPE SYSTEM
// Complete TypeScript types for meta-instrumented data points
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════

export enum DataSource {
  USER_EXPLICIT = 'user_explicit',
  USER_IMPLICIT = 'user_implicit',
  USER_QUIZ = 'user_quiz',
  USER_CONVERSATION = 'user_conversation',
  WEARABLE_CONTINUOUS = 'wearable_continuous',
  WEARABLE_SYNCED = 'wearable_synced',
  PHONE_SENSOR = 'phone_sensor',
  FLIGHT_TRACKING_API = 'flight_api',
  WEATHER_API = 'weather_api',
  AVIATION_API = 'aviation_api',
  CALCULATED = 'calculated',
  ML_INFERRED = 'ml_inferred',
  PATTERN_DETECTED = 'pattern_detected',
  POPULATION_DATA = 'population',
  STATISTICAL_BASELINE = 'baseline',
  PAST_INTERACTION = 'past_interaction',
  EFFECTIVENESS_TRACKING = 'effectiveness',
}

export enum CollectionMethod {
  MANUAL_ENTRY = 'manual',
  AUTOMATED_SYNC = 'automated',
  API_POLL = 'api_poll',
  SENSOR_STREAM = 'sensor',
  NLP_EXTRACTION = 'nlp',
  BEHAVIORAL_TRACKING = 'behavioral',
  INFERENCE_ENGINE = 'inference',
}

export enum PrivacyLevel {
  PUBLIC = 'public',
  PRIVATE = 'private',
  SENSITIVE = 'sensitive',
  PROTECTED = 'protected',
}

export enum MetricCategory {
  IDENTITY = 'identity',
  ENVIRONMENTAL = 'environmental',
  PHYSIOLOGICAL = 'physiological',
  BEHAVIORAL = 'behavioral',
  COGNITIVE = 'cognitive',
  HISTORICAL = 'historical',
}

// ═══════════════════════════════════════════════════════════
// CORE DATA POINT METADATA
// ═══════════════════════════════════════════════════════════

export interface ConfidenceMetadata {
  level: number;                      // 0-1
  source: DataSource;
  lastUpdated: Date;
  staleness: number;                  // hours
  validationMethod: string;
  conflictingData: boolean;
}

export interface WeightMetadata {
  base: number;                       // 0-1
  contextual: number;                 // 0-1
  dynamic: number;                    // 0-1 (calculated in real-time)
  reasoning: string;
}

export interface ProvenanceMetadata {
  source: DataSource;
  collectionMethod: CollectionMethod;
  userProvided: boolean;
  inferredFrom?: string[];
  thirdPartyAPI?: string;
  qualityOfSource: number;            // 0-1
}

export interface TemporalityMetadata {
  collectFrequency: string;
  changeFrequency: string;
  decayRate: number;
  historicalValues?: any[];
  predictedNext?: any;
}

export interface SensitivityMetadata {
  privacyLevel: PrivacyLevel;
  userControlled: boolean;
  encryptionRequired: boolean;
  shareableWithResearch: boolean;
  requiresConsent: boolean;
}

export interface DependencyMetadata {
  influences: string[];
  influencedBy: string[];
  correlations: Array<{
    metric: string;
    strength: number;                 // -1 to 1
    lagTime?: number;                 // seconds
  }>;
}

export interface ActionabilityMetadata {
  modifiable: boolean;
  interventionAvailable: boolean;
  timeToImpact?: number;              // milliseconds
  costToChange?: string;
}

export interface ValidationMetadata {
  inExpectedRange: boolean;
  outlier: boolean;
  needsVerification: boolean;
  validationErrors: string[];
  lastValidated: Date;
}

export interface ImpactMetadata {
  predictivePower: number;            // 0-1
  effectSize: number;
  timesUsedInDecisions: number;
  outcomeCorrelation: number;
  collectiveEvidence: number;
}

export interface CostMetadata {
  collectionEffort: 'none' | 'low' | 'medium' | 'high';
  userBurden: number;                 // 0-10
  computationalCost: string;
  storageSize: number;                // bytes
  worthRatio: number;                 // 0-1
}

export interface InterpretabilityMetadata {
  explainable: boolean;
  userUnderstanding: number;          // 0-1
  visualizable: boolean;
  analogyAvailable?: string;
  technicalDepth: 'simple' | 'moderate' | 'complex';
}

export interface MutabilityMetadata {
  changeability: 'fixed' | 'slow' | 'moderate' | 'fast' | 'volatile';
  timescale: string;
  userInfluence: number;              // 0-1
  externalFactors: string[];
  trendDirection?: 'improving' | 'worsening' | 'stable';
}

export interface FeedbackDynamics {
  selfReinforcing: boolean;
  dampening: boolean;
  timeConstant: number;               // time units to equilibrium
  interventionSensitive: boolean;
  cascadeRisk: number;                // 0-1
}

export interface AggregationMetadata {
  aggregatable: boolean;
  aggregationMethod: 'mean' | 'median' | 'mode' | 'max' | 'min' | 'custom';
  windowSize: string;
  outlierHandling: 'include' | 'exclude' | 'winsorize';
  missingDataStrategy: 'ignore' | 'interpolate' | 'carry-forward';
}

export interface EthicsMetadata {
  potentialForBias: number;           // 0-1
  potentialForHarm: number;           // 0-1
  informedConsentLevel: 'none' | 'implicit' | 'explicit';
  rightToForget: boolean;
  auditTrailRequired: boolean;
  thirdPartySharing: 'never' | 'anonymized' | 'consented';
}

export interface FailureModes {
  commonErrors: string[];
  falsePositiveRate?: number;
  falseNegativeRate?: number;
  gracefulDegradation: boolean;
  fallbackValue?: any;
  criticalityLevel: 'nice-to-have' | 'important' | 'critical';
}

export interface LearningPotential {
  novelty: number;                    // 0-1
  informationGain: number;
  reducesUncertainty: boolean;
  exploratory: boolean;
  experimentalPhase: boolean;
  sunsetDate?: Date;
}

export interface ComputationMetadata {
  realTimeRequired: boolean;
  batchable: boolean;
  processingTime: number;             // milliseconds
  memoryFootprint: number;            // bytes
  cpuIntensity: 'low' | 'medium' | 'high';
  scalingFactor: number;
  cacheability: boolean;
  parallelizable: boolean;
}

// ═══════════════════════════════════════════════════════════
// COMPLETE DATA POINT METADATA
// ═══════════════════════════════════════════════════════════

export interface DataPointMetadata {
  confidence: ConfidenceMetadata;
  weight: WeightMetadata;
  provenance: ProvenanceMetadata;
  temporality: TemporalityMetadata;
  sensitivity: SensitivityMetadata;
  dependencies: DependencyMetadata;
  actionability: ActionabilityMetadata;
  validation: ValidationMetadata;
  impact: ImpactMetadata;
  cost: CostMetadata;
  interpretability: InterpretabilityMetadata;
  mutability: MutabilityMetadata;
  feedbackDynamics: FeedbackDynamics;
  aggregation: AggregationMetadata;
  ethics: EthicsMetadata;
  failureModes: FailureModes;
  learningPotential: LearningPotential;
  computation: ComputationMetadata;
}

// ═══════════════════════════════════════════════════════════
// DATA POINT
// ═══════════════════════════════════════════════════════════

export interface DataPoint<T = any> {
  id: string;
  userId: string;
  flightId?: string;
  
  metricName: string;
  metricCategory: MetricCategory;
  
  value: T;
  
  meta: DataPointMetadata;
  
  collectedAt: Date;
  validFrom?: Date;
  validUntil?: Date;
}

// ═══════════════════════════════════════════════════════════
// METRIC HEALTH
// ═══════════════════════════════════════════════════════════

export interface MetricHealth {
  metricName: string;
  
  healthScore: number;                // 0-1
  
  components: {
    dataQuality: number;
    utilization: number;
    impact: number;
    costEfficiency: number;
    userSatisfaction: number;
  };
  
  recommendations: {
    action: 'keep' | 'improve' | 'deprecate' | 'investigate';
    reasoning: string;
    suggestedChanges: string[];
  };
  
  lifecycle: {
    introducedDate: Date;
    maturityLevel: 'experimental' | 'beta' | 'stable' | 'deprecated';
    lastReview: Date;
    nextReview: Date;
    retentionPolicy: string;
  };
  
  statistics: {
    totalCollections: number;
    successfulUses: number;
    failedUses: number;
    avgConfidence: number;
    avgWeight: number;
  };
}

// ═══════════════════════════════════════════════════════════
// METRIC CORRELATION
// ═══════════════════════════════════════════════════════════

export interface MetricCorrelation {
  metricA: string;
  metricB: string;
  correlationStrength: number;        // -1 to 1
  lagTimeSeconds: number;
  sampleSize: number;
  pValue?: number;
  confidenceInterval?: [number, number];
  discoveredAt: Date;
  lastValidated: Date;
}

// ═══════════════════════════════════════════════════════════
// TRAIT ID (State Compression)
// ═══════════════════════════════════════════════════════════

export interface TraitID {
  id: string;
  userId: string;
  flightId?: string;
  
  // The compressed state signature
  traitHash: string;
  
  // The state it represents (compressed)
  stateSnapshot: {
    fearArchetype: Record<string, number>;
    copingStyle: Record<string, number>;
    anxietyLevel: number;
    flightPhase: string;
    heartRateDeviation?: number;
    dAnxiety_dt?: number;
    messageFrequency?: number;
    // Top 20-30 most predictive variables
  };
  
  timestamp: Date;
  similarityThreshold: number;        // 0-1
}

// ═══════════════════════════════════════════════════════════
// POPULATION INTELLIGENCE
// ═══════════════════════════════════════════════════════════

export interface PopulationIntelligence {
  traitHash: string;
  interventionType: string;
  otieMode: string;
  toolOffered?: string;
  
  effectiveness: number;              // 0-1
  anxietyDelta: number;
  regulationTime: number;
  
  anxietyLevel: number;
  flightPhase: string;
  userCount: number;
  
  successCount: number;
  attemptCount: number;
  successRate: number;
  
  firstObserved: Date;
  lastUpdated: Date;
}

// ═══════════════════════════════════════════════════════════
// CONTEXT (for weight calculation)
// ═══════════════════════════════════════════════════════════

export interface Context {
  currentTime: Date;
  anxietyLevel: number;
  flightPhase: string;
  hoursSinceWaking: number;
  currentTurbulence: number;
  timeSinceLastMessage: number;
  heartRate?: number;
  heartRateDeviation?: number;
  messageFrequency?: number;
  // ... other contextual variables
}

// ═══════════════════════════════════════════════════════════
// DIMENSION 1: IDENTITY VARIABLES
// ═══════════════════════════════════════════════════════════

export interface FearArchetype {
  control: number;                    // 0-100
  somatic: number;                    // 0-100
  cognitive: number;                  // 0-100
  trust: number;                      // 0-100
  trauma: number;                     // 0-100
}

export interface CopingStyle {
  technical: number;                  // 0-100
  emotional: number;                  // 0-100
  distraction: number;                // 0-100
  embodied: number;                   // 0-100
  community: number;                  // 0-100
}

export interface PersonalityProfile {
  bigFive?: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  myersBriggs?: string;
  enneagram?: {
    type: number;
    wing?: string;
  };
  astrology?: {
    sun: string;
    moon?: string;
    rising?: string;
  };
}

export interface AviationBackground {
  totalFlights: number;
  firstFearfulFlight?: {
    age: number;
    trigger: string;
    outcome: string;
  };
  pilotInFamily: boolean;
  aviationCareer: boolean;
  engineeringBackground: boolean;
}

export interface SensoryProfile {
  soundSensitivity: number;           // 0-100
  motionSensitivity: number;          // 0-100
  visualSensitivity: number;          // 0-100
  interoception: number;              // 0-100
  
  triggeredBy: {
    sounds: string[];
    sensations: string[];
    visuals: string[];
  };
}

export interface HealthContext {
  chronicConditions?: string[];
  medications?: string[];
  sleepQuality: number;               // 0-100 baseline
  caffeineUser: boolean;
  substanceUse?: {
    alcohol: 'none' | 'light' | 'moderate' | 'heavy';
    cannabis: boolean;
    nicotine: boolean;
  };
}

export interface IdentityProfile {
  fearArchetype: FearArchetype;
  copingStyle: CopingStyle;
  personality: PersonalityProfile;
  aviationBackground: AviationBackground;
  sensoryProfile: SensoryProfile;
  healthContext: HealthContext;
  demographics: {
    ageRange: string;
    timezone: string;
    primaryLanguage: string;
  };
}

// ═══════════════════════════════════════════════════════════
// DIMENSION 2: ENVIRONMENTAL VARIABLES
// ═══════════════════════════════════════════════════════════

export interface FlightInfo {
  flightNumber: string;
  airline: string;
  route: string;
  aircraft: {
    type: string;
    age?: number;
    size: 'narrow' | 'wide';
    engines: number;
  };
  flightDuration: number;
  seatPosition: string;
  seatLocation: 'window' | 'middle' | 'aisle';
}

export interface FlightData {
  altitude: number;                   // feet MSL
  altitudeRate: number;               // ft/min
  speed: number;                      // knots
  heading: number;                    // degrees
  verticalSpeed: number;              // ft/min
  latitude: number;
  longitude: number;
}

export interface FlightDerivatives {
  dAltitude_dt: number;
  d2Altitude_dt2: number;
  dSpeed_dt: number;
  dHeading_dt: number;
}

export interface WeatherData {
  current: {
    temperature: number;
    pressure: number;
    windSpeed: number;
    windDirection: number;
    visibility: number;
    cloudCover: number;
    precipitation: boolean;
  };
  forecast: {
    turbulenceProbability: {
      next15min: number;
      next30min: number;
      next60min: number;
    };
    severity: 'none' | 'light' | 'moderate' | 'severe';
  };
}

export interface EnvironmentalState {
  flightPhase: 
    | 'PRE_FLIGHT'
    | 'TAXI'
    | 'TAKEOFF_ROLL'
    | 'INITIAL_CLIMB'
    | 'CLIMB'
    | 'CRUISE'
    | 'DESCENT'
    | 'APPROACH'
    | 'LANDING'
    | 'TAXI_IN'
    | 'ARRIVED';
  
  flightInfo: FlightInfo;
  flightData: FlightData;
  flightDerivatives: FlightDerivatives;
  weather: WeatherData;
  
  timing: {
    timeOfDay: string;
    timeInFlight: number;             // minutes
    timeToLanding: number;            // minutes
  };
  
  situation: {
    traveling: 'alone' | 'with_partner' | 'with_family' | 'with_friends' | 'business';
    purpose: 'leisure' | 'business' | 'family' | 'emergency';
    importance: number;               // 0-100
  };
}

// ═══════════════════════════════════════════════════════════
// DIMENSION 3: PHYSIOLOGICAL VARIABLES
// ═══════════════════════════════════════════════════════════

export interface CardiacMetrics {
  heartRate: {
    current: number;
    baseline: number;
    deviation: number;
    percentile: number;
  };
  heartRateVariability: {
    current: number;
    baseline: number;
  };
}

export interface CardiacDerivatives {
  dHR_dt: number;                     // BPM/min
  d2HR_dt2: number;                   // Acceleration
  dHRV_dt: number;
}

export interface RespiratoryMetrics {
  rate?: number;                      // breaths/min
  pattern?: 'regular' | 'irregular' | 'shallow' | 'rapid';
  perceivedDifficulty: number;        // 0-100
}

export interface CircadianState {
  sleepLastNight: number;             // hours
  sleepQuality: number;               // 0-100
  hoursSinceWaking: number;
  caffeineConsumed: boolean;
  lastMeal: number;                   // hours ago
  hydrationLevel: number;             // 0-100
}

export interface PhysiologicalState {
  cardiac: CardiacMetrics;
  cardiacDerivatives: CardiacDerivatives;
  breathing: RespiratoryMetrics;
  circadian: CircadianState;
  autonomic?: {
    skinTemp?: number;
    galvanicSkinResponse?: number;
    bloodOxygen?: number;
  };
}

// ═══════════════════════════════════════════════════════════
// DIMENSION 4: BEHAVIORAL VARIABLES
// ═══════════════════════════════════════════════════════════

export interface AppEngagement {
  messagesPerFlight: number;
  messageFrequency: number;           // per hour
  avgResponseTime: number;            // seconds
  dMessages_dt: number;               // rate of increase
}

export interface ToolUsage {
  breathworkAccepted: number;         // %
  aviationFactsAccepted: number;
  distractionAccepted: number;
  communityAccepted: number;
  
  effectiveness: {
    breathwork: number;               // 0-100
    facts: number;
    distraction: number;
    community: number;
  };
}

export interface LinguisticMarkers {
  sentimentScore: number;             // -100 to +100
  urgencyMarkers: number;
  catastrophicThinking: number;
  negationWords: number;
  
  contains: {
    hyperventilating: boolean;
    cantBreathe: boolean;
    heartRacing: boolean;
    dying: boolean;
    losingControl: boolean;
  };
}

export interface BehavioralState {
  engagement: AppEngagement;
  toolUsage: ToolUsage;
  language: LinguisticMarkers;
}

// ═══════════════════════════════════════════════════════════
// DIMENSION 5: COGNITIVE VARIABLES
// ═══════════════════════════════════════════════════════════

export interface AnxietyMetrics {
  current: number;                    // 0-10
  baseline: number;
  deviation: number;
  peak: number;
  nadir: number;
}

export interface AnxietyDerivatives {
  dAnxiety_dt: number;                // points/min
  d2Anxiety_dt2: number;              // acceleration
}

export interface CognitiveDistortions {
  catastrophizing: number;            // 0-100
  allOrNothing: number;
  overgeneralization: number;
  mindReading: number;
  fortuneTelling: number;
  emotionalReasoning: number;
}

export interface ControlMetrics {
  perceivedControl: number;           // 0-100
  trustInPilot: number;
  trustInAircraft: number;
  trustInOTIE: number;
}

export interface CognitiveState {
  anxiety: AnxietyMetrics;
  anxietyDerivatives: AnxietyDerivatives;
  thinkingPatterns: CognitiveDistortions;
  control: ControlMetrics;
}

// ═══════════════════════════════════════════════════════════
// DIMENSION 6: HISTORICAL VARIABLES
// ═══════════════════════════════════════════════════════════

export interface FlightHistoryStats {
  total: number;
  withOTIE: number;
  history: Array<{
    date: Date;
    flightNumber: string;
    anxietyAvg: number;
    anxietyPeak: number;
    interventionsNeeded: number;
    charlieHandoff: boolean;
    completed: boolean;
  }>;
}

export interface InterventionEffectiveness {
  timesOffered: number;
  timesAccepted: number;
  avgAnxietyBefore: number;
  avgAnxietyAfter: number;
  avgDeltaAnxiety: number;
  bestContext: string;
}

export interface HistoricalProfile {
  flights: FlightHistoryStats;
  whatWorks: {
    breathwork: InterventionEffectiveness;
    aviationFacts: InterventionEffectiveness;
    distraction: InterventionEffectiveness;
    community: InterventionEffectiveness;
  };
  relationship: {
    daysWithOTIE: number;
    messagesSent: number;
    favoriteMode: string;
    trustLevel: number;
    dependencyScore: number;
    independenceScore: number;
  };
}

// ═══════════════════════════════════════════════════════════
// COMPLETE USER STATE
// ═══════════════════════════════════════════════════════════

export interface CompleteUserState {
  userId: string;
  flightId?: string;
  timestamp: Date;
  
  identity: IdentityProfile;
  environmental: EnvironmentalState;
  physiological: PhysiologicalState;
  behavioral: BehavioralState;
  cognitive: CognitiveState;
  historical: HistoricalProfile;
}
