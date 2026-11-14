import * as SecureStore from "expo-secure-store";

const AUTH_TOKEN_KEY = "goalmate_auth_token";

/**
 * Securely saves the authentication token on the device.
 */
export async function saveAuthToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
}

/**
 * Retrieves the saved authentication token.
 * Returns null when no token has been saved.
 */
export async function getAuthToken(): Promise<string | null> {
  return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
}

/**
 * Deletes the saved authentication token, for example during logout.
 */
export async function deleteAuthToken(): Promise<void> {
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
}
