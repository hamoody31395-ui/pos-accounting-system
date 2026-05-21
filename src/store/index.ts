import { create } from 'zustand';
import type { User, Product, CartItem, PaymentMethod, AppSettings } from '@/types';

// ============================
// Types
// ============================

export type ActiveView = 'pos' | 'products' | 'categories' | 'expenses' | 'dayclose' | 'reports' | 'users' | 'settings';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  setUser: (user: User, token: string) => void;
  logout: () => void;
}

interface NavigationState {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
}

interface CartState {
  cart: CartItem[];
  cartDiscount: number;
  addToCart: (item: { product: Product; quantity: number; total: number }) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setCartDiscount: (discount: number) => void;
}

interface PaymentState {
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  paidAmount: number;
  setPaidAmount: (amount: number) => void;
}

interface SettingsState {
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
}

interface NotificationState {
  lowStockAlerts: Product[];
  setLowStockAlerts: (products: Product[]) => void;
}

export interface StoreState extends AuthState, NavigationState, CartState, PaymentState, SettingsState, NotificationState {}

// ============================
// LocalStorage Helpers
// ============================

const AUTH_KEY = 'pos_auth_user';
const TOKEN_KEY = 'pos_auth_token';

function loadAuth(): { user: User | null; token: string | null } {
  if (typeof window === 'undefined') return { user: null, token: null };
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    const token = localStorage.getItem(TOKEN_KEY);
    if (raw && token) return { user: JSON.parse(raw), token };
  } catch { /* ignore */ }
  return { user: null, token: null };
}

function saveAuth(user: User | null, token: string | null) {
  if (typeof window === 'undefined') return;
  if (user && token) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }
}

// ============================
// Default Settings
// ============================

const DEFAULT_SETTINGS: AppSettings = {
  storeName: 'متجري',
  storeAddress: '',
  storePhone: '',
  taxRate: 15,
  currency: 'ر.س',
  lowStockAlert: true,
  receiptFooter: '',
};

// ============================
// Store
// ============================

export const useStore = create<StoreState>()((set, get) => {
  const { user: storedUser, token: storedToken } = loadAuth();

  return {
    // Auth
    user: storedUser,
    isAuthenticated: !!storedUser,
    token: storedToken,

    setUser: (user: User, token: string) => {
      saveAuth(user, token);
      set({ user, token, isAuthenticated: true });
    },

    logout: () => {
      saveAuth(null, null);
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        activeView: 'pos',
        cart: [],
        cartDiscount: 0,
        paidAmount: 0,
      });
    },

    // Navigation
    activeView: 'pos',
    setActiveView: (view: ActiveView) => set({ activeView: view }),

    // Cart
    cart: [],
    cartDiscount: 0,

    addToCart: (item: { product: Product; quantity: number; total: number }) => {
      const { cart } = get();
      const idx = cart.findIndex((c) => c.product.id === item.product.id);
      if (idx >= 0) {
        const updated = [...cart];
        const existing = updated[idx];
        const newQty = existing.quantity + item.quantity;
        if (newQty > item.product.quantity) return;
        updated[idx] = { ...existing, quantity: newQty, total: newQty * item.product.sellPrice };
        set({ cart: updated });
      } else {
        if (item.product.quantity < 1) return;
        set({ cart: [...cart, { product: item.product, quantity: item.quantity, total: item.total }] });
      }
    },

    removeFromCart: (productId: string) => {
      set({ cart: get().cart.filter((c) => c.product.id !== productId) });
    },

    updateCartQuantity: (productId: string, quantity: number) => {
      if (quantity <= 0) { get().removeFromCart(productId); return; }
      const { cart } = get();
      const idx = cart.findIndex((c) => c.product.id === productId);
      if (idx < 0) return;
      const item = cart[idx];
      if (quantity > item.product.quantity) return;
      const updated = [...cart];
      updated[idx] = { ...item, quantity, total: quantity * item.product.sellPrice };
      set({ cart: updated });
    },

    clearCart: () => set({ cart: [], cartDiscount: 0 }),
    setCartDiscount: (discount: number) => set({ cartDiscount: Math.max(0, discount) }),

    // Payment
    paymentMethod: 'cash' as PaymentMethod,
    setPaymentMethod: (method: PaymentMethod) => set({ paymentMethod: method }),
    paidAmount: 0,
    setPaidAmount: (amount: number) => set({ paidAmount: amount }),

    // Settings
    settings: DEFAULT_SETTINGS,
    setSettings: (settings: AppSettings) => set({ settings }),

    // Notifications
    lowStockAlerts: [],
    setLowStockAlerts: (products: Product[]) => set({ lowStockAlerts: products }),
  };
});
