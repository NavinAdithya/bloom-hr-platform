import mongoose, { Schema } from "mongoose";

export type AdminRole = "admin";

export type AdminDocument = {
  email: string;
  passwordHash: string;
  role?: AdminRole;
  isActive?: boolean;
};

const AdminSchema = new Schema<AdminDocument>(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 200, index: true },
    passwordHash: { type: String, required: true, trim: true, maxlength: 255 },
    role: { type: String, required: false, enum: ["admin"], default: "admin", index: true },
    isActive: { type: Boolean, required: false, default: true, index: true },
  },
  { timestamps: true },
);

AdminSchema.index({ role: 1, isActive: 1, createdAt: -1 });

export const Admin =
  (mongoose.models.Admin as mongoose.Model<AdminDocument> | undefined) ??
  mongoose.model<AdminDocument>("Admin", AdminSchema);

