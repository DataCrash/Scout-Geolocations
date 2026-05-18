import { Button } from "@/components/ui/button";
import { useNfc } from "@/hooks/useNfc";
import {
  createChallenge,
  deleteChallenge,
  listChallengesByEvent,
  updateChallengeStatus,
  type ChallengeItem,
} from "@/services/adminChallengesApi";
import { validateChallenge } from "@/services/challengeApi";
import { connectLeaderboardRealtime } from "@/services/leaderboardRealtime";
import { parseNfcPayload } from "@/services/nfcPayload";
import {
  enqueueCheckinSubmission,
  flushCheckinQueue,
  getQueuedCheckinsCount,
} from "@/services/offlineCheckinQueue";
import {
  analyzePhotoLocally,
  type PhotoInferenceResult,
} from "@/services/photoInference";
import {
  analyzePhotoWithVisionApi,
  type VisionAnalysisResponse,
} from "@/services/visionApi";
import { useAuthStore } from "@/store/useAuthStore";
import { useLeaderboardHistoryStore } from "@/store/useLeaderboardHistoryStore";
import { useLeaderboardStore } from "@/store/useLeaderboardStore";
import { useSharedRoutesStore } from "@/store/useSharedRoutesStore";
import {
  BADGE_CATALOG,
  useSocialBadgeStore,
} from "@/store/useSocialBadgeStore";
import L from "leaflet";
import {
  Award,
  Camera,
  Compass,
  LogOut,
  QrCode,
  Share2,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const center: [number, number] = [-23.5505, -46.6333];

function getChallengeTypeLabel(type: number) {
  switch (type) {
    case 0:
      return "QR Code";
    case 1:
      return "Geolocalização";
    case 2:
      return "QR + Geolocalização";
    case 3:
      return "Photo Challenge";
    default:
      return "Desconhecido";
  }
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { eventId, scores, bumpPatrol, applyRealtimeUpdate, lastRealtimeAt } =
    useLeaderboardStore();
  const { byEventId, upsertEventSnapshot } = useLeaderboardHistoryStore();
  const { routesByEventId, shareRoute } = useSharedRoutesStore();
  const { unlockedBadgeIds, lastSyncedAt, syncFromScores } =
    useSocialBadgeStore();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [challengeId, setChallengeId] = useState(
    "00000000-0000-0000-0000-000000000010",
  );
  const [patrulhaId, setPatrulhaId] = useState(
    "11111111-1111-1111-1111-111111111111",
  );
  const [userId, setUserId] = useState(
    user?.id || "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  );
  const [qrCode, setQrCode] = useState("");
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkinMessage, setCheckinMessage] = useState<string>("");
  const [adminChallenges, setAdminChallenges] = useState<ChallengeItem[]>([]);
  const [adminTitle, setAdminTitle] = useState("Novo desafio QR");
  const [adminDescription, setAdminDescription] = useState(
    "Valide com QR no ponto A.",
  );
  const [adminType, setAdminType] = useState<number>(0);
  const [adminQr, setAdminQr] = useState("QR-DEMO-001");
  const [adminMessage, setAdminMessage] = useState<string>("");
  const [routeName, setRouteName] = useState("Rota Trilha Norte");
  const [routeWaypoints, setRouteWaypoints] = useState(
    "Pórtico -> Bosque -> Lago",
  );
  const [routeMessage, setRouteMessage] = useState<string>("");
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraMessage, setCameraMessage] = useState<string>("");
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [photoInference, setPhotoInference] =
    useState<PhotoInferenceResult | null>(null);
  const [backendVisionResult, setBackendVisionResult] =
    useState<VisionAnalysisResponse | null>(null);
  const [isBackendVisionLoading, setIsBackendVisionLoading] = useState(false);
  const {
    isSupported: isNfcSupported,
    isScanning: isNfcScanning,
    lastPayload: nfcPayload,
    error: nfcError,
    startScan: startNfcScan,
    stopScan: stopNfcScan,
  } = useNfc();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

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

  useEffect(() => {
    return () => {
      const stream = cameraStreamRef.current;
      if (!stream) {
        return;
      }

      stream.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
      stopNfcScan();
    };
  }, [stopNfcScan]);

  useEffect(() => {
    if (!nfcPayload) {
      return;
    }

    const parsed = parseNfcPayload(nfcPayload);

    if (parsed.patrulhaId) {
      setPatrulhaId(parsed.patrulhaId);
    }

    if (parsed.checkinCode) {
      setQrCode(parsed.checkinCode);
    }

    const details = [
      parsed.patrulhaId ? `Patrulha: ${parsed.patrulhaId}` : null,
      parsed.checkinCode ? `QR/Code: ${parsed.checkinCode}` : null,
    ]
      .filter(Boolean)
      .join(" | ");

    setCheckinMessage(
      details
        ? `Tag NFC lida com sucesso. ${details}`
        : `Tag NFC lida com sucesso: ${parsed.raw}`,
    );
  }, [nfcPayload]);

  useEffect(() => {
    syncFromScores(scores);
  }, [scores, syncFromScores]);

  useEffect(() => {
    upsertEventSnapshot(eventId, scores);
  }, [eventId, scores, upsertEventSnapshot]);

  const eventHistory = Object.values(byEventId)
    .sort(
      (a, b) =>
        new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime(),
    )
    .slice(0, 5);
  const sharedRoutes = routesByEventId[eventId] ?? [];

  const bestPoints = scores.length
    ? Math.max(...scores.map((score) => score.points))
    : 0;
  const bestValidatedChallenges = scores.length
    ? Math.max(...scores.map((score) => score.validatedChallenges))
    : 0;

  useEffect(() => {
    let active = true;

    async function syncOfflineQueue() {
      if (!navigator.onLine) {
        return;
      }

      try {
        const result = await flushCheckinQueue(validateChallenge);
        if (!active || result.synced <= 0) {
          return;
        }

        setCheckinMessage(
          `Sincronização offline concluída: ${result.synced} submissão(ões) enviada(s).`,
        );
      } catch {
        if (active) {
          setCheckinMessage(
            "Falha ao sincronizar fila offline. Tentaremos novamente ao reconectar.",
          );
        }
      }
    }

    void syncOfflineQueue();

    const handleOnline = () => {
      void syncOfflineQueue();
    };

    window.addEventListener("online", handleOnline);

    return () => {
      active = false;
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  async function refreshAdminChallenges() {
    setIsAdminLoading(true);
    setAdminMessage("");

    try {
      const items = await listChallengesByEvent(eventId);
      setAdminChallenges(items);
    } catch (error) {
      setAdminMessage(
        error instanceof Error ? error.message : "Falha ao carregar desafios.",
      );
    } finally {
      setIsAdminLoading(false);
    }
  }

  async function handleCreateAdminChallenge() {
    setIsAdminLoading(true);
    setAdminMessage("");

    try {
      await createChallenge({
        eventId,
        title: adminTitle,
        description: adminDescription,
        type: adminType,
        qrCode: adminType === 0 || adminType === 2 ? adminQr : undefined,
        radiusMeters: 30,
        basePoints: 10,
        bonusPoints: 5,
        bonusTimeSeconds: 0,
      });

      await refreshAdminChallenges();
      setAdminMessage("Desafio criado com sucesso.");
    } catch (error) {
      setAdminMessage(
        error instanceof Error ? error.message : "Falha ao criar desafio.",
      );
      setIsAdminLoading(false);
    }
  }

  async function handleToggleStatus(challenge: ChallengeItem) {
    const nextStatus = challenge.status === 1 ? 2 : 1;

    try {
      await updateChallengeStatus(challenge.id, nextStatus);
      await refreshAdminChallenges();
    } catch (error) {
      setAdminMessage(
        error instanceof Error ? error.message : "Falha ao atualizar status.",
      );
    }
  }

  async function handleDeleteChallenge(challengeId: string) {
    try {
      await deleteChallenge(challengeId);
      await refreshAdminChallenges();
    } catch (error) {
      setAdminMessage(
        error instanceof Error ? error.message : "Falha ao excluir desafio.",
      );
    }
  }

  async function handleCaptureLocation() {
    if (!navigator.geolocation) {
      setCheckinMessage("Geolocalização não suportada no navegador.");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(String(position.coords.latitude));
        setLongitude(String(position.coords.longitude));
        setIsLocating(false);
      },
      () => {
        setCheckinMessage("Não foi possível obter a localização atual.");
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
      },
    );
  }

  async function handleOpenCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraMessage("Câmera não suportada neste navegador.");
      return;
    }

    setIsCameraLoading(true);
    setCameraMessage("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
        },
        audio: false,
      });

      cameraStreamRef.current = stream;
      setIsCameraOpen(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setCameraMessage("Não foi possível acessar a câmera.");
      setIsCameraOpen(false);
    } finally {
      setIsCameraLoading(false);
    }
  }

  function handleCloseCamera() {
    const stream = cameraStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    cameraStreamRef.current = null;
    setIsCameraOpen(false);
  }

  async function handleTakePhoto() {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) {
      setCameraMessage("A câmera ainda não está pronta para captura.");
      return;
    }

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      setCameraMessage("Falha ao preparar captura da imagem.");
      return;
    }

    context.drawImage(video, 0, 0, width, height);
    const capturedPhoto = canvas.toDataURL("image/jpeg", 0.85);
    setPhotoPreview(capturedPhoto);

    try {
      const inference = await analyzePhotoLocally(capturedPhoto);
      setPhotoInference(inference);
      setBackendVisionResult(null);
      setCameraMessage(
        inference.requiresBackendFallback
          ? `Inferência local inconclusiva (${Math.round(inference.confidence * 100)}%). Próximo passo: fallback backend.`
          : `Inferência local: ${inference.label} (${Math.round(inference.confidence * 100)}% de confiança).`,
      );
    } catch {
      setPhotoInference(null);
      setBackendVisionResult(null);
      setCameraMessage(
        "Foto capturada, mas a inferência local falhou. Próximo passo: fallback backend.",
      );
    }
  }

  async function handleAnalyzePhotoFallback() {
    if (!photoPreview) {
      setCameraMessage("Capture uma foto antes de chamar o fallback backend.");
      return;
    }

    setIsBackendVisionLoading(true);

    try {
      const result = await analyzePhotoWithVisionApi(photoPreview);
      setBackendVisionResult(result);
      setCameraMessage(
        `${result.summary} (${Math.round(result.confidence * 100)}% de confiança).`,
      );
    } catch (error) {
      setBackendVisionResult(null);
      setCameraMessage(
        error instanceof Error
          ? error.message
          : "Falha ao executar fallback backend.",
      );
    } finally {
      setIsBackendVisionLoading(false);
    }
  }

  async function handleValidateCheckin() {
    setIsSubmitting(true);
    setCheckinMessage("");

    const payload = {
      PatrulhaId: patrulhaId,
      UserId: userId,
      ScannedQrCode: qrCode || undefined,
      Latitude: latitude ? Number(latitude) : undefined,
      Longitude: longitude ? Number(longitude) : undefined,
      PhotoBase64: photoPreview || undefined,
    };

    try {
      const result = await validateChallenge(challengeId, payload);

      if (result.status === 1) {
        setCheckinMessage(
          `Check-in validado: +${result.pointsAwarded} pontos.`,
        );
      } else if (result.status === 0) {
        setCheckinMessage(
          result.failReason ??
            "Submissão recebida e pendente de validação manual.",
        );
      } else {
        setCheckinMessage(
          result.failReason ?? "Check-in processado, mas sem validação.",
        );
      }
    } catch (error) {
      const isNetworkError =
        !navigator.onLine ||
        (error instanceof TypeError &&
          /fetch|network|failed/i.test(error.message));

      if (isNetworkError) {
        try {
          await enqueueCheckinSubmission(challengeId, payload);
          const queueSize = await getQueuedCheckinsCount();

          setCheckinMessage(
            `Sem conexão. Check-in salvo na fila offline (${queueSize} pendente(s)).`,
          );
          return;
        } catch {
          setCheckinMessage(
            "Sem conexão e não foi possível salvar na fila offline.",
          );
          return;
        }
      }

      setCheckinMessage(
        error instanceof Error ? error.message : "Erro no check-in.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleShareRoute() {
    const trimmedName = routeName.trim();
    const trimmedWaypoints = routeWaypoints.trim();

    if (!trimmedName || !trimmedWaypoints) {
      setRouteMessage("Informe nome e waypoints da rota para compartilhar.");
      return;
    }

    shareRoute(eventId, {
      name: trimmedName,
      waypoints: trimmedWaypoints,
      sharedBy: user?.name ?? "Monitor",
    });
    setRouteMessage("Rota compartilhada com sucesso.");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(34,211,238,0.22),transparent_35%),radial-gradient(circle_at_85%_10%,rgba(251,146,60,0.2),transparent_30%),linear-gradient(140deg,#f2fbfe_0%,#eff6ff_45%,#fffaf2_100%)]" />

      {/* Header com user info */}
      <header className="relative border-b border-border/60 bg-card/85 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 md:px-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Bem-vindo,</p>
            <p className="text-lg font-semibold">{user?.name}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

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
            <Button
              onClick={() =>
                bumpPatrol("11111111-1111-1111-1111-111111111111", 15)
              }
            >
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
                Última atualização:{" "}
                {new Date(lastRealtimeAt).toLocaleTimeString("pt-BR")}
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

          <div className="mt-6 rounded-2xl border border-border/70 bg-white/70 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <QrCode className="h-4 w-4" />
              Check-in por QR (real)
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                value={challengeId}
                onChange={(event) => setChallengeId(event.target.value)}
                className="rounded-xl border border-border bg-white px-3 py-2 text-sm"
                placeholder="ChallengeId"
              />
              <input
                value={patrulhaId}
                onChange={(event) => setPatrulhaId(event.target.value)}
                className="rounded-xl border border-border bg-white px-3 py-2 text-sm"
                placeholder="PatrulhaId"
              />
              <input
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                className="rounded-xl border border-border bg-white px-3 py-2 text-sm"
                placeholder="UserId"
              />
              <input
                value={qrCode}
                onChange={(event) => setQrCode(event.target.value)}
                className="rounded-xl border border-border bg-white px-3 py-2 text-sm"
                placeholder="Conteúdo do QR Code"
              />
              <input
                value={latitude}
                onChange={(event) => setLatitude(event.target.value)}
                className="rounded-xl border border-border bg-white px-3 py-2 text-sm"
                placeholder="Latitude"
              />
              <input
                value={longitude}
                onChange={(event) => setLongitude(event.target.value)}
                className="rounded-xl border border-border bg-white px-3 py-2 text-sm"
                placeholder="Longitude"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                variant="ghost"
                onClick={handleCaptureLocation}
                disabled={isLocating}
              >
                {isLocating
                  ? "Capturando localização..."
                  : "Usar minha localização"}
              </Button>
              {isNfcSupported ? (
                <Button
                  variant="ghost"
                  onClick={isNfcScanning ? stopNfcScan : startNfcScan}
                >
                  {isNfcScanning
                    ? "Parar leitura NFC"
                    : "Ler tag NFC (fallback do QR)"}
                </Button>
              ) : (
                <span className="inline-flex items-center rounded-xl border border-border/70 bg-white px-3 py-2 text-xs text-muted-foreground">
                  WebNFC indisponível neste dispositivo. Use QR manual.
                </span>
              )}
              <Button onClick={handleValidateCheckin} disabled={isSubmitting}>
                {isSubmitting ? "Validando..." : "Validar check-in"}
              </Button>
            </div>

            {nfcError && (
              <p className="mt-3 text-sm text-amber-700">{nfcError}</p>
            )}

            {checkinMessage && (
              <p className="mt-3 text-sm text-muted-foreground">
                {checkinMessage}
              </p>
            )}
          </div>

          <div className="mt-6 rounded-2xl border border-border/70 bg-white/70 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Camera className="h-4 w-4" />
              Photo Challenge (M2 preview)
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="ghost"
                onClick={handleOpenCamera}
                disabled={isCameraLoading || isCameraOpen}
              >
                {isCameraLoading ? "Abrindo câmera..." : "Abrir câmera"}
              </Button>
              <Button onClick={handleTakePhoto} disabled={!isCameraOpen}>
                Capturar foto
              </Button>
              <Button
                variant="ghost"
                onClick={handleCloseCamera}
                disabled={!isCameraOpen}
              >
                Fechar câmera
              </Button>
              <Button
                variant="ghost"
                onClick={handleAnalyzePhotoFallback}
                disabled={!photoPreview || isBackendVisionLoading}
              >
                {isBackendVisionLoading
                  ? "Chamando fallback backend..."
                  : "Executar fallback backend"}
              </Button>
            </div>

            {isCameraOpen && (
              <div className="mt-3 overflow-hidden rounded-xl border border-border/70 bg-black/80">
                <video
                  ref={videoRef}
                  className="h-auto w-full"
                  playsInline
                  muted
                />
              </div>
            )}

            {photoPreview && (
              <div className="mt-3 overflow-hidden rounded-xl border border-border/70 bg-white">
                <img
                  src={photoPreview}
                  alt="Prévia da foto capturada"
                  className="h-auto w-full"
                />
              </div>
            )}

            {photoInference && (
              <div className="mt-3 rounded-xl border border-border/70 bg-white p-3 text-sm text-muted-foreground">
                <p>
                  Motor local: <strong>{photoInference.engine}</strong>
                </p>
                <p>
                  Rótulo estimado: <strong>{photoInference.label}</strong>
                </p>
                <p>
                  Confiança:{" "}
                  <strong>
                    {Math.round(photoInference.confidence * 100)}%
                  </strong>
                </p>
                <p>
                  Contraste:{" "}
                  <strong>{photoInference.contrast.toFixed(3)}</strong>
                </p>
                <p>
                  Decisão:{" "}
                  <strong>
                    {photoInference.requiresBackendFallback
                      ? "encaminhar para fallback backend"
                      : "classificação local suficiente para triagem"}
                  </strong>
                </p>
              </div>
            )}

            {backendVisionResult && (
              <div className="mt-3 rounded-xl border border-border/70 bg-white p-3 text-sm text-muted-foreground">
                <p>
                  Motor backend: <strong>{backendVisionResult.engine}</strong>
                </p>
                <p>
                  Rótulo backend: <strong>{backendVisionResult.label}</strong>
                </p>
                <p>
                  Confiança backend:{" "}
                  <strong>
                    {Math.round(backendVisionResult.confidence * 100)}%
                  </strong>
                </p>
                <p>
                  Revisão manual:{" "}
                  <strong>
                    {backendVisionResult.requiresManualReview
                      ? "necessária"
                      : "dispensada na triagem"}
                  </strong>
                </p>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

            {cameraMessage && (
              <p className="mt-3 text-sm text-muted-foreground">
                {cameraMessage}
              </p>
            )}
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

          <div className="mt-8 rounded-2xl border border-border/70 bg-white/75 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Trophy className="h-4 w-4" />
              Histórico entre eventos
            </div>

            <ul className="space-y-2" aria-label="historico-entre-eventos">
              {eventHistory.map((snapshot) => {
                const leader = snapshot.scores[0];

                return (
                  <li
                    key={snapshot.eventId}
                    className="rounded-xl border border-border/70 bg-white p-3"
                  >
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Evento {snapshot.eventId.slice(0, 8)}
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {leader
                        ? `${leader.name}: ${leader.points} pts`
                        : "Sem pontuação registrada"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Atualizado às{" "}
                      {new Date(snapshot.capturedAt).toLocaleTimeString(
                        "pt-BR",
                      )}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="mt-8 rounded-2xl border border-border/70 bg-white/75 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Award className="h-4 w-4" />
              Badges do evento
            </div>

            <div className="space-y-3">
              {BADGE_CATALOG.map((badge) => {
                const isUnlocked = unlockedBadgeIds.includes(badge.id);

                return (
                  <div
                    key={badge.id}
                    className={`rounded-2xl border p-4 transition ${
                      isUnlocked
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-border/70 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          {isUnlocked ? "Desbloqueado" : "Pendente"}
                        </p>
                        <h3 className="mt-1 text-base font-semibold">
                          {badge.title}
                        </h3>
                      </div>
                      <span className="rounded-full border border-border/70 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        {isUnlocked ? "Ativo" : "Meta"}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-muted-foreground">
                      {badge.description}
                    </p>

                    <p className="mt-3 text-xs text-muted-foreground">
                      {badge.thresholdPoints !== undefined && (
                        <span className="block">
                          Meta de pontos: {badge.thresholdPoints}
                          {!isUnlocked && bestPoints < badge.thresholdPoints
                            ? ` · faltam ${badge.thresholdPoints - bestPoints}`
                            : ""}
                        </span>
                      )}
                      {badge.thresholdChallenges !== undefined && (
                        <span className="block">
                          Meta de desafios: {badge.thresholdChallenges}
                          {!isUnlocked &&
                          bestValidatedChallenges < badge.thresholdChallenges
                            ? ` · faltam ${badge.thresholdChallenges - bestValidatedChallenges}`
                            : ""}
                        </span>
                      )}
                    </p>
                  </div>
                );
              })}
            </div>

            {lastSyncedAt && (
              <p className="mt-3 text-xs text-muted-foreground">
                Sincronizado com o ranking às{" "}
                {new Date(lastSyncedAt).toLocaleTimeString("pt-BR")}.
              </p>
            )}
          </div>

          <div className="mt-8 rounded-2xl border border-border/70 bg-white/75 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Share2 className="h-4 w-4" />
              Rotas compartilhadas
            </div>

            <div className="grid grid-cols-1 gap-2">
              <input
                className="rounded-xl border border-border bg-white px-3 py-2 text-sm"
                placeholder="Nome da rota"
                value={routeName}
                onChange={(event) => setRouteName(event.target.value)}
              />
              <textarea
                className="min-h-[76px] rounded-xl border border-border bg-white px-3 py-2 text-sm"
                placeholder="Waypoints da rota"
                value={routeWaypoints}
                onChange={(event) => setRouteWaypoints(event.target.value)}
              />
            </div>

            <div className="mt-3 flex gap-2">
              <Button onClick={handleShareRoute}>Compartilhar rota</Button>
            </div>

            {routeMessage && (
              <p className="mt-2 text-sm text-muted-foreground">
                {routeMessage}
              </p>
            )}

            <ul className="mt-4 space-y-2" aria-label="rotas-compartilhadas">
              {sharedRoutes.slice(0, 5).map((route) => (
                <li
                  key={route.id}
                  className="rounded-xl border border-border bg-white p-3"
                >
                  <p className="text-sm font-semibold">{route.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {route.waypoints}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Compartilhada por {route.sharedBy}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 rounded-2xl border border-border/70 bg-white/75 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ShieldCheck className="h-4 w-4" />
              Admin · CRUD de desafios
            </div>

            <div className="grid grid-cols-1 gap-2">
              <select
                className="rounded-xl border border-border bg-white px-3 py-2 text-sm"
                value={adminType}
                onChange={(event) => setAdminType(Number(event.target.value))}
              >
                <option value={0}>QR Code</option>
                <option value={1}>Geolocalização</option>
                <option value={2}>QR + Geolocalização</option>
                <option value={3}>Photo Challenge (manual)</option>
              </select>
              <input
                className="rounded-xl border border-border bg-white px-3 py-2 text-sm"
                value={adminTitle}
                onChange={(event) => setAdminTitle(event.target.value)}
                placeholder="Título"
              />
              <input
                className="rounded-xl border border-border bg-white px-3 py-2 text-sm"
                value={adminDescription}
                onChange={(event) => setAdminDescription(event.target.value)}
                placeholder="Descrição"
              />
              <input
                className="rounded-xl border border-border bg-white px-3 py-2 text-sm"
                value={adminQr}
                onChange={(event) => setAdminQr(event.target.value)}
                placeholder="QR esperado (somente tipos com QR)"
                disabled={adminType !== 0 && adminType !== 2}
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                onClick={handleCreateAdminChallenge}
                disabled={isAdminLoading}
              >
                Criar desafio
              </Button>
              <Button
                variant="ghost"
                onClick={refreshAdminChallenges}
                disabled={isAdminLoading}
              >
                {isAdminLoading ? "Atualizando..." : "Recarregar lista"}
              </Button>
            </div>

            {adminMessage && (
              <p className="mt-2 text-sm text-muted-foreground">
                {adminMessage}
              </p>
            )}

            <ul className="mt-4 space-y-2">
              {adminChallenges.map((challenge) => (
                <li
                  key={challenge.id}
                  className="rounded-xl border border-border bg-white p-3"
                >
                  <p className="text-sm font-semibold">{challenge.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Tipo: {getChallengeTypeLabel(challenge.type)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Status: {challenge.status === 1 ? "Ativo" : "Inativo/Draft"}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleStatus(challenge)}
                    >
                      {challenge.status === 1 ? "Inativar" : "Ativar"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteChallenge(challenge.id)}
                    >
                      Excluir
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}
