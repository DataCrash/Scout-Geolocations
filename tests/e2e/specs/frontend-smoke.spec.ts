import { expect, test } from "@playwright/test";

type MockChallengeItem = {
  id: string;
  eventId: string;
  title: string;
  description: string;
  type: number;
  status: number;
  qrCode?: string;
  latitude?: number;
  longitude?: number;
  radiusMeters: number;
  basePoints: number;
  bonusPoints: number;
  bonusTimeSeconds: number;
  geocacheId?: string;
  createdAt: string;
};

const mockEventId = "00000000-0000-0000-0000-000000000001";

async function prepareBrowserState(page: Parameters<typeof test>[0]["page"]) {
  await page.addInitScript(() => {
    localStorage.setItem(
      "auth-store",
      JSON.stringify({
        state: {
          token: "e2e-token",
          user: {
            id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            name: "E2E User",
            role: "ChefesEscoteiro",
          },
        },
        version: 0,
      }),
    );
  });
}

test.describe("frontend MVP smoke", () => {
  test("renderiza dashboard principal", async ({ page }) => {
    await prepareBrowserState(page);
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        name: /Painel tático de caça: mapa, check-in e ranking em tempo real/i,
      }),
    ).toBeVisible();

    await expect(page.getByText(/Scout Geolocations · MVP/i)).toBeVisible();
    await expect(
      page.getByText(/SignalR conectado|SignalR offline/i),
    ).toBeVisible();
  });

  test("exibe painel de QR check-in e admin", async ({ page }) => {
    await prepareBrowserState(page);
    await page.goto("/");

    await expect(page.getByText(/Check-in por QR \(real\)/i)).toBeVisible();
    await expect(page.getByPlaceholder("ChallengeId")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Validar check-in/i }),
    ).toBeVisible();

    await expect(page.getByText(/Admin · CRUD de desafios/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Criar desafio/i }),
    ).toBeVisible();
  });

  test("simula incremento visual do leaderboard", async ({ page }) => {
    await prepareBrowserState(page);
    await page.goto("/");

    const before = page
      .getByText(/Patrulha Lobo/i)
      .locator("..")
      .locator("..");
    await expect(before).toContainText(/120 pts/i);

    await page.getByRole("button", { name: /Simular validação/i }).click();

    await expect(before).toContainText(/135 pts/i);
  });

  test("valida check-in com localizacao e resposta mockada", async ({
    page,
    context,
  }) => {
    await prepareBrowserState(page);

    await context.grantPermissions(["geolocation"], {
      origin: "http://127.0.0.1:4173",
    });
    await context.setGeolocation({ latitude: -23.55052, longitude: -46.63331 });

    let requestBody: Record<string, unknown> | undefined;

    await page.route(
      "http://localhost:5004/api/challenges/**/validate",
      async (route) => {
        requestBody = JSON.parse(route.request().postData() ?? "{}");

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "attempt-1",
            challengeId: "00000000-0000-0000-0000-000000000010",
            patrulhaId: "11111111-1111-1111-1111-111111111111",
            userId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            status: 1,
            pointsAwarded: 25,
            attemptedAt: "2026-05-15T00:00:00Z",
            validatedAt: "2026-05-15T00:00:02Z",
          }),
        });
      },
    );

    await page.goto("/");

    await page.getByPlaceholder("Conteúdo do QR Code").fill("QR-E2E-123");
    await page.getByRole("button", { name: /Usar minha localização/i }).click();

    await expect(page.getByPlaceholder("Latitude")).toHaveValue("-23.55052");
    await expect(page.getByPlaceholder("Longitude")).toHaveValue("-46.63331");

    await page.getByRole("button", { name: /Validar check-in/i }).click();

    await expect(
      page.getByText(/Check-in validado: \+25 pontos\./i),
    ).toBeVisible();

    expect(requestBody).toMatchObject({
      PatrulhaId: "11111111-1111-1111-1111-111111111111",
      UserId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      ScannedQrCode: "QR-E2E-123",
      Latitude: -23.55052,
      Longitude: -46.63331,
    });
  });

  test("executa CRUD admin com respostas mockadas", async ({ page }) => {
    await prepareBrowserState(page);

    const challenges: MockChallengeItem[] = [
      {
        id: "challenge-1",
        eventId: mockEventId,
        title: "Desafio inicial",
        description: "Valide no ponto A",
        type: 0,
        status: 1,
        qrCode: "QR-INICIAL",
        radiusMeters: 30,
        basePoints: 10,
        bonusPoints: 5,
        bonusTimeSeconds: 0,
        createdAt: "2026-05-15T00:00:00Z",
      },
    ];

    await page.route(
      "http://localhost:5004/api/challenges?*",
      async (route) => {
        const url = new URL(route.request().url());

        expect(url.searchParams.get("eventId")).toBe(mockEventId);

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(challenges),
        });
      },
    );

    await page.route(
      "http://localhost:5004/api/admin/challenges",
      async (route) => {
        const payload = JSON.parse(route.request().postData() ?? "{}");
        const createdChallenge: MockChallengeItem = {
          id: `challenge-${challenges.length + 1}`,
          eventId: payload.eventId,
          title: payload.title,
          description: payload.description,
          type: payload.type,
          status: 1,
          qrCode: payload.qrCode,
          radiusMeters: payload.radiusMeters,
          basePoints: payload.basePoints,
          bonusPoints: payload.bonusPoints,
          bonusTimeSeconds: payload.bonusTimeSeconds,
          createdAt: "2026-05-15T00:05:00Z",
        };

        challenges.push(createdChallenge);

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(createdChallenge),
        });
      },
    );

    await page.route(
      "http://localhost:5004/api/admin/challenges/*",
      async (route) => {
        const method = route.request().method();
        const challengeId = route.request().url().split("/").at(-1);
        const challengeIndex = challenges.findIndex(
          (item) => item.id === challengeId,
        );

        if (challengeIndex < 0) {
          await route.fulfill({ status: 404, body: "Not found" });
          return;
        }

        if (method === "PUT") {
          const payload = JSON.parse(route.request().postData() ?? "{}");
          challenges[challengeIndex] = {
            ...challenges[challengeIndex],
            status: payload.status,
          };

          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(challenges[challengeIndex]),
          });
          return;
        }

        if (method === "DELETE") {
          challenges.splice(challengeIndex, 1);
          await route.fulfill({ status: 204, body: "" });
          return;
        }

        await route.fallback();
      },
    );

    await page.goto("/");

    await page.getByRole("button", { name: /Recarregar lista/i }).click();
    await expect(page.getByText("Desafio inicial")).toBeVisible();

    await page.getByRole("button", { name: /Criar desafio/i }).click();

    await expect(page.getByText(/Desafio criado com sucesso\./i)).toBeVisible();
    await expect(page.getByText("Novo desafio QR")).toBeVisible();

    const createdItem = page.locator("li", { hasText: "Novo desafio QR" });
    await expect(createdItem.getByText(/Status: Ativo/i)).toBeVisible();

    await createdItem.getByRole("button", { name: /Inativar/i }).click();
    await expect(
      createdItem.getByText(/Status: Inativo\/Draft/i),
    ).toBeVisible();

    await createdItem.getByRole("button", { name: /Excluir/i }).click();
    await expect(page.getByText("Novo desafio QR")).toHaveCount(0);
    await expect(page.getByText("Desafio inicial")).toBeVisible();
  });
});
