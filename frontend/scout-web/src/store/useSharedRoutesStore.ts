import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SharedRoute = {
  id: string;
  eventId: string;
  name: string;
  waypoints: string;
  sharedBy: string;
  createdAt: string;
};

type SharedRouteInput = {
  name: string;
  waypoints: string;
  sharedBy: string;
};

type SharedRoutesState = {
  routesByEventId: Record<string, SharedRoute[]>;
  shareRoute: (eventId: string, input: SharedRouteInput) => void;
  clearRoutes: () => void;
};

export const useSharedRoutesStore = create<SharedRoutesState>()(
  persist(
    (set) => ({
      routesByEventId: {},
      shareRoute: (eventId, input) => {
        if (!eventId) {
          return;
        }

        const route: SharedRoute = {
          id: `${eventId}-${Date.now()}`,
          eventId,
          name: input.name.trim(),
          waypoints: input.waypoints.trim(),
          sharedBy: input.sharedBy.trim(),
          createdAt: new Date().toISOString(),
        };

        set((state) => {
          const current = state.routesByEventId[eventId] ?? [];

          return {
            routesByEventId: {
              ...state.routesByEventId,
              [eventId]: [route, ...current].slice(0, 15),
            },
          };
        });
      },
      clearRoutes: () => set({ routesByEventId: {} }),
    }),
    {
      name: "shared-routes-store",
      partialize: (state) => ({ routesByEventId: state.routesByEventId }),
    },
  ),
);
