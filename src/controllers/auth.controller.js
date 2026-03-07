import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import { asyncHandler } from "../middleware/error.middleware.js";

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const sendToken = (user, statusCode, res, message = "Success") => {
  const token = signToken(user._id);
  res
    .status(statusCode)
    .json({
      success: true,
      message,
      token,
      data: { user: user.toSafeObject() },
    });
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, country } = req.body;
  const exists = await User.findOne({ email });
  if (exists)
    return res
      .status(409)
      .json({ success: false, message: "Email already registered." });
  const user = await User.create({ name, email, password, phone, country });
  sendToken(
    user,
    201,
    res,
    "Account created successfully! Welcome to SpiceAcademy 🌿",
  );
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res
      .status(400)
      .json({ success: false, message: "Email and password are required." });
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid email or password." });
  }
  if (!user.isActive)
    return res
      .status(403)
      .json({
        success: false,
        message: "Account is deactivated. Contact support.",
      });
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });
  sendToken(user, 200, res, "Login successful!");
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate(
    "enrolledCoursesCount",
  );
  res.json({ success: true, data: { user: user.toSafeObject() } });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select("+password");
  if (!(await user.comparePassword(currentPassword))) {
    return res
      .status(401)
      .json({ success: false, message: "Current password is incorrect." });
  }
  user.password = newPassword;
  await user.save();
  sendToken(user, 200, res, "Password updated successfully.");
});

export const refreshToken = asyncHandler(async (req, res) => {
  const token = signToken(req.user._id);
  res.json({ success: true, token });
});
