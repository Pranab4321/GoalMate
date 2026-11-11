import "dotenv/config";

import { gemini, GEMINI_MODEL } from "./gemini.js";

async function testGeminiConnection() {
  try {
    console.log("Testing Gemini API connection...");

    const response = await gemini.models.generateContent({
      model: GEMINI_MODEL,
      contents: "Reply with exactly: GoalMate AI connection successful!",
      config: {
        maxOutputTokens: 30,
      },
    });

    console.log("Gemini response:", response.text);
    console.log("Gemini API connection successful!");
  } catch (error) {
    console.error("Gemini API connection failed.");

    if (error instanceof Error) {
      console.error(error.message);
    }
  }
}

testGeminiConnection();
