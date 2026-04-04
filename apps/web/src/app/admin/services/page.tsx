"use client";

import { useMemo, useState } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { API_BASE_URL, apiFetch } from "../../../lib/api";

type Service = {
  _id: string;
  title: string;
  description?: string;
  iconUrl?: string;
  category?: string;
  sortOrder?: number;
  isActive?: boolean;
};

const serviceSchema = z.object({
  title: z.string().min(1).max(140),
  description: z.string().max(2000).optional().or(z.literal("")),
  iconUrl: z.string().max(2000).optional().or(z.literal("")),
  category: z.string().max(200).optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().default(true),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

async function adminJson(path: string, init: RequestInit) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text().catch(() => "");
  if (!res.ok) throw new Error(text || res.statusText);
  return text ? JSON.parse(text) : null;
}

export default function AdminServicesPage() {
  const swrKey = "/api/admin/services?includeInactive=true";
  const { data, error } = useSWR<{ items: Service[] }>(swrKey, () => apiFetch<{ items: Service[] }>(swrKey));
  const services = useMemo(() => data?.items ?? [], [data]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      title: "",
      description: "",
      iconUrl: "",
      category: "",
      sortOrder: 0,
      isActive: true,
    },
  });

  const iconUrl = watch("iconUrl");

  function startEdit(item: Service) {
    setEditingId(item._id);
    reset({
      title: item.title ?? "",
      description: item.description ?? "",
      iconUrl: item.iconUrl ?? "",
      category: item.category ?? "",
      sortOrder: item.sortOrder ?? 0,
      isActive: item.isActive ?? true,
    });
  }

  async function onSubmit(values: ServiceFormValues) {
    const payload = {
      ...values,
      description: values.description?.trim() ? values.description.trim() : undefined,
      iconUrl: values.iconUrl?.trim() ? values.iconUrl.trim() : undefined,
      category: values.category?.trim() ? values.category.trim() : undefined,
      sortOrder: values.sortOrder ?? 0,
    };

    try {
      setNotification(null);
      if (editingId) {
        await adminJson(`/api/admin/services/${editingId}`, { method: "PUT", body: JSON.stringify(payload) });
        setNotification("Service updated.");
      } else {
        await adminJson(`/api/admin/services`, { method: "POST", body: JSON.stringify(payload) });
        setNotification("Service created.");
      }

      setEditingId(null);
      reset({
        title: "",
        description: "",
        iconUrl: "",
        category: "",
        sortOrder: 0,
        isActive: true,
      });

      await globalMutate(swrKey);
    } catch (err: any) {
      setNotification(err?.message ?? "Failed to save service.");
    }
  }

  async function uploadIcon(file: File) {
    setUploading(true);
    setNotification(null);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch(`${API_BASE_URL}/api/admin/media/upload`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const text = await res.text().catch(() => "");
      if (!res.ok) throw new Error(text || res.statusText);
      const json = JSON.parse(text);
      const url = json?.item?.storageUrl;
      if (!url) throw new Error("Upload succeeded but no URL returned.");
      setValue("iconUrl", url, { shouldDirty: true });
      setNotification("Icon uploaded.");
    } catch (e: any) {
      setNotification(e?.message ?? "Icon upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="text-[12px] font-bold tracking-wider text-slate-400 dark:text-[#94a3b8] uppercase">Services</div>
        <h2 className="text-[20px] font-bold tracking-tight">Manage service cards</h2>
      </div>

      {notification ? (
        <div className="rounded-xl border border-[#22c55e]/20 bg-[#22c55e]/10 px-4 py-3 text-[13px] font-medium text-[#22c55e]">
          {notification}
        </div>
      ) : null}

      {error ? <div className="text-sm text-red-500">Failed to load services.</div> : null}

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold tracking-wide text-slate-500 dark:text-[#94a3b8] uppercase">Title</span>
            <input
              {...register("title")}
              className="rounded-xl border border-black/10 dark:border-white/10 bg-slate-50 dark:bg-[#020617] px-4 py-3 text-[14px] text-slate-900 dark:text-white outline-none transition-all focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]"
              placeholder="GST Registration"
            />
            {errors.title ? <span className="text-xs text-red-500">{errors.title.message}</span> : null}
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold tracking-wide text-slate-500 dark:text-[#94a3b8] uppercase">Category</span>
            <input
              {...register("category")}
              className="rounded-xl border border-black/10 dark:border-white/10 bg-slate-50 dark:bg-[#020617] px-4 py-3 text-[14px] text-slate-900 dark:text-white outline-none transition-all focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]"
              placeholder="GST"
            />
          </label>

          <label className="flex items-center gap-3 rounded-xl border border-black/10 dark:border-white/10 bg-slate-50 dark:bg-[#020617] px-4 py-3 text-[14px]">
            <input type="checkbox" {...register("isActive")} />
            <span className="text-slate-800 dark:text-white">Active</span>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold tracking-wide text-slate-500 dark:text-[#94a3b8] uppercase">Sort order</span>
            <input
              type="number"
              {...register("sortOrder")}
              className="rounded-xl border border-black/10 dark:border-white/10 bg-slate-50 dark:bg-[#020617] px-4 py-3 text-[14px] text-slate-900 dark:text-white outline-none transition-all focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]"
            />
          </label>
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold tracking-wide text-slate-500 dark:text-[#94a3b8] uppercase">Description</span>
            <textarea
              {...register("description")}
              rows={4}
              className="resize-none rounded-xl border border-black/10 dark:border-white/10 bg-slate-50 dark:bg-[#020617] px-4 py-3 text-[14px] text-slate-900 dark:text-white outline-none transition-all focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]"
              placeholder="Short description for the card..."
            />
            {errors.description ? (
              <span className="text-xs text-red-500">{errors.description.message}</span>
            ) : null}
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold tracking-wide text-slate-500 dark:text-[#94a3b8] uppercase">Icon URL</span>
            <input
              {...register("iconUrl")}
              className="rounded-xl border border-black/10 dark:border-white/10 bg-slate-50 dark:bg-[#020617] px-4 py-3 text-[14px] text-slate-900 dark:text-white outline-none transition-all focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]"
              placeholder="https://.../icon.png"
            />
          </label>

          <label className="flex flex-col gap-2 rounded-xl border border-black/10 dark:border-white/10 bg-slate-50 dark:bg-[#020617] p-4 text-[14px]">
            <span className="text-[11px] font-bold tracking-wide text-slate-500 dark:text-[#94a3b8] uppercase">Upload icon (optional)</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadIcon(f);
              }}
              disabled={uploading}
            />
            {iconUrl ? (
              <img src={iconUrl} alt="Service icon preview" className="h-10 w-10 object-contain" />
            ) : null}
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-gradient-to-r from-[#22c55e] to-emerald-400 px-5 py-3 text-[13px] font-bold text-white dark:text-[#020617] shadow-sm transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(34,197,94,0.2)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {editingId ? "Update Service" : "Create Service"}
          </button>

          {editingId ? (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                reset({
                  title: "",
                  description: "",
                  iconUrl: "",
                  category: "",
                  sortOrder: 0,
                  isActive: true,
                });
              }}
              className="rounded-xl border border-black/10 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-5 py-3 text-[13px] font-semibold transition hover:bg-slate-200 dark:hover:bg-white/10"
            >
              Cancel edit
            </button>
          ) : null}
        </div>
      </form>

      <div className="overflow-auto rounded-2xl border border-black/5 dark:border-white/5 bg-white dark:bg-[#0f172a]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/5 dark:border-white/5 bg-slate-50 dark:bg-[#0f172a]/50">
            <tr>
              <th className="px-4 py-3 font-semibold">Title</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Active</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s._id} className="border-b border-black/5 dark:border-white/5">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {s.iconUrl ? <img src={s.iconUrl} alt="" className="h-8 w-8 object-contain" /> : null}
                    <div className="font-semibold">{s.title}</div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-500 dark:text-[#94a3b8]">{s.category ?? "-"}</td>
                <td className="px-4 py-3">{s.isActive ? "Yes" : "No"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded-xl border border-black/10 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 py-1.5 text-[12px] font-semibold transition-all hover:bg-slate-200 dark:hover:bg-white/10"
                      onClick={() => startEdit(s)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-3 py-1.5 text-[12px] font-semibold text-red-500 transition-all hover:bg-red-100 dark:hover:bg-red-500/20"
                      onClick={async () => {
                        if (!confirm(`Delete "${s.title}"?`)) return;
                        try {
                          await fetch(`${API_BASE_URL}/api/admin/services/${s._id}`, {
                            method: "DELETE",
                            credentials: "include",
                          });
                          await globalMutate(swrKey);
                          setNotification("Service deleted.");
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
            {services.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-sm text-[#94a3b8]" colSpan={4}>
                  No services found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

