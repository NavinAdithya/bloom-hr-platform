import mongoose, { Schema, type Types } from "mongoose";

export type MediaAssetDocument = {
  originalName: string;
  mimeType: string;
  size: number;
  storageUrl: string;
  thumbnailUrl?: string;
  s3Key: string;
  type?: "image" | "document";
  uploadedBy?: Types.ObjectId;
};

const MediaAssetSchema = new Schema<MediaAssetDocument>(
  {
    originalName: { type: String, required: true, trim: true, maxlength: 255, index: true },
    mimeType: { type: String, required: true, trim: true, maxlength: 120 },
    size: { type: Number, required: true, min: 0 },
    storageUrl: { type: String, required: true, trim: true, maxlength: 2000 },
    thumbnailUrl: { type: String, required: false, trim: true, maxlength: 2000 },
    s3Key: { type: String, required: true, trim: true, maxlength: 2000, unique: true, index: true },
    type: { type: String, required: false, enum: ["image", "document"], index: true },
    uploadedBy: { type: Schema.Types.ObjectId, required: false, ref: "Admin" },
  },
  { timestamps: true },
);

MediaAssetSchema.index({ type: 1, createdAt: -1 });

export const MediaAsset =
  (mongoose.models.MediaAsset as mongoose.Model<MediaAssetDocument> | undefined) ??
  mongoose.model<MediaAssetDocument>("MediaAsset", MediaAssetSchema);

