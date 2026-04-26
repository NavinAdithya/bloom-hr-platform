import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import { Navbar } from "../components/navbar";
import { Linkedin } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SK Bloom HR Solutions",
  description: "A growing HR & compliance partner trusted by early-stage and established businesses.",
  icons: {
    icon: [
      { url: "/sk-bloom-logo.png", type: "image/png" },
    ],
    apple: "/sk-bloom-logo.png",
    shortcut: "/sk-bloom-logo.png",
  },
  openGraph: {
    title: "SK Bloom HR Solutions",
    description: "A growing HR & compliance partner trusted by early-stage and established businesses.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SK Bloom HR Solutions",
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
            <Navbar />

            {/* ── Main (padded for fixed navbar) ── */}
            <main className="flex-1 pt-16">{children}</main>

            {/* ── Footer ── */}
            <footer className="border-t border-black/5 dark:border-white/5 mt-20">
              <div className="container-fluid py-10 text-[13px] text-slate-500 dark:text-[#94a3b8]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8">
                    <span>&copy; {new Date().getFullYear()} SK Bloom HR Solutions. All rights reserved.</span>
                    <a href="https://www.linkedin.com/company/sk-bloom-hr-solutionsenterprise/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-medium transition-colors hover:text-[#22c55e]">
                      <Linkedin size={16} /> 
                      <span>SK Bloom HR Solutions</span>
                    </a>
                  </div>
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
