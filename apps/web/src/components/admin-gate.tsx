"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../lib/api";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const me = await apiFetch<{ id: string; role: string; email?: string }>("/api/auth/me");
        if (cancelled) return;
        setRole(me.role);
      } catch {
        if (cancelled) return;
        router.replace("/admin/login");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="container-fluid py-16">
        <div className="glass p-8 text-sm text-slate-600 dark:text-slate-300">Verifying admin session...</div>
      </div>
    );
  }

  if (role !== "admin") {
    return (
      <div className="container-fluid py-16">
        <div className="glass p-8 text-sm text-red-600 dark:text-red-400">Forbidden: Admin access only.</div>
      </div>
    );
  }

  return <>{children}</>;
}

