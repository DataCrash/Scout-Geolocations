import { useAuthStore } from "@/store/useAuthStore";
import type { LeaderboardRealtimeUpdate } from "@/store/useLeaderboardStore";
import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";

const API_BASE_URL =
  import.meta.env.VITE_CHALLENGE_API_URL ?? "http://localhost:5004";

export type RealtimeCallbacks = {
  onConnected?: () => void;
  onDisconnected?: () => void;
  onUpdate?: (payload: LeaderboardRealtimeUpdate) => void;
  onError?: (error: unknown) => void;
};

export async function connectLeaderboardRealtime(
  eventId: string,
  callbacks: RealtimeCallbacks,
) {
  const accessTokenFactory = () => useAuthStore.getState().token ?? "";

  const connection = new HubConnectionBuilder()
    .withUrl(`${API_BASE_URL}/hubs/leaderboard`, {
      accessTokenFactory,
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();

  connection.on("leaderboard.updated", (payload: LeaderboardRealtimeUpdate) => {
    callbacks.onUpdate?.(payload);
  });

  connection.onreconnected(async () => {
    try {
      await connection.invoke("JoinEventGroup", eventId);
      callbacks.onConnected?.();
    } catch (error) {
      callbacks.onError?.(error);
    }
  });

  connection.onclose(() => {
    callbacks.onDisconnected?.();
  });

  try {
    await connection.start();
    await connection.invoke("JoinEventGroup", eventId);
    callbacks.onConnected?.();
  } catch (error) {
    callbacks.onError?.(error);
  }

  return {
    connection,
    disconnect: async () => {
      if (connection.state === HubConnectionState.Connected) {
        await connection.invoke("LeaveEventGroup", eventId);
      }

      await connection.stop();
    },
  };
}
