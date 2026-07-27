import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { listProducts } from "@/lib/api/products";

export interface CategoryCount {
  total: number;
  activeCount: number;
}

export function useCategoryCounts() {
  const { data } = useQuery({
    queryKey: ["products-all-for-counts"],
    queryFn: () => listProducts({ all: true, page: 1, limit: 100000 }),
    staleTime: 60_000,
  });

  const counts = useMemo(() => {
    const map = new Map<number, CategoryCount>();
    for (const product of data?.products ?? []) {
      const entry = map.get(product.category.id) ?? { total: 0, activeCount: 0 };
      entry.total += 1;
      if (product.isActive) entry.activeCount += 1;
      map.set(product.category.id, entry);
    }
    return map;
  }, [data]);

  const grandTotal = data?.products.length ?? 0;

  return { counts, grandTotal };
}
