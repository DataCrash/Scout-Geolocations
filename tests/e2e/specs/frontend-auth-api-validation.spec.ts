import { expect, test } from "@playwright/test";

test.describe("frontend auth api validation", () => {
  test("mostra erro quando login guest retorna payload inválido", async ({
    page,
  }) => {
    await page.route("http://localhost:5001/auth/guest", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          userId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          name: "Guest Sem Token",
          role: "Convidado",
        }),
      });
    });

    await page.goto("/login");

    await page.getByLabel("Your Name").fill("Guest Test");
    await page.getByRole("button", { name: /Login as Guest/i }).click();

    await expect(
      page.getByText(/Resposta inválida da API de autenticação\./i),
    ).toBeVisible();
  });

  test("mostra erro quando authorize do Google retorna payload inválido", async ({
    page,
  }) => {
    await page.route(
      "http://localhost:5001/auth/google/authorize",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            state: "missing-url",
          }),
        });
      },
    );

    await page.goto("/login");

    await page.getByRole("button", { name: /Sign in with Google/i }).click();

    await expect(
      page.getByText(/Resposta inválida da API de autenticação\./i),
    ).toBeVisible();
  });

  test("mostra erro quando authorize retorna URL inválida", async ({
    page,
  }) => {
    await page.route(
      "http://localhost:5001/auth/google/authorize",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            authorizationUrl: "not-a-valid-url",
            state: "e2e-state",
          }),
        });
      },
    );

    await page.goto("/login");

    await page.getByRole("button", { name: /Sign in with Google/i }).click();

    await expect(
      page.getByText(/Resposta inválida da API de autenticação\./i),
    ).toBeVisible();
  });
});
