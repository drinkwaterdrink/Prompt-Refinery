/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Supported generation provider IDs.
 */
export type ProviderId = 'mock' | 'gemini' | 'custom_openai';

/**
 * Configuration specific to the Custom OpenAI-compatible provider.
 * The apiKey field is session-only and must never be logged, saved to history,
 * or included in any export.
 */
export interface CustomOpenAIConfig {
  /** Base URL for the provider, e.g. https://api.openrouter.ai */
  baseUrl: string;
  /** Endpoint path, default: /v1/chat/completions */
  endpointPath: string;
  /** Session-only API key — never persisted, never logged */
  apiKey: string;
  /** Model identifier, e.g. openai/gpt-4o or mistralai/mistral-7b */
  model: string;
  /** Optional custom headers as a JSON string, e.g. {"X-Title": "MyApp"} */
  customHeadersJson?: string;
  /** If true, include response_format: { type: "json_object" } in the request */
  jsonMode: boolean;
}

/**
 * Unified settings object sent from client to server on each API request.
 * Sensitive fields (apiKey inside customOpenAI) must be stripped from any
 * history saves, exports, or debug outputs.
 */
export interface ProviderSettings {
  provider?: ProviderId;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  strictMode?: boolean;
  debugMode?: boolean;
  browserApiKey?: string;
  customOpenAI?: CustomOpenAIConfig;
}
