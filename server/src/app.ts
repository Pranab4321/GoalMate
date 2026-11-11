
import "dotenv/config";
import express from "express";
import cors from "cors";
import aiRoutes from "./routes/aiRoutes.js";
import goalPlanningRoutes from "./routes/goalPlanningRoutes.js";

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

// Start server
app.listen(PORT, () => {
  console.log(`GoalMate Backend running on port ${PORT}`);
});
