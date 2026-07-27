import * as React from "react";
import { cn } from "@/lib/utils/cn";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-xl px-3.5 py-2 text-sm",
        "bg-white/55 backdrop-blur-sm",
        "border border-white/75",
        "text-brand-950/80 placeholder:text-brand-400/50",
        "shadow-sm shadow-brand-200/20",
        "transition-all duration-200",
        "hover:bg-white/70 hover:border-white/90",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/40 focus-visible:ring-offset-0",
        "focus-visible:bg-white/80 focus-visible:border-brand-300/60",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-white/30",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
