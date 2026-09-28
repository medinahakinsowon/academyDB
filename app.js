import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";

import authRoutes from "./src/routes/auth.routes.js";
import userRoutes from "./src/routes/user.routes.js";
import courseRoutes from "./src/routes/course.routes.js";
import videoRoutes from "./src/routes/video.routes.js";
import paymentRoutes from "./src/routes/payment.routes.js";
import enrollRoutes from "./src/routes/enrollment.routes.js";
import { errorHandler } from "./src/middleware/error.middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

//initialising app with express server

const app = express();

// ─── Security & Middleware ──────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || "http://localhost:3000",
      "http://localhost:4000",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.options("*", cors());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─── Rate Limiting ──────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: "Too many auth attempts, please try again later.",
  },
});

app.use("/api", globalLimiter);
app.use("/api/auth", authLimiter);

// ─── Static Files (Uploads) ─────────────────────────────────────────────────
// app.use("/uploads", express.static(join(__dirname, "../uploads")));
app.use("/uploads", express.static(join(__dirname, "uploads")));

// ─── Health Check ───────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "SumatspiceAcademy API is running 🌿",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── Routes: base urls for each routes ─────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/enrollments", enrollRoutes);

// ─── 404 Handler ────────────────────────────────────────────────────────────
app.use("*", (req, res) => {
  res
    .status(404)
    .json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Error Handler ──────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Database + Server Start ─────────────────────────────────────────────────
const PORT = process.env.PORT;

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/spiceacademy")
  .then(() => {
    console.log("✅  MongoDB connected");
    app.listen(PORT, () => {
      console.log(`🌿  SumatspiceAcademy API running on http://localhost:${PORT}`);
      console.log(`📄  Health check: http://localhost:${PORT}/health`);
    });
  })
  .catch((err) => {
    console.error("❌  MongoDB connection error:", err.message);
    process.exit(1);
  });

export default app;
