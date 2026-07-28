import { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface KbdProps {
  children: ReactNode;
  className?: string;
  variant?: "light" | "dark";
}

export function Kbd({ children, className, variant = "light" }: KbdProps) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center justify-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold leading-none shadow-sm",
        variant === "light"
          ? "border-white/70 bg-white/70 text-slate-500"
          : "border-white/40 bg-white/15 text-white",
        className
      )}
    >
      {children}
    </kbd>
  );
}
