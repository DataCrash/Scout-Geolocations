import { create } from "zustand";

type PatrolScore = {
  id: string;
  name: string;
  points: number;
  validatedChallenges: number;
};

export type LeaderboardRealtimeUpdate = {
  EventId: string;
  PatrulhaId: string;
  TotalPoints: number;
  ValidatedChallenges: number;
  UpdatedAt: string;
};

type LeaderboardState = {
  eventId: string;
  scores: PatrolScore[];
  lastRealtimeAt?: string;
  bumpPatrol: (id: string, amount: number) => void;
  applyRealtimeUpdate: (payload: LeaderboardRealtimeUpdate) => void;
};

const initialScores: PatrolScore[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Patrulha Lobo",
    points: 120,
    validatedChallenges: 8,
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Patrulha Águia",
    points: 110,
    validatedChallenges: 7,
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    name: "Patrulha Raposa",
    points: 95,
    validatedChallenges: 6,
  },
];

function toDisplayName(patrulhaId: string) {
  const suffix = patrulhaId.slice(0, 8).toUpperCase();
  return `Patrulha ${suffix}`;
}

export const useLeaderboardStore = create<LeaderboardState>((set) => ({
  eventId:
    import.meta.env.VITE_EVENT_ID ?? "00000000-0000-0000-0000-000000000001",
  scores: initialScores,
  bumpPatrol: (id, amount) => {
    set((state) => {
      const next = state.scores
        .map((score) => {
          if (score.id !== id) {
            return score;
          }

          return {
            ...score,
            points: score.points + amount,
            validatedChallenges: score.validatedChallenges + 1,
          };
        })
        .sort((a, b) => b.points - a.points);

      return { scores: next };
    });
  },
  applyRealtimeUpdate: (payload) => {
    set((state) => {
      if (payload.EventId !== state.eventId) {
        return { lastRealtimeAt: payload.UpdatedAt };
      }

      const existing = state.scores.find((score) => score.id === payload.PatrulhaId);

      const next = existing
        ? state.scores.map((score) =>
            score.id === payload.PatrulhaId
              ? {
                  ...score,
                  points: payload.TotalPoints,
                  validatedChallenges: payload.ValidatedChallenges,
                }
              : score,
          )
        : [
            ...state.scores,
            {
              id: payload.PatrulhaId,
              name: toDisplayName(payload.PatrulhaId),
              points: payload.TotalPoints,
              validatedChallenges: payload.ValidatedChallenges,
            },
          ];

      return {
        scores: next.sort((a, b) => b.points - a.points),
        lastRealtimeAt: payload.UpdatedAt,
      };
    });
  },
}));
