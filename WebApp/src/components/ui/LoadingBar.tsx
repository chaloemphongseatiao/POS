"use client";

import { useLoading } from "@/lib/hooks/useLoading";

export default function LoadingBar() {
  const isLoading = useLoading((s) => s.pending > 0);

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9998] h-[3px] overflow-hidden">
      <div
        className="h-full w-full origin-left animate-loading-bar"
        style={{
          background: "linear-gradient(90deg, #0A3D91, #3b70d5, #0A3D91)",
          backgroundSize: "200% 100%",
          animation: "loading-slide 1.2s ease-in-out infinite",
        }}
      />
    </div>
  );
}
