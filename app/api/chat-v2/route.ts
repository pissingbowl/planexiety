import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// High-level label for what kind of fear this is
type FearCategory =
  | 'CRASHING'
  | 'TURBULENCE'
  | 'PANIC'
  | 'LOSS_OF_CONTROL'
  | 'CLAUSTROPHOBIA'
  | 'UNKNOWN';

// 1) Classify what kind of fear this message represents
async function classifyFear(
  message: string,
  anxietyLevel: number
): Promise<FearCategory> {
  const completion = await client.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 80,
    system: `
You are a classifier for fear-of-flying messages.
You must decide what MAIN fear is active.

Return ONE WORD ONLY from this list (no quotes, no explanation):
CRASHING, TURBULENCE, PANIC, LOSS_OF_CONTROL, CLAUSTROPHOBIA, UNKNOWN.
`,
    messages: [
      {
        role: 'user',
        content: `Passenger message: "${message}"
Current anxiety (0-10): ${anxietyLevel}`,
      },
    ],
  });

  const raw = completion.content?.[0]?.text?.trim().toUpperCase() || '';

  const allowed: FearCategory[] = [
    'CRASHING',
    'TURBULENCE',
    'PANIC',
    'LOSS_OF_CONTROL',
    'CLAUSTROPHOBIA',
    'UNKNOWN',
  ];

  const match = allowed.find((v) => raw.startsWith(v));
  return match ?? 'UNKNOWN';
}

// 2) Map fear category + intensity into an OTIE mode label
function pickMode(category: FearCategory, anxietyLevel: number): string {
  if (anxietyLevel >= 7 && category === 'PANIC') return 'PANIC_COACHING';
  if (category === 'CRASHING') return 'CRASHING_SUPPORT';
  if (category === 'TURBULENCE') return 'TURBULENCE_SUPPORT';
  if (category === 'LOSS_OF_CONTROL') return 'CONTROL_EXPLANATION';
  if (category === 'CLAUSTROPHOBIA') return 'SPACE_GROUNDING';
  return 'GENERAL_REASSURANCE';
}

// 3) Build the system prompt that gives OTIE its “job” for THIS message
function buildSystemPrompt(
  category: FearCategory,
  mode: string,
  anxietyLevel: number
): string {
  return `
You are OTIE, a calm, non-patronizing flight companion.
You speak in short, grounded, plain English.
You NEVER dramatize. You normalize and de-escalate.

Core identity:
- You know how airplanes, pilots, and procedures work.
- You know how the human nervous system behaves under fear.
- You care about accuracy AND emotional safety.
- You never lie, you never say "nothing bad can ever happen".
- You frame things as: "this is designed for" / "this is expected" / "here's what's normal".

User context:
- Reported anxiety (0-10): ${anxietyLevel}
- Detected fear category: ${category}
- OTIE mode: ${mode}

Response rules:
1) Start by validating the feeling in ONE short sentence.
2) Then explain what is actually happening in normal, specific language.
3) Show why this is routine / designed / accounted for.
4) Offer ONE simple next step (breath, posture, attention, or perspective).
5) Stay under ~4 short sentences total.

Tone:
- Warm, steady, matter-of-fact.
- No emojis, no hype, no jokes unless extremely gentle.
- Talk like a very experienced pilot who is also good with anxious people.
`;
}

// 4) Main handler – wire it all together
export async function POST(request: NextRequest) {
  try {
    const { message, anxietyLevel = 5, userId, flightId } =
      await request.json();

    if (!message) {
      return NextResponse.json(
        { ok: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    const normalizedAnxiety = Math.min(
      10,
      Math.max(0, Number(anxietyLevel) || 0)
    );

    // Step A: classify what kind of fear this is
    const category = await classifyFear(message, normalizedAnxiety);

    // Step B: choose OTIE mode
    const mode = pickMode(category, normalizedAnxiety);

    // Step C: ask OTIE to respond in that mode
    const completion = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 350,
      system: buildSystemPrompt(category, mode, normalizedAnxiety),
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
    });

    const text = completion.content?.[0]?.text ?? '';

    return NextResponse.json({
      ok: true,
      response: text,
      mode,
      fearCategory: category,
      anxietyLevel: normalizedAnxiety,
      userId: userId ?? null,
      flightId: flightId ?? null,
    });
  } catch (err: any) {
    console.error('OTIE API Error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}
