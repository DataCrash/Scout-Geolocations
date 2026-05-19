import { expect, test } from "@playwright/test";

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

test.describe("frontend M4: badges do evento", () => {
  test("exibe a base de badges no Dashboard", async ({ page }) => {
    await prepareBrowserState(page);
    await page.goto("/");

    await expect(page.getByText(/Badges do evento/i)).toBeVisible();
    await expect(page.getByText(/Arrancada do Evento/i)).toBeVisible();
    await expect(page.getByText(/Líder do Evento/i)).toBeVisible();

    await expect(
      page
        .getByText(/Líder do Evento/i)
        .locator("..")
        .locator(".."),
    ).toContainText(/Pendente/i);
  });

  test("desbloqueia o badge de liderança ao aumentar a pontuação", async ({
    page,
  }) => {
    await prepareBrowserState(page);
    await page.goto("/");

    await page
      .getByRole("button", { name: /Simular validação \(\+15\)/i })
      .click();

    await expect(
      page
        .getByText(/Líder do Evento/i)
        .locator("..")
        .locator(".."),
    ).toContainText(/Desbloqueado/i);
  });
});
