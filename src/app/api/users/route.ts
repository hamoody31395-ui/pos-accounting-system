import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper: check auth and admin role
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

// GET /api/users - List all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'غير مصرح - يتطلب صلاحية مدير' },
        { status: 403 }
      );
    }

    const users = await db.user.findMany({
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ أثناء جلب المستخدمين';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/users - Create user (admin only)
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'غير مصرح - يتطلب صلاحية مدير' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { username, password, fullName, role } = body;

    if (!username || !password || !fullName) {
      return NextResponse.json(
        { success: false, error: 'اسم المستخدم وكلمة المرور والاسم الكامل مطلوبان' },
        { status: 400 }
      );
    }

    if (!['admin', 'cashier', 'accountant'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'صلاحية غير صالحة. يجب أن تكون: admin, cashier, accountant' },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'اسم المستخدم موجود بالفعل' },
        { status: 409 }
      );
    }

    const user = await db.user.create({
      data: {
        username,
        password,
        fullName,
        role: role || 'cashier',
        isActive: true,
      },
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

    return NextResponse.json(
      { success: true, data: user, message: 'تم إنشاء المستخدم بنجاح' },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ أثناء إنشاء المستخدم';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PUT /api/users - Update user (admin only)
export async function PUT(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'غير مصرح - يتطلب صلاحية مدير' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, username, password, fullName, role, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // Check username uniqueness if changing
    if (username && username !== existing.username) {
      const dup = await db.user.findUnique({ where: { username } });
      if (dup) {
        return NextResponse.json(
          { success: false, error: 'اسم المستخدم موجود بالفعل' },
          { status: 409 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (username !== undefined) updateData.username = username;
    if (password !== undefined) updateData.password = password;
    if (fullName !== undefined) updateData.fullName = fullName;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    const user = await db.user.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ success: true, data: user, message: 'تم تحديث المستخدم بنجاح' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ أثناء تحديث المستخدم';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE /api/users?id=xxx - Delete user (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'غير مصرح - يتطلب صلاحية مدير' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      );
    }

    if (id === authUser.id) {
      return NextResponse.json(
        { success: false, error: 'لا يمكنك حذف حسابك الحالي' },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    await db.user.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'تم حذف المستخدم بنجاح' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ أثناء حذف المستخدم';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
