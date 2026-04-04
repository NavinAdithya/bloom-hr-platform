"use client";

import { useMemo, useState } from "react";
import useSWR, { mutate as globalMutate } from "swr";

import { API_BASE_URL, apiFetch } from "../../../lib/api";

type Lead = {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  message?: string;
  status?: "new" | "archived";
  createdAt?: string;
};

async function adminDelete(path: string) {
  const res = await fetch(`${API_BASE_URL}${path}`, { method: "DELETE", credentials: "include" });
  const text = await res.text().catch(() => "");
  if (!res.ok) throw new Error(text || res.statusText);
  return text ? JSON.parse(text) : null;
}

async function exportLeads(status?: "new" | "archived") {
  const res = await fetch(`${API_BASE_URL}/api/admin/leads/export`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(status ? { status } : {}),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || res.statusText);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bloom-leads.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function AdminLeadsPage() {
  const [status, setStatus] = useState<"new" | "archived" | "all">("new");
  const [page, setPage] = useState(1);
  const limit = 20;

  const query = status === "all" ? "" : `&status=${encodeURIComponent(status)}`;
  const swrKey = `/api/admin/leads?page=${page}&limit=${limit}${query}`;

  const { data, error } = useSWR<{ items: Lead[]; total: number; page: number; limit: number }>(
    swrKey,
    () => apiFetch<{ items: Lead[]; total: number; page: number; limit: number }>(swrKey),
  );

  const [notification, setNotification] = useState<string | null>(null);
  const leads = useMemo(() => data?.items ?? [], [data]);
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="text-[12px] font-bold tracking-wider text-slate-400 dark:text-[#94a3b8] uppercase">Leads & Inquiries</div>
        <h2 className="text-[20px] font-bold tracking-tight">Manage and export inquiries</h2>
      </div>

      {notification ? (
        <div className="rounded-xl border border-[#22c55e]/20 bg-[#22c55e]/10 px-4 py-3 text-[13px] font-medium text-[#22c55e]">
          {notification}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-[11px] font-bold tracking-wide text-slate-500 dark:text-[#94a3b8] uppercase">Status</span>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as any);
              setPage(1);
            }}
            className="rounded-xl border border-black/10 dark:border-white/10 bg-slate-50 dark:bg-[#020617] px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-[#22c55e]"
          >
            <option value="new">New</option>
            <option value="archived">Archived</option>
            <option value="all">All</option>
          </select>
        </label>

        <button
          type="button"
          onClick={async () => {
            setNotification(null);
            try {
              await exportLeads(status === "all" ? undefined : status);
              setNotification("Export started.");
            } catch (e: any) {
              setNotification(e?.message ?? "Export failed.");
            }
          }}
          className="rounded-xl bg-gradient-to-r from-[#22c55e] to-emerald-400 px-4 py-2 text-sm font-semibold text-white dark:text-[#020617] shadow-sm transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(34,197,94,0.2)]"
        >
          Export CSV
        </button>
      </div>

      {error ? <div className="text-sm text-red-500">Failed to load leads.</div> : null}

      <div className="overflow-auto rounded-2xl border border-black/5 dark:border-white/5 bg-white dark:bg-[#0f172a]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/5 dark:border-white/5 bg-slate-50 dark:bg-[#0f172a]/50">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Contact</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Submitted</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l._id} className="border-b border-black/5 dark:border-white/5">
                <td className="px-4 py-3 font-semibold">{l.name}</td>
                <td className="px-4 py-3 text-[#94a3b8]">
                  <div>{l.email ?? "-"}</div>
                  <div className="text-xs">{l.phone ?? "-"}</div>
                </td>
                <td className="px-4 py-3">{l.status ?? "new"}</td>
                <td className="px-4 py-3">
                  <div>{l.createdAt ? new Date(l.createdAt).toLocaleString() : "-"}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-3 py-1.5 text-[12px] font-semibold text-red-500 transition-all hover:bg-red-100 dark:hover:bg-red-500/20"
                      onClick={async () => {
                        if (!confirm(`Delete lead from "${l.name}"?`)) return;
                        try {
                          await adminDelete(`/api/admin/leads/${l._id}`);
                          setNotification("Lead deleted.");
                          await globalMutate(swrKey);
                        } catch (e: any) {
                          setNotification(e?.message ?? "Delete failed.");
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {leads.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-sm text-[#94a3b8]" colSpan={5}>
                  No leads found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-bold tracking-wide text-slate-500 dark:text-[#94a3b8] uppercase">
          Page {page} of {pages} (Total {total})
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-xl border border-black/10 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 py-2 text-xs font-semibold transition-all hover:bg-slate-200 dark:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Prev
          </button>
          <button
            type="button"
            disabled={page >= pages}
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            className="rounded-xl border border-black/10 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 py-2 text-xs font-semibold transition-all hover:bg-slate-200 dark:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

