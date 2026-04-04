import mongoose, { Schema } from "mongoose";

export type ServiceDocument = {
  title: string;
  description?: string;
  iconUrl?: string;
  category?: string;
  sortOrder?: number;
  isActive?: boolean;
};

const ServiceSchema = new Schema<ServiceDocument>(
  {
    title: { type: String, required: true, trim: true, maxlength: 140, index: true },
    description: { type: String, required: false, trim: true, maxlength: 2000 },
    iconUrl: { type: String, required: false, trim: true },
    category: { type: String, required: false, trim: true, index: true },
    sortOrder: { type: Number, required: false, default: 999 },
    isActive: { type: Boolean, required: false, default: true, index: true },
  },
  { timestamps: true },
);

// Optimize for admin listing + public ordering.
ServiceSchema.index({ isActive: 1, sortOrder: 1, title: 1 });

export const Service =
  (mongoose.models.Service as mongoose.Model<ServiceDocument> | undefined) ??
  mongoose.model<ServiceDocument>("Service", ServiceSchema);

