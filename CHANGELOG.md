# Changelog

All notable changes to the Prompt Refinery project will be documented in this file.

## [0.08] - 2026-05-31

### Added Project Context Packs (Phase 15)
- Designed and built a full **Project Context Packs** system allowing users to save durable, reusable app profiles and inject them across every Prompt Refinery workflow.
- Created the `ProjectContextPack` data schema in `src/types.ts` with fields for name, description, repo URL, tech stack, current status, design preferences, known issues, future roadmap ideas, important source files, and custom high-priority instructions.
- Extended `WorkflowHistoryItem` interface with `activeProjectPackId`, `activeProjectPackName`, and `activeProjectPackSnapshot` snapshot fields to preserve pack context in run history.
- Built `src/lib/projectPacks.ts` containing `serializePackToMarkdown` formatter, `validateProjectPack` shape checker, `sanitizeProjectPack` secret redactor, and a pre-baked "CloudMetrics Monitor" showcase demo pack for immediate testing.
- Created `src/hooks/useProjectPacks.ts` custom hook with full CRUD operations (Create, Update, Delete, Duplicate), JSON export, JSON import with schema validation, and LocalStorage-backed persistence with corruption-safe error recovery and automatic fallback to the default demo pack.
- Built `src/components/ProjectPackModal.tsx`, a premium gold-accented editor dialog with dedicated input controls for all pack schema fields, inline validation, and save/update logic.
- Built `src/components/ProjectPackSelector.tsx`, a compact workspace widget with a dropdown pack selector, quick-action icon bar (Create, Edit, Duplicate, Delete, Export, Import, Apply), and an amber caution badge when the serialized pack context exceeds 10,000 characters.
- Embedded `ProjectPackSelector` above the Project Context textarea in **New Prompt Mode** (`InputPanel.tsx`) and above the Notes field in **Iterative Project Mode** (`ProjectInputPanel.tsx`).
- Wired the `useProjectPacks` hook, `ProjectPackModal`, and all handlers (apply, CRUD, import/export) into `src/App.tsx` including Append vs. Overwrite confirmation dialogs.
- Extended `handleExportVibePacket` in `src/App.tsx` to include `activeProjectPackName`, `activeProjectPackId`, and `activeProjectPackContextUsed` fields inside exported Vibe Coding Packets.
- Updated all four Express API routes (`/api/refine`, `/api/refine-loop`, `/api/project-ideas`, `/api/design-audit`, `/api/sparks`) in `server.ts` to parse `projectPack` from request payloads and inject compiled, critical-priority guidance blocks into Gemini model system instructions.
- Added `compileProjectPackGuidance` helper function in `server.ts` that compiles pack fields (name, tech stack, current status, design preferences, known issues, roadmap, important files, and custom rules) into a structured system instruction block with CRITICAL and NOTE emphasis markers.
- Updated `generateBlueprintForPrompt` in `src/mockData.ts` to accept `projectPack` as a fourth parameter and customize the returned mock blueprint title, architecture frontend field, developer notes, and final prompt with pack-specific tech stack, important files, known issues warnings, and custom rule headers.
- Added optional `direction` field to the `ProjectImprovementResult` interface in `src/types.ts` to resolve a TypeScript narrowing issue in `loadProjectResult`.
- Incremented footer version and `package.json` to version `v0.08`.

## [0.07] - 2026-05-31

### Added Prompt Quality Profiles (Phase 14)
- Designed and built a system of **8 Prompt Quality Profiles** (Balanced, Senior Engineer, UI/UX Designer, Product Strategist, Bugfix/Debug, Refactor/Optimization, PWA/Mobile, Black-Swan Creative) that influence and customize the generated outputs of all recipes and modes without altering baseline JSON schemas.
- Programmed a global, beautifully styled drop-down selection widget in `src/App.tsx` directly next to the Workflow Mode selector tabs, featuring a sleek hover-tooltip showing the active profile's goals and descriptions.
- Integrated profile selections into the `saveToWorkflowHistory` callback, preserving the active quality profile in LocalStorage history and correctly restoring it upon selection in the sidebar panel.
- Enhanced JSON/Markdown templates, Vibe coding packets, and timeline pipeline stages exporters and importers to support and synchronize the active refinement profile seamlessly.
- Configured backend endpoints (`POST /api/refine`, `/api/refine-loop`, `/api/project-ideas`, `/api/design-audit`, and `/api/sparks`) inside `server.ts` to append dynamic system instruction guidance blocks to the AI model's baseline prompts.
- Enforced profile-specific deviations inside mock outcomes generators in `src/mockData.ts` and fallback Express router blocks, enabling custom titles, risks checklists, UI/UX AA guidelines, and creative pivot constraints.
- Incremented footer version description and `package.json` to version `v0.07`.

