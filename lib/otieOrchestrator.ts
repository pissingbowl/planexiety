import Anthropic from "@anthropic-ai/sdk";
import { getUserState, updateUserState } from "./otieStateEngine";
import { OTIE_MODES } from "./otieModes";
import { getMockFlightContext } from "./mockFlightContext";
import { buildOTIEPrompt } from "./OTIEPromptBuilder";
import { selectOTIEMode } from "./otieModeSelector";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function processOTIEMessage(
  message: string,
  anxietyLevel: number
) {
  // 1) Update + read emotional state
  updateUserState(message, anxietyLevel);
  const state = getUserState();

  // 2) Get flight context (currently mock)
  const flight = getMockFlightContext();

  // 3) Adapt state to expected format for mode selector
  const adaptedState = {
    lastAnxietyLevel: state.anxietyLevel,
    averageAnxiety: state.anxietyLevel,
    spikesInRow: state.anxietyLevel >= 7 ? 1 : 0,
    trend: "stable" as const,
  };

  // 4) Decide OTIE mode with smarter logic
  const mode = selectOTIEMode(anxietyLevel, adaptedState, flight);

  // 5) Build OTIE prompt
  const prompt = buildOTIEPrompt(mode, message, adaptedState, flight);

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

  // 7) Return response bundle for UI
  return {
    otieResponse: text,
    mode,
    state,
    flight,
  };
}