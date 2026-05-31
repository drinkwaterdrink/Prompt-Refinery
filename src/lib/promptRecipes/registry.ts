/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PromptRecipe, PromptRecipeId } from './types';
import { blueprintRecipe } from './blueprintRecipe';
import { ideaRefinementRecipe } from './ideaRefinementRecipe';
import { technicalSpecRecipe } from './technicalSpecRecipe';
import { implementationPlanRecipe } from './implementationPlanRecipe';
import { codeReviewRecipe } from './codeReviewRecipe';
import { designPrinciplesRecipe } from './designPrinciples';
import { blackSwanRecipe } from './blackSwanRecipe';

export const ALL_PROMPT_RECIPES: PromptRecipe[] = [
  blueprintRecipe,
  ideaRefinementRecipe,
  technicalSpecRecipe,
  implementationPlanRecipe,
  codeReviewRecipe,
  blackSwanRecipe,
  designPrinciplesRecipe
];

const RECIPE_MAP: Record<PromptRecipeId, PromptRecipe> = {
  blueprint: blueprintRecipe,
  idea_refinement: ideaRefinementRecipe,
  technical_spec: technicalSpecRecipe,
  implementation_plan: implementationPlanRecipe,
  code_review: codeReviewRecipe,
  black_swan: blackSwanRecipe,
  design_audit: designPrinciplesRecipe
};

export function getRecipeById(id: PromptRecipeId): PromptRecipe {
  return RECIPE_MAP[id] || blueprintRecipe;
}
export function isValidRecipeId(id: string): id is PromptRecipeId {
  return id in RECIPE_MAP;
}
export * from './types';
