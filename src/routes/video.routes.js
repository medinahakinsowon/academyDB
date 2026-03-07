import express from "express";
import {
  uploadVideo,
  getCourseVideosAdmin,
  getVideo,
  updateVideo,
  deleteVideo,
  markComplete,
} from "../controllers/video.controller.js";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import { multerVideoAndThumb } from "../middleware/upload.middleware.js";

const router = express.Router();

router.post(
  "/upload",
  protect,
  restrictTo("instructor", "admin"),
  multerVideoAndThumb,
  uploadVideo,
);
router.get(
  "/course/:courseId",
  protect,
  restrictTo("instructor", "admin"),
  getCourseVideosAdmin,
);
router.get("/:id", protect, getVideo);
router.patch("/:id", protect, restrictTo("instructor", "admin"), updateVideo);
router.delete("/:id", protect, restrictTo("instructor", "admin"), deleteVideo);
router.post("/:videoId/complete", protect, markComplete);

export default router;
