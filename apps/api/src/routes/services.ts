import { Router } from "express";
import { z } from "zod";
import mongoose from "mongoose";

import { Service } from "../models";
import { adminOnly } from "../middleware/adminAuth";

const createServiceSchema = z.object({
  title: z.string().min(1).max(140),
  description: z.string().max(2000).optional().nullable(),
  iconUrl: z.string().max(2000).optional().nullable(),
  category: z.string().max(200).optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const servicesRoutes = Router();

servicesRoutes.get("/api/services", async (req, res) => {
  const querySchema = z.object({ includeInactive: z.coerce.boolean().optional() });
  const parsed = querySchema.safeParse(req.query);
  const includeInactive = parsed.success ? parsed.data.includeInactive ?? false : false;

  const filter = includeInactive ? {} : { isActive: true };
  const items = await Service.find(filter).sort({ sortOrder: 1, title: 1 }).lean().exec();
  return res.json({ items });
});

servicesRoutes.get("/api/admin/services", adminOnly, async (req, res) => {
  const querySchema = z.object({ includeInactive: z.coerce.boolean().optional() });
  const parsed = querySchema.safeParse(req.query);
  const includeInactive = parsed.success ? parsed.data.includeInactive ?? true : true;
  const filter = includeInactive ? {} : { isActive: true };

  const items = await Service.find(filter).sort({ sortOrder: 1, title: 1 }).lean().exec();
  return res.json({ items });
});

servicesRoutes.post("/api/admin/services", adminOnly, async (req, res) => {
  const parsed = createServiceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const created = await Service.create({
    ...parsed.data,
    description: parsed.data.description ?? undefined,
    iconUrl: parsed.data.iconUrl ?? undefined,
    category: parsed.data.category ?? undefined,
  });

  const io = req.app.get("io") as any | undefined;
  io?.emit("services.changed");

  return res.status(201).json({ item: created });
});

servicesRoutes.put("/api/admin/services/:id", adminOnly, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid id" });
  const parsed = createServiceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const updated = await Service.findByIdAndUpdate(
    req.params.id,
    {
      ...parsed.data,
      description: parsed.data.description ?? undefined,
      iconUrl: parsed.data.iconUrl ?? undefined,
      category: parsed.data.category ?? undefined,
    },
    { new: true },
  )
    .lean()
    .exec();

  if (!updated) return res.status(404).json({ error: "Not found" });

  const io = req.app.get("io") as any | undefined;
  io?.emit("services.changed");

  return res.json({ item: updated });
});

servicesRoutes.delete("/api/admin/services/:id", adminOnly, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid id" });

  const deleted = await Service.findByIdAndDelete(req.params.id).lean().exec();
  if (!deleted) return res.status(404).json({ error: "Not found" });

  const io = req.app.get("io") as any | undefined;
  io?.emit("services.changed");

  return res.json({ ok: true });
});

