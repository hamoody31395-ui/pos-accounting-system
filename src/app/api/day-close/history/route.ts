import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/day-close/history - All day close records
export async function GET() {
  try {
    const history = await db.dayClose.findMany({
      include: {
        user: {
          select: { fullName: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch day close history';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
