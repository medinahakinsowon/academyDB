export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(". ");
  }
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
  }
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }
  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 413;
    message = "File is too large. Please upload a smaller file.";
  }

  if (process.env.NODE_ENV === "development") {
    console.error("❌ Error:", err);
    return res
      .status(statusCode)
      .json({ success: false, message, stack: err.stack, error: err });
  }

  res.status(statusCode).json({ success: false, message });
};

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
