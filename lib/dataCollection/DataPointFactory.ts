// ═══════════════════════════════════════════════════════════
// DATA POINT FACTORY
// Creates meta-instrumented data points with full metadata
// ═══════════════════════════════════════════════════════════

import {
  DataPoint,
  DataSource,
  CollectionMethod,
  MetricCategory,
  PrivacyLevel,
  DataPointMetadata,
} from './types';

export class DataPointFactory {
  /**
   * Create a fully-instrumented data point
   */
  static create<T>(params: {
    userId: string;
    flightId?: string;
    metricName: string;
    metricCategory: MetricCategory;
    value: T;
    source: DataSource;
    collectionMethod: CollectionMethod;
    baseWeight: number;
    contextualWeight?: number;
    confidenceLevel: number;
    additionalMeta?: Partial<DataPointMetadata>;
  }): DataPoint<T> {
    const now = new Date();
    
    const metadata: DataPointMetadata = {
      confidence: {
        level: params.confidenceLevel,
        source: params.source,
        lastUpdated: now,
        staleness: 0,
        validationMethod: this.inferValidationMethod(params.source),
        conflictingData: false,
      },
      
      weight: {
        base: params.baseWeight,
        contextual: params.contextualWeight ?? params.baseWeight,
        dynamic: params.baseWeight,  // Will be calculated by WeightCalculator
        reasoning: '',
      },
      
      provenance: {
        source: params.source,
        collectionMethod: params.collectionMethod,
        userProvided: this.isUserProvided(params.source),
        qualityOfSource: this.assessSourceQuality(params.source),
      },
      
      temporality: {
        collectFrequency: this.inferCollectFrequency(params.metricName),
        changeFrequency: this.inferChangeFrequency(params.metricName),
        decayRate: this.calculateDecayRate(params.metricName),
        historicalValues: [],
      },
      
      sensitivity: {
        privacyLevel: this.inferPrivacyLevel(params.metricName, params.metricCategory),
        userControlled: true,
        encryptionRequired: this.requiresEncryption(params.metricName),
        shareableWithResearch: true,
        requiresConsent: this.requiresConsent(params.metricName),
      },
      
      dependencies: {
        influences: this.inferInfluences(params.metricName),
        influencedBy: this.inferInfluencedBy(params.metricName),
        correlations: [],
      },
      
      actionability: {
        modifiable: this.isModifiable(params.metricName),
        interventionAvailable: this.hasIntervention(params.metricName),
        timeToImpact: this.estimateTimeToImpact(params.metricName),
        costToChange: this.estimateCostToChange(params.metricName),
      },
      
      validation: {
        inExpectedRange: true,  // Will be validated
        outlier: false,
        needsVerification: false,
        validationErrors: [],
        lastValidated: now,
      },
      
      impact: {
        predictivePower: 0.5,  // Default, will be updated from metric_health
        effectSize: 0,
        timesUsedInDecisions: 0,
        outcomeCorrelation: 0,
        collectiveEvidence: 0.5,
      },
      
      cost: {
        collectionEffort: this.estimateCollectionEffort(params.source),
        userBurden: this.estimateUserBurden(params.source),
        computationalCost: 'low',
        storageSize: this.estimateStorageSize(params.value),
        worthRatio: 0.7,  // Default optimistic
      },
      
      interpretability: {
        explainable: true,
        userUnderstanding: this.estimateUserUnderstanding(params.metricName),
        visualizable: this.isVisualizable(params.metricName),
        technicalDepth: this.inferTechnicalDepth(params.metricName),
      },
      
      mutability: {
        changeability: this.inferChangeability(params.metricName),
        timescale: this.inferMutabilityTimescale(params.metricName),
        userInfluence: this.estimateUserInfluence(params.metricName),
        externalFactors: this.identifyExternalFactors(params.metricName),
      },
      
      feedbackDynamics: {
        selfReinforcing: this.isSelfReinforcing(params.metricName),
        dampening: false,
        timeConstant: 1,
        interventionSensitive: this.isInterventionSensitive(params.metricName),
        cascadeRisk: this.assessCascadeRisk(params.metricName),
      },
      
      aggregation: {
        aggregatable: true,
        aggregationMethod: this.inferAggregationMethod(params.metricName),
        windowSize: '5 minutes',
        outlierHandling: 'include',
        missingDataStrategy: 'carry-forward',
      },
      
      ethics: {
        potentialForBias: this.assessBiasPotential(params.metricName),
        potentialForHarm: this.assessHarmPotential(params.metricName),
        informedConsentLevel: this.requiresConsent(params.metricName) ? 'explicit' : 'implicit',
        rightToForget: true,
        auditTrailRequired: this.requiresAuditTrail(params.metricName),
        thirdPartySharing: 'anonymized',
      },
      
      failureModes: {
        commonErrors: [],
        gracefulDegradation: true,
        criticalityLevel: this.inferCriticalityLevel(params.metricName),
      },
      
      learningPotential: {
        novelty: 0.5,
        informationGain: 1.0,
        reducesUncertainty: true,
        exploratory: false,
        experimentalPhase: false,
      },
      
      computation: {
        realTimeRequired: this.requiresRealTime(params.metricName),
        batchable: true,
        processingTime: 1,  // ms
        memoryFootprint: this.estimateMemoryFootprint(params.value),
        cpuIntensity: 'low',
        scalingFactor: 1.0,
        cacheability: true,
        parallelizable: true,
      },
      
      // Merge additional metadata
      ...params.additionalMeta,
    };
    
    return {
      id: crypto.randomUUID(),
      userId: params.userId,
      flightId: params.flightId,
      metricName: params.metricName,
      metricCategory: params.metricCategory,
      value: params.value,
      meta: metadata,
      collectedAt: now,
    };
  }
  
