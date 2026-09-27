# Deployment Guide

This guide outlines options, constraints, and recommendations for deploying Prompt Refinery to external servers or cloud environments.

---

## The Server vs. Static Boundary

> [!IMPORTANT]
> **Prompt Refinery requires one Node/Express deployment.**
> Express serves the Vite frontend, authentication routes, health endpoint, and `/api/*` on the same origin. Put the deployment behind HTTPS.

### GitHub Pages Limitation
* **GitHub Pages, Vercel (static), and Netlify (static)** cannot host the backend server routes.
* If you host only the `dist` static folder on GitHub Pages, the application will load the UI shell but **all live LLM calls (Gemini and Custom OpenAI) will fail** due to missing `/api/` endpoints.
* Static-only hosting is unsupported, including for the hosted login flow.

---

## Recommended Deployment Providers (Node-Capable)

To enjoy the full feature set (Gemini, Custom API endpoints, diagnostics, sparks, and reviews), deploy the application to a cloud host capable of running Node.js server processes.

### 1. Render (Web Services)
* **Type**: Managed Platform-as-a-Service (PaaS).
* **Setup**:
  1. Create a new **Web Service** linked to your Prompt Refinery repository.
  2. Set **Runtime** to `Node`.
  3. Set **Build Command** to:
     ```bash
     npm install && npm run build
     ```
  4. Set **Start Command** to:
     ```bash
     npm run start
     ```
  5. Add Environment Variables (see `.env.example`).

### 2. Railway
* **Type**: Highly intuitive PaaS.
* **Setup**:
  1. Create a new project, select **Deploy from GitHub repo**, and select Prompt Refinery.
  2. Railway automatically detects `package.json` scripts and triggers builds.
  3. Add environment variables in the project's **Variables** tab.

### 3. Fly.io
* **Type**: Global application distribution platform.
* **Setup**:
  1. Run `fly launch` in your terminal.
  2. Fly.io will generate a `Dockerfile` compiling the Node process.
  3. Configure environment secrets via `fly secrets set GEMINI_API_KEY="..."`.

### 4. VPS / Self-Hosted (DigitalOcean, AWS EC2, Linode)
* Set up a Linux server with Node.js 24 LTS and an HTTPS reverse proxy like **Nginx**.
* Keep the server running continuously using a process manager like **PM2**:
  ```bash
  npm install
  npm run build
  pm2 start dist/server.cjs --name "prompt-refinery"
  ```

---

## Build & Production Lifecycle

Prompt Refinery packages both client assets and server bundles into a clean `dist` folder:

### 1. The Build Command
```bash
npm run build
```
This script executes:
1. `vite build` — Compiles React components, styles, and assets into static files inside `dist/`.
2. `esbuild server.ts --bundle --platform=node` — Compiles and bundles the TypeScript backend server code into a single, high-performance CommonJS file at `dist/server.cjs`.

### 2. The Start Command
```bash
npm run start
```
This command runs the compiled production server process:
```bash
node dist/server.cjs
```
This is the command that must be triggered by your hosting provider in production environments.

Set `NODE_ENV=production`, `APP_ACCESS_PASSWORD`, and a random `COOKIE_SECRET` of at least 32 characters in the host secret manager. `GEMINI_API_KEY` and `CUSTOM_OPENAI_API_KEY` are optional server-side AI keys. The default custom provider hostname allowlist is OpenRouter and NanoGPT; use `ALLOWED_CUSTOM_API_HOSTS` for additional exact hostnames. `PORT` is optional and defaults to 3000. The application refuses to start without production authentication secrets. See [Security](SECURITY.md) for limits, cookies, and credential handling.
