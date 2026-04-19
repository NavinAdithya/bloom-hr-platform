import { Router } from "express";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { config } from "../config";
import { Admin } from "../models";
import { adminOnly } from "../middleware/adminAuth";
import rateLimit from "express-rate-limit";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: { error: "Security alert: Too many login attempts. Access blocked for 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(200),
});

function durationToMs(input: string): number {
  const v = input.trim().toLowerCase();
  const num = Number(v.replace(/[^\d]/g, ""));
  if (v.endsWith("d")) return num * 24 * 60 * 60 * 1000;
  if (v.endsWith("h")) return num * 60 * 60 * 1000;
  if (v.endsWith("m")) return num * 60 * 1000;
  if (v.endsWith("s")) return num * 1000;
  const asNumber = Number(v);
  return Number.isFinite(asNumber) ? asNumber : 7 * 24 * 60 * 60 * 1000;
}

export const authRoutes = Router();

authRoutes.post("/api/auth/login", loginLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const email = parsed.data.email.toLowerCase();
  const password = parsed.data.password;

  const admin = await Admin.findOne({ email, isActive: true }).exec();
  if (!admin) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) {
    // Simulated latency to prevent timing attacks and slow down brute force
    await new Promise((resolve) => setTimeout(resolve, 1200 + Math.random() * 800));
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { role: admin.role ?? "admin", email: admin.email },
    config.jwtAccessSecret,
    { expiresIn: config.jwtAccessExpiresIn, subject: admin._id.toString() } as SignOptions,
  );

  res.cookie(config.adminTokenCookieName, token, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.cookieSameSite,
    maxAge: durationToMs(config.jwtAccessExpiresIn),
    path: "/",
  });

  return res.json({ ok: true, role: admin.role ?? "admin" });
});

authRoutes.post("/api/auth/logout", (_req, res) => {
  res.clearCookie(config.adminTokenCookieName, { path: "/" });
  return res.json({ ok: true });
});

authRoutes.get("/api/auth/me", adminOnly, async (req, res) => {
  const adminId = req.admin?.id;
  return res.json({
    id: adminId,
    role: req.admin?.role,
    email: req.admin?.email,
  });
});

