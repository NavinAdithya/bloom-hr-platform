"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2 } from "lucide-react";

import { API_BASE_URL } from "../../../lib/api";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(200),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    setServerError(null);
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      setServerError(text || "Login failed");
      return;
    }
    router.replace("/admin");
  }

  const inputCls =
    "w-full rounded-xl border border-black/10 dark:border-white/10 bg-slate-50 dark:bg-[#020617] px-4 py-3 text-[14px] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 outline-none transition-all focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]";

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-white dark:bg-[#0f172a] p-8 sm:p-10 shadow-lg dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#22c55e]/10 text-[#22c55e] mb-6 mx-auto">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="text-[22px] font-bold tracking-tight text-center">Admin Login</div>
          <div className="mt-2 text-[13px] text-slate-500 dark:text-[#94a3b8] text-center">
            Sign in to the SK HR Solutions CMS.
          </div>

          <form className="mt-8 flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold tracking-wide text-slate-500 dark:text-[#94a3b8] uppercase">Email</span>
              <input {...register("email")} className={inputCls} placeholder="admin@company.com" disabled={isSubmitting} />
              {errors.email ? <span className="text-[12px] text-red-500">{errors.email.message}</span> : null}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold tracking-wide text-slate-500 dark:text-[#94a3b8] uppercase">Password</span>
              <input type="password" {...register("password")} className={inputCls} placeholder="••••••••" disabled={isSubmitting} />
              {errors.password ? <span className="text-[12px] text-red-500">{errors.password.message}</span> : null}
            </label>

            {serverError ? (
              <div className="rounded-xl border border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-[13px] text-red-600 dark:text-red-400 text-center">
                {serverError}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#22c55e] to-emerald-400 px-5 py-3.5 text-[13px] font-bold text-white dark:text-[#020617] shadow-sm transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(34,197,94,0.2)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-[11px] text-slate-400 dark:text-[#94a3b8]/50">
            Access restricted to authorized personnel.
          </div>
        </div>
      </div>
    </div>
  );
}
