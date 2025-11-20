// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { processOTIEMessage } from '@/lib/otieOrchestrator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, message, anxietyLevel } = body;

    // Validate input
    if (!userId || !message) {
      return NextResponse.json(
        { ok: false, error: 'Missing userId or message' },
        { status: 400 }
      );
    }

    if (anxietyLevel === undefined || anxietyLevel < 0 || anxietyLevel > 10) {
      return NextResponse.json(
        { ok: false, error: 'anxietyLevel must be between 0 and 10' },
        { status: 400 }
      );
    }

    console.log(`[API /chat] Processing message for user ${userId}, anxiety=${anxietyLevel}`);

    // Call the orchestrator
    const result = await processOTIEMessage({
      userId,
      userMessage: message,
      currentAnxietyLevel: anxietyLevel,
    });

    console.log(`[API /chat] Orchestrator completed in ${result.processingTimeMs}ms`);

    // Return successful response
    return NextResponse.json({
      ok: true,
      response: result.otieResponse,
      mode: result.mode,
      anxietyLevel: result.currentAnxietyLevel,
      aviationContext: result.aviationExplanation !== null,
      toolOffered: result.toolOffered,
      charlieHandoff: result.charlieHandoff,
      metadata: {
        snapshotId: result.snapshotId,
        interventionId: result.interventionId,
        processingTimeMs: result.processingTimeMs,
      },
    });
  } catch (error) {
    console.error('[API /chat] Error:', error);
    
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
