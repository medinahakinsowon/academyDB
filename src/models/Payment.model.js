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
    amount: { type: Number, required: true }, // in kobo
    amountDisplay: { type: Number }, // human-readable NGN
    currency: { type: String, default: "NGN" },
    reference: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    provider: { type: String, enum: ["paystack", "mock"], default: "paystack" },
    paidAt: { type: Date, default: null },
    paystackId: { type: String, default: null },
    channel: { type: String, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true },
);

export default mongoose.model("Payment", paymentSchema);
