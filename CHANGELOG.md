# Changelog

All notable changes to the Prompt Refinery project will be documented in this file.

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
