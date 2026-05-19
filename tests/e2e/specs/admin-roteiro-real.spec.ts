import { expect, test } from "@playwright/test";
import {
  authHeader,
  cacheApiUrl,
  createRoleToken,
  probeRoteiroAdminAuthStatus,
  runRealBackend,
  runRealBackendSkipMessage,
  seedEventId,
  serviceUnavailableMessage,
} from "./support/real-backend.helpers.js";

type RoteiroResponse = {
  id: string;
  eventId: string;
  name: string;
  description: string;
  status: string;
  sequence: number;
  createdAt: string;
};

test.describe("roteiro admin real: CRUD com autorizacao", () => {
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

    const authProbeStatus = await probeRoteiroAdminAuthStatus(
      request,
      adminToken,
      seedEventId,
    );

    test.skip(
      authProbeStatus === 401,
      "JWT de teste rejeitado pela Cache API. Configure REAL_E2E_JWT_KEY, REAL_E2E_JWT_ISSUER e REAL_E2E_JWT_AUDIENCE de acordo com o ambiente alvo.",
    );
  });

  test("executa CRUD admin real de roteiros", async ({ request }) => {
    const name = `Roteiro Admin Real ${Date.now()}`;
    let createdId: string | undefined;

    try {
      const createResponse = await request.post(
        `${cacheApiUrl}/api/admin/roteiros/`,
        {
          headers: {
            ...authHeader(adminToken),
          },
          data: {
            eventId: seedEventId,
            name,
            description: "Roteiro criado por spec integrado real.",
            sequence: 99,
          },
        },
      );

      expect(createResponse.status()).toBe(201);

      const created = (await createResponse.json()) as RoteiroResponse;
      createdId = created.id;
      expect(created.name).toBe(name);
      expect(created.eventId).toBe(seedEventId);
      expect(created.status).toBe("Active");

      const listResponse = await request.get(
        `${cacheApiUrl}/api/admin/roteiros/event/${seedEventId}`,
        {
          headers: {
            ...authHeader(adminToken),
          },
        },
      );

      expect(listResponse.ok()).toBeTruthy();

      const list = (await listResponse.json()) as RoteiroResponse[];
      expect(list.some((item) => item.id === createdId)).toBeTruthy();

      const updateResponse = await request.put(
        `${cacheApiUrl}/api/admin/roteiros/${createdId}`,
        {
          headers: {
            ...authHeader(adminToken),
          },
          data: {
            name: `${name} Atualizado`,
            status: "Archived",
            sequence: 100,
          },
        },
      );

      expect(updateResponse.ok()).toBeTruthy();

      const updated = (await updateResponse.json()) as RoteiroResponse;
      expect(updated.id).toBe(createdId);
      expect(updated.status).toBe("Archived");
      expect(updated.sequence).toBe(100);

      const deleteResponse = await request.delete(
        `${cacheApiUrl}/api/admin/roteiros/${createdId}`,
        {
          headers: {
            ...authHeader(adminToken),
          },
        },
      );

      expect(deleteResponse.status()).toBe(204);

      const getDeletedResponse = await request.get(
        `${cacheApiUrl}/api/admin/roteiros/${createdId}`,
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
        await request.delete(`${cacheApiUrl}/api/admin/roteiros/${createdId}`, {
          headers: {
            ...authHeader(adminToken),
          },
        });
      }
    }
  });

  test("bloqueia create de roteiro sem role admin", async ({ request }) => {
    const forbiddenResponse = await request.post(
      `${cacheApiUrl}/api/admin/roteiros/`,
      {
        headers: {
          ...authHeader(nonAdminToken),
        },
        data: {
          eventId: seedEventId,
          name: `Roteiro Restrito ${Date.now()}`,
          description: "Roteiro para teste de autorizacao.",
          sequence: 101,
        },
      },
    );

    expect(forbiddenResponse.status()).toBe(403);
  });
});
