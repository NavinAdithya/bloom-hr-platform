"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Wrench, Building2, Star, FileText, Inbox, Image, LogOut } from "lucide-react";
import { API_BASE_URL } from "../lib/api";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/services", label: "Services", icon: Wrench },
  { href: "/admin/clients", label: "Clients", icon: Building2 },
  { href: "/admin/testimonials", label: "Testimonials", icon: Star },
  { href: "/admin/cms", label: "Content", icon: FileText },
  { href: "/admin/leads", label: "Inquiries", icon: Inbox },
  { href: "/admin/media", label: "Media", icon: Image },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch(`${API_BASE_URL}/api/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
    router.replace("/admin/login");
  }

  return (
    <aside className="hidden w-60 shrink-0 rounded-2xl border border-white/5 bg-[#0f172a] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] lg:flex flex-col gap-2 h-fit sticky top-24">
      <div className="flex items-center gap-2.5 px-3 pb-3 border-b border-white/5 mb-1">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#22c55e]/15 text-[#22c55e]">
          <LayoutDashboard size={14} />
        </div>
        <div className="text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">
          Admin Panel
        </div>
      </div>

      <div className="flex flex-col gap-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 relative ${
                isActive
                  ? "bg-[#22c55e]/10 text-[#22c55e] font-semibold"
                  : "text-[#94a3b8] hover:bg-white/5 hover:text-white"
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-[#22c55e]" />
              )}
              <item.icon
                size={15}
                className={`shrink-0 transition-colors ${isActive ? "text-[#22c55e]" : "text-[#94a3b8]/60 group-hover:text-white/60"}`}
              />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-auto pt-3 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-[#94a3b8] hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
        >
          <LogOut size={15} className="shrink-0 text-[#94a3b8]/60 group-hover:text-red-400 transition-colors" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
