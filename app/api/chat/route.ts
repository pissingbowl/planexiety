// app/api/chat/route.ts

import { NextRequest, NextResponse } from "next/server";
import { processOTIEMessage } from "@/lib/otieOrchestrator"; // adjust path if needed

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      userId,
      message,
      anxietyLevel,
      flightContext,
    }: {
      userId: string;
      message: string;
      anxietyLevel: number;
      flightContext?: any;
    } = body;

    if (!userId || !message || typeof anxietyLevel !== "number") {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const otieResponse = await processOTIEMessage({
      userId,
      userMessage: message,
      currentAnxietyLevel: anxietyLevel,
      flightContext,
    });

    return NextResponse.json(
      {
        message: otieResponse.otieResponse,
        mode: otieResponse.mode,
        currentAnxietyLevel: otieResponse.currentAnxietyLevel,
        processingTimeMs: otieResponse.processingTimeMs,
        aviationExplanation: otieResponse.aviationExplanation,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("OTIE /api/chat error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: "healthy" });
}
