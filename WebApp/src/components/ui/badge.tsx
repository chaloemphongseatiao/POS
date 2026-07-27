import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-brand-100/80 text-brand-700 border border-brand-200/60",
        secondary:
          "bg-white/60 text-gray-600 border border-white/80",
        destructive:
          "bg-red-50/80 text-red-600 border border-red-100/80",
        outline:
          "bg-white/40 border border-current text-foreground",
        success:
          "bg-emerald-50/80 text-emerald-700 border border-emerald-100/80",
        warning:
          "bg-amber-50/80 text-amber-700 border border-amber-100/80",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
