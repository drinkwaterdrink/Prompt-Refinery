<div align="center">
<img width="1200" height="475" alt="Prompt Refinery Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Prompt Refinery

**Version:** 0.04  
An advanced, premium pre-compiler and modular planning workstation engineered to refine rough software ideas into precision-crafted prompt specifications, architectural blueprints, and atomic coding roadmaps optimized for secondary coding agents (like Antigravity or Cursor).

---

## 📖 Table of Contents
1. [Core Features Walkthrough](#-core-features-walkthrough)
   - [Multi-Stage Refinery Pipeline](#1-multi-stage-refinery-pipeline-new)
   - [Creative Spark Catalyst](#2-creative-spark-catalyst)
   - [Quick Blueprint Mode & Refinement Loop](#3-quick-blueprint-mode--refinement-loop)
   - [Engine Settings & Security Diagnostics](#4-engine-settings--security-diagnostics)
2. [The Prompt Recipe Library (Deep Dive)](#-the-prompt-recipe-library-deep-dive)
   - [Quick Blueprint (`blueprint`)](#1-quick-blueprint-blueprint)
   - [Idea Refinement (`idea_refinement`)](#2-idea-refinement-idea_refinement)
   - [Technical Specification (`technical_spec`)](#3-technical-specification-technical_spec)
   - [Implementation Plan (`implementation_plan`)](#4-implementation-plan-implementation_plan)
   - [Code Review / Optimization (`code_review`)](#5-code-review--optimization-code_review)
   - [Design Principles / Audit (`design_audit`)](#6-design-principles--audit-design_audit)
   - [Black-Swan Ideation (`black_swan`)](#7-black-swan-ideation-black_swan)
   - [Final Vibe Prompt (`final_vibe`)](#8-final-vibe-prompt-final_vibe)
3. [Running Locally](#-running-locally)
4. [Verification and Build Checks](#-verification-and-build-checks)

---

## 🚀 Core Features Walkthrough

### 1. Multi-Stage Refinery Pipeline (NEW)
The **Refinery Pipeline** is a premium sequential planning workstation. It transforms raw prompts progressively through four evolutionary stages, ensuring that by the time you start coding, every structural detail has been thoroughly mapped out.

- **The Flow**: Stage 1 (Project Request Spec) $\rightarrow$ Stage 2 (Technical Spec) $\rightarrow$ Stage 3 (Implementation Plan) $\rightarrow$ Stage 4 (Final Vibe Prompt).
- **Progressive Context Accumulation**: Each subsequent stage dynamically inherits the markdown specifications compiled in all preceding stages. When you trigger Stage 2, the pipeline hook automatically appends the Stage 1 Project Request markdown into the request context. By Stage 4, all specifications are fused.
- **Sequential Unlock Gates**: Prerequisite checks prevent out-of-order execution. Stage $N$ is locked and protected until Stage $N-1$ is fully compiled.
- **Timeline Cards**: Each stage card displays detailed subtitles, golden status badges, active pulse spinners, local scrollview viewports, rapid clipboard copying, and individual markdown file downloads.
- **Bulk Exporters**: Users can export the entire pipeline progress as a single, combined master Markdown document or a full history JSON packet.

---

### 2. Creative Spark Catalyst
Designed for "vibe coding" sessions where you want to start a fresh project but need a high-novelty, buildable software concept.

- **Generation Modes**: 
  - **Practical**: Standard high-utility offline-first personal trackers, local logs, or developer utilities.
  - **Unusual**: Niche tools, retro-inspired mechanics, relationship maps, lorebooks, or Web Audio synthesizers.
  - **Black-Swan**: Defensible startup concepts fuzing 2-3 unrelated technical pillars, resolving a catalyst problem, and applying an unconventional constraint (e.g. ambient voice-first, ephemeral, zero-UI, deliberate friction).
- **Zero-UI & Pillared Concepts**: Automatically populates catalysts, pillars, why-now indicators, and pre-fills raw prompts, contexts, and simulated chat histories inside the workspace.
- **Interactive Drawer**: A slide-over sheet featuring novelty tabs, refresh buttons, and pillar badges. Selecting an idea pre-fills the workspace for manual review before triggering compilation.

---

### 3. Quick Blueprint Mode & Refinement Loop
The standard pre-compilation flow that translates a raw prompt into a unified JSON blueprint containing problem definitions, architectural layouts, and UX component structures.

- **Unified Schema Dashboard**: Organizes outputs into tabbed panels detailing Overview, Requirements, Architecture, UX, Reliability, Final Prompt, and raw JSON code.
- **Interactive Requirement Cards**: Displays core user objectives and infers implicit system assumptions.
- **Assumption Refinement Revision Loop**: Users can review system assumptions, reject incorrect ones, type in manual corrections, and trigger a refinement cycle. The system revises the blueprint structure on the fly without losing unchanged sections.

---

### 4. Engine Settings & Security Diagnostics
Configures model attributes while maintaining the highest standard of data safety.

- **Custom Settings Modal**: Select active models (e.g., `gemini-3.5-flash`), adjust temperature curves, configure output limits, toggle strict response schemas, and enter private API keys (BYOK mode).
- **Recursive Secret Redactor**: Before saving history logs to LocalStorage or exporting JSON vibe packets, a recursive scanner identifies and replaces sensitive API key strings (`GEMINI_API_KEY`, etc.) with `[REDACTED]`.
- **Diagnostics HUD**: A collapsible real-time system diagnostics head-up display outlining connection statuses, key logs, schema requirements, and sanitized backend stack traces.

---

## 🎨 The Prompt Recipe Library (Deep Dive)

Prompt Refinery features a modular registry of pre-compiler recipes. Each recipe is equipped with a specialized system instruction, a custom context compiler, and local mock generators.

---

### 1. Quick Blueprint (`blueprint`)
* **What it is**: The default pre-compiler that translates rough inputs into an all-in-one JSON blueprint outlining objectives, constraints, HSL styles, database tables, and reliability states.
* **When to use**: When you want an all-in-one system specification with an active assumption refinement loop to start vibe coding immediately.
* **Use Case Example**: Building a client-side offline fitness logging workspace.
  * **Input**: *"build me a workout logger"*
  * **Output**: A comprehensive JSON blueprint featuring structured must-have requirements, an entity schema catalog, local storage caching indicators, HSL amber/gold color palettes, and a final compiled system instruction.

---

### 2. Idea Refinement (`idea_refinement`)
* **What it is**: Transforms rough prompts into a fully organized Markdown Project Request with descriptions, audience, core features, styling guidelines, WCAG accessibility benchmarks, and open questions.
* **When to use**: When you have a raw app concept and need to scope out its general product requirements before writing a line of code.
* **Use Case Example**: Pitching or drafting the requirement specifications for a voice-activated grocery list.
  * **Input**: *"voice shopping list"*
  * **Output**: A markdown file with headers `# Project Name`, `## Target Audience`, `## Desired Features` outlining voice wake-word triggers, speech-to-text parsers, offline state caches, and accessibility speech feedback loops.

---

### 3. Technical Specification (`technical_spec`)
* **What it is**: Elaborates the product specs into an analytical 11-layered software architecture document touching backend models, API boundaries, entity relationships, performance latency, security constraints, and devops paradigms.
* **When to use**: When you have defined product requests and need to plan the database schemas and infrastructure layers.
* **Use Case Example**: Designing the schema relationships for a multiplayer browser card game.
  * **Input**: *"multiplayer card game spec"*
  * **Output**: An architecture specification detailing WebSocket message patterns, game state entity schemas, rate-limiting, and microservice container deployment setups.

---

### 4. Implementation Plan (`implementation_plan`)
* **What it is**: Creates a highly detailed, atomic coding roadmap split into sequential milestones, ensuring that each step modifies less than 20 files for a secondary agent.
* **When to use**: When you want to construct a meticulous checklist to paste into Cursor or Antigravity to build step-by-step.
* **Use Case Example**: Structuring the refactoring stages of a large monolith into microservices.
  * **Input**: *"monolith refactoring checklist"*
  * **Output**: An atomic implementation plan with step-by-step checklists, target scopes, and precise unit verification commands (`npm run test`) for each milestone.

---

### 5. Code Review / Optimization (`code_review`)
* **What it is**: Audits raw source files or developer notes and constructs a prioritized performance optimization list.
* **When to use**: When you are refactoring legacy code, cleaning up technical debt, or optimizing render counts.
* **Use Case Example**: Benchmarking and fixing slow React renders or database query speeds.
  * **Input**: *"review these slow React components"*
  * **Output**: An audit report identifying expensive computation blocks, recommending `useMemo`/`useCallback` additions, and documenting query indexing guidelines.

---

### 6. Design Principles / Audit (`design_audit`)
* **What it is**: Assesses layouts against spacing tokens, cohesive HSL amber/gold color palettes, WCAG contrast compliance, responsive grids, micro-animations, and component state charts.
* **When to use**: When you want to audit your frontend layouts to ensure they look premium, responsive, and beautifully alive.
* **Use Case Example**: Polishing a dashboard design to eliminate plain raw CSS layouts.
  * **Input**: *"improve my dashboard visual layout"*
  * **Output**: A visual guidelines checklist detailing specific CSS glassmorphism styles (`backdrop-filter`), cohesive charcoal gradients, amber transitions, and accessibility contrast standards.

---

### 7. Black-Swan Ideation (`black_swan`)
* **What it is**: Conceptualizes defensible startup ideas by fusing unrelated pillars, solving a catalyst problem, and applying ambient constraints.
* **When to use**: When brainstorming high-novelty, defensible product directions or hackathon projects.
* **Use Case Example**: Brainstorming an analog-first local garden monitoring utility.
  * **Input**: *"offline garden tracker"*
  * **Output**: An unconventional specification utilizing analog paper QR codes, local device Bluetooth mesh networking, ephemeral status tracking, and defensive growth monitoring loops.

---

### 8. Final Vibe Prompt (`final_vibe`)
* **What it is**: Fuses all preceding pipeline milestone specs into a highly focused single-step coding prompt directing an agent to implement a precise scope.
* **When to use**: The final stage of the refinery pipeline, ready to copy-paste directly into your secondary coding agent.
* **Use Case Example**: Constructing a single-step scaffold prompt for a Web Audio oscillator dashboard.
  * **Input**: *Previous specs of Web Audio oscillator dashboard*
  * **Output**: An optimized, copy-paste-ready agent prompt directing the implementation of foundational audio nodes, Amber dark aesthetic tokens, volume slides, and WCAG accessibility tags.

---

## 🛠️ Running Locally

### Prerequisites
* [Node.js](https://nodejs.org/) (Version 18+ recommended)
* A Gemini API key (for AI features)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/drinkwaterdrink/Prompt-Refinery.git
   cd Prompt-Refinery
   ```
2. Install all dependencies:
   ```bash
   npm install
   ```
3. Set your Gemini API key in a `.env` file:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
4. Spin up the development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:3000`.

---

## 🧪 Verification and Build Checks

Prompt Refinery is equipped with rigorous validation utilities. To confirm code correctness:

* **TypeScript Strict Compiler check**:
  ```bash
  npm run lint
  # or npx tsc --noEmit
  ```
* **Production Build bundler**:
  ```bash
  npm run build
  ```
  *(Compiles client static assets via Vite, packages Express server via esbuild into `dist/server.cjs` and exports production-ready asset maps).*
