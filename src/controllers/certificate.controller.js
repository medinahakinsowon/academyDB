import Certificate from "../models/Certificate.model.js";
import Enrollment from "../models/Enrollment.model.js";
import { asyncHandler } from "../middleware/error.middleware.js";

// ─── Admin: issue certificate for an enrollment ───────────────────────────────
export const issueCertificate = asyncHandler(async (req, res) => {
  const { enrollmentId } = req.params;

  const enrollment = await Enrollment.findById(enrollmentId)
    .populate("student", "name email")
    .populate("course", "title");

  if (!enrollment)
    return res
      .status(404)
      .json({ success: false, message: "Enrollment not found." });

  // Check not already issued
  const existing = await Certificate.findOne({ enrollment: enrollmentId });
  if (existing)
    return res
      .status(409)
      .json({
        success: false,
        message: "Certificate already issued.",
        data: { certificate: existing },
      });

  const certificate = await Certificate.create({
    student: enrollment.student._id,
    course: enrollment.course._id,
    enrollment: enrollment._id,
    issuedBy: req.user._id,
  });

  // Mark enrollment as certificate issued
  await Enrollment.findByIdAndUpdate(enrollmentId, {
    certificateIssued: true,
    certificateId: certificate.certificateId,
  });

  const populated = await Certificate.findById(certificate._id)
    .populate("student", "name email")
    .populate("course", "title")
    .populate("issuedBy", "name");

  res
    .status(201)
    .json({
      success: true,
      message: "Certificate issued!",
      data: { certificate: populated },
    });
});

// ─── Admin: get all certificates ──────────────────────────────────────────────
export const getAllCertificates = asyncHandler(async (req, res) => {
  const certificates = await Certificate.find()
    .populate("student", "name email")
    .populate("course", "title")
    .sort({ issuedAt: -1 });

  res.json({ success: true, data: { certificates } });
});

// ─── Admin: revoke certificate ────────────────────────────────────────────────
export const revokeCertificate = asyncHandler(async (req, res) => {
  const cert = await Certificate.findById(req.params.id);
  if (!cert)
    return res
      .status(404)
      .json({ success: false, message: "Certificate not found." });

  await Enrollment.findByIdAndUpdate(cert.enrollment, {
    certificateIssued: false,
    certificateId: null,
  });
  await cert.deleteOne();

  res.json({ success: true, message: "Certificate revoked." });
});

// ─── Student: get my certificates ────────────────────────────────────────────
export const getMyCertificates = asyncHandler(async (req, res) => {
  const certificates = await Certificate.find({ student: req.user._id })
    .populate("course", "title thumbnail")
    .sort({ issuedAt: -1 });

  res.json({ success: true, data: { certificates } });
});

// ─── Public: verify a certificate by ID ──────────────────────────────────────
export const verifyCertificate = asyncHandler(async (req, res) => {
  const cert = await Certificate.findOne({
    certificateId: req.params.certificateId,
  })
    .populate("student", "name")
    .populate("course", "title");

  if (!cert)
    return res
      .status(404)
      .json({ success: false, message: "Certificate not found or invalid." });

  res.json({ success: true, data: { certificate: cert } });
});
