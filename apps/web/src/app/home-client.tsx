"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import useSWR, { mutate } from "swr";
import {
  motion,
  useScroll, useTransform, useMotionValue, useSpring,
  MotionValue,
} from "framer-motion";
import {
  Shield, Zap, Eye, Search, PenTool, Settings, BarChart3,
  Building2, Users, Briefcase, Phone, Mail, MapPin,
  HeartHandshake, ChevronRight, Quote,
} from "lucide-react";

import { getSocket }   from "./../lib/socket";
import { API_BASE_URL, apiFetch } from "./../lib/api";
import { LeadForm }    from "../components/lead-form";
import type { Client, ContentBlock, Service, Testimonial } from "./page";

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
function toSortedActive<T extends { sortOrder?: number; isActive?: boolean }>(items: T[]) {
  return items
    .filter((x) => (x.isActive ?? true) === true)
    .slice()
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
}
const CMS_KEYS = "contactHeading,contactSubheading,contactPhone,contactEmail,contactAddress,sectionVisible_services,sectionVisible_process,sectionVisible_about,sectionVisible_clients,sectionVisible_testimonials,sectionVisible_contact";
const EASE_OUT   = [0.25, 0.1, 0.25, 1]  as const;
const EASE_EXPO  = [0.16, 1,   0.3,  1]  as const;

/* ─────────────────────────────────────────────
   Animation variants
───────────────────────────────────────────── */
const stagger = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const fadeUp = {
  hidden:  { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE_OUT } },
};
const fadeIn = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};
const slideL = {
  hidden:  { opacity: 0, x: -36 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.65, ease: EASE_OUT } },
};
const slideR = {
  hidden:  { opacity: 0, x: 36 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.65, ease: EASE_OUT } },
};
const popIn = {
  hidden:  { opacity: 0, scale: 0.88, y: 20 },
  visible: { opacity: 1, scale: 1,    y: 0,  transition: { duration: 0.5, ease: EASE_OUT } },
};

/* ─────────────────────────────────────────────
   Magnetic button
───────────────────────────────────────────── */
function MagneticButton({
  children, className = "", href,
}: { children: React.ReactNode; className?: string; href?: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const handleMouse = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current!.getBoundingClientRect();
    setPos({ x: (clientX - (left + width / 2)) * 0.14, y: (clientY - (top + height / 2)) * 0.14 });
  };
  return (
    <motion.a
      href={href} ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={() => setPos({ x: 0, y: 0 })}
      animate={pos}
      transition={{ type: "spring", stiffness: 160, damping: 16, mass: 0.1 }}
      className={className}
    >
      {children}
    </motion.a>
  );
}

/* ─────────────────────────────────────────────
   Mask reveal (Awwwards-style)
───────────────────────────────────────────── */
function MaskReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <span className="block overflow-hidden pb-1 -mb-1">
      <motion.span
        initial={{ y: "108%", rotate: 1.8 }}
        animate={{ y: "0%",   rotate: 0 }}
        transition={{ duration: 1.2, delay, ease: EASE_EXPO }}
        className="block origin-top-left"
      >
        {children}
      </motion.span>
    </span>
  );
}

/* ─────────────────────────────────────────────
   Global gradient mesh background (Light + Dark aware)
───────────────────────────────────────────── */
function GradientMesh() {
  return (
    <div className="fixed inset-0 -z-20 pointer-events-none overflow-hidden">
      <div className="mesh-orb-a absolute -top-1/3 right-0 w-[55vw] h-[55vw] max-w-[800px] max-h-[800px] rounded-full bg-[#22c55e]/10 dark:bg-[#22c55e]/5 blur-[120px] dark:blur-[150px]" />
      <div className="mesh-orb-b absolute -bottom-1/4 -left-1/4 w-[50vw] h-[50vw] max-w-[700px] max-h-[700px] rounded-full bg-emerald-600/10 dark:bg-emerald-600/5 blur-[140px] dark:blur-[160px]" />
      <div className="mesh-orb-c absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] rounded-full bg-green-400/10 dark:bg-[#22c55e]/5 blur-[150px] dark:blur-[180px]" />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Scroll progress bar
───────────────────────────────────────────── */
function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      className="scroll-progress shadow-[0_0_12px_rgba(34,197,94,0.5)]"
      style={{ scaleX: scrollYProgress, width: "100%" }}
    />
  );
}

