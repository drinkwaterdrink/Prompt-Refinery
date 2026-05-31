/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';
import { ProjectImprovementResult, ConversationHistoryRow } from '../types';
import { recursiveSanitize } from '../lib/sanitize';

interface UseProjectIterativeProps {
  showToast: (msg: string) => void;
  saveToWorkflowHistory: (
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
    type?: 'blueprint' | 'pipeline' | 'project',
    pipeline?: any,
    projectResult?: ProjectImprovementResult
  ) => void;
}

export function useProjectIterative({
  showToast,
  saveToWorkflowHistory
}: UseProjectIterativeProps) {
  const [projectName, setProjectName] = useState<string>('');
  const [repoUrl, setRepoUrl] = useState<string>('');
  const [projectContext, setProjectContext] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadedContextText, setUploadedContextText] = useState<string>('');
  const [direction, setDirection] = useState<string>('Find UI/UX improvements');

  const [isGeneratingProject, setIsGeneratingProject] = useState<boolean>(false);
  const [projectResult, setProjectResult] = useState<ProjectImprovementResult | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);

  const clearProject = useCallback(() => {
    setProjectName('');
    setRepoUrl('');
    setProjectContext('');
    setUploadedFileName('');
    setUploadedContextText('');
    setDirection('Find UI/UX improvements');
    setProjectResult(null);
    setProjectError(null);
  }, []);

  const loadProjectResult = useCallback((result: ProjectImprovementResult, rawPrompt: string, originalContext: string) => {
    setProjectName(result.projectName || '');
    setRepoUrl(result.repoUrl || '');
    setProjectContext(originalContext || result.project_summary || '');
    setUploadedFileName('');
    setUploadedContextText('');
    setProjectResult(result);
    setProjectError(null);
  }, []);

  const analyzeProject = useCallback(async (
    generationMode: 'mock' | 'gemini',
    settings: any
  ) => {
    if (!projectName.trim()) {
      showToast('Please enter a project name.');
      return;
    }

    setIsGeneratingProject(true);
    setProjectError(null);
    setProjectResult(null);

    try {
      const response = await fetch('/api/project-ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectName: projectName.trim(),
          repoUrl: repoUrl.trim(),
          projectContext: projectContext.trim(),
          uploadedContextText: uploadedContextText.trim(),
          direction,
          mode: generationMode,
          settings: {
            model: settings?.model,
            temperature: settings?.temperature,
            maxOutputTokens: settings?.maxOutputTokens,
            strictMode: settings?.strictMode,
            browserApiKey: settings?.browserApiKey?.trim() || undefined,
            debugMode: settings?.debugMode
          }
        })
      });

      const result = await response.json();

      if (response.ok && result.ok) {
        const sanitizedResult = recursiveSanitize(result);
        setProjectResult(sanitizedResult);
        
        // Save the project improvement plan to the sidebar history runs list!
        saveToWorkflowHistory(
          `Goal: ${direction} in ${projectName.trim()}`,
          projectContext.trim() + (uploadedFileName ? `\n(File: ${uploadedFileName})` : ""),
          [],
          null,
          generationMode,
          'project',
          'code_review',
          undefined,
          undefined,
          undefined,
          'project',
          undefined,
          sanitizedResult
        );

        showToast('Code review and optimization plan generated successfully!');
      } else {
        const errorMsg = result.error || 'Server error generating code review outcomes.';
        setProjectError(errorMsg);
        showToast('Failed to review project.');
      }
    } catch (err: any) {
      console.error("Code review hook error:", err);
      const errorMsg = err.message || 'Connection failure communicating with server.';
      setProjectError(errorMsg);
      showToast('Network error during project review.');
    } finally {
      setIsGeneratingProject(false);
    }
  }, [projectName, repoUrl, projectContext, uploadedContextText, uploadedFileName, direction, showToast, saveToWorkflowHistory]);

  return {
    projectName,
    setProjectName,
    repoUrl,
    setRepoUrl,
    projectContext,
    setProjectContext,
    uploadedFileName,
    setUploadedFileName,
    uploadedContextText,
    setUploadedContextText,
    direction,
    setDirection,
    isGeneratingProject,
    setIsGeneratingProject,
    projectResult,
    setProjectResult,
    projectError,
    setProjectError,
    clearProject,
    loadProjectResult,
    analyzeProject
  };
}
