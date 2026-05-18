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

test.describe("frontend M3: fallback WebNFC para QR", () => {
  test("exibe fallback para QR quando WebNFC nao esta disponivel", async ({
    page,
  }) => {
    await prepareBrowserState(page);
    await page.goto("/");

    await expect(
      page.getByText(
        /WebNFC indisponível neste dispositivo\. Use QR manual\./i,
      ),
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: /Ler tag NFC \(fallback do QR\)/i }),
    ).toHaveCount(0);
  });

  test("preenche o QR com payload NFC lido e envia no check-in", async ({
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

      class MockNDEFReader {
        listeners: Record<string, Array<(event: unknown) => void>>;

        constructor() {
          this.listeners = { reading: [], readingerror: [] };
        }

        addEventListener(type: string, listener: (event: unknown) => void) {
          if (!this.listeners[type]) {
            this.listeners[type] = [];
          }

          this.listeners[type].push(listener);
        }

        async scan() {
          const bytes = new TextEncoder().encode("NFC-E2E-001");
          const event = {
            message: {
              records: [
                {
                  recordType: "text",
                  data: bytes.buffer,
                },
              ],
            },
          };

          setTimeout(() => {
            for (const listener of this.listeners.reading ?? []) {
              listener(event);
            }
          }, 10);
        }
      }

      Object.defineProperty(window, "NDEFReader", {
        value: MockNDEFReader,
        configurable: true,
      });
    });

    let requestBody: Record<string, unknown> | undefined;

    await page.route(
      "http://localhost:5004/api/challenges/**/validate",
      async (route) => {
        requestBody = JSON.parse(route.request().postData() ?? "{}");

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "attempt-nfc-1",
            challengeId: "00000000-0000-0000-0000-000000000010",
            patrulhaId: "11111111-1111-1111-1111-111111111111",
            userId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            status: 1,
            pointsAwarded: 10,
            attemptedAt: "2026-05-16T00:00:00Z",
            validatedAt: "2026-05-16T00:00:02Z",
          }),
        });
      },
    );

    await page.goto("/");

    await page
      .getByRole("button", { name: /Ler tag NFC \(fallback do QR\)/i })
      .click();

    await expect(page.getByPlaceholder("Conteúdo do QR Code")).toHaveValue(
      "NFC-E2E-001",
    );

    await expect(
      page.getByText(/Tag NFC lida com sucesso\. QR\/Code: NFC-E2E-001/i),
    ).toBeVisible();

    await page.getByRole("button", { name: /Validar check-in/i }).click();

    await expect(
      page.getByText(/Check-in validado: \+10 pontos\./i),
    ).toBeVisible();

    expect(requestBody).toMatchObject({
      ScannedQrCode: "NFC-E2E-001",
    });
  });

  test("aplica payload NFC estruturado para vinculo de patrulha (POC)", async ({
    page,
  }) => {
    const linkedPatrolId = "22222222-2222-2222-8222-222222222222";

    await page.addInitScript(
      ({ patrolId }) => {
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

        class MockNDEFReader {
          listeners: Record<string, Array<(event: unknown) => void>>;

          constructor() {
            this.listeners = { reading: [], readingerror: [] };
          }

          addEventListener(type: string, listener: (event: unknown) => void) {
            if (!this.listeners[type]) {
              this.listeners[type] = [];
            }

            this.listeners[type].push(listener);
          }

          async scan() {
            const bytes = new TextEncoder().encode(
              `patrol=${patrolId};qr=NFC-LINK-009`,
            );
            const event = {
              message: {
                records: [
                  {
                    recordType: "text",
                    data: bytes.buffer,
                  },
                ],
              },
            };

            setTimeout(() => {
              for (const listener of this.listeners.reading ?? []) {
                listener(event);
              }
            }, 10);
          }
        }

        Object.defineProperty(window, "NDEFReader", {
          value: MockNDEFReader,
          configurable: true,
        });
      },
      { patrolId: linkedPatrolId },
    );

    let requestBody: Record<string, unknown> | undefined;

    await page.route(
      "http://localhost:5004/api/challenges/**/validate",
      async (route) => {
        requestBody = JSON.parse(route.request().postData() ?? "{}");

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "attempt-nfc-2",
            challengeId: "00000000-0000-0000-0000-000000000010",
            patrulhaId: linkedPatrolId,
            userId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            status: 1,
            pointsAwarded: 12,
            attemptedAt: "2026-05-16T00:10:00Z",
            validatedAt: "2026-05-16T00:10:02Z",
          }),
        });
      },
    );

    await page.goto("/");

    await page
      .getByRole("button", { name: /Ler tag NFC \(fallback do QR\)/i })
      .click();

    await expect(page.getByPlaceholder("PatrulhaId")).toHaveValue(
      linkedPatrolId,
    );
    await expect(page.getByPlaceholder("Conteúdo do QR Code")).toHaveValue(
      "NFC-LINK-009",
    );

    await expect(
      page.getByText(new RegExp(`Patrulha: ${linkedPatrolId}`)),
    ).toBeVisible();

    await page.getByRole("button", { name: /Validar check-in/i }).click();

    expect(requestBody).toMatchObject({
      PatrulhaId: linkedPatrolId,
      ScannedQrCode: "NFC-LINK-009",
    });
  });
});
