"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect } from "react";

export function MouseFluidBackground() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { damping: 40, stiffness: 50 });
  const springY = useSpring(mouseY, { damping: 40, stiffness: 50 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse coordinates (-1 to 1)
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      mouseX.set(x * 100); // Max move 100px
      mouseY.set(y * 100);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="fixed inset-0 -z-20 pointer-events-none overflow-hidden bg-[#fafafa] dark:bg-[#020617]">
      {/* Abstract Animated Mesh Grid */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: "radial-gradient(#22c55e 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      
      {/* Interactive Fluid Orbs */}
      <motion.div
        style={{ x: springX, y: springY }}
        className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full opacity-60 dark:opacity-30 blur-[120px] dark:blur-[150px]"
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 45, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#22c55e]/20 to-[#0ea5e9]/20" />
      </motion.div>

      <motion.div
        style={{ x: springX, y: springY }}
        className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[700px] max-h-[700px] rounded-full opacity-50 dark:opacity-20 blur-[130px] dark:blur-[160px]"
        animate={{
          scale: [1.1, 1, 1.1],
          rotate: [0, -45, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      >
        <div className="w-full h-full rounded-full bg-gradient-to-bl from-[#10b981]/20 to-transparent" />
      </motion.div>

      {/* Noise Overlay for premium film-like texture */}
      <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')" }} />
    </div>
  );
}
