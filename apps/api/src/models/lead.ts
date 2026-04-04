import mongoose, { Schema } from "mongoose";

export type LeadStatus = "new" | "archived";

export type LeadDocument = {
  name: string;
  email?: string;
  phone?: string;
  message?: string;
  status?: LeadStatus;
  createdAt?: Date;
  updatedAt?: Date;
};

const LeadSchema = new Schema<LeadDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 200, index: true },
    email: { type: String, required: false, trim: true, maxlength: 200, index: true },
    phone: { type: String, required: false, trim: true, maxlength: 40, index: true },
    message: { type: String, required: false, trim: true, maxlength: 4000 },
    status: { type: String, required: false, enum: ["new", "archived"], default: "new", index: true },
  },
  { timestamps: true },
);

LeadSchema.index({ status: 1, createdAt: -1 });

export const Lead =
  (mongoose.models.Lead as mongoose.Model<LeadDocument> | undefined) ??
  mongoose.model<LeadDocument>("Lead", LeadSchema);

