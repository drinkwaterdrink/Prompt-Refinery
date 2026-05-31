/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Regex patterns to detect secrets in strings
const SECRET_PATTERNS = [
  /GEMINI_API_KEY=["']?[a-zA-Z0-9_\-]+["']?/gi,
  /OPENAI_API_KEY=["']?[a-zA-Z0-9_\-]+["']?/gi,
  /ANTHROPIC_API_KEY=["']?[a-zA-Z0-9_\-]+["']?/gi,
  /API_KEY=["']?[a-zA-Z0-9_\-]+["']?/gi,
  /SECRET_KEY=["']?[a-zA-Z0-9_\-]+["']?/gi,
  /Authorization:\s*Bearer\s+[a-zA-Z0-9_\-\.]+/gi,
  /Bearer\s+[a-zA-Z0-9_\-\.]+/gi,
  /password=["']?[a-zA-Z0-9_\-]+["']?/gi,
  /token=["']?[a-zA-Z0-9_\-]+["']?/gi,
  /sk-[a-zA-Z0-9]{20,}/g, // common API key structures
  /AIzaSy[a-zA-Z0-9_\-]{33}/g
];

/**
 * Redacts secrets from a given string.
 */
export function redactString(str: string): string {
  let sanitized = str;

  // Replace standalone generic keys
  sanitized = sanitized.replace(/(sk-[a-zA-Z0-9]{15,})/gi, "[REDACTED]");
  sanitized = sanitized.replace(/(AIzaSy[a-zA-Z0-9_\-]{15,})/gi, "[REDACTED]");

  // Run complex key-value matches
  for (const pattern of SECRET_PATTERNS) {
    sanitized = sanitized.replace(pattern, (match) => {
      if (match.toLowerCase().includes("bearer")) {
        if (match.toLowerCase().includes("authorization")) {
          return "Authorization: Bearer [REDACTED]";
        }
        return "Bearer [REDACTED]";
      }
      const eqIdx = match.indexOf("=");
      if (eqIdx !== -1) {
        return match.substring(0, eqIdx + 1) + "[REDACTED]";
      }
      const colonIdx = match.indexOf(":");
      if (colonIdx !== -1) {
        return match.substring(0, colonIdx + 1) + "[REDACTED]";
      }
      return "[REDACTED]";
    });
  }

  return sanitized;
}

/**
 * Recursively walks arrays and objects to redact secret values.
 */
export function recursiveSanitize<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === "string") {
    return redactString(data) as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => recursiveSanitize(item)) as unknown as T;
  }

  if (typeof data === "object") {
    const copy: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const lowerKey = key.toLowerCase();
        // Specifically redact keys that are explicitly secret or key fields
        if (
          lowerKey.includes("key") ||
          lowerKey.includes("password") ||
          lowerKey.includes("token") ||
          lowerKey.includes("secret") ||
          lowerKey.includes("auth")
        ) {
          if (typeof data[key] === "string" && data[key]) {
            copy[key] = "[REDACTED]";
            continue;
          }
        }
        copy[key] = recursiveSanitize(data[key]);
      }
    }
    return copy as T;
  }

  return data;
}
