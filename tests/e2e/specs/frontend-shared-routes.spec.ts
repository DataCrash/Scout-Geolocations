import { expect, test } from "@playwright/test";

test.describe("frontend M4: rotas compartilhadas", () => {
  test("compartilha uma rota personalizada e mantém após recarregar", async ({
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

    await expect(page.getByText(/Rotas compartilhadas/i)).toBeVisible();

    await page.getByPlaceholder("Nome da rota").fill("Rota do Mirante");
    await page
      .getByPlaceholder("Waypoints da rota")
      .fill("Base -> Trilha Azul -> Mirante");

    await page.getByRole("button", { name: /Compartilhar rota/i }).click();

    const sharedRoutesList = page.getByLabel("rotas-compartilhadas");

    await expect(
      page.getByText(/Rota compartilhada com sucesso\./i),
    ).toBeVisible();
    await expect(sharedRoutesList.getByText(/Rota do Mirante/i)).toBeVisible();
    await expect(
      sharedRoutesList.getByText(/Base -> Trilha Azul -> Mirante/i),
    ).toBeVisible();

    await page.reload();

    const sharedRoutesListAfterReload = page.getByLabel("rotas-compartilhadas");
    await expect(
      sharedRoutesListAfterReload.getByText(/Rota do Mirante/i),
    ).toBeVisible();
    await expect(
      sharedRoutesListAfterReload.getByText(/Base -> Trilha Azul -> Mirante/i),
    ).toBeVisible();
  });
});
