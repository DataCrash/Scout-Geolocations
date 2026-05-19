import { expect, test } from "@playwright/test";

test.describe("frontend oauth callback validation", () => {
  test("mostra erro quando callback retorna role inválida", async ({
    page,
  }) => {
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

  test("mostra mensagem amigavel quando dominio nao e permitido", async ({
    page,
  }) => {
    await page.goto(
      "/auth/callback?error=oauth_domain_not_allowed&errorDescription=Use%20uma%20conta%20%40escoteiros.org.br%20para%20acessar%20o%20sistema.",
    );

    await expect(
      page.getByText(/Use uma conta @escoteiros\.org\.br para entrar\./i),
    ).toBeVisible();

    await page.waitForURL(/\/login$/i);
  });

  test("aceita callback válido e navega para dashboard", async ({ page }) => {
    await page.goto(
      "/auth/callback?token=e2e-token&userId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&name=E2E%20User&role=Convidado",
    );

    await page.waitForURL("/");
    await expect(page.getByText(/Painel tático de caça/i)).toBeVisible();
  });
});
