// أنواع البيانات المشتركة - Shared TypeScript Types
// ============================================

export type UserRole = 'admin' | 'cashier' | 'accountant';
export type PaymentMethod = 'cash' | 'card' | 'network';

// المستخدم
export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  password?: string; // يُستخدم فقط عند الإنشاء
}

// التصنيف
export interface Category {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  _count?: { products: number };
}

// المنتج
export interface Product {
  id: string;
  name: string;
  nameEn?: string | null;
  barcode?: string | null;
  categoryId?: string | null;
  costPrice: number;
  sellPrice: number;
  quantity: number;
  minQuantity: number;
  unit: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: Category | null;
}

// عنصر في الفاتورة
export interface SaleItemInput {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  costPrice: number;
  total: number;
}

// إنشاء فاتورة
export interface CreateSaleInput {
  items: SaleItemInput[];
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  totalCost: number;
  total: number;
  paymentMethod: PaymentMethod;
  paidAmount: number;
  changeAmount: number;
  notes?: string;
}

// الفاتورة
export interface Sale {
  id: string;
  invoiceNumber: string;
  userId: string;
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  totalCost: number;
  total: number;
  paymentMethod: PaymentMethod;
  paidAmount: number;
  changeAmount: number;
  notes?: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  user?: { fullName: string };
  items?: SaleItemFull[];
}

export interface SaleItemFull {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  costPrice: number;
  total: number;
}

// المصروف
export interface Expense {
  id: string;
  userId: string;
  category: string;
  amount: number;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { fullName: string };
}

// إغلاق يومية
export interface DayClose {
  id: string;
  userId: string;
  date: string;
  expectedCash: number;
  actualCash: number;
  difference: number;
  totalSales: number;
  totalExpenses: number;
  totalCardSales: number;
  totalNetSales: number;
  profit: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { fullName: string };
}

// عنصر في السلة (للواجهة)
export interface CartItem {
  product: Product;
  quantity: number;
  total: number;
}

// التقارير
export interface SalesReport {
  date: string;
  totalSales: number;
  totalProfit: number;
  transactionCount: number;
  avgTransaction: number;
}

export interface ProductSalesReport {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
  totalProfit: number;
}

// إعدادات
export interface AppSettings {
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  taxRate: number;
  currency: string;
  lowStockAlert: boolean;
  receiptFooter?: string;
}

// استجابة عامة
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
