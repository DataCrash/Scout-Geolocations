# OAuth2 Validation — Quick Reference Card

## 1️⃣ Google Cloud Setup (5 min)

```
1. Go to https://console.cloud.google.com
2. New Project → "Scout-Geolocations-Dev"
3. Search "Google+ API" → Enable
4. Credentials → Create OAuth Client ID → Web Application
5. Add redirect URI: http://localhost:5001/auth/google/callback
6. Copy: CLIENT_ID and CLIENT_SECRET
```

## 2️⃣ Configure Environment (2 min)

### Backend: `backend/Scout.Identity.Api/appsettings.Development.json`
```json
"Google": {
  "ClientId": "YOUR_CLIENT_ID",
  "ClientSecret": "YOUR_CLIENT_SECRET",
  "RedirectUri": "http://localhost:5001/auth/google/callback"
},
"App": {
  "InitialAdminEmail": "seu-chefe@escoteiros.org.br",
  "FrontendUrl": "http://localhost:5173"
}
```

### Frontend: `frontend/scout-web/.env.local`
```
VITE_API_URL=http://localhost:5001
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID
```

## 3️⃣ Start Services (3 terminals)

### Terminal 1: Docker
```bash
cd infra
docker compose up -d postgres redis
```

### Terminal 2: Backend
```bash
cd backend/Scout.Identity.Api
dotnet restore
dotnet ef database update
dotnet run --configuration Debug
# Esperado: "Now listening on: http://localhost:5001"
```

### Terminal 3: Frontend
```bash
cd frontend/scout-web
npm install
npm run dev
# Esperado: "http://localhost:5173"
```

## 4️⃣ Test Scenarios

### ✅ Test 1: Guest Login (Always Works)
1. Open http://localhost:5173/login
2. Enter name → Click "Login as Guest"
3. Verify: Dashboard shows your name

### ✅ Test 2: OAuth2 Redirect Flow (Real)
1. Click "Sign in with Google"
2. Login with @escoteiros.org.br account
3. Verify: Dashboard with your name
4. Check DevTools → Application → Local Storage → auth-store

### ✅ Test 3: Domain Validation
1. Login with @gmail.com (NOT @escoteiros)
2. Verify: Backend rejects with error
3. Check backend logs for domain validation

### ✅ Test 4: Protected Routes
1. Delete localStorage: `localStorage.clear()`
2. Navigate to http://localhost:5173/
3. Verify: Redirects to /login

### ✅ Test 5: Logout
1. In dashboard, click "Logout"
2. Verify: Redirects to /login
3. Check: localStorage is cleared

## 5️⃣ Debug Commands

### Inspect JWT Token
```javascript
// In browser console
const store = JSON.parse(localStorage.getItem('auth-store'));
const token = store.state.token;
console.log(token);
// Paste in jwt.io to decode
```

### Check Database
```bash
docker exec -it scout-postgres psql -U postgres -d scout_identity

# SQL:
SELECT id, email, name, role FROM users 
WHERE email LIKE '%escoteiros%' 
LIMIT 5;
```

### Check Backend Logs
```bash
# Look for lines like:
# Authorization URL generated with state: ...
# User authenticated via Google: user@escoteiros.org.br
# Role assigned: ChefesEscoteiro
```

### Health Checks
```bash
# Identity API
curl http://localhost:5001/health

# PostgreSQL (from backend logs)
# Should see: "Database connection OK"

# Frontend (in browser)
http://localhost:5173 → should load login page
```

## 6️⃣ Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| "Redirect URI mismatch" | Wrong URI in Google Console | Add `http://localhost:5001/auth/google/callback` |
| "Domain not allowed" | Not using @escoteiros.org.br | Use @escoteiros account or change InitialAdminEmail |
| "CORS error" | Frontend/backend mismatch | Check CORS config in Program.cs |
| "Connection refused" | Backend not running | Run `dotnet run --configuration Debug` |
| "Token not stored" | localStorage disabled | Check browser settings, clear cookies |

## 7️⃣ E2E Tests

```bash
# Run with guest login (always works)
cd tests/e2e
npm install
npm test -- oauth2-google-real.spec.ts

# Run with real OAuth2 (requires backend)
RUN_REAL_BACKEND_E2E=1 npm test -- oauth2-google-real.spec.ts
```

## 📋 Validation Checklist

- [ ] Google Cloud Project created
- [ ] OAuth2 credentials generated
- [ ] CLIENT_ID and CLIENT_SECRET copied
- [ ] Backend appsettings configured
- [ ] Frontend .env.local configured
- [ ] Docker running (postgres + redis)
- [ ] Backend running on port 5001
- [ ] Frontend running on port 5173
- [ ] Guest login works
- [ ] OAuth2 redirect works with @escoteiros account
- [ ] Token stored in localStorage
- [ ] Dashboard displays user name
- [ ] Logout clears state
- [ ] Protected routes redirect to login
- [ ] E2E tests pass

## 🎯 Expected Outcomes

✅ **Backend**
```
info: Authorization URL generated with state: ...
info: User authenticated via Google: user@escoteiros.org.br
info: Role assigned: ChefesEscoteiro
```

✅ **Frontend**
```
URL: http://localhost:5173/
Header: "Welcome, [Your Name]"
Button: "Logout"
```

✅ **Browser Console**
```
No CORS errors
auth-store in localStorage contains:
{
  "user": { "id": "...", "name": "...", "email": "...", "role": "..." },
  "token": "eyJ..."
}
```

✅ **Database**
```
SELECT * FROM users WHERE email LIKE '%escoteiros%';
→ Returns your user with correct role
```

## 📚 Full Documentation

- [docs/authentication/README.md](./README.md) — Overview
- [docs/authentication/OAuth2-Setup.md](./OAuth2-Setup.md) — Detailed setup
- [docs/authentication/MANUAL-OAUTH2-VALIDATION.md](./MANUAL-OAUTH2-VALIDATION.md) — Step-by-step validation

## 🚀 What's Next

1. ✅ Validate manually with @escoteiros.org.br account
2. ✅ Run E2E tests: `RUN_REAL_BACKEND_E2E=1 npm test`
3. ⏳ M1.3: Role-based access control
4. ⏳ M2: Cache & Location APIs integration
5. ⏳ Production deployment

---

**Estimated time to complete**: 15-20 minutes

**Last updated**: May 15, 2026
