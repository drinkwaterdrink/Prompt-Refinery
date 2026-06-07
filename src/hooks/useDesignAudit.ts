/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect } from 'react';
import { DesignAuditResult, ConversationHistoryRow, ProjectContextPack } from '../types';
import { recursiveSanitize } from '../lib/sanitize';
import { getRecipeById } from '../lib/promptRecipes/registry';

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
  const [projectName, setProjectName] = useState<string>(() => localStorage.getItem('prompt_refinery_audit_project_name') || '');
  const [uiDescription, setUiDescription] = useState<string>(() => localStorage.getItem('prompt_refinery_audit_ui_description') || '');
  const [currentIssues, setCurrentIssues] = useState<string>(() => localStorage.getItem('prompt_refinery_audit_current_issues') || '');
  const [targetDevice, setTargetDevice] = useState<'desktop' | 'mobile' | 'both'>(() => (localStorage.getItem('prompt_refinery_audit_target_device') as any) || 'both');
  const [stylePreference, setStylePreference] = useState<string>(() => localStorage.getItem('prompt_refinery_audit_style_preference') || 'Sleek Charcoal');
  const [designNotes, setDesignNotes] = useState<string>(() => localStorage.getItem('prompt_refinery_audit_design_notes') || '');

  useEffect(() => {
    localStorage.setItem('prompt_refinery_audit_project_name', projectName);
  }, [projectName]);

  useEffect(() => {
    localStorage.setItem('prompt_refinery_audit_ui_description', uiDescription);
  }, [uiDescription]);

  useEffect(() => {
    localStorage.setItem('prompt_refinery_audit_current_issues', currentIssues);
  }, [currentIssues]);

  useEffect(() => {
    localStorage.setItem('prompt_refinery_audit_target_device', targetDevice);
  }, [targetDevice]);

  useEffect(() => {
    localStorage.setItem('prompt_refinery_audit_style_preference', stylePreference);
  }, [stylePreference]);

  useEffect(() => {
    localStorage.setItem('prompt_refinery_audit_design_notes', designNotes);
  }, [designNotes]);

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

    if (generationMode === 'mock') {
      setTimeout(() => {
        try {
          const recipe = getRecipeById('design_audit');
          const mockOutcome = recipe.mockGenerator(uiDescription || 'My UI');
          const sanitizedResult = recursiveSanitize(mockOutcome);
          setAuditResult(sanitizedResult);
          
          saveToWorkflowHistory(
            `UI Review: ${uiDescription.trim().substring(0, 40)}...`,
            `Issues: ${currentIssues.trim().substring(0, 40)}... | Device: ${targetDevice}`,
            [],
            null,
            'mock',
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

          showToast('Design audit report generated successfully!');
        } catch (err: any) {
          setAuditError(err.message || 'Mock failed');
          showToast('Failed to audit design.');
        }
        setIsGeneratingAudit(false);
      }, 1200);
      return;
    }

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
