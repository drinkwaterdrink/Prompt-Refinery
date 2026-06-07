/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, Trash2, Plus, ChevronDown, ChevronUp, ShieldAlert, RefreshCw, RotateCcw, BookOpen } from 'lucide-react';
import { ConversationHistoryRow, ProjectContextPack } from '../types';
import { ProjectPackSelector } from './ProjectPackSelector';
import { EngineSelector } from './EngineSelector';

interface InputPanelProps {
  rawPrompt: string;
  setRawPrompt: (val: string) => void;
  projectContext: string;
  setProjectContext: (val: string) => void;
  historyRows: ConversationHistoryRow[];
  setHistoryRows: (rows: ConversationHistoryRow[]) => void;
  isHistoryCollapsed: boolean;
  setIsHistoryCollapsed: (val: boolean) => void;
  forceValidationError: boolean;
  setForceValidationError: (val: boolean) => void;
  generationMode: 'mock' | 'gemini' | 'custom_openai';
  setGenerationMode: (mode: 'mock' | 'gemini' | 'custom_openai') => void;
  isGenerating: boolean;
  debugMode: boolean;
  selectedRecipeId: string;
  setSelectedRecipeId: (val: any) => void;
  onClear: () => void;
  onSubmit: (e: React.FormEvent) => void;
  showToast: (msg: string) => void;
  
  // Project Context Packs Props
  projectPacks: ProjectContextPack[];
  activePackId: string | null;
  selectActivePack: (id: string | null) => void;
  onCreateClick: () => void;
  onEditClick: (id: string) => void;
  onDuplicateClick: (id: string) => void;
  onDeleteClick: (id: string) => void;
  onExportClick: (id: string) => void;
  onImportClick: (file: File) => void;
  onApplyContext: (id: string) => void;
}

