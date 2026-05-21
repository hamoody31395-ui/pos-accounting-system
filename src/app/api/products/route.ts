import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/products?search=&categoryId=&page=1&limit=50&lowStock=true
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const lowStock = searchParams.get('lowStock') === 'true';
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { isActive: true };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nameEn: { contains: search } },
        { barcode: { contains: search } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (lowStock) {
      where.quantity = { lte: db.product.fields.minQuantity };
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, color: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.product.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ أثناء جلب المنتجات';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/products - Create product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      nameEn,
      barcode,
      categoryId,
      costPrice,
      sellPrice,
      quantity,
      minQuantity,
      unit,
    } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'اسم المنتج مطلوب' },
        { status: 400 }
      );
    }

    if (sellPrice === undefined || sellPrice <= 0) {
      return NextResponse.json(
        { success: false, error: 'سعر البيع مطلوب ويجب أن يكون أكبر من صفر' },
        { status: 400 }
      );
    }

    const product = await db.product.create({
      data: {
        name,
        nameEn: nameEn || null,
        barcode: barcode || null,
        categoryId: categoryId || null,
        costPrice: costPrice || 0,
        sellPrice,
        quantity: quantity || 0,
        minQuantity: minQuantity || 5,
        unit: unit || 'قطعة',
        isActive: true,
      },
      include: {
        category: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    return NextResponse.json(
      { success: true, data: product, message: 'تم إنشاء المنتج بنجاح' },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ أثناء إنشاء المنتج';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PUT /api/products - Update product
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      nameEn,
      barcode,
      categoryId,
      costPrice,
      sellPrice,
      quantity,
      minQuantity,
      unit,
      isActive,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف المنتج مطلوب' },
        { status: 400 }
      );
    }

    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'المنتج غير موجود' },
        { status: 404 }
      );
    }

    const product = await db.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(nameEn !== undefined && { nameEn: nameEn || null }),
        ...(barcode !== undefined && { barcode: barcode || null }),
        ...(categoryId !== undefined && { categoryId: categoryId || null }),
        ...(costPrice !== undefined && { costPrice }),
        ...(sellPrice !== undefined && { sellPrice }),
        ...(quantity !== undefined && { quantity }),
        ...(minQuantity !== undefined && { minQuantity }),
        ...(unit !== undefined && { unit }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        category: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: product, message: 'تم تحديث المنتج بنجاح' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ أثناء تحديث المنتج';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE /api/products?id=xxx - Delete product
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف المنتج مطلوب' },
        { status: 400 }
      );
    }

    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'المنتج غير موجود' },
        { status: 404 }
      );
    }

    // Check if product has sale items
    const saleItemCount = await db.saleItem.count({ where: { productId: id } });
    if (saleItemCount > 0) {
      // Soft delete instead
      await db.product.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        success: true,
        message: 'تم تعطيل المنتج (يوجد مبيعات مرتبطة)',
      });
    }

    await db.product.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'تم حذف المنتج بنجاح' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ أثناء حذف المنتج';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
