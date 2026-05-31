/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProjectContextPack } from '../types';
import { recursiveSanitize } from './sanitize';

/**
 * Formats a project pack into a structured Markdown string.
 */
export function serializePackToMarkdown(pack: ProjectContextPack): string {
  let text = `==================================================\n`;
  text += `PROJECT CONTEXT PACK: ${pack.name || 'Unnamed'}\n`;
  text += `==================================================\n`;
  if (pack.description) text += `Description: ${pack.description}\n`;
  if (pack.repoUrl) text += `Repository: ${pack.repoUrl}\n`;
  if (pack.techStack) text += `Tech Stack: ${pack.techStack}\n`;
  if (pack.currentStatus) text += `Current Status: ${pack.currentStatus}\n`;
  if (pack.designPreferences) text += `Design Preferences: ${pack.designPreferences}\n`;
  if (pack.knownIssues) text += `Known Issues: ${pack.knownIssues}\n`;
  if (pack.futureIdeas) text += `Future Roadmap: ${pack.futureIdeas}\n`;
  if (pack.importantFiles && pack.importantFiles.length > 0) {
    text += `Key Source Files: ${pack.importantFiles.join(', ')}\n`;
  }
  if (pack.customInstructions) {
    text += `Custom Rules: ${pack.customInstructions}\n`;
  }
  text += `==================================================\n`;
  return text;
}

/**
 * Validates a parsed JSON object against the ProjectContextPack interface.
 * Returns null if valid, or an array of error messages if invalid.
 */
export function validateProjectPack(data: any): string[] | null {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') {
    return ['Project Context Pack is not a valid JSON object.'];
  }

  // Required core string fields
  if (typeof data.id !== 'string' || !data.id.trim()) {
    errors.push("Missing or invalid 'id'.");
  }
  if (typeof data.name !== 'string' || !data.name.trim()) {
    errors.push("Missing or invalid 'name'.");
  }

  // Validate importantFiles is string array
  if ('importantFiles' in data && !Array.isArray(data.importantFiles)) {
    errors.push("'importantFiles' must be an array of strings.");
  } else if ('importantFiles' in data && Array.isArray(data.importantFiles)) {
    data.importantFiles.forEach((file: any, idx: number) => {
      if (typeof file !== 'string') {
        errors.push(`File at index ${idx} in 'importantFiles' must be a string.`);
      }
    });
  }

  return errors.length > 0 ? errors : null;
}

/**
 * Recursively redacts secrets and sensitive keys from a ProjectContextPack.
 */
export function sanitizeProjectPack(pack: ProjectContextPack): ProjectContextPack {
  return recursiveSanitize(pack);
}

/**
 * A curated pre-baked showcase project context pack.
 */
export const DEFAULT_PROJECT_PACKS: ProjectContextPack[] = [
  {
    id: 'pack_cloudmetrics_demo',
    name: 'CloudMetrics Monitor',
    description: 'A cloud infrastructure server resource tracking dashboard with real-time status widgets.',
    repoUrl: 'https://github.com/drinkwaterdrink/cloudmetrics-dashboard',
    techStack: 'React 19 + TypeScript + TailwindCSS v4 + Vite + Lucide Icons + Recharts',
    currentStatus: 'Static mockup completed. Working on actual client-side simulated telemetry polling.',
    designPreferences: 'High-end charcoal and glassmorphism visual layout with harmonious amber borders, smooth HSL dark tokens, outline focus rings (focus-visible), and subtle 150ms transitions.',
    knownIssues: 'Frequent re-renders inside charts and telemetry grids. LocalStorage storage limits under heavy datasets.',
    futureIdeas: 'Offline PWA support, local alerts sound triggers, and visual server card layout groupings.',
    importantFiles: [
      'src/App.tsx',
      'src/components/Dashboard.tsx',
      'src/hooks/useTelemetry.ts',
      'src/lib/telemetryStore.ts'
    ],
    customInstructions: 'Always structure component file updates to be modular. Do NOT rewrite entire files. Emphasize accessible outlines (focus-visible:ring-2) and keyboard navigations in forms.',
    createdAt: new Date('2026-05-30T10:00:00Z').toLocaleString(),
    updatedAt: new Date('2026-05-31T15:00:00Z').toLocaleString()
  }
];
