"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import ToastContainer from "@/components/ui/ToastContainer";
import LoadingBar from "@/components/ui/LoadingBar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { token, initialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (initialized && !token) router.push("/login");
  }, [token, initialized, router]);

  if (!initialized) return null;
  if (!token) return null;

  return (
    <div className="flex min-h-dvh">
      <LoadingBar />
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-x-hidden pb-24 md:pb-0">{children}</main>
      <ToastContainer />
    </div>
  );
}
