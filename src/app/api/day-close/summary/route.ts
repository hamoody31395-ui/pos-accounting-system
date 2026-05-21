import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/day-close/summary - Today's sales summary for day close
export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [salesResult, cashSalesResult, cardSalesResult, networkSalesResult, expensesResult] =
      await Promise.all([
        db.sale.aggregate({
          where: {
            createdAt: { gte: today, lt: tomorrow },
            isDeleted: false,
          },
          _sum: { total: true, totalCost: true },
          _count: true,
        }),
        db.sale.aggregate({
          where: {
            createdAt: { gte: today, lt: tomorrow },
            isDeleted: false,
            paymentMethod: 'cash',
          },
          _sum: { total: true },
        }),
        db.sale.aggregate({
          where: {
            createdAt: { gte: today, lt: tomorrow },
            isDeleted: false,
            paymentMethod: 'card',
          },
          _sum: { total: true },
        }),
        db.sale.aggregate({
          where: {
            createdAt: { gte: today, lt: tomorrow },
            isDeleted: false,
            paymentMethod: 'network',
          },
          _sum: { total: true },
        }),
        db.expense.aggregate({
          where: {
            createdAt: { gte: today, lt: tomorrow },
          },
          _sum: { amount: true },
        }),
      ]);

    const totalSales = salesResult._sum.total || 0;
    const totalCost = salesResult._sum.totalCost || 0;
    const totalExpenses = expensesResult._sum.amount || 0;
    const transactionCount = salesResult._count;
    const profit = totalSales - totalCost - totalExpenses;

    return NextResponse.json({
      success: true,
      data: {
        totalSales,
        cashSales: cashSalesResult._sum.total || 0,
        cardSales: cardSalesResult._sum.total || 0,
        networkSales: networkSalesResult._sum.total || 0,
        totalExpenses,
        transactionCount,
        profit,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch day close summary';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
