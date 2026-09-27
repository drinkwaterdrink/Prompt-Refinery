# Security and credentials

Prompt Refinery runs as one Express deployment. The Vite frontend and `/api/*` share an origin. Serve production traffic through HTTPS; Express trusts one reverse proxy hop for client IP handling. `GET /healthz` is public and returns only `{ "status": "ok" }`.

## Required production settings

- `NODE_ENV=production`
- `APP_ACCESS_PASSWORD`: the single-user access password. Store it in the host's secret manager.
- `COOKIE_SECRET`: a unique random signing secret of at least 32 characters. Changing it invalidates sessions.
- `PORT`: optional listening port, default 3000. The server binds `0.0.0.0`.

The process refuses to start in production when the password or cookie secret is missing. With `NODE_ENV` other than `production` and no access password, local development bypasses authentication. Do not expose that development configuration to the internet.

`GEMINI_API_KEY` and `CUSTOM_OPENAI_API_KEY` are optional server-side provider secrets. Keep `.env` out of Git. `CUSTOM_OPENAI_MODEL` is an optional model default. Browser BYOK keys are sent only to authenticated same-origin API routes and remain in volatile state or session storage. Browser extensions and a compromised device can still read BYOK secrets; use server-side keys when possible.

## Sessions and request limits

Successful login sets a versioned, HMAC-SHA256 authenticated cookie containing issuance and expiration times and a random nonce. It contains no password or provider secret. The cookie is HttpOnly and SameSite=Strict, with a 30-day maximum age; in production it is Secure. Sessions survive server restarts while `COOKIE_SECRET` stays the same. Logout clears the browser cookie. Because sessions are stateless, a copied valid token cannot be individually revoked before expiry; rotating `COOKIE_SECRET` invalidates every session. Password comparison uses a fixed-length keyed digest and timing-safe comparison. Five login requests per 15 minutes per client IP are allowed; API routes allow 300 requests per 15 minutes, with a separate 60 requests per 15 minutes limit for generation and connection tests. Rates are per process and client IP, so use one Node instance for this personal deployment.

JSON and URL-encoded request bodies are limited to 2 MiB. This allows long prompts, conversation history, and project packs while avoiding the previous 50 MiB exposure. Production responses omit error stack traces and failed provider raw output. Server logs use error categories without provider messages or credentials. Helmet sets standard security headers without an untested CSP.

## Custom OpenAI-compatible providers

Production URLs must use HTTPS, contain no embedded credentials, and have an exact hostname in `ALLOWED_CUSTOM_API_HOSTS`. When this variable is omitted, the defaults are `api.openrouter.ai,nano-gpt.com`. Set a comma-separated list to approve other exact hostnames. IP literals, localhost, internal names, and DNS results in private or metadata networks are rejected. Provider redirects are disabled and outbound calls time out after 90 seconds. Custom headers are restricted to provider-oriented fields; transport, proxy, Cookie, and Authorization headers cannot be set through the custom-header editor. An `X-Api-Key` header can be used for provider-specific authentication but stays session-only.

Development may use HTTP localhost providers such as Ollama. Custom provider hosts are operator-trusted: only approve domains you control or trust. In production, the outbound transport validates DNS again when it opens the socket and uses that validated address. An egress firewall is still recommended for defense in depth.

## Browser data

Connection profiles persist only id, name, provider, URL, model, and JSON mode. Startup rewrites legacy profiles to remove saved keys, custom headers, and unknown fields. A legacy key already loaded can remain in volatile state until the tab closes. Project packs, workflow history, and exports run through secret redaction. Do not place secrets in ordinary prompt text; arbitrary user prose cannot be reliably distinguished from credentials.

Workflow History is stored in IndexedDB; migration removes the legacy localStorage key only after a successful transaction. A non-secret local-only marker allows an already authenticated browser to reopen saved data without network access. It never grants access to Express APIs. All `/api/*` responses are network-only in the PWA service worker. Backups omit credential fields and session material; inspect files before sharing them if ordinary prompt prose contains sensitive information.

The Lock control always removes the local-only marker and locks the application UI, even without network access. Server logout is a separate request that clears the HttpOnly session cookie only when it reaches the server. A failed or unavailable logout is reported as unconfirmed; it does not imply server-side revocation. A local lock stays in effect across reloads until a fresh online password sign-in.
