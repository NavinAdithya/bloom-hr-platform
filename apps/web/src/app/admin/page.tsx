"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { Inbox, Wrench, Building2, Star } from "lucide-react";

import { apiFetch } from "../../lib/api";
import { getSocket } from "../../lib/socket";

type Analytics = {
  totalLeads: number;
  totalServices: number;
  totalClients: number;
  totalTestimonials: number;
};

const statConfig = [
  { key: "totalLeads" as const, label: "Total Inquiries", icon: Inbox },
  { key: "totalServices" as const, label: "Services Listed", icon: Wrench },
  { key: "totalClients" as const, label: "Clients", icon: Building2 },
  { key: "totalTestimonials" as const, label: "Testimonials", icon: Star },
];

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  return (
    <div className="group rounded-2xl border border-white/5 bg-[#0f172a] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#22c55e]/20 hover:shadow-[0_8px_30px_-8px_rgba(34,197,94,0.15)]">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">{label}</div>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#22c55e]/10 text-[#22c55e] group-hover:bg-[#22c55e] group-hover:text-[#020617] transition-all duration-300">
          <Icon size={14} />
        </div>
      </div>
      <div className="text-3xl font-extrabold text-white group-hover:text-[#22c55e] transition-colors duration-300">{value}</div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data, error } = useSWR<Analytics>("/api/admin/analytics", () =>
    apiFetch<Analytics>("/api/admin/analytics"),
  );
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    const s = getSocket();
    const handler = (payload: any) => {
      if (payload?.action === "created") setNotification("New lead received. Check Inquiries.");
      if (payload?.action === "deleted") setNotification("Lead removed.");
    };
    s.on("leads.changed", handler);
    return () => { s.off("leads.changed", handler); };
  }, []);

  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(() => setNotification(null), 3500);
    return () => clearTimeout(t);
  }, [notification]);

  return (
    <div className="flex flex-col gap-6">
      {notification ? (
        <div className="rounded-xl border border-[#22c55e]/20 bg-[#22c55e]/10 px-4 py-3 text-[13px] font-medium text-[#22c55e]">
          {notification}
        </div>
      ) : null}

      <div>
        <div className="section-badge">Admin Dashboard</div>
        <h1 className="text-[24px] font-bold tracking-tight">Bloom HR CMS</h1>
        <p className="mt-2 text-[14px] text-[#94a3b8]">
          Manage services, clients, testimonials, content, media, and inquiries.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statConfig.map((s) => (
          <StatCard key={s.key} label={s.label} value={data?.[s.key] ?? 0} icon={s.icon} />
        ))}
      </div>

      {error ? <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-400">Failed to load analytics.</div> : null}
    </div>
  );
}
