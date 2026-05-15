import { expect, test } from "@playwright/test";
import {
  type AttemptResponse,
  authHeader,
  challengeApiUrl,
  createPatrulha,
  type GuestAuthResponse,
  hasSeedChallenge,
  identityApiUrl,
  type PatrulhaScoreResponse,
  probeChallengeAuthStatus,
  runRealBackend,
  runRealBackendSkipMessage,
  seedChallengeId,
  seedChallengeQrCode,
  seedEventId,
  serviceUnavailableMessage,
} from "./support/real-backend.helpers.js";

const challengeId = seedChallengeId;
const qrCode = seedChallengeQrCode;

test.describe("frontend MVP com backend real", () => {
  test.skip(!runRealBackend, runRealBackendSkipMessage);

  let auth: GuestAuthResponse;

  test.beforeAll(async ({ request }) => {
    const identityHealth = await request.get(`${identityApiUrl}/health`);
    test.skip(
      !identityHealth.ok(),
      serviceUnavailableMessage("Identity API", identityApiUrl),
    );

    const challengeHealth = await request.get(`${challengeApiUrl}/health`);
    test.skip(
      !challengeHealth.ok(),
      serviceUnavailableMessage("Challenge API", challengeApiUrl),
    );

    const loginResponse = await request.post(`${identityApiUrl}/auth/guest`, {
      data: {
        name: `E2E Guest ${Date.now()}`,
      },
    });

    expect(loginResponse.ok()).toBeTruthy();
    auth = (await loginResponse.json()) as GuestAuthResponse;

    const challengeAuthStatus = await probeChallengeAuthStatus(
      request,
      auth.token,
      seedEventId,
    );

    test.skip(
      challengeAuthStatus === 401,
      "Token guest do Identity foi rejeitado pela Challenge API. Alinhe Jwt:Key, Jwt:Issuer e Jwt:Audience entre os dois serviços para execução integrada.",
    );
  });

  test("valida token guest real no endpoint /auth/me", async ({ request }) => {
    const meResponse = await request.get(`${identityApiUrl}/auth/me`, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    });

    expect(meResponse.ok()).toBeTruthy();

    const me = (await meResponse.json()) as {
      id: string;
      name: string;
      email?: string | null;
      role: string;
    };

    expect(me.id).toBe(auth.userId);
    expect(me.name).toContain("E2E Guest");
    expect(me.role).toBe("Convidado");
  });

  test("executa tentativa de check-in real sem mocks", async ({
    page,
    context,
    request,
  }) => {
    const patrulha = await createPatrulha(request, auth.token);

    await context.grantPermissions(["geolocation"], {
      origin: "http://127.0.0.1:4173",
    });
    await context.setGeolocation({ latitude: -23.55052, longitude: -46.63331 });

    await page.addInitScript((token) => {
      localStorage.setItem("access_token", token);
    }, auth.token);

    await page.goto("/");

    await page.getByPlaceholder("ChallengeId").fill(challengeId);
    await page.getByPlaceholder("PatrulhaId").fill(patrulha.id);
    await page.getByPlaceholder("UserId").fill(auth.userId);
    await page.getByPlaceholder("Conteúdo do QR Code").fill(qrCode);

    await page.getByRole("button", { name: /Usar minha localização/i }).click();
    await expect(page.getByPlaceholder("Latitude")).toHaveValue("-23.55052");
    await expect(page.getByPlaceholder("Longitude")).toHaveValue("-46.63331");

    await page.getByRole("button", { name: /Validar check-in/i }).click();

    await expect(
      page.getByText(
        /Check-in validado|QR Code inválido|não encontrado|já validou|não está ativo|sem validação|Falha ao validar check-in|Erro no check-in/i,
      ),
    ).toBeVisible();
  });

  test("executa check-in real deterministico com seed e valida score", async ({
    page,
    context,
    request,
  }) => {
    const seedAvailable = await hasSeedChallenge(
      request,
      auth.token,
      challengeId,
    );
    test.skip(
      !seedAvailable,
      "Challenge seed nao encontrado. Execute Challenge API em Development para carregar DevDataSeeder.",
    );

    const patrulha = await createPatrulha(request, auth.token);

    await context.grantPermissions(["geolocation"], {
      origin: "http://127.0.0.1:4173",
    });
    await context.setGeolocation({ latitude: -23.55052, longitude: -46.63331 });

    await page.addInitScript((token) => {
      localStorage.setItem("access_token", token);
    }, auth.token);

    await page.goto("/");

    await page.getByPlaceholder("ChallengeId").fill(challengeId);
    await page.getByPlaceholder("PatrulhaId").fill(patrulha.id);
    await page.getByPlaceholder("UserId").fill(auth.userId);
    await page.getByPlaceholder("Conteúdo do QR Code").fill(qrCode);

    await page.getByRole("button", { name: /Usar minha localização/i }).click();
    await expect(page.getByPlaceholder("Latitude")).toHaveValue("-23.55052");
    await expect(page.getByPlaceholder("Longitude")).toHaveValue("-46.63331");

    await page.getByRole("button", { name: /Validar check-in/i }).click();
    await expect(
      page.getByText(/Check-in validado: \+25 pontos\./i),
    ).toBeVisible();

    const scoreResponse = await request.get(
      `${challengeApiUrl}/api/challenges/score?patrulhaId=${patrulha.id}&eventId=${seedEventId}`,
      {
        headers: {
          ...authHeader(auth.token),
        },
      },
    );

    expect(scoreResponse.ok()).toBeTruthy();

    const score = (await scoreResponse.json()) as PatrulhaScoreResponse;
    expect(score.patrulhaId).toBe(patrulha.id);
    expect(score.eventId).toBe(seedEventId);
    expect(score.totalPoints).toBe(25);
    expect(score.validatedChallenges).toBe(1);
    expect(score.totalAttempts).toBe(1);

    const duplicateResponse = await request.post(
      `${challengeApiUrl}/api/challenges/${challengeId}/validate`,
      {
        headers: {
          ...authHeader(auth.token),
        },
        data: {
          patrulhaId: patrulha.id,
          userId: auth.userId,
          scannedQrCode: qrCode,
          latitude: -23.55052,
          longitude: -46.63331,
        },
      },
    );

    expect(duplicateResponse.status()).toBe(409);

    const duplicateError = await duplicateResponse.text();
    expect(duplicateError).toContain("já validou");
  });

  test("retorna tentativa falha com QR invalido e score permanece zero", async ({
    request,
  }) => {
    const seedAvailable = await hasSeedChallenge(
      request,
      auth.token,
      challengeId,
    );
    test.skip(
      !seedAvailable,
      "Challenge seed nao encontrado. Execute Challenge API em Development para carregar DevDataSeeder.",
    );

    const patrulha = await createPatrulha(request, auth.token);

    const failedAttemptResponse = await request.post(
      `${challengeApiUrl}/api/challenges/${challengeId}/validate`,
      {
        headers: {
          ...authHeader(auth.token),
        },
        data: {
          patrulhaId: patrulha.id,
          userId: auth.userId,
          scannedQrCode: `${qrCode}-INVALID`,
          latitude: -23.55052,
          longitude: -46.63331,
        },
      },
    );

    expect(failedAttemptResponse.ok()).toBeTruthy();

    const failedAttempt =
      (await failedAttemptResponse.json()) as AttemptResponse;
    expect(failedAttempt.status).toBe(2);
    expect(failedAttempt.pointsAwarded).toBe(0);
    expect(failedAttempt.failReason).toContain("QR Code inválido");

    const scoreResponse = await request.get(
      `${challengeApiUrl}/api/challenges/score?patrulhaId=${patrulha.id}&eventId=${seedEventId}`,
      {
        headers: {
          ...authHeader(auth.token),
        },
      },
    );

    expect(scoreResponse.ok()).toBeTruthy();

    const score = (await scoreResponse.json()) as PatrulhaScoreResponse;
    expect(score.patrulhaId).toBe(patrulha.id);
    expect(score.eventId).toBe(seedEventId);
    expect(score.totalPoints).toBe(0);
    expect(score.validatedChallenges).toBe(0);
    expect(score.totalAttempts).toBe(1);
  });
});
