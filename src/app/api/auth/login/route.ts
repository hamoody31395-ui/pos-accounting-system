import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'اسم المستخدم وكلمة المرور مطلوبان' },
        { status: 400 }
      );
    }

    // Auto-create admin user if none exists
    const userCount = await db.user.count();
    if (userCount === 0) {
      await db.user.create({
        data: {
          username: 'admin',
          password: 'admin123',
          fullName: 'مدير النظام',
          role: 'admin',
          isActive: true,
        },
      });
    }

    // Find user by username
    const user = await db.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: 'هذا الحساب معطل' },
        { status: 401 }
      );
    }

    // Compare password directly (plain text for demo)
    if (user.password !== password) {
      return NextResponse.json(
        { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // Return user with token (userId as simple token)
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({
      success: true,
      data: {
        ...userWithoutPassword,
        token: user.id,
      },
      message: 'تم تسجيل الدخول بنجاح',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ في تسجيل الدخول';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
