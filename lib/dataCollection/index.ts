// ═══════════════════════════════════════════════════════════
// INFINITE-VARIABLE CONTEXT ENGINE
// Main exports for the data collection system
// ═══════════════════════════════════════════════════════════

// Core types
export * from './types';

// Data point creation
export { DataPointFactory } from './DataPointFactory';

// Weight calculation
export { WeightCalculator } from './WeightCalculator';

// Re-export commonly used types for convenience
export type {
  DataPoint,
  Context,
  CompleteUserState,
  MetricHealth,
  TraitID,
  PopulationIntelligence,
} from './types';

export {
  DataSource,
  CollectionMethod,
  MetricCategory,
  PrivacyLevel,
} from './types';
