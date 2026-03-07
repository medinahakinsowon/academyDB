import jwt from "jsonwebtoken";
import User from "../models/User.model.js";

export const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated. Please log in." });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res
        .status(401)
        .json({
          success: false,
          message: "User belonging to this token no longer exists.",
        });
    }
    if (!user.isActive) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Your account has been deactivated.",
        });
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError")
      return res
        .status(401)
        .json({ success: false, message: "Invalid token." });
    if (err.name === "TokenExpiredError")
      return res
        .status(401)
        .json({
          success: false,
          message: "Token expired. Please log in again.",
        });
    next(err);
  }
};

export const restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(", ")}.`,
      });
    }
    next();
  };

export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
    }
  } catch (_) {
    /* no-op */
  }
  next();
};
