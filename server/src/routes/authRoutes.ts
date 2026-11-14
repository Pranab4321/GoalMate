
import { Router } from "express";

import { register } from "../controllers/authController.js";
import { login } from "../controllers/loginController.js";
import { getCurrentUser } from "../controllers/meController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();

// Register a new user
router.post("/register", register);

// Login an existing user
router.post("/login", login);

// Get currently authenticated user
router.get("/me", authenticateToken, getCurrentUser);

export default router;
