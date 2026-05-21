import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PUT /api/categories/:id - Update category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, color } = body;

    const existing = await db.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'التصنيف غير موجود' },
        { status: 404 }
      );
    }

    const category = await db.category.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(color !== undefined && { color }),
      },
    });

    return NextResponse.json({ success: true, data: category, message: 'تم تحديث التصنيف بنجاح' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ أثناء تحديث التصنيف';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE /api/categories/:id - Delete category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'التصنيف غير موجود' },
        { status: 404 }
      );
    }

    await db.category.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'تم حذف التصنيف بنجاح' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ أثناء حذف التصنيف';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
