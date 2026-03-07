import express from "express";
import {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourseVideos,
} from "../controllers/course.controller.js";
import {
  protect,
  restrictTo,
  optionalAuth,
} from "../middleware/auth.middleware.js";
import { multerSingleThumbnail } from "../middleware/upload.middleware.js";

const router = express.Router();

router.get("/", optionalAuth, getCourses);
router.get("/:id", optionalAuth, getCourse);
router.get("/:courseId/videos", protect, getCourseVideos);
router.post(
  "/",
  protect,
  restrictTo("instructor", "admin"),
  multerSingleThumbnail,
  createCourse,
);
router.patch(
  "/:id",
  protect,
  restrictTo("instructor", "admin"),
  multerSingleThumbnail,
  updateCourse,
);
router.delete("/:id", protect, restrictTo("admin"), deleteCourse);

export default router;
