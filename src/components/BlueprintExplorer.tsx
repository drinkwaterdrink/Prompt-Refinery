/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Download, 
  ClipboardCheck, 
  Sparkles, 
  Code,
  Zap,
  RefreshCw,
  Sliders
} from 'lucide-react';
import { PromptBlueprint, GenericRecipeResult, GoalContractData } from '../types';

interface BlueprintExplorerProps {
  blueprint: PromptBlueprint | null;
  recipeResult: GenericRecipeResult | null;
  validationErrors: string[] | null;
  geminiError: string | null;
  rawOutput: string | null;
  isGenerating: boolean;
  activeTab: 'overview' | 'requirements' | 'architecture' | 'data-ux' | 'reliability' | 'prompt' | 'json';
  setActiveTab: (tab: any) => void;
  rejectionStates: Record<string, { rejected: boolean; correction: string }>;
  setRejectionStates: (states: Record<string, { rejected: boolean; correction: string }>) => void;
  isRefining: boolean;
  refinementError: string | null;
  revisionCount: number;
  lastRefined: string | null;
  onEnhancePrompt: () => void;
  onRefineBlueprint: () => void;
  onCopy: (text: string, label: string) => void;
  onExportJSON: () => void;
  onExportMarkdown: () => void;
  onExportVibePacket: () => void;
  setGenerationMode: (mode: 'mock' | 'gemini' | 'custom_openai') => void;
  setGeminiError: (val: string | null) => void;
  debugMode: boolean;
  onOpenGoalBuilder?: (data: Partial<GoalContractData>) => void;
}

