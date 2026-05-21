'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Store, ShoppingCart, Package, Tags, Receipt, Moon, Sun, Users,
  BarChart3, LogOut, Search, Plus, Minus, Trash2, Edit, X,
  AlertTriangle, CheckCircle, TrendingUp, DollarSign, CreditCard,
  Wifi, Printer, ChevronLeft, ChevronRight, RefreshCw, Loader2,
  LayoutGrid, List, CircleDollarSign, PieChart, CalendarDays,
  Shield, UserCircle, ToggleLeft, ToggleRight,
  Eye, EyeOff, LogIn, UserPlus
} from 'lucide-react';

// ======= IMPORTS =======
import { useStore, type ActiveView } from '@/store';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import { formatCurrency, formatDate, formatDateTime, getToday } from '@/lib/helpers';
import { PAYMENT_METHODS, USER_ROLES, EXPENSE_CATEGORIES, DEFAULT_TAX_RATE } from '@/lib/constants';

// ======= TYPES =======
import type {
  Product, Category, Sale, Expense, DayClose, CartItem,
  SaleItemFull, User, CreateSaleInput, SalesReport, ProductSalesReport
} from '@/types';

// ======= UI COMPONENTS =======
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// ============================================================
// التطبيق الرئيسي - Main Application
// ============================================================
export default function POSPage() {
  const { isAuthenticated, activeView } = useStore();

  return (
    <div className="min-h-screen bg-gray-50">
      {!isAuthenticated ? <LoginView /> : <MainLayout />}
    </div>
  );
}

// ============================================================
// 1. شاشة تسجيل الدخول والتسجيل - Login & Register View
// ============================================================
type AuthMode = 'login' | 'register' | 'setup';

function LoginView() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [needsSetup, setNeedsSetup] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const { setUser, token } = useStore();

  // التحقق من حالة النظام عند التحميل
  useEffect(() => {
    const checkSetup = async () => {
      try {
        const res = await apiGet<{ hasUsers: boolean; needsSetup: boolean }>('/api/auth/register');
        if (res.success && res.data) {
          if (res.data.needsSetup) {
            setNeedsSetup(true);
            setMode('setup');
          }
        }
      } catch { /* ignore */ }
      finally { setCheckingSetup(false); }
    };
    checkSetup();
  }, []);

  // إذا كان المستخدم مسجل الدخول بالفعل
  if (checkingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
      </div>
    );
  }

  if (mode === 'setup') {
    return <SetupView onComplete={() => { setNeedsSetup(false); setMode('login'); }} />;
  }

  if (mode === 'register') {
    return <RegisterView onBack={() => setMode('login')} adminToken={token} />;
  }

  return <LoginFormView onGoRegister={() => setMode('register')} />;
}

