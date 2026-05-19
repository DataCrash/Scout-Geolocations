import { create } from "zustand";
import { persist } from "zustand/middleware";

type ScoreSnapshot = {
  id: string;
  name: string;
  points: number;
  validatedChallenges: number;
};

export type LeaderboardEventSnapshot = {
  eventId: string;
  capturedAt: string;
  scores: ScoreSnapshot[];
};

type LeaderboardHistoryState = {
  byEventId: Record<string, LeaderboardEventSnapshot>;
  upsertEventSnapshot: (eventId: string, scores: ScoreSnapshot[]) => void;
  clearHistory: () => void;
};

function cloneScores(scores: ScoreSnapshot[]) {
  return scores
    .map((score) => ({ ...score }))
    .sort((a, b) => b.points - a.points);
}

export const useLeaderboardHistoryStore = create<LeaderboardHistoryState>()(
  persist(
    (set) => ({
      byEventId: {},
      upsertEventSnapshot: (eventId, scores) => {
        if (!eventId) {
          return;
        }

        set((state) => ({
          byEventId: {
            ...state.byEventId,
            [eventId]: {
              eventId,
              capturedAt: new Date().toISOString(),
              scores: cloneScores(scores),
            },
          },
        }));
      },
      clearHistory: () => set({ byEventId: {} }),
    }),
    {
      name: "leaderboard-history-store",
      partialize: (state) => ({ byEventId: state.byEventId }),
    },
  ),
);
