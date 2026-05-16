import { expect, test } from "@playwright/test";
import {
  authHeader,
  challengeApiUrl,
  createRoleToken,
  probeChallengeAuthStatus,
  runRealBackend,
  runRealBackendSkipMessage,
  seedEventId,
  serviceUnavailableMessage,
  type AttemptResponse,
  type ChallengeResponse,
} from "./support/real-backend.helpers.js";

const tinyPhotoDataUrl =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4//8/AwAI/AL+X2VINwAAAABJRU5ErkJggg==";

test.describe("photo challenge real: fluxo de validacao pendente", () => {
  let adminToken: string;
  let memberToken: string;

  test.skip(!runRealBackend, runRealBackendSkipMessage);

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

  test("cria PhotoChallenge e retorna tentativa Pending com evidencia fotografica", async ({
    request,
  }) => {
    const title = `Photo Challenge Real ${Date.now()}`;
    let createdId: string | undefined;

    try {
      const createResponse = await request.post(
        `${challengeApiUrl}/api/admin/challenges`,
        {
          headers: {
            ...authHeader(adminToken),
          },
          data: {
            eventId: seedEventId,
            title,
            description: "Desafio fotografico criado por spec integrado real.",
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
      createdId = created.id;
      expect(created.type).toBe(3);

      const validateResponse = await request.post(
        `${challengeApiUrl}/api/challenges/${createdId}/validate`,
        {
          headers: {
            ...authHeader(memberToken),
          },
          data: {
            patrulhaId: "00000000-0000-0000-0000-00000000a001",
            userId: "00000000-0000-0000-0000-00000000a002",
            photoBase64: tinyPhotoDataUrl,
          },
        },
      );

      expect(validateResponse.ok()).toBeTruthy();

      const attempt = (await validateResponse.json()) as AttemptResponse;
      expect(attempt.challengeId).toBe(createdId);
      expect(attempt.status).toBe(0);
      expect(attempt.pointsAwarded).toBe(0);
      expect(attempt.validatedAt ?? null).toBeNull();
      expect((attempt.failReason ?? "").toLowerCase()).toContain("manual");
    } finally {
      if (createdId) {
        await request.delete(
          `${challengeApiUrl}/api/admin/challenges/${createdId}`,
          {
            headers: {
              ...authHeader(adminToken),
            },
          },
        );
      }
    }
  });
});
