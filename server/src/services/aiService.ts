
import { gemini, GEMINI_MODEL } from "../config/gemini.js";

export async function generateAIResponse(
  prompt: string
): Promise<string> {
  if (!prompt.trim()) {
    throw new Error("AI prompt cannot be empty.");
  }

  const response = await gemini.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      maxOutputTokens: 2048,
    },
  });

  const generatedText = response.text;

  if (!generatedText) {
    throw new Error("Gemini returned an empty response.");
  }

  return generatedText;
}
