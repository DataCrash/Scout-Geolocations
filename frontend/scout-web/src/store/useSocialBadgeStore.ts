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

export const DEFAULT_BADGE_CATALOG: BadgeDefinition[] = [
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
  badgeCatalogByEventId: Record<string, BadgeDefinition[]>;
  unlockedBadgeIdsByEventId: Record<string, string[]>;
  lastSyncedAtByEventId: Record<string, string>;
  addBadgeForEvent: (
    eventId: string,
    badge: Omit<BadgeDefinition, "id">,
  ) => void;
  syncFromScores: (eventId: string, scores: ScoreSnapshot[]) => void;
  resetBadges: () => void;
};

export const useSocialBadgeStore = create<SocialBadgeState>()(
  persist(
    (set, get) => ({
      badgeCatalogByEventId: {},
      unlockedBadgeIdsByEventId: {},
      lastSyncedAtByEventId: {},

      addBadgeForEvent: (eventId, badge) => {
        if (!eventId) {
          return;
        }

        const title = badge.title.trim();
        const description = badge.description.trim();
        if (!title || !description) {
          return;
        }

        const customBadge: BadgeDefinition = {
          id: `${eventId}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
          title,
          description,
          thresholdPoints: badge.thresholdPoints,
          thresholdChallenges: badge.thresholdChallenges,
        };

        set((state) => {
          const existingCatalog =
            state.badgeCatalogByEventId[eventId] ?? DEFAULT_BADGE_CATALOG;

          return {
            badgeCatalogByEventId: {
              ...state.badgeCatalogByEventId,
              [eventId]: [...existingCatalog, customBadge],
            },
          };
        });
      },

      syncFromScores: (eventId, scores) => {
        if (!eventId) {
          return;
        }

        const catalog =
          get().badgeCatalogByEventId[eventId] ?? DEFAULT_BADGE_CATALOG;
        const unlocked = new Set(
          get().unlockedBadgeIdsByEventId[eventId] ?? [],
        );

        for (const badge of catalog) {
          if (badgeMatchesScores(badge, scores)) {
            unlocked.add(badge.id);
          }
        }

        set((state) => ({
          unlockedBadgeIdsByEventId: {
            ...state.unlockedBadgeIdsByEventId,
            [eventId]: [...unlocked],
          },
          lastSyncedAtByEventId: {
            ...state.lastSyncedAtByEventId,
            [eventId]: new Date().toISOString(),
          },
        }));
      },

      resetBadges: () =>
        set({
          badgeCatalogByEventId: {},
          unlockedBadgeIdsByEventId: {},
          lastSyncedAtByEventId: {},
        }),
    }),
    {
      name: "social-badge-store",
      partialize: (state) => ({
        badgeCatalogByEventId: state.badgeCatalogByEventId,
        unlockedBadgeIdsByEventId: state.unlockedBadgeIdsByEventId,
        lastSyncedAtByEventId: state.lastSyncedAtByEventId,
      }),
    },
  ),
);
