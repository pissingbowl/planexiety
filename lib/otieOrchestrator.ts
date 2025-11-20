import Anthropic from "@anthropic-ai/sdk";
import { getUserState, updateUserState } from "./otieStateEngine";
import { OTIE_MODES } from "./otieModes";
import { getMockFlightContext } from "./mockFlightContext";
import { buildOTIEPrompt } from "./OTIEPromptBuilder";
import { selectOTIEMode } from "./otieModeSelector";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// TypeScript interfaces for type safety
export interface OTIEMessageRequest {
  userId: string;
  userMessage: string;
  currentAnxietyLevel: number;
  flightContext?: any;
}

export interface OTIEMessageResponse {
  processingTimeMs: number;
  currentAnxietyLevel: number;
  aviationExplanation: any | null;
  toolOffered: any | null;
  charlieHandoff: boolean;
  snapshotId: string | null;
  interventionId: string | null;
  otieResponse: string;
  mode: string;
}

export async function processOTIEMessage(
  request: OTIEMessageRequest
): Promise<OTIEMessageResponse> {
  const startTime = Date.now();
  const { userId, userMessage, currentAnxietyLevel, flightContext } = request;
  
  // 1) Update + read emotional state
  updateUserState(userMessage, currentAnxietyLevel);
  const state = getUserState();

  // 2) Get flight context (use provided context or fall back to mock)
  const flight = flightContext || getMockFlightContext();

  // 3) Adapt state to expected format for mode selector
  const adaptedState = {
    lastAnxietyLevel: state.anxietyLevel,
    averageAnxiety: state.anxietyLevel,
    spikesInRow: state.anxietyLevel >= 7 ? 1 : 0,
    trend: "stable" as const,
  };

  // 4) Decide OTIE mode with smarter logic
  const mode = selectOTIEMode(currentAnxietyLevel, adaptedState, flight);

  // 5) Build OTIE prompt
  const prompt = buildOTIEPrompt(mode, userMessage, adaptedState, flight);

  // 6) Call Anthropic (Haiku)
  const completion = await client.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 350,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const firstBlock = completion.content?.[0];
  const text = firstBlock && 'text' in firstBlock ? firstBlock.text : '';

  // Calculate processing time
  const processingTimeMs = Date.now() - startTime;

  // 7) Return response bundle matching expected interface
  return {
    processingTimeMs,
    currentAnxietyLevel: state.anxietyLevel,
    aviationExplanation: flight ? {
      flightPhase: flight.phase,
      altitude: flight.altitude,
      context: flight,
    } : null,
    toolOffered: null, // TODO: Implement tool offering logic
    charlieHandoff: false, // TODO: Implement handoff logic when anxiety is very high
    snapshotId: null, // TODO: Implement snapshot tracking
    interventionId: null, // TODO: Implement intervention tracking
    otieResponse: text,
    mode,
  };
}