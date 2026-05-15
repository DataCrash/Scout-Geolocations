import { Button } from "@/components/ui/button";
import { connectLeaderboardRealtime } from "@/services/leaderboardRealtime";
import { useLeaderboardStore } from "@/store/useLeaderboardStore";
import L from "leaflet";
import { Compass, Trophy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const center: [number, number] = [-23.5505, -46.6333];

function App() {
  const { eventId, scores, bumpPatrol, applyRealtimeUpdate, lastRealtimeAt } =
    useLeaderboardStore();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    const map = L.map(mapRef.current, {
      center,
      zoom: 15,
      zoomControl: false,
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    L.circle(center, {
      radius: 120,
      color: "#0891b2",
      fillColor: "#22d3ee",
      fillOpacity: 0.2,
    }).addTo(map);

    L.circle([-23.5513, -46.6349], {
      radius: 80,
      color: "#ea580c",
      fillColor: "#fb923c",
      fillOpacity: 0.22,
    }).addTo(map);

    return () => {
      map.remove();
    };
  }, []);

  useEffect(() => {
    let active = true;
    let stop: (() => Promise<void>) | undefined;

    connectLeaderboardRealtime(eventId, {
      onConnected: () => {
        if (active) {
          setIsRealtimeConnected(true);
        }
      },
      onDisconnected: () => {
        if (active) {
          setIsRealtimeConnected(false);
        }
      },
      onUpdate: (payload) => {
        applyRealtimeUpdate(payload);
      },
      onError: () => {
        if (active) {
          setIsRealtimeConnected(false);
        }
      },
    }).then((client) => {
      stop = client.disconnect;
    });

    return () => {
      active = false;
      void stop?.();
    };
  }, [applyRealtimeUpdate, eventId]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(34,211,238,0.22),transparent_35%),radial-gradient(circle_at_85%_10%,rgba(251,146,60,0.2),transparent_30%),linear-gradient(140deg,#f2fbfe_0%,#eff6ff_45%,#fffaf2_100%)]" />

      <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 py-8 md:px-8 lg:grid-cols-[1.1fr_1fr] lg:py-12">
        <section className="animate-fade-up rounded-3xl border border-border/60 bg-card/85 p-6 shadow-xl backdrop-blur md:p-8">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Scout Geolocations · MVP
          </p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight md:text-5xl">
            Painel tático de caça: mapa, check-in e ranking em tempo real
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-muted-foreground md:text-base">
            Base inicial do frontend com React, Tailwind, Zustand, Leaflet e
            componentes no padrão shadcn/ui.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button onClick={() => bumpPatrol("11111111-1111-1111-1111-111111111111", 15)}>
              Simular validação (+15)
            </Button>
            <Button variant="ghost">Evento: {eventId}</Button>
            <span
              className={`rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${
                isRealtimeConnected
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              }`}
            >
              {isRealtimeConnected ? "SignalR conectado" : "SignalR offline"}
            </span>
            {lastRealtimeAt && (
              <span className="text-xs text-muted-foreground">
                Última atualização: {new Date(lastRealtimeAt).toLocaleTimeString("pt-BR")}
              </span>
            )}
          </div>

          <div className="mt-8 rounded-2xl border border-border/70 bg-white/70 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Compass className="h-4 w-4" />
              Mapa de atividades
            </div>
            <div className="h-[300px] overflow-hidden rounded-xl md:h-[360px]">
              <div ref={mapRef} className="h-full w-full" />
            </div>
          </div>
        </section>

        <aside className="animate-fade-up rounded-3xl border border-border/60 bg-card/90 p-6 shadow-xl backdrop-blur [animation-delay:130ms] md:p-8">
          <div className="mb-5 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Trophy className="h-4 w-4" />
            Leaderboard ao vivo
          </div>

          <ul className="space-y-3">
            {scores.map((score, index) => (
              <li
                key={score.id}
                className="rounded-2xl border border-border/70 bg-white/75 p-4 transition hover:translate-y-[-1px]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      {index + 1}º lugar
                    </p>
                    <h3 className="mt-1 text-lg font-semibold">{score.name}</h3>
                  </div>
                  <p className="font-mono text-lg font-semibold text-primary">
                    {score.points} pts
                  </p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {score.validatedChallenges} desafios validados
                </p>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </main>
  );
}

export default App;
