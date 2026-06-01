/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, RotateCcw, Monitor, Smartphone, Layers, BookOpen } from 'lucide-react';

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

export const DesignAuditInputPanel: React.FC<DesignAuditInputPanelProps> = ({
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
          <span className="text-[10px] font-mono font-bold tracking-widest text-[#D4AF37] uppercase flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse"></span>
            Design Audit Inputs
          </span>
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
            {generationMode === 'mock' ? '🎭 Mock Engine' : generationMode === 'gemini' ? '⚡ Gemini Engine' : '🔌 Custom Engine'}
          </span>
        </div>

        {/* Engine Selector */}
        <div className="flex flex-col gap-1.5">
          <div className="grid grid-cols-3 gap-2 bg-[#161616] p-1 rounded-xl border border-[#262626]">
            <button
              type="button"
              onClick={() => setGenerationMode('mock')}
              className={`py-2 text-[10px] font-semibold rounded-lg font-mono tracking-wider transition cursor-pointer flex items-center justify-center gap-1 ${
                generationMode === 'mock'
                  ? 'bg-[#D4AF37] text-black font-bold border border-[#D4AF37]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#222222]/30 border border-transparent'
              }`}
            >
              🎭 Mock
            </button>
            <button
              type="button"
              onClick={() => setGenerationMode('gemini')}
              className={`py-2 text-[10px] font-semibold rounded-lg font-mono tracking-wider transition cursor-pointer flex items-center justify-center gap-1 ${
                generationMode === 'gemini'
                  ? 'bg-[#D4AF37] text-black font-bold border border-[#D4AF37]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#222222]/30 border border-transparent'
              }`}
            >
              <Sparkles className="h-3 w-3" />
              Gemini
            </button>
            <button
              type="button"
              onClick={() => setGenerationMode('custom_openai')}
              className={`py-2 text-[10px] font-semibold rounded-lg font-mono tracking-wider transition cursor-pointer flex items-center justify-center gap-1 ${
                generationMode === 'custom_openai'
                  ? 'bg-[#D4AF37] text-black font-bold border border-[#D4AF37]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#222222]/30 border border-transparent'
              }`}
            >
              🔌 Custom API
            </button>
          </div>
        </div>

        {/* 1. App/Project Name */}
        <div className="flex flex-col gap-2">
          <label htmlFor="project-name" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            1. Project/App Name <span className="text-[#D4AF37]">*</span>
          </label>
          <input
            id="project-name"
            type="text"
            required
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="e.g. TaskBoard Dashboard or GrowLog App"
            className="w-full bg-[#161616] border border-[#262626] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 text-sm font-sans rounded-lg p-2.5 text-slate-200 placeholder-slate-600 focus:outline-none transition-all duration-150"
          />
        </div>

        {/* 2. Target Device */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            2. Target Device / Platform <span className="text-[#D4AF37]">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2 bg-[#161616] p-1 rounded-xl border border-[#262626]">
            <button
              type="button"
              onClick={() => setTargetDevice('desktop')}
              className={`py-2 text-[10px] font-semibold rounded-lg font-mono tracking-wider transition cursor-pointer flex items-center justify-center gap-1 ${
                targetDevice === 'desktop'
                  ? 'bg-[#D4AF37] text-black font-bold border border-[#D4AF37]'
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
                  ? 'bg-[#D4AF37] text-black font-bold border border-[#D4AF37]'
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
                  ? 'bg-[#D4AF37] text-black font-bold border border-[#D4AF37]'
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
            3. UI Description / Screenshots described in text <span className="text-[#D4AF37]">*</span>
          </label>
          <textarea
            id="ui-description"
            rows={3}
            required
            value={uiDescription}
            onChange={(e) => setUiDescription(e.target.value)}
            placeholder="e.g. 'A dashboard layout featuring sidebar controls and a right panel viewport. Cards are styled with flat gray backgrounds, containing numbers and tiny gauges...'"
            className="w-full bg-[#161616] border border-[#262626] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 text-xs font-sans rounded-lg p-3 text-slate-200 placeholder-slate-600 focus:outline-none transition-all resize-y duration-150 leading-relaxed"
          />
        </div>

        {/* 4. Current Issues / Gaps */}
        <div className="flex flex-col gap-2">
          <label htmlFor="current-issues" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            4. Current UI/UX Issues & Bottlenecks <span className="text-slate-600 font-normal italic">(Optional)</span>
          </label>
          <textarea
            id="current-issues"
            rows={2}
            value={currentIssues}
            onChange={(e) => setCurrentIssues(e.target.value)}
            placeholder="e.g. 'Layout looks extremely cluttered on small tablets; contrast is low; buttons lack outline focus rings...'"
            className="w-full bg-[#161616] border border-[#262626] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 text-xs font-sans rounded-lg p-3 text-slate-200 placeholder-slate-600 focus:outline-none transition-all resize-y duration-150 leading-relaxed"
          />
        </div>

        {/* 5. Visual Preference */}
        <div className="flex flex-col gap-2">
          <label htmlFor="style-pref" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            5. Visual Style Preference / Accent Color <span className="text-slate-600 font-normal italic">(Optional)</span>
          </label>
          <input
            id="style-pref"
            type="text"
            value={stylePreference}
            onChange={(e) => setStylePreference(e.target.value)}
            placeholder="e.g. Translucent HSL Amber Glassmorphism or Material Flat Blue"
            className="w-full bg-[#161616] border border-[#262626] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 text-sm font-sans rounded-lg p-2.5 text-slate-200 placeholder-slate-600 focus:outline-none transition-all duration-150"
          />
        </div>

        {/* 6. Pasted CSS / Design Notes */}
        <div className="flex flex-col gap-2">
          <label htmlFor="design-notes" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            6. Pasted CSS / Layout Design Notes <span className="text-slate-600 font-normal italic">(Optional)</span>
          </label>
          <textarea
            id="design-notes"
            rows={3}
            value={designNotes}
            onChange={(e) => setDesignNotes(e.target.value)}
            placeholder="Paste raw Tailwind class names, CSS variable files, or layout grid dimensions..."
            className="w-full bg-[#161616] border border-[#262626] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 text-xs font-sans rounded-lg p-3 text-slate-200 placeholder-slate-600 focus:outline-none transition-all resize-y duration-150 leading-relaxed"
          />
        </div>

        {/* Bottom Actions Frame */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClear}
            className="flex-[1] bg-[#161616] hover:bg-[#222222] border border-[#262626] text-slate-350 text-[10px] font-mono tracking-widest uppercase font-bold rounded-lg py-3 justify-center transition flex items-center gap-1.5 cursor-pointer"
          >
            Clear
          </button>
          <button
            type="submit"
            disabled={isGeneratingAudit || !projectName.trim() || !uiDescription.trim()}
            className={`flex-[3] text-[10px] font-mono tracking-widest uppercase font-bold rounded-lg py-3 transition relative overflow-hidden flex items-center justify-center gap-1.5 cursor-pointer ${
              !projectName.trim() || !uiDescription.trim()
                ? 'bg-[#1E1E1E]/50 text-slate-600 border border-[#262626] cursor-not-allowed'
                : 'bg-[#D4AF37] hover:bg-[#C09E32] text-black shadow-[0_0_20px_rgba(212,175,55,0.15)] font-semibold'
            }`}
          >
            {isGeneratingAudit ? (
              <>
                <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                <span>Auditing UI layouts...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-black fill-black" />
                <span>Trigger Design System Audit</span>
              </>
            )}
          </button>
        </div>

      </form>

      {/* Methodology Advice */}
      <div className="bg-[#0E0E0E]/50 border border-[#1F1F1F] rounded-xl p-4 text-xs text-slate-400 flex flex-col gap-2">
        <span className="font-bold text-slate-300 flex items-center gap-1 font-mono uppercase text-[10px] tracking-wider">
          <BookOpen className="h-3.5 w-3.5 text-[#D4AF37]" /> Core Design Principles
        </span>
        <p className="leading-relaxed text-[11px] text-slate-405">
          Reviews layouts against 8pt spacing systems, tokenized HSL colors, WCAG AA contrast standards, prefers-reduced-motion queries, focus outlines, mobile-first strategies, and rapid feedback states.
        </p>
      </div>

    </section>
  );
};
