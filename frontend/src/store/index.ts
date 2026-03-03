import { create } from 'zustand';
import type { ProductListParams, OrderListParams } from '@/types';

// ── UI Store (Zustand handles local/ephemeral UI state ONLY) ─────────────────
// Server state lives in React Query — never duplicate it here.

interface CartItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (product_id: string) => void;
  updateQuantity: (product_id: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],

  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.product_id === item.product_id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product_id === item.product_id
              ? { ...i, quantity: i.quantity + item.quantity }
              : i,
          ),
        };
      }
      return { items: [...state.items, item] };
    }),

  removeItem: (product_id) =>
    set((state) => ({ items: state.items.filter((i) => i.product_id !== product_id) })),

  updateQuantity: (product_id, quantity) =>
    set((state) => ({
      items:
        quantity <= 0
          ? state.items.filter((i) => i.product_id !== product_id)
          : state.items.map((i) => (i.product_id === product_id ? { ...i, quantity } : i)),
    })),

  clearCart: () => set({ items: [] }),

  total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
}));

// ── Filter Store ──────────────────────────────────────────────────────────────

interface FilterStore {
  orderFilters: OrderListParams;
  productFilters: ProductListParams;
  setOrderFilters: (filters: Partial<OrderListParams>) => void;
  setProductFilters: (filters: Partial<ProductListParams>) => void;
  resetOrderFilters: () => void;
  resetProductFilters: () => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
  orderFilters: { limit: 50 },
  productFilters: { limit: 50 },

  setOrderFilters: (filters) =>
    set((state) => ({ orderFilters: { ...state.orderFilters, ...filters } })),

  setProductFilters: (filters) =>
    set((state) => ({ productFilters: { ...state.productFilters, ...filters } })),

  resetOrderFilters: () => set({ orderFilters: { limit: 50 } }),
  resetProductFilters: () => set({ productFilters: { limit: 50 } }),
}));

// ── Modal Store ───────────────────────────────────────────────────────────────

type ModalType = 'create-order' | 'create-product' | 'create-customer' | null;

interface ModalStore {
  activeModal: ModalType;
  modalData: unknown;
  openModal: (type: ModalType, data?: unknown) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalStore>((set) => ({
  activeModal: null,
  modalData: null,
  openModal: (type, data) => set({ activeModal: type, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),
}));

