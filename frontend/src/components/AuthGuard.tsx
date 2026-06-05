"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../lib/AuthContext";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const rutasPublicas = ["/login", "/publico"];

  useEffect(() => {
    if (loading) return;
    if (rutasPublicas.includes(pathname)) return;
    if (!token) {
      router.replace("/login");
    }
    if (token && pathname === "/login") {
      router.replace("/");
    }
  }, [token, loading, pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f6fb]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-t-transparent" />
      </div>
    );
  }

  if (!token && !rutasPublicas.includes(pathname)) return null;

  return <>{children}</>;
}
