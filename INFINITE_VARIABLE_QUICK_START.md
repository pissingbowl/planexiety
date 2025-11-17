# 🧠 INFINITE-VARIABLE CONTEXT ENGINE - QUICK START

## ✅ WHAT'S BEEN BUILT

All the **infrastructure for tracking 500+ variables** is complete and ready to receive data:

1. **Database Schema** - 8 new tables with full metadata tracking
2. **TypeScript Types** - Complete type system for all 6 dimensions
3. **DataPointFactory** - Auto-creates instrumented data points
4. **WeightCalculator** - Context-aware importance calculation

---

## 📦 FILES CREATED

```
/database/migrations/
  └─ 002_infinite_variable_system.sql  ← Run this in Supabase

/lib/dataCollection/
  ├─ types.ts                          ← All TypeScript types
  ├─ DataPointFactory.ts               ← Creates instrumented data
  └─ WeightCalculator.ts               ← Calculates dynamic weights
```

---

## 🚀 HOW TO USE IT

### 1. Run the Database Migration

```bash
# Option A: Supabase Studio
# Copy contents of 002_infinite_variable_system.sql into SQL Editor

# Option B: psql
psql $DATABASE_URL -f database/migrations/002_infinite_variable_system.sql
```

### 2. Create Your First Data Point

```typescript
import { DataPointFactory } from '@/lib/dataCollection/DataPointFactory';

// User reports anxiety
const anxietyPoint = DataPointFactory.fromUser({
  userId: 'charlie-123',
  flightId: 'ua123-2025-11-17',
  metricName: 'cognitive.anxiety.current',
  value: 8,
  baseWeight: 1.0,
});

// This creates a data point with ALL metadata:
// - Confidence: 0.6 (self-report)
// - Weight: 1.0 (highly important)
// - Provenance: user_explicit
// - 20+ other metadata fields
```

### 3. Calculate Dynamic Weight

```typescript
import { WeightCalculator } from '@/lib/dataCollection/WeightCalculator';

const context = {
  currentTime: new Date(),
  anxietyLevel: 8,
  flightPhase: 'INITIAL_CLIMB',
  hoursSinceWaking: 2,
  currentTurbulence: 0,
  heartRateDeviation: 25,
  messageFrequency: 3,
};

const weight = WeightCalculator.calculateDynamic(anxietyPoint, context);
// Result: 0.95 (very high - anxiety during takeoff with elevated HR)
```

### 4. Get Top Metrics

```typescript
const topMetrics = WeightCalculator.rankMetrics(
  allDataPoints,
  context,
  10  // top 10
);

// Returns: Sorted by importance with reasoning
// [
//   { dataPoint: anxiety, weight: 0.95, reasoning: 'high confidence, highly relevant' },
//   { dataPoint: heartRate, weight: 0.88, reasoning: 'medical-grade sensor, elevated' },
//   ...
// ]
```

---

## 📊 DATABASE TABLES

### Core Tables:

- **`data_points`** - All metrics with full metadata
- **`metric_health`** - Which metrics actually help
- **`metric_correlations`** - Discovered relationships
- **`trait_ids`** - State compression for similarity matching
- **`population_intelligence`** - What works for similar users
- **`identity_profiles`** - Expanded user data
- **`flight_context`** - Expanded flight data
- **`behavioral_patterns`** - App interaction tracking

---

## 🎯 NEXT STEPS

### Immediate:
1. Run migration in Supabase
2. Test DataPointFactory with sample data
3. Verify WeightCalculator works

### Short-term:
1. Build data collectors for each dimension
2. Create State Builder to assemble complete user state
3. Build API endpoints for data collection

### Medium-term:
1. Integrate Apple Watch for HR/HRV
2. Integrate FlightAware for real-time flight data
3. Build onboarding flow for identity data

---

## 💡 KEY CONCEPTS

**Data Point** = A single measurement with 20+ metadata attributes
- Confidence (how sure are we?)
- Weight (how much does it matter?)
- Provenance (where did it come from?)
- Impact (does it help predictions?)
- Cost (effort to collect)
- ... 15 more

**Dynamic Weight** = Context-aware importance
- Sleep matters more in early morning
- Heart rate matters more during anxiety
- Weather matters more during turbulence

**Metric Health** = Continuous improvement
- Track which metrics help
- Deprecate useless ones
- Focus resources on what works

**Collective Intelligence** = Quantum entanglement for behavior
- When Marcus succeeds, Sarah's probability increases
- Population-level learning
- Every user makes every other user better

---

## 📝 EXAMPLE USE CASE

```typescript
// 1. User opens app during flight
const state = await buildUserState('charlie-123', 'ua123-2025-11-17');

// 2. Calculate what matters right now
const context = extractContext(state);
const topMetrics = WeightCalculator.rankMetrics(state.allDataPoints, context, 10);

// 3. Make decision
if (topMetrics[0].dataPoint.metricName === 'cognitive.anxiety.current' && 
    topMetrics[0].weight > 0.9) {
  // Anxiety is highest priority right now
  const intervention = selectIntervention(topMetrics);
}

// 4. Track effectiveness
await trackOutcome(intervention, anxietyBefore, anxietyAfter);

// 5. System learns for next time
// metric_health automatically updates
// population_intelligence improves
```

---

**The infrastructure is ready. Now we connect the data sources.** 🚀
