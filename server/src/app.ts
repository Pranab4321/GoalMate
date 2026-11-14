
import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";

import aiRoutes from "./routes/aiRoutes.js";
import goalPlanningRoutes from "./routes/goalPlanningRoutes.js";
import { connectDatabase } from "./config/database.js";
import { authenticateToken } from "./middleware/authMiddleware.js";

const app = express();

const PORT = Number(process.env.PORT) || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "20kb" }));

// Health check
app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "GoalMate Backend is running!",
    environment: process.env.NODE_ENV || "development",
  });
});

// AI routes
app.use("/api/ai", aiRoutes);
app.use("/api/goal-planning", goalPlanningRoutes);

// Authentication routes
app.use("/api/auth", authRoutes);

// Temporary protected authentication test route
app.get("/api/auth/test", authenticateToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Authentication verified successfully.",
    userId: req.userId,
  });
});

// Connect database before starting server
async function startServer(): Promise<void> {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`GoalMate Backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start GoalMate backend:", error);
    process.exit(1);
  }
}

void startServer();
