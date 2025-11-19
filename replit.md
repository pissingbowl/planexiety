# OTIE

## Overview

OTIE (Optimal Timing Intelligence Engine) is an in-flight companion app designed to help people with fear of flying. It's an AI-powered emotional support system that provides real-time guidance, aviation explanations, and anxiety management tools during flights.

The application tracks user anxiety levels, flight context, and provides personalized interventions based on emotional state and flight phase using a lightweight state tracking system and intelligent mode selection.

## Recent Changes

**November 19, 2025 - Enhanced Turbulence Analysis System**
- Implemented comprehensive route-specific turbulence reporting using ALL available data sources
- Great circle route calculation with 50nm waypoint intervals for accurate flight path tracking
- Integrated multiple real-time data sources:
  - **PIREPs**: Pilot reports filtered by route corridor with proximity weighting
  - **METARs/TAFs**: Weather data for departure, destination, and major airports along route
  - **SIGMETs/AIRMETs**: Turbulence advisories that intersect the flight path
  - **Jet Stream Analysis**: Detection of jet stream crossings and wind shear zones
  - **Weather Gradients**: Temperature and pressure gradient calculations for CAT (Clear Air Turbulence) prediction
- Enhanced reporting structure includes:
  - Current conditions with real pilot reports
  - Phase-by-phase turbulence forecast (takeoff, climb, cruise, descent)
  - Hot spots with specific lat/lon and expected intensity
  - Altitude recommendations based on PIREPs and weather data
  - Confidence metrics based on data availability
- Visual enhancements with color-coded severity (green=smooth, yellow=light, orange=moderate, red=severe)
- Distance/time to turbulence areas displayed
- Turbulence accordion opens by default to showcase analysis

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
- `FlightPhaseWeirdThings`: Interactive panel showing normal flight events that might seem concerning, with auto-play and navigation controls

### Backend Architecture

**API Design**: Next.js API Routes (App Router convention)
- `/api/chat-v2`: Main conversation endpoint with fear classification and LLM response generation
- `/api/aviation-explanation`: Auto-learning aviation knowledge base that generates explanations on-demand
- `/api/db-test`: Database connectivity verification

**Core Engine Components**:

1. **OTIE Mode System** (`lib/otieModes.ts`, `lib/otieModeSelector.ts`, `lib/OTIEPromptBuilder.ts`)
   - **Four modes**: BASELINE, CALM_REFRAME, FEAR_SPIKE, TURBULENCE_SUPPORT
   - **Mode selection** (`otieModeSelector.ts`): Intelligent heuristics based on anxiety level, trend detection, flight phase, and turbulence conditions
   - **Prompt generation** (`OTIEPromptBuilder.ts`): Each mode has distinct communication goals, validation intensity, and technical depth settings
   - **Lightweight state** (`otieStateEngine.ts`): Tracks anxiety level, message count, last message, and session start time
   - **State adapter** (`otieOrchestrator.ts`): Converts lightweight state into format expected by mode selector and prompt builder

2. **Fear Classification Pipeline** (`app/api/chat-v2/route.ts`)
   - Two-stage LLM classification system
   - First stage: Classify fear type (CRASHING, TURBULENCE, PANIC, LOSS_OF_CONTROL, CLAUSTROPHOBIA, UNKNOWN)
   - Second stage: Generate appropriate OTIE response based on fear category and anxiety level
   - Maps fear categories to response modes for consistent handling

3. **Aviation Explanations System** (`lib/aviationExplanations.ts`)
   - Auto-learning knowledge base that generates explanations for flight-related triggers
   - Uses Anthropic Claude to generate structured explanations on first encounter
   - Caches explanations in database for future use
   - Provides "what you notice" → "what it really is" → "why it exists" → "what if it failed" structure

4. **Flight Phase Events** (`lib/flightPhaseEvents.ts`)
   - Comprehensive database of normal but anxiety-inducing flight events
   - Organized by 10 flight phases (gate, pushback, taxi, takeoff, climb, cruise, descent, approach, landing, taxi-in)
   - Each event includes trigger description, plain-language explanation, engineering rationale, and failure analysis
   - Powers the interactive "Weird but Normal" UI component with navigation and auto-play features

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

**Decision**: Simplified state tracking with lightweight adapter pattern
- **Rationale**: Keep state tracking minimal and focused on immediate conversation context (anxiety level, message count, session data) while providing adapter for more complex mode selection logic
- **Tradeoff**: Less granular state tracking initially, but simpler to maintain and easier to extend when richer data becomes available
- **Date**: November 2025 (removed complex EmotionalStateEngine in favor of focused otieStateEngine)

**Decision**: Two-stage LLM classification for fear assessment
- **Rationale**: Separates fear category detection from response generation, allowing for better mode mapping and more consistent responses
- **Tradeoff**: Requires two LLM calls per message (slight latency increase), but provides better context awareness and more targeted interventions

**Decision**: Mode-based OTIE personality system with 4 distinct modes
- **Rationale**: Provides consistent, contextually appropriate responses without complex prompt engineering
- **Modes**: BASELINE (mild unease), CALM_REFRAME (moderate anxiety), FEAR_SPIKE (high anxiety/panic), TURBULENCE_SUPPORT (turbulence-specific)
- **Tradeoff**: Fixed mode transitions rather than fluid personality shifts, but more predictable and debuggable

**Decision**: Auto-learning aviation explanations with LLM generation
- **Rationale**: Covers infinite edge cases without manual content creation
- **Tradeoff**: Requires LLM API costs, but scales indefinitely and improves over time

**Decision**: Supabase over custom backend
- **Rationale**: Faster development, built-in real-time capabilities, integrated auth
- **Tradeoff**: Vendor lock-in, but suitable for MVP and early growth stages

**Decision**: Separation of flight phase events into static data structure
- **Rationale**: Allows for UI innovation (random selection, gamification, auto-play) without database queries
- **Tradeoff**: Harder to update content dynamically, but better performance and offline capability