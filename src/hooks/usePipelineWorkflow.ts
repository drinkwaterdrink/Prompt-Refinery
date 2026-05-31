/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';
import { RefineryPipeline, PipelineStageResult, ConversationHistoryRow, ProjectContextPack } from '../types';
import { recursiveSanitize } from '../lib/sanitize';

import type { CustomOpenAIConfig } from '../lib/providers/types';

interface UsePipelineWorkflowProps {
  generationMode: 'mock' | 'gemini' | 'custom_openai';
  customOpenAI?: CustomOpenAIConfig;
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
    mode: 'gemini' | 'mock' | 'custom_openai',
    activeTab: string,
    recipeId?: string,
    sparkTitle?: string,
    sparkNovelty?: 'practical' | 'unusual' | 'black-swan',
    sparkTags?: string[],
    type?: 'blueprint' | 'pipeline' | 'project' | 'design_audit',
    pipeline?: any,
    projectResult?: any,
    designAuditResult?: any,
    refinementProfile?: string
  ) => void;
}

export type StageKey = 'projectRequest' | 'technicalSpec' | 'implementationPlan' | 'finalVibePrompt';

const STAGE_RECIPES: Record<StageKey, { recipeId: string; label: string }> = {
  projectRequest: { recipeId: 'idea_refinement', label: 'Project Request Specification' },
  technicalSpec: { recipeId: 'technical_spec', label: 'Technical Specification' },
  implementationPlan: { recipeId: 'implementation_plan', label: 'Implementation Plan' },
  finalVibePrompt: { recipeId: 'final_vibe', label: 'Final Vibe Prompt' }
};