// ============================================================
// نموذج تسجيل الدخول - Login Form
// ============================================================
function LoginFormView({ onGoRegister }: { onGoRegister: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { setUser } = useStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username || !password) {
      setError('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }
    setLoading(true);
    try {
      const res = await apiPost<User & { token: string }>('/api/auth/login', { username, password });
      if (res.success && res.data) {
        const { token: userToken, ...userData } = res.data;
        setUser(userData as User, userToken);
        toast.success(`مرحباً ${userData.fullName}`);
      } else {
        setError(res.error || 'اسم المستخدم أو كلمة المرور غير صحيحة');
      }
    } catch {
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-emerald-100 flex items-center justify-center">
            <Store className="w-10 h-10 text-emerald-600" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold text-emerald-700">نظام الكاشير</CardTitle>
            <CardDescription className="text-base mt-1">نظام نقاط البيع والحسابات المتكامل</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm text-center flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="login-username" className="text-sm font-medium">اسم المستخدم</Label>
              <div className="relative">
                <UserCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="login-username"
                  placeholder="أدخل اسم المستخدم"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-12 text-base pr-10"
                  autoComplete="username"
                  dir="ltr"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password" className="text-sm font-medium">كلمة المرور</Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="أدخل كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 text-base pl-10"
                  autoComplete="current-password"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 ml-2" />
                  تسجيل الدخول
                </>
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <Separator />
            <span className="absolute top-1/2 right-1/2 translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs text-muted-foreground">
              أو
            </span>
          </div>

          <Button
            variant="outline"
            className="w-full h-11 text-base font-medium border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            onClick={onGoRegister}
          >
            <UserPlus className="w-5 h-5 ml-2" />
            إنشاء حساب جديد
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-6">
            جميع الحقوق محفوظة © {new Date().getFullYear()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// نموذج تسجيل مشترك جديد - Register Form
// ============================================================
function RegisterView({ onBack, adminToken }: { onBack: () => void; adminToken: string | null }) {
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'cashier' as string,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // التحقق من الحقول
    if (!form.username || !form.password || !form.fullName) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (form.username.length < 3) {
      setError('اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
      return;
    }

    if (form.password.length < 4) {
      setError('كلمة المرور يجب أن تكون 4 أحرف على الأقل');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('كلمة المرور وتأكيدها غير متطابقتين');
      return;
    }

    setLoading(true);
    try {
      const res = await apiPost<User & { token: string }>('/api/auth/register', {
        username: form.username,
        password: form.password,
        fullName: form.fullName,
        role: form.role,
        adminToken: adminToken || undefined,
      });

      if (res.success && res.data) {
        toast.success('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول');
        onBack();
      } else {
        setError(res.error || 'حدث خطأ في إنشاء الحساب');
      }
    } catch {
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-emerald-100 flex items-center justify-center">
            <UserPlus className="w-10 h-10 text-emerald-600" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-emerald-700">إنشاء حساب جديد</CardTitle>
            <CardDescription className="text-base mt-1">أدخل بيانات المستخدم الجديد</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm text-center flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            )}

            {/* الاسم الكامل */}
            <div className="space-y-2">
              <Label htmlFor="reg-fullname" className="text-sm font-medium">
                الاسم الكامل <span className="text-red-500">*</span>
              </Label>
              <Input
                id="reg-fullname"
                placeholder="مثال: أحمد محمد"
                value={form.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                className="h-12 text-base"
                autoComplete="name"
              />
            </div>

            {/* اسم المستخدم */}
            <div className="space-y-2">
              <Label htmlFor="reg-username" className="text-sm font-medium">
                اسم المستخدم <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <UserCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="reg-username"
                  placeholder="أدخل اسم المستخدم (إنجليزي)"
                  value={form.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  className="h-12 text-base pr-10"
                  autoComplete="username"
                  dir="ltr"
                />
              </div>
              <p className="text-xs text-muted-foreground">حروف إنجليزية وأرقام فقط، 3 أحرف على الأقل</p>
            </div>

            {/* كلمة المرور */}
            <div className="space-y-2">
              <Label htmlFor="reg-password" className="text-sm font-medium">
                كلمة المرور <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="أدخل كلمة المرور"
                  value={form.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className="h-12 text-base pl-10"
                  autoComplete="new-password"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">4 أحرف على الأقل</p>
            </div>

            {/* تأكيد كلمة المرور */}
            <div className="space-y-2">
              <Label htmlFor="reg-confirm" className="text-sm font-medium">
                تأكيد كلمة المرور <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="reg-confirm"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="أعد إدخال كلمة المرور"
                  value={form.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  className="h-12 text-base"
                  autoComplete="new-password"
                  dir="ltr"
                />
              </div>
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  كلمة المرور غير متطابقة
                </p>
              )}
            </div>

            {/* الصلاحية */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">الصلاحية</Label>
              <Select value={form.role} onValueChange={(v) => handleChange('role', v)}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="اختر الصلاحية" />
                </SelectTrigger>
                <SelectContent>
                  {USER_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-muted-foreground" />
                        {r.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* أزرار */}
            <div className="space-y-3 pt-2">
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                    جاري إنشاء الحساب...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 ml-2" />
                    إنشاء الحساب
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full h-11 text-base"
                onClick={onBack}
              >
                <ChevronRight className="w-5 h-5 ml-2" />
                العودة لتسجيل الدخول
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// شاشة الإعداد الأولي - Initial Setup (First User)
// ============================================================
function SetupView({ onComplete }: { onComplete: () => void }) {
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    password: '',
    confirmPassword: '',
    storeName: 'متجري',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { setUser } = useStore();

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.fullName || !form.username || !form.password) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (form.username.length < 3) {
      setError('اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
      return;
    }

    if (form.password.length < 4) {
      setError('كلمة المرور يجب أن تكون 4 أحرف على الأقل');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('كلمة المرور وتأكيدها غير متطابقتين');
      return;
    }

    setLoading(true);
    try {
      const res = await apiPost<User & { token: string }>('/api/auth/register', {
        username: form.username,
        password: form.password,
        fullName: form.fullName,
        role: 'admin',
      });

      if (res.success && res.data) {
        toast.success('تم إنشاء حساب المدير بنجاح! مرحباً بك');
        const { token: userToken, ...userData } = res.data;
        setUser(userData as User, userToken);
        onComplete();
      } else {
        setError(res.error || 'حدث خطأ في إنشاء الحساب');
      }
    } catch {
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-amber-100 flex items-center justify-center">
            <Shield className="w-10 h-10 text-amber-600" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-emerald-700">إعداد النظام</CardTitle>
            <CardDescription className="text-base mt-1">
مرحباً بك! هذا هو أول استخدام للنظام
            </CardDescription>
            <CardDescription className="text-sm mt-1 text-amber-600 font-medium">
يرجى إنشاء حساب المدير للبدء
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetup} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm text-center flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            )}

            {/* الاسم الكامل */}
            <div className="space-y-2">
              <Label htmlFor="setup-fullname" className="text-sm font-medium">
                اسم المدير الكامل <span className="text-red-500">*</span>
              </Label>
              <Input
                id="setup-fullname"
                placeholder="مثال: محمد أحمد"
                value={form.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                className="h-12 text-base"
                autoComplete="name"
              />
            </div>

            {/* اسم المستخدم */}
            <div className="space-y-2">
              <Label htmlFor="setup-username" className="text-sm font-medium">
                اسم المستخدم <span className="text-red-500">*</span>
              </Label>
              <Input
                id="setup-username"
                placeholder="أدخل اسم المستخدم (إنجليزي)"
                value={form.username}
                onChange={(e) => handleChange('username', e.target.value)}
                className="h-12 text-base"
                autoComplete="username"
                dir="ltr"
              />
              <p className="text-xs text-muted-foreground">سيتم استخدامه لتسجيل الدخول</p>
            </div>

            {/* كلمة المرور */}
            <div className="space-y-2">
              <Label htmlFor="setup-password" className="text-sm font-medium">
                كلمة المرور <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="setup-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="أدخل كلمة المرور"
                  value={form.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className="h-12 text-base pl-10"
                  autoComplete="new-password"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* تأكيد كلمة المرور */}
            <div className="space-y-2">
              <Label htmlFor="setup-confirm" className="text-sm font-medium">
                تأكيد كلمة المرور <span className="text-red-500">*</span>
              </Label>
              <Input
                id="setup-confirm"
                type={showPassword ? 'text' : 'password'}
                placeholder="أعد إدخال كلمة المرور"
                value={form.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                className="h-12 text-base"
                autoComplete="new-password"
                dir="ltr"
              />
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  كلمة المرور غير متطابقة
                </p>
              )}
            </div>

            {/* اسم المتجر */}
            <div className="space-y-2">
              <Label htmlFor="setup-store" className="text-sm font-medium">اسم المتجر</Label>
              <Input
                id="setup-store"
                placeholder="اسم المتجر أو المحل"
                value={form.storeName}
                onChange={(e) => handleChange('storeName', e.target.value)}
                className="h-12 text-base"
              />
            </div>

            {/* زر الإعداد */}
            <Button
              type="submit"
              className="w-full h-12 text-base font-bold bg-emerald-600 hover:bg-emerald-700 mt-4"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                  جاري إنشاء الحساب...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 ml-2" />
                  إنشاء حساب المدير والبدء
                </>
              )}
            </Button>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3">
              <p className="text-xs text-amber-700 text-center">
                <Shield className="w-3 h-3 inline ml-1" />
                هذا الحساب سيكون مدير النظام بصلاحيات كاملة
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// التخطيط الرئيسي - Main Layout
// ============================================================
function MainLayout() {
  const { activeView, setActiveView, user, logout } = useStore();

  const navItems: { view: ActiveView; label: string; icon: React.ReactNode; roles?: string[] }[] = [
    { view: 'pos', label: 'نقطة البيع', icon: <ShoppingCart className="w-5 h-5" /> },
    { view: 'products', label: 'المنتجات', icon: <Package className="w-5 h-5" /> },
    { view: 'categories', label: 'التصنيفات', icon: <Tags className="w-5 h-5" /> },
    { view: 'expenses', label: 'المصروفات', icon: <CircleDollarSign className="w-5 h-5" /> },
    { view: 'dayclose', label: 'إغلاق اليومية', icon: <Receipt className="w-5 h-5" /> },
    { view: 'reports', label: 'التقارير', icon: <BarChart3 className="w-5 h-5" /> },
    { view: 'users', label: 'المستخدمين', icon: <Users className="w-5 h-5" />, roles: ['admin'] },
  ];

  const filteredNav = navItems.filter(
    (item) => !item.roles || (user?.role && item.roles.includes(user.role))
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* الشريط الجانبي */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col shrink-0">
        {/* شعار */}
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">نظام الكاشير</h1>
              <p className="text-xs text-gray-400">POS System</p>
            </div>
          </div>
        </div>

        {/* التنقل */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {filteredNav.map((item) => (
            <button
              key={item.view}
              onClick={() => setActiveView(item.view)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeView === item.view
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* معلومات المستخدم */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <UserCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.fullName}</p>
              <p className="text-xs text-gray-400">
                {USER_ROLES.find((r) => r.value === user?.role)?.label || 'كاشير'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-400 hover:text-red-400 hover:bg-gray-800"
            onClick={logout}
          >
            <LogOut className="w-4 h-4 ml-2" />
            تسجيل الخروج
          </Button>
        </div>
      </aside>

      {/* المحتوى الرئيسي */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <ViewRenderer view={activeView} />
        </div>
      </main>
    </div>
  );
}

function ViewRenderer({ view }: { view: ActiveView }) {
  switch (view) {
    case 'pos': return <POSView />;
    case 'products': return <ProductsView />;
    case 'categories': return <CategoriesView />;
    case 'expenses': return <ExpensesView />;
    case 'dayclose': return <DayCloseView />;
    case 'reports': return <ReportsView />;
    case 'users': return <UsersView />;
    default: return <POSView />;
  }
}

// ============================================================
// 2. نقطة البيع - POS View
// ============================================================
function POSView() {
  const { cart, addToCart, removeFromCart, updateCartQuantity, clearCart, cartDiscount, setCartDiscount, paymentMethod, setPaymentMethod, paidAmount, setPaidAmount, settings } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await apiGet<Product[]>('/api/products');
      if (res.success && res.data) setProducts(res.data.filter((p) => p.isActive));
    } catch { /* ignore */ }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await apiGet<Category[]>('/api/categories');
      if (res.success && res.data) setCategories(res.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    Promise.all([fetchProducts(), fetchCategories()]).finally(() => setLoading(false));
  }, [fetchProducts, fetchCategories]);

  const filteredProducts = useMemo(() => {
    let filtered = products;
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((p) => p.categoryId === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (p) => p.name.includes(q) || (p.nameEn && p.nameEn.toLowerCase().includes(q)) || (p.barcode && p.barcode.includes(q))
      );
    }
    return filtered;
  }, [products, selectedCategory, searchQuery]);

  const subtotal = useMemo(() => cart.reduce((s, c) => s + c.total, 0), [cart]);
  const taxRate = settings.taxRate;
  const discount = cartDiscount;
  const afterDiscount = subtotal - discount;
  const taxAmount = afterDiscount * (taxRate / 100);
  const total = afterDiscount + taxAmount;
  const totalCost = cart.reduce((s, c) => s + c.product.costPrice * c.quantity, 0);
  const changeAmount = Math.max(0, paidAmount - total);

  useEffect(() => {
    if (paymentMethod === 'cash') {
      setPaidAmount(total);
    } else {
      setPaidAmount(total);
    }
  }, [total, paymentMethod, setPaidAmount]);

  const handleAddToCart = (product: Product) => {
    if (product.quantity <= 0) {
      toast.error('المنتج غير متوفر في المخزون');
      return;
    }
    const existing = cart.find((c) => c.product.id === product.id);
    if (existing && existing.quantity >= product.quantity) {
      toast.error('الكمية المطلوبة تتجاوز المخزون المتاح');
      return;
    }
    addToCart({ product, quantity: 1, total: product.sellPrice });
  };

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      toast.error('السلة فارغة');
      return;
    }
    if (paymentMethod === 'cash' && paidAmount < total) {
      toast.error('المبلغ المدفوع أقل من الإجمالي');
      return;
    }
    setCompleting(true);
    const items: CreateSaleInput['items'] = cart.map((c) => ({
      productId: c.product.id,
      productName: c.product.name,
      quantity: c.quantity,
      price: c.product.sellPrice,
      costPrice: c.product.costPrice,
      total: c.total,
    }));
    const saleInput: CreateSaleInput = {
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
    };
    try {
      const res = await apiPost<Sale>('/api/sales', saleInput);
      if (res.success && res.data) {
        setLastSale(res.data);
        setShowReceipt(true);
        toast.success(`تم إتمام البيع - فاتورة #${res.data.invoiceNumber}`);
        clearCart();
        fetchProducts();
      } else {
        toast.error(res.error || 'حدث خطأ في إتمام البيع');
      }
    } catch {
      toast.error('حدث خطأ في الاتصال بالخادم');
    } finally {
      setCompleting(false);
    }
  };

  const handleBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      const product = products.find((p) => p.barcode === searchQuery.trim());
      if (product) {
        handleAddToCart(product);
        setSearchQuery('');
      }
    }
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-5rem)]">
      {/* المنتجات */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* البحث والتصنيفات */}
        <div className="space-y-3 mb-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="بحث بالاسم أو الباركود..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleBarcodeScan}
              className="h-11 pr-10 text-base"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('all')}
              className={selectedCategory === 'all' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
            >
              الكل
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                size="sm"
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(cat.id)}
                className={selectedCategory === cat.id ? '' : ''}
                style={selectedCategory === cat.id ? { backgroundColor: cat.color, color: '#fff' } : {}}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>

        {/* شبكة المنتجات */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-xl" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Package className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg">لا توجد منتجات</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleAddToCart(product)}
                  className="bg-white rounded-xl border border-gray-200 p-3 text-right transition-all hover:shadow-md hover:border-emerald-300 active:scale-[0.98] relative"
                >
                  {product.quantity <= product.minQuantity && product.quantity > 0 && (
                    <Badge variant="warning" className="absolute top-2 left-2 bg-amber-100 text-amber-700 text-[10px]">
                      <AlertTriangle className="w-3 h-3 ml-1" />
                      مخزون منخفض
                    </Badge>
                  )}
                  {product.quantity <= 0 && (
                    <Badge variant="destructive" className="absolute top-2 left-2 text-[10px]">
                      نفذ
                    </Badge>
                  )}
                  <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center mb-2 mx-auto">
                    <Package className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-sm truncate mb-1">{product.name}</h3>
                  <p className="text-emerald-600 font-bold text-base">{formatCurrency(product.sellPrice)}</p>
                  <p className="text-xs text-muted-foreground mt-1">المخزون: {product.quantity} {product.unit}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* السلة */}
      <div className="w-96 bg-white rounded-2xl border border-gray-200 flex flex-col shadow-lg shrink-0">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-600" />
            سلة المشتريات
            {cart.length > 0 && (
              <Badge className="bg-emerald-100 text-emerald-700">{cart.length}</Badge>
            )}
          </h2>
        </div>

        {/* عناصر السلة */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">السلة فارغة</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-sm leading-tight flex-1 mr-2">{item.product.name}</h4>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-red-400 hover:text-red-600 p-1 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center font-semibold text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="font-bold text-emerald-600 text-sm">
                    {formatCurrency(item.total)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(item.product.sellPrice)} × {item.quantity}
                </p>
              </div>
            ))
          )}
        </div>

        {/* ملخص وإنهاء */}
        <div className="border-t border-gray-100 p-4 space-y-3">
          {/* طريقة الدفع */}
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_METHODS.map((pm) => (
              <button
                key={pm.value}
                onClick={() => setPaymentMethod(pm.value as 'cash' | 'card' | 'network')}
                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg border text-xs font-medium transition-all ${
                  paymentMethod === pm.value
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {pm.value === 'cash' ? <DollarSign className="w-4 h-4" /> :
                 pm.value === 'card' ? <CreditCard className="w-4 h-4" /> :
                 <Wifi className="w-4 h-4" />}
                {pm.label}
              </button>
            ))}
          </div>

          {/* المبلغ المدفوع (نقدي) */}
          {paymentMethod === 'cash' && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">المبلغ المدفوع</Label>
              <Input
                type="number"
                value={paidAmount || ''}
                onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                className="h-9 text-sm"
              />
              {total > 0 && changeAmount >= 0 && paidAmount >= total && (
                <p className="text-xs text-emerald-600 font-medium">
                  الباقي: {formatCurrency(changeAmount)}
                </p>
              )}
            </div>
          )}

          <Separator />

          {/* الخصم */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">خصم</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={discount || ''}
                onChange={(e) => setCartDiscount(parseFloat(e.target.value) || 0)}
                className="w-24 h-8 text-sm text-left"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* الملخص */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>المجموع الفرعي</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-red-500">
                <span>الخصم</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>الضريبة ({taxRate}%)</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>الإجمالي</span>
              <span className="text-emerald-600">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* أزرار */}
          <Button
            className="w-full h-12 text-base font-bold bg-emerald-600 hover:bg-emerald-700"
            onClick={handleCompleteSale}
            disabled={cart.length === 0 || completing}
          >
            {completing ? (
              <>
                <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                جاري الإتمام...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 ml-2" />
                إتمام البيع
              </>
            )}
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 h-10"
              onClick={() => cart.length > 0 && setShowReceipt(true)}
              disabled={cart.length === 0}
            >
              <Printer className="w-4 h-4 ml-1" />
              طباعة
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-10 text-red-500 hover:text-red-600"
              onClick={() => clearCart()}
              disabled={cart.length === 0}
            >
              <Trash2 className="w-4 h-4 ml-1" />
              إفراغ
            </Button>
          </div>
        </div>
      </div>

      {/* نافذة الإيصال */}
      <ReceiptDialog open={showReceipt} onClose={() => setShowReceipt(false)} sale={lastSale} />
    </div>
  );
}

