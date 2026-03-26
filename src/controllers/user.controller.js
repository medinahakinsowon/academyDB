import User from "../models/User.model.js";
import Enrollment from "../models/Enrollment.model.js";
import Payment from "../models/Payment.model.js";
import { asyncHandler } from "../middleware/error.middleware.js";

export const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ["name", "phone", "bio", "country"];
  const updates = {};
  allowed.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });
  if (req.file) updates.avatar = `/uploads/thumbnails/${req.file.filename}`;
  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });
  res.json({
    success: true,
    message: "Profile updated.",
    data: { user: user.toSafeObject() },
  });
});

export const getMyStats = asyncHandler(async (req, res) => {
  const [enrollments, payments] = await Promise.all([
    Enrollment.find({ student: req.user._id }).populate(
      "course",
      "title thumbnail totalLessons",
    ),
    Payment.find({ student: req.user._id, status: "success" }).countDocuments(),
  ]);
  const totalHours = enrollments.reduce(
    (acc, e) =>
      acc + e.lessonProgress.reduce((s, l) => s + (l.watchedSecs || 0), 0),
    0,
  );
  const completed = enrollments.filter((e) => e.status === "completed").length;
  const certificates = enrollments.filter((e) => e.certificateIssued).length;
  res.json({
    success: true,
    data: {
      enrolledCourses: enrollments.length,
      completedCourses: completed,
      totalLessons: enrollments.reduce((a, e) => a + e.completedLessons, 0),
      totalHoursWatched: Math.round((totalHours / 3600) * 10) / 10,
      certificates,
      totalPayments: payments,
      enrollments,
    },
  });
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, role } = req.query;
  const filter = role ? { role } : {};
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await User.countDocuments(filter);
  const users = await User.find(filter)
    .select("-password -resetPasswordToken -resetPasswordExpires")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  res.json({ success: true, data: { users, total } });
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user)
    return res.status(404).json({ success: false, message: "User not found." });
  res.json({ success: true, data: { user } });
});

export const toggleUserActive = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user)
    return res.status(404).json({ success: false, message: "User not found." });

  const newStatus = !user.isActive;

  // Use updateOne to avoid triggering the pre-save password hash hook
  await User.updateOne({ _id: user._id }, { isActive: newStatus });

  res.json({
    success: true,
    message: `User ${newStatus ? "activated" : "deactivated"}.`,
    data: { isActive: newStatus },
  });
});
