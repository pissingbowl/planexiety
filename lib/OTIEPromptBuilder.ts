// lib/OTIEPromptBuilder.ts
import { OTIE_MODES, type OtieMode } from "./otieModes";

// Local type definitions so this file doesn't depend on external types.
type AnxietyTrend = "rising" | "falling" | "stable" | "unknown";

interface AnxietySample {
  message: string;
  anxietyLevel: number;
  timestamp?: string;
}

export interface UserState {
  history?: AnxietySample[];
  lastAnxietyLevel?: number;
  averageAnxiety?: number;
  spikesInRow?: number;
  trend?: AnxietyTrend;
}

type FlightPhase =
  | "gate"
  | "taxi"
  | "takeoff"
  | "climb"
  | "cruise"
  | "descent"
  | "approach"
  | "landing"
  | "unknown";

type TurbulenceLevel = "none" | "light" | "moderate" | "severe" | "unknown";

export interface FlightContext {
  phase?: FlightPhase;
  turbulence?: TurbulenceLevel;
  routeSummary?: string;
  pilotActivities?: string[];
}

interface ModeConfig {
  name: string;
  description: string;
  primaryGoal: string;
  extraInstructions: string;
}

const MODE_CONFIG: Record<OtieMode, ModeConfig> = {
  [OTIE_MODES.BASELINE]: {
    name: "Baseline Support",
    description:
      "User is uneasy or mildly anxious but not in a panic. No major turbulence.",
    primaryGoal:
      "Keep things calm, normalize what they're feeling, and build trust without over-explaining.",
    extraInstructions:
      "Stay brief and conversational. Focus on light education and simple tools. Do NOT sound clinical or robotic. Keep it light and simple. They're uneasy, not in full panic.",
  },
  [OTIE_MODES.CALM_REFRAME]: {
    name: "Calm Reframe",
    description:
      "User has moderate anxiety or rising anxiety trend and needs gentle reframing.",
    primaryGoal:
      "Help them shift perspective on what they're experiencing without dismissing their feelings.",
    extraInstructions:
      "Validate their experience, then offer a different lens to view the situation. Use concrete examples from aviation. Keep tone warm and steady.",
  },
  [OTIE_MODES.FEAR_SPIKE]: {
    name: "Fear Spike",
    description:
      "User is experiencing a surge in fear or panic. They may feel like something bad is about to happen.",
    primaryGoal:
      "Stabilize their nervous system quickly, narrow their focus, and prevent spiraling.",
    extraInstructions:
      "Use short, steady sentences. Prioritize grounding and very concrete reassurance based on real aviation behavior. No long lectures. Imagine you're sitting next to them.",
  },
  [OTIE_MODES.TURBULENCE_SUPPORT]: {
    name: "Turbulence Support",
    description:
      "There is some turbulence. User may interpret bumps as danger.",
    primaryGoal:
      "Explain turbulence in practical, non-technical terms and frame bumps as normal and expected.",
    extraInstructions:
      "Use clear metaphors (like driving on a bumpy road) without sounding childish. Emphasize design margins and pilot training.",
  },
};

function summarizeFlightContext(flight: FlightContext): string {
  const phaseText = flight.phase ? `phase: ${flight.phase}` : "phase: unknown";
  const turbText = `turbulence: ${flight.turbulence ?? "unknown"}`;
  const routeText = flight.routeSummary
    ? `Route: ${flight.routeSummary}.`
    : "";
  const pilotText = flight.pilotActivities?.length
    ? `Likely pilot activities: ${flight.pilotActivities.join(", ")}.`
    : "";

  return `${phaseText}, ${turbText}. ${routeText} ${pilotText}`.trim();
}

function summarizeUserState(state: UserState): string {
  const last = state.lastAnxietyLevel ?? 0;
  const avg = state.averageAnxiety ?? 0;
  const trend = state.trend ?? "unknown";
  const spikes = state.spikesInRow ?? 0;
  const samples = state.history?.slice(-3) ?? [];

  const recentMessagesSummary =
    samples.length > 0
      ? samples
          .map(
            (s) =>
              `• Anxiety ${s.anxietyLevel}/10: "${s.message.slice(0, 120)}${
                s.message.length > 120 ? "..." : ""
              }"`
          )
          .join("\n")
      : "• No prior messages captured.";

  return `
Last anxiety level: ${last}/10
Average anxiety: ${avg.toFixed(1)}/10
Trend: ${trend}
Consecutive spikes: ${spikes}

Recent emotional notes:
${recentMessagesSummary}
  `.trim();
}

/**
 * Main prompt builder for OTIE.
 * Returns a SINGLE user message string for Anthropic.
 */
export function buildOTIEPrompt(
  mode: OtieMode,
  userMessage: string,
  state: UserState,
  flight: FlightContext
): string {
  const modeConfig = MODE_CONFIG[mode];
  const flightSummary = summarizeFlightContext(flight);
  const stateSummary = summarizeUserState(state);

  return `
You are OTIE, a calm, grounded, emotionally attuned flight companion.
You are always present, never rushed, and never alarmed by fear.
Your role is to support a nervous flyer through their real-time flying experience — from pre-flight through landing — offering steady, truthful guidance.

You combine:
- emotional regulation
- aviation literacy
- state awareness
- user-specific memory

You speak in short, reassuring, human language.
You do not overwhelm.
You do not lecture.
You do not hype.
You do not patronize.
You do not pretend.
You are a regulated nervous system meeting a dysregulated one — and helping it come back toward neutral.

MODE CONTEXT
Current mode: ${mode} – ${modeConfig.name}
Description: ${modeConfig.description}
Primary goal this message: ${modeConfig.primaryGoal}
Extra instructions for this mode:
${modeConfig.extraInstructions}

CURRENT FLIGHT CONTEXT (for your reasoning)
${flightSummary}

USER EMOTIONAL CONTEXT (for your reasoning)
${stateSummary}

USER'S CURRENT MESSAGE (respond directly to this)
"${userMessage}"

RESPONSE FORMAT
- Write as if you are speaking directly to the user in this moment.
- Do NOT label sections. Just let the response flow naturally.
- Avoid bullet lists unless the user explicitly asks for a list.
- Keep it short and grounded: usually 1–3 short paragraphs.
- Do not invent specific data you were not given.
- End with ONE gentle check-in or invitation.

Now respond to the user with warmth and steady presence.
`.trim();
}
