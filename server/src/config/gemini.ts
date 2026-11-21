
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error(
    "GEMINI_API_KEY is missing. Please configure it in server/.env"
  );
}

export const gemini = new GoogleGenAI({
  apiKey,
});

// Primary model: optimized for faster AI responses.
export const GEMINI_MODEL = "gemini-3.5-flash-lite";

// Backup model for primary model failures.
export const GEMINI_FALLBACK_MODEL = "gemini-3.8-flash";
