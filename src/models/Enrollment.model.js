import mongoose from "mongoose"

// ─── Per-lesson progress ─────────────────────────────────────────────────────
const lessonProgressSchema = new mongoose.Schema(
  {
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      required: true,
    },
    completed: { type: Boolean, default: false },
    watchedSecs: { type: Number, default: 0 }, // seconds watched
    lastWatched: { type: Date, default: null },
  },
  { _id: false },
);

// ─── Enrollment ──────────────────────────────────────────────────────────────
const enrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "completed", "suspended"],
      default: "active",
    },
    progressPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    completedLessons: {
      type: Number,
      default: 0,
    },
    lessonProgress: [lessonProgressSchema],
    completedAt: {
      type: Date,
      default: null,
    },
    certificateIssued: {
      type: Boolean,
      default: false,
    },
    certificateUrl: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// ─── Compound unique index ────────────────────────────────────────────────────
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

// ─── Auto-update progress percent ────────────────────────────────────────────
enrollmentSchema.methods.recalculateProgress = async function (totalLessons) {
  if (!totalLessons || totalLessons === 0) return;
  const done = this.lessonProgress.filter((l) => l.completed).length;
  this.completedLessons = done;
  this.progressPercent = Math.round((done / totalLessons) * 100);
  if (this.progressPercent === 100 && !this.completedAt) {
    this.status = "completed";
    this.completedAt = new Date();
  }
  await this.save();
};

export default mongoose.model("Enrollment", enrollmentSchema);
