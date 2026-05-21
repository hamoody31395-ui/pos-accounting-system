import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * POST /api/auth/register
 * تسجيل مشترك جديد - New User Registration
 * 
 * القواعد:
 * - إذا لم يكن هناك أي مستخدم في النظام، يسمح بإنشاء حساب مدير
 * - إذا كان هناك مستخدمين، يجب توفير رمز المصادقة (token) الخاص بمدير
 * - اسم المستخدم يجب أن يكون فريداً
 * - كلمة المرور يجب أن تكون 4 أحرف على الأقل
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, fullName, role, adminToken } = body;

    // التحقق من الحقول المطلوبة
    if (!username || !password || !fullName) {
      return NextResponse.json(
        { success: false, error: 'اسم المستخدم وكلمة المرور والاسم الكامل مطلوبان' },
        { status: 400 }
      );
    }

    // التحقق من طول اسم المستخدم
    if (username.length < 3) {
      return NextResponse.json(
        { success: false, error: 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل' },
        { status: 400 }
      );
    }

    // التحقق من طول كلمة المرور
    if (password.length < 4) {
      return NextResponse.json(
        { success: false, error: 'كلمة المرور يجب أن تكون 4 أحرف على الأقل' },
        { status: 400 }
      );
    }

    // التحقق من الأدوات الخاصة (حروف إنجليزية وأرقام فقط لاسم المستخدم)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { success: false, error: 'اسم المستخدم يجب أن يحتوي على حروف إنجليزية وأرقام فقط' },
        { status: 400 }
      );
    }

    // التحقق من صلاحية الدور
    const validRoles = ['admin', 'cashier', 'accountant'];
    const userRole = role || 'cashier';
    if (!validRoles.includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'صلاحية المستخدم غير صالحة' },
        { status: 400 }
      );
    }

    // التحقق من عدد المستخدمين في النظام
    const userCount = await db.user.count();

    if (userCount === 0) {
      // أول مستخدم - يكون مدير تلقائياً
      // إذا كان النظام فارغ، نسمح بإنشاء أول حساب كمدير
      const newUser = await db.user.create({
        data: {
          username: username.toLowerCase().trim(),
          password,
          fullName: fullName.trim(),
          role: 'admin', // أول مستخدم يكون مدير دائماً
          isActive: true,
        },
      });

      const { password: _, ...userWithoutPassword } = newUser;
      return NextResponse.json({
        success: true,
        data: {
          ...userWithoutPassword,
          token: newUser.id,
        },
        message: 'تم إنشاء حساب المدير بنجاح! يمكنك الآن تسجيل الدخول',
      });
    }

    // إذا كان هناك مستخدمين بالفعل، نحتاج التحقق من صلاحية المدير
    if (!adminToken) {
      return NextResponse.json(
        { success: false, error: 'يجب توفير رمز المصادقة الخاص بالمدير لإنشاء حساب جديد' },
        { status: 403 }
      );
    }

    // التحقق من أن صاحب الطلب هو مدير
    const adminUser = await db.user.findUnique({
      where: { id: adminToken },
    });

    if (!adminUser || adminUser.role !== 'admin' || !adminUser.isActive) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح - فقط المدير يمكنه إنشاء حسابات جديدة' },
        { status: 403 }
      );
    }

    // التحقق من أن اسم المستخدم غير موجود
    const existingUser = await db.user.findUnique({
      where: { username: username.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'اسم المستخدم مستخدم بالفعل' },
        { status: 409 }
      );
    }

    // إنشاء المستخدم الجديد
    const newUser = await db.user.create({
      data: {
        username: username.toLowerCase().trim(),
        password,
        fullName: fullName.trim(),
        role: userRole,
        isActive: true,
      },
    });

    const { password: _, ...userWithoutPassword } = newUser;
    return NextResponse.json({
      success: true,
      data: userWithoutPassword,
      message: 'تم إنشاء الحساب بنجاح',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ في إنشاء الحساب';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/register
 * التحقق من حالة النظام - هل يوجد مستخدمين؟
 * يُستخدم لتحديد ما إذا كان يجب عرض شاشة الإعداد الأولي
 */
export async function GET() {
  try {
    const userCount = await db.user.count();
    return NextResponse.json({
      success: true,
      data: {
        hasUsers: userCount > 0,
        userCount,
        needsSetup: userCount === 0,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
