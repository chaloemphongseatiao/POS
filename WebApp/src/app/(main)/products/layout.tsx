"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const TABS = [
  { href: "/products", label: "สินค้าและหมวดหมู่" },
  { href: "/products/promotions", label: "โปรโมชั่น" },
];

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      <div className="mx-auto w-full max-w-[1600px] px-3 pt-3 sm:px-4 sm:pt-4 md:px-6 md:pt-6 lg:px-8 lg:pt-8 print:hidden">
        <div className="glass flex flex-wrap gap-1.5 rounded-2xl p-2">
          {TABS.map((tab) => {
            // Only the exact route is current — "/products" is a prefix of them all.
            const active = pathname === tab.href;
            return (
              <Button
                key={tab.href}
                asChild
                size="sm"
                variant={active ? "default" : "outline"}
                className={cn(!active && "border-white/60 bg-white/40")}
              >
                <Link href={tab.href} aria-current={active ? "page" : undefined}>
                  {tab.label}
                </Link>
              </Button>
            );
          })}
        </div>
      </div>
      {children}
    </>
  );
}
