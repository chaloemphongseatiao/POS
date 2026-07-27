"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { cn } from "@/lib/utils/cn";
import {
  LayoutDashboard,
  LogOut,
  Package,
  ReceiptText,
  Settings,
  ShoppingCart,
} from "lucide-react";

const navItems = [
  { href: "/pos", icon: ShoppingCart, label: "ขาย" },
  { href: "/products", icon: Package, label: "สินค้า", adminOnly: true },
  { href: "/orders", icon: ReceiptText, label: "ประวัติ" },
  { href: "/dashboard", icon: LayoutDashboard, label: "สรุป" },
  { href: "/settings", icon: Settings, label: "ตั้งค่า", adminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, isAdmin } = useAuth();
  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin());

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <>
      <aside className="glass-sidebar sticky top-0 hidden h-dvh w-24 shrink-0 flex-col items-center overflow-y-auto border-r border-white/60 py-6 md:flex">
        <Link
          href="/pos"
          aria-label="หน้าขายสินค้า"
          className="mb-6 flex size-20 items-center justify-center"
        >
          <img src="/logo.png" alt="โลโก้ร้าน" className="size-20 object-contain" />
        </Link>

        <nav className="flex w-full flex-1 flex-col items-center gap-2">
          {visibleItems.map((item) => (
            <NavItem key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          aria-label="ออกจากระบบ"
          className="flex w-16 flex-col items-center gap-1 rounded-2xl py-2.5 text-[11px] font-semibold text-slate-500 hover:bg-white/50 hover:text-slate-800"
        >
          <LogOut className="size-5" />
          <span>ออก</span>
        </button>
      </aside>

      <nav className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-5 rounded-2xl border border-white/75 bg-white/75 pb-[env(safe-area-inset-bottom)] shadow-xl shadow-indigo-950/10 backdrop-blur-xl md:hidden">
        {visibleItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold text-slate-500",
                active && "text-primary"
              )}
            >
              <item.icon className="size-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function NavItem({
  item,
  pathname,
}: {
  item: { href: string; icon: React.ComponentType<{ className?: string }>; label: string };
  pathname: string;
}) {
  const active = pathname.startsWith(item.href);

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex w-16 flex-col items-center gap-1 rounded-2xl py-2.5 text-[11px] font-semibold text-slate-500 hover:bg-white/50 hover:text-slate-800",
        active && "bg-white/70 text-primary shadow-md shadow-indigo-950/10"
      )}
    >
      <item.icon className="size-5" />
      <span>{item.label}</span>
    </Link>
  );
}
