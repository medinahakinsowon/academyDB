import Enrollment from "../models/Enrollment.model.js";
import Course from "../models/Course.model.js";
import { asyncHandler } from "../middleware/error.middleware.js";

export const getMyEnrollments = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({ student: req.user._id })
    .populate({
      path: "course",
      select:
        "title thumbnail level totalLessons instructor instructorName rating price",
      populate: { path: "instructor", select: "name avatar" },
    })
    .sort({ createdAt: -1 });
  res.json({ success: true, data: { enrollments } });
});

export const getEnrollment = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findOne({
    _id: req.params.id,
    student: req.user._id,
  })
    .populate("course")
    .populate("payment");
  if (!enrollment)
    return res
      .status(404)
      .json({ success: false, message: "Enrollment not found." });
  res.json({ success: true, data: { enrollment } });
});

export const checkEnrollment = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: courseId,
  });
  res.json({
    success: true,
    isEnrolled: !!enrollment,
    data: { enrollment: enrollment || null },
  });
});

export const getCourseEnrollments = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const course = await Course.findById(courseId);
  if (!course)
    return res
      .status(404)
      .json({ success: false, message: "Course not found." });
  if (
    course.instructor.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    return res.status(403).json({ success: false, message: "Not authorised." });
  }
  const enrollments = await Enrollment.find({ course: courseId })
    .populate("student", "name email avatar createdAt")
    .sort({ createdAt: -1 });
  res.json({ success: true, data: { enrollments, total: enrollments.length } });
});

export const getAllEnrollments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Enrollment.countDocuments();
  const enrollments = await Enrollment.find()
    .populate("student", "name email")
    .populate("course", "title price")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  res.json({ success: true, data: { enrollments, total } });
});
