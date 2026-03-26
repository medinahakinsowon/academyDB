import express from "express";
import {
  updateProfile,
  getMyStats,
  getAllUsers,
  getUser,
  toggleUserActive,
} from "../controllers/user.controller.js";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import { multerSingleThumbnail } from "../middleware/upload.middleware.js";

const router = express.Router();

// ⚠️ Specific routes MUST come before /:id param routes
router.patch("/profile", protect, multerSingleThumbnail, updateProfile);
router.get("/my-stats", protect, getMyStats);
router.get("/", protect, restrictTo("admin"), getAllUsers);

// Param routes last
router.get("/:id", protect, restrictTo("admin"), getUser);
router.patch(
  "/:id/toggle-active",
  protect,
  restrictTo("admin"),
  toggleUserActive,
);

export default router;
