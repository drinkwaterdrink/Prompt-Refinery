/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { PromptBlueprint, ConversationHistoryRow, validateBlueprint, PromptRecipeId, GenericRecipeResult } from '../types';
import { MOCK_MALFORMED_BLUEPRINT } from '../mockData';
import { recursiveSanitize } from '../lib/sanitize';
import { getRecipeById } from '../lib/promptRecipes/registry';

interface UseBlueprintGenerationProps {
  generationMode: 'mock' | 'gemini';
  forceValidationError: boolean;
  model: string;
  temperature: number;
  maxOutputTokens: number;
  strictMode: boolean;
  browserApiKey: string;
  debugMode: boolean;
  showToast: (msg: string) => void;
  saveToWorkflowHistory: (
    prompt: string,
    context: string,
    history: ConversationHistoryRow[],
    bpOrResult: any,
    mode: 'gemini' | 'mock',
    activeTab: string,
    recipeId?: string
  ) => void;
}

export function useBlueprintGeneration({
  generationMode,
  forceValidationError,
  model,
  temperature,
  maxOutputTokens,
  strictMode,
  browserApiKey,
  debugMode,
  showToast,
  saveToWorkflowHistory
}: UseBlueprintGenerationProps) {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<number>(0);
  const [blueprint, setBlueprint] = useState<PromptBlueprint | null>(null);
  const [recipeResult, setRecipeResult] = useState<GenericRecipeResult | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState<PromptRecipeId>('blueprint');
  
  const [validationErrors, setValidationErrors] = useState<string[] | null>(null);
  const [geminiError, setGeminiError] = useState<string | null>(null);
  const [rawOutput, setRawOutput] = useState<string | null>(null);

  // Input states cache to hold context for refinement cycle adjustments
  const [originalRawPrompt, setOriginalRawPrompt] = useState<string>('');
  const [originalProjectContext, setOriginalProjectContext] = useState<string>('');
  const [originalConversationHistory, setOriginalConversationHistory] = useState<ConversationHistoryRow[]>([]);

  // Phase 5 refinement loop states
  const [rejectionStates, setRejectionStates] = useState<Record<string, { rejected: boolean; correction: string }>>({});
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [refinementError, setRefinementError] = useState<string | null>(null);
  const [revisionCount, setRevisionCount] = useState<number>(0);
  const [lastRefined, setLastRefined] = useState<string | null>(null);

  // Loading animation simulation steps
  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setGenerationStep((prev) => {
          if (prev >= 3) {
            clearInterval(interval);
            return 3;
          }
          return prev + 1;
        });
      }, 450);
      return () => clearInterval(interval);
    } else {
      setGenerationStep(0);
    }
  }, [isGenerating]);

  // Perform Generation Pipeline (Mock or Gemini route)
  const enhancePrompt = useCallback(async (
    rawPrompt: string,
    projectContext: string,
    historyRows: ConversationHistoryRow[],
    activeTab: string
  ) => {
    if (!rawPrompt.trim()) {
      showToast('Please enter a raw prompt first.');
      return;
    }

    setIsGenerating(true);
    setGenerationStep(0);
    setBlueprint(null);
    setRecipeResult(null);
    setValidationErrors(null);
    setGeminiError(null);
    setRawOutput(null);
    setRejectionStates({});
    setRefinementError(null);
    setRevisionCount(0);
    setLastRefined(null);

    const recipe = getRecipeById(selectedRecipeId);

    if (generationMode === 'mock') {
      // Mock mode: locally handled with beautiful timed steps
      const interval = setInterval(() => {
        setGenerationStep((prev) => (prev < 3 ? prev + 1 : prev));
      }, 450);

      setTimeout(() => {
        clearInterval(interval);
        try {
          const mockOutcome = recipe.mockGenerator(rawPrompt, projectContext);

          if (selectedRecipeId === 'blueprint') {
            let candidateBlueprint: any;
            if (forceValidationError) {
              candidateBlueprint = MOCK_MALFORMED_BLUEPRINT;
            } else {
              candidateBlueprint = mockOutcome;
            }

            const errors = validateBlueprint(candidateBlueprint);
            if (errors) {
              setValidationErrors(errors);
              setBlueprint(null);
              showToast('Validation failed on generated blueprint structure.');
            } else {
              const sanitizedBp = recursiveSanitize(candidateBlueprint);
              setBlueprint(sanitizedBp);
              setValidationErrors(null);
              setOriginalRawPrompt(rawPrompt);
              setOriginalProjectContext(projectContext);
              setOriginalConversationHistory(historyRows);
              showToast('Blueprint generated and verified successfully.');
              saveToWorkflowHistory(rawPrompt, projectContext, historyRows, sanitizedBp, 'mock', activeTab, 'blueprint');
            }
          } else {
            const sanitizedResult = recursiveSanitize(mockOutcome);
            setRecipeResult(sanitizedResult);
            setBlueprint(null);
            setValidationErrors(null);
            setOriginalRawPrompt(rawPrompt);
            setOriginalProjectContext(projectContext);
            setOriginalConversationHistory(historyRows);
            showToast(`${recipe.label} generated successfully.`);
            saveToWorkflowHistory(rawPrompt, projectContext, historyRows, sanitizedResult, 'mock', activeTab, selectedRecipeId);
          }
        } catch (err: any) {
          showToast('Failed generating mock outcome.');
        }
        setIsGenerating(false);
      }, 1800);
    } else {
      // Real Gemini API mode
      let intervalId: any;
      try {
        intervalId = setInterval(() => {
          setGenerationStep((prev) => (prev < 3 ? prev + 1 : prev));
        }, 500);

        const response = await fetch('/api/refine', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            rawPrompt,
            projectContext,
            conversationHistory: historyRows,
            mode: forceValidationError ? 'mock' : 'gemini',
            recipeId: selectedRecipeId,
            settings: {
              model,
              temperature,
              maxOutputTokens,
              strictMode,
              browserApiKey: browserApiKey?.trim() || undefined,
              debugMode
            }
          })
        });

        clearInterval(intervalId);

        const result = await response.json();
        if (response.ok && result.ok) {
          if (selectedRecipeId === 'blueprint') {
            const sanitizedBp = recursiveSanitize(result.blueprint);
            setBlueprint(sanitizedBp);
            setRecipeResult(null);
            setValidationErrors(null);
            setGeminiError(null);
            setOriginalRawPrompt(rawPrompt);
            setOriginalProjectContext(projectContext);
            setOriginalConversationHistory(historyRows);
            showToast('Blueprint generated and verified via Gemini!');
            saveToWorkflowHistory(rawPrompt, projectContext, historyRows, sanitizedBp, 'gemini', activeTab, 'blueprint');
          } else {
            const sanitizedResult = recursiveSanitize(result);
            setRecipeResult(sanitizedResult);
            setBlueprint(null);
            setValidationErrors(null);
            setGeminiError(null);
            setOriginalRawPrompt(rawPrompt);
            setOriginalProjectContext(projectContext);
            setOriginalConversationHistory(historyRows);
            showToast(`${result.title || recipe.label} generated via Gemini!`);
            saveToWorkflowHistory(rawPrompt, projectContext, historyRows, sanitizedResult, 'gemini', activeTab, selectedRecipeId);
          }
        } else {
          setGeminiError(result.error || 'Server returned an error generating result.');
          if (result.rawOutput) {
            setRawOutput(recursiveSanitize(result.rawOutput));
          }
          if (result.error && (result.error.includes('Schema Validation Mismatch:') || result.error.includes('JSON Validation Error:'))) {
            const cleanErr = result.error.replace('Schema Validation Mismatch: ', '').replace('JSON Validation Error: ', '');
            const issues = cleanErr.split(' | ').join('; ').split('; ');
            setValidationErrors(issues);
          }
          showToast('Failed to refine prompt.');
        }
      } catch (err: any) {
        if (intervalId) clearInterval(intervalId);
        console.error("Gemini API backend error:", err);
        setGeminiError(err.message || 'Network exception communicating with refinery engine.');
        showToast('Network error.');
      } finally {
        setIsGenerating(false);
      }
    }
  }, [generationMode, forceValidationError, model, temperature, maxOutputTokens, strictMode, browserApiKey, debugMode, showToast, saveToWorkflowHistory, selectedRecipeId]);

  // Phase 5: Refine Blueprint via assumption review loop
  const refineBlueprint = useCallback(async (
    rawPrompt: string,
    projectContext: string,
    historyRows: ConversationHistoryRow[],
    activeTab: string
  ) => {
    if (!blueprint) return;

    setIsRefining(true);
    setRefinementError(null);

    // Filter kept vs. rejected / corrected assumptions
    const assumptions = blueprint.problem_clarification.assumptions || [];
    const kept = [];
    const rejected = [];

    for (const ass of assumptions) {
      const state = rejectionStates[ass.id];
      if (state && state.rejected) {
        rejected.push({
          id: ass.id,
          text: ass.text,
          correction: state.correction || ''
        });
      } else {
        kept.push({
          id: ass.id,
          text: ass.text,
          confidence: ass.confidence,
          source: ass.source
        });
      }
    }

    if (rejected.length === 0) {
      showToast('Please reject and correct at least one assumption to refine.');
      setIsRefining(false);
      return;
    }

    try {
      const payload = {
        originalRawPrompt: originalRawPrompt || rawPrompt,
        originalProjectContext: originalProjectContext || projectContext,
        originalConversationHistory: originalConversationHistory || historyRows,
        currentBlueprint: blueprint,
        keptAssumptions: kept,
        rejectedAssumptions: rejected,
        mode: generationMode,
        settings: {
          model,
          temperature,
          maxOutputTokens,
          strictMode,
          browserApiKey: browserApiKey?.trim() || undefined,
          debugMode
        }
      };

      const response = await fetch('/api/refine-loop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (response.ok && result?.ok) {
        const sanitizedBp = recursiveSanitize(result.blueprint);
        setBlueprint(sanitizedBp);
        setRecipeResult(null);
        setRevisionCount(prev => prev + 1);
        setLastRefined(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        setRejectionStates({}); // Reset review state since layout assumptions are redrawn
        setValidationErrors(null);
        setRefinementError(null);
        showToast(generationMode === 'mock' ? 'Blueprint refined locally!' : 'Blueprint revised successfully via Gemini!');
        saveToWorkflowHistory(
          originalRawPrompt || rawPrompt,
          originalProjectContext || projectContext,
          originalConversationHistory || historyRows,
          sanitizedBp,
          generationMode,
          activeTab,
          'blueprint'
        );
      } else {
        setRefinementError(result?.error || 'Server refused requested refinement payload.');
        showToast('Failed to refine.');
      }
    } catch (err: any) {
      console.error("Refine API call failed:", err);
      setRefinementError(err.message || 'Connection exception occurred while adjusting blueprint.');
      showToast('Connection failed.');
    } finally {
      setIsRefining(false);
    }
  }, [blueprint, rejectionStates, originalRawPrompt, originalProjectContext, originalConversationHistory, generationMode, model, temperature, maxOutputTokens, strictMode, browserApiKey, debugMode, showToast, saveToWorkflowHistory]);

  return {
    isGenerating,
    generationStep,
    blueprint,
    setBlueprint,
    recipeResult,
    setRecipeResult,
    selectedRecipeId,
    setSelectedRecipeId,
    validationErrors,
    setValidationErrors,
    geminiError,
    setGeminiError,
    rawOutput,
    setRawOutput,
    originalRawPrompt,
    setOriginalRawPrompt,
    originalProjectContext,
    setOriginalProjectContext,
    originalConversationHistory,
    setOriginalConversationHistory,
    rejectionStates,
    setRejectionStates,
    isRefining,
    refinementError,
    setRefinementError,
    revisionCount,
    setRevisionCount,
    lastRefined,
    setLastRefined,
    enhancePrompt,
    refineBlueprint
  };
}
export type UseBlueprintGenerationReturn = ReturnType<typeof useBlueprintGeneration>;
