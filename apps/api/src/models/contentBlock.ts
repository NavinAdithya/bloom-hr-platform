import mongoose, { Schema } from "mongoose";

export type ContentBlockDocument = {
  key: string;
  title?: string;
  contentHtml: string;
  sortOrder?: number;
  isActive?: boolean;
};

const ContentBlockSchema = new Schema<ContentBlockDocument>(
  {
    key: { type: String, required: true, trim: true, unique: true, index: true, maxlength: 120 },
    title: { type: String, required: false, trim: true, maxlength: 200 },
    contentHtml: { type: String, required: true, trim: true },
    sortOrder: { type: Number, required: false, default: 999 },
    isActive: { type: Boolean, required: false, default: true, index: true },
  },
  { timestamps: true },
);

export const ContentBlock =
  (mongoose.models.ContentBlock as mongoose.Model<ContentBlockDocument> | undefined) ??
  mongoose.model<ContentBlockDocument>("ContentBlock", ContentBlockSchema);

