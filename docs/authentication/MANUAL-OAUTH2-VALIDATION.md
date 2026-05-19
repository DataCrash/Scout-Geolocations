# Validação Manual — Fluxo OAuth2 Google

## Pré-requisitos

- [ ] Conta Google com acesso ao Google Cloud Console
- [ ] Contas de teste `@escoteiros.org.br` (Chefe e Jovem)
- [ ] Node.js 18+ instalado
- [ ] .NET 8 SDK instalado
- [ ] Docker Desktop funcionando

## Passo 1: Setup Google Cloud Console

### 1.1 Criar Projeto

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Clique em **Select a Project** → **New Project**
3. Nome: `Scout-Geolocations-Dev`
4. Clique **Create**
5. Aguarde criação (2-3 minutos)

### 1.2 Ativar Google+ API

1. Na barra de pesquisa, digite **Google+ API**
2. Clique em **Google+ API** (não confundir com GooglePlus)
3. Clique **Enable**

### 1.3 Criar OAuth2 Credentials

1. Menu lateral → **Credentials**
2. Clique **+ Create Credentials** → **OAuth client ID**
3. Se pedir para configurar OAuth consent screen:
   - Clique **Configure Consent Screen**
   - User Type: **External**
   - Clique **Create**
   - Preencha:
     - App name: `Scout Geolocations Dev`
     - User support email: sua email Google
     - Developer contact: sua email Google
   - Clique **Save and Continue**
   - (Skip "Scopes" e "Test users")
   - Clique **Back to Dashboard**

4. Novamente em **Credentials** → **+ Create Credentials** → **OAuth client ID**
5. Application type: **Web application**
6. Name: `Scout Local Dev`
7. Authorized redirect URIs → **Add URI**:
   - `http://localhost:5001/auth/google/callback`
8. Clique **Create**
9. Copie **Client ID** e **Client Secret**

### 1.4 Configuração Final

Guarde:

```
CLIENT_ID = "xxx-yyy.apps.googleusercontent.com"
CLIENT_SECRET = "GOCSP_xxxxxx"
REDIRECT_URI = "http://localhost:5001/auth/google/callback"
```

---

## Passo 2: Configurar Ambiente Local

### 2.1 Backend Configuration

Abra `backend/Scout.Identity.Api/appsettings.Development.json` e confirme:

```json
{
  "Google": {
    "ClientId": "seu-client-id.apps.googleusercontent.com",
    "ClientSecret": "seu-client-secret",
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
  },
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=scout_identity;Username=postgres;Password=postgres"
  }
}
```

### 2.2 Frontend Configuration

Crie `frontend/scout-web/.env.local` (copie de `.env.example`):

```env
VITE_API_URL=http://localhost:5001
```

---

## Passo 3: Iniciar Serviços

### Terminal 1: Docker (PostgreSQL)

```bash
cd infra
docker compose up -d postgres redis

# Verificar se subiu
docker compose logs postgres | head -20
```

### Terminal 2: Backend (Identity Service)

```bash
cd backend/Scout.Identity.Api

# Restaurar dependências
dotnet restore

# Aplicar migrations
dotnet ef database update

# Rodar em Debug
dotnet run --configuration Debug
```

Output esperado:

```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: http://localhost:5001
```

### Terminal 3: Frontend (Vite Dev Server)

```bash
cd frontend/scout-web

# Instalar dependências
npm install

# Rodar dev server
npm run dev
```

Output esperado:

```
VITE v5.x.x ready in X ms

➜  Local:   http://localhost:5173/
```

---

## Passo 4: Validação Manual do Fluxo

### 4.1 Teste 1: Login como Guest (Rápido)

1. Abra http://localhost:5173/login
2. Veja a página com 2 opções:
   - **Sign in with Google**
   - **Guest Login** (form com input de nome)
3. Preencha nome: `Teste Local [DATA]`
4. Clique **Login as Guest**
5. **Esperado**: Redireciona para dashboard, exibe seu nome no header

