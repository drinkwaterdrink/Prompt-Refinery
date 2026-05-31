/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PromptRecipeId =
  | "blueprint"
  | "idea_refinement"
  | "technical_spec"
  | "implementation_plan"
  | "code_review"
  | "black_swan"
  | "design_audit"
  | "final_vibe";

export interface PromptRecipe {
  id: PromptRecipeId;
  label: string;
  shortDescription: string;
  outputKind: 'blueprint' | 'markdown' | 'json';
  systemInstruction: string;
  userPayloadBuilder: (rawPrompt: string, projectContext?: string, conversationHistory?: any[]) => string;
  mockGenerator: (rawPrompt: string, projectContext?: string, refinementProfile?: string) => any;
}