export function usePipelineWorkflow({
  generationMode,
  customOpenAI,
  model,
  temperature,
  maxOutputTokens,
  strictMode,
  browserApiKey,
  debugMode,
  showToast,
  saveToWorkflowHistory
}: UsePipelineWorkflowProps) {
  const [pipeline, setPipeline] = useState<RefineryPipeline | null>(null);
  
  const [stageStatuses, setStageStatuses] = useState<Record<StageKey, 'empty' | 'generating' | 'complete' | 'error'>>({
    projectRequest: 'empty',
    technicalSpec: 'empty',
    implementationPlan: 'empty',
    finalVibePrompt: 'empty'
  });

  const [stageErrors, setStageErrors] = useState<Record<StageKey, string | null>>({
    projectRequest: null,
    technicalSpec: null,
    implementationPlan: null,
    finalVibePrompt: null
  });

  const startPipeline = useCallback((
    rawPrompt: string,
    projectContext: string,
    conversationHistory: ConversationHistoryRow[]
  ) => {
    const cleanPrompt = rawPrompt.trim();
    const title = cleanPrompt.split(' ').slice(0, 3).join(' ') || 'New Project Pipeline';
    
    const newPipeline: RefineryPipeline = {
      id: `pipeline_${Date.now()}`,
      title: `Pipeline: ${title}`,
      rawPrompt: cleanPrompt,
      projectContext,
      conversationHistory,
      stages: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setPipeline(newPipeline);
    setStageStatuses({
      projectRequest: 'empty',
      technicalSpec: 'empty',
      implementationPlan: 'empty',
      finalVibePrompt: 'empty'
    });
    setStageErrors({
      projectRequest: null,
      technicalSpec: null,
      implementationPlan: null,
      finalVibePrompt: null
    });
    return newPipeline;
  }, []);

  const loadPipeline = useCallback((loadedPipeline: RefineryPipeline) => {
    setPipeline(loadedPipeline);
    
    const statuses: Record<StageKey, 'empty' | 'generating' | 'complete' | 'error'> = {
      projectRequest: 'empty',
      technicalSpec: 'empty',
      implementationPlan: 'empty',
      finalVibePrompt: 'empty'
    };
    
    if (loadedPipeline.stages.projectRequest) statuses.projectRequest = 'complete';
    if (loadedPipeline.stages.technicalSpec) statuses.technicalSpec = 'complete';
    if (loadedPipeline.stages.implementationPlan) statuses.implementationPlan = 'complete';
    if (loadedPipeline.stages.finalVibePrompt) statuses.finalVibePrompt = 'complete';
    
    setStageStatuses(statuses);
    setStageErrors({
      projectRequest: null,
      technicalSpec: null,
      implementationPlan: null,
      finalVibePrompt: null
    });
  }, []);

  const clearPipeline = useCallback(() => {
    setPipeline(null);
    setStageStatuses({
      projectRequest: 'empty',
      technicalSpec: 'empty',
      implementationPlan: 'empty',
      finalVibePrompt: 'empty'
    });
    setStageErrors({
      projectRequest: null,
      technicalSpec: null,
      implementationPlan: null,
      finalVibePrompt: null
    });
  }, []);

  const generateStage = useCallback(async (
    stageKey: StageKey,
    rawPrompt: string,
    baseContext: string,
    historyRows: ConversationHistoryRow[],
    refinementProfile: string,
    projectPack?: ProjectContextPack
  ) => {
    if (!rawPrompt.trim()) {
      showToast('Please enter a raw prompt first.');
      return;
    }

    // Set loading states
    setStageStatuses(prev => ({ ...prev, [stageKey]: 'generating' }));
    setStageErrors(prev => ({ ...prev, [stageKey]: null }));

    // Formulate previous specs context
    let accumulatedContext = baseContext || '';
    let currentPipeline = pipeline;

    if (!currentPipeline) {
      currentPipeline = startPipeline(rawPrompt, baseContext, historyRows);
    }

    if (stageKey === 'technicalSpec') {
      const projectReqContent = currentPipeline.stages.projectRequest?.content;
      if (projectReqContent) {
        accumulatedContext += `\n\n### STAGE 1: PROJECT REQUEST SPECIFICATION (REFERENCE):\n${projectReqContent}`;
      }
    } else if (stageKey === 'implementationPlan') {
      const projectReqContent = currentPipeline.stages.projectRequest?.content;
      const techSpecContent = currentPipeline.stages.technicalSpec?.content;
      if (projectReqContent) {
        accumulatedContext += `\n\n### STAGE 1: PROJECT REQUEST SPECIFICATION (REFERENCE):\n${projectReqContent}`;
      }
      if (techSpecContent) {
        accumulatedContext += `\n\n### STAGE 2: TECHNICAL SPECIFICATION (REFERENCE):\n${techSpecContent}`;
      }
    } else if (stageKey === 'finalVibePrompt') {
      const projectReqContent = currentPipeline.stages.projectRequest?.content;
      const techSpecContent = currentPipeline.stages.technicalSpec?.content;
      const implPlanContent = currentPipeline.stages.implementationPlan?.content;
      if (projectReqContent) {
        accumulatedContext += `\n\n### STAGE 1: PROJECT REQUEST SPECIFICATION (REFERENCE):\n${projectReqContent}`;
      }
      if (techSpecContent) {
        accumulatedContext += `\n\n### STAGE 2: TECHNICAL SPECIFICATION (REFERENCE):\n${techSpecContent}`;
      }
      if (implPlanContent) {
        accumulatedContext += `\n\n### STAGE 3: IMPLEMENTATION PLAN (REFERENCE):\n${implPlanContent}`;
      }
    }

    const { recipeId, label } = STAGE_RECIPES[stageKey];

    try {
      const response = await fetch('/api/refine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rawPrompt,
          projectContext: accumulatedContext,
          conversationHistory: historyRows,
          mode: generationMode,
          recipeId,
          refinementProfile,
          projectPack,
          settings: {
            model,
            temperature: stageKey === 'finalVibePrompt' ? 0.3 : temperature,
            maxOutputTokens,
            strictMode,
            browserApiKey: browserApiKey?.trim() || undefined,
            debugMode,
            customOpenAI
          }
        })
      });

      const result = await response.json();

      if (response.ok && result.ok) {
        const stageResult: PipelineStageResult = {
          recipeId,
          outputKind: 'markdown',
          title: result.title || label,
          content: recursiveSanitize(result.content || '')
        };

        setPipeline(prev => {
          if (!prev) return null;
          
          const updatedPipeline: RefineryPipeline = {
            ...prev,
            stages: {
              ...prev.stages,
              [stageKey]: stageResult
            },
            updatedAt: new Date().toISOString()
          };

          // Save the entire updated pipeline state to the history log
          saveToWorkflowHistory(
            rawPrompt,
            baseContext,
            historyRows,
            null,
            generationMode,
            'pipeline',
            recipeId,
            undefined,
            undefined,
            undefined,
            'pipeline',
            updatedPipeline,
            undefined,
            undefined,
            refinementProfile
          );

          return updatedPipeline;
        });

        setStageStatuses(prev => ({ ...prev, [stageKey]: 'complete' }));
        showToast(`${label} stage completed!`);
      } else {
        const errorMsg = result.error || 'Server error generating stage outcome.';
        setStageStatuses(prev => ({ ...prev, [stageKey]: 'error' }));
        setStageErrors(prev => ({ ...prev, [stageKey]: errorMsg }));
        showToast(`Failed to generate ${label}.`);
      }
    } catch (err: any) {
      console.error(`Pipeline generate stage ${stageKey} error:`, err);
      const errorMsg = err.message || 'Connection failure communicating with server.';
      setStageStatuses(prev => ({ ...prev, [stageKey]: 'error' }));
      setStageErrors(prev => ({ ...prev, [stageKey]: errorMsg }));
      showToast(`Network error generating ${label}.`);
    }
  }, [pipeline, generationMode, customOpenAI, model, temperature, maxOutputTokens, strictMode, browserApiKey, debugMode, showToast, saveToWorkflowHistory, startPipeline]);

  return {
    pipeline,
    setPipeline,
    stageStatuses,
    setStageStatuses,
    stageErrors,
    setStageErrors,
    startPipeline,
    loadPipeline,
    clearPipeline,
    generateStage
  };
}
