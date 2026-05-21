import type { CartItem } from '@/types';

// ============================
// Currency Formatting
// ============================

/**
 * Format a number as Saudi Riyal currency with Arabic-Indic numerals.
 * Example: 123.45 → "١٢٣.٤٥ ر.س"
 */
export function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat('ar-SA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${formatted} ر.س`;
}

// ============================
// Date Formatting
// ============================

/**
 * Format an ISO date string as a localized Arabic date.
 * Example: "2025-01-15T10:30:00Z" → "١٥ يناير ٢٠٢٥"
 */
export function formatDate(date: string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

/**
 * Format an ISO date string as a localized Arabic date+time.
 * Example: "2025-01-15T10:30:00Z" → "١٥ يناير ٢٠٢٥، ١٠:٣٠ ص"
 */
export function formatDateTime(date: string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

// ============================
// Invoice Number Generation
// ============================

/**
 * Generate a unique invoice number in the format INV-YYYYMMDD-XXXX
 * where XXXX is a random 4-digit number.
 */
export function generateInvoiceNumber(): string {
  const now = new Date();
  const datePart =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `INV-${datePart}-${seq}`;
}

// ============================
// Date Helpers
// ============================

/**
 * Get today's date as YYYY-MM-DD string in local timezone.
 */
export function getToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get the first day of the current month as YYYY-MM-DD.
 */
export function getMonthStart(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

// ============================
// Cart Calculations
// ============================

export interface CartTotals {
  subtotal: number;
  taxAmount: number;
  total: number;
}

/**
 * Calculate cart totals including tax and discount.
 *
 * - subtotal = sum of (item.quantity × item.product.sellPrice)
 * - taxAmount = (subtotal - discount) × taxRate
 * - total = subtotal - discount + taxAmount
 *
 * @param items   Cart items array
 * @param discount  Discount amount to subtract (must be >= 0)
 * @param taxRate   Tax percentage (e.g. 15 for 15%)
 */
export function calculateCartTotals(
  items: CartItem[],
  discount: number,
  taxRate: number
): CartTotals {
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.product.sellPrice,
    0
  );

  const safeDiscount = Math.max(0, Math.min(discount, subtotal));
  const taxableAmount = subtotal - safeDiscount;
  const taxAmount = taxableAmount * (taxRate / 100);
  const total = taxableAmount + taxAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}
