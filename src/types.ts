/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BLUEPRINT_OUTPUT_CONTRACT } from './lib/prompt/enhancerSystemPrompt';

export type PromptRecipeId =
  | "blueprint"
  | "idea_refinement"
  | "technical_spec"
  | "implementation_plan"
  | "code_review"
  | "black_swan"
  | "design_audit"
  | "final_vibe";

export interface ConversationHistoryRow {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface Assumption {
  id: string;
  text: string;
  confidence: 'high' | 'medium' | 'low';
  source: 'explicit' | 'inferred_from_context' | 'industry_default';
}

export interface IntentClassification {
  request_type: 'new_build' | 'feature_addition' | 'bug_fix' | 'refactor' | 'design_change' | 'ambiguous';
  confidence: 'high' | 'medium' | 'low';
  detected_domain: string;
}

export interface ProblemClarification {
  expanded_description: string;
  core_objectives: string[];
  primary_users: string[];
  assumptions: Assumption[];
  constraints: string[];
}

export interface FunctionalRequirements {
  must_have: string[];
  should_have: string[];
  could_have: string[];
  wont_have: string[];
}

export interface ArchitectureSection {
  paradigm: string;
  frontend: string;
  backend: string;
  database: string;
  apis: string;
  services: string[];
  integrations: string[];
  infra: string;
  devops: string;
}

export interface DataModels {
  entities: string[];
  schemas: string[];
}

export interface UserExperience {
  design_style: string;
  layout_system: string;
  navigation_structure: string;
  component_list: string[];
  interaction_states: string[];
  user_flows: string[];
  animations: string;
  accessibility: string;
}

export interface SecurityReliability {
  authentication: string;
  authorization: string;
  data_validation: string;
  rate_limiting: string;
  logging_monitoring: string;
  error_handling: string;
  privacy: string;
}

export interface PerformanceConstraints {
  scalability: string;
  latency: string;
  load_expectations: string;
  resource_constraints: string;
}

export interface PromptBlueprint {
  schema_version: string;
  title: string;
  summary: string;
  intent_classification: IntentClassification;
  problem_clarification: ProblemClarification;
  functional_requirements: FunctionalRequirements;
  architecture: ArchitectureSection;
  data_models: DataModels;
  user_experience: UserExperience;
  security_reliability: SecurityReliability;
  performance_constraints: PerformanceConstraints;
  edge_cases: string[];
  developer_notes: string[];
  final_prompt: string;
}

/**
 * Validates a structure against the PromptBlueprint type.
 * Returns null if valid, or an array of error messages if invalid.
 */
export function validateBlueprint(data: any): string[] | null {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') {
    return ['Blueprint is not a valid JSON object.'];
  }

  // Schema version
  if (data.schema_version !== BLUEPRINT_OUTPUT_CONTRACT.schema_version) {
    errors.push(`Missing or invalid 'schema_version' (must be '${BLUEPRINT_OUTPUT_CONTRACT.schema_version}').`);
  }

  // Simple string fields
  if (typeof data.title !== 'string' || !data.title.trim()) {
    errors.push("Missing or invalid 'title'.");
  }
  if (typeof data.summary !== 'string' || !data.summary.trim()) {
    errors.push("Missing or invalid 'summary'.");
  }

  // intent_classification
  if (!data.intent_classification || typeof data.intent_classification !== 'object') {
    errors.push("Missing or invalid 'intent_classification' object.");
  } else {
    const ic = data.intent_classification;
    const reqTypes = ['new_build', 'feature_addition', 'bug_fix', 'refactor', 'design_change', 'ambiguous'];
    if (!reqTypes.includes(ic.request_type)) {
      errors.push(`Invalid 'intent_classification.request_type' (${ic.request_type}).`);
    }
    const confidences = ['high', 'medium', 'low'];
    if (!confidences.includes(ic.confidence)) {
      errors.push(`Invalid 'intent_classification.confidence' (${ic.confidence}).`);
    }
    if (typeof ic.detected_domain !== 'string') {
      errors.push("Missing 'intent_classification.detected_domain' string.");
    }
  }

