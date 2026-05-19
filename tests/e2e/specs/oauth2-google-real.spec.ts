import { expect, test } from "@playwright/test";
import {
  authHeader,
  identityApiUrl,
  runRealBackend,
  runRealBackendSkipMessage,
  serviceUnavailableMessage,
} from "./support/real-backend.helpers.js";

test.describe("OAuth2 Google Authentication Flow (Real)", () => {
  test.skip(!runRealBackend, runRealBackendSkipMessage);

  let authorizationUrl: string;
  let state: string;

  const frontendUrl = process.env.FRONTEND_URL ?? "http://127.0.0.1:4173";

  test("POST /auth/google/authorize returns valid authorization URL", async ({
    request,
  }) => {
    // Health check
    const identityHealth = await request.get(`${identityApiUrl}/health`);
    test.skip(
      !identityHealth.ok(),
      serviceUnavailableMessage("Identity API", identityApiUrl),
    );

    // Request authorization URL
    const response = await request.post(
      `${identityApiUrl}/auth/google/authorize`,
    );

    expect(response.ok()).toBeTruthy();

    const body = (await response.json()) as {
      authorizationUrl?: string;
      state?: string;
    };

    expect(body.authorizationUrl).toBeDefined();
    expect(body.state).toBeDefined();

    authorizationUrl = body.authorizationUrl!;
    state = body.state!;

    // Validate URL format
    expect(authorizationUrl).toContain(
      "https://accounts.google.com/o/oauth2/v2/auth",
    );

    const parsedUrl = new URL(authorizationUrl);
    const scopes = (parsedUrl.searchParams.get("scope") ?? "").split(" ");

    expect(parsedUrl.searchParams.get("state")).toBe(state);
    expect(scopes).toContain("openid");
    expect(scopes).toContain("profile");
    expect(scopes).toContain("email");
    expect(parsedUrl.searchParams.get("response_type")).toBe("code");
  });

  test("OAuth2 callback endpoint validates domain (@escoteiros.org.br)", async ({
    request,
  }) => {
    /**
     * NOTE: Este teste é placeholder para validação de domínio.
     *
     * Para executar o fluxo real:
     * 1. Obter um authorization code válido do Google
     * 2. Enviar para GET /auth/google/callback?code=XXX&state=YYY
     * 3. Validar que o backend retorna JWT se o email tem domínio @escoteiros.org.br
     * 4. Validar que o backend rejeita se o email for de outro domínio
     *
     * Como o teste E2E não pode abrir navegador externo (Google OAuth),
     * recomenda-se validar manualmente com contas @escoteiros.org.br reais
     * ou usar um mock do Google OAuth para testes automatizados.
     */

    // Placeholder: Validar estrutura do endpoint
    const callbackUrl = `${identityApiUrl}/auth/google/callback`;
    const response = await request.get(callbackUrl, {
      params: {
        code: "invalid_code",
        state: "invalid_state",
      },
    });

    // Esperado: 400 Bad Request ou 401 Unauthorized (não 500)
    expect([400, 401, 302]).toContain(response.status());
  });

  test("Guest login works as fallback (no OAuth2 required)", async ({
    request,
  }) => {
    const response = await request.post(`${identityApiUrl}/auth/guest`, {
      data: {
        name: `E2E OAuth2 Test ${Date.now()}`,
      },
    });

    expect(response.ok()).toBeTruthy();

    const auth = (await response.json()) as {
      token?: string;
      userId?: string;
      name?: string;
      role?: string;
    };

    expect(auth.token).toBeDefined();
    expect(auth.userId).toBeDefined();
    expect(auth.name).toBeDefined();
    expect(auth.role).toBeDefined();

    return auth;
  });

  test("POST /auth/me requires valid JWT token", async ({ request }) => {
    // Test without token
    const noTokenResponse = await request.get(`${identityApiUrl}/auth/me`);
    expect([401, 403]).toContain(noTokenResponse.status());

    // Test with invalid token
    const invalidTokenResponse = await request.get(
      `${identityApiUrl}/auth/me`,
      {
        headers: authHeader("invalid.token.here"),
      },
    );
    expect([401, 403]).toContain(invalidTokenResponse.status());
  });

  test("POST /auth/me returns user info with valid token", async ({
    request,
  }) => {
    // Get guest auth first
    const loginResponse = await request.post(`${identityApiUrl}/auth/guest`, {
      data: {
        name: `E2E Auth Me Test ${Date.now()}`,
      },
    });

    const auth = (await loginResponse.json()) as {
      token: string;
      userId: string;
      name: string;
      role: string;
    };

    // Call /auth/me with valid token
    const meResponse = await request.get(`${identityApiUrl}/auth/me`, {
      headers: authHeader(auth.token),
    });

    expect(meResponse.ok()).toBeTruthy();

    const user = (await meResponse.json()) as {
      id?: string;
      name?: string;
      email?: string;
      role?: string;
    };

    expect(user.id).toBe(auth.userId);
    expect(user.name).toBe(auth.name);
    expect(user.role).toBeDefined();
  });

  test("Frontend login page displays Google Sign-In button", async ({
    page,
    request,
  }) => {
    // Health check
    const identityHealth = await request.get(`${identityApiUrl}/health`);
    test.skip(
      !identityHealth.ok(),
      serviceUnavailableMessage("Identity API", identityApiUrl),
    );

    // Navigate to frontend (assuming Vite dev server on port 5173)
    await page.goto(`${frontendUrl}/login`, { waitUntil: "networkidle" });

    // Look for Google Sign-In button
    const googleButton = page.locator("button:has-text('Sign in with Google')");
    await expect(googleButton).toBeVisible();

    // Look for guest login form
    const guestInput = page.locator("input[placeholder*='name' i]");
    await expect(guestInput).toBeVisible();

    const guestButton = page.locator("button:has-text('Login as Guest')");
    await expect(guestButton).toBeVisible();
  });

  test("Guest login flow stores token in localStorage", async ({ page }) => {
    // Navigate to login
    await page.goto(`${frontendUrl}/login`, { waitUntil: "networkidle" });

    // Fill guest name
    await page.fill("input[placeholder*='name' i]", `E2E Guest ${Date.now()}`);

    // Click login button
    await page.click("button:has-text('Login as Guest')");

    // Wait for redirect to dashboard
    await page.waitForURL(`${frontendUrl}/`, { waitUntil: "networkidle" });

    // Verify token is stored
    const storedAuth = await page.evaluate(() => {
      const store = localStorage.getItem("auth-store");
      if (!store) return null;
      try {
        const parsed = JSON.parse(store);
        return parsed.state;
      } catch {
        return null;
      }
    });

    expect(storedAuth).toBeDefined();
    expect(storedAuth?.token).toBeDefined();
    expect(storedAuth?.user).toBeDefined();
  });

  test("Protected route redirects to login when no auth token", async ({
    page,
  }) => {
    // Garante origem válida antes de acessar localStorage
    await page.goto(`${frontendUrl}/login`, { waitUntil: "load" });

    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());

    // Try to access protected dashboard
    await page.goto(`${frontendUrl}/`, { waitUntil: "load" });

    await page.waitForURL(/\/login$/, { timeout: 5000 }).catch(() => null);

    // Should redirect to login
    expect(page.url()).toContain("/login");
  });

  test("Dashboard displays user name after login", async ({ page }) => {
    // Navigate to login
    await page.goto(`${frontendUrl}/login`, { waitUntil: "networkidle" });

    const userName = `E2E User ${Date.now()}`;

    // Fill and submit guest login
    await page.fill("input[placeholder*='name' i]", userName);
    await page.click("button:has-text('Login as Guest')");

    // Wait for dashboard
    await page.waitForURL(`${frontendUrl}/`, { waitUntil: "networkidle" });

    // Verify user name is displayed in header
    const userDisplay = page.locator(`text=${userName}`);
    await expect(userDisplay).toBeVisible();
  });

  test("Logout button clears auth state", async ({ page }) => {
    // Login as guest
    await page.goto(`${frontendUrl}/login`, { waitUntil: "networkidle" });
    await page.fill(
      "input[placeholder*='name' i]",
      `E2E Logout Test ${Date.now()}`,
    );
    await page.click("button:has-text('Login as Guest')");
    await page.waitForURL(`${frontendUrl}/`, { waitUntil: "networkidle" });

    // Click logout
    await page.click("button:has-text('Logout')");

    // Should redirect to login
    await page.waitForURL(`${frontendUrl}/login`, { waitUntil: "load" });

    await expect(page).toHaveURL(new RegExp(`${frontendUrl}/login$`));
  });

  test("OAuth2 callback page handles token from URL params", async ({
    page,
  }) => {
    /**
     * NOTE: Este teste é placeholder para a validação do OAuthCallbackPage.
     *
     * Para executar o fluxo real:
     * 1. Simular um redirect do backend para /auth/callback?token=JWT&userId=...
     * 2. Validar que o componente extrai os params
     * 3. Validar que o token é armazenado em localStorage
     * 4. Validar que o usuário é redirecionado para dashboard
     *
     * Como o teste E2E não pode simular facilmente o callback do backend,
     * recomenda-se validar manualmente ou usar mocks de redirect.
     */

    // Clear auth state em origem válida
    await page.goto(`${frontendUrl}/login`, { waitUntil: "load" });
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());

    // Simulate callback with test token
    const testToken = "test.jwt.token";
    const testUserId = "test-user-123";
    const testName = "Test User";

    await page.goto(
      `${frontendUrl}/auth/callback?token=${testToken}&userId=${testUserId}&name=${testName}&role=Integrante`,
      { waitUntil: "load" },
    );

    // Should redirect to dashboard
    await page.waitForURL(`${frontendUrl}/`, { waitUntil: "load" });

    await expect(
      page.getByRole("heading", { name: /Painel tático de caça/i }),
    ).toBeVisible();
  });
});
