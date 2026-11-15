
import { Type } from "@google/genai";
import {
  gemini,
  GEMINI_MODEL,
  GEMINI_FALLBACK_MODEL,
} from "../config/gemini.js";

const PRIMARY_MODEL_TIMEOUT_MS = 25_000;
const FALLBACK_MODEL_TIMEOUT_MS = 30_000;

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function isTemporaryServerError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const apiError = error as {
    status?: number | string;
    message?: string;
  };

  const status = Number(apiError.status);

  return (
    [500, 502, 503, 504].includes(status) ||
    apiError.message?.includes("UNAVAILABLE") === true
  );
}

function isTimeoutError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const apiError = error as {
    name?: string;
    message?: string;
  };

  return (
    apiError.name === "RequestTimeoutError" ||
    apiError.name === "AbortError" ||
    apiError.message?.toLowerCase().includes("timeout") === true
  );
}

export async function generateAIResponse(
  prompt: string,
  structuredOutput = false
): Promise<string> {
  if (!prompt.trim()) {
    throw new Error("AI prompt cannot be empty.");
  }

  const models = [GEMINI_MODEL, GEMINI_FALLBACK_MODEL];

  for (let modelIndex = 0; modelIndex < models.length; modelIndex++) {
    const model = models[modelIndex];
    const isFallback = modelIndex > 0;

    // Keep one manual retry for temporary primary-model server errors.
    // A timeout moves directly to the fallback model.
    const maxRetries = isFallback ? 0 : 1;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await gemini.models.generateContent({
          model,
          contents: prompt,
          config: {
            maxOutputTokens: 2048,

            httpOptions: {
              timeout: isFallback
                ? FALLBACK_MODEL_TIMEOUT_MS
                : PRIMARY_MODEL_TIMEOUT_MS,
              retryOptions: {
                attempts: 1,
              },
            },

            ...(structuredOutput
              ? {
                  responseMimeType: "application/json",
                  responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                      summary: {
                        type: Type.STRING,
                      },
                      tasks: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            title: {
                              type: Type.STRING,
                            },
                            description: {
                              type: Type.STRING,
                            },
                            difficulty: {
                              type: Type.STRING,
                              enum: ["easy", "medium", "hard"],
                            },
                            priority: {
                              type: Type.STRING,
                              enum: ["low", "medium", "high"],
                            },
                            estimated_duration: {
                              type: Type.INTEGER,
                            },
                          },
                          required: [
                            "title",
                            "description",
                            "difficulty",
                            "priority",
                            "estimated_duration",
                          ],
                        },
                      },
                    },
                    required: ["summary", "tasks"],
                  },
                }
              : {}),
          },
        });

        const generatedText = response.text;

        if (!generatedText?.trim()) {
          throw new Error("Gemini returned an empty response.");
        }

        if (isFallback) {
          console.warn(
            `AI response successfully generated using fallback model: ${model}`
          );
        }

        return generatedText;
      } catch (error) {
        const isTemporaryError = isTemporaryServerError(error);
        const isTimeout = isTimeoutError(error);

        // Retry only temporary server errors, not timeouts.
        const canRetry = isTemporaryError && attempt < maxRetries;

        if (canRetry) {
          const delay = 1500 + Math.floor(Math.random() * 500);

          console.warn(
            `Primary Gemini model temporarily unavailable. Retrying in ${delay}ms...`
          );

          await wait(delay);
          continue;
        }

        // Move to fallback for temporary server errors or timeouts.
        if (!isFallback && modelIndex === 0 && (isTemporaryError || isTimeout)) {
          console.warn(
            isTimeout
              ? `Primary model ${model} timed out. Trying fallback model ${GEMINI_FALLBACK_MODEL}.`
              : `Primary model ${model} remains unavailable. Trying fallback model ${GEMINI_FALLBACK_MODEL}.`
          );

          break;
        }

        throw error;
      }
    }
  }

  throw new Error(
    "Unable to generate AI response with the available Gemini models."
  );
}
