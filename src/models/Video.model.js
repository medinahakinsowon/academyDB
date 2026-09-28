import mongoose from "mongoose"

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Video title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
      default: "",
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course reference is required"],
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // File storage details
    filename: { type: String, required: true }, // stored filename (uuid)
    originalName: { type: String, required: true }, // original upload name
    filePath: { type: String, required: true }, // relative path from server root
    fileSize: { type: Number, required: true }, // bytes
    mimeType: { type: String, required: true },

    // Video metadata
    duration: {
      type: Number, // seconds
      default: 0,
    },
    thumbnail: {
      type: String,
      default: null,
    },

    // Lesson ordering within the course
    order: {
      type: Number,
      default: 0,
    },

    // Access control
    isFree: {
      type: Boolean,
      default: false, // preview lesson?
    },
    isPublished: {
      type: Boolean,
      default: true,
    },

    // Engagement stats
    views: {
      type: Number,
      default: 0,
    },
    completions: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  },
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
videoSchema.index({ course: 1, order: 1 });
videoSchema.index({ uploadedBy: 1 });




export default mongoose.model("Video", videoSchema);
