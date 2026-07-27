"use client";

import { useToast } from "@/lib/hooks/useToast";
import { X, AlertCircle, CheckCircle2, Info } from "lucide-react";

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-80">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-start gap-3 rounded-2xl px-4 py-3 shadow-xl animate-in slide-in-from-right-4 duration-300"
          style={{
            background:
              toast.type === "error"
                ? "rgba(254,242,242,0.95)"
                : toast.type === "success"
                ? "rgba(240,253,244,0.95)"
                : "rgba(239,246,255,0.95)",
            backdropFilter: "blur(16px)",
            border:
              toast.type === "error"
                ? "1px solid rgba(252,165,165,0.6)"
                : toast.type === "success"
                ? "1px solid rgba(134,239,172,0.6)"
                : "1px solid rgba(147,197,253,0.6)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.8)",
          }}
        >
          {toast.type === "error" && <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />}
          {toast.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />}
          {toast.type === "info" && <Info className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />}

          <p className={`flex-1 text-sm font-medium ${
            toast.type === "error" ? "text-red-700" :
            toast.type === "success" ? "text-emerald-700" : "text-brand-700"
          }`}>
            {toast.message}
          </p>

          <button
            onClick={() => removeToast(toast.id)}
            className={`flex-shrink-0 rounded-lg p-0.5 transition-colors ${
              toast.type === "error" ? "text-red-400 hover:text-red-600 hover:bg-red-100" :
              toast.type === "success" ? "text-emerald-400 hover:text-emerald-600 hover:bg-emerald-100" :
              "text-brand-400 hover:text-brand-600 hover:bg-brand-100"
            }`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
