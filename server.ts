/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { generateBlueprintForPrompt } from "./src/mockData";
import { validateBlueprint } from "./src/types";
import { ENHANCER_SYSTEM_PROMPT, BLUEPRINT_OUTPUT_CONTRACT } from "./src/lib/prompt/enhancerSystemPrompt";
import { recursiveSanitize } from "./src/lib/sanitize";
import { getRecipeById, isValidRecipeId } from "./src/lib/promptRecipes/registry";
import { generateLocalSparks } from "./src/lib/sparksMockGenerator";
import { getProfileById } from "./src/lib/promptProfiles";

dotenv.config();

function repairJson(jsonStr: string): string {
  let clean = jsonStr.trim();
  
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escape = false;
  
  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (char === '\\') {
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === '{') openBraces++;
      else if (char === '}') openBraces--;
      else if (char === '[') openBrackets++;
      else if (char === ']') openBrackets--;
    }
  }
  
  if (inString) {
    clean += '"';
  }
  
  while (openBrackets > 0) {
    clean += ']';
    openBrackets--;
  }
  
  while (openBraces > 0) {
    clean += '}';
    openBraces--;
  }
  
  return clean;
}

/**
 * Robustly parses and extracts the correct JSON blueprint object from model outputs
 */
function extractJsonBlueprint(text: string): { parsedJson: any; parseError: string | null } {
  let clean = text.trim();
  
  // Strip markdown code fences if present at the start/end
  if (clean.startsWith("```")) {
    clean = clean.replace(/^```[a-zA-Z]*\s*/, "");
    clean = clean.replace(/```$/, "").trim();
  }

  // 1. Try parsing the whole thing first
  try {
    const parsed = JSON.parse(clean);
    if (parsed && typeof parsed === "object") {
      return { parsedJson: parsed, parseError: null };
    }
  } catch (e) {
    // continue to robust parsing
  }

  // 1b. Try parsing after JSON repair if it might be truncated
  try {
    const repaired = repairJson(clean);
    const parsed = JSON.parse(repaired);
    if (parsed && typeof parsed === "object") {
      return { parsedJson: parsed, parseError: null };
    }
  } catch (e) {
    // continue to robust parsing
  }

  // 2. Find all opening braces and try matching them with closing braces
  const results: any[] = [];
  
  for (let startIdx = 0; startIdx < clean.length; startIdx++) {
    if (clean[startIdx] === '{') {
      let braceCount = 0;
      let inString = false;
      let escape = false;
      
      for (let i = startIdx; i < clean.length; i++) {
        const char = clean[i];
        if (escape) {
          escape = false;
          continue;
        }
        if (char === '\\') {
          escape = true;
          continue;
        }
        if (char === '"') {
          inString = !inString;
          continue;
        }
        if (!inString) {
          if (char === '{') {
            braceCount++;
          } else if (char === '}') {
            braceCount--;
            if (braceCount === 0) {
              const candidate = clean.substring(startIdx, i + 1);
              try {
                const parsed = JSON.parse(candidate);
                if (parsed && typeof parsed === "object") {
                  results.push(parsed);
                }
              } catch (e) {
                // Not standard JSON, keep iterating
              }
            }
          }
        }
      }
    }
  }

  // If we found any successfully parsed objects, find the best match
  if (results.length > 0) {
    const best = results.find(r => r && (r.schema_version || r.final_prompt || r.problem_clarification));
    if (best) {
      return { parsedJson: best, parseError: null };
    }
    results.sort((a, b) => JSON.stringify(b).length - JSON.stringify(a).length);
    return { parsedJson: results[0], parseError: null };
  }

  // 3. Last resort: backwards greedy search from the first '{' to the last '}'
  const firstBrace = clean.indexOf('{');
  if (firstBrace !== -1) {
    for (let j = clean.length - 1; j >= firstBrace; j--) {
      if (clean[j] === '}') {
        const candidate = clean.substring(firstBrace, j + 1);
        try {
          const parsed = JSON.parse(candidate);
          if (parsed && typeof parsed === "object") {
            return { parsedJson: parsed, parseError: null };
          }
        } catch (e) {
          // keep searching backwards
        }
      }
    }
  }

  // 3b. Try greedy search on repaired string
  try {
    const repaired = repairJson(clean);
    const firstBraceRep = repaired.indexOf('{');
    const lastBraceRep = repaired.lastIndexOf('}');
    if (firstBraceRep !== -1 && lastBraceRep !== -1 && lastBraceRep > firstBraceRep) {
      const candidate = repaired.substring(firstBraceRep, lastBraceRep + 1);
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object") {
        return { parsedJson: parsed, parseError: null };
      }
    }
  } catch (e) {
    // skip
  }

  return { 
    parsedJson: null, 
    parseError: "Could not find any valid JSON object structure in response payload." 
  };
}

/**
 * Self-healing layer to auto-correct and format minor model JSON schema deviations
 */
function healBlueprint(data: any): any {
  if (!data || typeof data !== 'object') {
    return {
      schema_version: "1.0",
      title: "Untitled Refined Blueprint",
      summary: "Model output could not be parsed as a structured blueprint.",
      intent_classification: { request_type: "ambiguous", confidence: "low", detected_domain: "General" },
      problem_clarification: { expanded_description: "General system blueprint", core_objectives: [], primary_users: [], assumptions: [], constraints: [] },
      functional_requirements: { must_have: [], should_have: [], could_have: [], wont_have: [] },
      architecture: { paradigm: "", frontend: "", backend: "", database: "", apis: "", services: [], integrations: [], infra: "", devops: "" },
      data_models: { entities: [], schemas: [] },
      user_experience: { design_style: "", layout_system: "", navigation_structure: "", component_list: [], interaction_states: [], user_flows: [], animations: "", accessibility: "" },
      security_reliability: { authentication: "", authorization: "", data_validation: "", rate_limiting: "", logging_monitoring: "", error_handling: "", privacy: "" },
      performance_constraints: { scalability: "", latency: "", load_expectations: "", resource_constraints: "" },
      edge_cases: [],
      developer_notes: [],
      final_prompt: "Develop a basic software application."
    };
  }

  // 1. Force schema_version
  if (!data.schema_version) {
    data.schema_version = "1.0";
  }

  // 2. Heal simple string fields
  if (typeof data.title !== 'string' || !data.title.trim()) {
    data.title = data.title || "Untitled Refined Blueprint";
  }
  if (typeof data.summary !== 'string' || !data.summary.trim()) {
    data.summary = data.summary || "No summary provided by the model.";
  }

  // 3. Heal intent_classification
  if (data.intentClassification && !data.intent_classification) {
    data.intent_classification = data.intentClassification;
  }
  if (!data.intent_classification || typeof data.intent_classification !== 'object') {
    data.intent_classification = { request_type: "new_build", confidence: "high", detected_domain: "General" };
  } else {
    const ic = data.intent_classification;
    if (ic.requestType && !ic.request_type) ic.request_type = ic.requestType;
    if (ic.detectedDomain && !ic.detected_domain) ic.detected_domain = ic.detectedDomain;

    const reqTypes = ['new_build', 'feature_addition', 'bug_fix', 'refactor', 'design_change', 'ambiguous'];
    if (!reqTypes.includes(ic.request_type)) {
      ic.request_type = "new_build";
    }
    const confidences = ['high', 'medium', 'low'];
    if (!confidences.includes(ic.confidence)) {
      ic.confidence = "high";
    }
    if (typeof ic.detected_domain !== 'string') {
      ic.detected_domain = "General";
    }
  }

  // 4. Heal problem_clarification
  if (data.problemClarification && !data.problem_clarification) {
    data.problem_clarification = data.problemClarification;
  }
  if (!data.problem_clarification || typeof data.problem_clarification !== 'object') {
    data.problem_clarification = {
      expanded_description: "General project description.",
      core_objectives: [],
      primary_users: [],
      assumptions: [],
      constraints: []
    };
  } else {
    const pc = data.problem_clarification;
    if (pc.expandedDescription && !pc.expanded_description) pc.expanded_description = pc.expandedDescription;
    if (pc.coreObjectives && !pc.core_objectives) pc.core_objectives = pc.coreObjectives;
    
    if (pc.primaryUser && !pc.primary_users) pc.primary_users = Array.isArray(pc.primaryUser) ? pc.primaryUser : [pc.primaryUser];
    if (pc.primaryUsers && !pc.primary_users) pc.primary_users = pc.primaryUsers;
    if (!Array.isArray(pc.primary_users)) pc.primary_users = [];

    if (pc.constraint && !pc.constraints) pc.constraints = Array.isArray(pc.constraint) ? pc.constraint : [pc.constraint];
    if (!Array.isArray(pc.constraints)) pc.constraints = [];
    if (!Array.isArray(pc.core_objectives)) pc.core_objectives = [];

    // Heal assumptions
    if (pc.assumption && !pc.assumptions) pc.assumptions = Array.isArray(pc.assumption) ? pc.assumption : [pc.assumption];
    if (!Array.isArray(pc.assumptions)) pc.assumptions = [];
    
    pc.assumptions.forEach((ass: any, idx: number) => {
      if (typeof ass !== 'object' || !ass) {
        pc.assumptions[idx] = { id: `ass_${idx}`, text: "General assumption", confidence: "medium", source: "explicit" };
        return;
      }
      if (!ass.id || typeof ass.id !== 'string') {
        ass.id = `ass_${idx}`;
      }
      if (!ass.text || typeof ass.text !== 'string') {
        ass.text = ass.text || "Implied project context.";
      }
      const confs = ['high', 'medium', 'low'];
      if (!confs.includes(ass.confidence)) {
        ass.confidence = "medium";
      }
      const sources = ['explicit', 'inferred_from_context', 'industry_default'];
      if (!sources.includes(ass.source)) {
        ass.source = "inferred_from_context";
      }
    });
  }

  // 5. Heal functional_requirements
  if (data.functionalRequirements && !data.functional_requirements) {
    data.functional_requirements = data.functionalRequirements;
  }
  if (!data.functional_requirements || typeof data.functional_requirements !== 'object') {
    data.functional_requirements = { must_have: [], should_have: [], could_have: [], wont_have: [] };
  } else {
    const fr = data.functional_requirements;
    if (fr.mustHaves && !fr.must_have) fr.must_have = fr.mustHaves;
    if (fr.shouldHaves && !fr.should_have) fr.should_have = fr.shouldHaves;
    if (fr.couldHaves && !fr.could_have) fr.could_have = fr.couldHaves;
    if (fr.wontHaves && !fr.wont_have) fr.wont_have = fr.wontHaves;

    if (!Array.isArray(fr.must_have)) fr.must_have = [];
    if (!Array.isArray(fr.should_have)) fr.should_have = [];
    if (!Array.isArray(fr.could_have)) fr.could_have = [];
    if (!Array.isArray(fr.wont_have)) fr.wont_have = [];
  }

  // 6. Heal architecture
  if (!data.architecture || typeof data.architecture !== 'object') {
    data.architecture = { paradigm: "", frontend: "", backend: "", database: "", apis: "", services: [], integrations: [], infra: "", devops: "" };
  } else {
    const arch = data.architecture;
    const stringKeys = ['paradigm', 'frontend', 'backend', 'database', 'apis', 'infra', 'devops'];
    stringKeys.forEach(k => {
      if (typeof arch[k] !== 'string') {
        arch[k] = arch[k] ? String(arch[k]) : "";
      }
    });
    if (!Array.isArray(arch.services)) arch.services = [];
    if (!Array.isArray(arch.integrations)) arch.integrations = [];
  }

  // 7. Heal data_models
  if (data.dataModels && !data.data_models) data.data_models = data.dataModels;
  if (!data.data_models || typeof data.data_models !== 'object') {
    data.data_models = { entities: [], schemas: [] };
  } else {
    const dm = data.data_models;
    if (!Array.isArray(dm.entities)) dm.entities = [];
    if (!Array.isArray(dm.schemas)) dm.schemas = [];
  }

  // 8. Heal user_experience
  if (data.userExperience && !data.user_experience) data.user_experience = data.userExperience;
  if (!data.user_experience || typeof data.user_experience !== 'object') {
    data.user_experience = { design_style: "", layout_system: "", navigation_structure: "", component_list: [], interaction_states: [], user_flows: [], animations: "", accessibility: "" };
  } else {
    const ux = data.user_experience;
    const stringKeys = ['design_style', 'layout_system', 'navigation_structure', 'animations', 'accessibility'];
    stringKeys.forEach(k => {
      if (typeof ux[k] !== 'string') {
        ux[k] = ux[k] ? String(ux[k]) : "";
      }
    });
    if (ux.componentList && !ux.component_list) ux.component_list = ux.componentList;
    if (ux.interactionStates && !ux.interaction_states) ux.interaction_states = ux.interactionStates;
    if (ux.userFlows && !ux.user_flows) ux.user_flows = ux.userFlows;

    if (!Array.isArray(ux.component_list)) ux.component_list = [];
    if (!Array.isArray(ux.interaction_states)) ux.interaction_states = [];
    if (!Array.isArray(ux.user_flows)) ux.user_flows = [];
  }

  // 9. Heal security_reliability
  if (data.securityReliability && !data.security_reliability) data.security_reliability = data.securityReliability;
  if (!data.security_reliability || typeof data.security_reliability !== 'object') {
    data.security_reliability = { authentication: "", authorization: "", data_validation: "", rate_limiting: "", logging_monitoring: "", error_handling: "", privacy: "" };
  } else {
    const sr = data.security_reliability;
    const stringKeys = ['authentication', 'authorization', 'data_validation', 'rate_limiting', 'logging_monitoring', 'error_handling', 'privacy'];
    stringKeys.forEach(k => {
      if (typeof sr[k] !== 'string') {
        sr[k] = sr[k] ? String(sr[k]) : "";
      }
    });
  }

  // 10. Heal performance_constraints
  if (data.performanceConstraints && !data.performance_constraints) data.performance_constraints = data.performanceConstraints;
  if (!data.performance_constraints || typeof data.performance_constraints !== 'object') {
    data.performance_constraints = { scalability: "", latency: "", load_expectations: "", resource_constraints: "" };
  } else {
    const pc = data.performance_constraints;
    const stringKeys = ['scalability', 'latency', 'load_expectations', 'resource_constraints'];
    stringKeys.forEach(k => {
      if (typeof pc[k] !== 'string') {
        pc[k] = pc[k] ? String(pc[k]) : "";
      }
    });
  }

  // 11. Heal edge_cases, developer_notes, final_prompt
  if (data.edgeCases && !data.edge_cases) data.edge_cases = data.edgeCases;
  if (data.developerNotes && !data.developer_notes) data.developer_notes = data.developerNotes;
  if (data.finalPrompt && !data.final_prompt) data.final_prompt = data.finalPrompt;

  if (!Array.isArray(data.edge_cases)) data.edge_cases = [];
  if (!Array.isArray(data.developer_notes)) data.developer_notes = [];
  if (typeof data.final_prompt !== 'string' || !data.final_prompt.trim()) {
    data.final_prompt = data.final_prompt || "Develop a fully validated and optimized application matching these architectural plans.";
  }

  return data;
}

