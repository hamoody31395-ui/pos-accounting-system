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

// GET /api/reports?type=daily-sales&date=
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type) {
      return NextResponse.json(
        { success: false, error: 'نوع التقرير مطلوب' },
        { status: 400 }
      );
    }

    switch (type) {
      case 'daily-sales':
        return handleDailySales(searchParams);
      case 'monthly-sales':
        return handleMonthlySales(searchParams);
      case 'best-products':
        return handleBestProducts(searchParams);
      case 'inventory':
        return handleInventory();
      case 'profits':
        return handleProfits(searchParams);
      default:
        return NextResponse.json(
          { success: false, error: 'نوع التقرير غير معروف' },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ أثناء إنشاء التقرير';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// Daily sales summary
async function handleDailySales(searchParams: URLSearchParams) {
  const date = searchParams.get('date');

  if (!date) {
    return NextResponse.json(
      { success: false, error: 'التاريخ مطلوب' },
      { status: 400 }
    );
  }

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
        discount: true,
        taxAmount: true,
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

  const totalSales = salesResult._sum.total || 0;
  const totalCost = salesResult._sum.totalCost || 0;
  const totalExpenses = expensesResult._sum.amount || 0;
  const transactionCount = salesResult._count;
  const avgTransaction = transactionCount > 0 ? totalSales / transactionCount : 0;
  const profit = totalSales - totalCost - totalExpenses;

  return NextResponse.json({
    success: true,
    data: {
      date,
      totalSales,
      totalCost,
      totalProfit: totalSales - totalCost,
      totalExpenses,
      netProfit: profit,
      transactionCount,
      avgTransaction: Math.round(avgTransaction * 100) / 100,
      totalDiscount: salesResult._sum.discount || 0,
      totalTax: salesResult._sum.taxAmount || 0,
    },
  });
}

// Monthly sales summary
async function handleMonthlySales(searchParams: URLSearchParams) {
  const month = searchParams.get('month');

  if (!month) {
    return NextResponse.json(
      { success: false, error: 'الشهر مطلوب (صيغة: YYYY-MM)' },
      { status: 400 }
    );
  }

  const [yearStr, monthStr] = month.split('-');
  const year = parseInt(yearStr, 10);
  const m = parseInt(monthStr, 10);

  if (isNaN(year) || isNaN(m) || m < 1 || m > 12) {
    return NextResponse.json(
      { success: false, error: 'صيغة الشهر غير صالحة' },
      { status: 400 }
    );
  }

  const monthStart = new Date(year, m - 1, 1);
  const monthEnd = new Date(year, m, 0, 23, 59, 59, 999);

  const [salesResult, expensesResult] = await Promise.all([
    db.sale.aggregate({
      where: {
        createdAt: { gte: monthStart, lte: monthEnd },
        isDeleted: false,
      },
      _sum: {
        total: true,
        totalCost: true,
        discount: true,
        taxAmount: true,
      },
      _count: true,
    }),
    db.expense.aggregate({
      where: {
        createdAt: { gte: monthStart, lte: monthEnd },
      },
      _sum: {
        amount: true,
      },
    }),
  ]);

  // Get daily breakdown
  const dailySales = await db.sale.groupBy({
    by: ['createdAt'],
    where: {
      createdAt: { gte: monthStart, lte: monthEnd },
      isDeleted: false,
    },
    _sum: {
      total: true,
      totalCost: true,
    },
    _count: true,
  });

  // Group by date
  const dailyBreakdown: Record<string, { total: number; profit: number; count: number }> = {};
  for (const sale of dailySales) {
    const dateKey = sale.createdAt.toISOString().split('T')[0];
    if (!dailyBreakdown[dateKey]) {
      dailyBreakdown[dateKey] = { total: 0, profit: 0, count: 0 };
    }
    dailyBreakdown[dateKey].total += sale._sum.total || 0;
    dailyBreakdown[dateKey].profit += (sale._sum.total || 0) - (sale._sum.totalCost || 0);
    dailyBreakdown[dateKey].count += sale._count;
  }

  const totalSales = salesResult._sum.total || 0;
  const totalCost = salesResult._sum.totalCost || 0;
  const totalExpenses = expensesResult._sum.amount || 0;
  const transactionCount = salesResult._count;
  const daysInMonth = new Date(year, m, 0).getDate();

  return NextResponse.json({
    success: true,
    data: {
      month,
      totalSales,
      totalCost,
      grossProfit: totalSales - totalCost,
      totalExpenses,
      netProfit: totalSales - totalCost - totalExpenses,
      transactionCount,
      avgDailySales: Math.round((totalSales / daysInMonth) * 100) / 100,
      totalDiscount: salesResult._sum.discount || 0,
      totalTax: salesResult._sum.taxAmount || 0,
      dailyBreakdown,
    },
  });
}

// Best selling products
async function handleBestProducts(searchParams: URLSearchParams) {
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const dateFilter: Record<string, unknown> = { isDeleted: false };
  if (startDate && endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    dateFilter.createdAt = { gte: start, lte: end };
  }

  const bestProducts = await db.saleItem.groupBy({
    by: ['productId', 'productName'],
    where: dateFilter,
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
    totalCost: (item._sum.costPrice || 0) * (item._sum.quantity || 0),
    totalProfit: (item._sum.total || 0) - (item._sum.costPrice || 0) * (item._sum.quantity || 0),
  }));

  // Sort by profit descending
  result.sort((a, b) => b.totalProfit - a.totalProfit);

  return NextResponse.json({
    success: true,
    data: result,
  });
}

// Current inventory status
async function handleInventory() {
  const products = await db.product.findMany({
    select: {
      id: true,
      name: true,
      nameEn: true,
      barcode: true,
      quantity: true,
      minQuantity: true,
      costPrice: true,
      sellPrice: true,
      unit: true,
      isActive: true,
      category: {
        select: { name: true },
      },
    },
    orderBy: { quantity: 'asc' },
  });

  const totalProducts = products.length;
  const lowStockProducts = products.filter((p) => p.quantity <= p.minQuantity && p.isActive);
  const outOfStockProducts = products.filter((p) => p.quantity === 0 && p.isActive);
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.costPrice * p.quantity), 0);
  const totalRetailValue = products.reduce((sum, p) => sum + (p.sellPrice * p.quantity), 0);

  return NextResponse.json({
    success: true,
    data: {
      summary: {
        totalProducts,
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length,
        totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
        totalRetailValue: Math.round(totalRetailValue * 100) / 100,
        potentialProfit: Math.round((totalRetailValue - totalInventoryValue) * 100) / 100,
      },
      products,
      lowStockProducts,
      outOfStockProducts,
    },
  });
}

