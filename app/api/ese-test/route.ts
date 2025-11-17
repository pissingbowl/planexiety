// app/api/ese-test/route.ts
import { NextResponse } from "next/server";
import { emotionalStateEngine } from "../../../lib/EmotionalStateEngine";
import { mockUserState } from "../../../lib/mockUserState";

export async function GET() {
  // Simulate the user's latest message
  const userMessage =
    "The door just closed and I'm freaking out but trying to stay on the plane.";

  const output = emotionalStateEngine(userMessage, { ...mockUserState });

  return NextResponse.json({
    ok: true,
    userMessage,
    engineOutput: output,
  });
}
