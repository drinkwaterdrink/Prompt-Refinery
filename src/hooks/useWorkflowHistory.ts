/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { WorkflowHistoryItem, ConversationHistoryRow, PromptBlueprint } from '../types';
import { recursiveSanitize } from '../lib/sanitize';

export function useWorkflowHistory(showToast: (msg: string) => void) {
  const [workflowHistory, setWorkflowHistory] = useState<WorkflowHistoryItem[]>([]);
  const [isWorkflowSidebarOpen, setIsWorkflowSidebarOpen] = useState<boolean>(false);

  // Load workflow history once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('prompt_refinery_workflow_history');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setWorkflowHistory(parsed);
        }
      }
    } catch (err) {
      console.error("Local storage prompt runs history load was corrupted:", err);
      showToast("Could not load saving workflow history.");
    }
  }, [showToast]);

  const saveToWorkflowHistory = useCallback((
    prompt: string,
    context: string,
    history: ConversationHistoryRow[],
    bpOrResult: any,
    mode: 'gemini' | 'mock',
    activeTab: string,
    recipeId?: string,
    sparkTitle?: string,
    sparkNovelty?: 'practical' | 'unusual' | 'black-swan',
    sparkTags?: string[],
    type?: 'blueprint' | 'pipeline',
    pipeline?: any
  ) => {
    // Clean all inputs and output structures using the recursive sanitizer
    const cleanPrompt = recursiveSanitize(prompt);
    const cleanContext = recursiveSanitize(context);
    const cleanHistory = recursiveSanitize(history);
    const cleanBpOrResult = recursiveSanitize(bpOrResult);
    const cleanPipeline = recursiveSanitize(pipeline);

    const isBlueprint = type !== 'pipeline' && bpOrResult && ('schema_version' in bpOrResult || !('content' in bpOrResult));
    
    const title = type === 'pipeline'
      ? (cleanPipeline?.title || `Pipeline: ${cleanPrompt.substring(0, 30)}...`)
      : (isBlueprint 
        ? (bpOrResult.title?.trim() || `${cleanPrompt.substring(0, 30)}...`)
        : (bpOrResult.title?.trim() || `${cleanPrompt.substring(0, 30)}...`));
      
    const summary = type === 'pipeline'
      ? `Refinery Pipeline (${Object.keys(cleanPipeline?.stages || {}).filter(k => cleanPipeline?.stages[k]).length}/4 completed stages)`
      : (isBlueprint
        ? (bpOrResult.summary?.trim() || "No summary details successfully mapped.")
        : (bpOrResult.content ? `${bpOrResult.content.substring(0, 80)}...` : "Recipe output generated."));

    const newItem: WorkflowHistoryItem = {
      id: `run_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title,
      timestamp: new Date().toLocaleString(),
      summary,
      provider: mode,
      rawPrompt: cleanPrompt,
      projectContext: cleanContext,
      conversationHistory: cleanHistory,
      recipeId: recipeId || (isBlueprint ? 'blueprint' : bpOrResult?.recipeId),
      blueprint: isBlueprint ? cleanBpOrResult : undefined,
      recipeResult: (!isBlueprint && type !== 'pipeline') ? cleanBpOrResult : undefined,
      selectedTab: activeTab,
      sparkTitle,
      sparkNovelty,
      sparkTags,
      type: type || 'blueprint',
      pipeline: type === 'pipeline' ? cleanPipeline : undefined
    };

    setWorkflowHistory((prev) => {
      // Filter duplicate titles and cap at 50 runs
      const filtered = [newItem, ...prev.filter(item => item.title !== newItem.title)].slice(0, 50);
      try {
        localStorage.setItem('prompt_refinery_workflow_history', JSON.stringify(filtered));
      } catch (saveErr) {
        console.error("Local storage saving exception:", saveErr);
      }
      return filtered;
    });
  }, []);

  const deleteWorkflowHistoryItem = useCallback((id: string) => {
    setWorkflowHistory((prev) => {
      const next = prev.filter(item => item.id !== id);
      try {
        localStorage.setItem('prompt_refinery_workflow_history', JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
      return next;
    });
    showToast("Removed saved work record.");
  }, [showToast]);

  const clearAllWorkflowHistory = useCallback(() => {
    const confirmClear = window.confirm("Are you sure you want to delete all saved workflow runs? This action cannot be undone.");
    if (confirmClear) {
      setWorkflowHistory([]);
      try {
        localStorage.removeItem('prompt_refinery_workflow_history');
      } catch (err) {
        console.error(err);
      }
      showToast("Cleared run history.");
    }
  }, [showToast]);

  return {
    workflowHistory,
    setWorkflowHistory,
    isWorkflowSidebarOpen,
    setIsWorkflowSidebarOpen,
    saveToWorkflowHistory,
    deleteWorkflowHistoryItem,
    clearAllWorkflowHistory
  };
}
export type UseWorkflowHistoryReturn = ReturnType<typeof useWorkflowHistory>;