// Profit report
async function handleProfits(searchParams: URLSearchParams) {
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const dateFilter: Record<string, unknown> = { isDeleted: false };
  const expenseFilter: Record<string, unknown> = {};

  if (startDate && endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    dateFilter.createdAt = { gte: start, lte: end };
    expenseFilter.createdAt = { gte: start, lte: end };
  } else if (startDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    dateFilter.createdAt = { gte: start };
    expenseFilter.createdAt = { gte: start };
  } else if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    dateFilter.createdAt = { lte: end };
    expenseFilter.createdAt = { lte: end };
  }

  const [salesResult, expensesResult] = await Promise.all([
    db.sale.aggregate({
      where: dateFilter,
      _sum: {
        total: true,
        totalCost: true,
        subtotal: true,
        discount: true,
        taxAmount: true,
      },
      _count: true,
    }),
    db.expense.aggregate({
      where: expenseFilter,
      _sum: {
        amount: true,
      },
      _count: true,
    }),
  ]);

  // Payment method breakdown
  const paymentBreakdown = await db.sale.groupBy({
    by: ['paymentMethod'],
    where: dateFilter,
    _sum: {
      total: true,
      _count: true,
    },
  });

  const totalSales = salesResult._sum.total || 0;
  const totalCost = salesResult._sum.totalCost || 0;
  const totalExpenses = expensesResult._sum.amount || 0;
  const grossProfit = totalSales - totalCost;
  const netProfit = grossProfit - totalExpenses;
  const profitMargin = totalSales > 0 ? ((netProfit / totalSales) * 100) : 0;

  return NextResponse.json({
    success: true,
    data: {
      period: {
        startDate: startDate || 'الكل',
        endDate: endDate || 'الكل',
      },
      sales: {
        totalSales: Math.round(totalSales * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        totalDiscount: salesResult._sum.discount || 0,
        totalTax: salesResult._sum.taxAmount || 0,
        transactionCount: salesResult._count,
      },
      expenses: {
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        expenseCount: expensesResult._count,
      },
      profit: {
        grossProfit: Math.round(grossProfit * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        profitMargin: Math.round(profitMargin * 100) / 100,
      },
      paymentBreakdown: paymentBreakdown.map((p) => ({
        method: p.paymentMethod,
        total: p._sum.total || 0,
        count: p._count,
      })),
    },
  });
}
