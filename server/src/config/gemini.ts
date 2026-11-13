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

// Primary model: keep the current model unchanged.
export const GEMINI_MODEL = "gemini-3.8-flash";

// Free-tier fallback candidate with structured-output support.
export const GEMINI_FALLBACK_MODEL = "gemini-3.5-flash-lite";
