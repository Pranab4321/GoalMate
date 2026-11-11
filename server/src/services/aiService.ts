
import { Type } from "@google/genai";
import { gemini, GEMINI_MODEL } from "../config/gemini.js";

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function isTemporaryServerError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const apiError = error as {
    status?: number;
    message?: string;
  };

  return (
    apiError.status === 503 ||
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

  const maxRetries = 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await gemini.models.generateContent({
        model: GEMINI_MODEL,
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

      return generatedText;
    } catch (error) {
      if (!isTemporaryServerError(error) || attempt === maxRetries) {
        throw error;
      }

      const delay = 1000 * Math.pow(2, attempt);

      console.warn(
        `Gemini temporarily unavailable. Retrying in ${delay}ms...`
      );

      await wait(delay);
    }
  }

  throw new Error("Unable to generate AI response.");
}
