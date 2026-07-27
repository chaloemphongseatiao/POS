"use client";

import { create } from "zustand";
import { User } from "@/lib/types";

interface AuthStore {
  token: string | null;
  user: Pick<User, "id" | "username" | "displayName" | "role"> | null;
  initialized: boolean;
  setAuth: (token: string, user: Pick<User, "id" | "username" | "displayName" | "role">, remember?: boolean) => void;
  logout: () => void;
  isAdmin: () => boolean;
}

export const useAuth = create<AuthStore>((set, get) => ({
  token: null,
  user: null,
  initialized: false,

  setAuth: (token, user, remember = true) => {
    if (typeof window !== "undefined") {
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem("pos_token", token);
      storage.setItem("pos_user", JSON.stringify(user));
      if (!remember) {
        localStorage.removeItem("pos_token");
        localStorage.removeItem("pos_user");
      }
    }
    set({ token, user, initialized: true });
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("pos_token");
      localStorage.removeItem("pos_user");
      sessionStorage.removeItem("pos_token");
      sessionStorage.removeItem("pos_user");
    }
    set({ token: null, user: null, initialized: true });
  },

  isAdmin: () => get().user?.role === "ADMIN",
}));

// Initialize from localStorage — must be called once on client startup
export function initAuth() {
  if (typeof window === "undefined") return;
  const token = localStorage.getItem("pos_token") ?? sessionStorage.getItem("pos_token");
  const userStr = localStorage.getItem("pos_user") ?? sessionStorage.getItem("pos_user");
  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      useAuth.setState({ token, user, initialized: true });
    } catch {
      useAuth.setState({ token: null, user: null, initialized: true });
    }
  } else {
    useAuth.setState({ initialized: true });
  }
}
