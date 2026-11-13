import { Type } from "@google/genai";
import {
  gemini,
  GEMINI_MODEL,
  GEMINI_FALLBACK_MODEL,
} from "../config/gemini.js";

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

    // One retry for the primary model; fallback is tried once.
    const maxRetries = isFallback ? 0 : 1;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await gemini.models.generateContent({
          model,
          contents: prompt,
          config: {
            maxOutputTokens: 2048,

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
          console.warn(`AI response successfully generated using fallback model: ${model}`);
        }

        return generatedText;
      } catch (error) {
        const canRetry = isTemporaryServerError(error) && attempt < maxRetries;

        if (canRetry) {
          const delay = 1500 + Math.floor(Math.random() * 500);
          console.warn(
            `Primary Gemini model temporarily unavailable. Retrying in ${delay}ms...`
          );
          await wait(delay);
          continue;
        }

        // Only move to the fallback for temporary server-side availability errors.
        // Do not hide invalid keys, permission errors, quota errors, or bad requests.
        if (!isFallback && modelIndex === 0 && isTemporaryServerError(error)) {
          console.warn(
            `Primary model ${model} remains unavailable. Trying fallback model ${GEMINI_FALLBACK_MODEL}.`
          );
          break;
        }

        throw error;
      }
    }
  }

  throw new Error("Unable to generate AI response with the available Gemini models.");
}
