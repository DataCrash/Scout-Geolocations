import { expect, test } from "@playwright/test";

test.describe("frontend MVP smoke", () => {
  test("renderiza dashboard principal", async ({ page }) => {
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
    await page.goto("/");

    const before = page
      .getByText(/Patrulha Lobo/i)
      .locator("..")
      .locator("..");
    await expect(before).toContainText(/120 pts/i);

    await page.getByRole("button", { name: /Simular validação/i }).click();

    await expect(before).toContainText(/135 pts/i);
  });
});
