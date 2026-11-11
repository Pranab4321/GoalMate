
import { Router } from "express";
import { generateGoalPlanning } from "../controllers/goalPlanningController.js";
import { aiRateLimiter } from "../middleware/rateLimiter.js";

const router = Router();

// Generate an AI-powered goal roadmap
router.post("/generate", aiRateLimiter, generateGoalPlanning);

export default router;
