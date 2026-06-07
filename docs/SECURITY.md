# Security & Credentials Policy

This document outlines the security architecture, credential boundaries, and privacy safeguards engineered into Prompt Refinery.

---

## 1. Secrets & Environment Protection

> [!WARNING]
> **Never commit your `.env` file to version control (GitHub, GitLab, etc.).**
> The `.env` file contains sensitive API secrets that give access to paid Gemini services. The project's `.gitignore` file is pre-configured to ignore `.env`, but you must remain vigilant.

### Best Practices:
* Keep `.env` strictly local on your development PC.
* In production clouds, use the provider's native **Environment Secrets Manager** (e.g. Render Secrets, Railway Variables, or Fly Secrets) to inject the variables into memory dynamically.

---

## 2. API Key Management Architecture

Prompt Refinery supports three mechanisms for credential management, each with specific security profiles:

### A. Server-Side Keys (Recommended)
Configured via `GEMINI_API_KEY` in the `.env` file on the server.
* **Security Profile**: **High**.
* **Why**: The API key stays securely in the server process memory. It is never exposed, sent, or stored in the browser client shell.

### B. Client-Side Browser BYOK (Bring Your Own Key)
Configured by the user inside the settings panel for native Gemini calls.
* **Security Profile**: **Convenience-Only**.
* **Warning**: While convenient for personal/multi-device setups, client-side browser keys are vulnerable if your device is compromised or infected with malicious browser extensions.
* **Storage**: BYOK keys are held transiently in `sessionStorage`. They are wiped instantly when the browser tab is closed.

### C. Connection Profiles (LocalStorage)
Configured inside the settings panel for Custom OpenAI/compatible endpoints.
* **Security Profile**: **Medium-Convenience**.
* **Behavior**: Saved connection profile credentials (endpoints, custom headers, and API keys) are persisted in `localStorage` so you do not have to retype them.
* **Constraint**: This is stored in plain text inside your browser's private directory. Ensure you run Prompt Refinery on trusted devices.

---

## 3. Strict Boundary & Sanitization Rules

To prevent credential leaks, the codebase enforces absolute boundaries separating secrets from workspace exports and history logs:

### Redaction on the Server
All API completion exceptions are intercepted on the backend before being sent to the client. The server parses stack traces and recursively replaces any detected instances of active API keys with a redacted placeholder:
```text
[REDACTED]
```

### Omission in Exporters
When you export blueprints, timeline pipelines, or Vibe packets to JSON/Markdown, **all API keys, credentials, and authentication headers are strictly omitted** from the payloads. 

---

## 4. Debug Mode Warnings

> [!CAUTION]
> **Keep Debug Mode turned OFF in production environments.**
> Enabling Debug Mode inside the Settings panel outputs verbose technical metrics, internal server stack traces, raw JSON payloads, and network error statuses to the user interface. While invaluable for local developer diagnostics, exposing these traces publicly is a significant security risk.
