import { expect, test } from "@playwright/test";

test.describe("frontend M4: perfil de patrulha", () => {
  test("salva perfil da patrulha e mantém dados após recarregar", async ({
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

    await expect(page.getByText(/Perfil da Patrulha/i)).toBeVisible();

    await page.getByPlaceholder("Nome da Patrulha").fill("Patrulha Pantera");
    await page
      .getByPlaceholder("Bio da Patrulha")
      .fill("Equipe focada em progressão silenciosa.");
    await page.getByPlaceholder("Foco tático").fill("Reconhecimento");

    await page.getByRole("button", { name: /Salvar perfil/i }).click();

    await expect(
      page.getByText(/Perfil de Patrulha atualizado com sucesso\./i),
    ).toBeVisible();
    const profileSummary = page.getByLabel("perfil-patrulha-resumo");
    await expect(profileSummary.getByText(/Patrulha Pantera/i)).toBeVisible();
    await expect(
      profileSummary.getByText(/Equipe focada em progressão silenciosa\./i),
    ).toBeVisible();
    await expect(
      profileSummary.getByText(/Foco: Reconhecimento/i),
    ).toBeVisible();

    await page.reload();

    await expect(page.getByPlaceholder("Nome da Patrulha")).toHaveValue(
      "Patrulha Pantera",
    );
    await expect(page.getByPlaceholder("Foco tático")).toHaveValue(
      "Reconhecimento",
    );
  });
});