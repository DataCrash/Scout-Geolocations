import { expect, type APIRequestContext } from "@playwright/test";
import { createHmac, randomUUID } from "node:crypto";

export type GuestAuthResponse = {
  token: string;
  userId: string;
  name: string;
  role: string;
};

export type PatrulhaResponse = {
  id: string;
  name: string;
  monitorId: string;
  submonitorId?: string | null;
  createdAt: string;
};

export type AttemptResponse = {
  id: string;
  challengeId: string;
  patrulhaId: string;
  userId: string;
  status: number;
  pointsAwarded: number;
  failReason?: string;
  distanceMeters?: number;
  attemptedAt: string;
  validatedAt?: string;
};

export type PatrulhaScoreResponse = {
  patrulhaId: string;
  eventId: string;
  totalPoints: number;
  validatedChallenges: number;
  totalAttempts: number;
};

export type ChallengeResponse = {
  id: string;
  eventId: string;
  title: string;
  description: string;
  type: number;
  status: number;
  qrCode?: string;
  latitude?: number;
  longitude?: number;
  radiusMeters: number;
  basePoints: number;
  bonusPoints: number;
  bonusTimeSeconds: number;
  geocacheId?: string;
  createdAt: string;
};

export const runRealBackend = process.env.RUN_REAL_BACKEND_E2E === "1";

export const runRealBackendSkipMessage =
  "Defina RUN_REAL_BACKEND_E2E=1 para executar este spec integrado.";

export const identityApiUrl =
  process.env.IDENTITY_API_URL ?? "http://localhost:5001";

export const challengeApiUrl =
  process.env.CHALLENGE_API_URL ?? "http://localhost:5004";

export const seedEventId = "00000000-0000-0000-0000-000000000001";

const defaultJwtKey =
  process.env.REAL_E2E_JWT_KEY ??
  process.env.JWT_KEY ??
  "dev_secret_key_min_32_chars_for_testing_only";

const defaultJwtIssuer = process.env.REAL_E2E_JWT_ISSUER ?? "scout-identity";
const defaultJwtAudience = process.env.REAL_E2E_JWT_AUDIENCE ?? "scout-apps";

export function authHeader(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

export function serviceUnavailableMessage(serviceName: string, url: string) {
  return `${serviceName} indisponivel em ${url}.`;
}

function toBase64Url(value: string) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export function createRoleToken(
  role:
    | "ChefesEscoteiro"
    | "Monitor"
    | "Submonitor"
    | "Integrante"
    | "Convidado",
  options?: {
    userId?: string;
    name?: string;
    email?: string;
    jwtKey?: string;
    issuer?: string;
    audience?: string;
    expiresInSeconds?: number;
  },
) {
  const now = Math.floor(Date.now() / 1000);
  const userId = options?.userId ?? randomUUID();
  const jwtKey = options?.jwtKey ?? defaultJwtKey;
  const issuer = options?.issuer ?? defaultJwtIssuer;
  const audience = options?.audience ?? defaultJwtAudience;
  const expiresInSeconds = options?.expiresInSeconds ?? 3600;

  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const payload = {
    sub: userId,
    email: options?.email ?? `e2e-${role.toLowerCase()}@example.com`,
    name: options?.name ?? `E2E ${role}`,
    role,
    jti: randomUUID(),
    iss: issuer,
    aud: audience,
    iat: now,
    nbf: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac("sha256", jwtKey)
    .update(signingInput)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${signingInput}.${signature}`;
}

export async function guestLogin(
  request: APIRequestContext,
  namePrefix: string,
): Promise<GuestAuthResponse> {
  const response = await request.post(`${identityApiUrl}/auth/guest`, {
    data: {
      name: `${namePrefix}-${Date.now()}`,
    },
  });

  expect(response.ok()).toBeTruthy();
  return (await response.json()) as GuestAuthResponse;
}

export async function createPatrulha(
  request: APIRequestContext,
  token: string,
  namePrefix = "Patrulha E2E",
): Promise<PatrulhaResponse> {
  const response = await request.post(`${identityApiUrl}/patrulha/`, {
    headers: {
      ...authHeader(token),
    },
    data: {
      name: `${namePrefix} ${Date.now()}`,
    },
  });

  expect(response.status()).toBe(201);
  return (await response.json()) as PatrulhaResponse;
}

export async function hasSeedChallenge(
  request: APIRequestContext,
  token: string,
  challengeId: string,
  eventId = seedEventId,
): Promise<boolean> {
  const response = await request.get(
    `${challengeApiUrl}/api/challenges?eventId=${eventId}`,
    {
      headers: {
        ...authHeader(token),
      },
    },
  );

  if (!response.ok()) {
    return false;
  }

  const list = (await response.json()) as Array<{ id: string }>;
  return list.some((item) => item.id === challengeId);
}

export async function probeChallengeAuthStatus(
  request: APIRequestContext,
  token: string,
  eventId = seedEventId,
): Promise<number> {
  const response = await request.get(
    `${challengeApiUrl}/api/challenges?eventId=${eventId}`,
    {
      headers: {
        ...authHeader(token),
      },
    },
  );

  return response.status();
}

export async function probeIdentityGuestSession(
  request: APIRequestContext,
): Promise<{ ok: boolean; token?: string; reason?: string }> {
  const guestResponse = await request.post(`${identityApiUrl}/auth/guest`, {
    data: {
      name: `E2E-Probe-${Date.now()}`,
    },
  });

  if (!guestResponse.ok()) {
    return {
      ok: false,
      reason:
        "Falha no preflight de /auth/guest. Verifique conexão com banco e configuração JWT no Identity.",
    };
  }

  const guestAuth = (await guestResponse.json()) as { token?: string };
  if (!guestAuth.token) {
    return {
      ok: false,
      reason: "Falha no preflight de /auth/guest: token não retornado.",
    };
  }

  const meResponse = await request.get(`${identityApiUrl}/auth/me`, {
    headers: {
      ...authHeader(guestAuth.token),
    },
  });

  if (!meResponse.ok()) {
    return {
      ok: false,
      reason:
        "Falha no preflight de /auth/me com token guest. Verifique validação JWT e middleware de autenticação do Identity.",
    };
  }

  return {
    ok: true,
    token: guestAuth.token,
  };
}
