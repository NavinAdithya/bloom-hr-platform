import mongoose, { Schema } from "mongoose";

export type ClientDocument = {
  name: string;
  logoUrl?: string;
  description?: string;
  websiteUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
};

const ClientSchema = new Schema<ClientDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 200, index: true },
    logoUrl: { type: String, required: false, trim: true },
    description: { type: String, required: false, trim: true, maxlength: 2000 },
    websiteUrl: { type: String, required: false, trim: true, maxlength: 500 },
    sortOrder: { type: Number, required: false, default: 999 },
    isActive: { type: Boolean, required: false, default: true, index: true },
  },
  { timestamps: true },
);

ClientSchema.index({ isActive: 1, sortOrder: 1, name: 1 });

export const Client =
  (mongoose.models.Client as mongoose.Model<ClientDocument> | undefined) ??
  mongoose.model<ClientDocument>("Client", ClientSchema);