  // problem_clarification
  if (!data.problem_clarification || typeof data.problem_clarification !== 'object') {
    errors.push("Missing or invalid 'problem_clarification' object.");
  } else {
    const pc = data.problem_clarification;
    if (typeof pc.expanded_description !== 'string') {
      errors.push("Missing 'problem_clarification.expanded_description'.");
    }
    if (!Array.isArray(pc.core_objectives)) {
      errors.push("Missing or invalid 'problem_clarification.core_objectives' array.");
    }
    if (!Array.isArray(pc.primary_users)) {
      errors.push("Missing or invalid 'problem_clarification.primary_users' array.");
    }
    if (!Array.isArray(pc.constraints)) {
      errors.push("Missing or invalid 'problem_clarification.constraints' array.");
    }
    if (!Array.isArray(pc.assumptions)) {
      errors.push("Missing or invalid 'problem_clarification.assumptions' array.");
    } else {
      pc.assumptions.forEach((ass: any, idx: number) => {
        if (!ass.id || typeof ass.id !== 'string') {
          errors.push(`Assumption at index ${idx} is missing a string 'id'.`);
        }
        if (!ass.text || typeof ass.text !== 'string') {
          errors.push(`Assumption at index ${idx} is missing 'text'.`);
        }
        const confs = ['high', 'medium', 'low'];
        if (!confs.includes(ass.confidence)) {
          errors.push(`Assumption at index ${idx} has invalid 'confidence'.`);
        }
        const sources = ['explicit', 'inferred_from_context', 'industry_default'];
        if (!sources.includes(ass.source)) {
          errors.push(`Assumption at index ${idx} has invalid 'source'.`);
        }
      });
    }
  }

  // functional_requirements
  if (!data.functional_requirements || typeof data.functional_requirements !== 'object') {
    errors.push("Missing or invalid 'functional_requirements' object.");
  } else {
    const fr = data.functional_requirements;
    if (!Array.isArray(fr.must_have)) errors.push("Missing 'functional_requirements.must_have' array.");
    if (!Array.isArray(fr.should_have)) errors.push("Missing 'functional_requirements.should_have' array.");
    if (!Array.isArray(fr.could_have)) errors.push("Missing 'functional_requirements.could_have' array.");
    if (!Array.isArray(fr.wont_have)) errors.push("Missing 'functional_requirements.wont_have' array.");
  }

  // architecture
  if (!data.architecture || typeof data.architecture !== 'object') {
    errors.push("Missing or invalid 'architecture' object.");
  } else {
    const arch = data.architecture;
    const stringKeys = ['paradigm', 'frontend', 'backend', 'database', 'apis', 'infra', 'devops'];
    stringKeys.forEach(k => {
      if (typeof arch[k] !== 'string') {
        errors.push(`Missing 'architecture.${k}' string value.`);
      }
    });
    if (!Array.isArray(arch.services)) errors.push("Missing 'architecture.services' array.");
    if (!Array.isArray(arch.integrations)) errors.push("Missing 'architecture.integrations' array.");
  }

  // data_models
  if (!data.data_models || typeof data.data_models !== 'object') {
    errors.push("Missing or invalid 'data_models' object.");
  } else {
    const dm = data.data_models;
    if (!Array.isArray(dm.entities)) errors.push("Missing 'data_models.entities' array.");
    if (!Array.isArray(dm.schemas)) errors.push("Missing 'data_models.schemas' array.");
  }

