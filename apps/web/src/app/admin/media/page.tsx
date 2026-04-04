"use client";

import { useMemo, useState } from "react";
import useSWR, { mutate as globalMutate } from "swr";

import { API_BASE_URL, apiFetch } from "../../../lib/api";

type MediaAsset = {
  _id: string;
  originalName: string;
  mimeType: string;
  size: number;
  storageUrl: string;
  thumbnailUrl?: string;
  type?: "image" | "document";
};

async function uploadMedia(file: File) {
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch(`${API_BASE_URL}/api/admin/media/upload`, {
    method: "POST",
    credentials: "include",
    body: fd,
  });
  const text = await res.text().catch(() => "");
  if (!res.ok) throw new Error(text || res.statusText);
  return text ? JSON.parse(text) : null;
}

async function deleteMedia(id: string) {
  const res = await fetch(`${API_BASE_URL}/api/admin/media/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  const text = await res.text().catch(() => "");
  if (!res.ok) throw new Error(text || res.statusText);
  return text ? JSON.parse(text) : null;
}

export default function AdminMediaPage() {
  const [type, setType] = useState<"image" | "document" | "all">("image");
  const [page, setPage] = useState(1);
  const limit = 20;
  const [notification, setNotification] = useState<string | null>(null);

  const query = type === "all" ? "" : `&type=${encodeURIComponent(type)}`;
  const swrKey = `/api/admin/media?page=${page}&limit=${limit}${query}`;
  const { data, error } = useSWR<{ items: MediaAsset[]; total: number; page: number; limit: number }>(swrKey, () =>
    apiFetch<{ items: MediaAsset[]; total: number; page: number; limit: number }>(swrKey),
  );

  const items = useMemo(() => data?.items ?? [], [data]);
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="text-[12px] font-bold tracking-wider text-slate-400 dark:text-[#94a3b8] uppercase">Media</div>
        <h2 className="text-[20px] font-bold tracking-tight">Upload & manage assets</h2>
      </div>

      {notification ? (
        <div className="rounded-xl border border-[#22c55e]/20 bg-[#22c55e]/10 px-4 py-3 text-[13px] font-medium text-[#22c55e]">
          {notification}
        </div>
      ) : null}

      {error ? <div className="text-sm text-red-500">Failed to load media.</div> : null}

      <div className="glass p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-sm text-white">
            <span className="text-[11px] font-bold tracking-wide text-slate-500 dark:text-[#94a3b8] uppercase">Type</span>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value as any);
                setPage(1);
              }}
              className="rounded-xl border border-white/10 bg-[#020617] px-3 py-2 text-sm outline-none border-white/5 bg-[#020617]"
            >
              <option value="image">Images</option>
              <option value="document">Documents</option>
              <option value="all">All</option>
            </select>
          </label>

          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#0f172a] px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white/80 border-white/5 bg-[rgba(255,255,255,0.02)] dark:text-slate-200">
              Upload
              <input
                type="file"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  void (async () => {
                    setNotification(null);
                    try {
                      await uploadMedia(f);
                      setNotification("Upload complete.");
                      await globalMutate(swrKey);
                    } catch (err: any) {
                      setNotification(err?.message ?? "Upload failed.");
                    }
                  })();
                }}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((m) => (
          <div key={m._id} className="glass p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-semibold text-[#94a3b8]">
                {m.type ?? "file"}
              </div>
              <button
                type="button"
                className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-3 py-1.5 text-[12px] font-semibold text-red-500 transition-all hover:bg-red-100 dark:hover:bg-red-500/20"
                onClick={async () => {
                  if (!confirm(`Delete "${m.originalName}"?`)) return;
                  try {
                    await deleteMedia(m._id);
                    setNotification("Media deleted.");
                    await globalMutate(swrKey);
                  } catch (e: any) {
                    setNotification(e?.message ?? "Delete failed.");
                  }
                }}
              >
                Delete
              </button>
            </div>

            <div className="mt-3 flex items-center justify-center">
              {m.type === "image" ? (
                <img src={m.storageUrl} alt={m.originalName} className="max-h-44 w-full object-contain" />
              ) : (
                <div className="rounded-xl border border-white/10 bg-[#0f172a] px-4 py-10 text-center text-xs text-slate-600 border-white/5 bg-[rgba(255,255,255,0.02)] dark:text-slate-300">
                  Document
                </div>
              )}
            </div>

            <div className="mt-3 text-sm font-semibold">{m.originalName}</div>
            <div className="mt-1 text-[11px] font-bold tracking-wide text-slate-500 dark:text-[#94a3b8] uppercase">{m.mimeType}</div>

            <div className="mt-3">
              <button
                type="button"
                className="w-full rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-black dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(m.storageUrl);
                    setNotification("URL copied to clipboard.");
                  } catch {
                    setNotification("Copy failed (browser permissions).");
                  }
                }}
              >
                Copy URL
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 ? (
          <div className="col-span-full text-sm text-[#94a3b8]">No media found.</div>
        ) : null}
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
            className="rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-50 border-white/5 bg-[rgba(255,255,255,0.02)] dark:text-slate-200"
          >
            Prev
          </button>
          <button
            type="button"
            disabled={page >= pages}
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            className="rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-50 border-white/5 bg-[rgba(255,255,255,0.02)] dark:text-slate-200"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

