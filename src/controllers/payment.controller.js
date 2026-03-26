import crypto from "crypto";
import Payment from "../models/Payment.model.js";
import Enrollment from "../models/Enrollment.model.js";
import Course from "../models/Course.model.js";
import { asyncHandler } from "../middleware/error.middleware.js";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE = "https://api.paystack.co";

// ─── Helper: call Paystack API ────────────────────────────────────────────────
// Replace paystackRequest in payment.controller.js with this:

const paystackRequest = async (method, path, body = null) => {
  const response = await fetch(`${PAYSTACK_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return response.json();
};

// ─── Step 1: Initialize transaction ──────────────────────────────────────────
export const initiatePayment = asyncHandler(async (req, res) => {
  //  console.log("USER EMAIL:", req.user.email);
  //  console.log("AMOUNT:", Math.round(course.price * 100));
  //  console.log("PAYSTACK SECRET exists:", !!PAYSTACK_SECRET);
  const { courseId } = req.body;
  if (!courseId)
    return res
      .status(400)
      .json({ success: false, message: "courseId is required." });

  const course = await Course.findById(courseId);
  if (!course)
    return res
      .status(404)
      .json({ success: false, message: "Course not found." });

  const existing = await Enrollment.findOne({
    student: req.user._id,
    course: courseId,
  });
  if (existing)
    return res
      .status(409)
      .json({ success: false, message: "Already enrolled in this course." });

  // Amount in kobo (NGN)
  const amountKobo = Math.round(course.price * 100);
  const reference = `SA-${req.user._id}-${courseId}-${Date.now()}`;

  const paystackRes = await paystackRequest("POST", "/transaction/initialize", {
    email: req.user.email,
    amount: amountKobo,
    reference,
    currency: "NGN",
    metadata: {
      courseId: courseId,
      courseTitle: course.title,
      userId: req.user._id.toString(),
      userName: req.user.name,
    },
    callback_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/payment/verify`,
  });

  if (!paystackRes.status)
    return res
      .status(502)
      .json({
        success: false,
        message: "Paystack initialization failed.",
        error: paystackRes.message,
      });

  // Save pending payment — using your model's field names
  await Payment.create({
    student: req.user?._id,
    course: courseId,
    amount: amountKobo, // store in kobo to match Paystack
    amountDisplay: course.price, // human-readable price
    currency: "NGN",
    reference,
    status: "pending",
    metadata: { courseTitle: course.title, userName: req.user.name },
  });

  res.json({
    success: true,
    authorizationUrl: paystackRes.data.authorization_url,
    accessCode: paystackRes.data.access_code,
    reference,
  });
});

// ─── Step 2: Verify transaction ───────────────────────────────────────────────
export const verifyPayment = asyncHandler(async (req, res) => {
  const { reference } = req.params;

  const paystackRes = await paystackRequest(
    "GET",
    `/transaction/verify/${reference}`,
  );

  if (!paystackRes.status || paystackRes.data.status !== "success") {
    await Payment.findOneAndUpdate({ reference }, { status: "failed" });
    return res
      .status(402)
      .json({ success: false, message: "Payment not successful." });
  }

  const { metadata, channel, id: paystackId } = paystackRes.data;
  const { courseId, userId } = metadata;

  // Idempotency guard
  const existingEnrollment = await Enrollment.findOne({
    student: userId,
    course: courseId,
  });
  if (existingEnrollment)
    return res.json({
      success: true,
      message: "Already enrolled.",
      data: { enrollment: existingEnrollment },
    });

  // Update payment record using your model's field names
  const payment = await Payment.findOneAndUpdate(
    { reference },
    {
      status: "success",
      paidAt: new Date(),
      paystackId: String(paystackId),
      channel: channel || null,
      metadata: { ...metadata, paystackData: paystackRes.data },
    },
    { new: true },
  );

  // Create enrollment
  const enrollment = await Enrollment.create({
    student: userId,
    course: courseId,
    payment: payment._id,
    status: "active",
  });

  res.json({
    success: true,
    message: "Payment verified and enrollment created!",
    data: { enrollment, payment },
  });
});

// ─── Paystack webhook ─────────────────────────────────────────────────────────
export const paystackWebhook = asyncHandler(async (req, res) => {
  const hash = crypto
    .createHmac("sha512", PAYSTACK_SECRET)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (hash !== req.headers["x-paystack-signature"])
    return res.status(401).json({ message: "Invalid signature." });

  const { event, data } = req.body;

  if (event === "charge.success") {
    const { reference, metadata, channel, id: paystackId } = data;
    const { courseId, userId } = metadata || {};
    if (!courseId || !userId) return res.sendStatus(200);

    await Payment.findOneAndUpdate(
      { reference },
      {
        status: "success",
        paidAt: new Date(),
        paystackId: String(paystackId),
        channel,
      },
    );

    const exists = await Enrollment.findOne({
      student: userId,
      course: courseId,
    });
    if (!exists) {
      const payment = await Payment.findOne({ reference });
      await Enrollment.create({
        student: userId,
        course: courseId,
        payment: payment?._id,
        status: "active",
      });
    }
  }

  res.sendStatus(200);
});

// ─── Mock payment (dev only) ──────────────────────────────────────────────────
export const mockPayment = asyncHandler(async (req, res) => {
  const { courseId } = req.body;
  if (!courseId)
    return res
      .status(400)
      .json({ success: false, message: "courseId is required." });

  const course = await Course.findById(courseId);
  if (!course)
    return res
      .status(404)
      .json({ success: false, message: "Course not found." });

  const existing = await Enrollment.findOne({
    student: req.user._id,
    course: courseId,
  });
  if (existing)
    return res
      .status(409)
      .json({ success: false, message: "Already enrolled." });

  const reference = `MOCK-${req.user._id}-${Date.now()}`;

  const payment = await Payment.create({
    student: req.user._id,
    course: courseId,
    amount: course.price * 100,
    amountDisplay: course.price,
    currency: "NGN",
    reference,
    status: "success",
    paidAt: new Date(),
    metadata: { courseTitle: course.title },
  });

  const enrollment = await Enrollment.create({
    student: req.user._id,
    course: courseId,
    payment: payment._id,
    status: "active",
  });

  res.status(201).json({
    success: true,
    message: "Mock payment successful!",
    data: { enrollment, payment },
  });
});

// ─── My payments ──────────────────────────────────────────────────────────────
export const getMyPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ student: req.user._id })
    .populate("course", "title thumbnail")
    .sort({ createdAt: -1 });
  res.json({ success: true, data: { payments } });
});

// ─── Admin: all payments ──────────────────────────────────────────────────────
export const getAllPayments = asyncHandler(async (req, res) => {
  const { limit = 100, page = 1 } = req.query;
  const payments = await Payment.find()
    .populate("student", "name email")
    .populate("course", "title")
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit));
  const total = await Payment.countDocuments();
  res.json({ success: true, data: { payments, total } });
});
