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

const keys = ["about", "whyChooseUs", "contactHeading", "contactSubheading", "contactPhone", "contactEmail", "contactAddress"];

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
  const swrKey = `/api/admin/cms/blocks?keys=${keys.join(",")}`;
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
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="text-[12px] font-bold tracking-wider text-slate-400 dark:text-[#94a3b8] uppercase">Website Content</div>
        <h2 className="text-[20px] font-bold tracking-tight">Edit CMS blocks</h2>
      </div>

      {notification ? (
        <div className="rounded-xl border border-[#22c55e]/20 bg-[#22c55e]/10 px-4 py-3 text-[13px] font-medium text-[#22c55e]">
          {notification}
        </div>
      ) : null}

      {error ? <div className="text-sm text-red-500">Failed to load CMS blocks.</div> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {keys.map((keyName) => {
          const item = local[keyName] ?? { contentHtml: "", isActive: true, sortOrder: 0 };
          return (
            <div key={keyName} className="glass p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold capitalize">{keyName}</div>
                <label className="flex items-center gap-2 text-[11px] font-bold tracking-wide text-slate-500 dark:text-[#94a3b8] uppercase">
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
                  className="rounded-xl border border-white/10 bg-[#020617] px-4 py-2 text-sm outline-none transition focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e] border-white/5 bg-[#020617]"
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
                className="mt-4 rounded-xl bg-gradient-to-br from-brand-teal to-brand-green px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:opacity-95"
              >
                Save
              </button>
            </div>
          );
        })}
      </div>

      <div className="text-[11px] font-bold tracking-wide text-slate-500 dark:text-[#94a3b8] uppercase">
        Tip: Format text directly using the rich-text editor. Changes apply instantly to the public website.
      </div>
    </div>
  );
}

