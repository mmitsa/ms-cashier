"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variantId?: string;
  variantName?: string;
};

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string, variantId?: string) => void;
  updateQuantity: (id: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          const key = item.variantId ? `${item.id}-${item.variantId}` : item.id;
          const existing = state.items.find(
            (i) => (i.variantId ? `${i.id}-${i.variantId}` : i.id) === key
          );

          if (existing) {
            return {
              items: state.items.map((i) =>
                (i.variantId ? `${i.id}-${i.variantId}` : i.id) === key
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            };
          }

          return { items: [...state.items, { ...item, quantity: 1 }] };
        });
      },

      removeItem: (id, variantId) => {
        set((state) => ({
          items: state.items.filter((i) => {
            const key = variantId ? `${id}-${variantId}` : id;
            const itemKey = i.variantId ? `${i.id}-${i.variantId}` : i.id;
            return itemKey !== key;
          }),
        }));
      },

      updateQuantity: (id, quantity, variantId) => {
        if (quantity <= 0) {
          get().removeItem(id, variantId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) => {
            const key = variantId ? `${id}-${variantId}` : id;
            const itemKey = i.variantId ? `${i.id}-${i.variantId}` : i.id;
            return itemKey === key ? { ...i, quantity } : i;
          }),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotal: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: "mpos-cart",
    }
  )
);
