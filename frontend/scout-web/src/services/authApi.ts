const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";

export interface GoogleLoginResponse {
  token: string;
  userId: string;
  name: string;
  role: string;
}

export interface GuestLoginRequest {
  name: string;
}

/**
 * Authenticate with Google ID token
 */
export async function loginWithGoogle(
  idToken: string,
): Promise<GoogleLoginResponse> {
  const response = await fetch(`${API_BASE}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const error = await response.json();
      throw new Error(error?.detail || error?.title || "Google login failed");
    }

    const errorText = await response.text();
    throw new Error(errorText || "Google login failed");
  }

  return response.json();
}

/**
 * Initiate OAuth2 redirect flow
 */
export async function getOAuthAuthorizeUrl(): Promise<{
  authorizationUrl: string;
  state: string;
}> {
  const response = await fetch(`${API_BASE}/auth/google/authorize`, {
    method: "POST",
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const error = await response.json();
      throw new Error(
        error?.detail || error?.title || "Failed to get authorization URL",
      );
    }

    const errorText = await response.text();
    throw new Error(errorText || "Failed to get authorization URL");
  }

  return response.json();
}

/**
 * Guest login (no Google required)
 */
export async function loginAsGuest(name: string): Promise<GoogleLoginResponse> {
  const response = await fetch(`${API_BASE}/auth/guest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    throw new Error("Guest login failed");
  }

  return response.json();
}

/**
 * Verify current authentication
 */
export async function verifyAuth(token: string) {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Authentication verification failed");
  }

  return response.json();
}
