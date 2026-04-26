"use client";

import { useMemo, useState } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { API_BASE_URL, apiFetch } from "../../../lib/api";

type Testimonial = {
  _id: string;
  name: string;
  feedback: string;
  rating: number;
  sortOrder?: number;
  isActive?: boolean;
};

const testimonialSchema = z.object({
  name: z.string().min(1).max(200),
  feedback: z.string().min(1).max(5000),
  rating: z.coerce.number().int().min(1).max(5),
  sortOrder: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().default(true),
});

type TestimonialFormValues = z.infer<typeof testimonialSchema>;

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

export default function AdminTestimonialsPage() {
  const swrKey = "/api/admin/testimonials?includeInactive=true";
  const { data, error, isLoading } = useSWR<{ items: Testimonial[] }>(swrKey, () => apiFetch<{ items: Testimonial[] }>(swrKey));
  const testimonials = useMemo(() => data?.items ?? [], [data]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TestimonialFormValues>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: {
      name: "",
      feedback: "",
      rating: 5,
      sortOrder: 0,
      isActive: true,
    },
  });

  function startEdit(item: Testimonial) {
    setEditingId(item._id);
    reset({
      name: item.name ?? "",
      feedback: item.feedback ?? "",
      rating: item.rating ?? 5,
      sortOrder: item.sortOrder ?? 0,
      isActive: item.isActive ?? true,
    });
  }

  async function onSubmit(values: TestimonialFormValues) {
    try {
      setNotification(null);
      const payload = {
        ...values,
        sortOrder: values.sortOrder ?? 0,
      };

      if (editingId) {
        await adminJson(`/api/admin/testimonials/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setNotification("Testimonial updated.");
      } else {
        await adminJson(`/api/admin/testimonials`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setNotification("Testimonial created.");
      }

      setEditingId(null);
      reset({
        name: "",
        feedback: "",
        rating: 5,
        sortOrder: 0,
        isActive: true,
      });

      await globalMutate(swrKey);
    } catch (err: any) {
      setNotification(err?.message ?? "Failed to save testimonial.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="text-[12px] font-bold tracking-wider text-slate-400 dark:text-[#94a3b8] uppercase">Testimonials</div>
        <h2 className="text-[20px] font-bold tracking-tight">Manage customer feedback</h2>
      </div>

      {notification ? (
        <div className="rounded-xl border border-[#22c55e]/20 bg-[#22c55e]/10 px-4 py-3 text-[13px] font-medium text-[#22c55e]">
          {notification}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] font-medium text-red-400">
          <div className="font-bold">Failed to load testimonials</div>
          <div className="mt-1 text-[12px] opacity-80">{error?.message ?? "Unknown error — check your session or API connection."}</div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold tracking-wide text-slate-500 dark:text-[#94a3b8] uppercase">Name</span>
            <input
              {...register("name")}
              className="rounded-xl border border-black/10 dark:border-white/10 bg-slate-50 dark:bg-[#020617] px-4 py-3 text-[14px] text-slate-900 dark:text-white outline-none transition-all focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]"
              placeholder="Client name"
            />
            {errors.name ? <span className="text-xs text-red-500">{errors.name.message}</span> : null}
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold tracking-wide text-slate-500 dark:text-[#94a3b8] uppercase">Rating (1-5)</span>
            <input
              type="number"
              {...register("rating")}
              className="rounded-xl border border-black/10 dark:border-white/10 bg-slate-50 dark:bg-[#020617] px-4 py-3 text-[14px] text-slate-900 dark:text-white outline-none transition-all focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]"
            />
            {errors.rating ? (
              <span className="text-xs text-red-500">{errors.rating.message}</span>
            ) : null}
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
            <span className="text-[11px] font-bold tracking-wide text-slate-500 dark:text-[#94a3b8] uppercase">Feedback</span>
            <textarea
              {...register("feedback")}
              rows={6}
              className="resize-none rounded-xl border border-black/10 dark:border-white/10 bg-slate-50 dark:bg-[#020617] px-4 py-3 text-[14px] text-slate-900 dark:text-white outline-none transition-all focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]"
              placeholder="What was the outcome?"
            />
            {errors.feedback ? (
              <span className="text-xs text-red-500">{errors.feedback.message}</span>
            ) : null}
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-gradient-to-r from-[#22c55e] to-emerald-400 px-5 py-3 text-[13px] font-bold text-white dark:text-[#020617] shadow-sm transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(34,197,94,0.2)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {editingId ? "Update Testimonial" : "Create Testimonial"}
          </button>

          {editingId ? (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                reset({
                  name: "",
                  feedback: "",
                  rating: 5,
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
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Rating</th>
              <th className="px-4 py-3 font-semibold">Active</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6">
                  <div className="flex flex-col gap-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="skeleton h-8 w-full rounded-xl" />
                    ))}
                  </div>
                </td>
              </tr>
            ) : testimonials.map((t) => (
              <tr key={t._id} className="border-b border-black/5 dark:border-white/5">
                <td className="px-4 py-3 font-semibold">{t.name}</td>
                <td className="px-4 py-3">{t.rating}</td>
                <td className="px-4 py-3">{t.isActive ? "Yes" : "No"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded-xl border border-black/10 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 py-1.5 text-[12px] font-semibold transition-all hover:bg-slate-200 dark:hover:bg-white/10"
                      onClick={() => startEdit(t)}
                    >
                      Edit
                    </button>
                    {confirmDeleteId === t._id ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="rounded-xl bg-red-500 px-3 py-1.5 text-[12px] font-bold text-white transition-all hover:bg-red-600"
                          onClick={async () => {
                            try {
                              await adminJson(`/api/admin/testimonials/${t._id}`, { method: "DELETE" });
                              await globalMutate(swrKey);
                              setNotification("Testimonial deleted.");
                              setConfirmDeleteId(null);
                            } catch (e: any) {
                              setNotification(e?.message ?? "Delete failed.");
                            }
                          }}
                        >
                          Yes, Delete
                        </button>
                        <button
                          type="button"
                          className="rounded-xl border border-black/10 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 py-1.5 text-[12px] font-semibold transition-all hover:bg-slate-200 dark:hover:bg-white/10"
                          onClick={() => setConfirmDeleteId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-3 py-1.5 text-[12px] font-semibold text-red-500 transition-all hover:bg-red-100 dark:hover:bg-red-500/20"
                        onClick={() => setConfirmDeleteId(t._id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {testimonials.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-sm text-[#94a3b8]">
                  No testimonials found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

