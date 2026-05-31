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

dotenv.config();

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

  // 2. Find all opening braces and try matching them with closing braces
  // We want to find valid outer objects and search for the one that looks like a blueprint.
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
    // High confidence: contains schema_version, final_prompt or problem_clarification keys
    const best = results.find(r => r && (r.schema_version || r.final_prompt || r.problem_clarification));
    if (best) {
      return { parsedJson: best, parseError: null };
    }
    // Sort by largest JSON length
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

  return { 
    parsedJson: null, 
    parseError: "Could not find any valid JSON object structure in response payload." 
  };
}

async function startServer() {
  const app = express();
  app.use(express.json());
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

  // Creative Spark Catalyst endpoint
  app.post("/api/sparks", async (req, res) => {
    const { count, novelty, category, mood, mode, settings } = req.body;
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

    const sparksSystemInstruction = `You are a legendary startup incubator general partner and technology foresight researcher. Your task is to generate fresh app or feature ideas for vibe coding.
Avoid generic todo apps or obvious concepts. Create high-quality, fully buildable concepts.
For the requested novelty level ("practical", "unusual", "black-swan"), conform to these strict architectural criteria:
- Practical: Focus on high-utility personal utilities, local grow room tracking, offline-first personal tracking tools, or developer utilities.
- Unusual: Focus on niche tools, retro-inspired mechanics, world-building lore books, roleplay relationship nodes, or Web Audio oscillators.
- Black-Swan: Fuse 2-3 unrelated technical pillars, identify a catalyst problem, add an unconventional constraint (e.g. deliberate friction, zero-UI, hyper-local/analog, ephemeral, ambient, voice-first), and produce a buildable but paradigm-shifting MVP loop. Ensure catalystProblem, corePillars, and whyNow are fully populated.

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

  // Main prompt refinement endpoint
  app.post("/api/refine", async (req, res) => {
    try {
      const { rawPrompt, projectContext, conversationHistory, mode, settings, recipeId } = req.body;

      if (!rawPrompt || typeof rawPrompt !== "string" || !rawPrompt.trim()) {
        return res.status(400).json({ ok: false, error: "The rawPrompt parameter is required and must be a non-empty string." });
      }

      // Resolve the correct prompt recipe
      const activeRecipeId = (recipeId && isValidRecipeId(recipeId)) ? recipeId : "blueprint";
      const recipe = getRecipeById(activeRecipeId);

      // 1. Mock mode logic
      if (mode === "mock") {
        try {
          const mockResult = recipe.mockGenerator(rawPrompt, projectContext);
          if (activeRecipeId === "blueprint") {
            return res.json({ ok: true, blueprint: mockResult });
          } else {
            return res.json(mockResult);
          }
        } catch (mockErr: any) {
          return res.status(500).json({ ok: false, error: mockErr.message || "Failed generating mock recipe outcome." });
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
        const config: any = {
          systemInstruction: recipe.systemInstruction,
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

        // Validate the structure against exact schema (exclusive to blueprint mode)
        const schemaIssues = validateBlueprint(parsedJson);
        if (schemaIssues) {
          return res.status(422).json({
            ok: false,
            error: `Schema Validation Mismatch: ${schemaIssues.join(" | ")}`,
            rawOutput: textOutput
          });
        }

        // Successfully parsed and validated!
        return res.json({
          ok: true,
          blueprint: parsedJson
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
        settings
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
        const config: any = {
          systemInstruction: ENHANCER_SYSTEM_PROMPT,
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

        // Validate the structure against exact schema
        const schemaIssues = validateBlueprint(parsedJson);
        if (schemaIssues) {
          return res.status(422).json({
            ok: false,
            error: `Schema Validation Mismatch after refinement: ${schemaIssues.join(" | ")}`,
            rawOutput: textOutput
          });
        }

        // Successfully parsed and validated!
        return res.json({
          ok: true,
          blueprint: parsedJson
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
