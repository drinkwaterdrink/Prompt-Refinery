# Changelog

All notable changes to the Prompt Refinery project will be documented in this file.

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
