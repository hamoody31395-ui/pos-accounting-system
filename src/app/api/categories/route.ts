import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/categories - List categories with product count
export async function GET() {
  try {
    const categories = await db.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ أثناء جلب التصنيفات';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/categories - Create category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, color } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'اسم التصنيف مطلوب' },
        { status: 400 }
      );
    }

    const category = await db.category.create({
      data: {
        name,
        color: color || '#6366f1',
      },
    });

    return NextResponse.json(
      { success: true, data: category, message: 'تم إنشاء التصنيف بنجاح' },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ أثناء إنشاء التصنيف';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PUT /api/categories - Update category
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, color } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف التصنيف مطلوب' },
        { status: 400 }
      );
    }

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

// DELETE /api/categories?id=xxx - Delete category
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف التصنيف مطلوب' },
        { status: 400 }
      );
    }

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