## [0.06] - 2026-05-31

### Added Design Audit Mode using the Design Principles Appendix (Phase 13)
- Designed and built **Design Audit Mode** allowing users to review and score UI ideas, visual styles, current issues, target devices, and CSS specifications against strict design and accessibility rules.
- Implemented the `POST /api/design-audit` Express backend route in `server.ts` executing comprehensive UI reviews against 17 core design/accessibility guidelines and returning structured audits.
- Programmed an interactive visual design audit workspace featuring gold-accent circular score meters, multi-dimensional ratings progress bars, severities badges, and checklists.
- Added a fourth tab selection button "Design Audit Mode" in the main right panel selector in `src/App.tsx`.
- Instantiated the `useDesignAudit` custom client hook managing inputs, loading states, and history preservation wrappers.
- Automatically preserved complete Design Audit cycles, scores, and states inside the LocalStorage sidebar runs list.
- Incremented footer version description and `package.json` to version `v0.06`.

## [0.05] - 2026-05-31

### Added Iterative Project Mode & Optimization Planner (Phase 12)
- Designed and built **Iterative Project Mode** allowing users to supply codebase context and directions to receive improvements, risks, technical gaps, and dev prompts.
- Implemented the `POST /api/project-ideas` Express backend route in `server.ts` executing comprehensive optimization analysis and returning structured project plans.
- Programmed a **lightweight public GitHub Raw Context Extractor** parsing public GitHub URLs and fetching core files (`README.md`, `package.json`, `server.ts`, `src/App.tsx`, `src/main.tsx`) raw from Raw GitHub content raw repositories asynchronously, appending them safely as reference code snippets.
- Built the **ProjectInputPanel** React component rendering fields for Project Name, GitHub URL, PDP/Notes, Current Goal Direction, and a drag-and-drop browser file uploader supporting `.txt`, `.md`, and `.json` files <200KB.
- Created the **ProjectWorkspace** React component displaying project summaries, app types, collapsible accordions (Assumptions, Strengths, Risks & Gaps, and Files checked), and category-sorted improvement cards.
- Integrated colored impact/effort/risk badges and custom category tag styles (feature, UX, bugfix, refactor, performance, security, mobile, architecture).
- Programmed quick card actions:
  - *Copy Phase Prompt*: Copies the phase prompt to clipboard.
  - *Use as Raw Prompt*: Swaps to New Prompt Mode, pre-populating input fields with the phase prompt and project context.
  - *Send to Pipeline*: Swaps to Refinery Pipeline Mode, pre-populating sequential timelines with the phase prompt and context.
- Programmed bulk review plan exporters (JSON/Markdown) and selected prompt copiers.
- Extended the history manager in `useWorkflowHistory.ts` and `src/App.tsx` to save and restore Project Mode runs.
- Aligned the application's footer version description to `v0.05`.

## [0.04] - 2026-05-31

### Added Multi-Stage Refinery Pipeline (Phase 11)
- Designed and implemented a visual timeline workspace to progressively compile rough prompts through four distinct stages:
  - **Stage 1 (Project Request Spec)**: Refines rough ideas into clear markdown product requests using the `idea_refinement` recipe.
  - **Stage 2 (Technical Specification)**: Synthesizes multi-layer system architecture stacks by appending Stage 1 outcomes using the `technical_spec` recipe.
  - **Stage 3 (Implementation Plan)**: Formulates actionable step-by-step modular coding plans using the `implementation_plan` recipe.
  - **Stage 4 (Final Vibe Prompt)**: Fuses all preceding stage specifications into a high-fidelity single-step prompt optimized for secondary coding agents using a new custom `final_vibe` recipe.
- Added a premium, gold-accented **Workflow Mode selector toggle tab** above the right panel workspace allowing seamless swapping between "Quick Blueprint" (default) and "Refinery Pipeline".
- Engineered the custom state hook `usePipelineWorkflow.ts` to manage loading statuses (`empty`, `generating`, `complete`, `error`), sequential error catching, and complete pipeline state saves.
- Implemented **Progressive Context Accumulation** inside the pipeline state manager to automatically compile preceding stage outputs and append them as reference specs to subsequent stage payloads.
- Enforced **Sequential Unlock Gates** to block later timeline stages until all preceding prerequisites have compiled successfully.
- Added quick stage-action controls for copying content to the clipboard, exporting individual stage markdowns, and downloading whole-pipeline bulk data in JSON and compiled Markdown document formats.
- Integrated dual-mode loading restoration inside `useWorkflowHistory.ts` and `src/App.tsx` to restore complete pipeline stage sets, timeline badges, and panel modes cleanly from saved sidebar history.

## [0.03] - 2026-05-31

