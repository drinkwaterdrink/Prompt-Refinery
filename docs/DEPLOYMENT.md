# Deployment Guide

This guide outlines options, constraints, and recommendations for deploying Prompt Refinery to external servers or cloud environments.

---

## The Server vs. Static Boundary

> [!IMPORTANT]
> **Prompt Refinery is NOT a static-only web application.**
> Because of API authentication protocols, Gemini SDK routing, CORS safety constraints, and session isolation, Prompt Refinery consists of a **React frontend** and an **Express.js backend server** that communicate continuously.

### GitHub Pages Limitation
* **GitHub Pages, Vercel (static), and Netlify (static)** cannot host the backend server routes.
* If you host only the `dist` static folder on GitHub Pages, the application will load the UI shell but **all live LLM calls (Gemini and Custom OpenAI) will fail** due to missing `/api/` endpoints.
* **Exceptions**: Static-only hosting *can* support the offline **🎭 Mock Mode** 100% locally on the client. If you only intend to run simulations and saved client histories offline, a static deploy is sufficient.

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
* Set up a Linux server with Node.js 18+ and a reverse proxy like **Nginx**.
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
