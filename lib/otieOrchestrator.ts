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

  // 3) Decide OTIE mode with smarter logic
  const mode = selectOTIEMode(anxietyLevel, state, flight);

  // 4) Build OTIE prompt
  const prompt = buildOTIEPrompt(mode, message, state, flight);

  // 5) Call Anthropic (Haiku)
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

  const text =
    (completion.content &&
      (completion.content[0] as any)?.text) ??
    "";

  // 6) Return response bundle for UI
  return {
    otieResponse: text,
    mode,
    state,
    flight,
  };
}