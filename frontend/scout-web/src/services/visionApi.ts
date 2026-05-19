import {
  visionAnalysisResponseSchema,
  type VisionAnalysisResponse,
} from "@/lib/schemas/visionAnalysisSchema";
import { getAuthHeader } from "@/store/useAuthStore";

const API_BASE_URL =
  import.meta.env.VITE_VISION_API_URL ?? "http://localhost:5005";

export async function analyzePhotoWithVisionApi(
  photoBase64: string,
): Promise<VisionAnalysisResponse> {
  const response = await fetch(`${API_BASE_URL}/api/vision/analyze-photo`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify({ photoBase64 }),
  });

  if (!response.ok) {
    let detail = "Falha ao executar fallback backend de visão.";

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
  const parsed = visionAnalysisResponseSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error("Resposta inválida da API de visão.");
  }

  return parsed.data;
}
