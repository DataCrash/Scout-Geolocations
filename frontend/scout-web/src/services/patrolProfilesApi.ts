import {
  patrolSocialProfileSchema,
  type PatrolSocialProfile,
} from "@/lib/schemas/patrolSocialProfileSchema";
import { authenticatedFetch } from "@/store/useAuthStore";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5001";

export async function getPatrolSocialProfile(
  patrolId: string,
): Promise<PatrolSocialProfile | null> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/patrulha/${patrolId}/social-profile`,
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Falha ao carregar perfil social da Patrulha.");
  }

  const payload: unknown = await response.json();
  const parsed = patrolSocialProfileSchema.safeParse(payload);

  if (!parsed.success) {
    return null;
  }

  return parsed.data;
}