**✅ Se funcionou**: Arquitetura de routing + auth store OK

---

### 4.2 Teste 2: Fluxo OAuth2 Completo

#### 2a. Iniciar Fluxo

1. Clique **Sign in with Google**
2. **Backend fará**: POST /auth/google/authorize
3. **Frontend redireciona** para Google login

#### 2b. Google Authentication

1. Na tela do Google, faça login com conta **@escoteiros.org.br**
   - Se já estiver logado, pode pular
   - Se pedir permissões, aceite
2. Google redireciona para:
   ```
   http://localhost:5001/auth/google/callback?code=XXXX&state=YYYY
   ```

#### 2c. Backend Processing

Backend neste ponto:

1. Valida `code` com Google
2. Obtém `id_token` do Google
3. Extrai email do token
4. **Valida domínio**: Se `@escoteiros.org.br` ✅, senão ❌ rejeita
5. Se novo usuário:
   - Cria conta no banco
   - Atribui role: `ChefesEscoteiro` (se email = InitialAdminEmail)
   - Ou `Integrante` (caso contrário)
6. Gera JWT
7. Redireciona para:
   ```
   http://localhost:5173/auth/callback?token=JWT&userId=...&name=...&role=...
   ```

#### 2d. Frontend Processing

Frontend:

1. OAuthCallbackPage extrai params
2. Armazena token em localStorage via Zustand
3. Redireciona para dashboard
4. Dashboard exibe nome do usuário

**✅ Se funcionou**: Fluxo OAuth2 completo OK

---

## Passo 5: Testes Adicionais

### Teste 3: Verificar Domínio

**Para validar rejeição de domínio:**

1. Deslogue (clique Logout no header)
2. Tente novo login com conta **@gmail.com** (não @escoteiros.org.br)
3. **Esperado**: Backend rejeita, redireciona para login com erro
4. Verifique console do navegador (DevTools) para erro exato

---

### Teste 4: Verificar Token JWT

**Para inspecionar token gerado:**