  /**
   * Create a user-provided data point
   */
  static fromUser<T>(params: {
    userId: string;
    flightId?: string;
    metricName: string;
    value: T;
    baseWeight: number;
  }): DataPoint<T> {
    return this.create({
      ...params,
      metricCategory: this.inferCategory(params.metricName),
      source: DataSource.USER_EXPLICIT,
      collectionMethod: CollectionMethod.MANUAL_ENTRY,
      confidenceLevel: 0.6,  // Self-report = moderate confidence
    });
  }
  
  /**
   * Create a wearable data point
   */
  static fromWearable<T>(params: {
    userId: string;
    flightId?: string;
    metricName: string;
    value: T;
    baseWeight: number;
  }): DataPoint<T> {
    return this.create({
      ...params,
      metricCategory: MetricCategory.PHYSIOLOGICAL,
      source: DataSource.WEARABLE_CONTINUOUS,
      collectionMethod: CollectionMethod.SENSOR_STREAM,
      confidenceLevel: 0.95,  // Sensor = high confidence
    });
  }
  
  /**
   * Create a calculated/inferred data point
   */
  static fromCalculation<T>(params: {
    userId: string;
    flightId?: string;
    metricName: string;
    value: T;
    baseWeight: number;
    inferredFrom: string[];
    confidenceLevel: number;
  }): DataPoint<T> {
    return this.create({
      ...params,
      metricCategory: this.inferCategory(params.metricName),
      source: DataSource.CALCULATED,
      collectionMethod: CollectionMethod.INFERENCE_ENGINE,
      confidenceLevel: params.confidenceLevel,
      additionalMeta: {
        provenance: {
          source: DataSource.CALCULATED,
          collectionMethod: CollectionMethod.INFERENCE_ENGINE,
          userProvided: false,
          inferredFrom: params.inferredFrom,
          qualityOfSource: 0.7,
        },
      },
    });
  }
  
  /**
   * Create an API-sourced data point
   */
  static fromAPI<T>(params: {
    userId: string;
    flightId?: string;
    metricName: string;
    value: T;
    baseWeight: number;
    apiSource: string;
    apiType: 'flight' | 'weather' | 'aviation';
  }): DataPoint<T> {
    const sourceMap: Record<string, DataSource> = {
      flight: DataSource.FLIGHT_TRACKING_API,
      weather: DataSource.WEATHER_API,
      aviation: DataSource.AVIATION_API,
    };
    
    return this.create({
      ...params,
      metricCategory: MetricCategory.ENVIRONMENTAL,
      source: sourceMap[params.apiType],
      collectionMethod: CollectionMethod.API_POLL,
      confidenceLevel: 0.9,  // API data = high confidence
      additionalMeta: {
        provenance: {
          source: sourceMap[params.apiType],
          collectionMethod: CollectionMethod.API_POLL,
          userProvided: false,
          thirdPartyAPI: params.apiSource,
          qualityOfSource: 0.9,
        },
      },
    });
  }
  
