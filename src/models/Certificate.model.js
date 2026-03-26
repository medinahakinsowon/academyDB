import mongoose from "mongoose";
import { v4 as uuid } from "uuid";

const certificateSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      unique: true,
      default: () => "SPICE-" + uuid().split("-")[0].toUpperCase(),
    },
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
    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enrollment",
      required: true,
    },
    issuedAt: { type: Date, default: Date.now },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // admin who approved
  },
  { timestamps: true },
);

// One certificate per student per course
certificateSchema.index({ student: 1, course: 1 }, { unique: true });

export default mongoose.model("Certificate", certificateSchema);
