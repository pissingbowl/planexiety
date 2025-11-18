# PlaneXiety / OTIE

## Overview

PlaneXiety is an in-flight companion app designed to help people with fear of flying. It features OTIE (Optimal Timing Intelligence Engine), an AI-powered emotional support system that provides real-time guidance, aviation explanations, and anxiety management tools during flights.

The application tracks user anxiety levels, flight context, and provides personalized interventions based on emotional state, fear archetypes, and flight phase. It uses an "infinite-variable context engine" designed to track 500+ data points about user state, flight conditions, and intervention effectiveness.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: Next.js 16 (App Router) with React 19
- Server-side rendering with client components for interactive features
- TypeScript for type safety across the application
- Tailwind CSS for styling with custom theme configuration
- Component-based architecture separating concerns (chat, flight status, debug panels)

**Key UI Components**:
- `ChatInterface`: Real-time conversation with OTIE
- `FlightStatus`: Live flight tracking with phase-based "weird but normal" event explanations
- `FlightMap`: Visual progress indicator for current flight
- `OtieDebugPanel`: Development tool for viewing emotional state engine output

### Backend Architecture

**API Design**: Next.js API Routes (App Router convention)
- `/api/chat-v2`: Main conversation endpoint with fear classification and LLM response generation
- `/api/aviation-explanation`: Auto-learning aviation knowledge base that generates explanations on-demand
- `/api/ese-test`: Development endpoint for testing Emotional State Engine
- `/api/db-test`: Database connectivity verification

**Core Engine Components**:

1. **Emotional State Engine (ESE)** (`lib/EmotionalStateEngine.ts`)
   - Pure TypeScript implementation with no external dependencies
   - Calculates user emotional state from multiple dimensions (anxiety level, trend, biometrics, fear archetype)
   - Outputs recommended OTIE mode, intervention type, and response parameters
   - Supports 7 distinct modes based on anxiety + archetype combinations

2. **OTIE Mode System** (`lib/otieModes.ts`, `lib/otieModeSelector.ts`)
   - Four primary modes: BASELINE, CALM_REFRAME, FEAR_SPIKE, TURBULENCE_SUPPORT
   - Mode selection based on anxiety level, trend detection, flight phase, and turbulence conditions
   - Each mode has distinct communication goals and technical depth settings

3. **Infinite-Variable Context Engine** (`lib/dataCollection/`)
   - Designed to track 500+ variables across 6 dimensions
   - `DataPointFactory`: Creates meta-instrumented data points with full confidence, weight, and impact tracking
   - `WeightCalculator`: Calculates dynamic weights based on recency, confidence, proven impact, and context relevance
   - Supports multiple data sources (user input, wearables, sensors, APIs, ML inference, population data)
   - Privacy-aware with granular privacy level controls

4. **Aviation Explanations System** (`lib/aviationExplanations.ts`)
   - Auto-learning knowledge base that generates explanations for flight-related triggers
   - Uses Anthropic Claude to generate structured explanations on first encounter
   - Caches explanations in database for future use
   - Provides "what you notice" → "what it really is" → "why it exists" → "what if it failed" structure

5. **Flight Phase Events** (`lib/flightPhaseEvents.ts`)
   - Comprehensive database of normal but anxiety-inducing flight events
   - Organized by 10 flight phases (gate, pushback, taxi, takeoff, climb, cruise, descent, approach, landing, taxi-in)
   - Each event includes trigger description, plain-language explanation, engineering rationale, and failure analysis

### Data Storage Solutions

**Primary Database**: Supabase (PostgreSQL)

**Schema Design** (10+ tables):
- `users`: User profiles with fear archetypes, preferences, and progress tracking
- `flights`: Individual flight records with anxiety metrics and tool usage
- `emotional_snapshots`: Time-series emotional state data
- `interventions`: Records of OTIE interactions and their effectiveness
- `aviation_explanations`: Auto-generated aviation knowledge base
- `data_points`: Meta-instrumented variable tracking (infinite-variable system)
- `metric_health`: Health tracking for each monitored metric
- `correlations`: Discovered relationships between variables
- `trait_evolution`: How user traits change over time
- `population_intelligence`: Aggregate patterns across all users

**Data Point Metadata Structure**:
- Confidence tracking (level, source, staleness, validation method)
- Weight calculation (base, contextual, dynamic with reasoning)
- Impact metrics (predictive power, collective evidence, peer comparison)
- Privacy and governance (level, retention policy, sharing consent)
- Temporal aspects (collection time, validity period, lifecycle stage)
- Quality flags (outlier detection, validation status, conflict tracking)

### Authentication and Authorization

**Current State**: Not yet implemented
- No authentication layer present in codebase
- User IDs are currently passed directly in API requests
- Database schema includes user_id fields prepared for future auth integration

**Planned Approach** (based on Supabase integration):
- Supabase Auth for user management
- Row-level security policies in database
- Session-based authentication with JWT tokens

### External Service Integrations

1. **Anthropic Claude AI**
   - Primary LLM for OTIE conversations
   - Model: `claude-3-haiku-20240307`
   - Used for: Fear classification, response generation, aviation explanation generation
   - API key stored in environment variables

2. **Supabase**
   - Backend-as-a-Service providing PostgreSQL database
   - Real-time capabilities (not yet utilized)
   - Configuration via `SUPABASE_URL` and `SUPABASE_ANON_KEY` environment variables
   - Client library: `@supabase/supabase-js` v2.81.1

3. **Flight Tracking APIs** (Not Yet Integrated)
   - Schema prepared for flight data ingestion
   - Planned for real-time flight phase detection and turbulence forecasting

4. **Weather APIs** (Not Yet Integrated)
   - Schema supports weather data collection
   - Intended for turbulence prediction and contextual explanations

5. **Wearable Device Integration** (Not Yet Integrated)
   - Data collection system designed to accept biometric streams
   - Supports heart rate, HRV, respiratory rate, skin conductance
   - Multiple collection methods (continuous stream, manual sync, sensor polling)

### Key Architectural Decisions

**Decision**: Pure TypeScript ESE with no framework dependencies
- **Rationale**: Ensures portability, testability, and independence from React rendering cycles
- **Tradeoff**: More manual state management, but better separation of concerns

**Decision**: Meta-instrumented data points with full metadata tracking
- **Rationale**: Enables dynamic weighting, confidence tracking, and ML feature importance for 500+ variables
- **Tradeoff**: Increased storage overhead, but provides complete audit trail and adaptability

**Decision**: Auto-learning aviation explanations with LLM generation
- **Rationale**: Covers infinite edge cases without manual content creation
- **Tradeoff**: Requires LLM API costs, but scales indefinitely and improves over time

**Decision**: Mode-based OTIE personality system
- **Rationale**: Provides consistent, contextually appropriate responses without complex prompt engineering
- **Tradeoff**: Less fluid transitions between emotional states, but more predictable and debuggable

**Decision**: Supabase over custom backend
- **Rationale**: Faster development, built-in real-time capabilities, integrated auth
- **Tradeoff**: Vendor lock-in, but suitable for MVP and early growth stages

**Decision**: Separation of flight phase events into static data structure
- **Rationale**: Allows for UI innovation (random selection, gamification) without database queries
- **Tradeoff**: Harder to update content dynamically, but better performance and offline capability