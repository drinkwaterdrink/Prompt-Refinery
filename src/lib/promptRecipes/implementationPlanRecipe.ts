/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PromptRecipe } from './types';

export const implementationPlanRecipe: PromptRecipe = {
  id: 'implementation_plan',
  label: 'Implementation Plan',
  shortDescription: 'Turns a technical spec into a sequential implementation plan for a coding agent.',
  outputKind: 'markdown',
  systemInstruction: `You are a senior technical program manager specializing in agentic workflows. Your job is to break down a technical specification or project description into an ordered, sequential, step-by-step implementation plan for an agentic coder.
Rules:
- Order steps logically, putting database and basic infrastructure changes first, followed by APIs, business logic, and UI.
- Each step must be highly atomic, changing no more than approximately 20 files.
- Reason privately. Do not include hidden brainstorm tags (like <brainstorm>, <thinking>, or CoT tags).
Your output must be formatted as markdown with the following headers:
- # Implementation Plan: [Project Name]
- ## Executive Summary
- ## Sequential Steps (e.g. Step 1: Datastore Setup, Step 2: API scaffolding, etc.)
  For each step, explicitly detail:
  - Objective
  - Files likely affected
  - Dependencies
  - Manual user instructions (if any)
  - Acceptance criteria`,
  userPayloadBuilder: (rawPrompt, projectContext, conversationHistory) => {
    let payload = `Construct a step-by-step implementation plan for the following project request or specification:\n\n### SPECIFICATION/REQUEST:\n"${rawPrompt}"\n\n`;
    if (projectContext && projectContext.trim()) {
      payload += `### CONTEXT RULES:\n"${projectContext}"\n\n`;
    }
    if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      payload += `### CONVERSATION HISTORY:\n`;
      conversationHistory.forEach((message: any) => {
        const role = message.role === "assistant" ? "Assistant" : "User";
        payload += `[${role}]: ${message.content}\n`;
      });
      payload += `\n`;
    }
    payload += `Provide only the Markdown implementation plan with no extra commentary or tags.`;
    return payload;
  },
  mockGenerator: (rawPrompt) => {
    const cleanPrompt = rawPrompt.replace(/['"]/g, '');
    const title = cleanPrompt.split(' ').slice(0, 3).join(' ') || "My Application";
    return {
      ok: true,
      recipeId: "implementation_plan",
      outputKind: "markdown",
      title: `Implementation Plan: ${title}`,
      content: `# Implementation Plan: ${title}

## Executive Summary
This plan details the sequential development checklist required to build "${cleanPrompt}". Each step is structured to touch a limited set of files (~20 files max) to maximize precision, performance, and compatibility.

## Sequential Steps

### Step 1: Core Datastore & Types Setup
- **Objective**: Establish the core data schemas and TypeScript interfaces.
- **Files likely affected**:
  - \`src/types.ts\` (Create data model interfaces)
  - \`src/lib/db.ts\` (Initialize local state database adapter)
- **Dependencies**: None.
- **Manual user instructions**: Ensure Node/npm dependencies are installed.
- **Acceptance criteria**: TypeScript compile succeeds with no schema errors.

### Step 2: API Scaffolding & Business Logic
- **Objective**: Build server routing and mock data generators.
- **Files likely affected**:
  - \`server.ts\` (Implement routes)
  - \`src/mockData.ts\` (Seed data payloads)
- **Dependencies**: Step 1.
- **Manual user instructions**: Verify backend server port 3000 is open.
- **Acceptance criteria**: GET and POST endpoints return structured JSON status codes.

### Step 3: UI Dashboard Panel Integration
- **Objective**: Create responsive sidebar and central explorer components.
- **Files likely affected**:
  - \`src/components/InputPanel.tsx\`
  - \`src/components/BlueprintExplorer.tsx\`
  - \`src/App.tsx\`
- **Dependencies**: Step 2.
- **Manual user instructions**: None.
- **Acceptance criteria**: Components render with premium aesthetic dark modes, showing responsive grids.`,
      structuredData: {}
    };
  }
};
