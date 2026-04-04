import mongoose, { Schema } from "mongoose";

export type TestimonialDocument = {
  name: string;
  feedback: string;
  rating: number;
  sortOrder?: number;
  isActive?: boolean;
};

const TestimonialSchema = new Schema<TestimonialDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 200, index: true },
    feedback: { type: String, required: true, trim: true, maxlength: 5000 },
    rating: { type: Number, required: true, min: 1, max: 5, index: true },
    sortOrder: { type: Number, required: false, default: 999 },
    isActive: { type: Boolean, required: false, default: true, index: true },
  },
  { timestamps: true },
);

TestimonialSchema.index({ isActive: 1, sortOrder: 1, rating: 1 });

export const Testimonial =
  (mongoose.models.Testimonial as mongoose.Model<TestimonialDocument> | undefined) ??
  mongoose.model<TestimonialDocument>("Testimonial", TestimonialSchema);

