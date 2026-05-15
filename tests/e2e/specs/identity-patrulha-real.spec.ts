import { expect, test } from "@playwright/test";
import {
  authHeader,
  createPatrulha,
  guestLogin,
  identityApiUrl,
  probeIdentityGuestSession,
  runRealBackend,
  runRealBackendSkipMessage,
  serviceUnavailableMessage,
  type PatrulhaResponse,
} from "./support/real-backend.helpers";

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

test.describe("identity real: auth + patrulha + invite token", () => {
  test.skip(!runRealBackend, runRealBackendSkipMessage);

  test.beforeAll(async ({ request }) => {
    const identityHealth = await request.get(`${identityApiUrl}/health`);
    test.skip(
      !identityHealth.ok(),
      serviceUnavailableMessage("Identity API", identityApiUrl),
    );

    const sessionProbe = await probeIdentityGuestSession(request);
    test.skip(!sessionProbe.ok, sessionProbe.reason ?? "Preflight falhou.");
  });

  test("cria patrulha com monitor autenticado", async ({ request }) => {
    const monitor = await guestLogin(request, "E2E-Monitor");
    const patrulha = await createPatrulha(request, monitor.token);
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
    const patrulha = await createPatrulha(
      request,
      monitor.token,
      "Patrulha Fluxo QR",
    );

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
