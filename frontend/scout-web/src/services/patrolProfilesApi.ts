import { authenticatedFetch } from "@/store/useAuthStore";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5001";

export type PatrolSocialProfile = {
  id: string;
  name: string;
  monitorId: string;
  monitorName: string;
  submonitorId: string | null;
  submonitorName: string | null;
  createdAt: string;
  membersCount: number;
  recentMembers: Array<{
    userId: string;
    name: string;
    role: string;
    joinedAt: string;
  }>;
};

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

  return response.json();
}
