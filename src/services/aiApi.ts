
import { API_CONFIG } from "./apiConfig";

interface GenerateAIResponse {
  success: boolean;
  data?: {
    response: string;
  };
  message?: string;
}

export async function generateAIResponse(
  prompt: string
): Promise<string> {
  if (!prompt.trim()) {
    throw new Error("AI prompt cannot be empty.");
  }

  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 60000);

  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.AI_GENERATE_ENDPOINT}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
        signal: controller.signal,
      }
    );

    const result =
      (await response.json()) as GenerateAIResponse;

    if (!response.ok || !result.success) {
      throw new Error(
        result.message || "Unable to generate AI response."
      );
    }

    if (!result.data?.response) {
      throw new Error("Invalid AI response received.");
    }

    return result.data.response;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("AI request timed out. Please try again.");
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}



export async function checkBackendConnection(): Promise<string> {
  const response = await fetch(
    `${API_CONFIG.BASE_URL}/health`
  );

  if (!response.ok) {
    throw new Error(`Backend returned HTTP ${response.status}`);
  }

  const result = await response.json();

  return result.message;
}
