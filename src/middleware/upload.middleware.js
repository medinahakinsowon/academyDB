import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const videoDir = path.join(__dirname, "../../uploads/videos");
const thumbDir = path.join(__dirname, "../../uploads/thumbnails");

[videoDir, thumbDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ─── Video Storage ────────────────────────────────────────────────────────────
const videoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, videoDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `video-${uuidv4()}${ext}`);
  },
});

const videoFilter = (_req, file, cb) => {
  const allowed = [
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo",
    "video/webm",
    "video/mpeg",
  ];
  allowed.includes(file.mimetype)
    ? cb(null, true)
    : cb(
        new multer.MulterError(
          "LIMIT_UNEXPECTED_FILE",
          "Only video files are allowed.",
        ),
      );
};

const maxVideoMB = parseInt(process.env.MAX_VIDEO_SIZE_MB || "500", 10);
const maxThumbMB = parseInt(process.env.MAX_THUMB_SIZE_MB || "5", 10);

// ─── Thumbnail Storage ────────────────────────────────────────────────────────
const thumbStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, thumbDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `thumb-${uuidv4()}${ext}`);
  },
});

const thumbFilter = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  allowed.includes(file.mimetype)
    ? cb(null, true)
    : cb(
        new multer.MulterError(
          "LIMIT_UNEXPECTED_FILE",
          "Only image files are allowed.",
        ),
      );
};

// ─── Combined: video + thumbnail ─────────────────────────────────────────────
const combinedStorage = multer.diskStorage({
  destination: (_req, file, cb) =>
    cb(null, file.fieldname === "thumbnail" ? thumbDir : videoDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const prefix = file.fieldname === "thumbnail" ? "thumb" : "video";
    cb(null, `${prefix}-${uuidv4()}${ext}`);
  },
});

// Named clearly to avoid conflicts with controller exports
export const multerSingleVideo = multer({
  storage: videoStorage,
  fileFilter: videoFilter,
  limits: { fileSize: maxVideoMB * 1024 * 1024 },
}).single("video");
export const multerSingleThumbnail = multer({
  storage: thumbStorage,
  fileFilter: thumbFilter,
  limits: { fileSize: maxThumbMB * 1024 * 1024 },
}).single("thumbnail");
export const multerVideoAndThumb = multer({
  storage: combinedStorage,
  limits: { fileSize: maxVideoMB * 1024 * 1024 },
}).fields([
  { name: "video", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 },
]);
