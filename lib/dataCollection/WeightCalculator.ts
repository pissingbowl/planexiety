// ═══════════════════════════════════════════════════════════
// WEIGHT CALCULATOR
// Calculates dynamic weights for data points based on context
// ═══════════════════════════════════════════════════════════

import { DataPoint, Context } from './types';

export class WeightCalculator {
  /**
   * Calculate dynamic weight based on current context
   */
  static calculateDynamic(
    dataPoint: DataPoint,
    context: Context
  ): number {
    const factors = {
      base: dataPoint.meta.weight.base,
      confidence: dataPoint.meta.confidence.level,
      recency: this.calculateRecencyFactor(dataPoint, context),
      provenImpact: dataPoint.meta.impact.predictivePower,
      contextRelevance: this.calculateContextRelevance(dataPoint, context),
      collectiveEvidence: dataPoint.meta.impact.collectiveEvidence,
      volatility: this.calculateVolatility(dataPoint),
      correlationStrength: 0.5,  // TODO: Check active correlations from DB
    };
    
    // Weighted combination
    const dynamicWeight =
      factors.base * 0.30 +
      factors.confidence * 0.15 +
      factors.recency * 0.10 +
      factors.provenImpact * 0.20 +
      factors.contextRelevance * 0.15 +
      factors.volatility * 0.05 +
      factors.correlationStrength * 0.05;
    
    return Math.min(1, Math.max(0, dynamicWeight));
  }
  
  /**
   * Calculate recency factor (fresher = higher weight)
   */
  private static calculateRecencyFactor(
    dataPoint: DataPoint,
    context: Context
  ): number {
    const ageHours =
      (context.currentTime.getTime() - dataPoint.collectedAt.getTime()) /
      (1000 * 60 * 60);
    
    const decayRate = dataPoint.meta.temporality.decayRate;
    
    // Exponential decay: e^(-decay * age)
    return Math.exp(-decayRate * ageHours);
  }
  
  /**
   * Calculate context-specific relevance
   */
  private static calculateContextRelevance(
    dataPoint: DataPoint,
    context: Context
  ): number {
    const metric = dataPoint.metricName;
    
    // ═══════════════════════════════════════════════════════════
    // IDENTITY METRICS
    // ═══════════════════════════════════════════════════════════
    
    // Fear archetype always relevant
    if (metric.startsWith('identity.fearArchetype')) {
      return 0.8;
    }
    
    // ═══════════════════════════════════════════════════════════
    // COGNITIVE METRICS
    // ═══════════════════════════════════════════════════════════
    
    // Anxiety level ALWAYS highly relevant
    if (metric === 'cognitive.anxiety.current') {
      return 1.0;
    }
    
    // Anxiety derivatives MORE relevant during high anxiety
    if (metric === 'cognitive.anxiety.dAnxiety_dt') {
      if (context.anxietyLevel > 7) return 1.0;
      return 0.6;
    }
    
    // ═══════════════════════════════════════════════════════════
    // PHYSIOLOGICAL METRICS
    // ═══════════════════════════════════════════════════════════
    
    // Heart rate always matters, but MORE during high anxiety
    if (metric === 'physiological.heartRate.current') {
      if (context.anxietyLevel > 7) return 1.0;
      return 0.7;
    }
    
    // Heart rate deviation very important
    if (metric === 'physiological.heartRate.deviation') {
      return 0.9;
    }
    
    // Heart rate derivatives critical for prediction
    if (metric === 'physiological.cardiacDerivatives.dHR_dt') {
      if (context.heartRateDeviation && context.heartRateDeviation > 20) {
        return 1.0;
      }
      return 0.6;
    }
    
    // Sleep quality matters more in early morning
    if (metric === 'physiological.circadian.sleepLastNight') {
      return Math.max(0, 1 - context.hoursSinceWaking / 12);
    }
    
    // ═══════════════════════════════════════════════════════════
    // ENVIRONMENTAL METRICS
    // ═══════════════════════════════════════════════════════════
    
    // Flight phase always relevant during flight
    if (metric === 'environmental.flightPhase') {
      return context.flightPhase !== 'PRE_FLIGHT' ? 1.0 : 0.3;
    }
    
    // Weather matters more during turbulence
    if (metric.startsWith('environmental.weather')) {
      if (context.currentTurbulence > 0) return 1.0;
      return 0.3;
    }
    
    // Turbulence forecast very important
    if (metric === 'environmental.weather.forecast.turbulenceProbability') {
      return 0.9;
    }
    
    // Altitude/speed/heading important during active flight
    if (
      metric === 'environmental.flightData.altitude' ||
      metric === 'environmental.flightData.speed'
    ) {
      if (context.flightPhase === 'CRUISE') return 0.4;
      if (context.flightPhase.includes('CLIMB') || context.flightPhase.includes('DESCENT')) {
        return 0.8;
      }
      return 0.6;
    }
    
    // ═══════════════════════════════════════════════════════════
    // BEHAVIORAL METRICS
    // ═══════════════════════════════════════════════════════════
    
    // Message frequency VERY relevant for prediction
    if (metric === 'behavioral.engagement.messageFrequency') {
      return 0.9;
    }
    
    // Message frequency derivative critical
    if (metric === 'behavioral.engagement.dMessages_dt') {
      return 1.0;
    }
    
    // Response time indicates urgency
    if (metric === 'behavioral.engagement.avgResponseTime') {
      if (context.timeSinceLastMessage < 30) return 0.9;
      return 0.5;
    }
    
    // Tool usage effectiveness
    if (metric.includes('behavioral.toolUsage.effectiveness')) {
      return 0.8;
    }
    
    // Linguistic markers for panic
    if (metric.includes('behavioral.language.contains')) {
      return 1.0;  // Panic language = immediate attention
    }
    
    // ═══════════════════════════════════════════════════════════
    // HISTORICAL METRICS
    // ═══════════════════════════════════════════════════════════
    
    // What worked before is relevant
    if (metric.includes('historical.whatWorks')) {
      return 0.7;
    }
    
    // Trust/relationship metrics
    if (metric === 'historical.relationship.trustLevel') {
      return 0.6;
    }
    
    // Default to contextual weight
    return dataPoint.meta.weight.contextual;
  }
  
