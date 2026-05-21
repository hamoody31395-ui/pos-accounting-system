import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/reports/monthly?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (!from || !to) {
      return NextResponse.json(
        { success: false, error: 'Date range (from, to) is required' },
        { status: 400 }
      );
    }

    const startDate = new Date(from);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(to);
    endDate.setHours(23, 59, 59, 999);

    const [salesResult, expensesResult] = await Promise.all([
      db.sale.aggregate({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          isDeleted: false,
        },
        _sum: {
          total: true,
          totalCost: true,
        },
        _count: true,
      }),
      db.expense.aggregate({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    const totalSales = salesResult._sum.total || 0;
    const totalCost = salesResult._sum.totalCost || 0;
    const totalProfit = totalSales - totalCost;
    const transactionCount = salesResult._count;
    const avgTransaction = transactionCount > 0 ? totalSales / transactionCount : 0;

    // Get daily breakdown
    const sales = await db.sale.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        isDeleted: false,
      },
      select: {
        createdAt: true,
        total: true,
        totalCost: true,
      },
    });

    const dailyMap = new Map<string, { totalSales: number; totalProfit: number; transactionCount: number }>();
    for (const sale of sales) {
      const dateKey = sale.createdAt.toISOString().split('T')[0];
      const existing = dailyMap.get(dateKey) || { totalSales: 0, totalProfit: 0, transactionCount: 0 };
      existing.totalSales += sale.total;
      existing.totalProfit += sale.total - sale.totalCost;
      existing.transactionCount += 1;
      dailyMap.set(dateKey, existing);
    }

    const breakdown = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        totalSales: Math.round(data.totalSales * 100) / 100,
        totalProfit: Math.round(data.totalProfit * 100) / 100,
        transactionCount: data.transactionCount,
        avgTransaction: data.transactionCount > 0 ? Math.round((data.totalSales / data.transactionCount) * 100) / 100 : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalSales: Math.round(totalSales * 100) / 100,
          totalProfit: Math.round(totalProfit * 100) / 100,
          transactionCount,
          avgTransaction: Math.round(avgTransaction * 100) / 100,
        },
        breakdown,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch monthly report';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
