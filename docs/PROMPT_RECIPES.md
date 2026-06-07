# The Prompt Recipe Engine

Prompt Refinery compiles vague app ideas into highly structured, detailed instructions using a modular **Recipe Engine**. This document explains how recipes are structured, stored, modified, and how they interact with Prompt Quality Profiles.

---

## The Recipe Library

Prompt Refinery comes pre-loaded with seven foundational engineering prompt recipes:

| Recipe ID | Title | Description |
|-----------|-------|-------------|
| `blueprint` | 📋 Blueprint | Compiles raw prompts into comprehensive target schemas, layout structures, functional metrics, and complete copy-paste directives. |
| `idea_refinement` | 💡 Idea Refinement | Transforms rough product requests into fully polished, clean Project Request Specifications. |
| `technical_spec` | ⚙️ Technical Spec | Drafts detailed architecture choices, paradigms, infra choices, and DevOps specs for a technical stack. |
| `implementation_plan` | 🎯 Implementation Plan | Translates specifications into a sequential, checklist-driven codebase migration plan. |
| `code_review` | 🔍 Code Review | Audits file contexts, directions, or repository summaries and crafts detailed codebase optimization plans. |
| `design_audit` | 🎨 Design Audit | Audits layout structures, visual parameters, target devices, and CSS against WCAG AA and token systems. |
| `black_swan` | 🦢 Black-Swan Ideation | Analyzes project requests to generate non-obvious, highly defensive feature MVPs. |

---

## How Recipes are Stored

All recipes are declared as TypeScript modules inside the workspace directory:
```text
src/lib/promptRecipes/
├── registry.ts           # Central registry importing and mapping all recipes
├── types.ts              # Type interface defining recipe attributes
├── blueprintRecipe.ts    # The Core Blueprint compiler
├── codeReviewRecipe.ts   # The Code Review/Optimization auditor
├── designPrinciples.ts   # The Design System/Audit recipe
├── ...
```

### The Recipe Schema (`src/lib/promptRecipes/types.ts`)
Each recipe implements the following `PromptRecipe` interface:
```typescript
export interface PromptRecipe {
  id: string;                  // Unique recipe identifier matching dropdown option
  label: string;               // Display title in UI
  shortDescription: string;    // Brief summary text in selector
  outputKind: 'markdown' | 'json'; // Format returned to the client
  systemInstruction: string;   // Baseline system prompt directing LLM behavior
  userPayloadBuilder: (        // Formulator converting raw inputs into user payload
    rawPrompt: string, 
    projectContext?: string, 
    conversationHistory?: any[]
  ) => string;
  mockGenerator: (             // Client-side offline outcome simulator
    rawPrompt: string, 
    projectContext?: string, 
    refinementProfile?: string,
    projectPack?: any
  ) => any;
}
```

---

## How to Add a New Recipe

To expand the library with a custom engineering recipe, follow these steps:

### Step 1: Create the Recipe File
Create a new file in `src/lib/promptRecipes/` (e.g. `src/lib/promptRecipes/apiSpecRecipe.ts`):
```typescript
import { PromptRecipe } from './types';

export const apiSpecRecipe: PromptRecipe = {
  id: 'api_spec',
  label: 'API Specification',
  shortDescription: 'Compiles server schemas into OpenAPI specifications.',
  outputKind: 'markdown',
  systemInstruction: 'You are an API Architect...',
  userPayloadBuilder: (rawPrompt, projectContext) => {
    return `Draft an API spec for: ${rawPrompt}`;
  },
  mockGenerator: (rawPrompt) => {
    return {
      ok: true,
      title: "API Specification Output",
      content: "# OpenAPI Spec..."
    };
  }
};
```

### Step 2: Register the Recipe
Import and register your recipe in `src/lib/promptRecipes/registry.ts`:
```typescript
import { apiSpecRecipe } from './apiSpecRecipe';

const RECIPES: PromptRecipe[] = [
  blueprintRecipe,
  // ...
  apiSpecRecipe
];
```

### Step 3: Add Selector Option
Add the option inside your React select input in `src/components/InputPanel.tsx`:
```xml
<option value="api_spec">🌐 API Specification</option>
```

---

## How Profiles Modify Recipes

When a user selects a **Prompt Quality Profile** (e.g. *Senior Engineer*, *UI/UX Designer*), the selection does not alter the baseline schema structure of the recipe. 

Instead, the selected profile's unique core guidelines are **dynamically appended as a guidance block** to the recipe's `systemInstruction` before forwarding the request to the server:

```typescript
// System instruction formulation logic (server.ts)
let compiledSystemInstruction = recipe.systemInstruction;

if (refinementProfile) {
  const profileGuidance = getProfileInstructions(refinementProfile);
  compiledSystemInstruction += `\n\n### QUALITY REFINEMENT CRITERIA (HIGH PRIORITY):\n${profileGuidance}`;
}
```
This forces the LLM to strictly adapt its suggestions, checklist priorities, and review severities according to the selected profile's focus area (e.g., minimizing rewrites for *Senior Engineer* or maximizing WCAG AA Outlines for *UI/UX Designer*).
