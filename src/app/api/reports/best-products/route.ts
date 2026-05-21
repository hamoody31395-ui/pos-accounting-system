import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/reports/best-products?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Build sale filter (isDeleted is on Sale, not SaleItem)
    const saleFilter: Record<string, unknown> = { isDeleted: false };
    if (from && to) {
      const start = new Date(from);
      start.setHours(0, 0, 0, 0);
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      saleFilter.createdAt = { gte: start, lte: end };
    }

    const bestProducts = await db.saleItem.groupBy({
      by: ['productId', 'productName'],
      where: {
        sale: saleFilter,
      },
      _sum: {
        quantity: true,
        total: true,
        costPrice: true,
        price: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 20,
    });

    const result = bestProducts.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      totalQuantity: item._sum.quantity || 0,
      totalRevenue: item._sum.total || 0,
      totalProfit: (item._sum.total || 0) - (item._sum.costPrice || 0) * (item._sum.quantity || 0),
    }));

    // Sort by profit descending
    result.sort((a, b) => b.totalProfit - a.totalProfit);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ أثناء إنشاء التقرير';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
