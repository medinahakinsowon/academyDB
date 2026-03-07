import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Course title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    slug: { type: String, unique: true, lowercase: true },
    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    shortDesc: {
      type: String,
      maxlength: [300, "Short description cannot exceed 300 characters"],
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    instructorName: { type: String },
    thumbnail: { type: String, default: null },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    currency: { type: String, default: "USD" },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      required: true,
    },
    tags: [{ type: String, trim: true }],
    category: {
      type: String,
      enum: [
        "Botany",
        "Health",
        "Culinary",
        "Farming",
        "Business",
        "Aromatherapy",
        "Other",
      ],
      default: "Other",
    },
    isPublished: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    totalDuration: { type: Number, default: 0 },
    totalLessons: { type: Number, default: 0 },
    enrolledCount: { type: Number, default: 0 },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    requirements: [{ type: String }],
    whatYouLearn: [{ type: String }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

courseSchema.virtual("videos", {
  ref: "Video",
  localField: "_id",
  foreignField: "course",
});

courseSchema.pre("save", function () {
  if (this.isModified("title") && !this.slug) {
    this.slug =
      this.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 80) +
      "-" +
      Date.now();
  }
});

courseSchema.index({ isPublished: 1, isFeatured: 1 });
courseSchema.index({ tags: 1 });
courseSchema.index({ level: 1 });
courseSchema.index({ title: "text", description: "text" });

export default mongoose.model("Course", courseSchema);
