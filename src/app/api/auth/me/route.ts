import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح - لم يتم توفير رمز المصادقة' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'رمز المصادقة غير صالح' },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: token },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: 'هذا الحساب معطل' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ أثناء جلب بيانات المستخدم';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
