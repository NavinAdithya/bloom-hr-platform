import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import { Leaf } from "lucide-react";
import { Providers } from "./providers";
import { ThemeToggle } from "../components/theme-toggle";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bloom HR Solutions",
  description: "A growing HR & compliance partner trusted by early-stage and established businesses.",
  openGraph: {
    title: "Bloom HR Solutions",
    description: "A growing HR & compliance partner trusted by early-stage and established businesses.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bloom HR Solutions",
    description: "A growing HR & compliance partner trusted by early-stage and established businesses.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <body className={`${inter.className} bg-slate-50 text-slate-900 dark:bg-[#020617] dark:text-white`}>
        <Providers>
          <div className="min-h-dvh flex flex-col">
            {/* ── Navbar ── */}
            <header className="sticky top-0 z-50 border-b border-black/5 dark:border-white/5 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-lg transition-all">
              <div className="container-fluid flex h-16 items-center justify-between gap-4">
                <Link href="/" className="flex items-center gap-3 transition-transform hover:scale-[1.02]">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#22c55e] to-emerald-400 shadow-[0_0_16px_rgba(34,197,94,0.25)]">
                    <Leaf strokeWidth={2.5} className="h-[18px] w-[18px] text-white" />
                  </div>
                  <div className="leading-tight">
                    <div className="text-[15px] font-bold tracking-tight">Bloom HR</div>
                    <div className="text-[10px] font-semibold tracking-wider text-slate-500 dark:text-[#94a3b8] uppercase">Corporate Solutions</div>
                  </div>
                </Link>

                <nav className="hidden items-center gap-7 md:flex">
                  {[
                    { label: "Services", href: "/#services" },
                    { label: "About", href: "/#about" },
                    { label: "Clients", href: "/#clients" },
                    { label: "Contact", href: "/#contact" },
                  ].map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-[13px] font-medium text-slate-500 dark:text-[#94a3b8] transition-colors hover:text-slate-900 dark:hover:text-white"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>

                <div className="flex items-center gap-3">
                  <ThemeToggle />
                  <Link
                    href="/admin"
                    className="hidden sm:inline-flex rounded-full border border-black/10 dark:border-white/10 bg-slate-900 dark:bg-white/5 px-4 py-1.5 text-[13px] font-semibold text-white transition hover:bg-slate-800 dark:hover:bg-white/10"
                  >
                    Admin
                  </Link>
                </div>
              </div>
            </header>

            {/* ── Main ── */}
            <main className="flex-1">{children}</main>

            {/* ── Footer ── */}
            <footer className="border-t border-black/5 dark:border-white/5 mt-20">
              <div className="container-fluid py-10 text-[13px] text-slate-500 dark:text-[#94a3b8]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>&copy; {new Date().getFullYear()} Bloom HR Solutions. All rights reserved.</div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/20">Trusted. Compliant. Growing.</div>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
