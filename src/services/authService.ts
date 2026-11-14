import { API_BASE_URL } from "@/services/api";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
}

interface AuthApiResponse {
  success: boolean;
  message: string;
  data: AuthSession;
}

interface CurrentUserApiResponse {
  success: boolean;
  message: string;
  data: {
    user: AuthUser;
  };
}

/**
 * Sends a request to the GoalMate backend and checks its response.
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  } catch {
    throw new Error(
      "Unable to connect to GoalMate. Check that the backend is running and your device is connected to the same network."
    );
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    Array.isArray(payload)
  ) {
    throw new Error("The server returned an invalid response.");
  }

  const result = payload as {
    success?: unknown;
    message?: unknown;
  };

  if (!response.ok || result.success !== true) {
    throw new Error(
      typeof result.message === "string"
        ? result.message
        : "The request could not be completed. Please try again."
    );
  }

  return payload as T;
}

/**
 * Creates a new GoalMate account.
 */
export async function registerUser(
  input: RegisterInput
): Promise<AuthSession> {
  const result = await request<AuthApiResponse>("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return result.data;
}

/**
 * Logs in an existing GoalMate user.
 */
export async function loginUser(
  input: LoginInput
): Promise<AuthSession> {
  const result = await request<AuthApiResponse>("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return result.data;
}

/**
 * Retrieves the profile of the currently authenticated user.
 */
export async function getCurrentUser(
  token: string
): Promise<AuthUser> {
  const result = await request<CurrentUserApiResponse>("/api/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return result.data.user;
}
