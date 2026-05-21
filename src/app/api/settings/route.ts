import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const DEFAULT_SETTINGS = {
  storeName: 'متجري',
  storeAddress: '',
  storePhone: '',
  taxRate: '15',
  currency: 'ر.س',
  lowStockAlert: 'true',
  receiptFooter: 'شكراً لتعاملكم معنا',
};

// GET /api/settings - Get all settings
export async function GET() {
  try {
    const settings = await db.setting.findMany();

    const settingsMap: Record<string, string> = {};
    for (const setting of settings) {
      settingsMap[setting.key] = setting.value;
    }

    // Merge with defaults for missing keys
    const result: Record<string, string | boolean | number> = {};
    for (const [key, defaultValue] of Object.entries(DEFAULT_SETTINGS)) {
      if (settingsMap[key] !== undefined) {
        if (key === 'taxRate') {
          result[key] = parseFloat(settingsMap[key]);
        } else if (key === 'lowStockAlert') {
          result[key] = settingsMap[key] === 'true';
        } else {
          result[key] = settingsMap[key];
        }
      } else {
        if (key === 'taxRate') {
          result[key] = parseFloat(defaultValue);
        } else if (key === 'lowStockAlert') {
          result[key] = defaultValue === 'true';
        } else {
          result[key] = defaultValue;
        }
      }
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ أثناء جلب الإعدادات';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PUT /api/settings - Update settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      storeName,
      storeAddress,
      storePhone,
      taxRate,
      currency,
      lowStockAlert,
      receiptFooter,
    } = body;

    const updates: { key: string; value: string }[] = [];

    if (storeName !== undefined) updates.push({ key: 'storeName', value: storeName });
    if (storeAddress !== undefined) updates.push({ key: 'storeAddress', value: storeAddress });
    if (storePhone !== undefined) updates.push({ key: 'storePhone', value: storePhone });
    if (taxRate !== undefined) updates.push({ key: 'taxRate', value: String(taxRate) });
    if (currency !== undefined) updates.push({ key: 'currency', value: currency });
    if (lowStockAlert !== undefined) updates.push({ key: 'lowStockAlert', value: String(lowStockAlert) });
    if (receiptFooter !== undefined) updates.push({ key: 'receiptFooter', value: receiptFooter });

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'لا توجد بيانات للتحديث' },
        { status: 400 }
      );
    }

    // Upsert all settings
    await db.$transaction(
      updates.map((update) =>
        db.setting.upsert({
          where: { key: update.key },
          update: { value: update.value },
          create: { key: update.key, value: update.value },
        })
      )
    );

    // Return updated settings
    const allSettings = await db.setting.findMany();
    const settingsMap: Record<string, string> = {};
    for (const setting of allSettings) {
      settingsMap[setting.key] = setting.value;
    }

    const result: Record<string, string | boolean | number> = {};
    for (const [key, defaultValue] of Object.entries(DEFAULT_SETTINGS)) {
      if (settingsMap[key] !== undefined) {
        if (key === 'taxRate') {
          result[key] = parseFloat(settingsMap[key]);
        } else if (key === 'lowStockAlert') {
          result[key] = settingsMap[key] === 'true';
        } else {
          result[key] = settingsMap[key];
        }
      } else {
        if (key === 'taxRate') {
          result[key] = parseFloat(defaultValue);
        } else if (key === 'lowStockAlert') {
          result[key] = defaultValue === 'true';
        } else {
          result[key] = defaultValue;
        }
      }
    }

    return NextResponse.json({ success: true, data: result, message: 'تم تحديث الإعدادات بنجاح' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ أثناء تحديث الإعدادات';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
