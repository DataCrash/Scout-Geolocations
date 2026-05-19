import {
  challengeItemSchema,
  challengeItemsSchema,
  type ChallengeItem,
} from "@/lib/schemas/challengeItemSchema";
import { getAuthHeader } from "@/store/useAuthStore";

const API_BASE_URL =
  import.meta.env.VITE_CHALLENGE_API_URL ?? "http://localhost:5004";

export type CreateChallengePayload = {
  eventId: string;
  title: string;
  description: string;
  type: number;
  qrCode?: string;
  latitude?: number;
  longitude?: number;
  radiusMeters: number;
  basePoints: number;
  bonusPoints: number;
  bonusTimeSeconds: number;
  geocacheId?: string;
};

function authHeaders() {
  return {
    "Content-Type": "application/json",
    ...getAuthHeader(),
  };
}

export async function listChallengesByEvent(
  eventId: string,
): Promise<ChallengeItem[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/challenges?eventId=${eventId}`,
    {
      headers: authHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error("Falha ao carregar desafios do evento.");
  }

  const data: unknown = await response.json();
  const parsed = challengeItemsSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error("Resposta inválida da API de desafios.");
  }

  return parsed.data;
}

export async function createChallenge(
  payload: CreateChallengePayload,
): Promise<ChallengeItem> {
  const response = await fetch(`${API_BASE_URL}/api/admin/challenges`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Falha ao criar desafio.");
  }

  const data: unknown = await response.json();
  const parsed = challengeItemSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error("Resposta inválida da API de desafios.");
  }

  return parsed.data;
}

export async function updateChallengeStatus(
  challengeId: string,
  status: number,
): Promise<ChallengeItem> {
  const response = await fetch(
    `${API_BASE_URL}/api/admin/challenges/${challengeId}`,
    {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    },
  );

  if (!response.ok) {
    throw new Error("Falha ao atualizar desafio.");
  }

  const data: unknown = await response.json();
  const parsed = challengeItemSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error("Resposta inválida da API de desafios.");
  }

  return parsed.data;
}

export async function deleteChallenge(challengeId: string): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/admin/challenges/${challengeId}`,
    {
      method: "DELETE",
      headers: authHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error("Falha ao excluir desafio.");
  }
}
