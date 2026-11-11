
import rateLimit from "express-rate-limit";

export const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10, // Maximum 10 requests per window per IP
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many AI requests. Please try again after 15 minutes.",
  },
});
