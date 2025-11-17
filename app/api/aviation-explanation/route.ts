import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateExplanation } from '@/lib/aviationExplanations';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const trigger = searchParams.get('trigger');

  if (!trigger || trigger.trim().length === 0) {
    return NextResponse.json(
      { error: 'Missing "trigger" query parameter' },
      { status: 400 }
    );
  }

  try {
    const explanation = await getOrCreateExplanation(trigger);

    return NextResponse.json({
      ok: true,
      trigger,
      explanation,
    });
  } catch (err: any) {
    console.error('aviation-explanation error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
