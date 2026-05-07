"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "./theme-toggle";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Services", href: "/#services", section: "services" },
  { label: "About", href: "/#about", section: "about" },
  { label: "Clients", href: "/#clients", section: "clients" },
  { label: "Contact", href: "/#contact", section: "contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastY, setLastY] = useState(0);
  const [activeSection, setActiveSection] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setScrolled(currentY > 20);
      setVisible(currentY < lastY || currentY < 80);
      setLastY(currentY);

      // Active section detection
      const sections = ["services", "about", "clients", "contact"];
      for (const id of [...sections].reverse()) {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 120) {
          setActiveSection(id);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastY]);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMobileOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${
        visible ? "translate-y-0" : "-translate-y-full"
      } ${
        scrolled
          ? "border-b border-[#22c55e]/20 bg-white/90 dark:border-[#22c55e]/20 dark:bg-[#020617]/90 backdrop-blur-xl shadow-[0_4px_30px_rgba(34,197,94,0.1)] dark:shadow-[0_4px_30px_rgba(34,197,94,0.15)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="container-fluid flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group transition-transform duration-300 hover:scale-[1.02]"
        >
          <div className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white ring-2 ring-[#22c55e]/30 transition-all duration-300 group-hover:ring-[#22c55e]/70 group-hover:shadow-[0_0_16px_rgba(34,197,94,0.35)]">
            <Image
              src="/sk-bloom-logo.png"
              alt="SK Bloom HR Solutions Logo"
              width={40}
              height={40}
              className="h-10 w-10 object-cover"
              priority
            />
          </div>
          <div className="leading-tight">
            <div className="text-[15px] font-bold tracking-tight text-slate-900 dark:text-white transition-colors group-hover:text-[#22c55e]">
              SK Bloom HR Solutions
            </div>
            <div className="text-[9.5px] font-semibold tracking-[0.12em] text-slate-500 dark:text-[#94a3b8] uppercase">
              Corporate Solutions
            </div>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              style={{ animationDelay: `${i * 60}ms` }}
              className={`relative text-[13px] font-medium transition-colors duration-200 group ${
                activeSection === link.section
                  ? "text-[#22c55e] font-semibold"
                  : "text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {link.label}
              <span className={`absolute -bottom-0.5 left-0 h-[1.5px] rounded-full bg-[#22c55e] transition-all duration-300 ${
                activeSection === link.section ? "w-full" : "w-0 group-hover:w-full"
              }`} />
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/#contact"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#22c55e] to-emerald-500 px-4 py-1.5 text-[13px] font-semibold text-white btn-neon btn-ripple"
          >
            Get in Touch
          </Link>
          {/* Mobile Hamburger */}
          <button
            id="mobile-menu-toggle"
            aria-label="Toggle mobile menu"
            onClick={() => setMobileOpen((o) => !o)}
            className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-all hover:border-[#22c55e]/40 hover:text-[#22c55e] dark:border-white/10 dark:bg-white/5 dark:text-white"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#22c55e]/20 bg-white/95 dark:bg-[#020617]/95 backdrop-blur-xl">
          <nav className="container-fluid flex flex-col gap-1 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 rounded-xl px-4 py-3 text-[14px] font-medium transition-all ${
                  activeSection === link.section
                    ? "bg-[#22c55e]/10 text-[#22c55e] font-semibold"
                    : "text-slate-700 dark:text-[#94a3b8] hover:bg-slate-100 dark:hover:bg-white/5 hover:text-[#22c55e]"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/#contact"
              onClick={() => setMobileOpen(false)}
              className="mt-2 flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#22c55e] to-emerald-500 px-4 py-2.5 text-[14px] font-semibold text-white btn-neon"
            >
              Get in Touch
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

