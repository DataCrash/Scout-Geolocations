import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PatrolProfile = {
  patrolId: string;
  displayName: string;
  bio: string;
  focus: string;
  lastUpdatedAt: string;
};

type PatrolProfileInput = {
  displayName: string;
  bio: string;
  focus: string;
};

type PatrolProfileState = {
  byPatrolId: Record<string, PatrolProfile>;
  upsertProfile: (patrolId: string, input: PatrolProfileInput) => void;
};

export const usePatrolProfileStore = create<PatrolProfileState>()(
  persist(
    (set) => ({
      byPatrolId: {},
      upsertProfile: (patrolId, input) => {
        if (!patrolId) {
          return;
        }

        set((state) => ({
          byPatrolId: {
            ...state.byPatrolId,
            [patrolId]: {
              patrolId,
              displayName: input.displayName.trim(),
              bio: input.bio.trim(),
              focus: input.focus.trim(),
              lastUpdatedAt: new Date().toISOString(),
            },
          },
        }));
      },
    }),
    {
      name: "patrol-profile-store",
      partialize: (state) => ({ byPatrolId: state.byPatrolId }),
    },
  ),
);