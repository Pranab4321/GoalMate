
import { Router } from "express";
import { generateAI } from "../controllers/aiController.js";
import { aiRateLimiter } from "../middleware/rateLimiter.js";

const router = Router();

// Apply rate limiting to AI requests
router.post("/generate", aiRateLimiter, generateAI);

export default router;
