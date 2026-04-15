"use client";

import { useEffect, useRef } from "react";

/* ── Node in 3D space ── */
interface Node {
  baseX: number; baseY: number; baseZ: number;
  x: number; y: number; z: number;
  phase: number; speed: number; radius: number;
}

const HR_CONCEPTS = [
  "Payroll", "PF / ESI", "Compliance", "HR Policy",
  "Recruitment", "Attendance", "Documents", "Tax",
  "Audit", "Benefits", "Labour Law",
];

export function HeroCanvas({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse     = useRef({ px: 0.5, py: 0.5 });
  const camTarget = useRef({ x: 0, y: 0 });
  const cam       = useRef({ x: 0, y: 0 });
  const raf       = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    /* Hi-DPI setup */
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width  = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    /* Nodes arranged loosely in a cluster */
    const isMobile = window.innerWidth < 640;
    const NODE_COUNT = isMobile ? 8 : 12;
    const FOV = 420;
    const CONNECT_THRESHOLD = 240;

    const nodes: Node[] = Array.from({ length: NODE_COUNT }, (_, i) => {
      const angle = (i / NODE_COUNT) * Math.PI * 2;
      const ring  = 70 + Math.random() * 110;
      return {
        baseX:  Math.cos(angle) * ring + (Math.random() - 0.5) * 60,
        baseY:  Math.sin(angle) * ring * 0.62 + (Math.random() - 0.5) * 55,
        baseZ:  (Math.random() - 0.5) * 170,
        x: 0, y: 0, z: 0,
        phase:  (i / NODE_COUNT) * Math.PI * 2,
        speed:  0.22 + Math.random() * 0.32,
        radius: isMobile ? 4 + Math.random() * 3 : 5 + Math.random() * 5,
      };
    });

    /* Pre-compute connection pairs */
    type Pair = [number, number];
    const pairs: Pair[] = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      for (let j = i + 1; j < NODE_COUNT; j++) {
        const dx = nodes[i].baseX - nodes[j].baseX;
        const dy = nodes[i].baseY - nodes[j].baseY;
        const dz = nodes[i].baseZ - nodes[j].baseZ;
        if (Math.sqrt(dx * dx + dy * dy + dz * dz) < 280) pairs.push([i, j]);
      }
    }

    /* Projected screen positions */
    const proj = new Array<{ sx: number; sy: number; scale: number }>(NODE_COUNT);

    function project(x: number, y: number, z: number, W: number, H: number) {
      const s = FOV / (FOV + z + 220);
      return { sx: W / 2 + x * s, sy: H / 2 + y * s, scale: s };
    }

    /* 3-axis rotation helpers */
    function rotY(x: number, y: number, z: number, a: number) {
      return { rx: x * Math.cos(a) - z * Math.sin(a), ry: y, rz: x * Math.sin(a) + z * Math.cos(a) };
    }
    function rotX(x: number, y: number, z: number, a: number) {
      return { rx: x, ry: y * Math.cos(a) - z * Math.sin(a), rz: y * Math.sin(a) + z * Math.cos(a) };
    }

    let t = 0;

    function draw() {
      if (!canvas || !ctx) return;
      t += 0.007;
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;

      /* Lerp camera */
      cam.current.x += (camTarget.current.x - cam.current.x) * 0.04;
      cam.current.y += (camTarget.current.y - cam.current.y) * 0.04;

      ctx.clearRect(0, 0, W, H);

      /* Update and project each node */
      nodes.forEach((n, i) => {
        n.x = n.baseX + Math.sin(t * n.speed + n.phase) * 16;
        n.y = n.baseY + Math.cos(t * n.speed * 0.65 + n.phase) * 13;
        n.z = n.baseZ + Math.sin(t * n.speed * 0.4 + n.phase + 1) * 18;

        const ry  = rotY(n.x, n.y, n.z, cam.current.x * 0.38);
        const rx  = rotX(ry.rx, ry.ry, ry.rz, cam.current.y * 0.22);
        proj[i]   = project(rx.rx, rx.ry, rx.rz, W, H);
      });

      /* Connections */
      pairs.forEach(([a, b]) => {
        const pa = proj[a], pb = proj[b];
        const dx = pa.sx - pb.sx, dy = pa.sy - pb.sy;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d > CONNECT_THRESHOLD) return;

        const alpha = (1 - d / CONNECT_THRESHOLD) * 0.55 * Math.min(pa.scale, pb.scale) * 3;
        const g = ctx.createLinearGradient(pa.sx, pa.sy, pb.sx, pb.sy);
        g.addColorStop(0,   `rgba(34,197,94,${alpha})`);
        g.addColorStop(0.5, `rgba(74,222,128,${alpha * 1.5})`);
        g.addColorStop(1,   `rgba(34,197,94,${alpha})`);
        ctx.beginPath();
        ctx.moveTo(pa.sx, pa.sy);
        ctx.lineTo(pb.sx, pb.sy);
        ctx.strokeStyle = g;
        ctx.lineWidth   = Math.min(pa.scale, pb.scale) * 2.2;
        ctx.stroke();
      });

      /* Nodes — sorted back-to-front */
      const sortedIdx = Array.from({ length: NODE_COUNT }, (_, i) => i)
        .sort((a, b) => proj[a].scale - proj[b].scale);

      sortedIdx.forEach((i) => {
        const n = nodes[i];
        const p = proj[i];
        const r = n.radius * p.scale * 2.6;

        /* Mouse proximity */
        const mdx = p.sx - mouse.current.px * W;
        const mdy = p.sy - mouse.current.py * H;
        const proximity = Math.max(0, 1 - Math.sqrt(mdx * mdx + mdy * mdy) / 110);

        /* Outer glow halo */
        if (proximity > 0.04) {
          const halo = ctx.createRadialGradient(p.sx, p.sy, r, p.sx, p.sy, r * 4.5);
          halo.addColorStop(0, `rgba(34,197,94,${proximity * 0.4})`);
          halo.addColorStop(1, "rgba(34,197,94,0)");
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, r * 4.5, 0, Math.PI * 2);
          ctx.fillStyle = halo;
          ctx.fill();
        }

        /* Ambient glow */
        const amb = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, r * 2.8);
        amb.addColorStop(0, `rgba(34,197,94,${0.1 + proximity * 0.12})`);
        amb.addColorStop(1, "rgba(34,197,94,0)");
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, r * 2.8, 0, Math.PI * 2);
        ctx.fillStyle = amb;
        ctx.fill();

        /* Sphere body */
        const ball = ctx.createRadialGradient(
          p.sx - r * 0.32, p.sy - r * 0.38, r * 0.08,
          p.sx, p.sy, r,
        );
        ball.addColorStop(0,   `rgba(134,239,172,${0.95 + proximity * 0.05})`);
        ball.addColorStop(0.45, `rgba(34,197,94,${0.88 + proximity * 0.1})`);
        ball.addColorStop(1,   `rgba(21,128,61,0.75)`);
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2);
        ctx.fillStyle = ball;
        ctx.fill();

        /* Specular */
        const spec = ctx.createRadialGradient(
          p.sx - r * 0.38, p.sy - r * 0.4, 0,
          p.sx - r * 0.26, p.sy - r * 0.28, r * 0.55,
        );
        spec.addColorStop(0, "rgba(255,255,255,0.45)");
        spec.addColorStop(1, "rgba(255,255,255,0)");
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2);
        ctx.fillStyle = spec;
        ctx.fill();

        /* Rim */
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(74,222,128,${0.28 + proximity * 0.45})`;
        ctx.lineWidth   = 0.6;
        ctx.stroke();
      });

      raf.current = requestAnimationFrame(draw);
    }

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top)  / rect.height;
      mouse.current     = { px: nx, py: ny };
      camTarget.current = { x: nx - 0.5, y: ny - 0.5 };
    };
    const onMouseLeave = () => { camTarget.current = { x: 0, y: 0 }; };
    const onResize = () => { resize(); };

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("resize", onResize);
    raf.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf.current);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`block w-full h-full ${className}`}
      style={{ willChange: "transform" }}
    />
  );
}
