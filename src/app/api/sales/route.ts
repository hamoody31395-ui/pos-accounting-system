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

// Helper: generate invoice number INV-YYYYMMDD-XXXX
async function generateInvoiceNumber(): Promise<string> {
  const today = new Date();
  const dateStr = today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, '0') +
    String(today.getDate()).padStart(2, '0');

  const prefix = `INV-${dateStr}-`;

  // Find last invoice for today
  const lastSale = await db.sale.findFirst({
    where: {
      invoiceNumber: { startsWith: prefix },
    },
    orderBy: { invoiceNumber: 'desc' },
    select: { invoiceNumber: true },
  });

  let sequence = 1;
  if (lastSale) {
    const parts = lastSale.invoiceNumber.split('-');
    sequence = parseInt(parts[2], 10) + 1;
  }

  return `${prefix}${String(sequence).padStart(4, '0')}`;
}

// GET /api/sales?date=&startDate=&endDate=&page=1&limit=50&invoiceNumber=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const invoiceNumber = searchParams.get('invoiceNumber');
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const skip = (page - 1) * limit;

    // If invoiceNumber is provided, return specific sale
    if (invoiceNumber) {
      const sale = await db.sale.findUnique({
        where: { invoiceNumber },
        include: {
          user: {
            select: { fullName: true },
          },
          items: true,
        },
      });

      if (!sale) {
        return NextResponse.json(
          { success: false, error: 'الفاتورة غير موجودة' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: sale });
    }

    // Build date filter
    const dateFilter: Record<string, unknown> = {};
    if (date) {
      // Filter for a specific day
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

    const [sales, total] = await Promise.all([
      db.sale.findMany({
        where,
        include: {
          user: {
            select: { fullName: true },
          },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.sale.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        sales,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ أثناء جلب المبيعات';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/sales - Create sale
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
      items,
      subtotal,
      discount,
      taxRate,
      taxAmount,
      totalCost,
      total,
      paymentMethod,
      paidAmount,
      changeAmount,
      notes,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'عناصر الفاتورة مطلوبة' },
        { status: 400 }
      );
    }

    if (!total || total <= 0) {
      return NextResponse.json(
        { success: false, error: 'مبلغ الفاتورة غير صالح' },
        { status: 400 }
      );
    }

    // Check product quantities and decrease them
    for (const item of items) {
      const product = await db.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return NextResponse.json(
          { success: false, error: `المنتج غير موجود: ${item.productName}` },
          { status: 400 }
        );
      }

      if (product.quantity < item.quantity) {
        return NextResponse.json(
          { success: false, error: `الكمية غير متوفرة للمنتج: ${item.productName}. المتوفر: ${product.quantity}` },
          { status: 400 }
        );
      }
    }

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Create sale with items in a transaction
    const sale = await db.$transaction(async (tx) => {
      // Create the sale
      const newSale = await tx.sale.create({
        data: {
          invoiceNumber,
          userId: authUser.id,
          subtotal: subtotal || 0,
          discount: discount || 0,
          taxRate: taxRate || 15,
          taxAmount: taxAmount || 0,
          totalCost: totalCost || 0,
          total,
          paymentMethod: paymentMethod || 'cash',
          paidAmount: paidAmount || 0,
          changeAmount: changeAmount || 0,
          notes: notes || null,
          items: {
            create: items.map((item: {
              productId: string;
              productName: string;
              quantity: number;
              price: number;
              costPrice: number;
              total: number;
            }) => ({
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              price: item.price,
              costPrice: item.costPrice,
              total: item.total,
            })),
          },
        },
        include: {
          user: {
            select: { fullName: true },
          },
          items: true,
        },
      });

      // Decrease product quantities
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      return newSale;
    });

    return NextResponse.json(
      { success: true, data: sale, message: 'تم إنشاء الفاتورة بنجاح' },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ أثناء إنشاء الفاتورة';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