  // ═══════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═══════════════════════════════════════════════════════════
  
  private static inferCategory(metricName: string): MetricCategory {
    if (metricName.startsWith('identity.')) return MetricCategory.IDENTITY;
    if (metricName.startsWith('environmental.')) return MetricCategory.ENVIRONMENTAL;
    if (metricName.startsWith('physiological.')) return MetricCategory.PHYSIOLOGICAL;
    if (metricName.startsWith('behavioral.')) return MetricCategory.BEHAVIORAL;
    if (metricName.startsWith('cognitive.')) return MetricCategory.COGNITIVE;
    if (metricName.startsWith('historical.')) return MetricCategory.HISTORICAL;
    
    // Fallback inference
    if (metricName.includes('heart') || metricName.includes('hrv')) {
      return MetricCategory.PHYSIOLOGICAL;
    }
    if (metricName.includes('anxiety') || metricName.includes('cognitive')) {
      return MetricCategory.COGNITIVE;
    }
    if (metricName.includes('weather') || metricName.includes('flight')) {
      return MetricCategory.ENVIRONMENTAL;
    }
    if (metricName.includes('message') || metricName.includes('tool')) {
      return MetricCategory.BEHAVIORAL;
    }
    
    return MetricCategory.IDENTITY;
  }
  
  private static inferValidationMethod(source: DataSource): string {
    const methodMap: Partial<Record<DataSource, string>> = {
      [DataSource.WEARABLE_CONTINUOUS]: 'Medical-grade sensor',
      [DataSource.USER_EXPLICIT]: 'Self-report, no validation',
      [DataSource.FLIGHT_TRACKING_API]: 'External API, verified source',
      [DataSource.WEATHER_API]: 'External API, verified source',
      [DataSource.CALCULATED]: 'Algorithmic calculation',
      [DataSource.ML_INFERRED]: 'Machine learning inference',
      [DataSource.PATTERN_DETECTED]: 'Statistical pattern matching',
    };
    
    return methodMap[source] ?? 'Unknown';
  }
  
  private static isUserProvided(source: DataSource): boolean {
    return [
      DataSource.USER_EXPLICIT,
      DataSource.USER_IMPLICIT,
      DataSource.USER_QUIZ,
      DataSource.USER_CONVERSATION,
    ].includes(source);
  }
  
  private static assessSourceQuality(source: DataSource): number {
    const qualityMap: Partial<Record<DataSource, number>> = {
      [DataSource.WEARABLE_CONTINUOUS]: 0.95,
      [DataSource.FLIGHT_TRACKING_API]: 0.90,
      [DataSource.WEATHER_API]: 0.85,
      [DataSource.USER_EXPLICIT]: 0.60,
      [DataSource.CALCULATED]: 0.70,
      [DataSource.ML_INFERRED]: 0.50,
      [DataSource.PATTERN_DETECTED]: 0.40,
    };
    
    return qualityMap[source] ?? 0.50;
  }
  
  private static inferCollectFrequency(metricName: string): string {
    if (metricName.includes('heart') || metricName.includes('altitude')) {
      return 'realtime';
    }
    if (metricName.includes('sleep') || metricName.includes('daily')) {
      return 'daily';
    }
    if (metricName.startsWith('identity.')) {
      return 'once';
    }
    return 'per_flight';
  }
  
  private static inferChangeFrequency(metricName: string): string {
    if (metricName.includes('heart') || metricName.includes('anxiety')) {
      return 'seconds';
    }
    if (metricName.includes('weather')) {
      return 'minutes';
    }
    if (metricName.includes('personality')) {
      return 'years';
    }
    return 'hours';
  }
  
