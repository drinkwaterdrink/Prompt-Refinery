/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';
import { DesignAuditResult, ConversationHistoryRow, ProjectContextPack } from '../types';
import { recursiveSanitize } from '../lib/sanitize';

interface UseDesignAuditProps {
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
    designAuditResult?: DesignAuditResult,
    refinementProfile?: string
  ) => void;
}

export function useDesignAudit({
  showToast,
  saveToWorkflowHistory
}: UseDesignAuditProps) {
  const [projectName, setProjectName] = useState<string>('');
  const [uiDescription, setUiDescription] = useState<string>('');
  const [currentIssues, setCurrentIssues] = useState<string>('');
  const [targetDevice, setTargetDevice] = useState<'desktop' | 'mobile' | 'both'>('both');
  const [stylePreference, setStylePreference] = useState<string>('Sleek Charcoal');
  const [designNotes, setDesignNotes] = useState<string>('');

  const [isGeneratingAudit, setIsGeneratingAudit] = useState<boolean>(false);
  const [auditResult, setAuditResult] = useState<DesignAuditResult | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);

  const clearAudit = useCallback(() => {
    setProjectName('');
    setUiDescription('');
    setCurrentIssues('');
    setTargetDevice('both');
    setStylePreference('Sleek Charcoal');
    setDesignNotes('');
    setAuditResult(null);
    setAuditError(null);
  }, []);

  const loadAuditResult = useCallback((
    result: DesignAuditResult,
    rawPrompt: string,
    originalContext: string
  ) => {
    setProjectName(result.projectName || '');
    setUiDescription(rawPrompt || '');
    setCurrentIssues(originalContext || '');
    setTargetDevice((result.targetDevice as any) || 'both');
    setStylePreference(result.stylePreference || 'Sleek Charcoal');
    setDesignNotes('');
    setAuditResult(result);
    setAuditError(null);
  }, []);

  const analyzeDesign = useCallback(async (
    generationMode: 'mock' | 'gemini' | 'custom_openai',
    settings: any,
    refinementProfile: string,
    projectPack?: ProjectContextPack
  ) => {
    if (!projectName.trim()) {
      showToast('Please enter a project name.');
      return;
    }
    if (!uiDescription.trim()) {
      showToast('Please enter a UI description.');
      return;
    }

    setIsGeneratingAudit(true);
    setAuditError(null);
    setAuditResult(null);

    try {
      const response = await fetch('/api/design-audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectName: projectName.trim(),
          uiDescription: uiDescription.trim(),
          currentIssues: currentIssues.trim(),
          targetDevice,
          stylePreference: stylePreference.trim(),
          designNotes: designNotes.trim(),
          mode: generationMode,
          refinementProfile,
          projectPack,
          settings: {
            model: settings?.model,
            temperature: settings?.temperature,
            maxOutputTokens: settings?.maxOutputTokens,
            strictMode: settings?.strictMode,
            browserApiKey: settings?.browserApiKey?.trim() || undefined,
            debugMode: settings?.debugMode,
            customOpenAI: settings?.customOpenAI
          }
        })
      });

      const result = await response.json();

      if (response.ok && result.ok) {
        const sanitizedResult = recursiveSanitize(result);
        setAuditResult(sanitizedResult);
        
        // Save to workflow history log
        saveToWorkflowHistory(
          `UI Review: ${uiDescription.trim().substring(0, 40)}...`,
          `Issues: ${currentIssues.trim().substring(0, 40)}... | Device: ${targetDevice}`,
          [],
          null,
          generationMode,
          'design_audit',
          'design_audit',
          undefined,
          undefined,
          undefined,
          'design_audit',
          undefined,
          undefined,
          sanitizedResult,
          refinementProfile
        );

        showToast('Design audit generated successfully!');
      } else {
        const errorMsg = result.error || 'Server error generating design review.';
        setAuditError(errorMsg);
        showToast('Failed to audit design.');
      }
    } catch (err: any) {
      console.error("Design audit hook error:", err);
      const errorMsg = err.message || 'Connection failure communicating with server.';
      setAuditError(errorMsg);
      showToast('Network error during design audit.');
    } finally {
      setIsGeneratingAudit(false);
    }
  }, [projectName, uiDescription, currentIssues, targetDevice, stylePreference, designNotes, showToast, saveToWorkflowHistory]);

  return {
    projectName,
    setProjectName,
    uiDescription,
    setUiDescription,
    currentIssues,
    setCurrentIssues,
    targetDevice,
    setTargetDevice,
    stylePreference,
    setStylePreference,
    designNotes,
    setDesignNotes,
    isGeneratingAudit,
    auditResult,
    setAuditResult,
    auditError,
    setAuditError,
    clearAudit,
    loadAuditResult,
    analyzeDesign
  };
}