  /**
   * Calculate volatility (rapid change = higher weight)
   */
  private static calculateVolatility(dataPoint: DataPoint): number {
    const historical = dataPoint.meta.temporality.historicalValues;
    
    if (!historical || historical.length < 2) return 0.5;
    
    // Only calculate for numeric values
    if (typeof historical[0] !== 'number') return 0.5;
    
    const values = historical as number[];
    
    // Calculate standard deviation
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance =
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
      values.length;
    const stdDev = Math.sqrt(variance);
    
    // Normalize to 0-1 (coefficient of variation)
    if (mean === 0) return 0;
    return Math.min(1, stdDev / Math.abs(mean));
  }
  
  /**
   * Should we use this metric in our decision?
   */
  static shouldUse(
    dataPoint: DataPoint,
    context: Context,
    minQuality: number = 0.5,
    minRelevance: number = 0.3
  ): boolean {
    // Calculate composite quality score
    const qualityScore =
      dataPoint.meta.confidence.level * 0.4 +
      this.calculateRecencyFactor(dataPoint, context) * 0.2 +
      dataPoint.meta.impact.predictivePower * 0.2 +
      dataPoint.meta.cost.worthRatio * 0.2;
    
    // Calculate current relevance
    const relevance = this.calculateDynamic(dataPoint, context);
    
    return qualityScore >= minQuality && relevance >= minRelevance;
  }
  
  /**
   * Get top N most important metrics right now
   */
  static rankMetrics(
    dataPoints: DataPoint[],
    context: Context,
    topN: number = 10
  ): Array<{ dataPoint: DataPoint; weight: number; reasoning: string }> {
    return dataPoints
      .map((dp) => ({
        dataPoint: dp,
        weight: this.calculateDynamic(dp, context),
        reasoning: this.explainWeight(dp, context),
      }))
      .filter((item) => this.shouldUse(item.dataPoint, context))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, topN);
  }
  
  /**
   * Explain why a metric has a certain weight
   */
  static explainWeight(dataPoint: DataPoint, context: Context): string {
    const factors = {
      confidence: dataPoint.meta.confidence.level,
      recency: this.calculateRecencyFactor(dataPoint, context),
      relevance: this.calculateContextRelevance(dataPoint, context),
      provenImpact: dataPoint.meta.impact.predictivePower,
    };
    
    const reasons: string[] = [];
    
    if (factors.confidence > 0.8) {
      reasons.push('high confidence');
    }
    if (factors.recency > 0.8) {
      reasons.push('very recent');
    }
    if (factors.relevance > 0.8) {
      reasons.push('highly relevant to current situation');
    }
    if (factors.provenImpact > 0.7) {
      reasons.push('proven predictive power');
    }
    
    if (reasons.length === 0) {
      return 'moderate importance';
    }
    
    return reasons.join(', ');
  }
  
  /**
   * Calculate aggregate weight for a group of related metrics
   */
  static aggregateWeight(
    dataPoints: DataPoint[],
    context: Context,
    method: 'mean' | 'max' | 'weighted' = 'weighted'
  ): number {
    if (dataPoints.length === 0) return 0;
    
    const weights = dataPoints.map((dp) => this.calculateDynamic(dp, context));
    
    switch (method) {
      case 'mean':
        return weights.reduce((sum, w) => sum + w, 0) / weights.length;
      
      case 'max':
        return Math.max(...weights);
      
      case 'weighted':
        // Weight by confidence * predictive power
        const confidenceWeights = dataPoints.map(
          (dp) => dp.meta.confidence.level * dp.meta.impact.predictivePower
        );
        const totalConfidence = confidenceWeights.reduce((sum, w) => sum + w, 0);
        
        if (totalConfidence === 0) return this.aggregateWeight(dataPoints, context, 'mean');
        
        return weights.reduce(
          (sum, weight, i) => sum + weight * (confidenceWeights[i] / totalConfidence),
          0
        );
      
      default:
        return 0;
    }
  }
}
