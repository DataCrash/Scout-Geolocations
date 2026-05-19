import {
  authLoginResponseSchema,
  authMeResponseSchema,
  oauthAuthorizeResponseSchema,
  type AuthMeResponse,
  type GoogleLoginResponse,
  type OAuthAuthorizeResponse,
} from "@/lib/schemas/authApiSchemas";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";

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

  const data: unknown = await response.json();
  const parsed = authLoginResponseSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error("Resposta inválida da API de autenticação.");
  }

  return parsed.data;
}

/**
 * Initiate OAuth2 redirect flow
 */
export async function getOAuthAuthorizeUrl(): Promise<OAuthAuthorizeResponse> {
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

  const data: unknown = await response.json();
  const parsed = oauthAuthorizeResponseSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error("Resposta inválida da API de autenticação.");
  }

  return parsed.data;
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

  const data: unknown = await response.json();
  const parsed = authLoginResponseSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error("Resposta inválida da API de autenticação.");
  }

  return parsed.data;
}

/**
 * Verify current authentication
 */
export async function verifyAuth(token: string): Promise<AuthMeResponse> {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Authentication verification failed");
  }

  const data: unknown = await response.json();
  const parsed = authMeResponseSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error("Resposta inválida da API de autenticação.");
  }

  return parsed.data;
}