/**
 * Light-weight public GitHub context extractor
 */
async function extractGitHubContext(repoUrl: string): Promise<{ text: string; files: string[] }> {
  const result = { text: "", files: [] as string[] };
  if (!repoUrl || typeof repoUrl !== 'string' || !repoUrl.trim()) {
    return result;
  }

  // Matches https://github.com/owner/repo or http://...
  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/\?\s]+)/);
  if (!match) {
    return result;
  }

  const owner = match[1];
  let repo = match[2];
  if (repo.endsWith('.git')) {
    repo = repo.slice(0, -4);
  }

  const targetFiles = ["README.md", "package.json", "server.ts", "src/App.tsx", "src/main.tsx"];
  const branches = ["main", "master"];
  
  let accumulated = "";

  for (const file of targetFiles) {
    let content = "";
    let fetchedBranch = "";

    for (const branch of branches) {
      const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${file}`;
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
        if (response.ok) {
          content = await response.text();
          fetchedBranch = branch;
          break;
        }
      } catch (err) {
        // Skip branch try next or fail silently
      }
    }

    if (content && content.trim()) {
      accumulated += `\n\n### REPOSITORY FILE: ${file} (Branch: ${fetchedBranch})\n\`\`\`\n${content.substring(0, 12000)}\n\`\`\`\n`;
      result.files.push(file);
    }
  }

  result.text = accumulated;
  return result;
}

function compileProjectPackGuidance(pack: any): string {
  if (!pack) return "";
  
  let block = "\n\n### ACTIVE PROJECT CONTEXT PACK (DURABLE APP PROFILE):\n";
  block += `- **Project Name:** ${pack.name || "Unnamed Project"}\n`;
  if (pack.description) block += `- **Description:** ${pack.description}\n`;
  if (pack.repoUrl) block += `- **Repository URL:** ${pack.repoUrl}\n`;
  
  if (pack.techStack && pack.techStack.trim()) {
    block += `- **Tech Stack:** ${pack.techStack}\n`;
    block += `*NOTE:* Since a specific tech stack is specified, you MUST tailor your recommendations, code examples, architecture choices, and implementation steps directly to this tech stack.\n`;
  } else {
    block += `- **Tech Stack:** Stack-Agnostic (Ensure all recommendations, prompts, and specs remain framework-independent and stack-agnostic).\n`;
  }
  
  if (pack.currentStatus) block += `- **Current Status:** ${pack.currentStatus}\n`;
  if (pack.designPreferences) block += `- **Design Preferences:** ${pack.designPreferences}\n`;
  if (pack.knownIssues) {
    block += `- **Known Issues & Technical Debt:** ${pack.knownIssues}\n`;
    block += `*CRITICAL:* Do NOT suggest features, libraries, or architectural changes that conflict with or exacerbate these known issues.\n`;
  }
  if (pack.futureIdeas) block += `- **Future Ideas & Roadmap:** ${pack.futureIdeas}\n`;
  if (pack.importantFiles && pack.importantFiles.length > 0) {
    block += `- **Important Source Files:** ${pack.importantFiles.join(', ')}\n`;
  }
  if (pack.customInstructions) {
    block += `\n### HIGH-PRIORITY PROJECT CUSTOM GUIDANCE:\n`;
    block += `"${pack.customInstructions}"\n`;
    block += `*CRITICAL:* Treat the custom instructions above as absolute high-priority project rules that override any general recipe conventions.\n`;
  }
  
  return block;
}

interface CustomOpenAIRequestParams {
  systemInstruction: string;
  userPrompt: string;
  config: any;
  temperature?: number;
  maxOutputTokens?: number;
}

