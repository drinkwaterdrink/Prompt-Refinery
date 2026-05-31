/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, Trash2, Plus, ChevronDown, ChevronUp, ShieldAlert, RefreshCw, RotateCcw, BookOpen } from 'lucide-react';
import { ConversationHistoryRow } from '../types';

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
  generationMode: 'mock' | 'gemini';
  setGenerationMode: (mode: 'mock' | 'gemini') => void;
  isGenerating: boolean;
  debugMode: boolean;
  onClear: () => void;
  onSubmit: (e: React.FormEvent) => void;
  showToast: (msg: string) => void;
}

export const InputPanel: React.FC<InputPanelProps> = ({
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
  onClear,
  onSubmit,
  showToast
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
          <span className="text-[10px] font-mono font-bold tracking-widest text-[#D4AF37] uppercase flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse"></span>
            INPUT CONFIGURATION
          </span>
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
            {generationMode === 'mock' ? '🎭 Mock Engine' : '⚡ Gemini Engine'}
          </span>
        </div>

        {/* Mode Selector */}
        <div className="flex flex-col gap-1.5">
          <div className="grid grid-cols-2 gap-2 bg-[#161616] p-1 rounded-xl border border-[#262626]">
            <button
              type="button"
              id="mode-selector-mock"
              onClick={() => setGenerationMode('mock')}
              className={`py-2 text-xs font-semibold rounded-lg font-mono tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 ${
                generationMode === 'mock'
                  ? 'bg-[#D4AF37] text-black font-bold border border-[#D4AF37]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#222222]/30 border border-transparent'
              }`}
            >
              🎭 Mock Mode
            </button>
            <button
              type="button"
              id="mode-selector-gemini"
              onClick={() => setGenerationMode('gemini')}
              className={`py-2 text-xs font-semibold rounded-lg font-mono tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 ${
                generationMode === 'gemini'
                  ? 'bg-[#D4AF37] text-black font-bold border border-[#D4AF37]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#222222]/30 border border-transparent'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Gemini API
            </button>
          </div>
        </div>

        {/* 1. Raw Input Prompt */}
        <div className="flex flex-col gap-2">
          <label htmlFor="raw-prompt" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            1. Raw Input Prompt <span className="text-[#D4AF37]">*</span>
          </label>
          <textarea
            id="raw-prompt"
            rows={4}
            required
            value={rawPrompt}
            onChange={(e) => setRawPrompt(e.target.value)}
            placeholder='e.g., "build me an app to track my workouts" or "add a dashboard"'
            className="w-full bg-[#161616] border border-[#262626] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 text-sm font-sans rounded-lg p-3 text-slate-200 placeholder-slate-600 focus:outline-none transition-all resize-y duration-150"
          />
          <div className="flex gap-1.5 flex-wrap mt-1">
            <span className="text-[10px] text-slate-500 uppercase font-mono py-0.5 tracking-wider">Placeholders:</span>
            <button
              type="button"
              onClick={() => setRawPrompt('build me an app to track my workouts')}
              className="text-[10px] text-slate-400 hover:text-[#D4AF37] bg-[#161616] hover:bg-[#222222] px-2 py-0.5 rounded border border-[#262626] transition hover:border-[#D4AF37]/30"
            >
              "workout tracker"
            </button>
            <button
              type="button"
              onClick={() => setRawPrompt('make it black now')}
              className="text-[10px] text-slate-400 hover:text-[#D4AF37] bg-[#161616] hover:bg-[#222222] px-2 py-0.5 rounded border border-[#262626] transition hover:border-[#D4AF37]/30"
            >
              "make it black"
            </button>
            <button
              type="button"
              onClick={() => setRawPrompt('add a dashboard')}
              className="text-[10px] text-slate-400 hover:text-[#D4AF37] bg-[#161616] hover:bg-[#222222] px-2 py-0.5 rounded border border-[#262626] transition hover:border-[#D4AF37]/30"
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
          <textarea
            id="project-context"
            rows={3}
            value={projectContext}
            onChange={(e) => setProjectContext(e.target.value)}
            placeholder='e.g. "Existing app uses React, Tailwind... Ensure mobile-first elegant dark mode."'
            className="w-full bg-[#161616] border border-[#262626] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 text-sm font-sans rounded-lg p-3 text-slate-200 placeholder-slate-600 focus:outline-none transition-all resize-y duration-150"
          />
        </div>

        {/* 3. Collapsible Simulated History */}
        <div className="border border-[#262626] bg-[#161616]/40 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setIsHistoryCollapsed(!isHistoryCollapsed)}
            className="w-full py-3 px-4 bg-[#161616] hover:bg-[#222222] flex items-center justify-between text-left transition"
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                3. Simulated Message History
              </span>
              <span className="bg-[#262626] text-[#D4AF37] text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold">
                {historyRows.length} {historyRows.length === 1 ? 'msg' : 'msgs'}
              </span>
            </div>
            {isHistoryCollapsed ? (
              <ChevronDown className="h-4 w-4 text-[#D4AF37]" />
            ) : (
              <ChevronUp className="h-4 w-4 text-[#D4AF37]" />
            )}
          </button>

          {!isHistoryCollapsed && (
            <div className="p-3 bg-[#0A0A0A] border-t border-[#262626] flex flex-col gap-3">
              {historyRows.length === 0 ? (
                <div className="text-center py-4 bg-[#161616]/40 rounded-lg border border-dashed border-[#262626]">
                  <p className="text-xs text-slate-500">No message history yet.</p>
                  <button
                    type="button"
                    onClick={addHistoryRow}
                    className="mt-2 text-[11px] text-[#D4AF37] hover:text-[#C09E32] inline-flex items-center gap-1 font-medium transition cursor-pointer"
                  >
                    <Plus className="h-3 w-3" /> Add starter message
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                  {historyRows.map((row) => (
                    <div key={row.id} className="flex gap-2 items-start bg-[#161616] p-2 rounded-lg border border-[#262626]">
                      <select
                        value={row.role}
                        onChange={(e) => updateHistoryRow(row.id, 'role', e.target.value as any)}
                        className="bg-[#262626] border border-[#1F1F1F] text-[10px] text-[#D4AF37] focus:outline-none rounded px-1.5 py-1 font-mono uppercase tracking-wider font-semibold cursor-pointer"
                      >
                        <option value="user">User</option>
                        <option value="assistant">Assistant</option>
                      </select>
                      <textarea
                        rows={1}
                        value={row.content}
                        onChange={(e) => updateHistoryRow(row.id, 'content', e.target.value)}
                        placeholder="Type raw response or request..."
                        className="flex-1 bg-transparent text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-0 border-0 resize-none py-0.5 text-ellipsis"
                      />
                      <button
                        type="button"
                        onClick={() => removeHistoryRow(row.id)}
                        className="text-slate-600 hover:text-rose-400 transition p-1 cursor-pointer"
                        title="Remove message row"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addHistoryRow}
                    className="text-[11px] text-[#D4AF37] hover:text-[#C09E32] self-start flex items-center gap-1 font-mono tracking-wider uppercase mt-1 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Append Message Row
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error Injection Switch - Gated under Debug Mode */}
        {debugMode && (
          <div className="bg-[#1F1414] border border-[#3A1E1E]/50 rounded-xl p-3 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4.5 w-4.5 text-rose-400" />
              <div>
                <h4 className="text-[11px] font-bold text-rose-300 uppercase tracking-wider font-mono">Test Schema Error Handler</h4>
                <p className="text-[10px] text-slate-400 leading-snug">Forces standard invalid mock output to test schema recovery UI</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={forceValidationError}
                onChange={(e) => setForceValidationError(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-[#161616] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-500 after:border-[#262626] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-700"></div>
            </label>
          </div>
        )}

        {/* Bottom Actions Frame */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClear}
            className="flex-[1] bg-[#161616] hover:bg-[#222222] border border-[#262626] text-slate-300 text-[10px] font-mono tracking-widest uppercase font-bold rounded-lg py-3 justify-center transition flex items-center gap-1.5 cursor-pointer"
          >
            Clear
          </button>
          <button
            type="submit"
            disabled={isGenerating || !rawPrompt.trim()}
            className={`flex-[3] text-[10px] font-mono tracking-widest uppercase font-bold rounded-lg py-3 transition relative overflow-hidden flex items-center justify-center gap-1.5 cursor-pointer ${
              !rawPrompt.trim()
                ? 'bg-[#1E1E1E]/50 text-slate-600 border border-[#262626] cursor-not-allowed'
                : 'bg-[#D4AF37] hover:bg-[#C09E32] text-black shadow-[0_0_20px_rgba(212,175,55,0.15)] font-semibold'
            }`}
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
          <BookOpen className="h-3.5 w-3.5 text-[#D4AF37]" /> Blueprint Methodology
        </span>
        <p className="leading-relaxed text-[11px] text-slate-400">
          Coding agents write significantly cleaner architecture when provided structured declarations. Prompt Refinery compiles raw ideas into robust technical descriptions, handling assumptions, UX components, and security schemas explicitly.
        </p>
      </div>

    </section>
  );
};
export type InputPanelComponent = typeof InputPanel;
