
import type { Request, Response } from "express";
import { generateAIResponse } from "../services/aiService.js";

export async function generateAI(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { prompt } = req.body;

    // Validate the request
    if (typeof prompt !== "string" || !prompt.trim()) {
      res.status(400).json({
        success: false,
        message: "A valid prompt is required.",
      });
      return;
    }

    if (prompt.length > 10000) {
      res.status(400).json({
        success: false,
        message: "Prompt must not exceed 10,000 characters.",
      });
      return;
    }

    // Generate AI response
    const result = await generateAIResponse(prompt);

    res.status(200).json({
      success: true,
      data: {
        response: result,
      },
    });
  } catch (error) {
    console.error("AI Controller Error:", error);

    res.status(503).json({
      success: false,
      message: "AI service is temporarily unavailable. Please try again later.",
    });
  }
}
