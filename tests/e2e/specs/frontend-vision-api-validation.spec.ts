import { expect, test } from "@playwright/test";

test.describe("frontend vision api validation", () => {
  test("mostra erro quando fallback de visão retorna payload inválido", async ({
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

      const fakeStream = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#0ea5e9";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = "#f8fafc";
          ctx.font = "20px sans-serif";
          ctx.fillText("E2E VISION", 80, 120);
        }

        return canvas.captureStream(15);
      };

      const mediaDevices = navigator.mediaDevices ?? ({} as MediaDevices);
      mediaDevices.getUserMedia = async () => fakeStream();

      Object.defineProperty(navigator, "mediaDevices", {
        value: mediaDevices,
        configurable: true,
      });

      Object.defineProperty(HTMLVideoElement.prototype, "videoWidth", {
        configurable: true,
        get() {
          return 320;
        },
      });

      Object.defineProperty(HTMLVideoElement.prototype, "videoHeight", {
        configurable: true,
        get() {
          return 240;
        },
      });
    });

    await page.route(
      "http://localhost:5005/api/vision/analyze-photo",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            label: "urbano",
            confidence: 0.88,
            engine: "onnx",
            // summary ausente propositalmente para quebrar schema.
            brightness: 0.5,
            contrast: 0.25,
            analyzedAtUtc: "2026-05-18T00:00:00Z",
          }),
        });
      },
    );

    await page.goto("/");

    await page.getByRole("button", { name: "Abrir câmera" }).click();
    await page.getByRole("button", { name: "Capturar foto" }).click();
    await page
      .getByRole("button", { name: "Executar fallback backend" })
      .click();

    await expect(
      page.getByText(/Resposta inválida da API de visão\./i),
    ).toBeVisible();
  });
});
