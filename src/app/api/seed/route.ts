import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/seed - Seed the database with initial data
export async function POST() {
  try {
    // Create default admin user if none exists
    const adminCount = await db.user.count({ where: { role: 'admin' } });
    if (adminCount === 0) {
      await db.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
          username: 'admin',
          password: 'admin123',
          fullName: 'مدير النظام',
          role: 'admin',
          isActive: true,
        },
      });
    }

    // Create default categories
    const categoriesData = [
      { name: 'مشروبات', color: '#ef4444' },
      { name: 'وجبات سريعة', color: '#f97316' },
      { name: 'حلويات', color: '#eab308' },
      { name: 'مكسرات', color: '#22c55e' },
      { name: 'منتجات ألبان', color: '#14b8a6' },
      { name: 'مواد تموينية', color: '#6366f1' },
      { name: 'عناية شخصية', color: '#8b5cf6' },
      { name: 'متنوع', color: '#64748b' },
    ];

    const createdCategories: { id: string; name: string }[] = [];
    for (const cat of categoriesData) {
      const existing = await db.category.findFirst({ where: { name: cat.name } });
      if (!existing) {
        const category = await db.category.create({
          data: { name: cat.name, color: cat.color },
          select: { id: true, name: true },
        });
        createdCategories.push(category);
      } else {
        createdCategories.push({ id: existing.id, name: existing.name });
      }
    }

    // Create sample products
    const productsData = [
      { name: 'بيبسي 330 مل', nameEn: 'Pepsi 330ml', categoryId: createdCategories[0]?.id, costPrice: 2.5, sellPrice: 4, quantity: 100, minQuantity: 20 },
      { name: 'كوكاكولا 330 مل', nameEn: 'Coca-Cola 330ml', categoryId: createdCategories[0]?.id, costPrice: 2.5, sellPrice: 4, quantity: 120, minQuantity: 20 },
      { name: 'ماء معدني 500 مل', nameEn: 'Water 500ml', categoryId: createdCategories[0]?.id, costPrice: 0.5, sellPrice: 1.5, quantity: 200, minQuantity: 50 },
      { name: 'عصير برتقال 1 لتر', nameEn: 'Orange Juice 1L', categoryId: createdCategories[0]?.id, costPrice: 5, sellPrice: 8, quantity: 50, minQuantity: 10 },
      { name: 'شاي أخضر 20 كيس', nameEn: 'Green Tea 20 bags', categoryId: createdCategories[0]?.id, costPrice: 3, sellPrice: 6, quantity: 80, minQuantity: 15 },
      { name: 'برجر لحم', nameEn: 'Beef Burger', categoryId: createdCategories[1]?.id, costPrice: 8, sellPrice: 15, quantity: 30, minQuantity: 5 },
      { name: 'شاورما دجاج', nameEn: 'Chicken Shawarma', categoryId: createdCategories[1]?.id, costPrice: 5, sellPrice: 10, quantity: 40, minQuantity: 5 },
      { name: 'بيتزا مارغريتا', nameEn: 'Margherita Pizza', categoryId: createdCategories[1]?.id, costPrice: 10, sellPrice: 20, quantity: 15, minQuantity: 5 },
      { name: 'ساندويتش كلوب', nameEn: 'Club Sandwich', categoryId: createdCategories[1]?.id, costPrice: 7, sellPrice: 14, quantity: 20, minQuantity: 5 },
      { name: 'كيك شوكولاتة', nameEn: 'Chocolate Cake', categoryId: createdCategories[2]?.id, costPrice: 15, sellPrice: 28, quantity: 10, minQuantity: 3 },
      { name: 'كرواسون', nameEn: 'Croissant', categoryId: createdCategories[2]?.id, costPrice: 3, sellPrice: 7, quantity: 25, minQuantity: 5 },
      { name: 'بسكويت بالشوكولاتة', nameEn: 'Chocolate Biscuits', categoryId: createdCategories[2]?.id, costPrice: 2, sellPrice: 5, quantity: 60, minQuantity: 10 },
      { name: 'كاجو 500 جرام', nameEn: 'Cashew 500g', categoryId: createdCategories[3]?.id, costPrice: 30, sellPrice: 48, quantity: 15, minQuantity: 5 },
      { name: 'لوز 500 جرام', nameEn: 'Almonds 500g', categoryId: createdCategories[3]?.id, costPrice: 25, sellPrice: 40, quantity: 20, minQuantity: 5 },
      { name: 'فستق 500 جرام', nameEn: 'Pistachio 500g', categoryId: createdCategories[3]?.id, costPrice: 35, sellPrice: 55, quantity: 10, minQuantity: 3 },
      { name: 'حليب طازج 1 لتر', nameEn: 'Fresh Milk 1L', categoryId: createdCategories[4]?.id, costPrice: 4, sellPrice: 7, quantity: 40, minQuantity: 10 },
      { name: 'جبنة بيضاء 500 جرام', nameEn: 'White Cheese 500g', categoryId: createdCategories[4]?.id, costPrice: 8, sellPrice: 14, quantity: 25, minQuantity: 5 },
      { name: 'لبن 1 لتر', nameEn: 'Yogurt 1L', categoryId: createdCategories[4]?.id, costPrice: 3, sellPrice: 6, quantity: 50, minQuantity: 10 },
      { name: 'رز بسمتي 5 كجم', nameEn: 'Basmati Rice 5kg', categoryId: createdCategories[5]?.id, costPrice: 20, sellPrice: 32, quantity: 30, minQuantity: 10 },
      { name: 'زيت ذرة 1.5 لتر', nameEn: 'Corn Oil 1.5L', categoryId: createdCategories[5]?.id, costPrice: 12, sellPrice: 20, quantity: 25, minQuantity: 5 },
      { name: 'سكر 1 كجم', nameEn: 'Sugar 1kg', categoryId: createdCategories[5]?.id, costPrice: 4, sellPrice: 7, quantity: 60, minQuantity: 15 },
      { name: 'شامبو 400 مل', nameEn: 'Shampoo 400ml', categoryId: createdCategories[6]?.id, costPrice: 8, sellPrice: 15, quantity: 35, minQuantity: 10 },
      { name: 'صابون سائل 1 لتر', nameEn: 'Liquid Soap 1L', categoryId: createdCategories[6]?.id, costPrice: 5, sellPrice: 10, quantity: 40, minQuantity: 10 },
      { name: 'معجون أسنان', nameEn: 'Toothpaste', categoryId: createdCategories[6]?.id, costPrice: 3, sellPrice: 7, quantity: 50, minQuantity: 15 },
    ];

    for (const product of productsData) {
      const existing = await db.product.findFirst({ where: { name: product.name } });
      if (!existing) {
        await db.product.create({
          data: {
            name: product.name,
            nameEn: product.nameEn || null,
            barcode: null,
            categoryId: product.categoryId || null,
            costPrice: product.costPrice,
            sellPrice: product.sellPrice,
            quantity: product.quantity,
            minQuantity: product.minQuantity,
            unit: 'قطعة',
            isActive: true,
          },
        });
      }
    }

    // Create default settings
    const defaultSettings = [
      { key: 'storeName', value: 'متجري' },
      { key: 'storeAddress', value: '' },
      { key: 'storePhone', value: '' },
      { key: 'taxRate', value: '15' },
      { key: 'currency', value: 'ر.س' },
      { key: 'lowStockAlert', value: 'true' },
      { key: 'receiptFooter', value: 'شكراً لتعاملكم معنا' },
    ];

    for (const setting of defaultSettings) {
      await db.setting.upsert({
        where: { key: setting.key },
        update: {},
        create: setting,
      });
    }

    // Get summary counts
    const [userCount, categoryCount, productCount, settingsCount] = await Promise.all([
      db.user.count(),
      db.category.count(),
      db.product.count(),
      db.setting.count(),
    ]);

    return NextResponse.json({
      success: true,
      message: 'تم تهيئة قاعدة البيانات بنجاح',
      data: {
        users: userCount,
        categories: categoryCount,
        products: productCount,
        settings: settingsCount,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ أثناء تهيئة قاعدة البيانات';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
