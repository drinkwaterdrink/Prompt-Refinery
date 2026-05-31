/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PromptBlueprint, validateBlueprint } from '../types';

export interface VibeCodingPacket {
  original_raw_prompt?: string;
  project_context?: string;
  conversation_history?: any[];
  reviewed_assumptions?: any[];
  functional_requirements_must_have?: any[];
  functional_requirements_should_have?: any[];
  developer_notes?: any[];
  final_prompt?: string;
  refinementProfile?: string;
}

export type ImportType = 
  | { type: 'blueprint'; data: PromptBlueprint }
  | { type: 'vibe_packet'; data: VibeCodingPacket }
  | { type: 'invalid'; error: string };

/**
 * Parses a JSON string and detects whether it is a Full Blueprint,
 * a Vibe Coding Packet, or neither (invalid).
 */
export function detectAndParseImport(jsonString: string): ImportType {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') {
      return { type: 'invalid', error: 'File is not a valid JSON object.' };
    }

    // A. Check if it is a Full Blueprint JSON
    const blueprintErrors = validateBlueprint(parsed);
    if (!blueprintErrors) {
      return { type: 'blueprint', data: parsed as PromptBlueprint };
    }

    // B. Check if it has Vibe Coding Packet fields
    const isVibePacket = 
      'original_raw_prompt' in parsed ||
      'project_context' in parsed ||
      'conversation_history' in parsed ||
      'final_prompt' in parsed;

    if (isVibePacket) {
      return { type: 'vibe_packet', data: parsed as VibeCodingPacket };
    }

    return { 
      type: 'invalid', 
      error: `File is neither a valid prompt blueprint nor a vibe coding packet. Blueprint validation errors: ${blueprintErrors.join('; ')}`
    };
  } catch (err: any) {
    return { type: 'invalid', error: `Not a valid JSON document format: ${err.message}` };
  }
}