  private static calculateDecayRate(metricName: string): number {
    // How quickly does this become stale? (0-1 per hour)
    if (metricName.includes('heart') || metricName.includes('anxiety')) {
      return 0.5;  // Very fast decay
    }
    if (metricName.includes('sleep')) {
      return 0.1;  // Moderate decay
    }
    if (metricName.includes('personality') || metricName.startsWith('identity.')) {
      return 0.001;  // Almost no decay
    }
    return 0.05;
  }
  
  private static inferPrivacyLevel(
    metricName: string,
    category: MetricCategory
  ): PrivacyLevel {
    // Health data = protected
    if (metricName.includes('health') || metricName.includes('medication')) {
      return PrivacyLevel.PROTECTED;
    }
    
    // Biometrics = sensitive
    if (category === MetricCategory.PHYSIOLOGICAL) {
      return PrivacyLevel.SENSITIVE;
    }
    
    // Most things = private
    if (category === MetricCategory.IDENTITY || category === MetricCategory.COGNITIVE) {
      return PrivacyLevel.PRIVATE;
    }
    
    // Environmental data = public
    return PrivacyLevel.PUBLIC;
  }
  
  private static requiresEncryption(metricName: string): boolean {
    return (
      metricName.includes('health') ||
      metricName.includes('medication') ||
      metricName.includes('trauma')
    );
  }
  
  private static requiresConsent(metricName: string): boolean {
    return (
      metricName.includes('health') ||
      metricName.includes('medication') ||
      metricName.includes('biometric') ||
      metricName.includes('location')
    );
  }
  
  private static inferInfluences(metricName: string): string[] {
    const influenceMap: Record<string, string[]> = {
      'cognitive.anxiety': ['physiological.heartRate', 'behavioral.messageFrequency'],
      'physiological.heartRate': ['cognitive.anxiety', 'physiological.hrv'],
      'cognitive.sleep.quality': ['cognitive.anxiety', 'cognitive.regulationCapacity'],
    };
    
    return influenceMap[metricName] ?? [];
  }
  
  private static inferInfluencedBy(metricName: string): string[] {
    const influencedByMap: Record<string, string[]> = {
      'cognitive.anxiety': ['physiological.heartRate', 'cognitive.sleep.quality', 'environmental.turbulence'],
      'physiological.heartRate': ['cognitive.anxiety', 'physiological.caffeineIntake'],
    };
    
    return influencedByMap[metricName] ?? [];
  }
  
  private static isModifiable(metricName: string): boolean {
    // Can the user change this?
    if (metricName.startsWith('environmental.')) return false;
    if (metricName.includes('heart') || metricName.includes('hr')) return false;
    if (metricName.includes('sleep') || metricName.includes('anxiety')) return true;
    return false;
  }
  
  private static hasIntervention(metricName: string): boolean {
    // Can OTIE help change this?
    return (
      metricName.includes('anxiety') ||
      metricName.includes('breathing') ||
      metricName.includes('cognitive')
    );
  }
  
  private static estimateTimeToImpact(metricName: string): number | undefined {
    if (metricName.includes('breathing')) return 60000;  // 1 minute
    if (metricName.includes('anxiety')) return 120000;  // 2 minutes
    if (metricName.includes('sleep')) return 86400000;  // 24 hours
    return undefined;
  }
  
  private static estimateCostToChange(metricName: string): string {
    if (metricName.includes('breathing')) return 'Very low';
    if (metricName.includes('anxiety')) return 'Low to medium';
    if (metricName.includes('sleep')) return 'Medium';
    return 'Unknown';
  }
  
  private static estimateCollectionEffort(source: DataSource): 'none' | 'low' | 'medium' | 'high' {
    if (source === DataSource.WEARABLE_CONTINUOUS) return 'none';
    if (source === DataSource.USER_EXPLICIT) return 'low';
    if (source === DataSource.USER_QUIZ) return 'medium';
    return 'low';
  }
  
  private static estimateUserBurden(source: DataSource): number {
    if (source === DataSource.WEARABLE_CONTINUOUS) return 0;
    if (source === DataSource.USER_EXPLICIT) return 2;
    if (source === DataSource.USER_QUIZ) return 5;
    return 1;
  }
  
  private static estimateStorageSize(value: any): number {
    return JSON.stringify(value).length;
  }
  
