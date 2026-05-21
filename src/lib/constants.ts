import type { UserRole, PaymentMethod } from '@/types';

// ============================
// Payment Methods (Arabic Labels)
// ============================

export const PAYMENT_METHODS: {
  value: PaymentMethod;
  label: string;
}[] = [
  { value: 'cash', label: 'نقدي' },
  { value: 'card', label: 'بطاقة ائتمان' },
  { value: 'network', label: 'شبكة' },
];

/**
 * Get the Arabic label for a payment method value.
 */
export function getPaymentMethodLabel(
  value: PaymentMethod
): string {
  const found = PAYMENT_METHODS.find((m) => m.value === value);
  return found?.label ?? value;
}

// ============================
// User Roles (Arabic Labels)
// ============================

export const USER_ROLES: {
  value: UserRole;
  label: string;
}[] = [
  { value: 'admin', label: 'مدير عام' },
  { value: 'cashier', label: 'كاشير' },
  { value: 'accountant', label: 'محاسب' },
];

/**
 * Get the Arabic label for a user role value.
 */
export function getUserRoleLabel(value: UserRole): string {
  const found = USER_ROLES.find((r) => r.value === value);
  return found?.label ?? value;
}

// ============================
// Expense Categories
// ============================

export const EXPENSE_CATEGORIES: string[] = [
  'إيجار',
  'كهرباء',
  'ماء',
  'صيانة',
  'نقل',
  'رواتب',
  'مصاريف أخرى',
];

// ============================
// Default Application Settings
// ============================

export const DEFAULT_SETTINGS = {
  storeName: 'متجري',
  storeAddress: '',
  storePhone: '',
  taxRate: 15,
  currency: 'ر.س',
  lowStockAlert: true,
  receiptFooter: '',
} as const;

export const DEFAULT_TAX_RATE = 15;

// ============================
// Navigation Items (Sidebar)
// ============================

export interface NavItem {
  id: string;
  label: string;
  icon: string; // Lucide icon name
  roles: UserRole[]; // Which roles can see this item
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'pos',
    label: 'نقطة البيع',
    icon: 'ShoppingCart',
    roles: ['admin', 'cashier'],
  },
  {
    id: 'products',
    label: 'المنتجات',
    icon: 'Package',
    roles: ['admin', 'accountant'],
  },
  {
    id: 'categories',
    label: 'التصنيفات',
    icon: 'FolderTree',
    roles: ['admin'],
  },
  {
    id: 'sales',
    label: 'المبيعات',
    icon: 'Receipt',
    roles: ['admin', 'cashier', 'accountant'],
  },
  {
    id: 'expenses',
    label: 'المصروفات',
    icon: 'Wallet',
    roles: ['admin', 'accountant'],
  },
  {
    id: 'reports',
    label: 'التقارير',
    icon: 'BarChart3',
    roles: ['admin', 'accountant'],
  },
  {
    id: 'day-close',
    label: 'إغلاق يومية',
    icon: 'CalendarCheck',
    roles: ['admin', 'cashier'],
  },
  {
    id: 'users',
    label: 'المستخدمين',
    icon: 'Users',
    roles: ['admin'],
  },
  {
    id: 'settings',
    label: 'الإعدادات',
    icon: 'Settings',
    roles: ['admin'],
  },
];
