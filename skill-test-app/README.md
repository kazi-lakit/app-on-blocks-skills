# skill-test-app — Blocks SSO demo

React 19 + Vite app that signs users in via **Blocks SSO** (authorization-code flow through a `blocks-oidc` identity provider).

## What was configured in the OS portal

Pulled from the OS portal via agent-only login (`POST /iam/v4/auth-login`) and configured against project **skill-test-app** (dev):

| Setting | Value |
|---|---|
| Project tenant id (`PTENANT`) | `D7b1510789d2648d0b9458cf076222410` |
| OIDC client id | `3b547b66-8e8d-40bd-ab9b-d68a6121da71` |
| OIDC redirect URI | `https://ddmpzt.slsblx.com:5173/callback` |
| OIDC scope / response type | `openid` / `code` (PKCE on the client, off on the provider) |
| Allowed service resources | iam, monitor, data, utilities, agent, os, localization, release |

Created on the project:
- **OIDC client** (`POST /iam/v4/oidc-clients`, `projectKey: <PTENANT>`) — updated via POST upsert to set the port-bearing redirectUri.
- **Identity provider** (`POST /iam/v4/auth/identity-providers`, `providerType: "blocks-oidc"`, `provider: "skill-test-app-sso"`) — updated via `PUT /iam/v4/auth/identity-providers/{itemId}` to set the port-bearing redirectUri.

Smoke-tested with `GET /iam/v4/idp/initiate?…` — returns the hosted authorize URL with state+nonce.

## Run locally

The callback sets a Secure, domain-scoped cookie — the dev server **must** be served over HTTPS on the registered redirect URI's domain (`ddmpzt.slsblx.com`), not on `http://localhost`.

```bash
npm install
npm run dev   # serves https://ddmpzt.slsblx.com:5173
```

Open **https://ddmpzt.slsblx.com:5173** (NOT `http://localhost:5173`) and click **Sign in with Blocks**. After the Blocks-hosted login, `/iam/v4/idp/callback` sets the session cookie for `ddmpzt.slsblx.com` and the app navigates to `/`.

### One-time local-HTTPS setup (already done on this machine)

```bash
# 1) hosts entry — sudo (you ran this manually)
echo '127.0.0.1  ddmpzt.slsblx.com' | sudo tee -a /etc/hosts

# 2) self-signed cert for the domain (SAN must include ddmpzt.slsblx.com)
mkdir -p .cert
openssl req -x509 -newkey rsa:2048 -nodes -sha256 -days 365 \
  -keyout .cert/dev-key.pem -out .cert/dev-cert.pem \
  -subj "/CN=ddmpzt.slsblx.com" \
  -addext "subjectAltName=DNS:ddmpzt.slsblx.com,DNS:localhost,IP:127.0.0.1"

# 3) trust in user keychain (sudo-free, restart browser after)
security add-trusted-cert -d -r trustRoot \
  -k ~/Library/Keychains/login.keychain-db .cert/dev-cert.pem
```

`vite.config.ts` binds to `ddmpzt.slsblx.com:5173` with the cert above; `strictPort: true` so the port can't drift from the registered `redirectUri`.

Build:
```bash
npm run build
```

## Files

- `src/features/auth/sso.ts` — `startLogin` (GET `/iam/v4/idp/initiate` → redirect) and `finishLogin` (GET `/iam/v4/idp/callback`, sets cookie).
- `src/features/auth/login-button.tsx` — triggers `startLogin`.
- `src/features/auth/callback-page.tsx` — mounted at `/callback`; calls `finishLogin` then navigates home.
- `src/App.tsx` — routes `/` and `/callback`.
- `vite.config.ts` — HTTPS dev server bound to `ddmpzt.slsblx.com:5173`.