async function callCustomOpenAI(params: CustomOpenAIRequestParams): Promise<string> {
  const { systemInstruction, userPrompt, config } = params;
  if (!config) {
    throw new Error("Custom OpenAI configuration is missing.");
  }
  
  let fullUrl = (config.apiUrl || "").trim();
  if (fullUrl) {
    fullUrl = fullUrl.replace(/\/+$/, "");
    if (!fullUrl.endsWith("/completions")) {
      fullUrl = fullUrl + "/chat/completions";
    }
  } else {
    const baseUrl = (config.baseUrl || "").trim();
    if (!baseUrl) {
      throw new Error("Custom OpenAI API URL or Base URL is required.");
    }
    let endpoint = (config.endpointPath || "/v1/chat/completions").trim();
    if (!endpoint.startsWith("/")) {
      endpoint = "/" + endpoint;
    }
    fullUrl = baseUrl.replace(/\/+$/, "") + endpoint;
  }
  
  const apiKey = (config.apiKey || "").trim();
  const model = (config.model || "").trim();
  const jsonMode = !!config.jsonMode;
  
  let customHeaders: Record<string, string> = {};
  if (config.customHeadersJson && config.customHeadersJson.trim()) {
    try {
      customHeaders = JSON.parse(config.customHeadersJson);
    } catch (e: any) {
      throw new Error(`Failed to parse custom headers JSON: ${e.message}`);
    }
  }
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...customHeaders
  };
  
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }
  
  const body: any = {
    model: model || "gpt-4o",
    messages: [
      { role: "system", content: systemInstruction },
      { role: "user", content: userPrompt }
    ]
  };

  if (typeof params.temperature === 'number') {
    body.temperature = params.temperature;
  }
  if (typeof params.maxOutputTokens === 'number') {
    body.max_tokens = params.maxOutputTokens;
  }
  
  if (jsonMode) {
    body.response_format = { type: "json_object" };
  }
  
  try {
    const response = await fetch(fullUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`HTTP error status ${response.status}: ${errorText || response.statusText}`);
    }
    
    const data: any = await response.json();
    if (!data) {
      throw new Error("Received empty response from Custom OpenAI.");
    }
    
    let text = "";
    if (data.choices && data.choices[0]) {
      if (data.choices[0].message && typeof data.choices[0].message.content === "string") {
        text = data.choices[0].message.content;
      } else if (typeof data.choices[0].text === "string") {
        text = data.choices[0].text;
      }
    } else if (typeof data.output_text === "string") {
      text = data.output_text;
    } else if (typeof data.text === "string") {
      text = data.text;
    } else {
      throw new Error("Could not extract generation content from custom OpenAI response structure.");
    }
    
    return text;
  } catch (err: any) {
    let msg = err.message || String(err);
    if (err.cause) {
      const causeDetails = err.cause.message || err.cause.code || String(err.cause);
      msg += ` (Cause: ${causeDetails})`;
    }
    if (apiKey) {
      const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const apiKeyRegex = new RegExp(escapeRegExp(apiKey), "g");
      msg = msg.replace(apiKeyRegex, "[REDACTED]");
    }
    throw new Error(msg);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  const PORT = 3000;

  // Initialize dynamic Gemini Client with custom or fallback API credentials
  function getGeminiClient(settings: any): { ai: GoogleGenAI | null; error: string | null } {
    const apiKey = (settings?.browserApiKey && settings.browserApiKey.trim())
      ? settings.browserApiKey.trim()
      : process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.trim() === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
      return {
        ai: null,
        error: "Gemini API key is not configured. Please go to Settings (gear icon) in the top-right and add your custom Gemini API key, or define GEMINI_API_KEY inside the server-side environment."
      };
    }

    try {
      const gAI = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      return { ai: gAI, error: null };
    } catch (err: any) {
      return { ai: null, error: `Invalid API key registration logic: ${err.message}` };
    }
  }

  // Handle provider and connection level exceptions elegantly
  function handleProviderError(err: any): { status: number; message: string; type: string } {
    const msg = err.message || String(err);
    const lower = msg.toLowerCase();

    if (lower.includes("rate") || lower.includes("quota") || lower.includes("429") || lower.includes("resource_exhausted") || lower.includes("exhausted")) {
      return {
        status: 429,
        type: "RATE_LIMIT_EXCEEDED",
        message: "Gemini API Rate limit exceeded or personal model quota exhausted. Please try again after 60 seconds."
      };
    }

    if (lower.includes("key") || lower.includes("api_key") || lower.includes("invalid api key") || lower.includes("api key not valid") || lower.includes("unauthorized") || lower.includes("api-key")) {
      return {
        status: 401,
        type: "INVALID_API_KEY",
        message: "The provided Gemini API key is invalid or unauthorized. Please verify the key in your Settings panel and try again."
      };
    }

    if (lower.includes("timeout") || lower.includes("deadline") || lower.includes("aborted") || lower.includes("fetch failed") || lower.includes("connectivity") || lower.includes("etimedout") || lower.includes("econnreset")) {
      return {
        status: 504,
        type: "REQUEST_TIMEOUT",
        message: "The request to the Gemini API timed out or connection was aborted. This is typically due to heavy model load. Please try again."
      };
    }

    return {
      status: 500,
      type: "API_PROVIDER_FAILURE",
      message: `Gemini API connection error: ${msg}. If this happens frequently, try toggling 'Strict Schema JSON' off in the Settings panel.`
    };
  }

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mode: process.env.GEMINI_API_KEY ? "gemini" : "mock-only" });
  });

  // Test connection endpoint
  app.post("/api/test-connection", async (req, res) => {
    const { config, mode } = req.body;
    if (!config) {
      return res.status(400).json({ ok: false, error: "Configuration is missing." });
    }
    
    const startTime = Date.now();
    try {
      if (mode === 'gemini') {
        const { ai: activeClient, error: clientSetupError } = getGeminiClient({
          browserApiKey: config.browserApiKey
        });
        if (clientSetupError || !activeClient) {
          throw new Error(clientSetupError || "Failed to initialize Gemini client.");
        }
        const response = await activeClient.models.generateContent({
          model: config.model || "gemini-3.5-flash",
          contents: "Are you online? Respond with only 'OK'.",
        });
        const latencyMs = Date.now() - startTime;
        const responseText = response.text || "";
        return res.json({ ok: true, latencyMs, text: responseText.trim() });
      } else {
        const responseText = await callCustomOpenAI({
          systemInstruction: "You are a connectivity test agent. Respond only with the word 'OK'.",
          userPrompt: "Are you online?",
          config
        });
        const latencyMs = Date.now() - startTime;
        return res.json({ ok: true, latencyMs, text: responseText.trim() });
      }
    } catch (err: any) {
      console.error("Test connection failed:", err);
      let errMsg = err.message || String(err);
      if (config.apiKey && errMsg.includes(config.apiKey)) {
        errMsg = errMsg.split(config.apiKey).join("[REDACTED]");
      }
      if (config.browserApiKey && errMsg.includes(config.browserApiKey)) {
        errMsg = errMsg.split(config.browserApiKey).join("[REDACTED]");
      }
      return res.json({ ok: false, error: recursiveSanitize(errMsg) });
    }
  });

  // Creative Spark Catalyst endpoint
  app.post("/api/sparks", async (req, res) => {
    const { count, novelty, category, mood, mode, settings, refinementProfile, projectPack } = req.body;
    const sparkCount = typeof count === 'number' ? count : 3;
    const sparkNovelty = (novelty === 'practical' || novelty === 'unusual' || novelty === 'black-swan') ? novelty : 'practical';

    // 1. Mock mode routing
    if (mode === "mock") {
      try {
        const ideas = generateLocalSparks(sparkCount, sparkNovelty);
        return res.json({ ok: true, ideas });
      } catch (mockErr: any) {
        return res.status(500).json({ ok: false, error: "Failed to generate local mock spark ideas." });
      }
    }

    // 1b. Custom OpenAI Mode routing
    if (mode === "custom_openai") {
      try {
        const customConfig = settings?.customOpenAI;
        if (!customConfig) {
          throw new Error("Custom OpenAI configuration is missing from settings.");
        }
        
        let userPromptContent = `Generate exactly ${sparkCount} buildable software/feature ideas for vibe coding.
Novelty Tier requested: "${sparkNovelty}".
`;
        if (category) userPromptContent += `Target Category/Domain: "${category}".\n`;
        if (mood) userPromptContent += `Target Mood/Aesthetic: "${mood}".\n`;

        const recipeProfile = getProfileById(refinementProfile || "balanced");
        const packGuidance = compileProjectPackGuidance(projectPack);
        const sparksSystemInstruction = `You are a legendary startup incubator general partner and technology foresight researcher. Your task is to generate fresh app or feature ideas for vibe coding.
Avoid generic todo apps or obvious concepts. Create high-quality, fully buildable concepts.
For the requested novelty level ("practical", "unusual", "black-swan"), conform to these strict architectural criteria:
- Practical: Focus on high-utility personal utilities, local grow room tracking, offline-first personal tracking tools, or developer utilities.
- Unusual: Focus on niche tools, retro-inspired mechanics, world-building lore books, roleplay relationship nodes, or Web Audio oscillators.
- Black-Swan: Fuse 2-3 unrelated technical pillars, identify a catalyst problem, add an unconventional constraint (e.g. deliberate friction, zero-UI, hyper-local/analog, ephemeral, ambient, voice-first), and produce a buildable but paradigm-shifting MVP loop. Ensure catalystProblem, corePillars, and whyNow are fully populated.

### ACTIVE GENERATION STYLE / PROFILE DIRECTION (CRITICAL):
${recipeProfile.instructionBlock}
Ensure the generated sparks, prompts, contexts, and tags are heavily inspired and customized to match this profile's mindset.${packGuidance}

You must reason privately. Output valid JSON only, matching the requested schema. Generate NO other text.`;

        const textOutput = await callCustomOpenAI({
          systemInstruction: sparksSystemInstruction,
          userPrompt: userPromptContent,
          config: customConfig,
          temperature: typeof settings?.temperature === 'number' ? settings.temperature : undefined,
          maxOutputTokens: typeof settings?.maxOutputTokens === 'number' ? settings.maxOutputTokens : undefined
        });

        if (!textOutput.trim()) {
          throw new Error("Received empty response from Custom OpenAI.");
        }

        const { parsedJson, parseError } = extractJsonBlueprint(textOutput);
        if (parseError) {
          throw new Error(`Failed to parse JSON response: ${parseError}`);
        }

        if (parsedJson && Array.isArray(parsedJson.ideas)) {
          return res.json({ ok: true, ideas: parsedJson.ideas });
        }

        throw new Error("JSON structure did not contain expected sparks list.");
      } catch (customError: any) {
        console.error("Custom OpenAI Sparks Generation failed:", customError);
        const fallbackIdeas = generateLocalSparks(sparkCount, sparkNovelty);
        return res.json({
          ok: false,
          error: recursiveSanitize(customError.message),
          ideas: fallbackIdeas,
          fallback: true
        });
      }
    }

    // 2. Real Gemini Mode routing
    const { ai: activeClient, error: clientSetupError } = getGeminiClient(settings);
    if (clientSetupError || !activeClient) {
      // Fallback gracefully to local mock ideas
      const fallbackIdeas = generateLocalSparks(sparkCount, sparkNovelty);
      return res.json({
        ok: false,
        error: clientSetupError || "Gemini Client could not be constructed. Serving local pre-seeded mock ideas.",
        ideas: fallbackIdeas,
        fallback: true
      });
    }

    let userPromptContent = `Generate exactly ${sparkCount} buildable software/feature ideas for vibe coding.
Novelty Tier requested: "${sparkNovelty}".
`;
    if (category) userPromptContent += `Target Category/Domain: "${category}".\n`;
    if (mood) userPromptContent += `Target Mood/Aesthetic: "${mood}".\n`;

    const recipeProfile = getProfileById(refinementProfile || "balanced");
    const packGuidance = compileProjectPackGuidance(projectPack);
    const sparksSystemInstruction = `You are a legendary startup incubator general partner and technology foresight researcher. Your task is to generate fresh app or feature ideas for vibe coding.
Avoid generic todo apps or obvious concepts. Create high-quality, fully buildable concepts.
For the requested novelty level ("practical", "unusual", "black-swan"), conform to these strict architectural criteria:
- Practical: Focus on high-utility personal utilities, local grow room tracking, offline-first personal tracking tools, or developer utilities.
- Unusual: Focus on niche tools, retro-inspired mechanics, world-building lore books, roleplay relationship nodes, or Web Audio oscillators.
- Black-Swan: Fuse 2-3 unrelated technical pillars, identify a catalyst problem, add an unconventional constraint (e.g. deliberate friction, zero-UI, hyper-local/analog, ephemeral, ambient, voice-first), and produce a buildable but paradigm-shifting MVP loop. Ensure catalystProblem, corePillars, and whyNow are fully populated.

### ACTIVE GENERATION STYLE / PROFILE DIRECTION (CRITICAL):
${recipeProfile.instructionBlock}
Ensure the generated sparks, prompts, contexts, and tags are heavily inspired and customized to match this profile's mindset.${packGuidance}

You must reason privately. Output valid JSON only, matching the requested schema. Generate NO other text.`;

    const sparksSchema = {
      type: "OBJECT",
      required: ["ok", "ideas"],
      properties: {
        ok: { type: "BOOLEAN" },
        ideas: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            required: ["id", "title", "concept", "rawPrompt", "projectContext", "conversationHistory", "tags", "difficulty", "novelty"],
            properties: {
              id: { type: "STRING" },
              title: { type: "STRING" },
              concept: { type: "STRING" },
              rawPrompt: { type: "STRING" },
              projectContext: { type: "STRING" },
              conversationHistory: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  required: ["id", "role", "content"],
                  properties: {
                    id: { type: "STRING" },
                    role: { type: "STRING" },
                    content: { type: "STRING" }
                  }
                }
              },
              tags: { type: "ARRAY", items: { type: "STRING" } },
              difficulty: { type: "STRING" },
              novelty: { type: "STRING" },
              catalystProblem: { type: "STRING" },
              corePillars: { type: "ARRAY", items: { type: "STRING" } },
              whyNow: { type: "STRING" }
            }
          }
        }
      }
    };

    try {
      const chosenModel = settings?.model || "gemini-3.5-flash";
      const response = await activeClient.models.generateContent({
        model: chosenModel,
        contents: userPromptContent,
        config: {
          systemInstruction: sparksSystemInstruction,
          responseMimeType: "application/json",
          responseSchema: sparksSchema,
          temperature: typeof settings?.temperature === 'number' ? settings.temperature : 0.7,
        }
      });

      const textOutput = response.text || "";
      if (!textOutput.trim()) {
        throw new Error("Received empty response from the Gemini model.");
      }

      const parsed = JSON.parse(textOutput);
      if (parsed && Array.isArray(parsed.ideas)) {
        return res.json({ ok: true, ideas: parsed.ideas });
      }

      throw new Error("JSON structure did not contain expected sparks list.");

    } catch (geminiError: any) {
      console.error("Gemini Sparks Generation failed:", geminiError);
      const classified = handleProviderError(geminiError);
      const fallbackIdeas = generateLocalSparks(sparkCount, sparkNovelty);
      return res.json({
        ok: false,
        error: recursiveSanitize(classified.message),
        ideas: fallbackIdeas,
        fallback: true
      });
    }
  });

  // Iterative Project Ideas Mode endpoint
  app.post("/api/project-ideas", async (req, res) => {
    try {
      const { projectName, repoUrl, projectContext, uploadedContextText, direction, mode, settings, refinementProfile, projectPack } = req.body;

      // 1. Mock Mode Generator Fallback
      if (mode === "mock") {
        try {
          const profile = refinementProfile || "balanced";
          const mockResponse = {
            ok: true,
            projectName: projectName || "My Copied Application",
            repoUrl: repoUrl || "",
            project_summary: `A React + TypeScript application focused on "${projectName || "Developer Productivity"}". Focus profile: ${profile.toUpperCase()}. It uses modern grid systems, modular hooks, and custom dark HSL aesthetics.`,
            detected_app_type: `React Single Page Application (Profile: ${profile.replace(/_/g, ' ')})`,
            known_context_used: ["README.md", "package.json", "Uploaded Notes"],
            assumptions: [
              "Application utilizes LocalStorage or SessionStorage for state caching between reloads.",
              "TailwindCSS or vanilla HSL design systems are used for presentation styling."
            ],
            strengths: [
              "Clean separation of concerns with custom hooks and structured components.",
              "Strong focus on responsive grid designs and premium dark themes."
            ],
            risks_or_gaps: [
              "Lack of detailed client-side data validation may lead to runtime rendering exceptions.",
              "Secrets are saved in history logs without adequate security encryption or redactors."
            ],
            suggested_improvements: [
              {
                id: "imp_1",
                title: "Implement Strict Client-Side Input Validation",
                summary: "Integrate a schema validation loop or custom type checks to block malformed inputs before processing.",
                why_it_matters: "Prevents runtime rendering crashes and ensures UI consistency across all viewport densities.",
                impact: "high",
                effort: "low",
                risk: "low",
                category: "bugfix",
                phase_prompt: `Review and refactor the input handlers in \`src/components/InputPanel.tsx\` to implement strict string bounds validation. Add user alert modals if validation fails. Do NOT adjust server code in this step.`,
                acceptance_criteria: [
                  "Empty inputs are blocked with immediate visual feedback.",
                  "Custom length limits are enforced.",
                  "Linter check builds successfully."
                ]
              },
              {
                id: "imp_2",
                title: "Cohesive Amber Glassmorphism Layout Refinement",
                summary: "Audit layouts to replace plain gray backdrops with translucent backdrop-blurs and golden shadows.",
                why_it_matters: "Elevates visual appeal and user confidence, matching cohesive gold-accent theme specifications.",
                impact: "medium",
                effort: "low",
                risk: "low",
                category: "ux",
                phase_prompt: `Upgrade \`src/index.css\` to define custom HSL amber glassmorphism variables. Apply \`backdrop-filter: blur(8px)\` and golden amber glow shadows to cards in \`src/components/\`.`,
                acceptance_criteria: [
                  "Visual review confirms glassmorphic panels.",
                  "Hover states trigger subtle micro-animations.",
                  "WCAG AA contrast ratios are preserved."
                ]
              },
              {
                id: "imp_3",
                title: "Security Redactor for History Logs",
                summary: "Add a recursive log redactor to scrub sensitive user input API keys prior to saving to history lists.",
                why_it_matters: "Maintains local data safety and prevents credential leaks in shared environments.",
                impact: "high",
                effort: "medium",
                risk: "low",
                category: "security",
                phase_prompt: `Create a new helper \`src/lib/sanitize.ts\` to redact sensitive credentials from local workflow logs. Ensure keys are replaced with \`[REDACTED]\` prior to saving.`,
                acceptance_criteria: [
                  "API keys are redacted in saved logs.",
                  "Original inputs are preserved in active workspace memory.",
                  "All tests pass successfully."
                ]
              }
            ],
            recommended_next_phase: "Refactoring the foundational UI forms and layout variables to apply cohesive glassmorphism visual rules (Stage 1)."
          };

          return res.json(mockResponse);
        } catch (mockErr: any) {
          return res.status(500).json({ ok: false, error: mockErr.message || "Failed generating mock review plan." });
        }
      }

      // 1b. Custom OpenAI Mode Router
      if (mode === "custom_openai") {
        try {
          const customConfig = settings?.customOpenAI;
          if (!customConfig) {
            throw new Error("Custom OpenAI configuration is missing from settings.");
          }

          let combinedContextText = uploadedContextText || "";
          let extractedFilesList: string[] = [];

          if (repoUrl && repoUrl.trim()) {
            try {
              const gitExtraction = await extractGitHubContext(repoUrl);
              if (gitExtraction.text) {
                combinedContextText += gitExtraction.text;
              }
              extractedFilesList = gitExtraction.files;
            } catch (err) {
              console.error("Lightweight GitHub context extraction failed silently:", err);
            }
          }

          let userPrompt = `Perform a Code Review & Optimization Plan review for the following project:\n\n`;
          userPrompt += `### PROJECT NAME: "${projectName || "Untitled Project"}"\n`;
          if (repoUrl) userPrompt += `### GITHUB REPOSITORY: ${repoUrl}\n`;
          userPrompt += `### CURRENT GOAL / TARGET DIRECTION: "${direction || "General optimization and bug risk audit"}"\n\n`;
          userPrompt += `### PROJECT CONTEXT & ARCHITECTURE NOTES:\n${projectContext || "None provided"}\n\n`;
          if (combinedContextText && combinedContextText.trim()) {
            userPrompt += `### EXTRACTED FILES & REFERENCE CODE:\n${combinedContextText}\n\n`;
          }
          userPrompt += `Separate facts from assumptions. Highlight strengths and risks/gaps. Propose 3 to 5 highly specific Suggested Improvements matching the requested JSON format.`;

          const recipeProfile = getProfileById(refinementProfile || "balanced");
          const packGuidance = compileProjectPackGuidance(projectPack);
          const systemInstruction = `You are a Principal Product Engineer and Code Review Specialist.
Your task is to analyze the provided project metadata (name, code context, goals, and direction) using the Code Review & Optimization Plan framework.
Identify the application type, summarize the project, and outline concrete strengths, key assumptions, and risks/gaps.
Recommend 3 to 5 atomic, highly focused, and implementable improvements.
Conform to these rules:
1. Separate known facts from assumptions.
2. Recommend small, atomic milestones rather than broad code overhauls.
3. For each improvement, provide a copy-paste-ready "phase_prompt" that directs a secondary coding agent (like Antigravity) to implement that specific step with precise instructions and target file scopes.
4. Reason privately and step-by-step. Do not output any thinking or brain-storming tags (like <thinking>, <analysis>, or hidden CoT tags).
5. Your output must be valid JSON only, conforming exactly to the requested schema. Do not prefix or suffix with any other comments.

### ACTIVE REFINEMENT STYLE (CRITICAL DIRECTION):
${recipeProfile.instructionBlock}
Ensure the strengths, risks, suggestions, phase prompts, and next phase plans generated align closely with this style's priorities.${packGuidance}`;

          const textOutput = await callCustomOpenAI({
            systemInstruction,
            userPrompt,
            config: customConfig,
            temperature: typeof settings?.temperature === 'number' ? settings.temperature : undefined,
            maxOutputTokens: typeof settings?.maxOutputTokens === 'number' ? settings.maxOutputTokens : undefined
          });

          if (!textOutput.trim()) {
            throw new Error("Received an empty response from Custom OpenAI during code review.");
          }

          const { parsedJson, parseError } = extractJsonBlueprint(textOutput);
          if (parseError || !parsedJson) {
            throw new Error(parseError || "Failed to parse model output as JSON.");
          }

          if (Array.isArray(parsedJson.known_context_used)) {
            parsedJson.known_context_used = Array.from(new Set([...parsedJson.known_context_used, ...extractedFilesList]));
          }

          parsedJson.ok = true;
          return res.json(parsedJson);
        } catch (customError: any) {
          console.error("Custom OpenAI Code Review failed:", customError);
          return res.status(500).json({
            ok: false,
            error: recursiveSanitize(customError.message)
          });
        }
      }

      // 2. Real Gemini Mode Router
      const { ai: activeClient, error: clientSetupError } = getGeminiClient(settings);
      if (clientSetupError || !activeClient) {
        return res.status(401).json({
          ok: false,
          error: clientSetupError || "Gemini Client could not be constructed."
        });
      }

      // Attempt lightweight GitHub Raw context extraction
      let combinedContextText = uploadedContextText || "";
      let extractedFilesList: string[] = [];

      if (repoUrl && repoUrl.trim()) {
        try {
          const gitExtraction = await extractGitHubContext(repoUrl);
          if (gitExtraction.text) {
            combinedContextText += gitExtraction.text;
          }
          extractedFilesList = gitExtraction.files;
        } catch (err) {
          console.error("Lightweight GitHub context extraction failed silently:", err);
        }
      }

      // Assemble human review prompt contents
      let userPrompt = `Perform a Code Review & Optimization Plan review for the following project:\n\n`;
      userPrompt += `### PROJECT NAME: "${projectName || "Untitled Project"}"\n`;
      if (repoUrl) userPrompt += `### GITHUB REPOSITORY: ${repoUrl}\n`;
      userPrompt += `### CURRENT GOAL / TARGET DIRECTION: "${direction || "General optimization and bug risk audit"}"\n\n`;
      userPrompt += `### PROJECT CONTEXT & ARCHITECTURE NOTES:\n${projectContext || "None provided"}\n\n`;
      if (combinedContextText && combinedContextText.trim()) {
        userPrompt += `### EXTRACTED FILES & REFERENCE CODE:\n${combinedContextText}\n\n`;
      }
      userPrompt += `Separate facts from assumptions. Highlight strengths and risks/gaps. Propose 3 to 5 highly specific Suggested Improvements matching the requested JSON format.`;

      const projectIdeasSchema = {
        type: "OBJECT",
        required: ["ok", "project_summary", "detected_app_type", "known_context_used", "assumptions", "strengths", "risks_or_gaps", "suggested_improvements", "recommended_next_phase"],
        properties: {
          ok: { type: "BOOLEAN" },
          project_summary: { type: "STRING" },
          detected_app_type: { type: "STRING" },
          known_context_used: { type: "ARRAY", items: { type: "STRING" } },
          assumptions: { type: "ARRAY", items: { type: "STRING" } },
          strengths: { type: "ARRAY", items: { type: "STRING" } },
          risks_or_gaps: { type: "ARRAY", items: { type: "STRING" } },
          suggested_improvements: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              required: ["id", "title", "summary", "why_it_matters", "impact", "effort", "risk", "category", "phase_prompt", "acceptance_criteria"],
              properties: {
                id: { type: "STRING" },
                title: { type: "STRING" },
                summary: { type: "STRING" },
                why_it_matters: { type: "STRING" },
                impact: { type: "STRING" },
                effort: { type: "STRING" },
                risk: { type: "STRING" },
                category: { type: "STRING" },
                phase_prompt: { type: "STRING" },
                acceptance_criteria: { type: "ARRAY", items: { type: "STRING" } }
              }
            }
          },
          recommended_next_phase: { type: "STRING" }
        }
      };

      const recipeProfile = getProfileById(refinementProfile || "balanced");
      const packGuidance = compileProjectPackGuidance(projectPack);
      const systemInstruction = `You are a Principal Product Engineer and Code Review Specialist.
Your task is to analyze the provided project metadata (name, code context, goals, and direction) using the Code Review & Optimization Plan framework.
Identify the application type, summarize the project, and outline concrete strengths, key assumptions, and risks/gaps.
Recommend 3 to 5 atomic, highly focused, and implementable improvements.
Conform to these rules:
1. Separate known facts from assumptions.
2. Recommend small, atomic milestones rather than broad code overhauls.
3. For each improvement, provide a copy-paste-ready "phase_prompt" that directs a secondary coding agent (like Antigravity) to implement that specific step with precise instructions and target file scopes.
4. Reason privately and step-by-step. Do not output any thinking or brain-storming tags (like <thinking>, <analysis>, or hidden CoT tags).
5. Your output must be valid JSON only, conforming exactly to the requested schema. Do not prefix or suffix with any other comments.

### ACTIVE REFINEMENT STYLE (CRITICAL DIRECTION):
${recipeProfile.instructionBlock}
Ensure the strengths, risks, suggestions, phase prompts, and next phase plans generated align closely with this style's priorities.${packGuidance}`;

      try {
        const chosenModel = settings?.model || "gemini-3.5-flash";
        const response = await activeClient.models.generateContent({
          model: chosenModel,
          contents: userPrompt,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: projectIdeasSchema,
            temperature: typeof settings?.temperature === 'number' ? settings.temperature : 0.2,
          }
        });

        const textOutput = response.text || "";
        if (!textOutput.trim()) {
          throw new Error("Received an empty response from Gemini during code review.");
        }

        const parsed = JSON.parse(textOutput);
        
        // Merge extracted files list into known context used
        if (Array.isArray(parsed.known_context_used)) {
          parsed.known_context_used = Array.from(new Set([...parsed.known_context_used, ...extractedFilesList]));
        }

        return res.json(parsed);

      } catch (geminiError: any) {
        console.error("Gemini Code Review failed:", geminiError);
        const classified = handleProviderError(geminiError);
        return res.status(classified.status).json({
          ok: false,
          error: recursiveSanitize(classified.message)
        });
      }

    } catch (routeErr: any) {
      console.error("Endpoint execution error in /api/project-ideas:", routeErr);
      return res.status(500).json({ ok: false, error: "An unexpected system error occurred on the development server." });
    }
  });

  // Design Audit Mode endpoint
  app.post("/api/design-audit", async (req, res) => {
    try {
      const { projectName, uiDescription, currentIssues, targetDevice, stylePreference, designNotes, projectContext, mode, settings, refinementProfile, projectPack } = req.body;

      // 1. Mock Mode Generator Fallback
      if (mode === "mock") {
        try {
          const mockAudit = {
            ok: true,
            projectName: projectName || "My Application UI",
            title: `Design Audit: ${projectName || "My Application UI"}`,
            summary: `A systematic design principles assessment for "${projectName || "My Application"}". Focus profile: ${refinementProfile || "balanced"}. Evaluates visual hierarchy, layout spacing grids, component states, and accessibility focus lines.`,
            overall_score: 7.2,
            scores: {
              layout: 8,
              visual_hierarchy: 7,
              accessibility: 6,
              mobile_usability: 8,
              interaction_feedback: 6,
              performance_feel: 8,
              design_consistency: 7
            },
            strengths: [
              "Foundational UI structure is clean and separates controls from outputs effectively.",
              "Responsive grid design scales smoothly between single-column and dense dashboards."
            ],
            issues: [
              {
                id: "iss_1",
                severity: "high",
                category: "accessibility",
                problem: "Interactive elements lack outline focus rings; keyboard path indicator states are fully missing.",
                why_it_matters: "Violates WCAG AA requirements. Keyboard-only and assistive technology users cannot navigate or locate focus controls.",
                recommended_fix: "Define clear :focus-visible rules using our gold accent: \`outline: 2px solid hsl(38, 92%, 50%); outline-offset: 2px;\`"
              },
              {
                id: "iss_2",
                severity: "medium",
                category: "layout",
                problem: "Grid margins use ad-hoc pixel definitions instead of cohesive 8pt spacing tokens.",
                why_it_matters: "Causes design inconsistencies and layout shifts on varying monitor widths.",
                recommended_fix: "Standardize spacing variables to multiples of 8px (e.g. \`gap: 2rem; padding: 1.5rem;\` for container cards)."
              },
              {
                id: "iss_3",
                severity: "low",
                category: "motion",
                problem: "State transitions lack prefers-reduced-motion media query gates.",
                why_it_matters: "Animations may cause discomfort or vestibular issues for sensitive users.",
                recommended_fix: "Wrap custom CSS transitions in a prefers-reduced-motion media query to bypass animations when requested by OS."
              }
            ],
            quick_wins: [
              "Apply high-contrast gold focus rings to inputs and tabs.",
              "Disable layout transitions when prefers-reduced-motion is active."
            ],
            deeper_improvements: [
              "Establish tokenized HSL CSS variables for backgrounds, borders, and accents to guarantee consistency.",
              "Refactor component states (disabled, loading, error, empty) to render unified visual frames."
            ],
            implementation_prompt: `Review and refactor \`src/index.css\` and component files in \`src/components/\` to implement strict HSL focus-visible outlines (\`outline: 2px solid hsl(38, 92%, 50%)\` with 2px offset) and prefers-reduced-motion overrides. Do NOT modify backend code.`,
            targetDevice: targetDevice || "both",
            stylePreference: stylePreference || "Sleek Charcoal"
          };

          return res.json(mockAudit);
        } catch (mockErr: any) {
          return res.status(500).json({ ok: false, error: mockErr.message || "Failed generating mock design review." });
        }
      }

      // 1b. Custom OpenAI Mode Router
      if (mode === "custom_openai") {
        try {
          const customConfig = settings?.customOpenAI;
          if (!customConfig) {
            throw new Error("Custom OpenAI configuration is missing from settings.");
          }

          let userPrompt = `Perform a systematic Design Audit & Accessibility review for the following project:\n\n`;
          userPrompt += `### PROJECT NAME: "${projectName || "Untitled UI Project"}"\n`;
          userPrompt += `### TARGET DEVICE: "${targetDevice || "both"}"\n`;
          if (stylePreference) userPrompt += `### VISUAL STYLE PREFERENCE: "${stylePreference}"\n`;
          userPrompt += `### UI ARCHITECTURE DESCRIPTION:\n${uiDescription || "None provided"}\n\n`;
          if (currentIssues) userPrompt += `### CURRENT ISSUES & BOTTLENECKS:\n${currentIssues}\n\n`;
          if (designNotes) userPrompt += `### PASTED CSS & DESIGN SPECIFICATION NOTES:\n${designNotes}\n\n`;
          if (projectContext) userPrompt += `### EXTRA REFERENCE PROJECT CONTEXT:\n${projectContext}\n\n`;
          userPrompt += `Evaluate against simplicity, cohesive tokens, WCAG AA, responsive strategies, motion, and interaction feedback states. Return the requested JSON schema.`;

          const recipeProfile = getProfileById(refinementProfile || "balanced");
          const packGuidance = compileProjectPackGuidance(projectPack);
          const systemInstruction = `You are a Lead Design System Architect and UX Specialist.
Your task is to evaluate the user's UI layout description, current issues, target devices, visual preferences, and design context against these strict Design Principles:
- Simplicity through reduction
- Material honesty & Obsessive detail
- Coherent tokenized design language (HSL colors, type, 8pt spacing systems)
- Context-driven layout & Mobile-first structures
- Accessibility by default (WCAG AA contrast, keyboard paths, :focus-visible states, reduced-motion queries)
- Performance feel & Rapid feedback loops
- Cohesive interactive component states

Reason privately and step-by-step. Do not output any thinking or brainstorming tags (like <thinking>, <analysis>, or hidden CoT tags).
Your output must be valid JSON only, conforming exactly to the requested schema. Do not prefix or suffix with any other comments.

### ACTIVE REFINEMENT STYLE (CRITICAL DIRECTION):
${recipeProfile.instructionBlock}
Ensure the scores, strengths, issues, wins, and implementation prompts generated align closely with this style's priorities.${packGuidance}`;

          const textOutput = await callCustomOpenAI({
            systemInstruction,
            userPrompt,
            config: customConfig,
            temperature: typeof settings?.temperature === 'number' ? settings.temperature : undefined,
            maxOutputTokens: typeof settings?.maxOutputTokens === 'number' ? settings.maxOutputTokens : undefined
          });

          if (!textOutput.trim()) {
            throw new Error("Received an empty response from Custom OpenAI during design review.");
          }

          const { parsedJson, parseError } = extractJsonBlueprint(textOutput);
          if (parseError || !parsedJson) {
            throw new Error(parseError || "Failed to parse model output as JSON.");
          }

          parsedJson.targetDevice = targetDevice || "both";
          parsedJson.stylePreference = stylePreference || "Cohesive HSL Accent";

          parsedJson.ok = true;
          return res.json(parsedJson);
        } catch (customError: any) {
          console.error("Custom OpenAI Design Audit failed:", customError);
          return res.status(500).json({
            ok: false,
            error: recursiveSanitize(customError.message)
          });
        }
      }

      // 2. Real Gemini Mode Router
      const { ai: activeClient, error: clientSetupError } = getGeminiClient(settings);
      if (clientSetupError || !activeClient) {
        return res.status(401).json({
          ok: false,
          error: clientSetupError || "Gemini Client could not be constructed."
        });
      }

      // Assemble design review contents
      let userPrompt = `Perform a systematic Design Audit & Accessibility review for the following project:\n\n`;
      userPrompt += `### PROJECT NAME: "${projectName || "Untitled UI Project"}"\n`;
      userPrompt += `### TARGET DEVICE: "${targetDevice || "both"}"\n`;
      if (stylePreference) userPrompt += `### VISUAL STYLE PREFERENCE: "${stylePreference}"\n`;
      userPrompt += `### UI ARCHITECTURE DESCRIPTION:\n${uiDescription || "None provided"}\n\n`;
      if (currentIssues) userPrompt += `### CURRENT ISSUES & BOTTLENECKS:\n${currentIssues}\n\n`;
      if (designNotes) userPrompt += `### PASTED CSS & DESIGN SPECIFICATION NOTES:\n${designNotes}\n\n`;
      if (projectContext) userPrompt += `### EXTRA REFERENCE PROJECT CONTEXT:\n${projectContext}\n\n`;
      userPrompt += `Evaluate against simplicity, cohesive tokens, WCAG AA, responsive strategies, motion, and interaction feedback states. Return the requested JSON schema.`;

      const designAuditSchema = {
        type: "OBJECT",
        required: ["ok", "title", "summary", "overall_score", "scores", "strengths", "issues", "quick_wins", "deeper_improvements", "implementation_prompt"],
        properties: {
          ok: { type: "BOOLEAN" },
          title: { type: "STRING" },
          summary: { type: "STRING" },
          overall_score: { type: "NUMBER" },
          scores: {
            type: "OBJECT",
            required: ["layout", "visual_hierarchy", "accessibility", "mobile_usability", "interaction_feedback", "performance_feel", "design_consistency"],
            properties: {
              layout: { type: "NUMBER" },
              visual_hierarchy: { type: "NUMBER" },
              accessibility: { type: "NUMBER" },
              mobile_usability: { type: "NUMBER" },
              interaction_feedback: { type: "NUMBER" },
              performance_feel: { type: "NUMBER" },
              design_consistency: { type: "NUMBER" }
            }
          },
          strengths: { type: "ARRAY", items: { type: "STRING" } },
          issues: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              required: ["id", "severity", "category", "problem", "why_it_matters", "recommended_fix"],
              properties: {
                id: { type: "STRING" },
                severity: { type: "STRING" },
                category: { type: "STRING" },
                problem: { type: "STRING" },
                why_it_matters: { type: "STRING" },
                recommended_fix: { type: "STRING" }
              }
            }
          },
          quick_wins: { type: "ARRAY", items: { type: "STRING" } },
          deeper_improvements: { type: "ARRAY", items: { type: "STRING" } },
          implementation_prompt: { type: "STRING" }
        }
      };

      const recipeProfile = getProfileById(refinementProfile || "balanced");
      const packGuidance = compileProjectPackGuidance(projectPack);
      const systemInstruction = `You are a Lead Design System Architect and UX Specialist.
Your task is to evaluate the user's UI layout description, current issues, target devices, visual preferences, and design context against these strict Design Principles:
- Simplicity through reduction
- Material honesty & Obsessive detail
- Coherent tokenized design language (HSL colors, type, 8pt spacing systems)
- Context-driven layout & Mobile-first structures
- Accessibility by default (WCAG AA contrast, keyboard paths, :focus-visible states, reduced-motion queries)
- Performance feel & Rapid feedback loops
- Cohesive interactive component states

Reason privately and step-by-step. Do not output any thinking or brainstorming tags (like <thinking>, <analysis>, or hidden CoT tags).
Your output must be valid JSON only, conforming exactly to the requested schema. Do not prefix or suffix with any other comments.

### ACTIVE REFINEMENT STYLE (CRITICAL DIRECTION):
${recipeProfile.instructionBlock}
Ensure the scores, strengths, issues, wins, and implementation prompts generated align closely with this style's priorities.${packGuidance}`;

      try {
        const chosenModel = settings?.model || "gemini-3.5-flash";
        const response = await activeClient.models.generateContent({
          model: chosenModel,
          contents: userPrompt,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: designAuditSchema,
            temperature: typeof settings?.temperature === 'number' ? settings.temperature : 0.2,
          }
        });

        const textOutput = response.text || "";
        if (!textOutput.trim()) {
          throw new Error("Received an empty response from Gemini during design review.");
        }

        const parsed = JSON.parse(textOutput);
        parsed.targetDevice = targetDevice || "both";
        parsed.stylePreference = stylePreference || "Cohesive HSL Accent";

        return res.json(parsed);

      } catch (geminiError: any) {
        console.error("Gemini Design Audit failed:", geminiError);
        const classified = handleProviderError(geminiError);
        return res.status(classified.status).json({
          ok: false,
          error: recursiveSanitize(classified.message)
        });
      }

    } catch (routeErr: any) {
      console.error("Endpoint execution error in /api/design-audit:", routeErr);
      return res.status(500).json({ ok: false, error: "An unexpected system error occurred on the development server." });
    }
  });

  // Main prompt refinement endpoint
  app.post("/api/refine", async (req, res) => {
    try {
      const { rawPrompt, projectContext, conversationHistory, mode, settings, recipeId, refinementProfile, projectPack } = req.body;

      if (!rawPrompt || typeof rawPrompt !== "string" || !rawPrompt.trim()) {
        return res.status(400).json({ ok: false, error: "The rawPrompt parameter is required and must be a non-empty string." });
      }

      // Resolve the correct prompt recipe
      const activeRecipeId = (recipeId && isValidRecipeId(recipeId)) ? recipeId : "blueprint";
      const recipe = getRecipeById(activeRecipeId);

      // 1. Mock mode logic
      if (mode === "mock") {
        try {
          const mockResult = recipe.mockGenerator(rawPrompt, projectContext, refinementProfile, projectPack);
          if (activeRecipeId === "blueprint") {
            return res.json({ ok: true, blueprint: mockResult });
          } else {
            return res.json(mockResult);
          }
        } catch (mockErr: any) {
          return res.status(500).json({ ok: false, error: mockErr.message || "Failed generating mock recipe outcome." });
        }
      }

      // 1b. Custom OpenAI Mode logic
      if (mode === "custom_openai") {
        try {
          const customConfig = settings?.customOpenAI;
          if (!customConfig) {
            throw new Error("Custom OpenAI configuration is missing from settings.");
          }

          const userPromptContent = recipe.userPayloadBuilder(rawPrompt, projectContext, conversationHistory);
          const recipeProfile = getProfileById(refinementProfile || "balanced");
          const packGuidance = compileProjectPackGuidance(projectPack);
          const systemInstruction = `${recipe.systemInstruction}\n\n### ACTIVE REFINEMENT STYLE (CRITICAL DIRECTION):\n${recipeProfile.instructionBlock}\nEnsure all specifications, lists, prompts, and notes generated align closely with this style.${packGuidance}`;

          const textOutput = await callCustomOpenAI({
            systemInstruction,
            userPrompt: userPromptContent,
            config: customConfig,
            temperature: typeof settings?.temperature === 'number' ? settings.temperature : undefined,
            maxOutputTokens: typeof settings?.maxOutputTokens === 'number' ? settings.maxOutputTokens : undefined
          });

          if (!textOutput.trim()) {
            throw new Error("Received an empty response from the Custom OpenAI model.");
          }

          // For non-blueprint modes, bypass JSON parsing and validation
          if (activeRecipeId !== "blueprint") {
            return res.json({
              ok: true,
              recipeId: activeRecipeId,
              outputKind: recipe.outputKind,
              title: `${recipe.label} Output`,
              content: textOutput,
              structuredData: {}
            });
          }

          // Parse JSON output safely using the robust blueprint extraction helper (exclusive to blueprint mode)
          const { parsedJson, parseError } = extractJsonBlueprint(textOutput);

          if (parseError || !parsedJson) {
            return res.status(500).json({
              ok: false,
              error: parseError || "Failed to parse model output as JSON.",
              rawOutput: textOutput
            });
          }

          // Heal the parsed blueprint and validate the healed version
          const healed = healBlueprint(parsedJson);
          const schemaIssues = validateBlueprint(healed);
          if (schemaIssues) {
            return res.status(422).json({
              ok: false,
              error: `Schema Validation Mismatch: ${schemaIssues.join(" | ")}`,
              rawOutput: textOutput
            });
          }

          // Successfully parsed, healed, and validated!
          return res.json({
            ok: true,
            blueprint: healed
          });

        } catch (customError: any) {
          console.error("Custom OpenAI invocation failed:", customError);
          const isDebug = settings?.debugMode === true;
          return res.status(500).json({
            ok: false,
            error: recursiveSanitize(customError.message),
            rawOutput: isDebug ? recursiveSanitize(customError.stack || String(customError)) : undefined
          });
        }
      }

      // 2. Real Gemini Mode logic
      const { ai: activeClient, error: clientSetupError } = getGeminiClient(settings);
      if (clientSetupError || !activeClient) {
        return res.status(401).json({
          ok: false,
          error: clientSetupError || "Gemini Client could not be constructed."
        });
      }

      // Compile content prompt payload using the resolved recipe builder
      const userPromptContent = recipe.userPayloadBuilder(rawPrompt, projectContext, conversationHistory);

      try {
        const recipeProfile = getProfileById(refinementProfile || "balanced");
        const packGuidance = compileProjectPackGuidance(projectPack);
        const systemInstruction = `${recipe.systemInstruction}\n\n### ACTIVE REFINEMENT STYLE (CRITICAL DIRECTION):\n${recipeProfile.instructionBlock}\nEnsure all specifications, lists, prompts, and notes generated align closely with this style.${packGuidance}`;

        const config: any = {
          systemInstruction,
          temperature: typeof settings?.temperature === 'number' ? settings.temperature : 0.2,
        };

        if (settings?.maxOutputTokens) {
          config.maxOutputTokens = Number(settings.maxOutputTokens);
        } else {
          config.maxOutputTokens = 8192; // Generous default limit
        }

        // Apply strict schema mode only for standard blueprint mode
        if (activeRecipeId === "blueprint") {
          config.responseMimeType = "application/json";
          if (settings?.strictMode !== false) {
            config.responseSchema = {
              type: "OBJECT",
              required: BLUEPRINT_OUTPUT_CONTRACT.required,
              properties: BLUEPRINT_OUTPUT_CONTRACT.properties,
            };
          }
        } else {
          config.responseMimeType = "text/plain";
        }

        const chosenModel = settings?.model || "gemini-3.5-flash";

        const response = await activeClient.models.generateContent({
          model: chosenModel,
          contents: userPromptContent,
          config: config,
        });

        const textOutput = response.text || "";
        if (!textOutput.trim()) {
          throw new Error("Received an empty response from the Gemini model.");
        }

        // For non-blueprint modes, bypass JSON parsing and validation
        if (activeRecipeId !== "blueprint") {
          return res.json({
            ok: true,
            recipeId: activeRecipeId,
            outputKind: recipe.outputKind,
            title: `${recipe.label} Output`,
            content: textOutput,
            structuredData: {}
          });
        }

        // Parse JSON output safely using the robust blueprint extraction helper (exclusive to blueprint mode)
        const { parsedJson, parseError } = extractJsonBlueprint(textOutput);

        if (parseError || !parsedJson) {
          return res.status(500).json({
            ok: false,
            error: parseError || "Failed to parse model output as JSON.",
            rawOutput: textOutput
          });
        }

        // Heal the parsed blueprint and validate the healed version
        const healed = healBlueprint(parsedJson);
        const schemaIssues = validateBlueprint(healed);
        if (schemaIssues) {
          return res.status(422).json({
            ok: false,
            error: `Schema Validation Mismatch: ${schemaIssues.join(" | ")}`,
            rawOutput: textOutput
          });
        }

        // Successfully parsed, healed, and validated!
        return res.json({
          ok: true,
          blueprint: healed
        });

      } catch (geminiError: any) {
        console.error("Gemini invocation failed:", geminiError);
        const isDebug = settings?.debugMode === true;
        const classified = handleProviderError(geminiError);
        return res.status(classified.status).json({
          ok: false,
          error: recursiveSanitize(classified.message),
          type: classified.type,
          rawOutput: isDebug ? recursiveSanitize(geminiError.stack || String(geminiError)) : undefined
        });
      }

    } catch (routeError: any) {
      console.error("Endpoint execution error in POST /api/refine:", routeError);
      const isDebug = req.body?.settings?.debugMode === true;
      return res.status(500).json({
        ok: false,
        error: "An unexpected system error occurred on the development server.",
        rawOutput: isDebug ? recursiveSanitize(routeError.stack || String(routeError)) : undefined
      });
    }
  });

  // Assumption refinement loop endpoint
  app.post("/api/refine-loop", async (req, res) => {
    try {
      const {
        originalRawPrompt,
        originalProjectContext,
        originalConversationHistory,
        currentBlueprint,
        keptAssumptions,
        rejectedAssumptions,
        mode,
        settings,
        refinementProfile,
        projectPack
      } = req.body;

      if (!currentBlueprint || typeof currentBlueprint !== "object") {
        return res.status(400).json({ ok: false, error: "The parameter currentBlueprint is required and must be an object." });
      }

      // 1. Mock mode logic
      if (mode === "mock") {
        try {
          const blueprint = JSON.parse(JSON.stringify(currentBlueprint));
          const rejectedIds = (rejectedAssumptions || []).map((x: any) => x.id);
          
          if (blueprint.problem_clarification && Array.isArray(blueprint.problem_clarification.assumptions)) {
            // Keep unchanged assumptions
            blueprint.problem_clarification.assumptions = blueprint.problem_clarification.assumptions.filter(
              (ass: any) => !rejectedIds.includes(ass.id)
            );
            // Append corrections as new assumptions
            (rejectedAssumptions || []).forEach((rej: any, idx: number) => {
              if (rej.correction && rej.correction.trim()) {
                blueprint.problem_clarification.assumptions.push({
                  id: `A_CORRECTED_${idx}_${Date.now().toString().slice(-4)}`,
                  text: `Corrected: ${rej.correction}`,
                  confidence: "high",
                  source: "explicit"
                });
              }
            });
          }

          // Modify details slightly to prove refinement took place
          blueprint.title = blueprint.title.includes(" - Refined") ? blueprint.title : `${blueprint.title} - Refined`;
          blueprint.summary = `${blueprint.summary} (Refinement cycle successfully processed).`;
          
          if (blueprint.developer_notes && Array.isArray(blueprint.developer_notes)) {
            blueprint.developer_notes.push(`Refined on client request: Removed ${rejectedIds.length} rejected assumption(s).`);
          }

          // Update the final prompt
          const correctionsText = (rejectedAssumptions || [])
            .map((x: any) => x.correction ? `• ${x.text} -> ${x.correction}` : `• Removed: ${x.text}`)
            .join("\n");
          
          if (correctionsText) {
            blueprint.final_prompt = `${blueprint.final_prompt}\n\n### REFINEMENT CYCLES:\nThe following assumptions were adjusted during review:\n${correctionsText}\n`;
          }

          return res.json({ ok: true, blueprint });
        } catch (mockErr: any) {
          return res.status(500).json({ ok: false, error: mockErr.message || "Failed generating mock refined blueprint." });
        }
      }

      // 1b. Custom OpenAI Mode logic
      if (mode === "custom_openai") {
        try {
          const customConfig = settings?.customOpenAI;
          if (!customConfig) {
            throw new Error("Custom OpenAI configuration is missing from settings.");
          }

          let userPromptContent = `You are revising an existing prompt blueprint based on user reviews of assumptions.\n\n`;
          userPromptContent += `### ORIGINAL RAW PROMPT:\n"${originalRawPrompt || ""}"\n\n`;

          if (originalProjectContext && originalProjectContext.trim()) {
            userPromptContent += `### EXTRA ORIGINAL PROJECT CONTEXT:\n"${originalProjectContext}"\n\n`;
          }

          if (originalConversationHistory && Array.isArray(originalConversationHistory) && originalConversationHistory.length > 0) {
            userPromptContent += `### CONVERSATION HISTORY:\n`;
            originalConversationHistory.forEach((message: any) => {
              const role = message.role === "assistant" ? "Assistant" : "User";
              userPromptContent += `[${role}]: ${message.content}\n`;
            });
            userPromptContent += `\n`;
          }

          userPromptContent += `### CURRENT BLUEPRINT:\n${JSON.stringify(currentBlueprint, null, 2)}\n\n`;

          userPromptContent += `### REVISION INSTRUCTIONS:\n`;
          userPromptContent += `Revise the existing blueprint instead of starting from scratch. Preserve valid unchanged sections. Remove rejected assumptions. Integrate corrected assumptions. Update requirements, architecture, UX, edge cases, developer notes, and final_prompt as needed. Return the same strict JSON blueprint schema only.\n\n`;

          userPromptContent += `### KEPT ASSUMPTIONS:\n`;
          if (keptAssumptions && Array.isArray(keptAssumptions) && keptAssumptions.length > 0) {
            keptAssumptions.forEach((ass: any) => {
              userPromptContent += `- [Kept] ID: ${ass.id} - ${ass.text}\n`;
            });
          } else {
            userPromptContent += `(None specified)\n`;
          }
          userPromptContent += `\n`;

          userPromptContent += `### REJECTED & CORRECTED ASSUMPTIONS:\n`;
          if (rejectedAssumptions && Array.isArray(rejectedAssumptions) && rejectedAssumptions.length > 0) {
            rejectedAssumptions.forEach((ass: any) => {
              userPromptContent += `- [Rejected] ID: ${ass.id} - "${ass.text}"\n`;
              if (ass.correction && ass.correction.trim()) {
                userPromptContent += `  Correction: "${ass.correction}"\n`;
              }
            });
          } else {
            userPromptContent += `(None specified)\n`;
          }
          userPromptContent += `\n`;

          userPromptContent += `Structure your output exactly matching the described schema version '1.0'. Generate NO other text.`;

          const recipeProfile = getProfileById(refinementProfile || "balanced");
          const packGuidance = compileProjectPackGuidance(projectPack);
          const systemInstruction = `${ENHANCER_SYSTEM_PROMPT}\n\n### ACTIVE REFINEMENT STYLE (CRITICAL DIRECTION):\n${recipeProfile.instructionBlock}\nEnsure all revised specifications, lists, prompts, and notes generated align closely with this style.${packGuidance}`;

          const textOutput = await callCustomOpenAI({
            systemInstruction,
            userPrompt: userPromptContent,
            config: customConfig,
            temperature: typeof settings?.temperature === 'number' ? settings.temperature : undefined,
            maxOutputTokens: typeof settings?.maxOutputTokens === 'number' ? settings.maxOutputTokens : undefined
          });

          if (!textOutput.trim()) {
            throw new Error("Received an empty response from Custom OpenAI during refinement.");
          }

          const { parsedJson, parseError } = extractJsonBlueprint(textOutput);

          if (parseError || !parsedJson) {
            return res.status(500).json({
              ok: false,
              error: parseError || "Failed to parse model output as JSON.",
              rawOutput: textOutput
            });
          }

          // Heal the parsed blueprint and validate the healed version
          const healed = healBlueprint(parsedJson);
          const schemaIssues = validateBlueprint(healed);
          if (schemaIssues) {
            return res.status(422).json({
              ok: false,
              error: `Schema Validation Mismatch after refinement: ${schemaIssues.join(" | ")}`,
              rawOutput: textOutput
            });
          }

          return res.json({
            ok: true,
            blueprint: healed
          });

        } catch (customError: any) {
          console.error("Custom OpenAI refinement failed:", customError);
          const isDebug = settings?.debugMode === true;
          return res.status(500).json({
            ok: false,
            error: recursiveSanitize(customError.message),
            rawOutput: isDebug ? recursiveSanitize(customError.stack || String(customError)) : undefined
          });
        }
      }

      // 2. Real Gemini Mode logic
      const { ai: activeClient, error: clientSetupError } = getGeminiClient(settings);
      if (clientSetupError || !activeClient) {
        return res.status(401).json({
          ok: false,
          error: clientSetupError || "Gemini Client could not be constructed."
        });
      }

      // Assemble human context context-payload smoothly
      let userPromptContent = `You are revising an existing prompt blueprint based on user reviews of assumptions.\n\n`;
      userPromptContent += `### ORIGINAL RAW PROMPT:\n"${originalRawPrompt || ""}"\n\n`;

      if (originalProjectContext && originalProjectContext.trim()) {
        userPromptContent += `### EXTRA ORIGINAL PROJECT CONTEXT:\n"${originalProjectContext}"\n\n`;
      }

      if (originalConversationHistory && Array.isArray(originalConversationHistory) && originalConversationHistory.length > 0) {
        userPromptContent += `### CONVERSATION HISTORY:\n`;
        originalConversationHistory.forEach((message: any) => {
          const role = message.role === "assistant" ? "Assistant" : "User";
          userPromptContent += `[${role}]: ${message.content}\n`;
        });
        userPromptContent += `\n`;
      }

      userPromptContent += `### CURRENT BLUEPRINT:\n${JSON.stringify(currentBlueprint, null, 2)}\n\n`;

      userPromptContent += `### REVISION INSTRUCTIONS:\n`;
      userPromptContent += `Revise the existing blueprint instead of starting from scratch. Preserve valid unchanged sections. Remove rejected assumptions. Integrate corrected assumptions. Update requirements, architecture, UX, edge cases, developer notes, and final_prompt as needed. Return the same strict JSON blueprint schema only.\n\n`;

      userPromptContent += `### KEPT ASSUMPTIONS:\n`;
      if (keptAssumptions && Array.isArray(keptAssumptions) && keptAssumptions.length > 0) {
        keptAssumptions.forEach((ass: any) => {
          userPromptContent += `- [Kept] ID: ${ass.id} - ${ass.text}\n`;
        });
      } else {
        userPromptContent += `(None specified)\n`;
      }
      userPromptContent += `\n`;

      userPromptContent += `### REJECTED & CORRECTED ASSUMPTIONS:\n`;
      if (rejectedAssumptions && Array.isArray(rejectedAssumptions) && rejectedAssumptions.length > 0) {
        rejectedAssumptions.forEach((ass: any) => {
          userPromptContent += `- [Rejected] ID: ${ass.id} - "${ass.text}"\n`;
          if (ass.correction && ass.correction.trim()) {
            userPromptContent += `  Correction: "${ass.correction}"\n`;
          }
        });
      } else {
        userPromptContent += `(None specified)\n`;
      }
      userPromptContent += `\n`;

      userPromptContent += `Structure your output exactly matching the described schema version '1.0'. Generate NO other text.`;

      try {
        const recipeProfile = getProfileById(refinementProfile || "balanced");
        const packGuidance = compileProjectPackGuidance(projectPack);
        const config: any = {
          systemInstruction: `${ENHANCER_SYSTEM_PROMPT}\n\n### ACTIVE REFINEMENT STYLE (CRITICAL DIRECTION):\n${recipeProfile.instructionBlock}\nEnsure all revised specifications, lists, prompts, and notes generated align closely with this style.${packGuidance}`,
          responseMimeType: "application/json",
          temperature: typeof settings?.temperature === 'number' ? settings.temperature : 0.2,
        };

        if (settings?.maxOutputTokens) {
          config.maxOutputTokens = Number(settings.maxOutputTokens);
        } else {
          config.maxOutputTokens = 8192; // Generous default limit
        }

        // Apply strict schema mode if enabled (defaults to true)
        if (settings?.strictMode !== false) {
          config.responseSchema = {
            type: "OBJECT",
            required: BLUEPRINT_OUTPUT_CONTRACT.required,
            properties: BLUEPRINT_OUTPUT_CONTRACT.properties,
          };
        }

        const chosenModel = settings?.model || "gemini-3.5-flash";

        const response = await activeClient.models.generateContent({
          model: chosenModel,
          contents: userPromptContent,
          config: config,
        });

        const textOutput = response.text || "";
        if (!textOutput.trim()) {
          throw new Error("Received an empty response from the Gemini model during refinement.");
        }

        // Parse JSON output safely using the robust blueprint extraction helper
        const { parsedJson, parseError } = extractJsonBlueprint(textOutput);

        if (parseError || !parsedJson) {
          return res.status(500).json({
            ok: false,
            error: parseError || "Failed to parse model output as JSON.",
            rawOutput: textOutput
          });
        }

        // Heal the parsed blueprint and validate the healed version
        const healed = healBlueprint(parsedJson);
        const schemaIssues = validateBlueprint(healed);
        if (schemaIssues) {
          return res.status(422).json({
            ok: false,
            error: `Schema Validation Mismatch after refinement: ${schemaIssues.join(" | ")}`,
            rawOutput: textOutput
          });
        }

        // Successfully parsed, healed, and validated!
        return res.json({
          ok: true,
          blueprint: healed
        });

      } catch (geminiError: any) {
        console.error("Gemini refinement failed:", geminiError);
        const isDebug = settings?.debugMode === true;
        const classified = handleProviderError(geminiError);
        return res.status(classified.status).json({
          ok: false,
          error: recursiveSanitize(classified.message),
          type: classified.type,
          rawOutput: isDebug ? recursiveSanitize(geminiError.stack || String(geminiError)) : undefined
        });
      }

    } catch (routeError: any) {
      console.error("Endpoint execution error in POST /api/refine-loop:", routeError);
      const isDebug = req.body?.settings?.debugMode === true;
      return res.status(500).json({
        ok: false,
        error: "An unexpected system error occurred on the development server.",
        rawOutput: isDebug ? recursiveSanitize(routeError.stack || String(routeError)) : undefined
      });
    }
  });

  // Serve static assets or mount Vite dev server middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[PromptRefinery Server] Listening on http://localhost:${PORT}`);
  });
}

startServer();
