import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import mongoose from "mongoose";

import { config } from "../config";
import { adminOnly } from "../middleware/adminAuth";
import { MediaAsset } from "../models";
import { uploadMediaToS3, deleteMediaFromS3 } from "../services/s3";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

export const mediaRoutes = Router();

mediaRoutes.post(
  "/api/admin/media/upload",
  adminOnly,
  upload.single("file"),
  async (req, res) => {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "Missing file" });

    if (!(file.buffer instanceof Buffer)) return res.status(400).json({ error: "Invalid file buffer" });

    const mimeType = file.mimetype || "application/octet-stream";
    const type = mimeType.startsWith("image/") ? ("image" as const) : ("document" as const);

    try {
      const keyPrefix = type === "image" ? "media/images" : "media/docs";
      const uploaded = await uploadMediaToS3({
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType,
        keyPrefix,
      });

      const created = await MediaAsset.create({
        originalName: file.originalname,
        mimeType,
        size: file.size,
        storageUrl: uploaded.storageUrl,
        s3Key: uploaded.s3Key,
        thumbnailUrl: type === "image" ? uploaded.storageUrl : undefined,
        type,
      });

      return res.status(201).json({ item: created });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message ?? "Upload failed" });
    }
  },
);

mediaRoutes.get("/api/admin/media", adminOnly, async (req, res) => {
  const querySchema = z.object({
    type: z.enum(["image", "document"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  });

  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { type, page, limit } = parsed.data;
  const filter = type ? { type } : {};

  const [items, total] = await Promise.all([
    MediaAsset.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
      .exec(),
    MediaAsset.countDocuments(filter),
  ]);

  return res.json({ items, total, page, limit });
});

mediaRoutes.delete("/api/admin/media/:id", adminOnly, async (req, res) => {
  const idSchema = z.object({ id: z.string().refine((v) => mongoose.isValidObjectId(v), "Invalid id") });
  const parsed = idSchema.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const asset = await MediaAsset.findById(parsed.data.id).exec();
  if (!asset) return res.status(404).json({ error: "Not found" });

  // Delete object then record. If S3 deletion fails, we keep the DB record for safety.
  await deleteMediaFromS3(asset.s3Key);
  await MediaAsset.deleteOne({ _id: asset._id }).exec();

  return res.json({ ok: true });
});

