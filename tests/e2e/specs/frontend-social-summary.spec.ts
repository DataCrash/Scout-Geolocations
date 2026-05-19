import { expect, test } from "@playwright/test";

test.describe("frontend M4: resumo social da patrulha", () => {
  test("exibe resumo consolidado com ranking, badges e rotas", async ({
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

    await page.goto("/");

    await page.getByPlaceholder("Nome da rota").fill("Rota do Vale");
    await page.getByPlaceholder("Waypoints da rota").fill("Base -> Vale");
    await page.getByRole("button", { name: /Compartilhar rota/i }).click();

    const socialSummary = page.getByLabel("resumo-social-patrulha");

    await expect(page.getByText(/Resumo social da Patrulha/i)).toBeVisible();
    await expect(socialSummary.getByText(/Pontos atuais: 120/i)).toBeVisible();
    await expect(
      socialSummary.getByText(/Desafios validados: 8/i),
    ).toBeVisible();
    await expect(
      socialSummary.getByText(/Badges desbloqueadas: 2/i),
    ).toBeVisible();
    await expect(
      socialSummary.getByText(/Rotas compartilhadas no evento: 1/i),
    ).toBeVisible();
  });
});
