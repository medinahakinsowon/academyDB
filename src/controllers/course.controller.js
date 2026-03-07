import Course from "../models/Course.model.js";
import Enrollment from "../models/Enrollment.model.js";
import Video from "../models/Video.model.js";
import { asyncHandler } from "../middleware/error.middleware.js";

export const getCourses = asyncHandler(async (req, res) => {
  const { level, tag, search, featured, page = 1, limit = 20 } = req.query;
  const filter = { isPublished: true };
  if (level) filter.level = level;
  if (featured) filter.isFeatured = featured === "true";
  if (tag) filter.tags = { $in: [tag] };
  if (search) filter.$text = { $search: search };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Course.countDocuments(filter);
  const courses = await Course.find(filter)
    .select("-__v")
    .populate("instructor", "name avatar")
    .sort({ isFeatured: -1, createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: {
      courses,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    },
  });
});

export const getCourse = asyncHandler(async (req, res) => {
  const course = await Course.findOne({
    $or: [
      { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null },
      { slug: req.params.id },
    ],
    isPublished: true,
  })
    .populate("instructor", "name avatar bio")
    .populate({
      path: "videos",
      match: { isPublished: true },
      select: "title order duration isFree thumbnail",
      options: { sort: { order: 1 } },
    });

  if (!course)
    return res
      .status(404)
      .json({ success: false, message: "Course not found." });

  let isEnrolled = false;
  if (req.user) {
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: course._id,
    });
    isEnrolled = !!enrollment;
  }
  res.json({ success: true, data: { course, isEnrolled } });
});

export const createCourse = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    shortDesc,
    price,
    currency,
    level,
    tags,
    category,
    requirements,
    whatYouLearn,
  } = req.body;
  const thumbnail = req.file
    ? `/uploads/thumbnails/${req.file.filename}`
    : null;
  const course = await Course.create({
    title,
    description,
    shortDesc,
    price,
    currency,
    level,
    tags,
    category,
    requirements,
    whatYouLearn,
    thumbnail,
    instructor: req.user._id,
    instructorName: req.user.name,
  });
  res
    .status(201)
    .json({ success: true, message: "Course created.", data: { course } });
});

export const updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course)
    return res
      .status(404)
      .json({ success: false, message: "Course not found." });
  if (
    course.instructor.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    return res
      .status(403)
      .json({ success: false, message: "Not authorised to edit this course." });
  }
  const allowed = [
    "title",
    "description",
    "shortDesc",
    "price",
    "level",
    "tags",
    "category",
    "requirements",
    "whatYouLearn",
    "isPublished",
    "isFeatured",
  ];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) course[field] = req.body[field];
  });
  if (req.file) course.thumbnail = `/uploads/thumbnails/${req.file.filename}`;
  await course.save();
  res.json({ success: true, message: "Course updated.", data: { course } });
});

export const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findByIdAndDelete(req.params.id);
  if (!course)
    return res
      .status(404)
      .json({ success: false, message: "Course not found." });
  res.json({ success: true, message: "Course deleted." });
});

export const getCourseVideos = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: courseId,
    status: { $in: ["active", "completed"] },
  });
  if (!enrollment)
    return res
      .status(403)
      .json({
        success: false,
        message: "You must be enrolled to access course videos.",
      });

  const videos = await Video.find({ course: courseId, isPublished: true })
    .sort({ order: 1 })
    .select("-__v");
  const withProgress = videos.map((v) => {
    const prog = enrollment.lessonProgress.find(
      (p) => p.video.toString() === v._id.toString(),
    );
    return {
      ...v.toJSON(),
      progress: prog || { completed: false, watchedSecs: 0 },
    };
  });
  res.json({ success: true, data: { videos: withProgress, enrollment } });
});
