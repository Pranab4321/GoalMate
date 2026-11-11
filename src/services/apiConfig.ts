
import { Platform } from "react-native";

// Backend URL configuration
const API_BASE_URL = Platform.select({
  android: "http://10.0.2.2:5000",
  ios: "http://localhost:5000",
  default: "http://localhost:5000",
});

export const API_CONFIG = {
  BASE_URL: "http://10.72.167.170:5000",
  AI_GENERATE_ENDPOINT: "/api/ai/generate",
};

