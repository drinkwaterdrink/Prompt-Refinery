<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Prompt Refinery

**Version:** 0.02  
Run and compile raw ideas into precision-crafted prompt blueprint stacks for coding agents.  
Deploy link: https://ai.studio/apps/578e8b3d-4299-43a9-bb6d-ff0b0471f3cd

## Features
- **Prompt Recipe Engine**: Supports multiple specialized generation targets (Blueprint, Idea Refinement, Technical Spec, Implementation Plan, Code Review, Design Audit, Black-Swan Ideation).
- **Stunning UI Selector**: Premium selector dropdown inside input configuration pane.
- **Scrollable Markdown Viewports**: Displays plain-text recipe outcomes cleanly in a high-fidelity rendering panel.

## Architecture (Phase 9 Modularization)
- **`src/lib/promptRecipes/`**: Modular prompt recipe registry containing all specialized instructions, builders, and mock generators.
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