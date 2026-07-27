"use client";

import { create } from "zustand";
import { CartItem } from "@/lib/types";

interface CartStore {
  items: CartItem[];
  discountAmt: number;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (productId: number) => void;
  updateQty: (productId: number, quantity: number) => void;
  setDiscount: (amount: number) => void;
  clearCart: () => void;
  subtotal: () => number;
  total: () => number;
}

export const useCart = create<CartStore>((set, get) => ({
  items: [],
  discountAmt: 0,

  addItem: (newItem) => {
    set((state) => {
      const existing = state.items.find((i) => i.productId === newItem.productId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === newItem.productId ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { items: [...state.items, { ...newItem, quantity: 1 }] };
    });
  },

  removeItem: (productId) => {
    set((state) => ({ items: state.items.filter((i) => i.productId !== productId) }));
  },

  updateQty: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    set((state) => ({
      items: state.items.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
    }));
  },

  setDiscount: (amount) => set({ discountAmt: Math.max(0, amount) }),

  clearCart: () => set({ items: [], discountAmt: 0 }),

  subtotal: () =>
    get().items.reduce((sum, item) => sum + item.sellPrice * item.quantity, 0),

  total: () => Math.max(0, get().subtotal() - get().discountAmt),
}));
