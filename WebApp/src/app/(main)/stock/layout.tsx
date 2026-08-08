"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";

/**
 * Receiving and adjusting stock are ADMIN-only on the API, so a CASHIER who
 * types the URL would otherwise fill in a whole receipt before hitting 403.
 */
export default function StockLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { initialized, isAdmin } = useAuth();
  const allowed = isAdmin();

  useEffect(() => {
    if (initialized && !allowed) router.replace("/pos");
  }, [initialized, allowed, router]);

  if (!initialized || !allowed) return null;

  return <>{children}</>;
}
