import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper: get auth user from request
async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '');
  const user = await db.user.findUnique({
    where: { id: token },
    select: { id: true, role: true, isActive: true },
  });
  return user && user.isActive ? user : null;
}

// GET /api/expenses?date=&startDate=&endDate=&page=1&limit=50
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const category = searchParams.get('category');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const skip = (page - 1) * limit;

    // Build date filter
    const dateFilter: Record<string, unknown> = {};
    if (date) {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      dateFilter.createdAt = { gte: dayStart, lte: dayEnd };
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.createdAt = { gte: start, lte: end };
    } else if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      dateFilter.createdAt = { gte: start };
    } else if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.createdAt = { lte: end };
    }

    const where: Record<string, unknown> = { ...dateFilter };
    if (category) {
      where.category = category;
    }

    const [expenses, total] = await Promise.all([
      db.expense.findMany({
        where,
        include: {
          user: {
            select: { fullName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.expense.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: expenses,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ أثناء جلب المصروفات';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/expenses - Create expense
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
    const { category, amount, description } = body;

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'تصنيف المصروف مطلوب' },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'مبلغ المصروف غير صالح' },
        { status: 400 }
      );
    }

    const expense = await db.expense.create({
      data: {
        userId: authUser.id,
        category,
        amount,
        description: description || null,
      },
      include: {
        user: {
          select: { fullName: true },
        },
      },
    });

    return NextResponse.json(
      { success: true, data: expense, message: 'تم إنشاء المصروف بنجاح' },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ أثناء إنشاء المصروف';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PUT /api/expenses - Update expense
export async function PUT(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, category, amount, description } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف المصروف مطلوب' },
        { status: 400 }
      );
    }

    const existing = await db.expense.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'المصروف غير موجود' },
        { status: 404 }
      );
    }

    const expense = await db.expense.update({
      where: { id },
      data: {
        ...(category !== undefined && { category }),
        ...(amount !== undefined && { amount }),
        ...(description !== undefined && { description: description || null }),
      },
      include: {
        user: {
          select: { fullName: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: expense, message: 'تم تحديث المصروف بنجاح' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ أثناء تحديث المصروف';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE /api/expenses?id=xxx - Delete expense
export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف المصروف مطلوب' },
        { status: 400 }
      );
    }

    const existing = await db.expense.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'المصروف غير موجود' },
        { status: 404 }
      );
    }

    await db.expense.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'تم حذف المصروف بنجاح' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ أثناء حذف المصروف';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
