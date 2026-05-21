import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/reports/inventory - All products ordered by quantity ascending
export async function GET() {
  try {
    const products = await db.product.findMany({
      include: {
        category: {
          select: { name: true },
        },
      },
      orderBy: { quantity: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch inventory report';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
