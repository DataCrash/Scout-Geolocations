import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import {
  authHeader,
  challengeApiUrl,
  type ChallengeResponse,
  createRoleToken,
  probeChallengeAuthStatus,
  runRealBackend,
  runRealBackendSkipMessage,
  seedEventId,
  serviceUnavailableMessage,
  type AttemptResponse,
} from "./support/real-backend.helpers.js";

test.describe("frontend real: photo challenge ponta a ponta", () => {
  test.skip(!runRealBackend, runRealBackendSkipMessage);

  let adminToken: string;
  let memberToken: string;

  test.beforeAll(async ({ request }) => {
    const challengeHealth = await request.get(`${challengeApiUrl}/health`);
    test.skip(
      !challengeHealth.ok(),
      serviceUnavailableMessage("Challenge API", challengeApiUrl),
    );

    adminToken = createRoleToken("ChefesEscoteiro");
    memberToken = createRoleToken("Integrante");

    const authProbeStatus = await probeChallengeAuthStatus(
      request,
      adminToken,
      seedEventId,
    );

    test.skip(
      authProbeStatus === 401,
      "JWT de teste rejeitado pela Challenge API. Configure REAL_E2E_JWT_KEY, REAL_E2E_JWT_ISSUER e REAL_E2E_JWT_AUDIENCE de acordo com o ambiente alvo.",
    );
  });

  test("captura foto, executa fallback backend e valida tentativa Pending", async ({
    request,
    page,
  }) => {
    const userId = randomUUID();
    const patrulhaId = randomUUID();
    const challengeTitle = `Photo Flow Real ${Date.now()}`;

    let createdChallengeId: string | undefined;

    try {
      const createResponse = await request.post(
        `${challengeApiUrl}/api/admin/challenges`,
        {
          headers: {
            ...authHeader(adminToken),
          },
          data: {
            eventId: seedEventId,
            title: challengeTitle,
            description: "Photo challenge para fluxo E2E frontend real.",
            type: 3,
            qrCode: null,
            latitude: null,
            longitude: null,
            radiusMeters: 20,
            basePoints: 15,
            bonusPoints: 0,
            bonusTimeSeconds: 0,
          },
        },
      );

      expect(createResponse.status()).toBe(201);
      const created = (await createResponse.json()) as ChallengeResponse;
      createdChallengeId = created.id;

      await page.addInitScript(
        ({ token, uid }) => {
          localStorage.setItem(
            "auth-store",
            JSON.stringify({
              state: {
                token,
                user: { id: uid, name: "E2E Integrante", role: "Integrante" },
              },
              version: 0,
            }),
          );

          const fakeStream = () => {
            const canvas = document.createElement("canvas");
            canvas.width = 320;
            canvas.height = 240;

            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.fillStyle = "#0ea5e9";
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.fillStyle = "#f8fafc";
              ctx.font = "20px sans-serif";
              ctx.fillText("E2E PHOTO", 90, 120);
            }

            return canvas.captureStream(15);
          };

          const mediaDevices = navigator.mediaDevices ?? ({} as MediaDevices);
          const originalGetUserMedia = mediaDevices.getUserMedia?.bind(mediaDevices);

          mediaDevices.getUserMedia = async (constraints?: MediaStreamConstraints) => {
            if (constraints?.video) {
              return fakeStream();
            }

            if (originalGetUserMedia) {
              return originalGetUserMedia(constraints);
            }

            throw new Error("getUserMedia indisponível");
          };

          Object.defineProperty(navigator, "mediaDevices", {
            value: mediaDevices,
            configurable: true,
          });
        },
        { token: memberToken, uid: userId },
      );

      await page.goto("/");

      await page.getByPlaceholder("ChallengeId").fill(createdChallengeId);
      await page.getByPlaceholder("PatrulhaId").fill(patrulhaId);
      await page.getByPlaceholder("UserId").fill(userId);

      await page.getByRole("button", { name: "Abrir câmera" }).click();
      await expect(page.locator("video")).toBeVisible();

      await page.getByRole("button", { name: "Capturar foto" }).click();
      await expect(page.getByAltText("Prévia da foto capturada")).toBeVisible();
      await expect(page.getByText(/Motor local:/i)).toBeVisible();

      await page.getByRole("button", { name: "Executar fallback backend" }).click();
      await expect(page.getByText(/Motor backend:/i)).toBeVisible();

      await page.getByRole("button", { name: "Validar check-in" }).click();
      await expect(page.getByText(/manual|pendente/i)).toBeVisible();

      const scoreResponse = await request.get(
        `${challengeApiUrl}/api/challenges/score?patrulhaId=${patrulhaId}&eventId=${seedEventId}`,
        {
          headers: {
            ...authHeader(memberToken),
          },
        },
      );

      expect(scoreResponse.ok()).toBeTruthy();

      const score = (await scoreResponse.json()) as {
        totalPoints: number;
        validatedChallenges: number;
        totalAttempts: number;
      };

      expect(score.totalPoints).toBe(0);
      expect(score.validatedChallenges).toBe(0);
      expect(score.totalAttempts).toBe(1);

      const attemptsResponse = await request.post(
        `${challengeApiUrl}/api/challenges/${createdChallengeId}/validate`,
        {
          headers: {
            ...authHeader(memberToken),
          },
          data: {
            patrulhaId,
            userId,
            photoBase64:
              "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4//8/AwAI/AL+X2VINwAAAABJRU5ErkJggg==",
          },
        },
      );

      expect(attemptsResponse.status()).toBe(409);

      const duplicateError = await attemptsResponse.text();
      expect(duplicateError.toLowerCase()).toContain("já validou");
    } finally {
      if (createdChallengeId) {
        await request.delete(
          `${challengeApiUrl}/api/admin/challenges/${createdChallengeId}`,
          {
            headers: {
              ...authHeader(adminToken),
            },
          },
        );
      }
    }
  });

  test("rejeita abertura da camera quando permissao nega", async ({ page }) => {
    await page.addInitScript(() => {
      const mediaDevices = navigator.mediaDevices ?? ({} as MediaDevices);
      mediaDevices.getUserMedia = async () => {
        throw new Error("Permissão de câmera negada");
      };

      Object.defineProperty(navigator, "mediaDevices", {
        value: mediaDevices,
        configurable: true,
      });
    });

    await page.goto("/");
    await page.getByRole("button", { name: "Abrir câmera" }).click();

    await expect(
      page.getByText(/Não foi possível abrir a câmera/i),
    ).toBeVisible();
  });
});
