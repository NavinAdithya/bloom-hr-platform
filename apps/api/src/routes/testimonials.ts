import { Router } from "express";
import { z } from "zod";
import mongoose from "mongoose";

import { Testimonial } from "../models";
import { adminOnly } from "../middleware/adminAuth";

const createTestimonialSchema = z.object({
  name: z.string().min(1).max(200),
  feedback: z.string().min(1).max(5000),
  rating: z.coerce.number().int().min(1).max(5),
  sortOrder: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const testimonialsRoutes = Router();

testimonialsRoutes.get("/api/testimonials", async (req, res) => {
  const querySchema = z.object({ includeInactive: z.coerce.boolean().optional() });
  const parsed = querySchema.safeParse(req.query);
  const includeInactive = parsed.success ? parsed.data.includeInactive ?? false : false;
  const filter = includeInactive ? {} : { isActive: true };

  const items = await Testimonial.find(filter).sort({ sortOrder: 1, rating: -1 }).lean().exec();
  return res.json({ items });
});

testimonialsRoutes.get("/api/admin/testimonials", adminOnly, async (req, res) => {
  const querySchema = z.object({ includeInactive: z.coerce.boolean().optional() });
  const parsed = querySchema.safeParse(req.query);
  const includeInactive = parsed.success ? parsed.data.includeInactive ?? true : true;
  const filter = includeInactive ? {} : { isActive: true };

  const items = await Testimonial.find(filter).sort({ sortOrder: 1, rating: -1 }).lean().exec();
  return res.json({ items });
});

testimonialsRoutes.post("/api/admin/testimonials", adminOnly, async (req, res) => {
  const parsed = createTestimonialSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const created = await Testimonial.create(parsed.data);
  const io = req.app.get("io") as any | undefined;
  io?.emit("testimonials.changed");
  return res.status(201).json({ item: created });
});

testimonialsRoutes.put("/api/admin/testimonials/:id", adminOnly, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid id" });

  const parsed = createTestimonialSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const updated = await Testimonial.findByIdAndUpdate(req.params.id, parsed.data, { new: true })
    .lean()
    .exec();
  if (!updated) return res.status(404).json({ error: "Not found" });

  const io = req.app.get("io") as any | undefined;
  io?.emit("testimonials.changed");

  return res.json({ item: updated });
});

testimonialsRoutes.delete("/api/admin/testimonials/:id", adminOnly, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid id" });

  const deleted = await Testimonial.findByIdAndDelete(req.params.id).lean().exec();
  if (!deleted) return res.status(404).json({ error: "Not found" });

  const io = req.app.get("io") as any | undefined;
  io?.emit("testimonials.changed");

  return res.json({ ok: true });
});