1. Após login, abra DevTools (F12)
2. Vá para **Application** → **Local Storage** → `http://localhost:5173`
3. Procure chave `auth-store`
4. Copie o token (começa com `eyJ...`)
5. Cole em [jwt.io](https://jwt.io) para decodificar
6. **Esperado**: Claims incluem:
   - `sub` = userId
   - `email` = seu email @escoteiros.org.br
   - `role` = ChefesEscoteiro ou Integrante
   - `name` = seu nome

---

### Teste 5: Verificar Banco de Dados

**Para confirmar usuário criado:**

```bash
# Conectar ao PostgreSQL
docker exec -it scout-postgres psql -U postgres -d scout_identity

# SQL:
SELECT id, email, name, role, created_at FROM users
WHERE email LIKE '%escoteiros%'
ORDER BY created_at DESC
LIMIT 5;

# Esperado: Seu usuário com role ChefesEscoteiro ou Integrante
```

---

### Teste 6: Rota Protegida

**Para validar proteção de rota:**

1. Abra localStorage e delete `auth-store`
2. Ou abra navegador em modo privado
3. Acesse direto http://localhost:5173/
4. **Esperado**: Redireciona para http://localhost:5173/login

---

### Teste 7: Logout

**Para validar limpeza de estado:**

1. No dashboard, clique **Logout**
2. **Esperado**: Redireciona para login
3. Verifique localStorage: `auth-store` deve estar vazio ou com estado zerado

---

## Passo 6: Verificações Backend

### 6a. Logs do Backend

Procure nos logs do terminal:

```
info: Scout.Identity.Api.Services.GoogleOAuthService[0]
      Authorization URL generated with state: ...

info: Scout.Identity.Api.Endpoints.AuthEndpoints[0]
      User authenticated via Google: user@escoteiros.org.br
      Role assigned: ChefesEscoteiro
```

### 6b. Verificar Endpoints

Use cURL ou Postman:

```bash
# 1. Obter authorization URL
curl -X POST http://localhost:5001/auth/google/authorize
# Response:
# {
#   "authorizationUrl": "https://accounts.google.com/o/oauth2/v2/auth?...",
#   "state": "xxx"
# }

# 2. Verificar usuário autenticado (com token válido)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:5001/auth/me
# Response:
# {
#   "id": "...",
#   "name": "...",
#   "email": "...",
#   "role": "ChefesEscoteiro"
# }
```

---

## Troubleshooting

### Problema: "Redirect URI mismatch"

**Causa**: Google não reconhece a URI configurada

**Solução**:

1. Google Cloud Console → Credentials
2. Clique no client ID `Scout Local Dev`
3. Confirme **Authorized redirect URIs** inclui:
   - `http://localhost:5001/auth/google/callback`
4. Salve e aguarde 1 minuto

---

### Problema: "Domain not allowed"

**Causa**: Email não é @escoteiros.org.br

**Solução**:

1. Use conta Google com domínio @escoteiros.org.br
2. Ou altere `INITIAL_ADMIN_EMAIL` em appsettings para testar

---

### Problema: "Token rejected by frontend"

**Causa**: Token inválido ou localStorage corrompido

**Solução**:

1. Limpe localStorage: `localStorage.clear()` no console
2. Limpe cookies: DevTools → Application → Cookies → delete all
3. Faça login novamente

---

### Problema: "Connection refused localhost:5001"

**Causa**: Backend não está rodando

**Solução**:

1. Verifique se terminal do backend está ativo
2. Confirme output: "Now listening on: http://localhost:5001"
3. Reinicie: `dotnet run --configuration Debug`

---

### Problema: "IDX10720" / chave JWT curta

**Causa**: `Jwt:Key` com menos de 32 bytes para HS256

**Solução**:

1. Abra `backend/Scout.Identity.Api/appsettings.Development.json`
2. Confirme que `Jwt:Key` tem ao menos 32 bytes
3. Se estiver usando Docker/variável de ambiente, alinhe `JWT_KEY` ou `Jwt__Key`
4. Reinicie a Identity API

---

### Problema: "CORS error in console"

**Causa**: Configuração CORS incorreta

**Solução**:

1. Verifique `Program.cs`:
   ```csharp
   builder.Services.AddCors(options =>
   {
       options.AddPolicy("AllowFrontend",
           builder =>
           {
               builder
                   .WithOrigins("http://localhost:5173")
                   .AllowAnyMethod()
                   .AllowAnyHeader()
                   .AllowCredentials();
           });
   });
   ```
2. Se ainda tiver problema, expanda para `AllowAnyOrigin()`

---

## Checklist Final de Validação

- [ ] Google Cloud Console tem projeto e credentials
- [ ] Variáveis de ambiente (.env) configuradas
- [ ] Backend rodando na porta 5001
- [ ] Frontend rodando na porta 5173
- [ ] Login guest funciona
- [ ] Fluxo OAuth2 com @escoteiros.org.br funciona
- [ ] Token armazenado em localStorage
- [ ] Dashboard exibe nome do usuário
- [ ] Logout limpa estado
- [ ] Rota protegida redireciona se sem auth
- [ ] Domínio não-autorizado é rejeitado
- [ ] Logs mostram transações corretas

---

## Próximas Ações

Após validação manual bem-sucedida:

1. ✅ Executar E2E tests com `RUN_REAL_BACKEND_E2E=1 npm test`
2. ✅ Mergear PR #24 para `develop` (já feito)
3. ✅ Iniciar M1.3 (role-based access control)
4. ✅ Preparar produção (SSL, secrets manager, etc.)

---

## Documentação Relacionada

- [OAuth2-Setup.md](./OAuth2-Setup.md) — Configuração Google Cloud
- [backend/Scout.Identity.Api/Services/GoogleOAuthService.cs](../../backend/Scout.Identity.Api/Services/GoogleOAuthService.cs) — Implementação backend
- [frontend/scout-web/src/services/authApi.ts](../../frontend/scout-web/src/services/authApi.ts) — Implementação frontend
