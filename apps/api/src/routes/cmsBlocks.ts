import { Router } from "express";
import { z } from "zod";
import mongoose from "mongoose";

import { ContentBlock } from "../models";
import { adminOnly } from "../middleware/adminAuth";

const updateBlockSchema = z.object({
  title: z.string().max(200).optional().nullable(),
  contentHtml: z.string().min(0).max(200000),
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

export const cmsBlocksRoutes = Router();

cmsBlocksRoutes.get("/api/cms/blocks", async (req, res) => {
  const keysParam = typeof req.query.keys === "string" ? req.query.keys : "";
  const keys = keysParam
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  const filter = keys.length ? { key: { $in: keys }, isActive: true } : { isActive: true };
  const items = await ContentBlock.find(filter).sort({ sortOrder: 1, key: 1 }).lean().exec();

  // Return in requested order when keys are specified.
  const byKey = new Map(items.map((i) => [i.key, i]));
  const ordered = keys.length ? keys.map((k) => byKey.get(k)).filter(Boolean) : items;

  return res.json({ blocks: ordered });
});

cmsBlocksRoutes.get("/api/admin/cms/blocks", adminOnly, async (req, res) => {
  const keysParam = typeof req.query.keys === "string" ? req.query.keys : "";
  const keys = keysParam
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  const filter = keys.length ? { key: { $in: keys } } : {};
  const items = await ContentBlock.find(filter).sort({ sortOrder: 1, key: 1 }).lean().exec();
  return res.json({ blocks: items });
});

cmsBlocksRoutes.put("/api/admin/cms/blocks/:key", adminOnly, async (req, res) => {
  const key = req.params.key;
  if (!key) return res.status(400).json({ error: "Missing key" });

  const parsed = updateBlockSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const updated = await ContentBlock.findOneAndUpdate(
    { key },
    {
      title: parsed.data.title ?? undefined,
      contentHtml: parsed.data.contentHtml,
      isActive: parsed.data.isActive ?? undefined,
      sortOrder: parsed.data.sortOrder ?? undefined,
    },
    { new: true, upsert: true },
  )
    .lean()
    .exec();

  const io = req.app.get("io") as any | undefined;
  io?.emit("cms.blocks.updated", { key });

  return res.json({ item: updated });
});