export const BlueprintExplorer: React.FC<BlueprintExplorerProps> = React.memo(({
  blueprint,
  recipeResult,
  validationErrors,
  geminiError,
  rawOutput,
  isGenerating,
  activeTab,
  setActiveTab,
  rejectionStates,
  setRejectionStates,
  isRefining,
  refinementError,
  revisionCount,
  lastRefined,
  onEnhancePrompt,
  onRefineBlueprint,
  onCopy,
  onExportJSON,
  onExportMarkdown,
  onExportVibePacket,
  setGenerationMode,
  setGeminiError,
  debugMode,
  onOpenGoalBuilder
}) => {
  if (isGenerating) return null;

  // 0. IF RECIPE RESULT MODE (NON-BLUEPRINT RECIPES)
  if (recipeResult) {
    return (
      <div className="flex-1 flex flex-col animate-fade-in" id="recipe-result-preview-state">
        
        {/* Banner with controls */}
        <div className="px-4 py-3 bg-slate-950/20 border-b border-[#1F1F1F] flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-400">✨</span>
            <span className="text-[10px] font-mono tracking-wider uppercase font-bold text-primary">
              Recipe: {recipeResult.recipeId.replace(/_/g, ' ')}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onCopy(recipeResult.content, 'Recipe Output')}
              className="text-[10px] bg-[#161616] hover:bg-[#222222] text-primary border border-[#262626] hover:border-primary/50 px-2.5 py-1.5 rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer font-bold font-mono uppercase tracking-wider"
              title="Copy output text to clipboard"
            >
              <Copy className="h-3.5 w-3.5 text-primary" /> Copy Content
            </button>
            <button
              type="button"
              onClick={() => onExportMarkdown()}
              className="text-[10px] bg-[#161616] hover:bg-[#222222] text-primary border border-[#262626] hover:border-primary/50 px-2.5 py-1.5 rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer font-bold font-mono uppercase tracking-wider"
              title="Export as Markdown file"
            >
              <Download className="h-3.5 w-3.5 text-primary" /> Export Markdown
            </button>
          </div>
        </div>

        {/* Content Explorer */}
        <div className="p-5 border-b border-[#1F1F1F] bg-[#161616]/20">
          <h2 className="font-sans text-sm md:text-base font-extrabold tracking-wider uppercase text-primary flex items-center gap-2 leading-snug">
            {recipeResult.title}
          </h2>
          <p className="text-[10px] text-slate-500 font-mono mt-1">FORMAT: {recipeResult.outputKind.toUpperCase()}</p>
        </div>

        <div className="flex-1 p-5 overflow-y-auto max-h-[620px] bg-[#0A0A0A] font-sans text-sm text-slate-350 leading-relaxed scroller-custom">
          <pre className="whitespace-pre-wrap break-words font-sans text-xs bg-black/45 border border-[#262626] p-4 rounded-xl text-slate-300">
            {recipeResult.content}
          </pre>
        </div>
      </div>
    );
  }

  // 1. ON VALIDATION ERROR STATE
  if (validationErrors) {
    return (
      <div className="flex-1 flex flex-col p-6 animate-fade-in" id="error-preview-state">
        <div className="bg-[#1F1414] border border-rose-950/30 p-4 rounded-xl flex items-start gap-3 mb-4">
          <div className="p-1 px-1.5 bg-rose-500/10 text-rose-400 rounded-lg">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-rose-300">
              Schema Validation Failed
            </h3>
            <p className="text-xs text-rose-400/80 mt-0.5 leading-normal">
              The generated system output does not conform to the strict schema_version '1.0' specification.
            </p>
          </div>
        </div>

        <div className="flex-1 bg-[#0A0A0A] border border-[#262626] rounded-xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 bg-[#111111] border-b border-[#262626] flex justify-between items-center">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">ERRORS COMMITTED:</span>
            <span className="text-rose-400 text-xs font-mono font-bold tracking-wider">{validationErrors.length} Schema Violations</span>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-rose-300 leading-relaxed flex flex-col gap-2">
            {validationErrors.map((err, idx) => (
              <div key={idx} className="flex gap-2 bg-rose-950/10 border border-[#3A1E1E]/50 p-2.5 rounded-lg">
                <span className="text-rose-500 font-bold select-none">{idx + 1}.</span>
                <span>{err}</span>
              </div>
            ))}
          </div>

          {/* Prompt repair footer advice */}
          <div className="p-3 bg-[#161616]/40 border-t border-[#262626] text-[11px] text-slate-400 leading-normal flex items-start gap-2">
            <span className="text-amber-400">💡</span>
            <p>
              Toggle off the **Test Schema Error Handler** switch in the left control column and click **Enhance** again to restore standard validated generation behaviors.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. ON GEMINI ERROR STATE
  if (geminiError) {
    return (
      <div className="flex-1 flex flex-col p-6 animate-fade-in" id="gemini-error-state">
        <div className="bg-[#1F1414] border border-rose-950/30 p-4 rounded-xl flex items-start gap-3 mb-4">
          <div className="p-1 px-1.5 bg-rose-500/10 text-rose-400 rounded-lg">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-rose-300">
              Gemini Service Refinement Failed
            </h3>
            <p className="text-xs text-rose-400/80 mt-1 leading-relaxed">
              {geminiError}
            </p>
            <div className="flex items-center gap-3 mt-3">
              <button
                type="button"
                onClick={() => {
                  setGenerationMode('mock');
                  setGeminiError(null);
                }}
                className="text-[10px] font-mono uppercase bg-[#161616] hover:bg-[#222222] text-primary px-3 py-1.5 rounded-lg border border-[#262626] cursor-pointer transition font-bold"
              >
                🎭 Use Mock Fallback
              </button>
              <button
                type="button"
                onClick={onEnhancePrompt}
                className="text-[10px] font-mono uppercase bg-primary hover:bg-primary-hover text-black px-3 py-1.5 rounded-lg cursor-pointer transition font-bold"
              >
                🔄 Retry Pipeline
              </button>
            </div>
          </div>
        </div>

        {debugMode && rawOutput && (
          <div className="flex-1 bg-[#0A0A0A] border border-[#262626] rounded-xl flex flex-col overflow-hidden">
            <div className="px-4 py-3 bg-[#111111] border-b border-[#262626]">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">RAW SYSTEM OUTPUT RECOVERED:</span>
            </div>
            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-slate-400 leading-relaxed bg-black/40">
              <pre className="whitespace-pre-wrap break-all text-[11px]">{rawOutput}</pre>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. SUCCESS BLUEPRINT RENDERER
  if (blueprint) {
    return (
      <div className="flex-1 flex flex-col animate-fade-in" id="success-preview-state">
        
        {/* Visual Verification Banner bar */}
        <div className="px-4 py-3 bg-emerald-950/20 border-b border-[#1F1F1F] flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="text-[10px] font-mono tracking-wider uppercase font-bold text-emerald-400">Verified Strict Schema V1.0 compliant</span>
          </div>
          
          {/* Instant copy & export controls */}
          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={() => onCopy(JSON.stringify(blueprint, null, 2), 'JSON Schema')}
              className="text-[10px] bg-[#161616] hover:bg-[#222222] text-primary border border-[#262626] hover:border-primary/50 px-2 md:px-2.5 py-1.5 rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer font-bold font-mono uppercase tracking-wider"
              title="Copy full parsed blueprint JSON code to clipboard"
            >
              <Copy className="h-3 w-3 text-primary" /> Copy JSON
            </button>
            <button
              type="button"
              onClick={onExportJSON}
              className="text-[10px] bg-[#161616] hover:bg-[#222222] text-primary border border-[#262626] hover:border-primary/50 px-2 md:px-2.5 py-1.5 rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer font-bold font-mono uppercase tracking-wider"
              title="Download full parsed template blueprint JSON file"
            >
              <Download className="h-3 w-3 text-primary" /> Export JSON
            </button>
            <button
              type="button"
              onClick={onExportMarkdown}
              className="text-[10px] bg-[#161616] hover:bg-[#222222] text-primary border border-[#262626] hover:border-primary/50 px-2 md:px-2.5 py-1.5 rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer font-bold font-mono uppercase tracking-wider"
              title="Download final system enhancer prompt as TXT/Markdown (.md)"
            >
              <ClipboardCheck className="h-3 w-3 text-primary" /> Export Prompt
            </button>
            <button
              type="button"
              onClick={onExportVibePacket}
              className="text-[10px] bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 px-2 md:px-2.5 py-1.5 rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer font-bold font-mono uppercase tracking-wider"
              title="Download the full conversation history, project context, raw prompts and requirements inside a single consolidated vibe packet file"
            >
              <Sparkles className="h-3 text-primary" /> Vibe Packet
            </button>
            <button
              type="button"
              onClick={() => {
                if (!blueprint) return;
                onOpenGoalBuilder?.({
                  title: blueprint.title,
                  objective: `${blueprint.summary}\n\nCore Objectives:\n${(blueprint.problem_clarification?.core_objectives || []).map(o => `- ${o}`).join('\n')}\n\nMust-Have Requirements:\n${(blueprint.functional_requirements?.must_have || []).map(req => `- ${req}`).join('\n')}`,
                  includedAssets: (blueprint.user_experience?.component_list || []).join('\n'),
                  verificationCommand: 'npm run test',
                  successMetric: 'All tests pass successfully.'
                });
              }}
              className="text-[10px] bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 px-2 md:px-2.5 py-1.5 rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer font-bold font-mono uppercase tracking-wider animate-pulse-subtle"
              title="Open the interactive /goal builder side-drawer to customize a system execution contract"
            >
              <Sliders className="h-3 text-primary" /> /goal Builder
            </button>
          </div>
        </div>

        {/* Main output header */}
        <div className="p-5 border-b border-[#1F1F1F] bg-[#161616]/20">
          <h2 className="font-sans text-sm md:text-base font-extrabold tracking-wider uppercase text-primary flex items-center gap-2 leading-snug">
            <Code className="h-4.5 w-4.5 text-primary" /> {blueprint.title}
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed mt-1.5">{blueprint.summary}</p>
          
          {/* Badges for Intent and Category */}
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-[9px] font-mono uppercase bg-[#161616] border border-[#262626] text-slate-400 px-2 py-1 rounded-md tracking-wider font-semibold">
              DOMAIN: {blueprint.intent_classification.detected_domain}
            </span>
            <span className={`text-[9px] font-mono uppercase px-2 py-1 rounded-md border tracking-wider font-semibold ${
              blueprint.intent_classification.request_type === 'new_build'
                ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30'
                : 'bg-primary/10 text-primary border-primary/20'
            }`}>
              TYPE: {blueprint.intent_classification.request_type}
            </span>
            <span className="text-[9px] font-mono uppercase bg-[#161616] border border-[#262626] text-amber-400 px-2 py-1 rounded-md tracking-wider font-semibold">
              CONFIDENCE: {blueprint.intent_classification.confidence}
            </span>
          </div>
        </div>

        {/* Interactive Inner Tab Controller */}
        <div className="border-b border-[#1F1F1F] bg-[#111111] flex overflow-x-auto scroller-custom scrollbar-none">
          {(['overview', 'requirements', 'architecture', 'data-ux', 'reliability', 'prompt', 'json'] as const).map((tab) => {
            const tabLabels: Record<string, string> = {
              overview: 'Overview',
              requirements: 'Requirements',
              architecture: 'Architecture',
              'data-ux': 'Data & UX',
              reliability: 'Reliability',
              prompt: 'Final Prompt',
              json: 'Raw JSON',
            };
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3.5 text-[10px] font-mono uppercase tracking-widest border-b-2 whitespace-nowrap transition cursor-pointer font-bold ${
                  activeTab === tab
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-transparent text-slate-400 hover:text-slate-300 hover:bg-[#161616]/50'
                }`}
              >
                {tabLabels[tab] || tab.toUpperCase()}
              </button>
            );
          })}
        </div>

        {/* TAB VIEWPORTS */}
        <div className="flex-1 p-5 overflow-y-auto max-h-[580px] bg-[#0A0A0A]">
          
          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-6 animate-fade-in" id="tab-overview-view">
              
              {/* Title & Summary Refined Block */}
              <div className="bg-[#161616]/40 border border-[#262626] rounded-xl p-4.5">
                <div className="text-[9px] text-primary font-mono uppercase tracking-widest mb-1.5 font-bold">REFINED TARGET</div>
                <h3 className="font-sans text-sm font-bold uppercase tracking-wider text-slate-100 mb-2">
                  {blueprint.title || "Not specified"}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {blueprint.summary || "Not specified"}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-[#262626]/60 pt-3">
                  <div className="bg-black/30 p-2.5 rounded-lg border border-[#262626]/40">
                    <span className="text-[9px] text-slate-500 font-mono uppercase block mb-0.5 tracking-wider">Request Type</span>
                    <span className="text-xs font-mono font-semibold capitalize text-primary">
                      {blueprint.intent_classification.request_type ? blueprint.intent_classification.request_type.replace(/_/g, ' ') : "Not specified"}
                    </span>
                  </div>
                  <div className="bg-black/30 p-2.5 rounded-lg border border-[#262626]/40">
                    <span className="text-[9px] text-slate-500 font-mono uppercase block mb-0.5 tracking-wider">Refinery Confidence</span>
                    <span className={`text-xs font-mono font-semibold capitalize ${
                      blueprint.intent_classification.confidence === 'high' ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {blueprint.intent_classification.confidence || "Not specified"}
                    </span>
                  </div>
                  <div className="bg-black/30 p-2.5 rounded-lg border border-[#262626]/40">
                    <span className="text-[9px] text-slate-500 font-mono uppercase block mb-0.5 tracking-wider">Detected Domain</span>
                    <span className="text-xs font-mono font-semibold text-slate-300">
                      {blueprint.intent_classification.detected_domain || "Not specified"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Problem Expanded Description */}
              <div className="flex flex-col gap-2">
                <h3 className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest">
                  Expanded Problem Statement
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed bg-[#161616]/40 border border-[#262626] p-4 rounded-xl">
                  {blueprint.problem_clarification.expanded_description || "Not specified"}
                </p>
              </div>

              {/* Core Objectives & Primary Users */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#161616]/40 border border-[#262626] rounded-xl p-4">
                  <h4 className="text-[10px] font-mono font-bold text-slate-200 tracking-wider uppercase mb-2.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> Core Objectives
                  </h4>
                  {blueprint.problem_clarification.core_objectives && blueprint.problem_clarification.core_objectives.length > 0 ? (
                    <ul className="text-xs text-slate-350 leading-loose list-disc list-inside flex flex-col gap-1.5">
                      {blueprint.problem_clarification.core_objectives.map((obj, i) => (
                        <li key={i}>{obj}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Not specified</p>
                  )}
                </div>

                <div className="bg-[#161616]/40 border border-[#262626] rounded-xl p-4">
                  <h4 className="text-[10px] font-mono font-bold text-slate-200 tracking-wider uppercase mb-2.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> Target Demographics
                  </h4>
                  {blueprint.problem_clarification.primary_users && blueprint.problem_clarification.primary_users.length > 0 ? (
                    <ul className="text-xs text-slate-350 leading-loose list-disc list-inside flex flex-col gap-1.5">
                      {blueprint.problem_clarification.primary_users.map((usr, i) => (
                        <li key={i}>{usr}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Not specified</p>
                  )}
                </div>
              </div>

              {/* Constraint Parameters */}
              <div className="flex flex-col gap-2.5">
                <h3 className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest">
                  Scope Boundaries & Constraints
                </h3>
                {blueprint.problem_clarification.constraints && blueprint.problem_clarification.constraints.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {blueprint.problem_clarification.constraints.map((itm, i) => (
                      <div key={i} className="bg-[#161616]/40 border border-[#262626] p-3 rounded-lg flex items-center gap-2.5 text-xs text-slate-300 leading-normal">
                        <span className="bg-rose-500/10 text-rose-450 font-mono font-bold text-[9px] px-1.5 py-0.5 rounded border border-rose-950/30 shrink-0">LIMIT</span>
                        <span>{itm}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#161616]/40 border border-[#262626] p-3.5 rounded-lg text-xs italic text-slate-500">
                    No custom project constraints are registered for this blueprint.
                  </div>
                )}
              </div>

              {/* Assumptions Cards Block */}
              <div className="flex flex-col gap-2.5">
                <h3 className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest">
                  Engineering Hypotheses & Assumptions
                </h3>
                {blueprint.problem_clarification.assumptions && blueprint.problem_clarification.assumptions.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
                      {blueprint.problem_clarification.assumptions.map((ass) => {
                        const assState = rejectionStates[ass.id] || { rejected: false, correction: '' };
                        return (
                          <div key={ass.id} className={`bg-[#111111] border rounded-xl p-4 flex flex-col justify-between transition gap-3.5 shadow-md ${assState.rejected ? 'border-rose-900/55 bg-[#200e0e]/20' : 'border-[#262626] hover:bg-[#161616]/60'}`}>
                            <div className="flex flex-col gap-2">
                              <div className="flex items-start justify-between gap-2 border-b border-[#222222]/60 pb-2">
                                <div className="flex items-center gap-2">
                                  <label className="flex items-center gap-1.5 cursor-pointer group">
                                    <input
                                      type="checkbox"
                                      checked={assState.rejected}
                                      onChange={(e) => {
                                        setRejectionStates({
                                          ...rejectionStates,
                                          [ass.id]: {
                                            rejected: e.target.checked,
                                            correction: e.target.checked ? (assState.correction || '') : ''
                                          }
                                        });
                                      }}
                                      className="w-3.5 h-3.5 rounded border-[#333] bg-[#1a1a1a] text-rose-500 focus:ring-rose-550/20"
                                    />
                                    <span className={`text-[9px] font-mono uppercase tracking-wide font-bold ${assState.rejected ? 'text-rose-455' : 'text-slate-400 group-hover:text-slate-355'}`}>
                                      {assState.rejected ? 'Reject' : 'Keep'}
                                    </span>
                                  </label>
                                </div>
                                <div className="flex gap-1.5 flex-wrap justify-end">
                                  <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded font-bold tracking-wide border ${
                                    ass.confidence === 'high'
                                      ? 'bg-emerald-950/25 border-emerald-900/30 text-emerald-400'
                                      : ass.confidence === 'medium'
                                      ? 'bg-amber-950/25 border-amber-900/30 text-amber-400'
                                      : 'bg-rose-950/25 border-rose-900/30 text-rose-400'
                                  }`}>
                                    {ass.confidence}
                                  </span>
                                  <span className="bg-slate-900 border border-slate-800 text-slate-400 text-[8px] font-mono uppercase px-1.5 py-0.5 rounded font-bold tracking-wide">
                                    {ass.source ? ass.source.replace(/_/g, ' ') : 'default'}
                                  </span>
                                </div>
                              </div>
                              <p className={`text-xs leading-relaxed font-sans mt-1 ${assState.rejected ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                                {ass.text}
                              </p>
                            </div>

                            {/* Correction input detail textarea */}
                            {assState.rejected && (
                              <div className="mt-2 text-left animate-slide-in">
                                <label className="block text-[8px] font-mono font-bold text-rose-450 uppercase tracking-widest mb-1">
                                  Correction Feedback
                                </label>
                                <textarea
                                  rows={2}
                                  value={assState.correction}
                                  onChange={(e) => {
                                    setRejectionStates({
                                      ...rejectionStates,
                                      [ass.id]: {
                                        rejected: true,
                                        correction: e.target.value
                                      }
                                    });
                                  }}
                                  placeholder="Provide context on why this is incorrect..."
                                  className="w-full bg-[#1A1111] border border-rose-900/50 rounded-lg p-2 text-xs text-rose-200 placeholder-rose-900/60 focus:outline-none focus:ring-0 focus:border-rose-500"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Submit refinement loop adjustment panel */}
                    <div className="bg-[#111111] border border-[#222222] rounded-xl p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">REFINEMENT DECK STATUS</span>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-xs text-slate-300">
                            Rejections: <strong>{Object.values(rejectionStates).filter((x: any) => x.rejected).length} Assumption(s)</strong>
                          </span>
                          {revisionCount > 0 && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                              <span className="text-xs text-primary font-mono">
                                Revision Cycle #{revisionCount}
                              </span>
                            </>
                          )}
                          {lastRefined && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                              <span className="text-xs text-slate-500">
                                Last updated: {lastRefined}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isRefining || Object.values(rejectionStates).filter((x: any) => x.rejected).length === 0}
                        onClick={onRefineBlueprint}
                        className={`text-xs font-mono uppercase font-bold px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          Object.values(rejectionStates).filter((x: any) => x.rejected).length === 0
                            ? 'bg-[#1E1E1E] border border-[#262626] text-slate-600 cursor-not-allowed'
                            : 'bg-primary hover:bg-primary-hover text-black font-bold shadow-lg shadow-primary/15'
                        }`}
                      >
                        {isRefining ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin text-black" />
                            <span>Refining Loop...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3.5 w-3.5 text-black fill-black" />
                            <span>Refine Assumptions</span>
                          </>
                        )}
                      </button>
                    </div>

                    {refinementError && (
                      <div className="bg-[#1F1414] border border-rose-950/20 p-3 rounded-lg text-xs text-rose-450 leading-relaxed font-mono">
                        Refinement Loop Error: {refinementError}
                      </div>
                    )}

                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic bg-[#0A0A0A] p-4 border border-[#202020] rounded-xl">No assumptions generated.</p>
                )}
              </div>

            </div>
          )}

          {/* Tab 2: Requirements */}
          {activeTab === 'requirements' && (
            <div className="flex flex-col gap-6 animate-fade-in" id="tab-reqs-view">
              
              <div className="flex flex-col gap-1.5">
                <h3 className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest">
                  Functional Boundaries (MoSCoW Matrix)
                </h3>
                <p className="text-[11px] text-slate-400">Strictly governs development scope. Promotes high visual craft within finite goals.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Must Have */}
                <div className="border border-emerald-950/40 bg-emerald-950/5 rounded-xl p-4">
                  <div className="flex items-center justify-between border-b border-emerald-950/20 pb-2 mb-3">
                    <h4 className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Must Have
                    </h4>
                    <span className="text-[9px] text-emerald-500/80 font-mono uppercase bg-emerald-950/20 border border-emerald-900/20 px-1.5 py-0.5 rounded font-bold tracking-wider">Core Logic</span>
                  </div>
                  {blueprint.functional_requirements.must_have && blueprint.functional_requirements.must_have.length > 0 ? (
                    <ul className="text-xs text-slate-300 flex flex-col gap-2.5 list-none">
                      {blueprint.functional_requirements.must_have.map((itm, i) => (
                        <li key={i} className="flex gap-2 items-start leading-relaxed animate-fade-in">
                          <span className="text-emerald-500 font-bold select-none">✓</span>
                          <span>{itm}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Not specified</p>
                  )}
                </div>

                {/* Should Have */}
                <div className="border border-primary/20 bg-primary/5 rounded-xl p-4">
                  <div className="flex items-center justify-between border-b border-primary/15 pb-2 mb-3">
                    <h4 className="text-[10px] font-mono font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary"></span> Should Have
                    </h4>
                    <span className="text-[9px] text-primary font-mono uppercase bg-primary/10 border border-primary/25 px-1.5 py-0.5 rounded font-bold tracking-wider">Enhancement</span>
                  </div>
                  {blueprint.functional_requirements.should_have && blueprint.functional_requirements.should_have.length > 0 ? (
                    <ul className="text-xs text-slate-300 flex flex-col gap-2.5 list-none">
                      {blueprint.functional_requirements.should_have.map((itm, i) => (
                        <li key={i} className="flex gap-2 items-start leading-relaxed animate-fade-in">
                          <span className="text-primary font-bold select-none">•</span>
                          <span>{itm}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Not specified</p>
                  )}
                </div>

                {/* Could Have */}
                <div className="border border-[#262626] bg-[#111111]/40 rounded-xl p-4">
                  <div className="flex items-center justify-between border-b border-[#262626]/40 pb-2 mb-3">
                    <h4 className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-500"></span> Could Have
                    </h4>
                    <span className="text-[9px] text-slate-500 font-mono uppercase bg-[#161616] border border-[#262626] px-1.5 py-0.5 rounded font-bold tracking-wider">Optional</span>
                  </div>
                  {blueprint.functional_requirements.could_have && blueprint.functional_requirements.could_have.length > 0 ? (
                    <ul className="text-xs text-slate-300 flex flex-col gap-2.5 list-none">
                      {blueprint.functional_requirements.could_have.map((itm, i) => (
                        <li key={i} className="flex gap-2 items-start leading-relaxed animate-fade-in">
                          <span className="text-slate-500 select-none">◦</span>
                          <span>{itm}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Not specified</p>
                  )}
                </div>

                {/* Wont Have */}
                <div className="border border-rose-950/20 bg-rose-950/5 rounded-xl p-4">
                  <div className="flex items-center justify-between border-b border-rose-950/15 pb-2 mb-3">
                    <h4 className="text-[10px] font-mono font-bold text-rose-300 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-900"></span> Won't Have
                    </h4>
                    <span className="text-[9px] text-rose-400 font-mono uppercase bg-rose-950/20 border border-rose-900/30 px-1.5 py-0.5 rounded font-bold tracking-wider">Out of Scope</span>
                  </div>
                  {blueprint.functional_requirements.wont_have && blueprint.functional_requirements.wont_have.length > 0 ? (
                    <ul className="text-xs text-slate-400 flex flex-col gap-2.5 list-none">
                      {blueprint.functional_requirements.wont_have.map((itm, i) => (
                        <li key={i} className="flex gap-2 items-start leading-relaxed line-through decoration-slate-800 animate-fade-in">
                          <span className="text-rose-500 font-bold select-none">✕</span>
                          <span>{itm}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Not specified</p>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* Tab 3: Architecture */}
          {activeTab === 'architecture' && (
            <div className="flex flex-col gap-6 animate-fade-in" id="tab-arch-view">
              
              {/* General Framework matrix */}
              <div className="flex flex-col gap-2.5">
                <h3 className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest">
                  Tech Stack Allocations
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-[#161616]/45 border border-[#262626] p-3.5 rounded-xl flex flex-col gap-1.5 animate-fade-in">
                    <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Paradigm</span>
                    <span className="text-xs font-semibold font-mono text-primary">{blueprint.architecture.paradigm || "Not specified"}</span>
                  </div>
                  <div className="bg-[#161616]/45 border border-[#262626] p-3.5 rounded-xl flex flex-col gap-1.5 animate-fade-in">
                    <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Frontend Framework</span>
                    <span className="text-xs font-semibold font-mono text-primary">{blueprint.architecture.frontend || "Not specified"}</span>
                  </div>
                  <div className="bg-[#161616]/45 border border-[#262626] p-3.5 rounded-xl flex flex-col gap-1.5 animate-fade-in">
                    <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Backend Tier</span>
                    <span className="text-xs font-semibold font-mono text-primary">{blueprint.architecture.backend || "Not specified"}</span>
                  </div>
                  <div className="bg-[#161616]/45 border border-[#262626] p-3.5 rounded-xl flex flex-col gap-1.5 animate-fade-in">
                    <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Database Platform</span>
                    <span className="text-xs font-semibold font-mono text-primary">{blueprint.architecture.database || "Not specified"}</span>
                  </div>
                  <div className="bg-[#161616]/45 border border-[#262626] p-3.5 rounded-xl flex flex-col gap-1.5 animate-fade-in">
                    <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">APIs & Protocols</span>
                    <span className="text-xs font-semibold font-mono text-primary">{blueprint.architecture.apis || "Not specified"}</span>
                  </div>
                  <div className="bg-[#161616]/45 border border-[#262626] p-3.5 rounded-xl flex flex-col gap-1.5 animate-fade-in">
                    <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Infrastructure & Host</span>
                    <span className="text-xs font-semibold font-mono text-primary">{blueprint.architecture.infra || "Not specified"}</span>
                  </div>
                </div>
              </div>

              {/* Services Block */}
              <div className="bg-[#161616]/20 border border-[#262626] rounded-xl p-4.5 flex flex-col gap-3">
                <div>
                  <h4 className="text-[10px] font-mono font-bold text-slate-200 tracking-wider uppercase mb-1">
                    Core Modules & Microservices
                  </h4>
                  <p className="text-[10px] text-slate-500 leading-normal">Distinct, authoritatively designated logical system service blocks.</p>
                </div>
                {blueprint.architecture.services && blueprint.architecture.services.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 animate-fade-in">
                    {blueprint.architecture.services.map((srv, idx) => (
                      <div key={idx} className="bg-[#0A0A0A] border border-[#262626] p-2.5 px-3 rounded-lg flex items-center gap-2 font-mono text-[11px] text-slate-300">
                        <span className="text-primary text-xs font-bold shrink-0">⚙</span>
                        <span>{srv}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic bg-[#0A0A0A] p-3 border border-[#202020] rounded-lg">No separate microservices specified</p>
                )}
              </div>

              {/* Ecosystem Integrations */}
              <div className="bg-[#161616]/20 border border-[#262626] rounded-xl p-4.5 flex flex-col gap-3">
                <div>
                  <h4 className="text-[10px] font-mono font-bold text-slate-200 tracking-wider uppercase mb-1">
                    System & Third-Party Integrations
                  </h4>
                  <p className="text-[10px] text-slate-500 leading-normal">Primary third-party API adapters and external service dependencies.</p>
                </div>
                {blueprint.architecture.integrations && blueprint.architecture.integrations.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 animate-fade-in">
                    {blueprint.architecture.integrations.map((int, idx) => (
                      <div key={idx} className="bg-[#0A0A0A] border border-[#262626] p-2.5 px-3 rounded-lg flex items-center gap-2 font-mono text-[11px] text-slate-300">
                        <span className="text-emerald-500 text-xs font-bold shrink-0">🔌</span>
                        <span>{int}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic bg-[#0A0A0A] p-3 border border-[#202020] rounded-lg">No external integrations specified</p>
                )}
              </div>

              {/* Infrastructure & DevOps Strategy */}
              <div className="flex flex-col gap-2">
                <h3 className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest">
                  DevOps Strategy & Release Engineering
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed bg-[#161616]/40 border border-[#262626] p-4 rounded-xl font-mono text-[11.5px]">
                  {blueprint.architecture.devops || "Not specified"}
                </p>
              </div>

            </div>
          )}

          {/* Tab 4: Data & UX */}
          {activeTab === 'data-ux' && (
            <div className="flex flex-col gap-6 animate-fade-in" id="tab-dataux-view">
              
              {/* Left-Right split of entities and design elements */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                
                {/* Data models column */}
                <div className="flex flex-col gap-4 bg-[#161616]/20 border border-[#262626] p-4.5 rounded-xl">
                  <div>
                    <h3 className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest mb-1 animate-pulse">
                      Memory States & Entity Schemas
                    </h3>
                    <p className="text-[10px] text-slate-500">Persistent database models, schema contracts, and logic models.</p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-[9px] text-slate-500 font-bold font-mono tracking-wider">ENTITIES LAYER</span>
                    {blueprint.data_models.entities && blueprint.data_models.entities.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {blueprint.data_models.entities.map((ent, idx) => (
                          <span key={idx} className="bg-[#0A0A0A] border border-[#262626] px-2.5 py-1 rounded text-xs font-mono text-slate-300">
                            {ent}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs italic text-slate-500">Not specified</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 mt-2">
                    <span className="text-[9px] text-slate-500 font-bold font-mono tracking-wider">INTERFACE & DEFINITIONS</span>
                    {blueprint.data_models.schemas && blueprint.data_models.schemas.length > 0 ? (
                      <pre className="font-mono text-[11px] text-emerald-400/95 leading-relaxed p-3 bg-black border border-[#262626] rounded-lg max-h-[260px] overflow-y-auto">
                        {blueprint.data_models.schemas.join('\n')}
                      </pre>
                    ) : (
                      <p className="text-xs italic text-slate-500">Not specified</p>
                    )}
                  </div>
                </div>

                {/* Visual Styles Column */}
                <div className="flex flex-col gap-4 bg-[#161616]/20 border border-[#262626] p-4.5 rounded-xl">
                  <div>
                    <h3 className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest mb-1">
                      Aesthetic Pairings & UX
                    </h3>
                    <p className="text-[10px] text-slate-500">Styling targets, spatial systems, and user navigation frameworks.</p>
                  </div>

                  <div className="flex flex-col gap-3 text-xs leading-relaxed text-slate-300">
                    <div>
                      <span className="text-[9px] text-slate-500 font-mono font-bold uppercase block mb-1">Design Style & Mood</span>
                      <p className="bg-[#0A0A0A] p-2.5 rounded-lg border border-[#262626]/60 leading-normal">{blueprint.user_experience.design_style || "Not specified"}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-mono font-bold uppercase block mb-1">Layout System</span>
                      <p className="bg-[#0A0A0A] p-2.5 rounded-lg border border-[#262626]/60 leading-normal">{blueprint.user_experience.layout_system || "Not specified"}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-mono font-bold uppercase block mb-1">Navigation Structure</span>
                      <p className="bg-[#0A0A0A] p-2.5 rounded-lg border border-[#262626]/60 leading-normal">{blueprint.user_experience.navigation_structure || "Not specified"}</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Animations, Interaction states, Accessibility Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#161616]/40 border border-[#262626] p-4 rounded-xl flex flex-col gap-2">
                  <h4 className="text-[10px] font-mono font-bold text-primary uppercase tracking-wider">Animations Guide</h4>
                  <p className="text-xs text-slate-300 leading-normal bg-[#0A0A0A]/40 border border-[#262626]/40 p-2.5 rounded-lg">
                    {blueprint.user_experience.animations || "Not specified"}
                  </p>
                </div>
                <div className="bg-[#161616]/40 border border-[#262626] p-4 rounded-xl flex flex-col gap-2">
                  <h4 className="text-[10px] font-mono font-bold text-primary uppercase tracking-wider">Accessibility Standards</h4>
                  <p className="text-xs text-slate-300 leading-normal bg-[#0A0A0A]/40 border border-[#262626]/40 p-2.5 rounded-lg">
                    {blueprint.user_experience.accessibility || "Not specified"}
                  </p>
                </div>
                <div className="bg-[#161616]/40 border border-[#262626] p-4 rounded-xl flex flex-col gap-2">
                  <h4 className="text-[10px] font-mono font-bold text-primary uppercase tracking-wider">UI Interaction States</h4>
                  {blueprint.user_experience.interaction_states && blueprint.user_experience.interaction_states.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {blueprint.user_experience.interaction_states.map((st, idx) => (
                        <span key={idx} className="bg-primary/15 border border-primary/25 text-primary text-[9px] font-mono px-2 py-0.5 rounded">
                          {st}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-500 italic bg-[#0A0A0A]/40 border border-[#262626]/40 p-2 rounded">Not specified</p>
                  )}
                </div>
              </div>

              {/* Interactive Client Component List */}
              <div className="bg-[#161616]/40 border border-[#262626] rounded-xl p-4">
                <h4 className="text-[10px] font-mono font-bold text-slate-200 uppercase tracking-wider mb-3">
                  Client UI Component Manifest
                </h4>
                {blueprint.user_experience.component_list && blueprint.user_experience.component_list.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {blueprint.user_experience.component_list.map((comp, idx) => (
                      <span key={idx} className="bg-[#0A0A0A] hover:bg-[#111111] border border-[#262626] text-primary text-[10px] font-mono px-3 py-1.5 rounded-lg transition font-semibold">
                        {`<${comp} />`}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Not specified</p>
                )}
              </div>

              {/* User flows */}
              <div className="bg-[#161616]/40 border border-[#262626] rounded-xl p-4.5">
                <h4 className="text-[10px] font-mono font-bold text-slate-200 uppercase tracking-wider mb-3">
                  UX Interaction & Navigation Flows
                </h4>
                {blueprint.user_experience.user_flows && blueprint.user_experience.user_flows.length > 0 ? (
                  <div className="flex flex-col gap-2.5">
                    {blueprint.user_experience.user_flows.map((fl, idx) => (
                      <div key={idx} className="flex gap-3 bg-[#0A0A0A] border border-[#262626] p-3 rounded-xl items-start">
                        <span className="bg-primary/15 text-primary font-mono text-[10px] w-6 h-6 rounded-full flex items-center justify-center font-bold border border-primary/25 shrink-0">
                          {idx + 1}
                        </span>
                        <p className="text-xs text-slate-300 leading-normal font-sans mt-0.5">{fl}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Not specified</p>
                )}
              </div>

            </div>
          )}

          {/* Tab 5: Reliability */}
          {activeTab === 'reliability' && (
            <div className="flex flex-col gap-6 animate-fade-in" id="tab-rely-view">
              
              {/* Security Parameters group */}
              <div className="bg-[#161616]/30 border border-[#262626] rounded-xl p-4.5 flex flex-col gap-4">
                <div>
                  <h4 className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest mb-1">
                    Security & Authorization Rules
                  </h4>
                  <p className="text-[10px] text-slate-500">Critical privacy gates, token algorithms, and payload hygiene.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed text-slate-300">
                  <div className="bg-[#0A0A0A] p-3 rounded-lg border border-[#262626]">
                    <span className="font-bold text-slate-500 text-[9px] block uppercase mb-1.5 tracking-wide font-mono">Authentication Mode:</span>
                    <span>{blueprint.security_reliability.authentication || "Not specified"}</span>
                  </div>
                  <div className="bg-[#0A0A0A] p-3 rounded-lg border border-[#262626]">
                    <span className="font-bold text-slate-500 text-[9px] block uppercase mb-1.5 tracking-wide font-mono">Authorization & Permissions:</span>
                    <span>{blueprint.security_reliability.authorization || "Not specified"}</span>
                  </div>
                  <div className="bg-[#0A0A0A] p-3 rounded-lg border border-[#262626]">
                    <span className="font-bold text-slate-500 text-[9px] block uppercase mb-1.5 tracking-wide font-mono">Schema & Input Validation:</span>
                    <span>{blueprint.security_reliability.data_validation || "Not specified"}</span>
                  </div>
                  <div className="bg-[#0A0A0A] p-3 rounded-lg border border-[#262626]">
                    <span className="font-bold text-slate-500 text-[9px] block uppercase mb-1.5 tracking-wide font-mono">API Rate Limiting System:</span>
                    <span>{blueprint.security_reliability.rate_limiting || "Not specified"}</span>
                  </div>
                  <div className="bg-[#0A0A0A] p-3 rounded-lg border border-[#262626]">
                    <span className="font-bold text-slate-500 text-[9px] block uppercase mb-1.5 tracking-wide font-mono">Compliance & Data Privacy:</span>
                    <span>{blueprint.security_reliability.privacy || "Not specified"}</span>
                  </div>
                  <div className="bg-[#0A0A0A] p-3 rounded-lg border border-[#262626]">
                    <span className="font-bold text-slate-500 text-[9px] block uppercase mb-1.5 tracking-wide font-mono">Error Handlers & Failsafes:</span>
                    <span>{blueprint.security_reliability.error_handling || "Not specified"}</span>
                  </div>
                  <div className="bg-[#0A0A0A] p-3 rounded-lg border border-[#262626] md:col-span-2">
                    <span className="font-bold text-slate-500 text-[9px] block uppercase mb-1.5 tracking-wide font-mono">Production Auditing & Throttler Telemetry:</span>
                    <span>{blueprint.security_reliability.logging_monitoring || "Not specified"}</span>
                  </div>
                </div>
              </div>

              {/* Performance targets */}
              <div className="bg-[#161616]/30 border border-[#262626] rounded-xl p-4.5 flex flex-col gap-4">
                <div>
                  <h4 className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest mb-1">
                    Performance & SLA Targets
                  </h4>
                  <p className="text-[10px] text-slate-500">Target latency, local machine bounds, and operational scales.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs leading-relaxed text-slate-300">
                  <div className="bg-[#0A0A0A] p-3 rounded-lg border border-[#262626]">
                    <span className="font-bold text-slate-500 text-[9px] block mb-1 tracking-wide font-mono uppercase">App Scalability Profile</span>
                    <p>{blueprint.performance_constraints.scalability || "Not specified"}</p>
                  </div>
                  <div className="bg-[#0A0A0A] p-3 rounded-lg border border-[#262626]">
                    <span className="font-bold text-slate-500 text-[9px] block mb-1 tracking-wide font-mono uppercase">Max Load Latency Bounds</span>
                    <p className="font-mono text-[11px] text-primary font-bold">{blueprint.performance_constraints.latency || "Not specified"}</p>
                  </div>
                  <div className="bg-[#0A0A0A] p-3 rounded-lg border border-[#262626]">
                    <span className="font-bold text-slate-500 text-[9px] block mb-1 tracking-wide font-mono uppercase">Expected Load Volume</span>
                    <p>{blueprint.performance_constraints.load_expectations || "Not specified"}</p>
                  </div>
                  <div className="bg-[#0A0A0A] p-3 rounded-lg border border-[#262626]">
                    <span className="font-bold text-slate-500 text-[9px] block mb-1 tracking-wide font-mono uppercase">Device Resource Constraints</span>
                    <p>{blueprint.performance_constraints.resource_constraints || "Not specified"}</p>
                  </div>
                </div>
              </div>

              {/* Edge cases tracker */}
              <div className="bg-[#1F1414] border border-[#3A1E1E]/50 rounded-xl p-4.5 flex flex-col gap-2.5">
                <h4 className="text-[10px] font-mono font-bold text-rose-300 uppercase tracking-widest flex items-center gap-2">
                  🚨 Anticipated Critical Edge Cases & Fail-safes
                </h4>
                {blueprint.edge_cases && blueprint.edge_cases.length > 0 ? (
                  <div className="flex flex-col gap-2 text-xs">
                    {blueprint.edge_cases.map((ec, idx) => (
                      <div key={idx} className="flex gap-2.5 items-start leading-relaxed bg-[#0A0A0A]/40 p-2.5 border border-rose-950/20 rounded-lg">
                        <span className="text-rose-500 font-bold select-none">⚠️</span>
                        <span>{ec}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">None specified</p>
                )}
              </div>

              {/* Developer Notes / Complexity guides */}
              <div className="bg-amber-955/5 border border-amber-900/15 rounded-xl p-4.5 flex flex-col gap-2.5">
                <h4 className="text-[10px] font-mono font-bold text-amber-300 uppercase tracking-widest flex items-center gap-2">
                  💡 Developer Execution Notes
                </h4>
                {blueprint.developer_notes && blueprint.developer_notes.length > 0 ? (
                  <div className="flex flex-col gap-2 text-xs font-mono text-[11px] text-slate-300 leading-relaxed">
                    {blueprint.developer_notes.map((note, idx) => (
                      <div key={idx} className="flex gap-2 items-start bg-[#0A0A0A]/30 p-2.5 border border-amber-950/20 rounded-lg">
                        <span className="text-amber-400 select-none font-bold">▪</span>
                        <p>{note}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">None specified</p>
                )}
              </div>

            </div>
          )}

          {/* Tab 6: Final Prompt */}
          {activeTab === 'prompt' && (
            <div className="flex flex-col gap-4 animate-fade-in" id="tab-prompt-view">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest animate-pulse">
                    Refined Execution Prompt
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">Copy this detailed directive directly into secondary coding agents.</p>
                </div>
                <button
                  type="button"
                  onClick={() => onCopy(blueprint.final_prompt, 'Refined Prompt')}
                  className="bg-primary hover:bg-primary-hover text-black text-[10px] font-mono uppercase font-bold px-3 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer shadow-lg shadow-primary/15"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy Prompt
                </button>
              </div>

              {/* Stat summary counters */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#161616]/40 border border-[#262626] p-3 rounded-lg text-center font-mono">
                  <span className="text-[9px] text-slate-500 uppercase block tracking-wider">Total Characters</span>
                  <span className="text-sm font-semibold text-primary">{blueprint.final_prompt.length} CHR</span>
                </div>
                <div className="bg-[#161616]/40 border border-[#262626] p-3 rounded-lg text-center font-mono">
                  <span className="text-[9px] text-slate-500 uppercase block tracking-wider">Estimated Word Count</span>
                  <span className="text-sm font-semibold text-primary">
                    {blueprint.final_prompt.trim().split(' ').filter((w) => w.length > 0).length} WRD
                  </span>
                </div>
              </div>

              <div className="bg-[#0A0A0A] border-2 border-primary/20 focus-within:border-primary/50 rounded-xl overflow-hidden shadow-2xl relative group">
                <div className="px-4 py-2 bg-[#111111] border-b border-[#262626] text-[10px] text-slate-500 flex items-center justify-between font-mono tracking-wider font-bold">
                  <span>AGENT DIRECTIVE PAYLOAD</span>
                  <span className="text-primary">PRESERVES RAW LAYOUT WHITESPACE</span>
                </div>
                
                {/* Floating Quick Copy button */}
                <button
                  type="button"
                  onClick={() => onCopy(blueprint.final_prompt, 'Refined Prompt')}
                  className="absolute right-3 top-12 z-10 bg-primary hover:bg-primary-hover text-black p-2.5 rounded-lg shadow-lg hover:scale-105 transition cursor-pointer md:opacity-0 md:group-hover:opacity-100 duration-200"
                  title="Copy refined prompt"
                >
                  <Copy className="h-4 w-4" />
                </button>

                <textarea
                  readOnly
                  rows={15}
                  value={blueprint.final_prompt}
                  className="w-full bg-transparent font-mono text-xs p-4 leading-relaxed text-slate-100 outline-none resize-none focus:ring-0 border-0"
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                />
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-xs text-primary/90 leading-relaxed flex items-start gap-3">
                <div className="p-1 px-1.5 bg-primary/10 text-primary rounded">
                  <Zap className="h-4.5 w-4.5" />
                </div>
                <p>
                  <strong>Instruction tuning note:</strong> This prompt blocks unrequested libraries, defines key state parameters upfront, and ensures clean mobile-first layout styling standardizing development speed.
                </p>
              </div>

            </div>
          )}

          {/* Tab 7: Raw JSON */}
          {activeTab === 'json' && (
            <div className="flex flex-col gap-4 animate-fade-in" id="tab-json-view">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest">
                    Raw Blueprint JSON Spec
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">Detailed metadata parsed matching Schema version '1.0' contract.</p>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => onCopy(JSON.stringify(blueprint, null, 2), 'JSON Specification')}
                    className="bg-[#161616] hover:bg-[#222222] text-primary border border-[#262626] text-[10px] font-mono uppercase font-bold px-3 py-2.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Copy className="h-3.5 w-3.5" /> Copy JSON
                  </button>
                  <button
                    type="button"
                    onClick={onExportJSON}
                    className="bg-primary hover:bg-primary-hover text-black text-[10px] font-mono uppercase font-bold px-3 py-2.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-primary/20"
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </button>
                </div>
              </div>

              <div className="bg-[#0A0A0A] border border-[#262626] rounded-xl overflow-hidden shadow-2xl relative">
                <div className="px-4 py-2 bg-[#111111] border-b border-[#262626] text-[10px] text-slate-500 flex items-center justify-between font-mono tracking-wider font-bold">
                  <span>PARSED METADATA SPECIFICATION</span>
                  <span className="text-primary">SCHEMA_VERSION "1.0"</span>
                </div>
                <pre className="font-mono text-xs text-emerald-400 leading-relaxed p-4 max-h-[360px] overflow-y-auto block whitespace-pre bg-black">
                  {JSON.stringify(blueprint, null, 2)}
                </pre>
              </div>

              {/* Display original model raw output if cached for debugging - Gated by debugMode */}
              {debugMode && rawOutput && (
                <div className="flex flex-col gap-2 mt-2">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                    Original Model Response Token Buffer (Debug)
                  </span>
                  <div className="bg-[#111111] border border-rose-950/20 rounded-xl overflow-hidden">
                    <div className="px-4 py-2 bg-rose-950/5 border-b border-[#1F1F1F] text-[9px] font-mono text-rose-300">
                      RAW SYSTEM OUTPUT CACHED AT INVOCATION BOUNDARY
                    </div>
                    <pre className="font-mono text-[10px] text-slate-400 leading-relaxed p-4 max-h-[160px] overflow-y-auto block whitespace-pre-wrap break-all">
                      {rawOutput}
                    </pre>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Explorer stats bar */}
        <div className="p-3 bg-[#0E0E0E] border-t border-[#1F1F1F] text-[9px] font-mono text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2 tracking-wider">
          <span>BLUEPRINT METADATA REF: PB-{blueprint.title.slice(0, 3).toUpperCase()}-1.0</span>
          <span>COMPILED AT 2026-05-31 (LOCAL CLIENT SANDBOX)</span>
        </div>

      </div>
    );
  }

  return null;
});
export type BlueprintExplorerComponent = typeof BlueprintExplorer;
