import { expect, test } from "@playwright/test";
import {
  authHeader,
  createRoleToken,
  runRealBackend,
  runRealBackendSkipMessage,
  serviceUnavailableMessage,
} from "./support/real-backend.helpers.js";

const visionApiUrl = process.env.VISION_API_URL ?? "http://localhost:5005";

const tinyPhotoDataUrl =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4//8/AwAI/AL+X2VINwAAAABJRU5ErkJggg==";

test.describe("vision api real: analise de foto", () => {
  let memberToken: string;

  test.skip(!runRealBackend, runRealBackendSkipMessage);

  test.beforeAll(async ({ request }) => {
    const visionHealth = await request.get(`${visionApiUrl}/health`);
    test.skip(
      !visionHealth.ok(),
      serviceUnavailableMessage("Vision API", visionApiUrl),
    );

    memberToken = createRoleToken("Integrante");
  });

  test("retorna analise autenticada para imagem base64", async ({
    request,
  }) => {
    const response = await request.post(
      `${visionApiUrl}/api/vision/analyze-photo`,
      {
        headers: {
          "Content-Type": "application/json",
          ...authHeader(memberToken),
        },
        data: {
          photoBase64: tinyPhotoDataUrl,
        },
      },
    );

    expect(response.ok()).toBeTruthy();

    const body = (await response.json()) as {
      label: string;
      confidence: number;
      engine: string;
      requiresManualReview: boolean;
      summary: string;
      brightness: number;
      contrast: number;
      analyzedAtUtc: string;
    };

    expect(body.label.length).toBeGreaterThan(0);
    expect(body.engine.length).toBeGreaterThan(0);
    expect(body.summary.length).toBeGreaterThan(0);
    expect(body.confidence).toBeGreaterThanOrEqual(0);
    expect(body.confidence).toBeLessThanOrEqual(1);
    expect(body.brightness).toBeGreaterThanOrEqual(0);
    expect(body.brightness).toBeLessThanOrEqual(1);
    expect(body.contrast).toBeGreaterThanOrEqual(0);
    expect(new Date(body.analyzedAtUtc).toString()).not.toBe("Invalid Date");
  });

  test("bloqueia requisicao sem token", async ({ request }) => {
    const response = await request.post(
      `${visionApiUrl}/api/vision/analyze-photo`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        data: {
          photoBase64: tinyPhotoDataUrl,
        },
      },
    );

    expect(response.status()).toBe(401);
  });
});
