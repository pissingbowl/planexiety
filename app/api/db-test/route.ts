// app/api/db-test/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import type { DBUser } from "@/lib/db-types";

export async function GET() {
  // Simple ping: try to fetch up to 5 users
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .limit(5)
    .returns<DBUser[]>();

  if (error) {
    console.error("DB test error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    users: data ?? [],
  });
}
