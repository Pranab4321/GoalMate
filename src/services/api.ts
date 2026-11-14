
import { API_CONFIG } from "./apiConfig";

// Reuse the centralized backend URL.
// Keep this export because existing services depend on it.
export const API_BASE_URL = API_CONFIG.BASE_URL;

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);

    if (!response.ok) {
      return false;
    }

    const data = await response.json();

    return data.success === true;
  } catch (error) {
    console.error("Backend connection error:", error);
    return false;
  }
}
