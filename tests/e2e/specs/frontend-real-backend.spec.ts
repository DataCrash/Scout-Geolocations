import { expect, test } from "@playwright/test";

type GuestAuthResponse = {
  token: string;
  userId: string;
  name: string;
  role: string;
};

const runRealBackend = process.env.RUN_REAL_BACKEND_E2E === "1";
const identityApiUrl = process.env.IDENTITY_API_URL ?? "http://localhost:5001";
const challengeApiUrl =
  process.env.CHALLENGE_API_URL ?? "http://localhost:5004";
const challengeId =
  process.env.REAL_E2E_CHALLENGE_ID ?? "00000000-0000-0000-0000-000000000010";
const patrulhaId =
  process.env.REAL_E2E_PATRULHA_ID ?? "11111111-1111-1111-1111-111111111111";
const qrCode = process.env.REAL_E2E_QR ?? "QR-DEMO-001";

test.describe("frontend MVP com backend real", () => {
  test.skip(
    !runRealBackend,
    "Defina RUN_REAL_BACKEND_E2E=1 para executar este spec integrado.",
  );

  let auth: GuestAuthResponse;

  test.beforeAll(async ({ request }) => {
    const identityHealth = await request.get(`${identityApiUrl}/health`);
    test.skip(
      !identityHealth.ok(),
      `Identity API indisponivel em ${identityApiUrl}.`,
    );

    const challengeHealth = await request.get(`${challengeApiUrl}/health`);
    test.skip(
      !challengeHealth.ok(),
      `Challenge API indisponivel em ${challengeApiUrl}.`,
    );

    const loginResponse = await request.post(`${identityApiUrl}/auth/guest`, {
      data: {
        name: `E2E Guest ${Date.now()}`,
      },
    });

    expect(loginResponse.ok()).toBeTruthy();
    auth = (await loginResponse.json()) as GuestAuthResponse;
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
  }) => {
    await context.grantPermissions(["geolocation"], {
      origin: "http://127.0.0.1:4173",
    });
    await context.setGeolocation({ latitude: -23.55052, longitude: -46.63331 });

    await page.addInitScript((token) => {
      localStorage.setItem("access_token", token);
    }, auth.token);

    await page.goto("/");

    await page.getByPlaceholder("ChallengeId").fill(challengeId);
    await page.getByPlaceholder("PatrulhaId").fill(patrulhaId);
    await page.getByPlaceholder("UserId").fill(auth.userId);
    await page.getByPlaceholder("Conteúdo do QR Code").fill(qrCode);

    await page.getByRole("button", { name: /Usar minha localização/i }).click();
    await expect(page.getByPlaceholder("Latitude")).toHaveValue("-23.55052");
    await expect(page.getByPlaceholder("Longitude")).toHaveValue("-46.63331");

    await page.getByRole("button", { name: /Validar check-in/i }).click();

    await expect(
      page.getByText(
        /Check-in validado|QR Code inválido|não encontrado|já validou|não está ativo|sem validação/i,
      ),
    ).toBeVisible();
  });
});
