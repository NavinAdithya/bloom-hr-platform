"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

import { API_BASE_URL, apiFetch } from "../../../lib/api";
import { RichTextEditor } from "../../../components/rich-text-editor";

type ContentBlock = {
  key: string;
  title?: string;
  contentHtml: string;
  isActive?: boolean;
  sortOrder?: number;
};

const contentKeys = ["about", "whyChooseUs", "contactHeading", "contactSubheading", "contactPhone", "contactEmail", "contactAddress"];

/** Section visibility keys — missing key means visible (default true) */
const SECTION_KEYS = [
  { key: "sectionVisible_services",     label: "Services Section" },
  { key: "sectionVisible_process",      label: "Process / Framework Section" },
  { key: "sectionVisible_about",        label: "About / Why Us Section" },
  { key: "sectionVisible_clients",      label: "Clients Section" },
  { key: "sectionVisible_testimonials", label: "Testimonials Section" },
  { key: "sectionVisible_contact",      label: "Contact Section" },
];

const allKeys = [...contentKeys, ...SECTION_KEYS.map((s) => s.key)];

async function adminPutBlock(key: string, data: { contentHtml: string; isActive?: boolean; sortOrder?: number; title?: string }) {
  const res = await fetch(`${API_BASE_URL}/api/admin/cms/blocks/${key}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const text = await res.text().catch(() => "");
  if (!res.ok) throw new Error(text || res.statusText);
  return text ? JSON.parse(text) : null;
}

export default function AdminCmsPage() {
  const swrKey = `/api/admin/cms/blocks?keys=${allKeys.join(",")}`;
  const { data, error, mutate } = useSWR<{ blocks: ContentBlock[] }>(swrKey, () =>
    apiFetch<{ blocks: ContentBlock[] }>(swrKey),
  );

  const [notification, setNotification] = useState<string | null>(null);
  const blocks = useMemo(() => data?.blocks ?? [], [data]);

  const [local, setLocal] = useState<Record<string, { contentHtml: string; isActive: boolean; sortOrder: number }>>({});

  useEffect(() => {
    if (!blocks.length) return;
    if (Object.keys(local).length) return;

    const next: Record<string, { contentHtml: string; isActive: boolean; sortOrder: number }> = {};
    for (const b of blocks) {
      next[b.key] = {
        contentHtml: b.contentHtml ?? "",
        isActive: b.isActive ?? true,
        sortOrder: b.sortOrder ?? 0,
      };
    }
    setLocal(next);
  }, [blocks, local]);

  /**
   * Section visibility helpers.
   * If the block doesn't exist yet in `local`, it defaults to VISIBLE (true).
   * Value is stored as contentHtml "true" | "false" — simple string flag.
   */
  function isSectionVisible(key: string): boolean {
    const item = local[key];
    if (!item) return true; // key missing → default visible
    return item.contentHtml?.trim() !== "false";
  }

  async function toggleSection(key: string) {
    const current = isSectionVisible(key);
    const newVal = !current;
    // Optimistically update local state
    setLocal((p) => ({
      ...p,
      [key]: { contentHtml: String(newVal), isActive: true, sortOrder: 0 },
    }));
    try {
      setNotification(null);
      await adminPutBlock(key, { contentHtml: String(newVal), isActive: true, sortOrder: 0 });
      setNotification(`${key} updated — section is now ${newVal ? "visible" : "hidden"}.`);
      await mutate();
    } catch (e: any) {
      setNotification(e?.message ?? "Failed to update section visibility.");
    }
  }

  async function saveBlock(blockKey: string) {
    const item = local[blockKey];
    if (!item) return;
    try {
      setNotification(null);
      await adminPutBlock(blockKey, { contentHtml: item.contentHtml, isActive: item.isActive, sortOrder: item.sortOrder });
      setNotification(`Updated: ${blockKey}`);
      await mutate();
    } catch (e: any) {
      setNotification(e?.message ?? "Failed to update block.");
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <div className="text-[12px] font-bold tracking-wider text-slate-400 dark:text-[#94a3b8] uppercase">Website Content</div>
        <h2 className="text-[20px] font-bold tracking-tight">Edit CMS blocks</h2>
      </div>

      {notification ? (
        <div className="rounded-xl border border-[#22c55e]/20 bg-[#22c55e]/10 px-4 py-3 text-[13px] font-medium text-[#22c55e]">
          {notification}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] font-medium text-red-400">
          <div className="font-bold">Failed to load CMS blocks</div>
          <div className="mt-1 text-[12px] opacity-80">{error?.message ?? "Unknown error — check API connection."}</div>
        </div>
      ) : null}

      {/* ─────────────────────────────── SECTION VISIBILITY ─────────────────────────────── */}
      <div className="rounded-2xl border border-white/5 bg-[#0b1628] p-5">
        <div className="mb-4">
          <div className="text-[11px] font-bold tracking-widest text-[#94a3b8] uppercase mb-1">Section Visibility</div>
          <p className="text-[12px] text-[#64748b]">
            Toggle sections on/off. Changes apply instantly to the live site. Hidden sections are skipped during render — no data is deleted.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SECTION_KEYS.map(({ key, label }) => {
            const visible = isSectionVisible(key);
            return (
              <button
                key={key}
                type="button"
                aria-label={`${visible ? "Hide" : "Show"} ${label}`}
                onClick={() => void toggleSection(key)}
                className={`group flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200 ${
                  visible
                    ? "border-[#22c55e]/20 bg-[#22c55e]/8 hover:border-[#22c55e]/40"
                    : "border-white/5 bg-white/3 hover:border-white/10"
                }`}
              >
                <span className={`text-[13px] font-semibold ${visible ? "text-white" : "text-[#64748b]"}`}>
                  {label}
                </span>
                <span
                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ${
                    visible ? "bg-[#22c55e]" : "bg-white/15"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200 ${
                      visible ? "translate-x-4" : "translate-x-1"
                    }`}
                  />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────── CONTENT BLOCKS ─────────────────────────────── */}
      <div>
        <div className="text-[11px] font-bold tracking-widest text-[#94a3b8] uppercase mb-4">Content Blocks</div>
        <div className="grid gap-4 lg:grid-cols-2">
          {contentKeys.map((keyName) => {
            const item = local[keyName] ?? { contentHtml: "", isActive: true, sortOrder: 0 };
            return (
              <div key={keyName} className="rounded-2xl border border-white/5 bg-[#0b1628] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold capitalize">{keyName}</div>
                  <label className="flex items-center gap-2 text-[11px] font-bold tracking-wide text-slate-500 dark:text-[#94a3b8] uppercase cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.isActive}
                      onChange={(e) => setLocal((p) => ({ ...p, [keyName]: { ...item, isActive: e.target.checked } }))}
                    />
                    Active
                  </label>
                </div>

                <label className="mt-3 flex flex-col gap-1">
                  <span className="text-[11px] font-bold tracking-wide text-slate-500 dark:text-[#94a3b8] uppercase">Sort order</span>
                  <input
                    type="number"
                    value={item.sortOrder}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setLocal((p) => ({ ...p, [keyName]: { ...item, sortOrder: Number.isFinite(v) ? v : 0 } }));
                    }}
                    className="rounded-xl border border-white/5 bg-[#020617] px-4 py-2 text-sm text-white outline-none transition focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]"
                  />
                </label>

                <div className="mt-3 flex flex-col gap-1">
                  <span className="text-[11px] font-bold tracking-wide text-slate-500 dark:text-[#94a3b8] uppercase mb-1">Content</span>
                  <RichTextEditor
                    value={item.contentHtml}
                    onChange={(val) => setLocal((p) => ({ ...p, [keyName]: { ...item, contentHtml: val } }))}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => void saveBlock(keyName)}
                  className="mt-4 rounded-xl bg-gradient-to-r from-[#22c55e] to-emerald-400 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:scale-[1.02] hover:shadow-[0_0_16px_rgba(34,197,94,0.3)]"
                >
                  Save
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-[11px] font-bold tracking-wide text-slate-500 dark:text-[#94a3b8] uppercase">
        Tip: Format text directly using the rich-text editor. Changes apply instantly to the public website.
      </div>
    </div>
  );
}
