/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PromptRecipe } from './types';
import { ENHANCER_SYSTEM_PROMPT } from '../prompt/enhancerSystemPrompt';
import { generateBlueprintForPrompt } from '../../mockData';

export const blueprintRecipe: PromptRecipe = {
  id: 'blueprint',
  label: 'Blueprint',
  shortDescription: 'Turns a rough app/feature idea into a structured coding-agent prompt blueprint.',
  outputKind: 'blueprint',
  systemInstruction: ENHANCER_SYSTEM_PROMPT,
  userPayloadBuilder: (rawPrompt, projectContext, conversationHistory) => {
    let payload = `Optimize the following user request:\n\n### USER REQUEST:\n"${rawPrompt}"\n\n`;

    if (projectContext && projectContext.trim()) {
      payload += `### EXTRA PROJECT CONTEXT:\n"${projectContext}"\n\n`;
    }

    if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      payload += `### CONVERSATION HISTORY:\n`;
      conversationHistory.forEach((message: any) => {
        const role = message.role === "assistant" ? "Assistant" : "User";
        payload += `[${role}]: ${message.content}\n`;
      });
      payload += `\n`;
    }

    payload += `Structure your output exactly matching the described schema version '1.0'. Generate NO other text.`;
    return payload;
  },
  mockGenerator: (rawPrompt, projectContext, refinementProfile) => {
    return generateBlueprintForPrompt(rawPrompt, projectContext, refinementProfile);
  }
};
