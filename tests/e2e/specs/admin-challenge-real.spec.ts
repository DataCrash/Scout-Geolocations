import { expect, test } from "@playwright/test";
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
} from "./support/real-backend.helpers";

test.describe("challenge admin real: CRUD com autorizacao", () => {
  let adminToken: string;
  let nonAdminToken: string;

  test.skip(!runRealBackend, runRealBackendSkipMessage);

  test.beforeAll(async ({ request }) => {
    const challengeHealth = await request.get(`${challengeApiUrl}/health`);
    test.skip(
      !challengeHealth.ok(),
      serviceUnavailableMessage("Challenge API", challengeApiUrl),
    );

    adminToken = createRoleToken("ChefesEscoteiro");
    nonAdminToken = createRoleToken("Integrante");

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

  test("executa CRUD admin real de desafios sem mocks", async ({ request }) => {
    const title = `Desafio Admin Real ${Date.now()}`;
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
            description: "Desafio criado por spec integrado real.",
            type: 0,
            qrCode: `QR-ADMIN-${Date.now()}`,
            latitude: -23.55052,
            longitude: -46.63331,
            radiusMeters: 35,
            basePoints: 12,
            bonusPoints: 3,
            bonusTimeSeconds: 0,
          },
        },
      );

      expect(createResponse.status()).toBe(201);

      const created = (await createResponse.json()) as ChallengeResponse;
      createdId = created.id;
      expect(created.eventId).toBe(seedEventId);
      expect(created.title).toBe(title);
      expect([0, 1]).toContain(created.status);

      const listResponse = await request.get(
        `${challengeApiUrl}/api/challenges?eventId=${seedEventId}`,
        {
          headers: {
            ...authHeader(adminToken),
          },
        },
      );

      expect(listResponse.ok()).toBeTruthy();

      const list = (await listResponse.json()) as ChallengeResponse[];
      expect(list.some((item) => item.id === createdId)).toBeTruthy();

      const updateResponse = await request.put(
        `${challengeApiUrl}/api/admin/challenges/${createdId}`,
        {
          headers: {
            ...authHeader(adminToken),
          },
          data: {
            status: 2,
          },
        },
      );

      expect(updateResponse.ok()).toBeTruthy();

      const updated = (await updateResponse.json()) as ChallengeResponse;
      expect(updated.id).toBe(createdId);
      expect(updated.status).toBe(2);

      const deleteResponse = await request.delete(
        `${challengeApiUrl}/api/admin/challenges/${createdId}`,
        {
          headers: {
            ...authHeader(adminToken),
          },
        },
      );

      expect(deleteResponse.status()).toBe(204);

      const getDeletedResponse = await request.get(
        `${challengeApiUrl}/api/challenges/${createdId}`,
        {
          headers: {
            ...authHeader(adminToken),
          },
        },
      );

      expect(getDeletedResponse.status()).toBe(404);
      createdId = undefined;
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

  test("bloqueia create de desafio sem role admin", async ({ request }) => {
    const response = await request.post(
      `${challengeApiUrl}/api/admin/challenges`,
      {
        headers: {
          ...authHeader(nonAdminToken),
        },
        data: {
          eventId: seedEventId,
          title: `Desafio sem autorizacao ${Date.now()}`,
          description: "Nao deveria ser criado",
          type: 0,
          qrCode: "QR-FORBIDDEN",
          latitude: -23.55052,
          longitude: -46.63331,
          radiusMeters: 30,
          basePoints: 10,
          bonusPoints: 0,
          bonusTimeSeconds: 0,
        },
      },
    );

    expect(response.status()).toBe(403);
  });
});
