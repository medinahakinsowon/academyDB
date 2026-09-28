import express from "express";
import * as enrollmentCtrl from "../controllers/enrollment.controller.js";
import { protect, restrictTo } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/my", protect, enrollmentCtrl.getMyEnrollments);
router.get("/check/:courseId", protect, enrollmentCtrl.checkEnrollment);
router.get("/:id", protect, enrollmentCtrl.getEnrollment);
router.get(
  "/course/:courseId",
  protect,
  restrictTo("instructor", "admin"),
  enrollmentCtrl.getCourseEnrollments,
);
router.get("/", protect, restrictTo("admin"), enrollmentCtrl.getAllEnrollments);





export default router;
