
export const API_BASE_URL = "http://10.72.167.170:5000";

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
