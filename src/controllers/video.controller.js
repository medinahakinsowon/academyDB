import path from "path";
import fs from "fs";
import { dirname } from "path";
import { fileURLToPath } from "url";
import Video from "../models/Video.model.js";
import Course from "../models/Course.model.js";
import Enrollment from "../models/Enrollment.model.js";
import { asyncHandler } from "../middleware/error.middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const uploadVideo = asyncHandler(async (req, res) => {
  if (!req.files?.video?.[0])
    return res
      .status(400)
      .json({ success: false, message: "No video file uploaded." });
  const { title, description, courseId, isFree, order } = req.body;
  if (!title || !courseId)
    return res
      .status(400)
      .json({ success: false, message: "Title and courseId are required." });

  const course = await Course.findById(courseId);
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
      .json({
        success: false,
        message: "Not authorised to add videos to this course.",
      });
  }

  const videoFile = req.files.video[0];
  const thumbFile = req.files?.thumbnail?.[0];

  const video = await Video.create({
    title,
    description: description || "",
    course: courseId,
    uploadedBy: req.user._id,
    filename: videoFile.filename,
    originalName: videoFile.originalname,
    filePath: `/uploads/videos/${videoFile.filename}`,
    fileSize: videoFile.size,
    mimeType: videoFile.mimetype,
    thumbnail: thumbFile ? `/uploads/thumbnails/${thumbFile.filename}` : null,
    isFree: isFree === "true",
    order: parseInt(order) || 0,
  });

  await Course.findByIdAndUpdate(courseId, { $inc: { totalLessons: 1 } });
  res
    .status(201)
    .json({
      success: true,
      message: "Video uploaded successfully! 🎬",
      data: { video },
    });
});

export const getCourseVideosAdmin = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const videos = await Video.find({ course: courseId })
    .sort({ order: 1 })
    .populate("uploadedBy", "name");
  res.json({ success: true, data: { videos } });
});

// ─── Student: fetch videos for a course they are enrolled in ─────────────────
export const getCourseVideosStudent = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  // Verify the student is actually enrolled
  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: courseId,
    status: { $in: ["active", "completed"] },
  });

  if (!enrollment) {
    return res.status(403).json({
      success: false,
      message: "You are not enrolled in this course.",
    });
  }

  const videos = await Video.find({ course: courseId, isPublished: true })
    .sort({ order: 1 })
    .select(
      "title description filePath thumbnail duration order isFree isPublished",
    );

  res.json({ success: true, data: { videos } });
});

export const getVideo = asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id).populate("course", "title");
  if (!video)
    return res
      .status(404)
      .json({ success: false, message: "Video not found." });
  if (!video.isFree) {
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: video.course._id,
      status: { $in: ["active", "completed"] },
    });
    if (!enrollment)
      return res
        .status(403)
        .json({
          success: false,
          message: "Enroll in this course to watch this video.",
        });
  }
  await Video.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
  res.json({ success: true, data: { video } });
});

export const updateVideo = asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id);
  if (!video)
    return res
      .status(404)
      .json({ success: false, message: "Video not found." });
  if (
    video.uploadedBy.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    return res.status(403).json({ success: false, message: "Not authorised." });
  }
  ["title", "description", "order", "isFree", "isPublished"].forEach((f) => {
    if (req.body[f] !== undefined) video[f] = req.body[f];
  });
  await video.save();
  res.json({ success: true, message: "Video updated.", data: { video } });
});

export const deleteVideo = asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id);
  if (!video)
    return res
      .status(404)
      .json({ success: false, message: "Video not found." });
  if (
    video.uploadedBy.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    return res.status(403).json({ success: false, message: "Not authorised." });
  }
  const fullPath = path.join(__dirname, "../../", video.filePath);
  if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  await video.deleteOne();
  await Course.findByIdAndUpdate(video.course, { $inc: { totalLessons: -1 } });
  res.json({ success: true, message: "Video deleted." });
});

export const markComplete = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { watchedSecs = 0 } = req.body;
  const video = await Video.findById(videoId);
  if (!video)
    return res
      .status(404)
      .json({ success: false, message: "Video not found." });

  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: video.course,
    status: { $in: ["active", "completed"] },
  });
  if (!enrollment)
    return res.status(403).json({ success: false, message: "Not enrolled." });

  const existing = enrollment.lessonProgress.find(
    (p) => p.video.toString() === videoId,
  );
  if (existing) {
    existing.completed = true;
    existing.watchedSecs = Math.max(
      existing.watchedSecs,
      parseInt(watchedSecs),
    );
    existing.lastWatched = new Date();
  } else {
    enrollment.lessonProgress.push({
      video: videoId,
      completed: true,
      watchedSecs: parseInt(watchedSecs),
      lastWatched: new Date(),
    });
  }

  const course = await Course.findById(video.course).select("totalLessons");
  await enrollment.recalculateProgress(course.totalLessons);
  await Video.findByIdAndUpdate(videoId, { $inc: { completions: 1 } });

  res.json({
    success: true,
    message: "Lesson marked as complete!",
    data: {
      progressPercent: enrollment.progressPercent,
      completedLessons: enrollment.completedLessons,
    },
  });
});
