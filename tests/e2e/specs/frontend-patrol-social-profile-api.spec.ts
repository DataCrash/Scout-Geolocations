import { expect, test } from "@playwright/test";

const patrolId = "11111111-1111-1111-1111-111111111111";

test.describe("frontend M4: perfil social remoto da patrulha", () => {
  test("exibe dados remotos de monitor, submonitor e membros", async ({
    page,
  }) => {
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

    await page.route(
      `**/patrulha/${patrolId}/social-profile`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "11111111-1111-1111-8111-111111111111",
            name: "Patrulha Lobo Remota",
            monitorId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
            monitorName: "Monitor Remoto",
            submonitorId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
            submonitorName: "Submonitor Remoto",
            createdAt: "2026-05-18T12:00:00Z",
            membersCount: 3,
            recentMembers: [
              {
                userId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
                name: "Membro A",
                role: "Integrante",
                joinedAt: "2026-05-18T11:00:00Z",
              },
              {
                userId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
                name: "Membro B",
                role: "Integrante",
                joinedAt: "2026-05-18T10:00:00Z",
              },
            ],
          }),
        });
      },
    );

    await page.goto("/");

    const profileSummary = page.getByLabel("perfil-patrulha-resumo");

    await expect(
      profileSummary.getByText(/Patrulha Lobo Remota/i),
    ).toBeVisible();
    await expect(
      profileSummary.getByText(/Monitor: Monitor Remoto/i),
    ).toBeVisible();
    await expect(
      profileSummary.getByText(/Submonitor: Submonitor Remoto/i),
    ).toBeVisible();
    await expect(
      profileSummary.getByText(/Membros cadastrados: 3/i),
    ).toBeVisible();
    await expect(
      profileSummary.getByText(/Membros recentes: Membro A, Membro B/i),
    ).toBeVisible();
  });

  test("mantém resumo social local quando API retorna 404", async ({
    page,
  }) => {
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

    await page.route(
      `**/patrulha/${patrolId}/social-profile`,
      async (route) => {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ message: "Not found" }),
        });
      },
    );

    await page.goto("/");

    const socialSummary = page.getByLabel("resumo-social-patrulha");

    await expect(socialSummary.getByText(/Pontos atuais: 120/i)).toBeVisible();
    await expect(
      socialSummary.getByText(/Desafios validados: 8/i),
    ).toBeVisible();
    await expect(page.getByText(/Patrulha Lobo/i).first()).toBeVisible();
    await expect(page.getByText(/Monitor:/i)).toHaveCount(0);
  });

  test("mantém fallback local quando payload remoto é inválido", async ({
    page,
  }) => {
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

    await page.route(
      `**/patrulha/${patrolId}/social-profile`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: patrolId,
            name: "Patrulha Payload Invalido",
            monitorId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
            // monitorName ausente propositalmente para acionar fallback.
            submonitorId: null,
            submonitorName: null,
            createdAt: "2026-05-18T12:00:00Z",
            membersCount: 0,
            recentMembers: [],
          }),
        });
      },
    );

    await page.goto("/");

    const socialSummary = page.getByLabel("resumo-social-patrulha");

    await expect(page.getByText(/Patrulha Lobo/i).first()).toBeVisible();
    await expect(socialSummary.getByText(/Pontos atuais: 120/i)).toBeVisible();
    await expect(page.getByText(/Monitor:/i)).toHaveCount(0);
  });
});
