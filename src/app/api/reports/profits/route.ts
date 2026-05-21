import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/reports/profits?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const dateFilter: Record<string, unknown> = { isDeleted: false };
    if (from && to) {
      const start = new Date(from);
      start.setHours(0, 0, 0, 0);
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      dateFilter.createdAt = { gte: start, lte: end };
    }

    const salesResult = await db.sale.aggregate({
      where: dateFilter,
      _sum: {
        total: true,
        totalCost: true,
      },
    });

    const totalRevenue = salesResult._sum.total || 0;
    const totalCost = salesResult._sum.totalCost || 0;
    const totalProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        totalProfit: Math.round(totalProfit * 100) / 100,
        profitMargin: Math.round(profitMargin * 100) / 100,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch profits report';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
