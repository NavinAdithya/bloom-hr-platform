"use client";

import { usePathname } from "next/navigation";
import { AdminGate } from "../../components/admin-gate";
import { AdminNav } from "../../components/admin-nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginRoute = pathname === "/admin/login";

  if (isLoginRoute) {
    return <>{children}</>;
  }

  return (
    <AdminGate>
      <div className="container-fluid py-8 relative">
        <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
          <AdminNav />
          <section className="min-w-0 rounded-2xl border border-white/5 bg-[#0f172a] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_16px_40px_rgba(0,0,0,0.3)]">
            {children}
          </section>
        </div>
      </div>
    </AdminGate>
  );
}
