import { create } from 'zustand';
import type { ProductDto, ContactDto } from '@/types/api.types';

export interface CartItem {
  product: ProductDto;
  quantity: number;
  unitPrice: number;
  discount: number;
}

interface POSState {
  cart: CartItem[];
  selectedCustomer: ContactDto | null;
  priceType: 'retail' | 'half' | 'wholesale';
  discount: number;
  notes: string;
  
  // Actions
  addToCart: (product: ProductDto, price: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  updateItemDiscount: (productId: number, discount: number) => void;
  setDirectQuantity: (productId: number, qty: number) => void;
  clearCart: () => void;
  setCustomer: (customer: ContactDto | null) => void;
  setPriceType: (type: 'retail' | 'half' | 'wholesale') => void;
  setDiscount: (discount: number) => void;
  setNotes: (notes: string) => void;
  
  // Computed
  getSubTotal: () => number;
  getTaxTotal: () => number;
  getTotal: () => number;
  getProfit: () => number;
  getItemCount: () => number;
  getQuantityCount: () => number;
}

export const usePOSStore = create<POSState>((set, get) => ({
  cart: [],
  selectedCustomer: null,
  priceType: 'retail',
  discount: 0,
  notes: '',

  addToCart: (product, price) => {
    set((state) => {
      const existing = state.cart.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.currentStock && product.currentStock > 0) return state;
        return {
          cart: state.cart.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return {
        cart: [...state.cart, { product, quantity: 1, unitPrice: price, discount: 0 }],
      };
    });
  },

  removeFromCart: (productId) => {
    set((state) => ({
      cart: state.cart.filter((item) => item.product.id !== productId),
    }));
  },

  updateQuantity: (productId, quantity) => {
    set((state) => ({
      cart: quantity <= 0
        ? state.cart.filter((item) => item.product.id !== productId)
        : state.cart.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
    }));
  },

  setDirectQuantity: (productId, qty) => {
    if (qty <= 0) {
      get().removeFromCart(productId);
      return;
    }
    set((state) => ({
      cart: state.cart.map((item) =>
        item.product.id === productId ? { ...item, quantity: qty } : item
      ),
    }));
  },

  updateItemDiscount: (productId, discount) => {
    set((state) => ({
      cart: state.cart.map((item) =>
        item.product.id === productId ? { ...item, discount } : item
      ),
    }));
  },

  clearCart: () => set({ cart: [], selectedCustomer: null, discount: 0, notes: '' }),
  setCustomer: (customer) => set({ selectedCustomer: customer }),
  setPriceType: (type) => set({ priceType: type }),
  setDiscount: (discount) => set({ discount }),
  setNotes: (notes) => set({ notes }),

  getSubTotal: () => {
    return get().cart.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity - item.discount,
      0
    );
  },

  getTaxTotal: () => {
    return get().cart.reduce(
      (sum, item) =>
        sum +
        (item.unitPrice * item.quantity - item.discount) *
          ((item.product.costPrice > 0 ? 0 : 0) / 100),
      0
    );
  },

  getTotal: () => {
    const state = get();
    return state.getSubTotal() + state.getTaxTotal() - state.discount;
  },

  getProfit: () => {
    return get().cart.reduce(
      (sum, item) =>
        sum + (item.unitPrice - item.product.costPrice) * item.quantity - item.discount,
      0
    );
  },

  getItemCount: () => get().cart.length,
  getQuantityCount: () => get().cart.reduce((sum, item) => sum + item.quantity, 0),
}));
