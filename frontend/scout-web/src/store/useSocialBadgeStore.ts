import { create } from "zustand";
import { persist } from "zustand/middleware";

type ScoreSnapshot = {
  id: string;
  name: string;
  points: number;
  validatedChallenges: number;
};

export type BadgeDefinition = {
  id: string;
  title: string;
  description: string;
  thresholdPoints?: number;
  thresholdChallenges?: number;
};

export const BADGE_CATALOG: BadgeDefinition[] = [
  {
    id: "arrancada-do-evento",
    title: "Arrancada do Evento",
    description: "Uma patrulha passou da marca de 100 pontos.",
    thresholdPoints: 100,
  },
  {
    id: "veterano-da-trilha",
    title: "Veterano da Trilha",
    description: "Uma patrulha validou pelo menos 7 desafios.",
    thresholdChallenges: 7,
  },
  {
    id: "lider-do-evento",
    title: "Líder do Evento",
    description: "Uma patrulha alcançou 130 pontos.",
    thresholdPoints: 130,
  },
  {
    id: "disciplina-de-campo",
    title: "Disciplina de Campo",
    description: "Uma patrulha validou 10 desafios.",
    thresholdChallenges: 10,
  },
];

function badgeMatchesScores(badge: BadgeDefinition, scores: ScoreSnapshot[]) {
  return scores.some((score) => {
    const pointsMatch =
      badge.thresholdPoints === undefined ||
      score.points >= badge.thresholdPoints;
    const challengesMatch =
      badge.thresholdChallenges === undefined ||
      score.validatedChallenges >= badge.thresholdChallenges;

    return pointsMatch && challengesMatch;
  });
}

type SocialBadgeState = {
  unlockedBadgeIds: string[];
  lastSyncedAt: string | null;
  syncFromScores: (scores: ScoreSnapshot[]) => void;
  resetBadges: () => void;
};

export const useSocialBadgeStore = create<SocialBadgeState>()(
  persist(
    (set, get) => ({
      unlockedBadgeIds: [],
      lastSyncedAt: null,

      syncFromScores: (scores) => {
        const unlocked = new Set(get().unlockedBadgeIds);

        for (const badge of BADGE_CATALOG) {
          if (badgeMatchesScores(badge, scores)) {
            unlocked.add(badge.id);
          }
        }

        set({
          unlockedBadgeIds: [...unlocked],
          lastSyncedAt: new Date().toISOString(),
        });
      },

      resetBadges: () => set({ unlockedBadgeIds: [], lastSyncedAt: null }),
    }),
    {
      name: "social-badge-store",
      partialize: (state) => ({
        unlockedBadgeIds: state.unlockedBadgeIds,
        lastSyncedAt: state.lastSyncedAt,
      }),
    },
  ),
);
