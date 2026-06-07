<div align="center">
<img width="1200" height="475" alt="Prompt Refinery Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Prompt Refinery

**Version:** 0.11  
Prompt Refinery is a premium, high-fidelity developer workstation designed to run, compile, and refine raw software ideas into precision-crafted, structured prompt blueprint stacks. Engineered specifically for pairing with agentic coders (such as Antigravity, Cursor, or AI Studio), Prompt Refinery prevents tech debt, guarantees structural design system integrity, and maximizes agent speed and accuracy.

---

## ⚡ Key Workflows & Features

* **📋 Blueprint pre-compiler**: Compiles brief product prompts into comprehensive markdown blueprints detailing intent classifications, primary objectives, strict functional checklists, data entities, detailed interaction states, reliability criteria, and execution directives.
* **⚙️ Multi-Stage Refinery Pipeline**: An advanced multi-milestone workspace that progressively refines concepts through four sequential, checklist-driven stages: *Project Request Spec* → *Technical Spec* → *Implementation Plan* → *Final Vibe Prompt*, offering step copying and bulk document exporting.
* **🔍 Iterative Project Mode**: An active codebase optimizer that audits file context maps, directions, and repository details to output surgical checklists and single-step migration prompts.
* **🎨 Design System Audit**: Evaluates layout maps, UI assets descriptions, and active CSS parameters against 17 systematic spacing, accessibility, and contrast rules (WCAG AA).
* **💡 Creative Spark Catalyst**: Generates novel, defensive, and highly defensible MVP concepts tailored to stacks, difficulty, or custom novelty scales.
* **📦 Project Context Packs**: Saves durable, reusable app profiles (tech stack, current status, known issues, roadmap, source files, custom rules) and injects them instantly into model prompts as high-priority system instructions.
* **🔌 Connection Profiles Manager**: A client-side credential registry inside the Settings panel to create, save, select, and delete connection profiles (URL, keys, custom headers, JSON Mode) persisted in browser local storage for secure session continuity.
* **🎯 Codex /goal Contract Builder**: An interactive universal exporter side-drawer that parses active workspace metadata (Blueprints, Roadmaps, or Design Audits) and generates verified 5-part machine-readable goal prompt contracts optimized for autonomous agentic execution.

---

## 🛠️ The Tech Stack

* **Frontend**: React 19, TypeScript, Lucide Icons, and Vanilla CSS.
* **Styling**: TailwindCSS v4 configured with the Obsidian Cybertech Theme (electric cyan primary highlights and slate dark mode).
* **Backend**: Node.js & Express.js.
* **AI Engines Integration**: Google Gemini SDK & custom OpenAI-compatible endpoint router.
* **Bundler & Compiler**: Vite (for client assets) and esbuild (for server compilation).

---

## 🚀 Local Quickstart

### Prerequisites
* [Node.js](https://nodejs.org/) (Version 18+ recommended)
* A Google Gemini API Key (or a compatible Custom LLM proxy endpoint)

### Installation
1. Clone the repository and navigate to the directory:
   ```bash
   git clone https://github.com/drinkwaterdrink/Prompt-Refinery.git
   cd Prompt-Refinery
   ```
2. Install all dependencies:
   ```bash
   npm install
   ```
3. Set up your local environment file:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` to include your `GEMINI_API_KEY` (or configure Custom LLM keys transiently in the client Settings modal).*

### Local Development Lifecycle
* **Running Development Server**:
  ```bash
  npm run dev
  ```
  *Launches the server on `http://localhost:3000` with hot-reloading active.*
* **Production Packaging & Bundle**:
  ```bash
  npm run build
  ```
  *Compiles and builds minified static assets via Vite, and bundles the Express server via esbuild into `dist/server.cjs`.*
* **Spinning Up Production Server**:
  ```bash
  npm run start
  ```
  *Executes the bundled, production-ready server process.*
* **TypeScript Integrity Type check**:
  ```bash
  npm run lint
  ```
  *Runs non-emitting strict static compilation checks over all modules.*

---

## 📖 Comprehensive Guides & Documentation

To learn more about configuring, extending, or deploying Prompt Refinery, explore our dedicated guides:

1. [🔌 Backend API Reference](file:///c:/Users/trent/antigravity/Prompt-Refinery/docs/API_ENDPOINTS.md) — Detailed Express server routes, request payloads, response schemas, and telemetry formats.
2. [📋 The Prompt Recipe Library](file:///c:/Users/trent/antigravity/Prompt-Refinery/docs/PROMPT_RECIPES.md) — Explains recipe schemas, registries, custom recipe additions, and Quality Profiles integrations.
3. [📱 Mobile Local Network Access](file:///c:/Users/trent/antigravity/Prompt-Refinery/docs/PHONE_ACCESS.md) — How to access the workspace from your smartphone, find LAN IPs, and configure Windows Defender Firewall port rules.
4. [☁️ Cloud Deployment Readiness](file:///c:/Users/trent/antigravity/Prompt-Refinery/docs/DEPLOYMENT.md) — Hosting guidelines for Railway, Render, Fly.io, or VPS, and limitations of static-only decoders.
5. [🔒 Security & Key Hygiene Policy](file:///c:/Users/trent/antigravity/Prompt-Refinery/docs/SECURITY.md) — Outlines BYOK storage transient policies, server secrets management, and automated logs redactions.

---

## 🔮 Roadmap & Future Directions

* **Ollama Local Embedding**: Enable vector-based codebase indexing locally using native Ollama integrations.
* **Cursor Settings Sync**: Directly write and synchronize compiled prompt blueprints to `.cursorrules` in local workspaces.
* **Telemetry Latency Graphs**: Display real-time token cost and model generation latency logs inside the Diagnostics panel.
* **Canvas Layout Editor**: Implement a visual blueprint node builder mapping functional objectives to UI components on a draggable drag-and-drop canvas.
