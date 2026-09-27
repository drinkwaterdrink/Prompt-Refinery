/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { WorkflowHistoryItem, ConversationHistoryRow, PromptBlueprint } from '../types';
import { recursiveSanitize } from '../lib/sanitize';
import { migrateLegacyHistory, readWorkflowHistory, replaceWorkflowHistory, LEGACY_HISTORY_KEY } from '../lib/historyStorage';

export function useWorkflowHistory(showToast: (msg: string) => void) {
  const [workflowHistory, setWorkflowHistory] = useState<WorkflowHistoryItem[]>([]);
  const [isWorkflowSidebarOpen, setIsWorkflowSidebarOpen] = useState<boolean>(false);
  const [hydrated, setHydrated] = useState(false);
  const [legacyFallback, setLegacyFallback] = useState(false);
  const persistQueue = useRef<Promise<void>>(Promise.resolve());

  // Load workflow history once on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await migrateLegacyHistory();
        const saved = await readWorkflowHistory();
        if (!cancelled) {
          setWorkflowHistory(prev => [...prev, ...saved.filter(item => !prev.some(existing => existing.id === item.id))]);
          setHydrated(true);
        }
      } catch (err) {
        console.error('Workflow history storage unavailable:', err);
        if (!cancelled) {
          try {
            const legacy = JSON.parse(localStorage.getItem(LEGACY_HISTORY_KEY) || '[]');
            if (Array.isArray(legacy) && legacy.every(item => item && typeof item.id === 'string' && item.id && typeof item.title === 'string')) {
              setWorkflowHistory(recursiveSanitize(legacy));
              setLegacyFallback(true);
              setHydrated(true);
            }
          } catch { /* Leave the legacy data untouched. */ }
          showToast('History migration is unavailable. Existing records are preserved in browser storage.');
        }
      }
    })();
    return () => { cancelled = true; };
  }, [showToast]);

  // Serialize IndexedDB snapshots after React commits; state updaters remain pure.
  useEffect(() => {
    if (!hydrated) return;
    const snapshot = workflowHistory;
    persistQueue.current = persistQueue.current.then(() => {
      if (legacyFallback) localStorage.setItem(LEGACY_HISTORY_KEY, JSON.stringify(snapshot));
      else return replaceWorkflowHistory(snapshot);
    }).catch(err => {
      console.error('Workflow history save failed:', err);
      showToast('Could not save workflow history. Check available device storage.');
    });
  }, [workflowHistory, hydrated, legacyFallback, showToast]);

  const saveToWorkflowHistory = useCallback((
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
    refinementProfile?: string,
    activeProjectPackId?: string,
    activeProjectPackName?: string,
    activeProjectPackSnapshot?: string
  ) => {
    // Clean all inputs and output structures using the recursive sanitizer
    const cleanPrompt = recursiveSanitize(prompt);
    const cleanContext = recursiveSanitize(context);
    const cleanHistory = recursiveSanitize(history);
    const cleanBpOrResult = recursiveSanitize(bpOrResult);
    const cleanPipeline = recursiveSanitize(pipeline);
    const cleanProjectResult = recursiveSanitize(projectResult);
    const cleanDesignAuditResult = recursiveSanitize(designAuditResult);
    const cleanRefinementProfile = refinementProfile ? recursiveSanitize(refinementProfile) : undefined;
    const cleanActiveProjectPackId = activeProjectPackId ? recursiveSanitize(activeProjectPackId) : undefined;
    const cleanActiveProjectPackName = activeProjectPackName ? recursiveSanitize(activeProjectPackName) : undefined;
    const cleanActiveProjectPackSnapshot = activeProjectPackSnapshot ? recursiveSanitize(activeProjectPackSnapshot) : undefined;

    const isBlueprint = type !== 'pipeline' && type !== 'project' && type !== 'design_audit' && bpOrResult && ('schema_version' in bpOrResult || !('content' in bpOrResult));
    
    const title = type === 'pipeline'
      ? (cleanPipeline?.title || `Pipeline: ${cleanPrompt.substring(0, 30)}...`)
      : type === 'project'
        ? (`Review: ${cleanProjectResult?.projectName || cleanPrompt.substring(0, 30)}...`)
        : type === 'design_audit'
          ? (`UX Audit: ${cleanDesignAuditResult?.projectName || cleanPrompt.substring(0, 30)}...`)
          : (isBlueprint 
            ? (cleanBpOrResult?.title?.trim() || `${cleanPrompt.substring(0, 30)}...`)
            : (cleanBpOrResult?.title?.trim() || `${cleanPrompt.substring(0, 30)}...`));
      
    const summary = type === 'pipeline'
      ? `Refinery Pipeline (${Object.keys(cleanPipeline?.stages || {}).filter(k => cleanPipeline?.stages[k]).length}/4 completed stages)`
      : type === 'project'
        ? `Optimization Plan (${cleanProjectResult?.suggested_improvements?.length || 0} improvements suggested)`
        : type === 'design_audit'
          ? `Design Principles Audit (UX Score: ${cleanDesignAuditResult?.overall_score || 0}/10)`
          : (isBlueprint
            ? (cleanBpOrResult?.summary?.trim() || "No summary details successfully mapped.")
            : (cleanBpOrResult?.content ? `${cleanBpOrResult.content.substring(0, 80)}...` : "Recipe output generated."));

    const newItem: WorkflowHistoryItem = {
      id: `run_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title,
      timestamp: new Date().toLocaleString(),
      summary,
      provider: mode,
      rawPrompt: cleanPrompt,
      projectContext: cleanContext,
      conversationHistory: cleanHistory,
      recipeId: recipeId || (isBlueprint ? 'blueprint' : cleanBpOrResult?.recipeId),
      blueprint: isBlueprint ? cleanBpOrResult : undefined,
      recipeResult: (!isBlueprint && type !== 'pipeline' && type !== 'project' && type !== 'design_audit') ? cleanBpOrResult : undefined,
      selectedTab: activeTab,
      sparkTitle: sparkTitle ? recursiveSanitize(sparkTitle) : undefined,
      sparkNovelty,
      sparkTags: sparkTags ? recursiveSanitize(sparkTags) : undefined,
      type: type || 'blueprint',
      pipeline: type === 'pipeline' ? cleanPipeline : undefined,
      projectResult: type === 'project' ? cleanProjectResult : undefined,
      designAuditResult: type === 'design_audit' ? cleanDesignAuditResult : undefined,
      refinementProfile: cleanRefinementProfile,
      activeProjectPackId: cleanActiveProjectPackId,
      activeProjectPackName: cleanActiveProjectPackName,
      activeProjectPackSnapshot: cleanActiveProjectPackSnapshot
    };

    setWorkflowHistory((prev) => {
      // Filter duplicate titles and cap at 50 runs
      const filtered = [newItem, ...prev.filter(item => item.title !== newItem.title)].slice(0, 50);
      return filtered;
    });
  }, []);

  const deleteWorkflowHistoryItem = useCallback((id: string) => {
    setWorkflowHistory((prev) => {
      const next = prev.filter(item => item.id !== id);
      return next;
    });
    showToast("Removed saved work record.");
  }, [showToast]);

  const clearAllWorkflowHistory = useCallback(() => {
    const confirmClear = window.confirm("Are you sure you want to delete all saved workflow runs? This action cannot be undone.");
    if (confirmClear) {
      setWorkflowHistory([]);
      localStorage.removeItem(LEGACY_HISTORY_KEY);
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
