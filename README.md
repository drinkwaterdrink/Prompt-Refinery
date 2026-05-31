<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Prompt Refinery

**Version:** 0.01  
Run and compile raw ideas into precision-crafted prompt blueprint stacks for coding agents.  
Deploy link: https://ai.studio/apps/578e8b3d-4299-43a9-bb6d-ff0b0471f3cd

## Architecture (Phase 8 Modularization)
- **`src/components/`**: Isolated presentation views for Inputs, Modals, explorer dashboards, and drawer states.
- **`src/hooks/`**: Standard React hooks encapsulating generation, persistence, and feedback alerts.
- **`src/lib/`**: Secure helper frameworks for secret redaction, safe clipboard copy, and dual-shape import parsing.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in `.env` to your Gemini API key
3. Run the app:
   `npm run dev`