import { create } from 'zustand';
import type { ProductDto, ContactDto } from '@/types/api.types';
import { getPriceByType } from '@/lib/utils/cn';

export interface CartItem {
  product: ProductDto;
  quantity: number;
  unitPrice: number;
  discount: number;
  isBundleParent?: boolean;
  bundleChildren?: CartItem[];
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

export function calcBundlePrice(product: ProductDto, priceType: 'retail' | 'half' | 'wholesale'): number {
  if (!product.bundleItems?.length) return product.retailPrice;

  if (product.bundleDiscountType === 1) { // FixedPrice
    if (product.bundlePricingMode === 1) return product.retailPrice; // Unified
    return getPriceByType(product, priceType);
  }

  const componentSum = product.bundleItems.reduce((sum, bi) => {
    return sum + bi.componentRetailPrice * bi.quantity;
  }, 0);

  if (product.bundleDiscountType === 2) { // Percent
    return Math.round((componentSum * (1 - (product.bundleDiscountValue ?? 0) / 100)) * 100) / 100;
  }
  if (product.bundleDiscountType === 3) { // FlatDiscount
    return Math.max(0, componentSum - (product.bundleDiscountValue ?? 0));
  }

  return componentSum;
}

export const usePOSStore = create<POSState>((set, get) => ({
  cart: [],
  selectedCustomer: null,
  priceType: 'retail',
  discount: 0,
  notes: '',

  addToCart: (product, price) => {
    set((state) => {
      // Bundle handling
      if (product.isBundle && product.bundleItems?.length) {
        const bundlePrice = calcBundlePrice(product, get().priceType);
        const existing = state.cart.find((i) => i.product.id === product.id && i.isBundleParent);
        if (existing) {
          return {
            cart: state.cart.map((item) =>
              item.product.id === product.id && item.isBundleParent
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          };
        }
        const children: CartItem[] = product.bundleItems!.map((bi) => ({
          product: { id: bi.componentId, name: bi.componentName, barcode: bi.componentBarcode } as ProductDto,
          quantity: bi.quantity,
          unitPrice: 0,
          discount: 0,
        }));
        return {
          cart: [
            ...state.cart,
            {
              product,
              quantity: 1,
              unitPrice: bundlePrice,
              discount: 0,
              isBundleParent: true,
              bundleChildren: children,
            },
          ],
        };
      }

      // Regular product handling
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
        : state.cart.map((item) => {
            if (item.product.id !== productId) return item;
            const updated = { ...item, quantity };
            // Sync bundle children quantities
            if (updated.isBundleParent && updated.bundleChildren && updated.product.bundleItems) {
              updated.bundleChildren = updated.bundleChildren.map((child, idx) => {
                const bi = updated.product.bundleItems![idx];
                if (bi) return { ...child, quantity: bi.quantity * updated.quantity };
                return child;
              });
            }
            return updated;
          }),
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
