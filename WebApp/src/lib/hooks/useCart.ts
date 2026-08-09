"use client";

import { create } from "zustand";
import { CartItem } from "@/lib/types";

interface CartStore {
  items: CartItem[];
  discountAmt: number;
  /** False when the shelf has nothing left to add — the caller warns the cashier. */
  addItem: (item: Omit<CartItem, "quantity">) => boolean;
  removeItem: (productId: number) => void;
  updateQty: (productId: number, quantity: number) => void;
  setDiscount: (amount: number) => void;
  clearCart: () => void;
  subtotal: () => number;
  total: () => number;
  /** Zero for cashiers, whose products arrive without a cost price. */
  costTotal: () => number;
}

export const useCart = create<CartStore>((set, get) => ({
  items: [],
  discountAmt: 0,

  addItem: (newItem) => {
    const existing = get().items.find((i) => i.productId === newItem.productId);
    // The stock figure comes from the latest product read, so a refill made
    // after the item landed in the cart still counts.
    const available = newItem.stock;
    if ((existing?.quantity ?? 0) + 1 > available) return false;

    set((state) => ({
      items: existing
        ? state.items.map((i) =>
            i.productId === newItem.productId
              ? { ...i, quantity: i.quantity + 1, stock: available }
              : i
          )
        : [...state.items, { ...newItem, quantity: 1 }],
    }));
    return true;
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
      items: state.items.map((i) =>
        i.productId === productId ? { ...i, quantity: Math.min(quantity, i.stock) } : i
      ),
    }));
  },

  setDiscount: (amount) => set({ discountAmt: Math.max(0, amount) }),

  clearCart: () => set({ items: [], discountAmt: 0 }),

  subtotal: () =>
    get().items.reduce((sum, item) => sum + item.sellPrice * item.quantity, 0),

  total: () => Math.max(0, get().subtotal() - get().discountAmt),

  costTotal: () =>
    get().items.reduce((sum, item) => sum + (item.costPrice ?? 0) * item.quantity, 0),
}));
