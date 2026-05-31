/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PromptRecipe } from './types';

export const ideaRefinementRecipe: PromptRecipe = {
  id: 'idea_refinement',
  label: 'Idea Refinement',
  shortDescription: 'Turns a rough idea into a cleaner Markdown Project Request.',
  outputKind: 'markdown',
  systemInstruction: `You are an expert product manager and prompt engineer. Your job is to transform the user's rough idea into a highly structured, clean Markdown Project Request.
Focus on simplicity, clear scope boundaries, and complete functional details.
Reason privately and step-by-step. Do not output any thinking or brain-storming tags (like <thinking>, <analysis>, or hidden CoT tags).
Your output must be a clean markdown document with the following exact headers:
- # Project Name
- ## Description
- ## Target Audience
- ## Desired Features
- ## Design Requests
- ## Other Notes
- ## Open Questions`,
  userPayloadBuilder: (rawPrompt, projectContext, conversationHistory) => {
    let payload = `Optimize the following rough project idea:\n\n### ROUGH IDEA:\n"${rawPrompt}"\n\n`;
    if (projectContext && projectContext.trim()) {
      payload += `### EXTRA CONTEXT & CONSTRAINTS:\n"${projectContext}"\n\n`;
    }
    if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      payload += `### CONVERSATION HISTORY:\n`;
      conversationHistory.forEach((message: any) => {
        const role = message.role === "assistant" ? "Assistant" : "User";
        payload += `[${role}]: ${message.content}\n`;
      });
      payload += `\n`;
    }
    payload += `Output only the structured markdown document. Do not include any tags, other conversational prefixes, or comments.`;
    return payload;
  },
  mockGenerator: (rawPrompt) => {
    const cleanPrompt = rawPrompt.replace(/['"]/g, '');
    const title = cleanPrompt.split(' ').slice(0, 3).join(' ') || "My Application";
    return {
      ok: true,
      recipeId: "idea_refinement",
      outputKind: "markdown",
      title: `Project Request: ${title}`,
      content: `# ${title}

## Description
A comprehensive system built around the concept of "${cleanPrompt}". This is a modernized tool tailored for high responsiveness, high reliability, and clean separation of concerns.

## Target Audience
- General users seeking an intuitive interface for "${cleanPrompt}".
- Developers wanting an extensible codebase to build upon.

## Desired Features
- Real-time interaction loop.
- Offline-first cache storage.
- Interactive controls and beautiful state indicators.

## Design Requests
- Curated dark aesthetic featuring premium warm accent palettes (gold/bronze/amber).
- Clean layouts using grid configurations.
- Micro-animations on interactive triggers.

## Other Notes
- Standard logging and client error catching.
- High accessibility standards conforming to WCAG AA.

## Open Questions
- What database persistence mechanism is preferred for scale?
- Are there external service integrations needed for authentication?`,
      structuredData: {}
    };
  }
};
