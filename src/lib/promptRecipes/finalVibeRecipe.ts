/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PromptRecipe } from './types';

export const finalVibeRecipe: PromptRecipe = {
  id: 'final_vibe',
  label: 'Final Vibe Prompt',
  shortDescription: 'Fuses previous specifications into a single-step vibe coding prompt.',
  outputKind: 'markdown',
  systemInstruction: `You are a Lead Prompt Engineer and Vibe Coding Specialist. Your task is to compile all previous project artifacts (rough notes, project request, technical spec, implementation plan) into a highly directed, copy-paste-ready single-step prompt for a secondary coding agent (like Antigravity or Cursor).
Enforce that the agent must implement ONLY ONE STEP at a time. Include target scope, files likely touched, critical spacing tokens, design guidelines, security constraints, and explicit acceptance criteria for that step.
Reason privately and step-by-step. Do not output any thinking or brain-storming tags (like <thinking>, <analysis>, or hidden CoT tags).
Your output must be a clean, copy-paste-ready markdown prompt.`,
  userPayloadBuilder: (rawPrompt, projectContext, conversationHistory) => {
    let payload = `Construct a final single-step vibe coding prompt based on:\n\n### ORIGINAL USER GOAL:\n"${rawPrompt}"\n\n`;
    if (projectContext && projectContext.trim()) {
      payload += `### PREVIOUS PIPELINE STAGES & SPECS:\n${projectContext}\n\n`;
    }
    if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      payload += `### CONVERSATION HISTORY:\n`;
      conversationHistory.forEach((message: any) => {
        const role = message.role === "assistant" ? "Assistant" : "User";
        payload += `[${role}]: ${message.content}\n`;
      });
      payload += `\n`;
    }
    payload += `Output only the compiled single-step vibe coding prompt. Do not include any tags, other conversational prefixes, or comments.`;
    return payload;
  },
  mockGenerator: (rawPrompt) => {
    const cleanPrompt = rawPrompt.replace(/['"]/g, '');
    const title = cleanPrompt.split(' ').slice(0, 3).join(' ') || "My Application";
    return {
      ok: true,
      recipeId: "final_vibe",
      outputKind: "markdown",
      title: `Final Vibe Prompt: ${title}`,
      content: `# FINAL VIBE CODING PROMPT - ${title.toUpperCase()}

You are a senior frontend developer and UX specialist. Build the initial scaffolding and core dashboard for "${cleanPrompt}".

## 🎯 Step 1 Focus
Implement the foundational structure, HSL dark aesthetic theme, and responsive navigation header. Do NOT attempt to build database integrations or authentication handlers in this step.

## 📁 Suggested File Scope (Maximum 20 files)
- \`src/App.tsx\` (Main routing and layout)
- \`src/index.css\` (Design tokens, glassmorphism, golden/bronze HSL variables)
- \`src/components/Dashboard.tsx\` (Responsive main grid and micro-animations)

## 🎨 Design Guidelines
- Modern dark mode with dark charcoal (\`#121214\`) background.
- Primary accent: Warm amber/gold HSL (\`hsl(38, 92%, 50%)\`).
- Card layout using subtle borders and translucent backdrop-blur (glassmorphism).

## ⚠️ Security & Constraints
- Private API keys must never be hardcoded; utilize BYOK state managers.
- Keep all custom hooks in \`src/hooks/\` and components strictly isolated.

## ✅ Acceptance Criteria
1. Header contains a mode switcher, status lights, and brand typography.
2. Main panel renders a beautiful empty-state dashboard grid.
3. Interactive elements trigger smooth micro-animations on hover and click.
4. Linter checks pass with zero compilation errors.`,
      structuredData: {}
    };
  }
};
