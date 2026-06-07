# Backend API Reference

This document provides a comprehensive specifications guide for Prompt Refinery's Node-Express server endpoints.

---

## 1. `/api/health` (GET)
Performs basic server diagnostic health checks and identifies the server state.

* **Request**: None.
* **Response (JSON)**:
  ```json
  {
    "status": "ok",
    "mode": "gemini"
  }
  ```
  *(Mode can be `"gemini"` or `"mock-only"` depending on the presence of `GEMINI_API_KEY` env variable).*

---

## 2. `/api/test-connection` (POST)
Validates custom LLM compatible endpoints without persisting keys.

* **Request Payload (JSON)**:
  ```json
  {
    "config": {
      "apiUrl": "https://api.openrouter.ai/api/v1",
      "apiKey": "sk-...",
      "model": "deepseek/deepseek-v4-flash",
      "customHeadersJson": "{}",
      "jsonMode": true
    }
  }
  ```
* **Response (JSON - Success)**:
  ```json
  {
    "ok": true,
    "latencyMs": 845,
    "text": "OK"
  }
  ```

---

## 3. `/api/refine` (POST)
Compiles a raw user prompt and context through a specific recipe using the selected execution provider.

* **Request Payload (JSON)**:
  ```json
  {
    "rawPrompt": "build me a dashboard",
    "projectContext": "Using React + Tailwind v4",
    "conversationHistory": [],
    "mode": "custom_openai",
    "recipeId": "blueprint",
    "refinementProfile": "balanced",
    "settings": {
      "model": "gpt-4o",
      "temperature": 0.2,
      "maxOutputTokens": 8192,
      "customOpenAI": {
        "apiUrl": "https://api.openrouter.ai/api/v1",
        "apiKey": "sk-...",
        "model": "openai/gpt-4o",
        "jsonMode": true
      }
    }
  }
  ```
* **Response (JSON)**:
  Returns either a compiled markdown payload or a structured JSON Prompt Blueprint matching the `BLUEPRINT_OUTPUT_CONTRACT` schema.

---

## 4. `/api/refine-loop` (POST)
Performs refinement loop corrections over an existing Blueprint when a user requests changes.

* **Request Payload (JSON)**:
  Identical to `/api/refine`, but includes `currentBlueprint` in the request body to let the LLM evaluate changes incrementally.

---

## 5. `/api/sparks` (POST)
Generates creative, categorized spark catalog options tailored to stacks or topics.

* **Request Payload (JSON)**:
  ```json
  {
    "count": 4,
    "novelty": "unusual",
    "mode": "gemini",
    "settings": { ... }
  }
  ```
* **Response (JSON)**:
  ```json
  {
    "ok": true,
    "ideas": [
      {
        "id": "spark-1",
        "title": "Gamified Water Tracker",
        "concept": "A micro-app with local storage catalog...",
        "rawPrompt": "build a hydration tracker with PR levels",
        "projectContext": "Single-file HTML with beautiful tailwind",
        "difficulty": "medium",
        "novelty": "unusual",
        "tags": ["HTML", "Storage"]
      }
    ]
  }
  ```

---

## 6. `/api/project-ideas` (POST)
Audits codebase files and pasted notes, delivering optimized checklists and phase prompts.

* **Request Payload (JSON)**:
  ```json
  {
    "projectName": "Gym Logger",
    "projectContext": "Pasted README contents",
    "direction": "Suggest monetizable additions",
    "mode": "custom_openai",
    "settings": { ... }
  }
  ```
* **Response (JSON)**:
  Returns an audited checklist of improvement recommendations, identified gaps/risks, and copy-paste execution prompts.

---

## 7. `/api/design-audit` (POST)
Audits layout descriptions and CSS parameters against token grids, accessibility guidelines, and component states.

* **Request Payload (JSON)**:
  ```json
  {
    "projectName": "Dashboard",
    "uiDescription": "Flat gray cards, small font, lack of focus outlines",
    "stylePreference": "Glassmorphism",
    "mode": "gemini",
    "settings": { ... }
  }
  ```
* **Response (JSON)**:
  Returns rating scores across 7 design vectors (Contrast, Mobile, etc.), quick-win checkboxes, strength logs, and design directive prompts.

---

## Security Notes
1. **Secrets Redaction**: All endpoints are wrapped in robust exception catch blocks. If an endpoint errors, the server filters the error message and recursively replaces any detected instances of active API keys with `[REDACTED]` prior to serving responses.
2. **Transient State**: Sensitive BYOK credentials or Custom OpenAI parameters passed inside `settings` are processed in memory and never logged, cached, or persisted on the server.
