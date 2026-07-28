"use client";

import { useState, useEffect } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface Props {
  src: string | null | undefined;
  alt: string;
  className?: string;
  iconClassName?: string;
}

export function ProductImage({ src, alt, className, iconClassName }: Props) {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [src]);

  if (!src || error) {
    return (
      <div className={cn("bg-gray-100 flex items-center justify-center text-gray-300", className)}>
        <ImageOff className={cn("w-1/2 h-1/2", iconClassName)} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn("object-cover", className)}
      onError={() => setError(true)}
    />
  );
}
