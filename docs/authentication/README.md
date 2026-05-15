# Authentication Documentation

## Guias Disponíveis

### 1. [OAuth2-Setup.md](./OAuth2-Setup.md)

**Para**: Configurar Google Cloud Console e entender o fluxo OAuth2 por redirect

Cobre:

- Criação de projeto no Google Cloud
- OAuth 2.0 Credentials setup
- Fluxo redirect via backend
- Configuração de backend (.NET)
- Configuração de frontend (React)
- Troubleshooting de erros comuns

**Quando usar**: Na primeira vez que está configurando o projeto

---

### 2. [MANUAL-OAUTH2-VALIDATION.md](./MANUAL-OAUTH2-VALIDATION.md)

**Para**: Validação passo-a-passo do fluxo completo

Cobre:

- Setup Google Cloud Console com screenshots
- Configuração de variáveis de ambiente (.env)
- Iniciar backend, frontend e banco de dados
- 7 testes manuais práticos:
  1. Login guest (rápido)
  2. Fluxo OAuth2 completo
  3. Validação de domínio
  4. Inspeção de JWT token
  5. Verificação de banco de dados
  6. Proteção de rotas
  7. Logout
- Troubleshooting detalhado
- Checklist final

**Quando usar**: Depois de implementar, para validar que tudo funciona localmente

---

## Quick Start (5 min)

```bash
# 1. Terminal 1: Docker
cd infra
docker compose up -d postgres redis

# 2. Terminal 2: Backend
cd backend/Scout.Identity.Api
dotnet restore
dotnet ef database update
dotnet run --configuration Debug

# 3. Terminal 3: Frontend
cd frontend/scout-web
npm install
npm run dev

# 4. Acesse
# Login page: http://localhost:5173/login
# Guest login: Preencha nome + clique "Login as Guest"
# OAuth2 real: Clique "Sign in with Google" (precisa credenciais)
```

---

## E2E Tests

```bash
# Executar E2E spec (com backend real rodando)
cd tests/e2e
npm install
npx playwright install chromium

# Com guest login (sempre funciona)
npm test -- oauth2-google-real.spec.ts

# Com OAuth2 real (requer credenciais Google)
RUN_REAL_BACKEND_E2E=1 npm test -- oauth2-google-real.spec.ts
```

---

## Fluxo Alto Nível

```
┌─────────────┐                  ┌──────────────┐
│   Browser   │                  │   Google     │
└──────┬──────┘                  └──────────────┘
       │
       │ 1. Click "Sign in"
       ├──────────────────────────────>
       │   POST /auth/google/authorize
       │
       │ 2. Backend returns Google URL
       │<──────────────────────────────┤
       │   + state parameter
       │
       │ 3. Browser redirects to Google
       ├─────────────────────────────────────────>
       │
       │ 4. User authenticates
       │
       │ 5. Google redirects with code
       │<─────────────────────────────────────────┤
       │   /auth/google/callback?code=XXX&state=Y
       │
       │ 6. Backend validates code
       │    and generates JWT
       │
       │ 7. Backend redirects to frontend
       │    with token in URL
       │<──────────────────────────────┤
       │   /auth/callback?token=JWT&user=...
       │
       │ 8. Frontend stores token
       │    in localStorage
       │
       └─────────────────────────────┘
         Dashboard loaded
```

---

## Variáveis de Ambiente

### Backend (.env ou appsettings.Development.json)

```json
{
  "Google": {
    "ClientId": "xxx-yyy.apps.googleusercontent.com",
    "ClientSecret": "GOCSP_xxxxxx",
    "RedirectUri": "http://localhost:5001/auth/google/callback"
  },
  "Jwt": {
    "Key": "dev_secret_key_min_32_chars_for_testing_only",
    "Issuer": "scout-identity",
    "Audience": "scout-apps"
  },
  "App": {
    "FrontendUrl": "http://localhost:5173",
    "InitialAdminEmail": "seu-chefe@escoteiros.org.br"
  }
}
```

### Frontend (.env.local)

```env
VITE_API_URL=http://localhost:5001
```

---

## Status de Implementação

✅ **Backend**

- GoogleOAuthService implementado
- POST /auth/google/authorize — inicia fluxo
- GET /auth/google/callback — processa redirect
- POST /auth/google — endpoint legado para troca direta de `idToken`
- Validação de domínio @escoteiros.org.br
- Auto-role assignment baseado em email

✅ **Frontend**

- LoginPage com redirect para Google via backend
- OAuthCallbackPage para processar callback
- useAuthStore com Zustand + localStorage
- ProtectedRoute para rotas autenticadas
- React Router configurado

✅ **Documentation**

- OAuth2-Setup.md — Configuração
- MANUAL-OAUTH2-VALIDATION.md — Validação
- E2E tests (oauth2-google-real.spec.ts)

✅ **Git**

- PR #24 merged para develop
- 4 commits com histórico linear (Forward-Only)

---

## Próximos Passos

1. Validar manualmente com contas @escoteiros.org.br reais (veja MANUAL-OAUTH2-VALIDATION.md)
2. Executar E2E tests: `RUN_REAL_BACKEND_E2E=1 npm test`
3. M1.3: Role-based access control (Chefe vs. Jovem)
4. M2: Integração com APIs de Cache/Location
5. Produção: SSL, secrets manager, deployment

---

## Links Rápidos

- [OAuth2 Setup Guide](./OAuth2-Setup.md)
- [Manual Validation Steps](./MANUAL-OAUTH2-VALIDATION.md)
- [E2E Test Spec](../../tests/e2e/specs/oauth2-google-real.spec.ts)
- [GoogleOAuthService Source](../../backend/Scout.Identity.Api/Services/GoogleOAuthService.cs)
- [Frontend Auth Integration](../../frontend/scout-web/src/services/authApi.ts)
- [Google Cloud Console](https://console.cloud.google.com)

---

## Suporte

Para dúvidas ou problemas:

1. Verifique a seção "Troubleshooting" em MANUAL-OAUTH2-VALIDATION.md
2. Verifique logs do backend (`dotnet run` output)
3. Verifique console do navegador (F12 → Console)
4. Verifique jwt.io para inspecionar tokens
