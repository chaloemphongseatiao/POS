"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { login } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Lock, AlertCircle } from "lucide-react";
import LoadingBar from "@/components/ui/LoadingBar";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(username, password);
      setAuth(data.token, data.user, remember);
      router.push("/pos");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "เข้าสู่ระบบไม่สำเร็จ";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <LoadingBar />

      <div className="w-full max-w-[400px]">

        {/* Card */}
        <div className="glass rounded-[26px] p-6 sm:p-8">

          <div className="mb-6 flex flex-col items-center text-center">
            <img src="/logo.png" alt="โลโก้ร้าน" className="mb-4 size-20 object-contain" />
            <h2 className="text-xl font-bold text-brand-950/80">ร้านตั้งมารวย</h2>
            <p className="text-sm text-brand-500/55 mt-0.5">เข้าสู่ระบบ POS</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-brand-900/65">ชื่อผู้ใช้</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500 pointer-events-none z-10" />
                <Input
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                  autoComplete="username"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-brand-900/65">รหัสผ่าน</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500 pointer-events-none z-10" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pl-10"
                />
              </div>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-all duration-150 ${
                  remember
                    ? "border-brand-400 bg-brand-500"
                    : "border-brand-200 bg-white/60 group-hover:border-brand-300"
                }`}
              >
                {remember && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                  </svg>
                )}
              </span>
              <span className="text-sm text-brand-900/60">จดจำฉันไว้</span>
            </label>

            {error && (
              <div className="flex items-center gap-2.5 text-sm text-red-600 bg-red-50/90 border border-red-100/80 rounded-xl px-3.5 py-3 backdrop-blur-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full h-11 text-sm font-semibold mt-1" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  กำลังเข้าสู่ระบบ...
                </span>
              ) : "เข้าสู่ระบบ"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          © {new Date().getFullYear()} ร้านตั้งมารวย · POS System
        </p>
      </div>
    </div>
  );
}