export const InputPanel: React.FC<InputPanelProps> = React.memo(({
  rawPrompt,
  setRawPrompt,
  projectContext,
  setProjectContext,
  historyRows,
  setHistoryRows,
  isHistoryCollapsed,
  setIsHistoryCollapsed,
  forceValidationError,
  setForceValidationError,
  generationMode,
  setGenerationMode,
  isGenerating,
  debugMode,
  selectedRecipeId,
  setSelectedRecipeId,
  onClear,
  onSubmit,
  showToast,
  projectPacks,
  activePackId,
  selectActivePack,
  onCreateClick,
  onEditClick,
  onDuplicateClick,
  onDeleteClick,
  onExportClick,
  onImportClick,
  onApplyContext
}) => {

  const addHistoryRow = () => {
    const newRow: ConversationHistoryRow = {
      id: Date.now().toString(),
      role: 'user',
      content: ''
    };
    setHistoryRows([...historyRows, newRow]);
    setIsHistoryCollapsed(false);
  };

  const updateHistoryRow = (id: string, field: 'role' | 'content', value: string) => {
    setHistoryRows(
      historyRows.map((row) => {
        if (row.id === id) {
          return { ...row, [field]: value };
        }
        return row;
      })
    );
  };

  const removeHistoryRow = (id: string) => {
    setHistoryRows(historyRows.filter((row) => row.id !== id));
  };

  return (
    <section className="lg:col-span-5 flex flex-col gap-6" id="left-controls-panel">
      
      <form onSubmit={onSubmit} className="bg-[#0E0E0E] border border-[#1F1F1F] rounded-2xl md:p-5 p-4 flex flex-col gap-5 shadow-2xl">
        
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold tracking-widest text-primary uppercase flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            INPUT CONFIGURATION
          </span>
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
            {generationMode === 'mock' ? '🎭 Mock Engine' : '⚡ Gemini Engine'}
          </span>
        </div>

        {/* Mode Selector */}
        <EngineSelector generationMode={generationMode} setGenerationMode={setGenerationMode} />

        {/* Recipe Selector */}
        <div className="flex flex-col gap-2">
          <label htmlFor="recipe-selector" className="text-[10px] font-bold uppercase tracking-wider text-slate-455 flex items-center gap-1 font-mono">
            Prompt Recipe <span className="text-primary">*</span>
          </label>
          <div className="relative">
            <select
              id="recipe-selector"
              value={selectedRecipeId}
              onChange={(e) => setSelectedRecipeId(e.target.value as any)}
              className="w-full bg-[#161616] border border-[#262626] focus:border-primary focus:ring-1 focus:ring-[#00e5ff]/30 text-xs font-semibold rounded-lg p-2.5 pr-8 text-primary cursor-pointer focus:outline-none transition appearance-none font-mono"
            >
              <option value="blueprint">📋 Blueprint (Default)</option>
              <option value="idea_refinement">💡 Idea Refinement</option>
              <option value="technical_spec">⚙️ Technical Spec</option>
              <option value="implementation_plan">🎯 Implementation Plan</option>
              <option value="code_review">🔍 Code Review / Optimization</option>
              <option value="black_swan">🦢 Black-Swan Ideation</option>
              <option value="design_audit">🎨 Design Audit</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-primary">
              <ChevronDown className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 italic leading-snug">
            {selectedRecipeId === 'blueprint' && 'Turns a rough app/feature idea into a structured coding-agent prompt blueprint.'}
            {selectedRecipeId === 'idea_refinement' && 'Turns a rough idea into a cleaner Markdown Project Request.'}
            {selectedRecipeId === 'technical_spec' && 'Turns a request, rules, and reference context into a detailed technical specification.'}
            {selectedRecipeId === 'implementation_plan' && 'Turns a technical spec into a sequential implementation plan for a coding agent.'}
            {selectedRecipeId === 'code_review' && 'Turns project context or repo summaries into an Optimization Plan.'}
            {selectedRecipeId === 'black_swan' && 'Generate novel, non-obvious, and highly defensible startup or feature MVPs.'}
            {selectedRecipeId === 'design_audit' && 'Audit your UI/UX plans against systematic design tokens, WCAG AA, and component states.'}
          </p>
        </div>

        {/* 1. Raw Input Prompt */}
        <div className="flex flex-col gap-2">
          <label htmlFor="raw-prompt" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            1. Raw Input Prompt <span className="text-primary">*</span>
          </label>
          <textarea
            id="raw-prompt"
            rows={4}
            required
            value={rawPrompt}
            onChange={(e) => setRawPrompt(e.target.value)}
            placeholder='e.g., "build me an app to track my workouts" or "add a dashboard"'
            className="w-full bg-[#161616] border border-[#262626] focus:border-primary focus:ring-1 focus:ring-[#00e5ff]/30 text-base md:text-sm font-sans rounded-lg p-3 text-slate-200 placeholder-slate-600 focus:outline-none transition-all resize-y duration-150"
          />
          <div className="flex gap-1.5 flex-wrap mt-1">
            <span className="text-[10px] text-slate-500 uppercase font-mono py-0.5 tracking-wider">Placeholders:</span>
            <button
              type="button"
              onClick={() => setRawPrompt('build me an app to track my workouts')}
              className="text-[10px] text-slate-400 hover:text-primary bg-[#161616] hover:bg-[#222222] px-2 py-0.5 rounded border border-[#262626] transition hover:border-primary/30"
            >
              "workout tracker"
            </button>
            <button
              type="button"
              onClick={() => setRawPrompt('make it black now')}
              className="text-[10px] text-slate-400 hover:text-primary bg-[#161616] hover:bg-[#222222] px-2 py-0.5 rounded border border-[#262626] transition hover:border-primary/30"
            >
              "make it black"
            </button>
            <button
              type="button"
              onClick={() => setRawPrompt('add a dashboard')}
              className="text-[10px] text-slate-400 hover:text-primary bg-[#161616] hover:bg-[#222222] px-2 py-0.5 rounded border border-[#262626] transition hover:border-primary/30"
            >
              "add a dashboard"
            </button>
          </div>
        </div>

        {/* 2. Optional Project Context */}
        <div className="flex flex-col gap-2">
          <label htmlFor="project-context" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            2. Project Context & Constraints <span className="text-slate-600 font-normal italic">(Optional)</span>
          </label>
          <ProjectPackSelector
            projectPacks={projectPacks}
            activePackId={activePackId}
            selectActivePack={selectActivePack}
            onCreateClick={onCreateClick}
            onEditClick={onEditClick}
            onDuplicateClick={onDuplicateClick}
            onDeleteClick={onDeleteClick}
            onExportClick={onExportClick}
            onImportClick={onImportClick}
            onApplyContext={onApplyContext}
          />
          <textarea
            id="project-context"
            rows={3}
            value={projectContext}
            onChange={(e) => setProjectContext(e.target.value)}
            placeholder='e.g. "Existing app uses React, Tailwind... Ensure mobile-first elegant dark mode."'
            className="w-full bg-[#161616] border border-[#262626] focus:border-primary focus:ring-1 focus:ring-[#00e5ff]/30 text-base md:text-sm font-sans rounded-lg p-3 text-slate-200 placeholder-slate-600 focus:outline-none transition-all resize-y duration-150"
          />
        </div>

        {/* 3. Conversation Thread History (Collapsible) */}
        <div className="flex flex-col gap-2 border-t border-[#1F1F1F] pt-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsHistoryCollapsed(!isHistoryCollapsed)}
              className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-white transition flex items-center gap-1.5 cursor-pointer focus:outline-none"
            >
              {isHistoryCollapsed ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              3. Conversation History ({historyRows.length})
            </button>
            <button
              type="button"
              onClick={addHistoryRow}
              className="text-[10px] text-primary hover:text-primary/80 font-mono font-bold flex items-center gap-1 cursor-pointer transition"
            >
              <Plus className="h-3.5 w-3.5" /> Add Row
            </button>
          </div>

          {!isHistoryCollapsed && (
            <div className="flex flex-col gap-3 mt-2 max-h-[200px] overflow-y-auto pr-1.5 scroller-custom">
              {historyRows.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">No conversation history messages added yet.</p>
              ) : (
                historyRows.map((row) => (
                  <div key={row.id} className="flex gap-2 items-start bg-[#161616]/40 border border-[#1F1F1F] p-2 rounded-lg">
                    <select
                      value={row.role}
                      onChange={(e) => updateHistoryRow(row.id, 'role', e.target.value as any)}
                      className="bg-[#121212] border border-[#262626] rounded-md px-1.5 py-1 text-[10px] font-bold text-slate-300 focus:outline-none"
                    >
                      <option value="user">User</option>
                      <option value="assistant">Agent</option>
                    </select>
                    <textarea
                      value={row.content}
                      onChange={(e) => updateHistoryRow(row.id, 'content', e.target.value)}
                      placeholder="Type a message or instruction..."
                      rows={1}
                      className="flex-1 bg-transparent text-xs text-slate-200 outline-none resize-none pt-0.5"
                    />
                    <button
                      type="button"
                      onClick={() => removeHistoryRow(row.id)}
                      className="text-slate-500 hover:text-red-400 transition cursor-pointer p-0.5 mt-0.5"
                      title="Delete row"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Validation error advice HUD */}
        {forceValidationError && (
          <div className="bg-rose-950/20 border border-rose-900/35 rounded-xl p-3 flex items-start gap-2 text-rose-350">
            <ShieldAlert className="h-4.5 w-4.5 text-rose-455 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Diagnostics override active</span>
              <p className="text-[10px] leading-normal text-rose-400">
                Will deliberately inject client errors to evaluate schema verification handlers.
              </p>
            </div>
          </div>
        )}

        {/* Generate Actions footer layout */}
        <div className="border-t border-[#1F1F1F] pt-4.5 flex gap-3 items-center">
          <button
            type="button"
            onClick={onClear}
            className="text-xs bg-transparent border border-[#262626] text-slate-400 font-bold px-4 py-2.5 rounded-xl transition hover:text-white active:scale-98 cursor-pointer flex items-center gap-1.5 hover:bg-[#161616]"
            title="Reset All Inputs"
          >
            <RotateCcw className="h-4 w-4" /> Clear
          </button>
          
          <button
            type="submit"
            disabled={isGenerating || !rawPrompt.trim()}
            className="flex-1 bg-primary disabled:bg-slate-800 text-black disabled:text-slate-500 font-bold text-xs px-5 py-2.5 rounded-xl transition hover:opacity-90 active:scale-98 shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Processing Refinery Pipeline...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-black fill-black" />
                <span>Enhance Prompt Blueprint</span>
              </>
            )}
          </button>
        </div>

      </form>

      {/* Quick info/workflow footer card */}
      <div className="bg-[#0E0E0E]/50 border border-[#1F1F1F] rounded-xl p-4 text-xs text-slate-400 flex flex-col gap-2">
        <span className="font-bold text-slate-300 flex items-center gap-1 font-mono uppercase text-[10px] tracking-wider">
          <BookOpen className="h-3.5 w-3.5 text-primary" /> Blueprint Methodology
        </span>
        <p className="leading-relaxed text-[11px] text-slate-400">
          Coding agents write significantly cleaner architecture when provided structured declarations. Prompt Refinery compiles raw ideas into robust technical descriptions, handling assumptions, UX components, and security schemas explicitly.
        </p>
      </div>

    </section>
  );
});
export type InputPanelComponent = typeof InputPanel;
