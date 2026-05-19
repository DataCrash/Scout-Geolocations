import {
  challengeAttemptSchema,
  validateChallengeRequestSchema,
  type AttemptResponse,
  type ValidateChallengeRequest,
} from "@/lib/schemas/challengeAttemptSchema";
import { getAuthHeader } from "@/store/useAuthStore";

const API_BASE_URL =
  import.meta.env.VITE_CHALLENGE_API_URL ?? "http://localhost:5004";

export async function validateChallenge(
  challengeId: string,
  payload: ValidateChallengeRequest,
): Promise<AttemptResponse> {
  const requestParsed = validateChallengeRequestSchema.safeParse(payload);

  if (!requestParsed.success) {
    throw new Error("Payload inválido de check-in.");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/challenges/${challengeId}/validate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(requestParsed.data),
    },
  );

  if (!response.ok) {
    let detail = "Falha ao validar check-in.";

    try {
      const data = await response.json();
      detail = typeof data === "string" ? data : (data?.message ?? detail);
    } catch {
      const text = await response.text();
      if (text) {
        detail = text;
      }
    }

    throw new Error(detail);
  }

  const data: unknown = await response.json();
  const parsed = challengeAttemptSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error("Resposta inválida da API de check-in.");
  }

  return parsed.data;
}
