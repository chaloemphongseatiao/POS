"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/hooks/useAuth";
import { getSettings } from "@/lib/api/settings";
import { cn } from "@/lib/utils/cn";
import {
  ShoppingCart, Settings, LogOut, ChevronDown, Package,
  SlidersHorizontal, LayoutDashboard, Warehouse, ClipboardList, ReceiptText,
} from "lucide-react";

const mainNav = [
  { href: "/dashboard", icon: LayoutDashboard, label: "ภาพรวม" },
  { href: "/pos", icon: ShoppingCart, label: "ขายสินค้า" },
  { href: "/orders", icon: ReceiptText, label: "บิลขาย" },
  { href: "/stock", icon: Warehouse, label: "คลังสินค้า" },
  { href: "/reports", icon: ClipboardList, label: "รายงาน" },
];
const settingsNav = [
  { href: "/products", icon: Package, label: "สินค้า" },
  { href: "/settings", icon: SlidersHorizontal, label: "ตั้งค่าระบบ" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAdmin } = useAuth();
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: getSettings });
  const isInSettings = settingsNav.some((item) => pathname.startsWith(item.href));
  const [settingsOpen, setSettingsOpen] = useState(isInSettings);
  useEffect(() => { if (isInSettings) setSettingsOpen(true); }, [isInSettings]);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <>
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col bg-[#0f1f3d] text-white md:flex">
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
          {settings?.store_logo ? (
            <img src={settings.store_logo} alt="โลโก้ร้าน" className="size-9 rounded-lg object-cover" />
          ) : (
            <div className="flex size-9 items-center justify-center rounded-lg bg-white text-[#0f1f3d]">
              <ShoppingCart className="size-5" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">ร้านตั้งมารวย</p>
            <p className="text-xs text-slate-400">Point of Sale</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {mainNav.map((item) => <NavItem key={item.href} item={item} pathname={pathname} />)}
          {isAdmin() && (
            <div className="pt-2">
              <button
                onClick={() => setSettingsOpen((value) => !value)}
                aria-expanded={settingsOpen}
                className={cn("flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm text-slate-300 hover:bg-white/10 hover:text-white", isInSettings && "bg-white/10 text-white")}
              >
                <Settings className="size-5" />
                <span className="flex-1 text-left">จัดการระบบ</span>
                <ChevronDown className={cn("size-4 transition-transform", settingsOpen && "rotate-180")} />
              </button>
              {settingsOpen && (
                <div className="ml-5 mt-1 space-y-1 border-l border-white/15 pl-3">
                  {settingsNav.map((item) => <NavItem key={item.href} item={item} pathname={pathname} compact />)}
                </div>
              )}
            </div>
          )}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="mb-2 flex items-center gap-3 px-3 py-2">
            <div className="flex size-9 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">
              {user?.displayName?.slice(0, 2).toUpperCase() ?? "—"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user?.displayName}</p>
              <p className="text-xs text-slate-400">{user?.role === "ADMIN" ? "ผู้ดูแลระบบ" : "แคชเชียร์"}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-slate-400 hover:bg-white/10 hover:text-white">
            <LogOut className="size-4" /> ออกจากระบบ
          </button>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-white pb-[env(safe-area-inset-bottom)] shadow-sm md:hidden">
        {mainNav.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={cn("flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] text-slate-500", active && "text-primary")}>
              <item.icon className="size-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function NavItem({ item, pathname, compact = false }: {
  item: { href: string; icon: React.ComponentType<{ className?: string }>; label: string };
  pathname: string;
  compact?: boolean;
}) {
  const active = pathname.startsWith(item.href);
  return (
    <Link href={item.href} aria-current={active ? "page" : undefined} className={cn(
      "flex h-11 items-center gap-3 rounded-lg px-3 text-sm text-slate-300 hover:bg-white/10 hover:text-white",
      active && "bg-white text-[#0f1f3d] hover:bg-white hover:text-[#0f1f3d]",
      compact && "h-10"
    )}>
      <item.icon className={compact ? "size-4" : "size-5"} />
      <span>{item.label}</span>
    </Link>
  );
}
