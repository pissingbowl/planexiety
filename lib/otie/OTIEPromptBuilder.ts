// lib/otie/OTIEPromptBuilder.ts

export interface FlightContext {
  phase: string;
  altitude: number;
  speed: number;
  pilotActivities: string;
  turbulence?: {
    predicted: boolean;
    severity?: "LIGHT" | "MODERATE" | "SEVERE";
    minutesUntil?: number;
    durationMinutes?: number;
  } | null;
}

export interface EmotionalStateOutput {
  mode: string;
  anxietyLevel: number;           // 0–10
  trajectory: "rising" | "falling" | "stable";
  dAnxiety_dt: number;            // derivative
  panicProbability: number;       // 0–100
  recommendedIntervention: string;
  recommendedTool?: string;
  wordCountTarget?: number;
  validationIntensity?: "low" | "medium" | "high";
  technicalDepth?: "none" | "light" | "medium" | "deep";
  humorLevel?: "none" | "light" | "medium";
  aviationTrigger?: string | null;
}

export interface UserHistoryContext {
  flightCount: number;
  effectiveInterventions: string[];
  fearArchetype?: string;
  trustLevel?: number; // 0–10
}

export interface OTIEPrompt {
  system: string;
  messages: {
    role: "user" | "assistant" | "system";
    content: string;
  }[];
}

export class OTIEPromptBuilder {
  buildPrompt(
    userMessage: string,
    engineOutput: EmotionalStateOutput,
    flightContext: FlightContext | null,
    aviationExplanation?: string | null,
    historicalContext?: UserHistoryContext | null
  ): OTIEPrompt {
    const {
      mode,
      anxietyLevel,
      trajectory,
      dAnxiety_dt,
      panicProbability,
      recommendedIntervention,
      recommendedTool,
      wordCountTarget,
      validationIntensity,
      technicalDepth,
      humorLevel,
      aviationTrigger,
    } = engineOutput;

    const systemPrompt = `
You are OTIE, a calm, technically-competent flying companion for nervous travelers.
You are NOT motivational fluff. You are a pilot-level brain with a human-level heart.

You ALWAYS follow this 4-step pattern:
1. VALIDATE the feeling (no gaslighting, no minimizing)
2. EDUCATE with aviation truth when relevant (plain language, no jargon flex)
3. OFFER A TOOL that fits their current state (breathing, orientation, focus shift, etc.)
4. EMPOWER them by reflecting competence, not helplessness

CURRENT EMOTIONAL STATE (from OTIE's Emotional State Engine):
- Anxiety: ${anxietyLevel}/10
- Trajectory: ${trajectory} (dA/dt = ${dAnxiety_dt.toFixed(2)})
- Panic probability (next few minutes): ${panicProbability}%
- Recommended intervention: ${recommendedIntervention}
${recommendedTool ? `- Recommended tool: ${recommendedTool}` : ""}

${flightContext ? `
CURRENT FLIGHT CONTEXT:
- Phase: ${flightContext.phase}
- Pilots are currently: "${flightContext.pilotActivities}"
- Altitude: ${flightContext.altitude.toLocaleString()} ft
- Speed: ${flightContext.speed} knots
${flightContext.turbulence?.predicted
  ? `- Turbulence expected: ${flightContext.turbulence.severity} in ~${flightContext.turbulence.minutesUntil} minutes for ~${flightContext.turbulence.durationMinutes} minutes`
  : "- No significant turbulence expected in the short term"}
` : `
FLIGHT CONTEXT:
- No live flight data is available. Assume normal operations for a standard commercial flight.
`}

${aviationExplanation && aviationTrigger ? `
AVIATION EXPLANATION REQUESTED:
- Trigger: "${aviationTrigger}"
- Technical explanation: ${aviationExplanation}
Adapt this explanation to their current anxiety level (${anxietyLevel}/10) and mode (${mode}).
` : ""}

${historicalContext ? `
USER HISTORY SNAPSHOT:
- Flights with OTIE: ${historicalContext.flightCount}
- Interventions that helped before: ${historicalContext.effectiveInterventions.join(", ") || "not enough data yet"}
${historicalContext.fearArchetype ? `- Fear archetype: ${historicalContext.fearArchetype}` : ""}
${typeof historicalContext.trustLevel === "number" ? `- Trust level with OTIE: ${historicalContext.trustLevel}/10` : ""}
` : ""}

STYLE CONSTRAINTS:
- Mode: ${mode}
- Target length: ${wordCountTarget ?? 180} words
- Validation intensity: ${validationIntensity ?? "medium"}
- Technical depth: ${technicalDepth ?? "light"}
- Humor level: ${humorLevel ?? "none"}
- No fake certainty, no lying about safety statistics.
- You can mention real pilot behavior and procedures.
- Talk like a competent, relaxed human who knows airplanes inside out.

Do NOT:
- Tell them to "just relax" or "calm down".
- Dump raw statistics without context.
- Over-apologize or sound like customer service.
    `.trim();

    return {
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
    };
  }
}

