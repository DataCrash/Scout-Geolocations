import { expect, test } from "@playwright/test";

test.describe("frontend oauth callback validation", () => {
  test("mostra erro quando callback retorna role inválida", async ({ page }) => {
    await page.goto(
      "/auth/callback?token=e2e-token&userId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&name=E2E%20User&role=InvalidRole",
    );

    await page.waitForURL(/\/login$/i);
    await expect(
      page.getByRole("button", { name: /Sign in with Google/i }),
    ).toBeVisible();
  });

  test("mostra erro quando callback chega sem token", async ({ page }) => {
    await page.goto(
      "/auth/callback?userId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&name=E2E%20User&role=Convidado",
    );

    await page.waitForURL(/\/login$/i);
    await expect(
      page.getByRole("button", { name: /Sign in with Google/i }),
    ).toBeVisible();
  });

  test("aceita callback válido e navega para dashboard", async ({ page }) => {
    await page.goto(
      "/auth/callback?token=e2e-token&userId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&name=E2E%20User&role=Convidado",
    );

    await page.waitForURL("/");
    await expect(page.getByText(/Painel tático de caça/i)).toBeVisible();
  });
});
