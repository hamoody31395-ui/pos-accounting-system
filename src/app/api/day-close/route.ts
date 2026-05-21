import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper: get auth user from request
async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '');
  const user = await db.user.findUnique({
    where: { id: token },
    select: { id: true, role: true, isActive: true, fullName: true },
  });
  return user && user.isActive ? user : null;
}

// GET /api/day-close?date= - Get day close for specific date
// GET /api/day-close - List all day closes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (date) {
      // Get day close for specific date
      const dayClose = await db.dayClose.findFirst({
        where: { date },
        include: {
          user: {
            select: { fullName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!dayClose) {
        return NextResponse.json(
          { success: false, error: 'لا يوجد إغلاق ليومية لهذا التاريخ' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: dayClose });
    }

    // List all day closes
    const dayCloses = await db.dayClose.findMany({
      include: {
        user: {
          select: { fullName: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ success: true, data: dayCloses });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ أثناء جلب إغلاق اليومية';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/day-close - Create day close record
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      date,
      expectedCash,
      actualCash,
      notes,
    } = body;

    if (!date) {
      return NextResponse.json(
        { success: false, error: 'التاريخ مطلوب' },
        { status: 400 }
      );
    }

    // Check if day close already exists for this date
    const existing = await db.dayClose.findFirst({ where: { date } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'يوجد إغلاق سابق لهذا التاريخ' },
        { status: 409 }
      );
    }

    // Calculate sales and expenses for the day
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const [salesResult, expensesResult] = await Promise.all([
      db.sale.aggregate({
        where: {
          createdAt: { gte: dayStart, lte: dayEnd },
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
          createdAt: { gte: dayStart, lte: dayEnd },
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    // Get payment method breakdown
    const paymentBreakdown = await db.sale.groupBy({
      by: ['paymentMethod'],
      where: {
        createdAt: { gte: dayStart, lte: dayEnd },
        isDeleted: false,
      },
      _sum: {
        total: true,
      },
    });

    const totalSales = salesResult._sum.total || 0;
    const totalCost = salesResult._sum.totalCost || 0;
    const totalExpenses = expensesResult._sum.amount || 0;
    const totalCardSales = paymentBreakdown.find((p) => p.paymentMethod === 'card')?._sum.total || 0;
    const totalNetSales = paymentBreakdown.find((p) => p.paymentMethod === 'network')?._sum.total || 0;
    const difference = (actualCash || 0) - (expectedCash || 0);
    const profit = totalSales - totalCost - totalExpenses;

    const dayClose = await db.dayClose.create({
      data: {
        userId: authUser.id,
        date,
        expectedCash: expectedCash || 0,
        actualCash: actualCash || 0,
        difference,
        totalSales,
        totalExpenses,
        totalCardSales,
        totalNetSales,
        profit,
        notes: notes || null,
      },
      include: {
        user: {
          select: { fullName: true },
        },
      },
    });

    return NextResponse.json(
      { success: true, data: dayClose, message: 'تم إغلاق اليومية بنجاح' },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ أثناء إغلاق اليومية';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
