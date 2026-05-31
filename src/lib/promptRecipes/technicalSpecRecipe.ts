/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PromptRecipe } from './types';

export const technicalSpecRecipe: PromptRecipe = {
  id: 'technical_spec',
  label: 'Technical Spec',
  shortDescription: 'Turns a request, rules, and reference context into a detailed technical specification.',
  outputKind: 'markdown',
  systemInstruction: `You are a Principal Software Architect. Your job is to analyze the user's request, constraints, and reference context, and turn them into a detailed, comprehensive Technical Specification in clean Markdown.
Reason privately and step-by-step. Do not output <thinking>, <analysis>, or any other chain-of-thought tags. Only output the final Markdown specification.
Your output must be structured with the following exact headers:
- # Technical Specification: [Project Name]
- ## Planning & Discovery
- ## System Architecture & Technology
- ## Database & Server Logic
- ## Feature Specifications
- ## Design System
- ## Security & Compliance
- ## Optional Integrations
- ## Environment Configuration & Deployment
- ## Testing & QA
- ## Edge Cases & Implementation Considerations
- ## Summary & Next Steps`,
  userPayloadBuilder: (rawPrompt, projectContext, conversationHistory) => {
    let payload = `Analyze the following prompt and construct a comprehensive Technical Specification:\n\n### PROJECT REQUEST:\n"${rawPrompt}"\n\n`;
    if (projectContext && projectContext.trim()) {
      payload += `### RULES & CONSTRAINTS:\n"${projectContext}"\n\n`;
    }
    if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      payload += `### CONVERSATION HISTORY:\n`;
      conversationHistory.forEach((message: any) => {
        const role = message.role === "assistant" ? "Assistant" : "User";
        payload += `[${role}]: ${message.content}\n`;
      });
      payload += `\n`;
    }
    payload += `Output only the final Markdown technical specification starting with '# Technical Specification: [Project Name]'. Do not add any conversational remarks or wrapper tags.`;
    return payload;
  },
  mockGenerator: (rawPrompt) => {
    const cleanPrompt = rawPrompt.replace(/['"]/g, '');
    const title = cleanPrompt.split(' ').slice(0, 3).join(' ') || "My Application";
    return {
      ok: true,
      recipeId: "technical_spec",
      outputKind: "markdown",
      title: `Technical Spec: ${title}`,
      content: `# Technical Specification: ${title}

## Planning & Discovery
This project is initiated to build a robust system targeting "${cleanPrompt}". Development cycles are scheduled as quick, iterative loops to maximize stability and visual craft.

## System Architecture & Technology
- **Frontend**: Component-driven architecture using modern standards (React/Vue/Vite).
- **Backend**: Express-like application serving JSON/REST API payloads.
- **Styling**: Tailored CSS properties to handle custom theming and light/dark toggles.

## Database & Server Logic
- Relational schema designs mapping central models.
- State handlers and controllers implementing strict payload sanitization.
- Caching system via SessionStorage or LocalStorage on client boundaries.

## Feature Specifications
- Functional core loops implementing workout and action refinements.
- Sidebar workflows holding recent history items.
- Dynamic responsive layouts with custom layout cards.

## Design System
- High-fidelity typography systems (Outfit/Inter).
- CSS tokens for unified colors, borders, and margins.
- Interactive component states: hover, focus, disabled, active.

## Security & Compliance
- Full sanitization layer stripping API keys and credentials.
- Error mitigation routing stack traces only under Debug controls.
- Local sandboxed environment storage protecting user privacy.

## Optional Integrations
- Analytical metrics tracking execution volumes.
- API endpoints connecting third-party models if specified.

## Environment Configuration & Deployment
- Node engine environment configuration.
- Single unified start script for server and asset bundles.

## Testing & QA
- Verification tests targeting schema boundaries.
- TypeScript strict compiles and developer linters.

## Edge Cases & Implementation Considerations
- Handling browser connectivity dropouts safely.
- Wiping state cleanly when local cache fails validation.

## Summary & Next Steps
1. Initialize the codebase workspace.
2. Build core state models.
3. Wire UI panels to local triggers.`,
      structuredData: {}
    };
  }
};
