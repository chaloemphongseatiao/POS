"use client";

import { create } from "zustand";

interface LoadingStore {
  pending: number;
  inc: () => void;
  dec: () => void;
}

export const useLoading = create<LoadingStore>((set) => ({
  pending: 0,
  inc: () => set((s) => ({ pending: s.pending + 1 })),
  dec: () => set((s) => ({ pending: Math.max(0, s.pending - 1) })),
}));
