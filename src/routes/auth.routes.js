import express from "express";
import { body, validationResult } from "express-validator";
import * as authCtrl from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

const validate = (validations) => async (req, res, next) => {
  for (const v of validations) await v.run(req);
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res
      .status(400)
      .json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array(),
      });
  next();
};

router.post(
  "/register",
  validate([
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Name is required")
      .isLength({ min: 2, max: 80 }),
    body("email")
      .isEmail()
      .withMessage("Valid email is required")
      .normalizeEmail(),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ]),
  authCtrl.register,
);

router.post(
  "/login",
  validate([
    body("email")
      .isEmail()
      .withMessage("Valid email is required")
      .normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
  ]),
  authCtrl.login,
);

router.get("/me", protect, authCtrl.getMe);

router.post(
  "/change-password",
  protect,
  validate([
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters"),
  ]),
  authCtrl.changePassword,
);

router.post("/refresh", protect, authCtrl.refreshToken);

export default router;