  private static estimateUserUnderstanding(metricName: string): number {
    if (metricName.includes('sleep') || metricName.includes('anxiety')) return 0.95;
    if (metricName.includes('heart')) return 0.80;
    if (metricName.includes('hrv')) return 0.30;
    return 0.60;
  }
  
  private static isVisualizable(metricName: string): boolean {
    return !metricName.includes('text') && !metricName.includes('description');
  }
  
  private static inferTechnicalDepth(metricName: string): 'simple' | 'moderate' | 'complex' {
    if (metricName.includes('hrv') || metricName.includes('derivative')) return 'complex';
    if (metricName.includes('heart') || metricName.includes('altitude')) return 'moderate';
    return 'simple';
  }
  
  private static inferChangeability(
    metricName: string
  ): 'fixed' | 'slow' | 'moderate' | 'fast' | 'volatile' {
    if (metricName.startsWith('identity.personality')) return 'fixed';
    if (metricName.includes('heart') || metricName.includes('anxiety')) return 'volatile';
    if (metricName.includes('sleep')) return 'moderate';
    return 'slow';
  }
  
  private static inferMutabilityTimescale(metricName: string): string {
    if (metricName.includes('personality')) return 'never';
    if (metricName.includes('heart') || metricName.includes('anxiety')) return 'seconds';
    if (metricName.includes('sleep')) return 'days';
    return 'hours';
  }
  
  private static estimateUserInfluence(metricName: string): number {
    if (metricName.includes('sleep')) return 0.8;
    if (metricName.includes('anxiety')) return 0.6;
    if (metricName.includes('heart')) return 0.2;
    if (metricName.startsWith('environmental.')) return 0;
    return 0.5;
  }
  
  private static identifyExternalFactors(metricName: string): string[] {
    if (metricName.includes('sleep')) return ['work stress', 'caffeine', 'environment'];
    if (metricName.includes('anxiety')) return ['environment', 'life events', 'health'];
    return [];
  }
  
  private static isSelfReinforcing(metricName: string): boolean {
    return metricName.includes('anxiety') || metricName.includes('panic');
  }
  
  private static isInterventionSensitive(metricName: string): boolean {
    return (
      metricName.includes('anxiety') ||
      metricName.includes('breathing') ||
      metricName.includes('cognitive')
    );
  }
  
  private static assessCascadeRisk(metricName: string): number {
    if (metricName.includes('anxiety')) return 0.7;
    if (metricName.includes('heart')) return 0.4;
    return 0.2;
  }
  
  private static inferAggregationMethod(
    metricName: string
  ): 'mean' | 'median' | 'mode' | 'max' | 'min' | 'custom' {
    if (metricName.includes('peak') || metricName.includes('max')) return 'max';
    if (metricName.includes('min') || metricName.includes('baseline')) return 'min';
    return 'mean';
  }
  
  private static assessBiasPotential(metricName: string): number {
    if (metricName.includes('demographic') || metricName.includes('race')) return 0.8;
    if (metricName.includes('socioeconomic')) return 0.7;
    return 0.2;
  }
  
  private static assessHarmPotential(metricName: string): number {
    if (metricName.includes('trauma') || metricName.includes('abuse')) return 0.8;
    if (metricName.includes('health') || metricName.includes('medication')) return 0.5;
    return 0.1;
  }
  
  private static requiresAuditTrail(metricName: string): boolean {
    return (
      metricName.includes('health') ||
      metricName.includes('medication') ||
      metricName.includes('intervention')
    );
  }
  
  private static inferCriticalityLevel(
    metricName: string
  ): 'nice-to-have' | 'important' | 'critical' {
    if (metricName.includes('anxiety') || metricName.includes('heart')) return 'critical';
    if (metricName.includes('flight') || metricName.includes('phase')) return 'important';
    return 'nice-to-have';
  }
  
  private static requiresRealTime(metricName: string): boolean {
    return (
      metricName.includes('heart') ||
      metricName.includes('anxiety') ||
      metricName.includes('altitude')
    );
  }
  
  private static estimateMemoryFootprint(value: any): number {
    return this.estimateStorageSize(value) * 2;  // Rough estimate
  }
}
