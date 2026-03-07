import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
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
    reference: { type: String, required: true, unique: true },
    paystackId: { type: String, default: null },
    amount: { type: Number, required: true },
    amountDisplay: { type: Number },
    currency: { type: String, default: "USD" },
    status: {
      type: String,
      enum: ["pending", "success", "failed", "refunded"],
      default: "pending",
    },
    channel: { type: String, default: null },
    paidAt: { type: Date, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

paymentSchema.index({ student: 1 });
paymentSchema.index({ status: 1 });

export default mongoose.model("Payment", paymentSchema);
