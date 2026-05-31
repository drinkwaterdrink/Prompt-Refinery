/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PromptRecipe } from './types';

export const designPrinciplesRecipe: PromptRecipe = {
  id: 'design_audit',
  label: 'Design Audit',
  shortDescription: 'Audit your UI/UX plans against systematic design tokens, WCAG AA, and component states.',
  outputKind: 'markdown',
  systemInstruction: `You are a Lead Design System Architect and UX Specialist. Evaluate the user's prompt or feature idea against modern, premium, state-of-the-art Design Principles:
- Simplicity through reduction: strip unnecessary noise and cognitive load.
- Design tokens: adhere to systematic spacing, typography, and cohesive color scales (harmonious HSL/RGB, sleek dark themes).
- WCAG AA compliance: ensure adequate color contrast ratio, text accessibility, and clear keyboard focus states.
- Mobile-first layout: design for small viewports first and scale gracefully.
- Motion restraint: prioritize performance and prefers-reduced-motion; restrict animations to subtle micro-animations (e.g. hover, loading).
- Performance: prioritize fast loading times, optimized media, and lazy render.
- Clear component states: describe hover, focus, active, loading, disabled, empty, and error states.

Reason privately. Do not output any thinking or brainstorming tags.
Evaluate the input and output a detailed Design Audit report with recommendations.

Your output must be structured with the following exact headers:
- # Design Audit: [Project Title]
- ## Evaluation Against Core Principles
  - Simplicity & Reduction
  - Spacing & Token Systems
  - Accessibility & WCAG AA
  - Layout & Responsive Strategy
  - Performance & Asset Optimization
  - Interactive Component States
- ## Recommendations & Implementation Checklist`,
  userPayloadBuilder: (rawPrompt, projectContext, conversationHistory) => {
    let payload = `Evaluate the following prompt or product request for design and accessibility quality:\n\n### PROJECT REQUEST:\n"${rawPrompt}"\n\n`;
    if (projectContext && projectContext.trim()) {
      payload += `### EXTRA UI CONSTRAINTS:\n"${projectContext}"\n\n`;
    }
    if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      payload += `### CONVERSATION HISTORY:\n`;
      conversationHistory.forEach((message: any) => {
        const role = message.role === "assistant" ? "Assistant" : "User";
        payload += `[${role}]: ${message.content}\n`;
      });
      payload += `\n`;
    }
    payload += `Provide only the Markdown Design Audit report with no wrapper tags or conversational comments.`;
    return payload;
  },
  mockGenerator: (rawPrompt) => {
    const cleanPrompt = rawPrompt.replace(/['"]/g, '');
    const title = cleanPrompt.split(' ').slice(0, 3).join(' ') || "My Application";
    return {
      ok: true,
      recipeId: "design_audit",
      outputKind: "markdown",
      title: `Design Audit: ${title}`,
      content: `# Design Audit: ${title}

## Evaluation Against Core Principles

### Simplicity & Reduction
- **Observation**: The proposed interface structures are highly functional, but could easily become cluttered with redundant telemetry stats or data boxes.
- **Rating**: Pass with review.

### Spacing & Token Systems
- **Observation**: Recommended spacing relies on systematic grid tokens rather than ad-hoc margins. Enforces a consistent 8px-based layout system.
- **Rating**: Strong Pass.

### Accessibility & WCAG AA
- **Observation**: Design features contrast-rich dark themes. Ensure background/foreground elements meet the minimum 4.5:1 ratio, and provide distinct keyboard outlines.
- **Rating**: Review required.

### Layout & Responsive Strategy
- **Observation**: Single-column flex boxes are prescribed for small screens, moving gracefully to grid structures on wide monitors.
- **Rating**: Strong Pass.

### Performance & Asset Optimization
- **Observation**: Promotes client-side caching and dynamic lazy-rendering on long list components.
- **Rating**: Pass.

### Interactive Component States
- **Observation**: Outlines basic buttons but lacks definitions for disabled, loading, empty, and error states. These must be defined to avoid jarring UX.
- **Rating**: Fail (needs detail).

## Recommendations & Implementation Checklist
- [ ] Define precise loading skeleton designs for content boxes.
- [ ] Draft a clean empty-state vector graphic to display before data is entered.
- [ ] Map high-contrast HSL color variables for interactive focus states.`,
      structuredData: {}
    };
  }
};