### Added Creative Spark Catalyst & Black-Swan Ideation
- Designed and built the **Creative Spark Catalyst** to replace the old static prefill buttons in the header with a dynamic app idea generator.
- Programmed a highly curated local generator database and dynamic mix-and-match generator in `src/lib/sparksMockGenerator.ts` to provide practical, unusual, and black-swan concepts offline.
- Created the `POST /api/sparks` server-side route in `server.ts` to compile prompts and return structured JSON idea arrays.
- Enforced strict JSON response schema validation contracts on the Gemini model to guarantee robust structure matching our exact type specifications.
- Fused the Black-Swan ideation framework into sparks generation, fuzing unrelated technical pillars, catalyst problems, unconventional constraints, and timely catalysts.
- Engineered the custom, slide-over **CreativeSparkDrawer** React component featuring novelty level selection tabs, loading state triggers, and interactive cards displaying core pillars.
- Integrated loader triggers inside `src/App.tsx` to prefill prompt inputs, project context, and simulated conversation history without automatically launching the generation pipeline, allowing review.
- Connected a "Refine Idea" option on cards to automatically set prompt recipes to the **Idea Refinement** mode.
- Preserved spark metadata (`sparkTitle`, `sparkNovelty`, `sparkTags`) inside the database workflow history for rich concept tracing.

## [0.02] - 2026-05-31

### Added Prompt Recipe Engine & Frameworks
- Introduced a modular Prompt Recipe Engine registry allowing the pre-compiler to support specialized, target-specific generation flows.
- Programmed and integrated six custom, internal codebase prompt modules under `src/lib/promptRecipes/`:
  - **Idea Refinement**: Generates high-fidelity markdown Project Requests.
  - **Technical Specification**: Converts requests into multi-layer software spec architectures.
  - **Implementation Plan**: Structures specifications into sequential, atomic coding steps (<20 files per step) for agentic coders.
  - **Code Review**: Audits repositories or code notes to construct optimized checklists.
  - **Design Audit**: Evaluates UI plans against cohesive HSL spacing tokens, WCAG AA contrast compliance, motion restraints, and component state outlines.
  - **Black-Swan Ideation**: Conceptualizes defensible startup ideas and gamified core loops.
- Programmed specialized server-side payload compilers and mock outcome data generators for every custom recipe, ensuring complete sandboxed testing capabilities.

### Refactored UI & Routing
- Added a premium, gold-bordered **Prompt Recipe Selector** inside `InputPanel` featuring description tip boxes for every workflow.
- Programmed custom, responsive, and scrollable **Markdown/Text rendering components** inside `BlueprintExplorer` to display plain-text recipe outcomes elegantly.
- Upgraded the Express `/api/refine` endpoint to dynamic routing, dynamically configuring system instructions, payload constructs, and `responseMimeType` settings per recipe.
- Ensured model reasoning remains strictly private; system prompts instruct models to omit any chain-of-thought (`<thinking>`, `<analysis>`) tags.
- Fully wired history log preservation so past runs restore the correct UI viewport, input fields, and output selectors matching the run's recipe.

## [0.01] - 2026-05-31

### Refactored & Stabilized
- Decomposed the giant 147KB `App.tsx` into modular React components under `src/components/`:
  - `InputPanel`
  - `BlueprintExplorer`
  - `SettingsModal`
  - `WorkflowHistorySidebar`
  - `Toast`
  - `EmptyBlueprintState`
  - `LoadingState`
- Decomposed application logic into highly focused hooks under `src/hooks/`:
  - `useToast`
  - `useWorkflowHistory`
  - `useBlueprintGeneration`
- Extracted reusable helpers under `src/lib/`:
  - `sanitize.ts` (recursive secret redaction)
  - `clipboard.ts` (safe clipboard copying with execCommand fallback)
  - `json.ts` (JSON shape detection of full blueprint vs vibe coding packets)
  - `exporters.ts` (secure JSON and Markdown file download handling)

### Security Enhancements
- Introduced recursive secret redaction for sensitive API credentials (`GEMINI_API_KEY`, `OPENAI_API_KEY`, etc.) replacing them with `[REDACTED]` prior to saving history or exporting templates.
- Secured the Express backend in `server.ts` to block internal file paths and stack traces for normal users. Custom stack traces are only returned to client-side diagnostics if `debugMode` is explicitly enabled, and even then, they are fully sanitized first.

### Usability Upgrades
- Added seamless dual-shape support for importing both **Full Blueprint JSON** and **Vibe Coding Packet JSON**. Vibe packets are automatically loaded as input context without wiping or crashing the active workspace.
- Gated internal dev/testing helper controls ("Test Schema Error Handler") so they are only visible when `Debug Mode` is active.