// ============================================================
// نافذة الإيصال - Receipt Dialog
// ============================================================
function ReceiptDialog({ open, onClose, sale }: { open: boolean; onClose: () => void; sale: Sale | null }) {
  if (!sale) return null;
  const pm = PAYMENT_METHODS.find((m) => m.value === sale.paymentMethod);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-center">إيصال البيع</DialogTitle>
        </DialogHeader>
        <div className="bg-white border rounded-xl p-4 space-y-3 text-sm" id="receipt-print">
          <div className="text-center border-b pb-3">
            <p className="font-bold text-lg">نظام الكاشير</p>
            <p className="text-xs text-muted-foreground">فاتورة رقم: {sale.invoiceNumber}</p>
            <p className="text-xs text-muted-foreground">{formatDateTime(sale.createdAt)}</p>
          </div>
          <div className="space-y-2">
            {sale.items?.map((item) => (
              <div key={item.id} className="flex justify-between text-xs">
                <div>
                  <span>{item.productName}</span>
                  <span className="text-muted-foreground mr-2">×{item.quantity}</span>
                </div>
                <span className="font-medium">{formatCurrency(item.total)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-2 space-y-1 text-xs">
            <div className="flex justify-between">
              <span>المجموع الفرعي</span>
              <span>{formatCurrency(sale.subtotal)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-red-500">
                <span>الخصم</span>
                <span>-{formatCurrency(sale.discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>الضريبة ({sale.taxRate}%)</span>
              <span>{formatCurrency(sale.taxAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t pt-1">
              <span>الإجمالي</span>
              <span>{formatCurrency(sale.total)}</span>
            </div>
          </div>
          <div className="border-t pt-2 text-xs space-y-1">
            <div className="flex justify-between">
              <span>طريقة الدفع</span>
              <span>{pm?.label}</span>
            </div>
            <div className="flex justify-between">
              <span>المدفوع</span>
              <span>{formatCurrency(sale.paidAmount)}</span>
            </div>
            {sale.changeAmount > 0 && (
              <div className="flex justify-between font-medium text-emerald-600">
                <span>الباقي</span>
                <span>{formatCurrency(sale.changeAmount)}</span>
              </div>
            )}
          </div>
          <div className="text-center text-xs text-muted-foreground border-t pt-3">
            <p>شكراً لزيارتكم</p>
          </div>
        </div>
        <DialogFooter className="flex gap-2">
          <Button onClick={() => window.print()} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
            <Printer className="w-4 h-4 ml-1" />
            طباعة
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 3. إدارة المنتجات - Products Management
// ============================================================
function ProductsView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // حالة النموذج
  const [form, setForm] = useState({
    name: '', nameEn: '', barcode: '', categoryId: '', costPrice: 0, sellPrice: 0,
    quantity: 0, minQuantity: 5, unit: 'قطعة', isActive: true,
  });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        apiGet<Product[]>('/api/products'),
        apiGet<Category[]>('/api/categories'),
      ]);
      if (pRes.success && pRes.data) setProducts(pRes.data);
      if (cRes.success && cRes.data) setCategories(cRes.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openNew = () => {
    setEditingProduct(null);
    setForm({ name: '', nameEn: '', barcode: '', categoryId: '', costPrice: 0, sellPrice: 0, quantity: 0, minQuantity: 5, unit: 'قطعة', isActive: true });
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setForm({
      name: p.name, nameEn: p.nameEn || '', barcode: p.barcode || '',
      categoryId: p.categoryId || '', costPrice: p.costPrice, sellPrice: p.sellPrice,
      quantity: p.quantity, minQuantity: p.minQuantity, unit: p.unit, isActive: p.isActive,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || form.sellPrice <= 0) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }
    setSaving(true);
    try {
      const res = editingProduct
        ? await apiPut<Product>(`/api/products/${editingProduct.id}`, form)
        : await apiPost<Product>('/api/products', form);
      if (res.success) {
        toast.success(editingProduct ? 'تم تعديل المنتج' : 'تم إضافة المنتج');
        setDialogOpen(false);
        fetchData();
      } else {
        toast.error(res.error || 'حدث خطأ');
      }
    } catch { toast.error('خطأ في الاتصال'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await apiDelete(`/api/products/${deleteId}`);
      if (res.success) {
        toast.success('تم حذف المنتج');
        fetchData();
      } else { toast.error(res.error || 'حدث خطأ'); }
    } catch { toast.error('خطأ في الاتصال'); }
    setDeleteId(null);
  };

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter((p) => p.name.includes(q) || (p.nameEn && p.nameEn.toLowerCase().includes(q)));
  }, [products, searchQuery]);

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">إدارة المنتجات</h1>
          <p className="text-muted-foreground text-sm">{products.length} منتج</p>
        </div>
        <Button onClick={openNew} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 ml-2" />
          إضافة منتج
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="بحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10" />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">المنتج</TableHead>
              <TableHead className="text-right">الباركود</TableHead>
              <TableHead className="text-right">التصنيف</TableHead>
              <TableHead className="text-right">التكلفة</TableHead>
              <TableHead className="text-right">البيع</TableHead>
              <TableHead className="text-right">المخزون</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">لا توجد منتجات</TableCell></TableRow>
            ) : (
              filteredProducts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    {p.name}
                    {p.nameEn && <span className="text-muted-foreground text-xs block">{p.nameEn}</span>}
                  </TableCell>
                  <TableCell className="text-xs font-mono">{p.barcode || '-'}</TableCell>
                  <TableCell>{p.category?.name || '-'}</TableCell>
                  <TableCell>{formatCurrency(p.costPrice)}</TableCell>
                  <TableCell className="font-semibold text-emerald-600">{formatCurrency(p.sellPrice)}</TableCell>
                  <TableCell>
                    <span className={p.quantity <= p.minQuantity ? 'text-red-500 font-bold' : ''}>
                      {p.quantity} {p.unit}
                    </span>
                    {p.quantity <= p.minQuantity && p.quantity > 0 && (
                      <Badge variant="warning" className="bg-amber-100 text-amber-700 mr-2 text-[10px]">منخفض</Badge>
                    )}
                    {p.quantity <= 0 && (
                      <Badge variant="destructive" className="mr-2 text-[10px]">نفذ</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {p.isActive ? (
                      <Badge className="bg-emerald-100 text-emerald-700">نشط</Badge>
                    ) : (
                      <Badge variant="secondary">معطل</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(p)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => setDeleteId(p.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* نافذة إضافة/تعديل */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1 space-y-1">
              <Label>اسم المنتج (عربي) *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="col-span-2 sm:col-span-1 space-y-1">
              <Label>اسم المنتج (إنجليزي)</Label>
              <Input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} dir="ltr" />
            </div>
            <div className="col-span-2 sm:col-span-1 space-y-1">
              <Label>الباركود</Label>
              <Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} dir="ltr" />
            </div>
            <div className="col-span-2 sm:col-span-1 space-y-1">
              <Label>التصنيف</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v === '__none__' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="بدون تصنيف" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">بدون تصنيف</SelectItem>
                  {categories.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>سعر التكلفة</Label>
              <Input type="number" value={form.costPrice || ''} onChange={(e) => setForm({ ...form, costPrice: parseFloat(e.target.value) || 0 })} dir="ltr" />
            </div>
            <div className="space-y-1">
              <Label>سعر البيع *</Label>
              <Input type="number" value={form.sellPrice || ''} onChange={(e) => setForm({ ...form, sellPrice: parseFloat(e.target.value) || 0 })} dir="ltr" />
            </div>
            <div className="space-y-1">
              <Label>الكمية</Label>
              <Input type="number" value={form.quantity || ''} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })} dir="ltr" />
            </div>
            <div className="space-y-1">
              <Label>الحد الأدنى للتنبيه</Label>
              <Input type="number" value={form.minQuantity || ''} onChange={(e) => setForm({ ...form, minQuantity: parseInt(e.target.value) || 0 })} dir="ltr" />
            </div>
            <div className="space-y-1">
              <Label>الوحدة</Label>
              <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
              <Label>نشط</Label>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingProduct ? 'تعديل' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* تأكيد الحذف */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================
// 4. إدارة التصنيفات - Categories Management
// ============================================================
function CategoriesView() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', color: '#10b981' });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<Category[]>('/api/categories');
      if (res.success && res.data) setCategories(res.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openNew = () => { setEditingCat(null); setForm({ name: '', color: '#10b981' }); setDialogOpen(true); };
  const openEdit = (c: Category) => { setEditingCat(c); setForm({ name: c.name, color: c.color }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.name) { toast.error('يرجى إدخال اسم التصنيف'); return; }
    setSaving(true);
    try {
      const res = editingCat
        ? await apiPut<Category>(`/api/categories/${editingCat.id}`, form)
        : await apiPost<Category>('/api/categories', form);
      if (res.success) { toast.success(editingCat ? 'تم تعديل التصنيف' : 'تم إضافة التصنيف'); setDialogOpen(false); fetchData(); }
      else toast.error(res.error || 'حدث خطأ');
    } catch { toast.error('خطأ في الاتصال'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await apiDelete(`/api/categories/${deleteId}`);
      if (res.success) { toast.success('تم حذف التصنيف'); fetchData(); }
      else toast.error(res.error || 'حدث خطأ');
    } catch { toast.error('خطأ في الاتصال'); }
    setDeleteId(null);
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">إدارة التصنيفات</h1>
          <p className="text-muted-foreground text-sm">{categories.length} تصنيف</p>
        </div>
        <Button onClick={openNew} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 ml-2" />
          إضافة تصنيف
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Tags className="w-16 h-16 mb-4 opacity-20" />
            <p>لا توجد تصنيفات</p>
          </div>
        ) : (
          categories.map((cat) => (
            <Card key={cat.id} className="overflow-hidden">
              <div className="h-2" style={{ backgroundColor: cat.color }} />
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: cat.color + '20' }}>
                      <Tags className="w-5 h-5" style={{ color: cat.color }} />
                    </div>
                    <div>
                      <h3 className="font-semibold">{cat.name}</h3>
                      <p className="text-xs text-muted-foreground">{cat._count?.products || 0} منتج</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(cat)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => setDeleteId(cat.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingCat ? 'تعديل التصنيف' : 'إضافة تصنيف'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>اسم التصنيف</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>اللون</Label>
              <div className="flex items-center gap-3">
                <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-10 h-10 rounded cursor-pointer border-0" />
                <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="flex-1" dir="ltr" />
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingCat ? 'تعديل' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف هذا التصنيف؟</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================
// 5. المصروفات - Expenses View
// ============================================================
function ExpensesView() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState(getToday());
  const [form, setForm] = useState({ category: EXPENSE_CATEGORIES[0], amount: 0, description: '', date: getToday() });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<Expense[]>(`/api/expenses?date=${dateFilter}`);
      if (res.success && res.data) setExpenses(res.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [dateFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    if (form.amount <= 0) { toast.error('يرجى إدخال المبلغ'); return; }
    setSaving(true);
    try {
      const res = await apiPost<Expense>('/api/expenses', form);
      if (res.success) { toast.success('تم إضافة المصروف'); setDialogOpen(false); fetchData(); }
      else toast.error(res.error || 'حدث خطأ');
    } catch { toast.error('خطأ في الاتصال'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await apiDelete(`/api/expenses/${deleteId}`);
      if (res.success) { toast.success('تم حذف المصروف'); fetchData(); }
      else toast.error(res.error || 'حدث خطأ');
    } catch { toast.error('خطأ في الاتصال'); }
    setDeleteId(null);
  };

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">المصروفات</h1>
          <p className="text-muted-foreground text-sm">إدارة مصروفات اليوم</p>
        </div>
        <div className="flex gap-2 items-center">
          <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-44" dir="ltr" />
          <Button onClick={() => { setForm({ category: EXPENSE_CATEGORIES[0], amount: 0, description: '', date: getToday() }); setDialogOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 ml-2" />
            إضافة مصروف
          </Button>
        </div>
      </div>

      {/* ملخص */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
              <CircleDollarSign className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي المصروفات</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <Receipt className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">عدد المصروفات</p>
              <p className="text-xl font-bold">{expenses.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">متوسط المصروف</p>
              <p className="text-xl font-bold">{expenses.length > 0 ? formatCurrency(totalExpenses / expenses.length) : '0.00 ر.س'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* قائمة المصروفات */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">التصنيف</TableHead>
              <TableHead className="text-right">المبلغ</TableHead>
              <TableHead className="text-right">الوصف</TableHead>
              <TableHead className="text-right">التاريخ</TableHead>
              <TableHead className="text-right">بواسطة</TableHead>
              <TableHead className="text-right">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">لا توجد مصروفات</TableCell></TableRow>
            ) : (
              expenses.map((exp) => (
                <TableRow key={exp.id}>
                  <TableCell><Badge variant="secondary">{exp.category}</Badge></TableCell>
                  <TableCell className="font-semibold text-red-600">{formatCurrency(exp.amount)}</TableCell>
                  <TableCell className="text-sm max-w-48 truncate">{exp.description || '-'}</TableCell>
                  <TableCell className="text-sm">{formatDateTime(exp.createdAt)}</TableCell>
                  <TableCell className="text-sm">{exp.user?.fullName || '-'}</TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => setDeleteId(exp.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة مصروف جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>التصنيف</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>المبلغ</Label>
              <Input type="number" value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} dir="ltr" />
            </div>
            <div className="space-y-1">
              <Label>الوصف</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>التاريخ</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} dir="ltr" />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف هذا المصروف؟</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================
// 6. إغلاق اليومية - Day Close View
// ============================================================
function DayCloseView() {
  const [todaySummary, setTodaySummary] = useState<{
    totalSales: number; cashSales: number; cardSales: number; networkSales: number;
    totalExpenses: number; transactionCount: number; profit: number;
  } | null>(null);
  const [history, setHistory] = useState<DayClose[]>([]);
  const [loading, setLoading] = useState(true);
  const [actualCash, setActualCash] = useState(0);
  const [notes, setNotes] = useState('');
  const [closing, setClosing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, hRes] = await Promise.all([
        apiGet<{
          totalSales: number; cashSales: number; cardSales: number; networkSales: number;
          totalExpenses: number; transactionCount: number; profit: number;
        }>('/api/day-close/summary'),
        apiGet<DayClose[]>('/api/day-close/history'),
      ]);
      if (sRes.success && sRes.data) setTodaySummary(sRes.data);
      if (hRes.success && hRes.data) setHistory(hRes.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const expectedCash = (todaySummary?.cashSales || 0) - (todaySummary?.totalExpenses || 0);
  const difference = actualCash - expectedCash;

  const handleCloseDay = async () => {
    setClosing(true);
    try {
      const res = await apiPost<DayClose>('/api/day-close', {
        date: getToday(),
        expectedCash,
        actualCash,
        difference,
        totalSales: todaySummary?.totalSales || 0,
        totalExpenses: todaySummary?.totalExpenses || 0,
        totalCardSales: todaySummary?.cardSales || 0,
        totalNetSales: todaySummary?.networkSales || 0,
        profit: todaySummary?.profit || 0,
        notes,
      });
      if (res.success) { toast.success('تم إغلاق اليومية بنجاح'); fetchData(); }
      else toast.error(res.error || 'حدث خطأ');
    } catch { toast.error('خطأ في الاتصال'); }
    finally { setClosing(false); }
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">إغلاق اليومية</h1>
        <p className="text-muted-foreground text-sm">{formatDate(getToday())}</p>
      </div>

      {/* ملخص اليوم */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <span className="text-sm text-muted-foreground">إجمالي المبيعات</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(todaySummary?.totalSales || 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">{todaySummary?.transactionCount || 0} عملية</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <span className="text-sm text-muted-foreground">مبيعات نقدية</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(todaySummary?.cashSales || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-muted-foreground">مبيعات بطاقات</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(todaySummary?.cardSales || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <Wifi className="w-5 h-5 text-purple-500" />
              <span className="text-sm text-muted-foreground">مبيعات شبكة</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(todaySummary?.networkSales || 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* إغلاق اليوم */}
      <Card>
        <CardHeader>
          <CardTitle>إغلاق اليوم</CardTitle>
          <CardDescription>أدخل النقدية الفعلية في الدرج وإغلاق اليومية</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">المصروفات اليوم</Label>
              <p className="text-lg font-bold text-red-600">{formatCurrency(todaySummary?.totalExpenses || 0)}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">النقدية المتوقعة</Label>
              <p className="text-lg font-bold">{formatCurrency(expectedCash)}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">صافي الربح</Label>
              <p className="text-lg font-bold text-emerald-600">{formatCurrency(todaySummary?.profit || 0)}</p>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>النقدية الفعلية في الدرج</Label>
              <Input type="number" value={actualCash || ''} onChange={(e) => setActualCash(parseFloat(e.target.value) || 0)} dir="ltr" />
            </div>
            <div className="space-y-1">
              <Label>الفرق</Label>
              <div className={`h-10 rounded-md border flex items-center px-3 font-bold ${difference > 0 ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : difference < 0 ? 'border-red-300 bg-red-50 text-red-700' : 'border-gray-200'}`}>
                {difference > 0 ? '+' : ''}{formatCurrency(difference)}
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <Label>ملاحظات</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="أي ملاحظات إضافية..." />
          </div>
          <Button onClick={handleCloseDay} disabled={closing} className="bg-emerald-600 hover:bg-emerald-700" size="lg">
            {closing ? <><Loader2 className="w-5 h-5 ml-2 animate-spin" /> جاري الإغلاق...</> : <><CheckCircle className="w-5 h-5 ml-2" /> إغلاق اليومية</>}
          </Button>
        </CardContent>
      </Card>

      {/* سجل الإغلاقات */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>سجل الإغلاقات السابقة</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">المبيعات</TableHead>
                  <TableHead className="text-right">المصروفات</TableHead>
                  <TableHead className="text-right">النقدية المتوقعة</TableHead>
                  <TableHead className="text-right">النقدية الفعلية</TableHead>
                  <TableHead className="text-right">الفرق</TableHead>
                  <TableHead className="text-right">الربح</TableHead>
                  <TableHead className="text-right">بواسطة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((dc) => (
                  <TableRow key={dc.id}>
                    <TableCell className="text-sm">{formatDate(dc.date)}</TableCell>
                    <TableCell>{formatCurrency(dc.totalSales)}</TableCell>
                    <TableCell className="text-red-600">{formatCurrency(dc.totalExpenses)}</TableCell>
                    <TableCell>{formatCurrency(dc.expectedCash)}</TableCell>
                    <TableCell>{formatCurrency(dc.actualCash)}</TableCell>
                    <TableCell className={dc.difference !== 0 ? (dc.difference > 0 ? 'text-emerald-600' : 'text-red-600') : ''}>
                      {dc.difference > 0 ? '+' : ''}{formatCurrency(dc.difference)}
                    </TableCell>
                    <TableCell className="text-emerald-600 font-semibold">{formatCurrency(dc.profit)}</TableCell>
                    <TableCell className="text-sm">{dc.user?.fullName || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================
// 7. التقارير - Reports View
// ============================================================
function ReportsView() {
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(getToday());
  const [dateTo, setDateTo] = useState(getToday());

  // Daily Sales
  const [dailySales, setDailySales] = useState<SalesReport[]>([]);
  const [dailyTransactions, setDailyTransactions] = useState<Sale[]>([]);

  // Monthly Sales
  const [monthlySummary, setMonthlySummary] = useState<{
    totalSales: number; totalProfit: number; transactionCount: number; avgTransaction: number;
  } | null>(null);
  const [monthlyBreakdown, setMonthlyBreakdown] = useState<SalesReport[]>([]);

  // Best Products
  const [bestProducts, setBestProducts] = useState<ProductSalesReport[]>([]);

  // Inventory
  const [inventory, setInventory] = useState<Product[]>([]);

  // Profits
  const [profits, setProfits] = useState<{
    totalRevenue: number; totalCost: number; totalProfit: number; profitMargin: number;
  } | null>(null);

  const fetchDailySales = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<{
        summary: SalesReport[]; transactions: Sale[];
      }>(`/api/reports/daily?from=${dateFrom}&to=${dateTo}`);
      if (res.success && res.data) {
        setDailySales(res.data.summary || []);
        setDailyTransactions(res.data.transactions || []);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [dateFrom, dateTo]);

  const fetchMonthlySales = useCallback(async () => {
    try {
      const res = await apiGet<{
        summary: { totalSales: number; totalProfit: number; transactionCount: number; avgTransaction: number };
        breakdown: SalesReport[];
      }>(`/api/reports/monthly?from=${dateFrom}&to=${dateTo}`);
      if (res.success && res.data) {
        setMonthlySummary(res.data.summary);
        setMonthlyBreakdown(res.data.breakdown || []);
      }
    } catch { /* ignore */ }
  }, [dateFrom, dateTo]);

  const fetchBestProducts = useCallback(async () => {
    try {
      const res = await apiGet<ProductSalesReport[]>(`/api/reports/best-products?from=${dateFrom}&to=${dateTo}`);
      if (res.success && res.data) setBestProducts(res.data);
    } catch { /* ignore */ }
  }, [dateFrom, dateTo]);

  const fetchInventory = useCallback(async () => {
    try {
      const res = await apiGet<Product[]>('/api/reports/inventory');
      if (res.success && res.data) setInventory(res.data);
    } catch { /* ignore */ }
  }, []);

  const fetchProfits = useCallback(async () => {
    try {
      const res = await apiGet<{
        totalRevenue: number; totalCost: number; totalProfit: number; profitMargin: number;
      }>(`/api/reports/profits?from=${dateFrom}&to=${dateTo}`);
      if (res.success && res.data) setProfits(res.data);
    } catch { /* ignore */ }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchDailySales();
  }, [fetchDailySales]);

  const handleRefresh = () => {
    fetchDailySales();
    fetchMonthlySales();
    fetchBestProducts();
    fetchInventory();
    fetchProfits();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">التقارير</h1>
          <p className="text-muted-foreground text-sm">تقارير المبيعات والمخزون</p>
        </div>
        <div className="flex gap-2 items-center">
          <Label className="text-sm whitespace-nowrap">من:</Label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" dir="ltr" />
          <Label className="text-sm whitespace-nowrap">إلى:</Label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" dir="ltr" />
          <Button onClick={handleRefresh} variant="outline" size="icon">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="daily" dir="rtl">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="daily">يومي</TabsTrigger>
          <TabsTrigger value="monthly">شهري</TabsTrigger>
          <TabsTrigger value="best">الأفضل</TabsTrigger>
          <TabsTrigger value="inventory">المخزون</TabsTrigger>
          <TabsTrigger value="profits">الأرباح</TabsTrigger>
        </TabsList>

        {/* === المبيعات اليومية === */}
        <TabsContent value="daily" className="space-y-4 mt-4">
          {loading ? <LoadingSkeleton /> : (
            <>
              {dailySales.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-muted-foreground">إجمالي المبيعات</p>
                      <p className="text-2xl font-bold text-emerald-600">{formatCurrency(dailySales.reduce((s, d) => s + d.totalSales, 0))}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-muted-foreground">صافي الربح</p>
                      <p className="text-2xl font-bold">{formatCurrency(dailySales.reduce((s, d) => s + d.totalProfit, 0))}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-muted-foreground">عدد العمليات</p>
                      <p className="text-2xl font-bold">{dailySales.reduce((s, d) => s + d.transactionCount, 0)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-muted-foreground">متوسط العملية</p>
                      <p className="text-2xl font-bold">{formatCurrency(dailySales.reduce((s, d) => s + d.avgTransaction, 0) / (dailySales.length || 1))}</p>
                    </CardContent>
                  </Card>
                </div>
              )}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">المعاملات</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">رقم الفاتورة</TableHead>
                        <TableHead className="text-right">المبلغ</TableHead>
                        <TableHead className="text-right">طريقة الدفع</TableHead>
                        <TableHead className="text-right">التاريخ</TableHead>
                        <TableHead className="text-right">الكاشير</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dailyTransactions.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">لا توجد معاملات</TableCell></TableRow>
                      ) : (
                        dailyTransactions.map((sale) => (
                          <TableRow key={sale.id}>
                            <TableCell className="font-mono text-sm">{sale.invoiceNumber}</TableCell>
                            <TableCell className="font-semibold">{formatCurrency(sale.total)}</TableCell>
                            <TableCell>{PAYMENT_METHODS.find((m) => m.value === sale.paymentMethod)?.label}</TableCell>
                            <TableCell className="text-sm">{formatDateTime(sale.createdAt)}</TableCell>
                            <TableCell className="text-sm">{sale.user?.fullName || '-'}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* === المبيعات الشهرية === */}
        <TabsContent value="monthly" className="space-y-4 mt-4">
          {monthlySummary && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">إجمالي المبيعات</p>
                  <p className="text-2xl font-bold text-emerald-600">{formatCurrency(monthlySummary.totalSales)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">صافي الربح</p>
                  <p className="text-2xl font-bold">{formatCurrency(monthlySummary.totalProfit)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">عدد العمليات</p>
                  <p className="text-2xl font-bold">{monthlySummary.transactionCount}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">متوسط العملية</p>
                  <p className="text-2xl font-bold">{formatCurrency(monthlySummary.avgTransaction)}</p>
                </CardContent>
              </Card>
            </div>
          )}
          <Card>
            <CardHeader><CardTitle className="text-base">التقسيم اليومي</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">المبيعات</TableHead>
                    <TableHead className="text-right">الربح</TableHead>
                    <TableHead className="text-right">العمليات</TableHead>
                    <TableHead className="text-right">المتوسط</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyBreakdown.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">لا توجد بيانات</TableCell></TableRow>
                  ) : (
                    monthlyBreakdown.map((d, i) => (
                      <TableRow key={i}>
                        <TableCell>{formatDate(d.date)}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(d.totalSales)}</TableCell>
                        <TableCell className="text-emerald-600">{formatCurrency(d.totalProfit)}</TableCell>
                        <TableCell>{d.transactionCount}</TableCell>
                        <TableCell>{formatCurrency(d.avgTransaction)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === أفضل المنتجات === */}
        <TabsContent value="best" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">أفضل المنتجات مبيعاً</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">#</TableHead>
                    <TableHead className="text-right">المنتج</TableHead>
                    <TableHead className="text-right">الكمية المباعة</TableHead>
                    <TableHead className="text-right">الإيرادات</TableHead>
                    <TableHead className="text-right">الربح</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bestProducts.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">لا توجد بيانات</TableCell></TableRow>
                  ) : (
                    bestProducts.map((p, i) => (
                      <TableRow key={p.productId}>
                        <TableCell>
                          <Badge variant={i < 3 ? 'default' : 'secondary'} className={i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-700' : ''}>
                            {i + 1}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{p.productName}</TableCell>
                        <TableCell>{p.totalQuantity}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(p.totalRevenue)}</TableCell>
                        <TableCell className="text-emerald-600 font-semibold">{formatCurrency(p.totalProfit)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === المخزون === */}
        <TabsContent value="inventory" className="space-y-4 mt-4">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">منتجات متوفرة</p>
                <p className="text-2xl font-bold text-emerald-600">{inventory.filter((p) => p.quantity > p.minQuantity).length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">مخزون منخفض</p>
                <p className="text-2xl font-bold text-amber-600">{inventory.filter((p) => p.quantity > 0 && p.quantity <= p.minQuantity).length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">نفذ من المخزون</p>
                <p className="text-2xl font-bold text-red-600">{inventory.filter((p) => p.quantity <= 0).length}</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">المنتج</TableHead>
                    <TableHead className="text-right">التصنيف</TableHead>
                    <TableHead className="text-right">الكمية</TableHead>
                    <TableHead className="text-right">الحد الأدنى</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">لا توجد بيانات</TableCell></TableRow>
                  ) : (
                    inventory.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>{p.category?.name || '-'}</TableCell>
                        <TableCell>{p.quantity} {p.unit}</TableCell>
                        <TableCell>{p.minQuantity}</TableCell>
                        <TableCell>
                          {p.quantity <= 0 ? (
                            <Badge variant="destructive">نفذ</Badge>
                          ) : p.quantity <= p.minQuantity ? (
                            <Badge className="bg-amber-100 text-amber-700">منخفض</Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-700">متوفر</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === الأرباح === */}
        <TabsContent value="profits" className="space-y-4 mt-4">
          {profits && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
                    <p className="text-2xl font-bold">{formatCurrency(profits.totalRevenue)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">إجمالي التكاليف</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(profits.totalCost)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">صافي الربح</p>
                    <p className="text-2xl font-bold text-emerald-600">{formatCurrency(profits.totalProfit)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">هامش الربح</p>
                    <p className="text-2xl font-bold">{profits.profitMargin.toFixed(1)}%</p>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardContent className="p-6">
                  <div className="text-center space-y-2">
                    <p className="text-muted-foreground">هامش الربح الإجمالي</p>
                    <p className="text-5xl font-bold text-emerald-600">{profits.profitMargin.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">
                      الإيرادات: {formatCurrency(profits.totalRevenue)} - التكاليف: {formatCurrency(profits.totalCost)} = الربح: {formatCurrency(profits.totalProfit)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================
// 8. إدارة المستخدمين - Users Management (Admin Only)
// ============================================================
function UsersView() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ username: '', password: '', fullName: '', role: 'cashier' as string, isActive: true });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<User[]>('/api/users');
      if (res.success && res.data) setUsers(res.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openNew = () => {
    setEditingUser(null);
    setForm({ username: '', password: '', fullName: '', role: 'cashier', isActive: true });
    setDialogOpen(true);
  };

  const openEdit = (u: User) => {
    setEditingUser(u);
    setForm({ username: u.username, password: '', fullName: u.fullName, role: u.role, isActive: u.isActive });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.username || !form.fullName) { toast.error('يرجى ملء الحقول المطلوبة'); return; }
    if (!editingUser && !form.password) { toast.error('يرجى إدخال كلمة المرور'); return; }
    setSaving(true);
    try {
      const body = { ...form };
      if (editingUser && !body.password) delete (body as Record<string, unknown>).password;
      const res = editingUser
        ? await apiPut<User>(`/api/users/${editingUser.id}`, body)
        : await apiPost<User>('/api/users', body);
      if (res.success) { toast.success(editingUser ? 'تم تعديل المستخدم' : 'تم إضافة المستخدم'); setDialogOpen(false); fetchData(); }
      else toast.error(res.error || 'حدث خطأ');
    } catch { toast.error('خطأ في الاتصال'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await apiDelete(`/api/users/${deleteId}`);
      if (res.success) { toast.success('تم حذف المستخدم'); fetchData(); }
      else toast.error(res.error || 'حدث خطأ');
    } catch { toast.error('خطأ في الاتصال'); }
    setDeleteId(null);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return <Badge className="bg-red-100 text-red-700"><Shield className="w-3 h-3 ml-1" />مدير عام</Badge>;
      case 'cashier': return <Badge className="bg-emerald-100 text-emerald-700">كاشير</Badge>;
      case 'accountant': return <Badge className="bg-blue-100 text-blue-700">محاسب</Badge>;
      default: return <Badge>{role}</Badge>;
    }
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">إدارة المستخدمين</h1>
          <p className="text-muted-foreground text-sm">{users.length} مستخدم</p>
        </div>
        <Button onClick={openNew} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 ml-2" />
          إضافة مستخدم
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">المستخدم</TableHead>
              <TableHead className="text-right">اسم المستخدم</TableHead>
              <TableHead className="text-right">الصلاحية</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">تاريخ الإنشاء</TableHead>
              <TableHead className="text-right">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">لا يوجد مستخدمين</TableCell></TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
                        <UserCircle className="w-5 h-5 text-emerald-600" />
                      </div>
                      {u.fullName}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{u.username}</TableCell>
                  <TableCell>{getRoleBadge(u.role)}</TableCell>
                  <TableCell>
                    {u.isActive ? (
                      <Badge className="bg-emerald-100 text-emerald-700">نشط</Badge>
                    ) : (
                      <Badge variant="secondary">معطل</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(u.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(u)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => setDeleteId(u.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>الاسم الكامل *</Label>
              <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>اسم المستخدم *</Label>
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} dir="ltr" />
            </div>
            <div className="space-y-1">
              <Label>{editingUser ? 'كلمة المرور (اتركها فارغة للإبقاء)' : 'كلمة المرور *'}</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} dir="ltr" />
            </div>
            <div className="space-y-1">
              <Label>الصلاحية</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {USER_ROLES.map((r) => (<SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
              <Label>نشط</Label>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingUser ? 'تعديل' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف هذا المستخدم؟</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================
// مكون التحميل - Loading Skeleton
// ============================================================
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
