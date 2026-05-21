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

// PUT /api/expenses/:id - Update expense
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { category, amount, description } = body;

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

// DELETE /api/expenses/:id - Delete expense
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const { id } = await params;

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
