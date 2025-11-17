import { supabase } from './supabaseClient';
import { DBAviationExplanation } from './db-types';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function getOrCreateExplanation(trigger: string) {
  // 1. Try to match an existing record
  const { data: matches, error } = await supabase
    .from("aviation_explanations")
    .select("*")
    .ilike("trigger_phrase", `%${trigger}%`)
    .limit(1);

  if (error) throw error;

  if (matches && matches.length > 0) {
    // Found one — use it
    return matches[0] as DBAviationExplanation;
  }

  // 2. Otherwise: generate a new one
  const newEntry = await generateAviationExplanation(trigger);

  // 3. Insert into DB
  const { data: inserted, error: insertErr } = await supabase
    .from("aviation_explanations")
    .insert([newEntry])
    .select()
    .single();

  if (insertErr) throw insertErr;

  return inserted as DBAviationExplanation;
}

async function generateAviationExplanation(trigger: string) {
  const prompt = `
  You are OTIE, the Optimal Timing Intelligence Engine.
  A user is afraid because of this trigger phrase:

  "${trigger}"

  Your job is to produce a structured aviation explanation
  that helps people understand what's happening — calmly, factually,
  and in human language.

  Respond in JSON ONLY:

  {
    "category": "...",
    "phenomenon_name": "...",
    "sensory_channel": "...",
    "trigger_phrase": "...",
    "typical_fear_story": "...",
    "mundane_explanation": "...",
    "pilot_reality": "...",
    "everyday_analogy": "...",
    "otie_script_seed": "...",
    "tags": [...]
  }

  Rules:
  - Do NOT reassure with vague sentences
  - Use real mechanical truth when possible
  - It must be technically correct
  - Calm tone
  - Clear & vivid analogy is key
  `;

  const completion = await client.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 500,
    temperature: 0.3,
    messages: [{ role: "user", content: prompt }]
  });

  const json = JSON.parse(completion.content[0].text);

  return {
    ...json,
    created_at: new Date().toISOString(),
  };
}
