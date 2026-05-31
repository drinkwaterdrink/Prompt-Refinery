/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PromptRecipe } from './types';

export const blackSwanRecipe: PromptRecipe = {
  id: 'black_swan',
  label: 'Black-Swan Ideation',
  shortDescription: 'Generate novel, non-obvious, and highly defensible paradigm-shifting startup or feature MVPs.',
  outputKind: 'markdown',
  systemInstruction: `You are a legendary startup incubator general partner and technology foresight researcher. Your task is to transform a standard feature request or app concept into a 'Black Swan' opportunity—a paradigm-shifting, non-obvious, high-moat feature or product concept that captures immense user habit loops and builds systemic defensibility.
Reason privately. Do not output hidden brainstorming tags.
Your output must include:
- # Black Swan Concept: [Working Title]
- ## Paradigm Shift / Elevator Pitch
- ## Why Now (Timing & catalysts)
- ## Foundation MVP (The critical core loop)
- ## Black Swan Features (Unconventional, viral, high-value hooks)
- ## Core Habit Loop (Hook model: trigger, action, variable reward, investment)
- ## Interface & Interaction Model (Spatial, conversational, or motion UX details)
- ## Systemic Moat (Data flywheel, integrations, or lock-in)
- ## Ethical Monetization (Value-aligned pricing)
- ## Raw Prompt & Project Context Pair (Ready to be fed back into Prompt Refinery or a coding agent)
  Ensure these are wrapped clearly as raw copyable parameters.`,
  userPayloadBuilder: (rawPrompt, projectContext, conversationHistory) => {
    let payload = `Analyze this raw product idea and expand it into a Black Swan concept:\n\n### ROUGH PRODUCT IDEA:\n"${rawPrompt}"\n\n`;
    if (projectContext && projectContext.trim()) {
      payload += `### BOUNDARY CONDITIONS:\n"${projectContext}"\n\n`;
    }
    if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      payload += `### CONVERSATION HISTORY:\n`;
      conversationHistory.forEach((message: any) => {
        const role = message.role === "assistant" ? "Assistant" : "User";
        payload += `[${role}]: ${message.content}\n`;
      });
      payload += `\n`;
    }
    payload += `Output only the Markdown specification starting with '# Black Swan Concept: [Working Title]'. Do not include any tags or conversational chatter.`;
    return payload;
  },
  mockGenerator: (rawPrompt) => {
    const cleanPrompt = rawPrompt.replace(/['"]/g, '');
    const title = cleanPrompt.split(' ').slice(0, 3).join(' ') || "My Application";
    return {
      ok: true,
      recipeId: "black_swan",
      outputKind: "markdown",
      title: `Black Swan: ${title}`,
      content: `# Black Swan Concept: ${title} Shift

## Paradigm Shift / Elevator Pitch
Instead of building just a standard utility, this platform shifts from passive tracking to reactive, gamified behavior feedback. It converts passive user friction into high-reward social loop drivers.

## Why Now
- Exponential growth of client-side local models enables deep privacy-centric client analysis.
- Growing user fatigue with centralized data brokers drives adoption of decentralized local repositories.

## Foundation MVP
An offline-first, high-fidelity experience focused exclusively on a 10-second high-impact habit check. Users input their single key parameter of the day and receive an instant predictive micro-simulation.

## Black Swan Features
- **XP Progression & Multipliers**: High-craft gamification loops rewarding consistency.
- **Privacy Armor**: Entirely local indexing with zero cloud dependencies unless manually synced.

## Core Habit Loop
- **Trigger**: System micro-alert or calendar anchor.
- **Action**: Input data in under 5 seconds.
- **Variable Reward**: Unlocking dynamic, animated visual progress tokens.
- **Investment**: Building a historical database of client analytics.

## Interface & Interaction Model
Glassmorphic cards floating over deep warm charcoal backgrounds. Subtle CSS animations emphasizing button presses and data submissions.

## Systemic Moat
Localized data ownership makes it trivial to import/export, creating zero vendor lock-in for the user, yet building a high personal-data affinity.

## Ethical Monetization
Value-aligned premium layers unlocking cosmetic card styling sets and advanced simulation metrics. Zero ad tracking.

## Raw Prompt & Project Context Pair
\`\`\`text
### RAW PROMPT:
"Build a fully client-side sandbox for behavior gamification, utilizing localized HSL tokens, Outfit typography, and custom LocalStorage registries."

### PROJECT CONTEXT:
"Must conform to WCAG AA, utilize mobile-first CSS grids, and run completely offline."
\`\`\``,
      structuredData: {}
    };
  }
};
