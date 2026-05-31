# Changelog

All notable changes to the Prompt Refinery project will be documented in this file.

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
