import { OTIE_MODES } from "./otieModes";

// Keep types loose so this works with your existing state + flight objects.
type Trend = "rising" | "falling" | "stable" | "unknown" | undefined;

interface UserStateLike {
  lastAnxietyLevel?: number;
  averageAnxiety?: number;
  spikesInRow?: number;
  trend?: Trend;
}

type FlightPhaseLike =
  | "gate"
  | "taxi"
  | "takeoff"
  | "climb"
  | "cruise"
  | "descent"
  | "approach"
  | "landing"
  | "unknown"
  | undefined;

type TurbulenceLike = "none" | "light" | "moderate" | "severe" | undefined;

interface FlightContextLike {
  phase?: FlightPhaseLike;
  turbulence?: TurbulenceLike;
}

export function selectOTIEMode(
  anxietyLevel: number,
  state: UserStateLike,
  flight: FlightContextLike
): OTIE_MODES {
  const trend = state.trend;
  const spikes = state.spikesInRow ?? 0;
  const phase = flight.phase;
  const turbulence = flight.turbulence ?? "none";

  // 1. Hard turbulence override
  if (turbulence === "moderate" || turbulence === "severe") {
    return OTIE_MODES.TURBULENCE_SUPPORT;
  }

  // 2. Strong immediate spike
  if (anxietyLevel >= 8) {
    return OTIE_MODES.FEAR_SPIKE;
  }

  // 3. Phase-specific heightened modes
  const isTakeoffPhase = phase === "takeoff" || phase === "climb";
  const isLandingPhase =
    phase === "descent" || phase === "approach" || phase === "landing";

  if (isTakeoffPhase && anxietyLevel >= 5) {
    return OTIE_MODES.TAKEOFF_SPIKE;
  }

  if (isLandingPhase && anxietyLevel >= 5) {
    return OTIE_MODES.LANDING_ANTICIPATION;
  }

  // 4. Repeated spikes → grounding
  if (spikes >= 3 || (trend === "rising" && anxietyLevel >= 6)) {
    return OTIE_MODES.GROUNDING;
  }

  // 5. Mild turbulence + moderate anxiety → turbulence support
  if (turbulence === "light" && anxietyLevel >= 5) {
    return OTIE_MODES.TURBULENCE_SUPPORT;
  }

  // 6. Default
  return OTIE_MODES.BASELINE;
}
