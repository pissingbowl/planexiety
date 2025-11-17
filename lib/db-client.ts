// lib/db-client.ts
import { supabase } from "./supabaseClient";
import type {
  DBUser,
  DBFlight,
  DBEmotionalSnapshot,
  DBIntervention,
} from "./db-types";

// Simple: create a user (we'll use this later for onboarding)
export async function createUser(userData: Partial<DBUser>) {
  const { data, error } = await supabase
    .from("users")
    .insert([userData])
    .select()
    .single<DBUser>();

  if (error) {
    console.error("createUser error:", error);
    throw error;
  }

  return data;
}

// Get the latest active flight for a user (if any)
export async function getActiveFlightForUser(userId: string) {
  const { data, error } = await supabase
    .from("flights")
    .select("*")
    .eq("user_id", userId)
    .eq("completed", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<DBFlight>();

  if (error) {
    console.error("getActiveFlightForUser error:", error);
    throw error;
  }

  return data; // can be null if no active flight
}

// Save a snapshot (ESE state dump)
export async function saveEmotionalSnapshot(
  snapshot: Partial<DBEmotionalSnapshot>
) {
  const { data, error } = await supabase
    .from("emotional_snapshots")
    .insert([snapshot])
    .select()
    .single<DBEmotionalSnapshot>();

  if (error) {
    console.error("saveEmotionalSnapshot error:", error);
    throw error;
  }

  return data;
}

// Save an intervention record (what OTIE did)
export async function saveIntervention(intervention: Partial<DBIntervention>) {
  const { data, error } = await supabase
    .from("interventions")
    .insert([intervention])
    .select()
    .single<DBIntervention>();

  if (error) {
    console.error("saveIntervention error:", error);
    throw error;
  }

  return data;
}
