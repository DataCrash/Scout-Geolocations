# OAuth2 Google Authentication — Setup Guide

## Overview

Scout Geolocations uses **Google OAuth 2.0** for authenticating users with `@escoteiros.org.br` email addresses. The authentication flow supports both:

1. **Redirect Flow (Recommended)** — Server-side OAuth2 with browser redirect
   - User clicks "Sign in with Google"
   - Browser redirects to Google login
   - Google redirects back to `/auth/google/callback`
   - Backend exchanges code for JWT token and redirects to frontend

2. **Direct Token Flow (Legacy)** — Frontend obtains ID token and sends to backend
   - Frontend uses Google Sign-In JavaScript library
   - Frontend sends ID token to `/auth/google`
   - Backend validates and returns JWT

## Setup: Google Cloud Console

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project: `Scout Geolocations`
3. Enable the **Google+ API**

### 2. Create OAuth 2.0 Credentials

1. Go to **Credentials** → **Create Credentials** → **OAuth Client ID**
2. Choose **Web application**
3. Add Authorized JavaScript origins:
   ```
   http://localhost:5173
   http://localhost:5001
   https://your-production-domain.com
   ```
4. Add Authorized redirect URIs:
   ```
   http://localhost:5001/auth/google/callback
   https://your-production-domain.com/auth/google/callback
   ```
5. Copy **Client ID** and **Client Secret**

### 3. Configure Environment

#### Development (`.env` in `infra/` folder)

```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5001/auth/google/callback
```

#### Production

Use environment variables or `.env` file on your deployment:

```bash
GOOGLE_CLIENT_ID=your-production-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-production-client-secret
GOOGLE_REDIRECT_URI=https://your-production-domain.com/auth/google/callback
JWT_KEY=your-secure-random-key-openssl-rand-base64-32
INITIAL_ADMIN_EMAIL=chefe@escoteiros.org.br
```

## Backend API Endpoints

### Redirect Flow

#### 1. Start OAuth Flow

```http
POST /auth/google/authorize

Response:
{
  "authorizationUrl": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "state": "uuid-for-state-validation"
}
```

**Frontend action:** Redirect user to `authorizationUrl`

#### 2. OAuth Callback (Automatic Redirect)

```http
GET /auth/google/callback?code=AUTHORIZATION_CODE&state=STATE

Response (Redirect):
Location: http://localhost:5173/auth/callback?token=JWT_TOKEN&userId=UUID&name=USER_NAME&role=ROLE
```

**Frontend action:**

1. Store JWT token
2. Validate email domain
3. Update user state
4. Redirect to dashboard

### Direct Token Flow (Legacy)

```http
POST /auth/google

Body:
{
  "idToken": "google-id-token-from-frontend"
}

Response:
{
  "token": "jwt-token",
  "userId": "user-uuid",
  "name": "User Name",
  "role": "Integrante|ChefesEscoteiro"
}
```

### Verify Authentication

```http
GET /auth/me
Authorization: Bearer JWT_TOKEN

Response:
{
  "id": "user-uuid",
  "name": "User Name",
  "email": "user@escoteiros.org.br",
  "role": "Integrante|ChefesEscoteiro"
}
```

## Frontend Integration

### Option 1: Google Sign-In JavaScript Library (Recommended)

Install Google sign-in library:

```bash
npm install @react-oauth/google
```

Example React component:

```typescript
import { GoogleLogin } from '@react-oauth/google';

export function LoginPage() {
  return (
    <GoogleLogin
      onSuccess={(credentialResponse) => {
        fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idToken: credentialResponse.credential
          })
        })
        .then(res => res.json())
        .then(data => {
          localStorage.setItem('token', data.token);
          window.location.href = '/dashboard';
        });
      }}
      onError={() => console.log('Login Failed')}
    />
  );
}
```

### Option 2: OAuth2 Redirect Flow

```typescript
async function initiateGoogleOAuth() {
  const response = await fetch("/auth/google/authorize", { method: "POST" });
  const { authorizationUrl } = await response.json();
  window.location.href = authorizationUrl;
}

// In your callback page (/auth/callback):
function OAuthCallback() {
  const queryParams = new URLSearchParams(window.location.search);
  const token = queryParams.get("token");
  const userId = queryParams.get("userId");
  const role = queryParams.get("role");

  if (token) {
    localStorage.setItem("token", token);
    localStorage.setItem("userId", userId);
    localStorage.setItem("userRole", role);
    window.location.href = "/dashboard";
  } else {
    window.location.href = "/login?error=auth_failed";
  }
}
```

## User Roles & Permissions

When a user authenticates via Google, they are automatically assigned a role:

| Role              | Criteria                             | Permissions                                                       |
| ----------------- | ------------------------------------ | ----------------------------------------------------------------- |
| `ChefesEscoteiro` | Email matches `INITIAL_ADMIN_EMAIL`  | Full admin access: CRUD all entities, manage users, manage admins |
| `Integrante`      | Any other `@escoteiros.org.br` email | Create Patrulha, join events, complete challenges                 |
| `Convidado`       | Via `/auth/guest` (no Google)        | Temporary session, limited features                               |

## Troubleshooting

### "Google:ClientId não configurado"

- Verify `GOOGLE_CLIENT_ID` is set in environment variables
- Check Docker Compose passes `Google__ClientId` to service

### "Apenas contas @escoteiros.org.br são permitidas"

- Only `@escoteiros.org.br` email addresses are allowed
- Contact organizer to request account creation

### "Redirect URI mismatch"

- Verify `GOOGLE_REDIRECT_URI` matches exactly what's configured in Google Cloud Console
- Common issue: trailing slashes or `http` vs `https`

### JWT Token not working

- Verify `JWT_KEY` environment variable is set (min 32 bytes)
- Check token expiration (default: 8 hours)
- Validate `Authorization: Bearer TOKEN` header format

## Testing

### Manual Testing

```bash
# Start services
cd infra && docker compose up -d

# Test redirect flow initiation
curl -X POST http://localhost:5001/auth/google/authorize

# Test guest login (no Google needed)
curl -X POST http://localhost:5001/auth/guest \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User"}'
```

### E2E Testing

See [E2E Testing Guide](../e2e/README.md) for Playwright specs with real OAuth2 flow.

## References

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Sign-In JavaScript Library](https://developers.google.com/identity/sign-in/web)
- [React OAuth Google Package](https://www.npmjs.com/package/@react-oauth/google)
