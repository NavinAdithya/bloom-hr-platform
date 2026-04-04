import { Router } from "express";
import { z } from "zod";
import mongoose from "mongoose";

import { Client } from "../models";
import { adminOnly } from "../middleware/adminAuth";

const createClientSchema = z.object({
  name: z.string().min(1).max(200),
  logoUrl: z.string().max(2000).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  websiteUrl: z.string().max(500).optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const clientsRoutes = Router();

clientsRoutes.get("/api/clients", async (req, res) => {
  const querySchema = z.object({ includeInactive: z.coerce.boolean().optional() });
  const parsed = querySchema.safeParse(req.query);
  const includeInactive = parsed.success ? parsed.data.includeInactive ?? false : false;
  const filter = includeInactive ? {} : { isActive: true };

  const items = await Client.find(filter).sort({ sortOrder: 1, name: 1 }).lean().exec();
  return res.json({ items });
});

clientsRoutes.get("/api/admin/clients", adminOnly, async (req, res) => {
  const querySchema = z.object({ includeInactive: z.coerce.boolean().optional() });
  const parsed = querySchema.safeParse(req.query);
  const includeInactive = parsed.success ? parsed.data.includeInactive ?? true : true;
  const filter = includeInactive ? {} : { isActive: true };

  const items = await Client.find(filter).sort({ sortOrder: 1, name: 1 }).lean().exec();
  return res.json({ items });
});

clientsRoutes.post("/api/admin/clients", adminOnly, async (req, res) => {
  const parsed = createClientSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const created = await Client.create({
    ...parsed.data,
    logoUrl: parsed.data.logoUrl ?? undefined,
    description: parsed.data.description ?? undefined,
    websiteUrl: parsed.data.websiteUrl ?? undefined,
  });

  const io = req.app.get("io") as any | undefined;
  io?.emit("clients.changed");

  return res.status(201).json({ item: created });
});

clientsRoutes.put("/api/admin/clients/:id", adminOnly, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid id" });

  const parsed = createClientSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const updated = await Client.findByIdAndUpdate(
    req.params.id,
    {
      ...parsed.data,
      logoUrl: parsed.data.logoUrl ?? undefined,
      description: parsed.data.description ?? undefined,
      websiteUrl: parsed.data.websiteUrl ?? undefined,
    },
    { new: true },
  )
    .lean()
    .exec();

  if (!updated) return res.status(404).json({ error: "Not found" });

  const io = req.app.get("io") as any | undefined;
  io?.emit("clients.changed");

  return res.json({ item: updated });
});

clientsRoutes.delete("/api/admin/clients/:id", adminOnly, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid id" });

  const deleted = await Client.findByIdAndDelete(req.params.id).lean().exec();
  if (!deleted) return res.status(404).json({ error: "Not found" });

  const io = req.app.get("io") as any | undefined;
  io?.emit("clients.changed");

  return res.json({ ok: true });
});

