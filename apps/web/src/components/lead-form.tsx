"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { API_BASE_URL } from "../lib/api";

const leadSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().max(40, "Phone is too long").optional().or(z.literal("")),
  message: z.string().min(1, "Message is required").max(4000),
});

type LeadFormValues = z.infer<typeof leadSchema>;

export function LeadForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: { name: "", email: "", phone: "", message: "" },
  });

  async function onSubmit(values: LeadFormValues) {
    setServerError(null);
    setSuccess(false);
    const payload = {
      ...values,
      email: values.email?.trim() ? values.email.trim() : undefined,
      phone: values.phone?.trim() ? values.phone.trim() : undefined,
    };
    const res = await fetch(`${API_BASE_URL}/api/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      setServerError(text || "Failed to submit. Please try again.");
      return;
    }
    setSuccess(true);
    reset();
  }

  const inputCls =
    "w-full rounded-xl border border-black/10 dark:border-white/10 bg-slate-50 dark:bg-[#020617] px-4 py-3 text-[14px] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 outline-none transition-all focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e] hover:border-black/20 dark:hover:border-white/20";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold tracking-wide text-slate-500 dark:text-[#94a3b8] uppercase">Name</span>
          <input {...register("name")} className={inputCls} placeholder="Your name" disabled={isSubmitting} />
          {errors.name ? <span className="text-[12px] text-red-500">{errors.name.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold tracking-wide text-slate-500 dark:text-[#94a3b8] uppercase">Email (optional)</span>
          <input {...register("email")} className={inputCls} placeholder="name@company.com" disabled={isSubmitting} />
          {errors.email ? <span className="text-[12px] text-red-500">{errors.email.message}</span> : null}
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-bold tracking-wide text-slate-500 dark:text-[#94a3b8] uppercase">Phone (optional)</span>
        <input {...register("phone")} className={inputCls} placeholder="+91 ..." disabled={isSubmitting} />
        {errors.phone ? <span className="text-[12px] text-red-500">{errors.phone.message}</span> : null}
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-bold tracking-wide text-slate-500 dark:text-[#94a3b8] uppercase">Message</span>
        <textarea {...register("message")} rows={4} className={`${inputCls} resize-none`} placeholder="Tell us what you need help with..." disabled={isSubmitting} />
        {errors.message ? <span className="text-[12px] text-red-500">{errors.message.message}</span> : null}
      </label>

      {serverError ? (
        <div className="rounded-xl border border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-[13px] text-red-600 dark:text-red-400">{serverError}</div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-[#22c55e]/20 bg-[#22c55e]/10 px-4 py-3 text-[13px] font-medium text-[#22c55e]">
          Thanks! Your inquiry has been submitted. We&apos;ll get back to you soon.
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#22c55e] to-emerald-400 px-5 py-3.5 text-[13px] font-bold text-white dark:text-[#020617] shadow-sm transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(34,197,94,0.2)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit inquiry"
        )}
      </button>
    </form>
  );
}
