import { expect, test } from "@playwright/test";

type AuthResponse = {
  token: string;
  userId: string;
  name: string;
  role: string;
};

type PatrulhaResponse = {
  id: string;
  name: string;
  monitorId: string;
  submonitorId?: string | null;
  createdAt: string;
};

type InviteResponse = {
  inviteId: string;
  token: string;
  joinUrl: string;
  qrCodeBase64: string;
  expiresAt: string;
};

type PatrulhaMemberResponse = {
  userId: string;
  name: string;
  role: string;
  joinedAt: string;
};

const runRealBackend = process.env.RUN_REAL_BACKEND_E2E === "1";
const identityApiUrl = process.env.IDENTITY_API_URL ?? "http://localhost:5001";

function authHeader(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

async function guestLogin(
  request: Parameters<typeof test>[0]["request"],
  namePrefix: string,
): Promise<AuthResponse> {
  const response = await request.post(`${identityApiUrl}/auth/guest`, {
    data: {
      name: `${namePrefix}-${Date.now()}`,
    },
  });

  expect(response.ok()).toBeTruthy();
  return (await response.json()) as AuthResponse;
}

test.describe("identity real: auth + patrulha + invite token", () => {
  test.skip(
    !runRealBackend,
    "Defina RUN_REAL_BACKEND_E2E=1 para executar specs integrados.",
  );

  test.beforeAll(async ({ request }) => {
    const identityHealth = await request.get(`${identityApiUrl}/health`);
    test.skip(
      !identityHealth.ok(),
      `Identity API indisponível em ${identityApiUrl}.`,
    );
  });

  test("cria patrulha com monitor autenticado", async ({ request }) => {
    const monitor = await guestLogin(request, "E2E-Monitor");

    const createPatrulhaResponse = await request.post(
      `${identityApiUrl}/patrulha/`,
      {
        headers: {
          ...authHeader(monitor.token),
        },
        data: {
          name: `Patrulha E2E ${Date.now()}`,
        },
      },
    );

    expect(createPatrulhaResponse.status()).toBe(201);

    const patrulha = (await createPatrulhaResponse.json()) as PatrulhaResponse;
    expect(patrulha.monitorId).toBe(monitor.userId);

    const meResponse = await request.get(`${identityApiUrl}/auth/me`, {
      headers: {
        ...authHeader(monitor.token),
      },
    });

    expect(meResponse.ok()).toBeTruthy();

    const me = (await meResponse.json()) as {
      id: string;
      role: string;
    };

    expect(me.id).toBe(monitor.userId);
    expect(me.role).toBe("Monitor");
  });

  test("convite por QR token permite entrada de integrante e nomeacao de submonitor", async ({
    request,
  }) => {
    const monitor = await guestLogin(request, "E2E-Monitor");
    const integrante = await guestLogin(request, "E2E-Integrante");

    const createPatrulhaResponse = await request.post(
      `${identityApiUrl}/patrulha/`,
      {
        headers: {
          ...authHeader(monitor.token),
        },
        data: {
          name: `Patrulha Fluxo QR ${Date.now()}`,
        },
      },
    );

    expect(createPatrulhaResponse.status()).toBe(201);

    const patrulha = (await createPatrulhaResponse.json()) as PatrulhaResponse;

    const inviteResponse = await request.get(
      `${identityApiUrl}/patrulha/${patrulha.id}/invite`,
      {
        headers: {
          ...authHeader(monitor.token),
        },
      },
    );

    expect(inviteResponse.ok()).toBeTruthy();

    const invite = (await inviteResponse.json()) as InviteResponse;
    expect(invite.token.length).toBeGreaterThan(8);
    expect(invite.joinUrl).toContain(invite.token);

    const joinResponse = await request.post(`${identityApiUrl}/patrulha/join`, {
      headers: {
        ...authHeader(integrante.token),
      },
      data: {
        token: invite.token,
      },
    });

    expect(joinResponse.ok()).toBeTruthy();

    const setSubmonitorResponse = await request.put(
      `${identityApiUrl}/patrulha/${patrulha.id}/submonitor`,
      {
        headers: {
          ...authHeader(monitor.token),
        },
        data: {
          userId: integrante.userId,
        },
      },
    );

    expect(setSubmonitorResponse.status()).toBe(204);

    const getPatrulhaResponse = await request.get(
      `${identityApiUrl}/patrulha/${patrulha.id}`,
      {
        headers: {
          ...authHeader(monitor.token),
        },
      },
    );

    expect(getPatrulhaResponse.ok()).toBeTruthy();

    const updatedPatrulha =
      (await getPatrulhaResponse.json()) as PatrulhaResponse;
    expect(updatedPatrulha.submonitorId).toBe(integrante.userId);

    const membersResponse = await request.get(
      `${identityApiUrl}/patrulha/${patrulha.id}/members`,
      {
        headers: {
          ...authHeader(monitor.token),
        },
      },
    );

    expect(membersResponse.ok()).toBeTruthy();

    const members = (await membersResponse.json()) as PatrulhaMemberResponse[];
    const ids = members.map((member) => member.userId);

    expect(ids).toContain(monitor.userId);
    expect(ids).toContain(integrante.userId);
  });
});
