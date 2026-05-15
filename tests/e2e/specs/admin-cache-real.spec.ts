import { expect, test } from "@playwright/test";
import {
  authHeader,
  cacheApiUrl,
  createRoleToken,
  probeCacheAuthStatus,
  runRealBackend,
  runRealBackendSkipMessage,
  seedEventId,
  serviceUnavailableMessage,
} from "./support/real-backend.helpers.js";

type GeocacheResponse = {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  type: string;
  status: string;
  qrCode?: string;
  eventId: string;
  basePoints: number;
  createdAt: string;
};

test.describe("cache admin real: CRUD com autorizacao", () => {
  let adminToken: string;
  let nonAdminToken: string;

  test.skip(!runRealBackend, runRealBackendSkipMessage);

  test.beforeAll(async ({ request }) => {
    const cacheHealth = await request.get(`${cacheApiUrl}/health`);
    test.skip(
      !cacheHealth.ok(),
      serviceUnavailableMessage("Cache API", cacheApiUrl),
    );

    adminToken = createRoleToken("ChefesEscoteiro");
    nonAdminToken = createRoleToken("Integrante");

    const authProbeStatus = await probeCacheAuthStatus(
      request,
      adminToken,
      seedEventId,
    );

    test.skip(
      authProbeStatus === 401,
      "JWT de teste rejeitado pela Cache API. Configure REAL_E2E_JWT_KEY, REAL_E2E_JWT_ISSUER e REAL_E2E_JWT_AUDIENCE de acordo com o ambiente alvo.",
    );
  });

  test("executa CRUD real de cache com role admin", async ({ request }) => {
    const name = `Cache Admin Real ${Date.now()}`;
    let createdId: string | undefined;

    try {
      const createResponse = await request.post(
        `${cacheApiUrl}/api/geocaches/`,
        {
          headers: {
            ...authHeader(adminToken),
          },
          data: {
            name,
            description: "Cache criado por spec integrado real.",
            latitude: -23.55052,
            longitude: -46.63331,
            radiusMeters: 30,
            type: "QRCode",
            basePoints: 15,
            eventId: seedEventId,
          },
        },
      );

      expect(createResponse.status()).toBe(201);

      const created = (await createResponse.json()) as GeocacheResponse;
      createdId = created.id;
      expect(created.name).toBe(name);
      expect(created.eventId).toBe(seedEventId);
      expect(created.type).toBe("QRCode");

      const listResponse = await request.get(
        `${cacheApiUrl}/api/geocaches/event/${seedEventId}`,
        {
          headers: {
            ...authHeader(adminToken),
          },
        },
      );

      expect(listResponse.ok()).toBeTruthy();

      const list = (await listResponse.json()) as GeocacheResponse[];
      expect(list.some((item) => item.id === createdId)).toBeTruthy();

      const updateResponse = await request.put(
        `${cacheApiUrl}/api/geocaches/${createdId}`,
        {
          headers: {
            ...authHeader(adminToken),
          },
          data: {
            name: `${name} Atualizado`,
            status: "Inactive",
            basePoints: 22,
          },
        },
      );

      expect(updateResponse.ok()).toBeTruthy();

      const updated = (await updateResponse.json()) as GeocacheResponse;
      expect(updated.id).toBe(createdId);
      expect(updated.status).toBe("Inactive");
      expect(updated.basePoints).toBe(22);

      const deleteResponse = await request.delete(
        `${cacheApiUrl}/api/geocaches/${createdId}`,
        {
          headers: {
            ...authHeader(adminToken),
          },
        },
      );

      expect(deleteResponse.status()).toBe(204);

      const getDeletedResponse = await request.get(
        `${cacheApiUrl}/api/geocaches/${createdId}`,
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
        await request.delete(`${cacheApiUrl}/api/geocaches/${createdId}`, {
          headers: {
            ...authHeader(adminToken),
          },
        });
      }
    }
  });

  test("bloqueia delete de cache sem role admin", async ({ request }) => {
    const createResponse = await request.post(`${cacheApiUrl}/api/geocaches/`, {
      headers: {
        ...authHeader(adminToken),
      },
      data: {
        name: `Cache Restrito ${Date.now()}`,
        description: "Cache para teste de autorizacao.",
        latitude: -23.55052,
        longitude: -46.63331,
        radiusMeters: 30,
        type: "QRCode",
        basePoints: 10,
        eventId: seedEventId,
      },
    });

    expect(createResponse.status()).toBe(201);

    const created = (await createResponse.json()) as GeocacheResponse;

    try {
      const forbiddenResponse = await request.delete(
        `${cacheApiUrl}/api/geocaches/${created.id}`,
        {
          headers: {
            ...authHeader(nonAdminToken),
          },
        },
      );

      expect(forbiddenResponse.status()).toBe(403);
    } finally {
      await request.delete(`${cacheApiUrl}/api/geocaches/${created.id}`, {
        headers: {
          ...authHeader(adminToken),
        },
      });
    }
  });
});
