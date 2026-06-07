/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, RotateCcw, Monitor, Smartphone, Layers, BookOpen } from 'lucide-react';
import { EngineSelector } from './EngineSelector';

interface DesignAuditInputPanelProps {
  projectName: string;
  setProjectName: (val: string) => void;
  uiDescription: string;
  setUiDescription: (val: string) => void;
  currentIssues: string;
  setCurrentIssues: (val: string) => void;
  targetDevice: 'desktop' | 'mobile' | 'both';
  setTargetDevice: (val: 'desktop' | 'mobile' | 'both') => void;
  stylePreference: string;
  setStylePreference: (val: string) => void;
  designNotes: string;
  setDesignNotes: (val: string) => void;
  isGeneratingAudit: boolean;
  generationMode: 'mock' | 'gemini' | 'custom_openai';
  setGenerationMode: (mode: 'mock' | 'gemini' | 'custom_openai') => void;
  onClear: () => void;
  onSubmit: (e: React.FormEvent) => void;
  showToast: (msg: string) => void;
}

export const DesignAuditInputPanel: React.FC<DesignAuditInputPanelProps> = React.memo(({
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
  generationMode,
  setGenerationMode,
  onClear,
  onSubmit,
  showToast
}) => {
  return (
    <section className="lg:col-span-5 flex flex-col gap-6" id="design-audit-controls-panel">
      <form onSubmit={onSubmit} className="bg-[#0E0E0E] border border-[#1F1F1F] rounded-2xl md:p-5 p-4 flex flex-col gap-5 shadow-2xl">
        
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold tracking-widest text-primary uppercase flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            Design Audit Inputs
          </span>
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
            {generationMode === 'mock' ? '🎭 Mock Engine' : generationMode === 'gemini' ? '⚡ Gemini Engine' : '🔌 Custom Engine'}
          </span>
        </div>

        {/* Engine Selector */}
        <EngineSelector generationMode={generationMode} setGenerationMode={setGenerationMode} />

        {/* 1. App/Project Name */}
        <div className="flex flex-col gap-2">
          <label htmlFor="project-name" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            1. Project/App Name <span className="text-primary">*</span>
          </label>
          <input
            id="project-name"
            type="text"
            required
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="e.g. TaskBoard Dashboard or GrowLog App"
            className="w-full bg-[#161616] border border-[#262626] focus:border-primary focus:ring-1 focus:ring-[#00e5ff]/30 text-base md:text-sm font-sans rounded-lg p-2.5 text-slate-200 placeholder-slate-600 focus:outline-none transition-all duration-150"
          />
        </div>

        {/* 2. Target Device */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            2. Target Device / Platform <span className="text-primary">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2 bg-[#161616] p-1 rounded-xl border border-[#262626]">
            <button
              type="button"
              onClick={() => setTargetDevice('desktop')}
              className={`py-2 text-[10px] font-semibold rounded-lg font-mono tracking-wider transition cursor-pointer flex items-center justify-center gap-1 ${
                targetDevice === 'desktop'
                  ? 'bg-primary text-black font-bold border border-primary'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#222222]/30 border border-transparent'
              }`}
            >
              <Monitor className="h-3 w-3" /> Desktop
            </button>
            <button
              type="button"
              onClick={() => setTargetDevice('mobile')}
              className={`py-2 text-[10px] font-semibold rounded-lg font-mono tracking-wider transition cursor-pointer flex items-center justify-center gap-1 ${
                targetDevice === 'mobile'
                  ? 'bg-primary text-black font-bold border border-primary'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#222222]/30 border border-transparent'
              }`}
            >
              <Smartphone className="h-3 w-3" /> Mobile
            </button>
            <button
              type="button"
              onClick={() => setTargetDevice('both')}
              className={`py-2 text-[10px] font-semibold rounded-lg font-mono tracking-wider transition cursor-pointer flex items-center justify-center gap-1 ${
                targetDevice === 'both'
                  ? 'bg-primary text-black font-bold border border-primary'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#222222]/30 border border-transparent'
              }`}
            >
              <Layers className="h-3 w-3" /> Both
            </button>
          </div>
        </div>

        {/* 3. UI Description */}
        <div className="flex flex-col gap-2">
          <label htmlFor="ui-description" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            3. UI Description / Screenshots described in text <span className="text-primary">*</span>
          </label>
          <textarea
            id="ui-description"
            rows={3}
            required
            value={uiDescription}
            onChange={(e) => setUiDescription(e.target.value)}
            placeholder="e.g. 'A dashboard layout featuring sidebar controls and a right panel viewport. Cards are styled with flat gray backgrounds, containing numbers and tiny gauges...'"
            className="w-full bg-[#161616] border border-[#262626] focus:border-primary focus:ring-1 focus:ring-[#00e5ff]/30 text-base md:text-sm font-sans rounded-lg p-3 text-slate-200 placeholder-slate-600 focus:outline-none transition-all resize-y duration-150 leading-relaxed"
          />
        </div>

        {/* 4. Current Issues / Gaps */}
        <div className="flex flex-col gap-2">
          <label htmlFor="current-issues" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            4. Known Gaps / Layout Pain Points <span className="text-slate-600 font-normal italic">(Optional)</span>
          </label>
          <textarea
            id="current-issues"
            rows={3}
            value={currentIssues}
            onChange={(e) => setCurrentIssues(e.target.value)}
            placeholder="e.g. 'The gauges are off-center on mobile viewports. Primary buttons do not have explicit hover changes...'"
            className="w-full bg-[#161616] border border-[#262626] focus:border-primary focus:ring-1 focus:ring-[#00e5ff]/30 text-base md:text-sm font-sans rounded-lg p-3 text-slate-200 placeholder-slate-600 focus:outline-none transition-all resize-y duration-150 leading-relaxed"
          />
        </div>

        {/* 5. Design Tone Preference */}
        <div className="flex flex-col gap-2">
          <label htmlFor="style-preference" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            5. Design Theme & Aesthetics Style <span className="text-primary">*</span>
          </label>
          <input
            id="style-preference"
            type="text"
            required
            value={stylePreference}
            onChange={(e) => setStylePreference(e.target.value)}
            placeholder="e.g. Charcoal dark mode, vibrant green highlights"
            className="w-full bg-[#161616] border border-[#262626] focus:border-primary focus:ring-1 focus:ring-[#00e5ff]/30 text-base md:text-sm font-sans rounded-lg p-2.5 text-slate-200 focus:outline-none transition-all duration-150"
          />
        </div>

        {/* 6. Custom Spacing / Colors guidelines */}
        <div className="flex flex-col gap-2">
          <label htmlFor="design-notes" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            6. Custom Design Guidelines / Tokens <span className="text-slate-600 font-normal italic">(Optional)</span>
          </label>
          <textarea
            id="design-notes"
            rows={3}
            value={designNotes}
            onChange={(e) => setDesignNotes(e.target.value)}
            placeholder="e.g. 'Colors: Primary HSL 220 80% 50%. Spacing: Multiples of 8px. Font: Inter.'"
            className="w-full bg-[#161616] border border-[#262626] focus:border-primary focus:ring-1 focus:ring-[#00e5ff]/30 text-base md:text-sm font-sans rounded-lg p-3 text-slate-200 placeholder-slate-600 focus:outline-none transition-all resize-y duration-150 leading-relaxed"
          />
        </div>

        {/* Actions Footer */}
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
            disabled={isGeneratingAudit || !projectName.trim() || !uiDescription.trim()}
            className="flex-1 bg-primary disabled:bg-slate-800 text-black disabled:text-slate-500 font-bold text-xs px-5 py-2.5 rounded-xl transition hover:opacity-90 active:scale-98 shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
          >
            {isGeneratingAudit ? (
              <>
                <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                <span>Auditing UI layouts...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-black" />
                <span>Trigger Design System Audit</span>
              </>
            )}
          </button>
        </div>

      </form>

      {/* Methodology Advice */}
      <div className="bg-[#0E0E0E]/50 border border-[#1F1F1F] rounded-xl p-4 text-xs text-slate-400 flex flex-col gap-2">
        <span className="font-bold text-slate-300 flex items-center gap-1 font-mono uppercase text-[10px] tracking-wider">
          <BookOpen className="h-3.5 w-3.5 text-primary" /> Core Design Principles
        </span>
        <p className="leading-relaxed text-[11px] text-slate-405">
          Reviews layouts against 8pt spacing systems, tokenized HSL colors, WCAG AA contrast standards, prefers-reduced-motion queries, focus outlines, mobile-first strategies, and rapid feedback states.
        </p>
      </div>

    </section>
  );
});
