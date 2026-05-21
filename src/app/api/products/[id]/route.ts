import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PUT /api/products/:id - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      isActive,
    } = body;

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

// DELETE /api/products/:id - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
