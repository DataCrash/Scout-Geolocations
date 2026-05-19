import { expect, test } from "@playwright/test";

test.describe("frontend M4: badges configuráveis por evento", () => {
  test("permite criar badge customizada e desbloquear após aumento de score", async ({
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

    await page.getByPlaceholder("Título da badge").fill("Guardiões do Pico");
    await page
      .getByPlaceholder("Descrição da badge")
      .fill("Alcançar 121 pontos no evento.");
    await page.getByPlaceholder("Meta de pontos").fill("121");
    await page.getByPlaceholder("Meta de desafios").fill("");

    await page.getByRole("button", { name: /Adicionar badge/i }).click();

    const badgesList = page.getByLabel("badges-evento-list");
    const customBadge = badgesList
      .getByText(/Guardiões do Pico/i)
      .locator("..");

    await expect(
      page.getByText(/Badge personalizada adicionada ao evento\./i),
    ).toBeVisible();
    await expect(customBadge).toContainText(/Pendente/i);

    await page
      .getByRole("button", { name: /Simular validação \(\+15\)/i })
      .click();

    await expect(customBadge).toContainText(/Desbloqueado/i);
  });
});
