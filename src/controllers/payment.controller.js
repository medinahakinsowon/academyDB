import https from "https";
import { v4 as uuidv4 } from "uuid";
import Payment from "../models/Payment.model.js";
import Enrollment from "../models/Enrollment.model.js";
import Course from "../models/Course.model.js";
import { asyncHandler } from "../middleware/error.middleware.js";

const paystackRequest = (method, path, data) =>
  new Promise((resolve, reject) => {
    const options = {
      hostname: "api.paystack.co",
      port: 443,
      path,
      method,
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    };
    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on("error", reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });

export const initiatePayment = asyncHandler(async (req, res) => {
  const { courseId } = req.body;
  const course = await Course.findById(courseId);
  if (!course)
    return res
      .status(404)
      .json({ success: false, message: "Course not found." });
  if (!course.isPublished)
    return res
      .status(400)
      .json({ success: false, message: "Course is not available." });

  const existing = await Enrollment.findOne({
    student: req.user._id,
    course: courseId,
  });
  if (existing)
    return res
      .status(409)
      .json({
        success: false,
        message: "You are already enrolled in this course.",
      });

  if (course.price === 0) {
    const enrollment = await Enrollment.create({
      student: req.user._id,
      course: courseId,
    });
    await Course.findByIdAndUpdate(courseId, { $inc: { enrolledCount: 1 } });
    return res
      .status(201)
      .json({
        success: true,
        message: "Enrolled in free course successfully!",
        data: { enrollment, free: true },
      });
  }

  const reference = `SPICE-${uuidv4().split("-")[0].toUpperCase()}-${Date.now()}`;
  const amountKobo = Math.round(course.price * 100);

  const payment = await Payment.create({
    student: req.user._id,
    course: courseId,
    reference,
    amount: amountKobo,
    amountDisplay: course.price,
    currency: course.currency || "USD",
    status: "pending",
    metadata: { courseName: course.title, studentName: req.user.name },
  });

  let paystackData = null;
  try {
    paystackData = await paystackRequest("POST", "/transaction/initialize", {
      email: req.user.email,
      amount: amountKobo,
      reference,
      currency: course.currency === "NGN" ? "NGN" : "USD",
      metadata: {
        courseId: courseId.toString(),
        studentId: req.user._id.toString(),
        paymentId: payment._id.toString(),
      },
      callback_url: `${process.env.CLIENT_URL}/payment/callback`,
    });
  } catch (err) {
    console.warn("Paystack unavailable:", err.message);
  }

  res.status(201).json({
    success: true,
    message: "Payment initiated.",
    data: {
      reference,
      paymentId: payment._id,
      amount: course.price,
      currency: course.currency || "USD",
      paystackUrl: paystackData?.data?.authorization_url || null,
      accessCode: paystackData?.data?.access_code || null,
    },
  });
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const { reference } = req.params;
  const payment = await Payment.findOne({ reference, student: req.user._id });
  if (!payment)
    return res
      .status(404)
      .json({ success: false, message: "Payment record not found." });

  if (payment.status === "success") {
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: payment.course,
    });
    return res.json({
      success: true,
      message: "Already verified.",
      data: { payment, enrollment },
    });
  }

  let verified = false;
  try {
    const result = await paystackRequest(
      "GET",
      `/transaction/verify/${reference}`,
    );
    if (result.data?.status === "success") {
      verified = true;
      payment.status = "success";
      payment.paystackId = result.data.id?.toString();
      payment.channel = result.data.channel;
      payment.paidAt = new Date(result.data.paid_at);
      await payment.save();
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      verified = true;
      payment.status = "success";
      payment.paidAt = new Date();
      await payment.save();
    }
  }

  if (!verified) {
    payment.status = "failed";
    await payment.save();
    return res
      .status(402)
      .json({ success: false, message: "Payment not verified with Paystack." });
  }

  const enrollment = await Enrollment.create({
    student: req.user._id,
    course: payment.course,
    payment: payment._id,
  });
  await Course.findByIdAndUpdate(payment.course, {
    $inc: { enrolledCount: 1 },
  });
  res.json({
    success: true,
    message: "Payment verified! You are now enrolled. 🎉",
    data: { payment, enrollment },
  });
});

export const mockPayment = asyncHandler(async (req, res) => {
  if (process.env.NODE_ENV === "production")
    return res
      .status(403)
      .json({ success: false, message: "Not available in production." });
  const { courseId } = req.body;
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

  const reference = `MOCK-${uuidv4().split("-")[0].toUpperCase()}`;
  const payment = await Payment.create({
    student: req.user._id,
    course: courseId,
    reference,
    amount: course.price * 100,
    amountDisplay: course.price,
    currency: course.currency || "USD",
    status: "success",
    channel: "mock",
    paidAt: new Date(),
  });
  const enrollment = await Enrollment.create({
    student: req.user._id,
    course: courseId,
    payment: payment._id,
  });
  await Course.findByIdAndUpdate(courseId, { $inc: { enrolledCount: 1 } });
  res
    .status(201)
    .json({
      success: true,
      message: "Mock payment successful! Enrolled. 🌿",
      data: { payment, enrollment },
    });
});

export const getMyPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ student: req.user._id })
    .populate("course", "title thumbnail price")
    .sort({ createdAt: -1 });
  res.json({ success: true, data: { payments } });
});
