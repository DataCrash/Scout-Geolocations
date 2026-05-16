const API_BASE_URL =
  import.meta.env.VITE_CHALLENGE_API_URL ?? "http://localhost:5004";

export type ValidateChallengeRequest = {
  PatrulhaId: string;
  UserId: string;
  ScannedQrCode?: string;
  Latitude?: number;
  Longitude?: number;
  PhotoBase64?: string;
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

function getAccessToken() {
  return localStorage.getItem("access_token") ?? "";
}

export async function validateChallenge(
  challengeId: string,
  payload: ValidateChallengeRequest,
): Promise<AttemptResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/challenges/${challengeId}/validate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAccessToken()}`,
      },
      body: JSON.stringify(payload),
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

  return response.json();
}
