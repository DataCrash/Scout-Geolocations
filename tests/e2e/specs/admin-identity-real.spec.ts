import { expect, test } from "@playwright/test";
import {
  authHeader,
  createPatrulha,
  createRoleToken,
  guestLogin,
  identityApiUrl,
  probeIdentityGuestSession,
  runRealBackend,
  runRealBackendSkipMessage,
  serviceUnavailableMessage,
  type PatrulhaResponse,
} from "./support/real-backend.helpers.js";

type UserResponse = {
  id: string;
  name: string;
  email?: string;
  role: string;
};

test.describe("identity admin real: users/roles/patrulhas", () => {
  let adminToken: string;
  let nonAdminToken: string;

  test.skip(!runRealBackend, runRealBackendSkipMessage);

  test.beforeAll(async ({ request }) => {
    const identityHealth = await request.get(`${identityApiUrl}/health`);
    test.skip(
      !identityHealth.ok(),
      serviceUnavailableMessage("Identity API", identityApiUrl),
    );

    const sessionProbe = await probeIdentityGuestSession(request);
    test.skip(!sessionProbe.ok, sessionProbe.reason ?? "Preflight falhou.");

    adminToken = createRoleToken("ChefesEscoteiro");
    nonAdminToken = createRoleToken("Integrante");

    const adminProbe = await request.get(`${identityApiUrl}/admin/users`, {
      headers: {
        ...authHeader(adminToken),
      },
    });

    test.skip(
      adminProbe.status() === 401,
      "JWT de teste rejeitado no Identity API. Configure REAL_E2E_JWT_KEY, REAL_E2E_JWT_ISSUER e REAL_E2E_JWT_AUDIENCE de acordo com o ambiente alvo.",
    );
  });

  test("lista usuarios e patrulhas com role admin", async ({ request }) => {
    const monitor = await guestLogin(request, "E2E-Admin-Identity-Monitor");
    const patrulha = await createPatrulha(
      request,
      monitor.token,
      "Patrulha Admin Identity",
    );

    const usersResponse = await request.get(`${identityApiUrl}/admin/users`, {
      headers: {
        ...authHeader(adminToken),
      },
    });

    expect(usersResponse.ok()).toBeTruthy();

    const users = (await usersResponse.json()) as UserResponse[];
    expect(users.some((user) => user.id === monitor.userId)).toBeTruthy();

    const patrulhasResponse = await request.get(
      `${identityApiUrl}/admin/patrulhas`,
      {
        headers: {
          ...authHeader(adminToken),
        },
      },
    );

    expect(patrulhasResponse.ok()).toBeTruthy();

    const patrulhas = (await patrulhasResponse.json()) as PatrulhaResponse[];
    expect(patrulhas.some((item) => item.id === patrulha.id)).toBeTruthy();
  });

  test("altera role de usuario com permissao admin", async ({ request }) => {
    const user = await guestLogin(request, "E2E-Admin-Identity-Role");

    const updateRoleResponse = await request.put(
      `${identityApiUrl}/admin/users/${user.userId}/role`,
      {
        headers: {
          ...authHeader(adminToken),
        },
        data: {
          role: "ChefesEscoteiro",
        },
      },
    );

    expect(updateRoleResponse.ok()).toBeTruthy();

    const updated = (await updateRoleResponse.json()) as UserResponse;
    expect(updated.id).toBe(user.userId);
    expect(updated.role).toBe("ChefesEscoteiro");
  });

  test("bloqueia endpoint admin para role sem privilegio", async ({
    request,
  }) => {
    const usersResponse = await request.get(`${identityApiUrl}/admin/users`, {
      headers: {
        ...authHeader(nonAdminToken),
      },
    });

    expect(usersResponse.status()).toBe(403);

    const deleteLocationResponse = await request.delete(
      `${identityApiUrl}/admin/users/00000000-0000-0000-0000-000000000123/location-data`,
      {
        headers: {
          ...authHeader(nonAdminToken),
        },
      },
    );

    expect(deleteLocationResponse.status()).toBe(403);
  });

  test("aceita solicitacao de exclusao de localizacao com admin", async ({
    request,
  }) => {
    const response = await request.delete(
      `${identityApiUrl}/admin/users/00000000-0000-0000-0000-000000000123/location-data`,
      {
        headers: {
          ...authHeader(adminToken),
        },
      },
    );

    expect(response.status()).toBe(202);

    const payload = (await response.json()) as {
      message?: string;
      userId?: string;
      note?: string;
      Message?: string;
      UserId?: string;
      Note?: string;
    };

    const normalizedMessage = payload.message ?? payload.Message ?? "";
    expect(normalizedMessage).toContain("Solicitação de exclusão");
  });
});
