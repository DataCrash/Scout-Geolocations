import { expect, test } from "@playwright/test";

test.describe("frontend M4: histórico de leaderboard", () => {
  test("renderiza histórico entre eventos e inclui evento atual", async ({
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

      localStorage.setItem(
        "leaderboard-history-store",
        JSON.stringify({
          state: {
            byEventId: {
              "99999999-9999-9999-9999-999999999999": {
                eventId: "99999999-9999-9999-9999-999999999999",
                capturedAt: "2026-05-18T10:00:00.000Z",
                scores: [
                  {
                    id: "aaaa1111-1111-1111-1111-111111111111",
                    name: "Patrulha Orion",
                    points: 88,
                    validatedChallenges: 5,
                  },
                ],
              },
            },
          },
          version: 0,
        }),
      );
    });

    await page.goto("/");

    await expect(page.getByText(/Histórico entre eventos/i)).toBeVisible();
    await expect(page.getByText(/Patrulha Orion: 88 pts/i)).toBeVisible();
    await expect(page.getByText(/Evento 99999999/i)).toBeVisible();
    await expect(page.getByText(/Evento 00000000/i)).toBeVisible();
  });
});