/* ─────────────────────────────────────────────
   Hero 3D Tilt Grid (Replaces old canvas)
───────────────────────────────────────────── */
function Hero3DGrid() {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["12deg", "-12deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-12deg", "12deg"]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };
  const handleMouseLeave = () => { x.set(0); y.set(0); };

  const cards = [
    { label: "Coverage", value: "HR + Compliance" },
    { label: "Approach", value: "Data-driven" },
    { label: "Response", value: "Fast & clear" },
    { label: "Outcome",  value: "Audit-ready" },
  ];

  return (
    <div style={{ perspective: "1500px" }} className="w-full h-full flex items-center justify-center p-4">
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative grid grid-cols-2 gap-4 w-full max-w-md rounded-3xl border border-slate-200/60 bg-white/70 p-6 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-[#0b1628]/70 dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] transition-shadow duration-500 hover:shadow-2xl dark:hover:shadow-[0_30px_80px_rgba(34,197,94,0.15)]"
      >
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 pointer-events-none" />
        
        {cards.map((card, i) => (
          <motion.div
            key={i}
            style={{ transformStyle: "preserve-3d" }}
            whileHover={{ translateZ: 40, transition: { duration: 0.2, ease: "easeOut" } }}
            className="group relative flex flex-col justify-center rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-colors hover:border-[#22c55e]/30 dark:border-white/5 dark:bg-[#0f172a] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] dark:hover:border-[#22c55e]/20"
          >
            {/* Magnetic Glow Background layer */}
            <div className="absolute inset-0 rounded-2xl opacity-0 bg-gradient-to-br from-[#22c55e]/5 to-transparent transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
            
            <motion.div 
              style={{ translateZ: 20 }}
              className="text-[10px] font-bold tracking-widest text-slate-400 uppercase transition-colors group-hover:text-slate-500 dark:text-[#64748b] dark:group-hover:text-[#94a3b8]"
            >
              {card.label}
            </motion.div>
            
            <motion.div 
              style={{ translateZ: 30 }}
              className="mt-2 text-[14px] font-extrabold text-slate-800 transition-colors group-hover:text-[#22c55e] dark:text-white dark:group-hover:text-[#22c55e]"
            >
              {card.value}
            </motion.div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SERVICE CARD — scroll-driven Z-depth
───────────────────────────────────────────── */
function ServiceCard3D({
  s, index, total, scrollYProgress,
}: {
  s: Service; index: number; total: number; scrollYProgress: MotionValue<number>;
}) {
  const col   = index % 3;
  const row   = Math.floor(index / 3);
  const delay = row * 0.18 + col * 0.09;
  const start = Math.min(delay, 0.88);
  const end   = Math.min(delay + 0.32, 1.0);

  const opacity  = useTransform(scrollYProgress, [start, end], [0, 1]);
  const rotateX  = useTransform(scrollYProgress, [start, end], [30, 0]);
  const y        = useTransform(scrollYProgress, [start, end], [55, 0]);

  return (
    <motion.a
      href="/#contact"
      style={{ opacity, rotateX, y, transformStyle: "preserve-3d" }}
      whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.2, ease: "easeOut" } }}
      className="gradient-border group flex flex-col relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-md transition-all duration-300 hover:border-[#22c55e]/30 hover:shadow-[0_14px_44px_rgba(34,197,94,0.14)] dark:border-white/5 dark:bg-[#0f172a] dark:shadow-[0_2px_16px_rgba(0,0,0,0.3)]"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#22c55e]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="flex items-start gap-3 relative z-10">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-gradient-to-br from-[#22c55e]/10 to-[#22c55e]/5 text-[#22c55e] transition-all duration-300 group-hover:from-[#22c55e] group-hover:to-emerald-400 group-hover:text-white group-hover:shadow-[0_0_24px_rgba(34,197,94,0.4)] dark:border-white/5 dark:from-[#22c55e]/15">
          {(s as any).iconUrl
            ? <img src={(s as any).iconUrl} alt={s.title} className="h-5 w-5 object-contain" />
            : <span className="text-base font-bold">{s.title.slice(0, 1)}</span>}
        </div>
        <div className="min-w-0">
          <div className="text-[15px] font-bold text-slate-900 transition-colors duration-300 group-hover:text-[#22c55e] dark:text-white">{s.title}</div>
          {(s as any).category ? <div className="mt-0.5 text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-[#94a3b8]">{(s as any).category}</div> : null}
        </div>
      </div>
      {s.description ? <div className="mt-4 text-[13px] leading-relaxed text-slate-600 dark:text-[#94a3b8] relative z-10">{s.description}</div> : null}
      <div className="mt-auto pt-5 text-[11px] font-bold tracking-widest text-[#22c55e] uppercase flex items-center gap-1 opacity-50 group-hover:opacity-100 group-hover:translate-x-1.5 transition-all duration-300 relative z-10">
        Get in touch <ChevronRight className="h-3 w-3" />
      </div>
    </motion.a>
  );
}

/* ─────────────────────────────────────────────
   SERVICES SECTION
───────────────────────────────────────────── */
function ServicesSection({ services }: { services: Service[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 92%", "center 48%"] });

  return (
    <section ref={ref} id="services" className="container-fluid pt-24 pb-4" style={{ perspective: "1200px" }}>
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center max-w-2xl mx-auto">
        <motion.div variants={fadeIn} className="section-badge">Core Capabilities</motion.div>
        <motion.h2 variants={fadeUp} className="text-[28px] font-extrabold tracking-tight text-slate-900 sm:text-[32px] dark:text-white">
          HR &amp; Compliance Services
        </motion.h2>
        <motion.p variants={fadeUp} className="mt-3 text-[15px] leading-relaxed text-slate-600 dark:text-[#94a3b8]">
          Enterprise-level architecture for businesses scaling their workforce safely.
        </motion.p>
      </motion.div>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s, i) => <ServiceCard3D key={s._id} s={s} index={i} total={services.length} scrollYProgress={scrollYProgress} />)}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   PROCESS STEP
───────────────────────────────────────────── */
function ProcessStep({
  step, index, total, scrollYProgress,
}: { step: { step: string; icon: React.ElementType; title: string; desc: string }; index: number; total: number; scrollYProgress: MotionValue<number>; }) {
  const t0 = (index / total) * 0.72;
  const t1 = t0 + 0.24;
  const opacity    = useTransform(scrollYProgress, [t0, t1], [0, 1]);
  const y          = useTransform(scrollYProgress, [t0, t1], [48, 0]);
  const scale      = useTransform(scrollYProgress, [t0, t1], [0.86, 1]);
  const iconRotate = useTransform(scrollYProgress, [t0, t1], [-18, 0]);
  const iconScale  = useTransform(scrollYProgress, [t0, t1], [0.5, 1]);

  return (
    <motion.div
      style={{ opacity, y, scale }}
      whileHover={{ y: -7, transition: { duration: 0.2 } }}
      className="gradient-border group relative rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-lg transition-all duration-300 hover:border-[#22c55e]/25 hover:shadow-[0_10px_36px_rgba(34,197,94,0.12)] dark:border-white/5 dark:bg-[#0f172a] dark:shadow-[0_2px_16px_rgba(0,0,0,0.3)]"
    >
      <div className="mb-4 text-[10px] font-black tracking-widest text-[#22c55e]/60 uppercase dark:text-[#22c55e]/40">Step {step.step}</div>
      <motion.div
        style={{ rotate: iconRotate, scale: iconScale }}
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#22c55e]/15 to-[#22c55e]/5 text-[#22c55e] transition-all duration-300 group-hover:from-[#22c55e] group-hover:to-emerald-400 group-hover:text-white group-hover:shadow-[0_0_24px_rgba(34,197,94,0.35)]"
      >
        <step.icon size={22} />
      </motion.div>
      <div className="mt-4 text-[16px] font-extrabold text-slate-900 dark:text-white">{step.title}</div>
      <div className="mt-2 text-[13px] leading-relaxed text-slate-600 dark:text-[#94a3b8]">{step.desc}</div>
    </motion.div>
  );
}

const PROCESS_STEPS = [
  { step: "01", icon: Search,   title: "Understand", desc: "We map your compliance needs, workflow gaps, and team structure before making recommendations." },
  { step: "02", icon: PenTool,  title: "Design",     desc: "Custom HR workflows shaped around your business type, industry, and regulatory context." },
  { step: "03", icon: Settings, title: "Implement",  desc: "HR and payroll systems deployed with minimal disruption and full knowledge transfer." },
  { step: "04", icon: BarChart3, title: "Monitor",   desc: "Ongoing support, compliance updates, and optimization as your business grows." },
];

function ProcessSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 88%", "end 30%"] });
  const lineScaleX = useTransform(scrollYProgress, [0, 0.85], [0, 1]);

  return (
    <section ref={ref} className="container-fluid pt-24 pb-4">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center max-w-2xl mx-auto">
        <motion.div variants={fadeIn} className="section-badge">Operational Model</motion.div>
        <motion.h2 variants={fadeUp} className="text-[28px] font-extrabold tracking-tight text-slate-900 sm:text-[32px] dark:text-white">The Bloom Framework</motion.h2>
        <motion.p variants={fadeUp} className="mt-3 text-[15px] leading-relaxed text-slate-600 dark:text-[#94a3b8]">A battle-tested methodology designed to mitigate risk and accelerate operational scale.</motion.p>
      </motion.div>
      <div className="relative mt-14">
        <div className="absolute left-[13%] right-[13%] top-[4.6rem] hidden h-px overflow-hidden lg:block">
          <div className="absolute inset-0 bg-slate-200 dark:bg-white/5" />
          <motion.div style={{ scaleX: lineScaleX }} className="beam-pulse absolute inset-0 origin-left bg-gradient-to-r from-[#22c55e]/30 via-[#22c55e]/70 to-[#22c55e]/30" />
        </div>
        <div className="relative z-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PROCESS_STEPS.map((step, i) => <ProcessStep key={step.step} step={step} index={i} total={PROCESS_STEPS.length} scrollYProgress={scrollYProgress} />)}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   WHY US SECTION
───────────────────────────────────────────── */
const WHY_ITEMS = [
  { icon: HeartHandshake, title: "Direct Founder-Level Access", desc: "You communicate with the person doing the work — no account managers, no handoffs." },
  { icon: Zap, title: "Practical Compliance, Not Theory", desc: "We focus on PF, ESI, payroll compliance and labour law — what actually needs done." },
  { icon: Shield, title: "Fast Onboarding", desc: "Most clients are operational within 1–2 weeks from first conversation to full setup." },
];
const INDUSTRY_ITEMS = [
  { icon: Briefcase, title: "Startups", desc: "Lean HR setups that meet statutory requirements from day one without overhead." },
  { icon: Users, title: "SMEs", desc: "Streamlined payroll, PF/ESI, and audit-ready documentation for growing teams." },
  { icon: Building2, title: "Established Businesses", desc: "Structured HR systems, compliance audits, and frameworks for organized operations." },
];

function WhyUsSection() {
  return (
    <section id="about" className="container-fluid pt-24 pb-4">
      <div className="grid gap-14 lg:grid-cols-2 lg:items-start">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={stagger}>
          <motion.div variants={fadeIn} className="section-badge">The Advantage</motion.div>
          <motion.h2 variants={fadeUp} className="mt-1 text-[28px] font-extrabold tracking-tight text-slate-900 sm:text-[32px] dark:text-white">Enterprise-Grade Compliance. Zero Fluff.</motion.h2>
          <motion.p variants={fadeUp} className="mt-3 max-w-md text-[15px] leading-relaxed text-slate-600 dark:text-[#94a3b8]">We build fortified HR frameworks for organizations that refuse to fail audits. Pure execution.</motion.p>
          <div className="mt-7 flex flex-col gap-4">
            {WHY_ITEMS.map((item, i) => (
              <motion.div key={item.title} variants={slideL} custom={i} whileHover={{ x: 5, transition: { duration: 0.18 } }} className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:border-[#22c55e]/20 hover:shadow-[0_6px_28px_rgba(34,197,94,0.09)] dark:border-white/5 dark:bg-[#0f172a] dark:text-white">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#22c55e]/10 text-[#22c55e] transition-all duration-300 group-hover:bg-[#22c55e] group-hover:text-white"><item.icon size={18} /></div>
                <div>
                  <div className="text-[14px] font-bold text-slate-900 dark:text-white">{item.title}</div>
                  <div className="mt-1 text-[13px] leading-relaxed text-slate-600 dark:text-[#94a3b8]">{item.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={stagger}>
          <motion.div variants={fadeIn} className="section-badge">Industries</motion.div>
          <motion.h2 variants={fadeUp} className="mt-1 text-[28px] font-extrabold tracking-tight text-slate-900 sm:text-[32px] dark:text-white">Who We Work With</motion.h2>
          <div className="mt-7 flex flex-col gap-4">
            {INDUSTRY_ITEMS.map((item, i) => (
              <motion.div key={item.title} variants={slideR} custom={i} whileHover={{ x: -5, transition: { duration: 0.18 } }} className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:border-[#22c55e]/20 hover:shadow-[0_6px_28px_rgba(34,197,94,0.09)] dark:border-white/5 dark:bg-[#0f172a]">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#22c55e]/10 text-[#22c55e] transition-all duration-300 group-hover:bg-[#22c55e] group-hover:text-white"><item.icon size={20} /></div>
                <div>
                  <div className="text-[14px] font-bold text-slate-900 dark:text-white">{item.title}</div>
                  <div className="mt-1 text-[13px] leading-relaxed text-slate-600 dark:text-[#94a3b8]">{item.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   CLIENTS SECTION
───────────────────────────────────────────── */
const FALLBACK_CLIENTS = [
  { id: "a2b", name: "A2B — Adyar Ananda Bhavan", desc: "Workforce administration and statutory compliance support." },
  { id: "sk",  name: "SK Enterprises", desc: "HR setup, payroll structuring, and statutory guidance for growth." },
];

function ClientsSection({ clients }: { clients: Client[] }) {
  const displayClients = clients.length > 0 ? clients : FALLBACK_CLIENTS.map((c) => ({ _id: c.id, name: c.name, description: c.desc } as any));
  return (
    <section id="clients" className="container-fluid pt-24 pb-4">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="mx-auto mb-10 max-w-xl text-center">
        <motion.div variants={fadeIn} className="section-badge">Select Clients</motion.div>
        <motion.h2 variants={fadeUp} className="text-[28px] font-extrabold tracking-tight text-slate-900 sm:text-[32px] dark:text-white">Trusted by Industry Leaders</motion.h2>
        <motion.p variants={fadeUp} className="mt-3 text-[14px] leading-relaxed text-slate-600 dark:text-[#94a3b8]">We partner with ambitious companies building permanent infrastructures.</motion.p>
      </motion.div>
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={stagger} className="mx-auto grid max-w-2xl gap-5 sm:grid-cols-2">
        {displayClients.map((c: any) => (
          <motion.div key={c._id} variants={popIn} whileHover={{ y: -5, transition: { duration: 0.2 } }} className="gradient-border group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-md transition-all duration-300 hover:border-[#22c55e]/25 hover:shadow-[0_10px_36px_rgba(34,197,94,0.1)] dark:border-white/5 dark:bg-[#0f172a] dark:shadow-[0_2px_16px_rgba(0,0,0,0.3)]">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-[#22c55e]/10 dark:border-[#22c55e]/20">
                {c.logoUrl ? <img src={c.logoUrl} alt={c.name} className="h-8 w-8 object-contain" /> : <span className="text-[14px] font-extrabold text-[#22c55e]">{c.name.slice(0, 2).toUpperCase()}</span>}
              </div>
              <div className="text-[15px] font-bold text-slate-900 transition-colors duration-300 group-hover:text-[#22c55e] dark:text-white">{c.name}</div>
            </div>
            {c.description ? <div className="mt-4 text-[13px] leading-relaxed text-slate-600 dark:text-[#94a3b8]">{c.description}</div> : null}
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   TESTIMONIALS
───────────────────────────────────────────── */
const FALLBACK_TESTIMONIALS = [
  { id: "a2b", quote: "A reliable partner for handling compliance without confusion. They understood our business quickly and kept things practical.", author: "A2B — Adyar Ananda Bhavan", initials: "A2" },
  { id: "sk",  quote: "Clear communication and fast execution. Bloom HR helped us set up payroll and statutory compliance from scratch.", author: "SK Enterprises", initials: "SK" },
];

function TestimonialsSection({ testimonials }: { testimonials: Testimonial[] }) {
  const displayItems = testimonials.length > 0 ? testimonials.map((t) => ({ id: t._id, quote: t.feedback, author: t.name, initials: t.name.slice(0, 2).toUpperCase() })) : FALLBACK_TESTIMONIALS;
  return (
    <section className="container-fluid pt-24 pb-4">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="mx-auto mb-10 max-w-xl text-center">
        <motion.div variants={fadeIn} className="section-badge">What Clients Say</motion.div>
        <motion.h2 variants={fadeUp} className="text-[28px] font-extrabold tracking-tight text-slate-900 sm:text-[32px] dark:text-white">Early Feedback</motion.h2>
        <motion.p variants={fadeUp} className="mt-3 text-[14px] leading-relaxed text-slate-600 dark:text-[#94a3b8]">We&apos;re just getting started — here&apos;s what our early clients have shared.</motion.p>
      </motion.div>
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={stagger} className="mx-auto grid max-w-3xl gap-5 sm:grid-cols-2">
        {displayItems.map((item) => (
          <motion.div key={item.id} variants={popIn} whileHover={{ y: -5, transition: { duration: 0.2 } }} className="gradient-border relative flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-md transition-all duration-300 hover:border-[#22c55e]/20 hover:shadow-[0_10px_36px_rgba(34,197,94,0.08)] dark:border-white/5 dark:bg-[#0f172a] dark:shadow-[0_2px_16px_rgba(0,0,0,0.3)]">
            <div className="quote-icon"><Quote size={28} /></div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-100 bg-[#22c55e]/10 dark:border-[#22c55e]/20">
                <span className="text-[12px] font-extrabold text-[#22c55e]">{item.initials}</span>
              </div>
              <div className="text-[13px] font-bold text-slate-900 dark:text-white">{item.author}</div>
            </div>
            <p className="flex-1 text-[13px] italic leading-relaxed text-slate-600 dark:text-[#94a3b8]">&ldquo;{item.quote}&rdquo;</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   CONTACT SECTION
───────────────────────────────────────────── */
function ContactSection({ contactPhone, contactEmail, contactAddress }: { contactPhone: string; contactEmail: string; contactAddress: string; }) {
  return (
    <section id="contact" className="container-fluid pt-24 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-2xl sm:p-10 dark:border-white/5 dark:bg-[#0b1628] dark:shadow-[0_8px_60px_rgba(0,0,0,0.4)]"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#22c55e]/40 to-transparent dark:via-[#22c55e]/25" />
        <div className="pointer-events-none absolute right-0 top-0 h-[400px] w-[500px] rounded-full bg-[#22c55e]/5 blur-[100px] dark:bg-[#22c55e]/3 dark:blur-[140px]" />
        
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <div className="section-badge">Get in Touch</div>
            <h2 className="mt-1 text-[28px] font-extrabold tracking-tight text-slate-900 sm:text-[32px] dark:text-white">Let&apos;s Talk</h2>
            <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-slate-600 dark:text-[#94a3b8]">
              Whether you need a payroll setup, compliance audit, or HR framework — start with a conversation. We&apos;ll be direct about what&apos;s needed and realistic about timelines.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              {[
                { icon: Phone, label: "Phone", html: contactPhone },
                { icon: Mail, label: "Email", html: contactEmail },
                { icon: MapPin, label: "Location", html: contactAddress },
              ].map((item) => (
                <motion.div key={item.label} whileHover={{ x: 6, transition: { duration: 0.18 } }} className="group flex cursor-default items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-[#22c55e]/30 hover:bg-slate-50 hover:shadow-md dark:border-white/5 dark:bg-white/5 dark:hover:border-[#22c55e]/20 dark:hover:bg-white/10 dark:hover:shadow-none">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#22c55e]/10 text-[#22c55e] transition-all duration-300 group-hover:bg-[#22c55e] group-hover:text-white group-hover:shadow-[0_0_15px_rgba(34,197,94,0.4)]">
                    <item.icon size={15} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-[#94a3b8]">{item.label}</div>
                    <div className="mt-0.5 break-all text-[14px] font-bold text-slate-900 dark:text-white" dangerouslySetInnerHTML={{ __html: item.html }} />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.55, delay: 0.2 }} className="gradient-border relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8 dark:border-white/5 dark:bg-[#0f172a] dark:shadow-none">
            <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-full bg-[#22c55e]/10 blur-[40px] dark:bg-[#22c55e]/5 dark:blur-[50px]" />
            <h3 className="text-[18px] font-extrabold text-slate-900 dark:text-white">Send an Inquiry</h3>
            <p className="mt-1.5 text-[13px] text-slate-600 dark:text-[#94a3b8]">We typically respond within 24 hours.</p>
            <div className="relative z-10 mt-6">
              <LeadForm />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   HOME CLIENT — MAIN
═══════════════════════════════════════════════════════ */
export default function HomeClient({ initialData }: { initialData: { services: Service[]; clients: Client[]; testimonials: Testimonial[]; blocks: ContentBlock[]; }; }) {
  const svcKey  = `${API_BASE_URL}/api/services`;
  const cliKey  = `${API_BASE_URL}/api/clients`;
  const tesKey  = `${API_BASE_URL}/api/testimonials`;
  const cmsKey  = `${API_BASE_URL}/api/cms/blocks?keys=${CMS_KEYS}`;

  const { data: svcData } = useSWR(svcKey, () => apiFetch<{ items: Service[] }>("/api/services"), { fallbackData: { items: initialData.services } });
  const { data: cliData } = useSWR(cliKey, () => apiFetch<{ items: Client[] }>("/api/clients"), { fallbackData: { items: initialData.clients } });
  const { data: tesData } = useSWR(tesKey, () => apiFetch<{ items: Testimonial[] }>("/api/testimonials"), { fallbackData: { items: initialData.testimonials } });
  const { data: cmsData } = useSWR(cmsKey, () => apiFetch<{ blocks: ContentBlock[] }>(`/api/cms/blocks?keys=${CMS_KEYS}`), { fallbackData: { blocks: initialData.blocks } });

  useEffect(() => {
    const s = getSocket();
    const fn = (key: string) => () => void mutate(key);
    const onS = fn(svcKey), onC = fn(cliKey), onT = fn(tesKey), onB = fn(cmsKey);
    s.on("services.changed", onS); s.on("clients.changed", onC);
    s.on("testimonials.changed", onT); s.on("cms.blocks.updated", onB);
    return () => { s.off("services.changed", onS); s.off("clients.changed", onC); s.off("testimonials.changed", onT); s.off("cms.blocks.updated", onB); };
  }, [svcKey, cliKey, tesKey, cmsKey]);

  const services     = useMemo(() => (svcData ? toSortedActive(svcData.items) : []), [svcData]);
  const clients      = useMemo(() => (cliData ? toSortedActive(cliData.items) : []), [cliData]);
  const testimonials = useMemo(() => (tesData ? toSortedActive(tesData.items) : []), [tesData]);
  const blocks       = useMemo(() => cmsData?.blocks ?? [], [cmsData]);

  const getBlock       = (key: string) => blocks.find((b) => b.key === key)?.contentHtml ?? "";
  // sectionVisible_* — if the CMS block is missing entirely, default to true (visible).
  // Only hidden when block explicitly contains the string "false".
  const isSectionVisible = (key: string) => {
    const block = blocks.find((b) => b.key === `sectionVisible_${key}`);
    if (!block) return true; // key missing → default visible
    return block.contentHtml?.trim() !== "false";
  };
  const contactPhone   = getBlock("contactPhone")   || "+91 8903476936";
  const contactEmail   = getBlock("contactEmail")   || "bloomskhrsolutions@gmail.com";
  const contactAddress = getBlock("contactAddress") || "Chennai, India";

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY       = useTransform(heroScroll, [0, 1], [0, 120]);
  const heroOpacity = useTransform(heroScroll, [0, 0.6], [1, 0]);
  const bgShift     = useTransform(heroScroll, [0, 1], [0, 55]);

  return (
    <>
      <GradientMesh />
      <ScrollProgressBar />
      <div className="relative overflow-hidden">
        <section ref={heroRef} className="relative flex min-h-[88vh] items-center overflow-hidden pb-20 pt-16 sm:pb-28 sm:pt-20">
          <motion.div style={{ y: bgShift }} className="hero-grid pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
          <motion.div style={{ y: heroY, opacity: heroOpacity }} className="container-fluid w-full">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                  className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-4 py-1.5 text-[11px] font-bold tracking-widest text-[#22c55e] uppercase shadow-sm dark:border-[#22c55e]/25 dark:shadow-none"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22c55e] opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22c55e]" />
                  </span>
                  HR &amp; Compliance · Enterprise Partner
                </motion.div>
                <div className="mt-8" style={{ perspective: "900px" }}>
                  <motion.h1
                    initial={{ rotateX: 12, opacity: 0 }} animate={{ rotateX: 0,  opacity: 1 }} transition={{ duration: 1.1, delay: 0.1, ease: EASE_OUT }}
                    className="cursor-default text-[clamp(2.5rem,5vw,4rem)] font-extrabold leading-[1.05] tracking-tight text-slate-900 drop-shadow-sm dark:text-white dark:drop-shadow-[0_6px_40px_rgba(0,0,0,0.5)]"
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    <MaskReveal delay={0.15}>Intellectuals solve problems;</MaskReveal>
                    <MaskReveal delay={0.3}>a <span className="genius-text">Genius</span> prevents it.</MaskReveal>
                  </motion.h1>
                </div>
                <motion.p
                  initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.68 }}
                  className="mt-6 max-w-xl text-[16px] leading-relaxed text-slate-600 sm:text-[18px] dark:text-[#94a3b8]"
                >
                  We eliminate compliance risks before they happen. Scale your operations safely with end-to-end, data-driven HR infrastructure built for the modern enterprise.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.78, ease: EASE_EXPO }}
                  className="mt-10 flex flex-wrap gap-4"
                >
                  <MagneticButton
                    href="/#contact"
                    className="btn-neon btn-ripple group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[#22c55e] to-emerald-400 px-8 py-4 text-[15px] font-extrabold text-white shadow-xl shadow-[#22c55e]/20 transition-all duration-300 dark:text-[#020617]"
                  >
                    <span className="absolute inset-0 origin-left scale-x-0 bg-white/20 transition-transform duration-500 ease-out group-hover:scale-x-100 dark:bg-white/15" />
                    <span className="relative">Claim Compliance Audit</span>
                    <ChevronRight className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </MagneticButton>
                  <MagneticButton
                    href="/#services"
                    className="btn-neon inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-8 py-4 text-[15px] font-bold text-slate-700 shadow-sm transition-all hover:border-[#22c55e]/40 hover:bg-slate-50 dark:border-white/10 dark:bg-transparent dark:text-white dark:hover:border-[#22c55e]/40 dark:hover:bg-white/5 dark:shadow-none"
                  >
                    View Frameworks
                  </MagneticButton>
                </motion.div>
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.88, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 1.05, delay: 0.35, ease: EASE_OUT }}
                className="hidden lg:block relative"
              >
                <Hero3DGrid />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }}
                className="grid grid-cols-2 gap-3 lg:hidden"
              >
                {[
                  { label: "Focus", value: "HR + Compliance" },
                  { label: "Approach", value: "Practical & direct" },
                  { label: "Timeline", value: "Fast onboarding" },
                  { label: "Outcome", value: "Audit-ready" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0f172a] dark:shadow-none">
                    <div className="text-[10px] font-bold tracking-widest text-slate-500 uppercase dark:text-[#94a3b8]">{item.label}</div>
                    <div className="mt-1.5 text-[13px] font-bold text-slate-900 dark:text-white">{item.value}</div>
                  </div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* ═══════ TRUST PILLARS ═══════ */}
        <section className="border-y border-slate-200 bg-white/60 backdrop-blur-md dark:border-white/5 dark:bg-[#0f172a]/50">
          <div className="container-fluid py-10">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={stagger} className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {[
                { icon: Shield, label: "Zero-Risk Compliance", desc: "Bulletproof adherence to statutory norms and strict audit readiness." },
                { icon: HeartHandshake, label: "Executive Partnership", desc: "Direct engineering with our core team. No intermediaries." },
                { icon: Eye, label: "Data-Driven Execution", desc: "Measurable frameworks implemented flawlessly into your workflow." },
              ].map((item) => (
                <motion.div key={item.label} variants={fadeUp} className="group flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-[#22c55e]/10 text-[#22c55e] transition-all duration-300 group-hover:bg-[#22c55e] group-hover:text-white group-hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] dark:border-[#22c55e]/18 text-lg">
                    <item.icon size={20} />
                  </div>
                  <div>
                    <div className="text-[15px] font-extrabold text-slate-900 transition-colors group-hover:text-[#22c55e] dark:text-white">{item.label}</div>
                    <div className="mt-1 text-[13px] leading-relaxed text-slate-600 dark:text-[#94a3b8]">{item.desc}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <ServicesSection services={services} />
        {isSectionVisible("process") && <ProcessSection />}
        {isSectionVisible("about") && <WhyUsSection />}
        {isSectionVisible("clients") && <ClientsSection clients={clients} />}
        {isSectionVisible("testimonials") && <TestimonialsSection testimonials={testimonials} />}
        {isSectionVisible("contact") && <ContactSection contactPhone={contactPhone} contactEmail={contactEmail} contactAddress={contactAddress} />}
      </div>
    </>
  );
}
