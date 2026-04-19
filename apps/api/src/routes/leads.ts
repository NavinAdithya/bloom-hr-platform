import { Router } from "express";
import { z } from "zod";
import mongoose from "mongoose";

import { Lead } from "../models";
import { adminOnly } from "../middleware/adminAuth";
import { emailService } from "../services/email";

const leadCreateSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  message: z.string().min(1).max(4000),
});

function escapeCsv(value: unknown): string {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export const leadsRoutes = Router();

leadsRoutes.post("/api/leads", async (req, res) => {
  const parsed = leadCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const created = await Lead.create({
    ...parsed.data,
    email: parsed.data.email ?? undefined,
    phone: parsed.data.phone ?? undefined,
    message: parsed.data.message,
    status: "new",
  });

  // Notify owner asynchronously
  emailService.sendNewLeadEmail({
    name: created.name,
    email: created.email,
    phone: created.phone,
    message: created.message,
  }).catch((err) => console.error("Email notification failed:", err));

  const io = req.app.get("io") as any | undefined;
  io?.emit("leads.changed", { action: "created", id: created._id.toString() });

  return res.status(201).json({ item: created });
});

leadsRoutes.get("/api/admin/leads", adminOnly, async (req, res) => {
  const querySchema = z.object({
    status: z.enum(["new", "archived"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  });
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const filter = parsed.data.status ? { status: parsed.data.status } : {};
  const { page, limit } = parsed.data;

  const [items, total] = await Promise.all([
    Lead.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
      .exec(),
    Lead.countDocuments(filter),
  ]);

  return res.json({ items, total, page, limit });
});

leadsRoutes.delete("/api/admin/leads/:id", adminOnly, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid id" });

  const deleted = await Lead.findByIdAndDelete(req.params.id).lean().exec();
  if (!deleted) return res.status(404).json({ error: "Not found" });

  const io = req.app.get("io") as any | undefined;
  io?.emit("leads.changed", { action: "deleted", id: req.params.id });

  return res.json({ ok: true });
});

leadsRoutes.post("/api/admin/leads/export", adminOnly, async (req, res) => {
  const bodySchema = z.object({
    status: z.enum(["new", "archived"]).optional(),
  });
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const filter = parsed.data.status ? { status: parsed.data.status } : {};
  const items = await Lead.find(filter).sort({ createdAt: -1 }).lean().exec();

  const header = ["name", "email", "phone", "message", "status", "createdAt"];
  const lines = [header.join(",")];

  for (const l of items) {
    lines.push(
      [
        escapeCsv(l.name),
        escapeCsv(l.email ?? ""),
        escapeCsv(l.phone ?? ""),
        escapeCsv(l.message ?? ""),
        escapeCsv(l.status ?? ""),
        escapeCsv(l.createdAt ? new Date(l.createdAt).toISOString() : ""),
      ].join(","),
    );
  }

  const csv = lines.join("\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="bloom-leads.csv"`);
  return res.status(200).send(csv);
});