  // user_experience
  if (!data.user_experience || typeof data.user_experience !== 'object') {
    errors.push("Missing or invalid 'user_experience' object.");
  } else {
    const ux = data.user_experience;
    const stringKeys = ['design_style', 'layout_system', 'navigation_structure', 'animations', 'accessibility'];
    stringKeys.forEach(k => {
      if (typeof ux[k] !== 'string') {
        errors.push(`Missing 'user_experience.${k}' string value.`);
      }
    });
    if (!Array.isArray(ux.component_list)) errors.push("Missing 'user_experience.component_list' array.");
    if (!Array.isArray(ux.interaction_states)) errors.push("Missing 'user_experience.interaction_states' array.");
    if (!Array.isArray(ux.user_flows)) errors.push("Missing 'user_experience.user_flows' array.");
  }

  // security_reliability
  if (!data.security_reliability || typeof data.security_reliability !== 'object') {
    errors.push("Missing or invalid 'security_reliability' object.");
  } else {
    const sr = data.security_reliability;
    const stringKeys = ['authentication', 'authorization', 'data_validation', 'rate_limiting', 'logging_monitoring', 'error_handling', 'privacy'];
    stringKeys.forEach(k => {
      if (typeof sr[k] !== 'string') {
        errors.push(`Missing 'security_reliability.${k}' string value.`);
      }
    });
  }

  // performance_constraints
  if (!data.performance_constraints || typeof data.performance_constraints !== 'object') {
    errors.push("Missing or invalid 'performance_constraints' object.");
  } else {
    const pc = data.performance_constraints;
    const stringKeys = ['scalability', 'latency', 'load_expectations', 'resource_constraints'];
    stringKeys.forEach(k => {
      if (typeof pc[k] !== 'string') {
        errors.push(`Missing 'performance_constraints.${k}' string value.`);
      }
    });
  }

  // edge_cases & developer_notes & final_prompt
  if (!Array.isArray(data.edge_cases)) {
    errors.push("Missing 'edge_cases' array.");
  }
  if (!Array.isArray(data.developer_notes)) {
    errors.push("Missing 'developer_notes' array.");
  }
  if (typeof data.final_prompt !== 'string' || !data.final_prompt.trim()) {
    errors.push("Missing or invalid 'final_prompt' string.");
  }

  return errors.length > 0 ? errors : null;
}

export interface GenericRecipeResult {
  ok: boolean;
  recipeId: string;
  outputKind: 'markdown' | 'json' | 'blueprint';
  title: string;
  content: string;
  structuredData?: any;
}

export type SparkIdea = {
  id: string;
  title: string;
  concept: string;
  rawPrompt: string;
  projectContext: string;
  conversationHistory: ConversationHistoryRow[];
  tags: string[];
  difficulty: "quick" | "medium" | "ambitious";
  novelty: "practical" | "unusual" | "black-swan";
  catalystProblem?: string;
  corePillars?: string[];
  whyNow?: string;
};

export interface PipelineStageResult {
  recipeId: string;
  outputKind: 'markdown' | 'json';
  title: string;
  content: string;
  structuredData?: any;
}

export interface RefineryPipeline {
  id: string;
  title: string;
  rawPrompt: string;
  projectContext: string;
  conversationHistory: ConversationHistoryRow[];
  stages: {
    projectRequest?: PipelineStageResult;
    technicalSpec?: PipelineStageResult;
    implementationPlan?: PipelineStageResult;
    finalVibePrompt?: PipelineStageResult;
  };
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowHistoryItem {
  id: string;
  title: string;
  timestamp: string;
  summary: string;
  provider: 'gemini' | 'mock';
  rawPrompt: string;
  projectContext: string;
  conversationHistory: ConversationHistoryRow[];
  recipeId?: string;
  blueprint?: PromptBlueprint;
  recipeResult?: GenericRecipeResult;
  selectedTab?: string;
  sparkTitle?: string;
  sparkNovelty?: 'practical' | 'unusual' | 'black-swan';
  sparkTags?: string[];
  type?: 'blueprint' | 'pipeline';
  pipeline?: RefineryPipeline;
}

