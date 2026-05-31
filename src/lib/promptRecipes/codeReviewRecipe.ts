/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PromptRecipe } from './types';

export const codeReviewRecipe: PromptRecipe = {
  id: 'code_review',
  label: 'Code Review',
  shortDescription: 'Turns project context or repo summaries into an Optimization Plan.',
  outputKind: 'markdown',
  systemInstruction: `You are a Senior Principal Code Reviewer and Performance Architect. Analyze the provided project context, existing code notes, or repo summaries and construct a professional, high-impact Optimization Plan.
Reason privately and step-by-step. Do not output any hidden thinking or analysis tags.
Your output must include:
- # Optimization Plan: [Project Name]
- ## Code Organization Observations
- ## Code Quality Observations
- ## UI/UX Observations
- ## Optimization Plan (broken down into atomic steps)
  For each step, provide:
  - Title & Description
  - Rationale & Files to touch
  - Acceptance criteria per step`,
  userPayloadBuilder: (rawPrompt, projectContext, conversationHistory) => {
    let payload = `Analyze this code context or repository summary and draft an Optimization Plan:\n\n### CODE SUMMARY/CONTEXT:\n"${rawPrompt}"\n\n`;
    if (projectContext && projectContext.trim()) {
      payload += `### ADDITIONAL STACK CONSTRAINTS:\n"${projectContext}"\n\n`;
    }
    if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      payload += `### CONVERSATION HISTORY:\n`;
      conversationHistory.forEach((message: any) => {
        const role = message.role === "assistant" ? "Assistant" : "User";
        payload += `[${role}]: ${message.content}\n`;
      });
      payload += `\n`;
    }
    payload += `Output only the Markdown Optimization Plan with the exact headers listed.`;
    return payload;
  },
  mockGenerator: (rawPrompt) => {
    const cleanPrompt = rawPrompt.replace(/['"]/g, '');
    const title = cleanPrompt.split(' ').slice(0, 3).join(' ') || "My Application";
    return {
      ok: true,
      recipeId: "code_review",
      outputKind: "markdown",
      title: `Optimization Plan: ${title}`,
      content: `# Optimization Plan: ${title}

## Code Organization Observations
- Modularize large single-file React components to improve testability and reduce line-length overhead.
- Relocate helper modules and utility functions under a distinct folder \`src/lib\`.

## Code Quality Observations
- Integrate recursive deep-redaction patterns to sanitize user credentials and secrets.
- Guard exception routes to hide verbose local stack traces and directories.

## UI/UX Observations
- Enhance design harmony by enforcing systematic dark palettes (curated HSL golden gradients).
- Maximize performance by applying strict limits to list states and animations.

## Optimization Plan

### Step 1: Core Modularization & Hook Extraction
- **Title**: Component Extraction and Custom Hooks
- **Description**: Separate hooks from view rendering files to simplify component trees.
- **Rationale & Files to touch**:
  - \`src/App.tsx\` (Strip local states)
  - \`src/hooks/useBlueprintGeneration.ts\` (Extract handlers)
- **Acceptance criteria**: Development server hot-reloads and compiles successfully with no broken references.

### Step 2: Key Sanitizer & Secret Redactor
- **Title**: Session Credentials Sanitizer
- **Description**: Add recursive tree walks to replace API secrets with a redacted string.
- **Rationale & Files to touch**:
  - \`src/lib/sanitize.ts\` (Create utility)
  - \`server.ts\` (Apply sanitizer to POST routes)
- **Acceptance criteria**: JSON outputs never expose key prefixes.`,
      structuredData: {}
    };
  }
};
