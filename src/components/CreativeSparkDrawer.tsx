/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, RefreshCw, Sparkles, BookOpen, AlertTriangle } from 'lucide-react';
import { SparkIdea } from '../types';

interface CreativeSparkDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sparkIdeas: SparkIdea[];
  isGeneratingSparks: boolean;
  selectedNovelty: 'practical' | 'unusual' | 'black-swan';
  onChangeNovelty: (novelty: 'practical' | 'unusual' | 'black-swan') => void;
  onRefreshSparks: () => void;
  onUseSpark: (idea: SparkIdea) => void;
  onRefineSpark: (idea: SparkIdea) => void;
  geminiError: string | null;
}

export const CreativeSparkDrawer: React.FC<CreativeSparkDrawerProps> = ({
  isOpen,
  onClose,
  sparkIdeas,
  isGeneratingSparks,
  selectedNovelty,
  onChangeNovelty,
  onRefreshSparks,
  onUseSpark,
  onRefineSpark,
  geminiError
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex bg-black/60 backdrop-blur-xs animate-fade-in animate-duration-150" id="creative-spark-drawer">
      {/* Overlay Click-to-Dismiss */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose}></div>
      
      {/* Drawer body */}
      <div className="relative w-full max-w-md bg-[#0F0E0E] h-full right-0 ml-auto border-l border-[#1F1F1F] flex flex-col shadow-2xl justify-between animate-slide-in">
        
        {/* Header Section */}
        <div className="p-4 border-b border-[#1F1F1F] flex items-center justify-between bg-[#161616]/40">
          <div className="flex items-center gap-2 text-[#D4AF37]">
            <Sparkles className="h-4.5 w-4.5 text-[#D4AF37] animate-pulse" />
            <h3 className="font-serif font-bold text-sm">Creative Spark Catalyst</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-white transition p-1 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filters and Actions control bar */}
        <div className="px-4 py-3 bg-[#111111] border-b border-[#1F1F1F] flex flex-col gap-3">
          
          {/* Novelty Selection Tabs */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] font-mono font-bold tracking-wider text-slate-500 uppercase">Novelty Level</span>
            <div className="grid grid-cols-3 gap-1 bg-[#161616] p-0.5 rounded-lg border border-[#222222]">
              {(['practical', 'unusual', 'black-swan'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onChangeNovelty(mode)}
                  className={`py-1 text-[10px] font-mono capitalize rounded-md transition cursor-pointer font-bold ${
                    selectedNovelty === mode
                      ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/25'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#222222]/20 border border-transparent'
                  }`}
                >
                  {mode.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Trigger Refresh */}
          <div className="flex justify-between items-center mt-0.5">
            <span className="text-[9px] font-mono text-slate-500">DYNAMIC Spark engine</span>
            <button
              type="button"
              disabled={isGeneratingSparks}
              onClick={onRefreshSparks}
              className="text-[10px] bg-[#D4AF37] hover:bg-[#C09E32] text-black font-mono font-bold uppercase py-1.5 px-3 rounded-md transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#D4AF37]/10"
            >
              <RefreshCw className={`h-3 w-3 ${isGeneratingSparks ? 'animate-spin' : ''}`} />
              {isGeneratingSparks ? 'Catalyzing...' : 'Refresh Sparks'}
            </button>
          </div>

        </div>

        {/* Main scrollable sparks deck */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scroller-custom">
          
          {geminiError && (
            <div className="bg-[#1F1414] border border-[#3A1E1E]/50 rounded-xl p-3 flex gap-2.5 items-start text-xs text-rose-350">
              <AlertTriangle className="h-4.5 w-4.5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold font-mono text-rose-300 uppercase tracking-wider text-[10px]">Gemini Catalyst Alert</h4>
                <p className="mt-1 leading-normal text-slate-400 text-[11px]">{geminiError}</p>
                <p className="mt-1 text-[10px] font-mono text-emerald-400">Serving pre-seeded local spark cards below.</p>
              </div>
            </div>
          )}

          {isGeneratingSparks ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
              <RefreshCw className="h-8 w-8 text-[#D4AF37] animate-spin" />
              <p className="text-xs font-mono font-bold uppercase tracking-widest text-[#D4AF37] animate-pulse">Catalyzing Sparks...</p>
              <p className="text-[10px] text-slate-600 italic">Iterating concepts in Google AI Studio sandbox</p>
            </div>
          ) : sparkIdeas.length === 0 ? (
            <div className="text-center py-10 text-slate-500 border border-dashed border-[#262626] rounded-xl bg-[#0A0A0A] flex flex-col items-center justify-center">
              <RefreshCw className="h-8 w-8 text-slate-700 mb-2" />
              <p className="text-xs">No ideas generated.</p>
              <button
                type="button"
                onClick={onRefreshSparks}
                className="mt-3 text-xs text-[#D4AF37] hover:text-[#C09E32] font-mono uppercase font-bold"
              >
                Refresh Catalyst
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3.5">
              {sparkIdeas.map((idea) => (
                <div 
                  key={idea.id}
                  className="bg-[#161616]/65 border border-[#262626] hover:border-[#D4AF37]/35 rounded-xl p-4 transition flex flex-col gap-3 shadow-md"
                >
                  {/* Card Header metadata */}
                  <div className="flex items-start justify-between gap-2 border-b border-[#222222]/85 pb-2">
                    <div>
                      <h4 className="font-serif font-bold text-[#D4AF37] text-sm italic">
                        {idea.title}
                      </h4>
                      <div className="flex gap-1.5 mt-1 flex-wrap">
                        {idea.tags.map((t, idx) => (
                          <span key={idx} className="bg-black/35 border border-[#1E1E1E] text-slate-500 text-[8px] font-mono px-1.5 py-0.2 rounded uppercase">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded font-bold uppercase border ${
                        idea.difficulty === 'ambitious'
                          ? 'bg-rose-950/20 border-rose-900/30 text-rose-450'
                          : idea.difficulty === 'medium'
                          ? 'bg-amber-950/20 border-amber-900/30 text-amber-400'
                          : 'bg-emerald-950/20 border-emerald-900/30 text-emerald-450'
                      }`}>
                        {idea.difficulty}
                      </span>
                    </div>
                  </div>

                  {/* Concept Statement */}
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {idea.concept}
                  </p>

                  {/* Black Swan specifics */}
                  {idea.novelty === 'black-swan' && (idea.catalystProblem || idea.corePillars || idea.whyNow) && (
                    <div className="bg-black/35 border border-[#1E1E1E] p-2.5 rounded-lg flex flex-col gap-2 font-mono text-[10px] leading-relaxed text-slate-400">
                      {idea.corePillars && idea.corePillars.length > 0 && (
                        <div>
                          <strong className="text-[#D4AF37] uppercase text-[9px] block">Fused Pillars:</strong>
                          <span className="text-slate-300">{idea.corePillars.join(" + ")}</span>
                        </div>
                      )}
                      {idea.catalystProblem && (
                        <div>
                          <strong className="text-[#D4AF37] uppercase text-[9px] block">Catalyst Problem:</strong>
                          <span className="text-slate-300">{idea.catalystProblem}</span>
                        </div>
                      )}
                      {idea.whyNow && (
                        <div>
                          <strong className="text-[#D4AF37] uppercase text-[9px] block">Why Now:</strong>
                          <span className="text-slate-300">{idea.whyNow}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action row */}
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => onRefineSpark(idea)}
                      className="bg-[#0E0E0E] hover:bg-[#1E1E1E] border border-[#262626] hover:border-[#D4AF37]/30 text-slate-350 hover:text-slate-200 text-[10px] font-mono tracking-widest uppercase py-2 rounded-lg transition flex items-center justify-center gap-1 cursor-pointer font-bold"
                    >
                      <BookOpen className="h-3 w-3 text-[#D4AF37]" /> Refine Idea
                    </button>
                    <button
                      type="button"
                      onClick={() => onUseSpark(idea)}
                      className="bg-[#D4AF37] hover:bg-[#C09E32] text-black text-[10px] font-mono tracking-widest uppercase py-2 rounded-lg transition flex items-center justify-center gap-1 cursor-pointer font-bold shadow-md shadow-[#D4AF37]/5"
                    >
                      <Sparkles className="h-3 w-3 text-black fill-black" /> Use Idea
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>

        {/* Footer info card */}
        <div className="p-4 border-t border-[#1F1F1F] bg-[#0A0A0A] flex flex-col gap-2">
          <p className="text-[10px] text-slate-500 leading-normal text-center font-mono">
            Fusing local seed mechanisms with Black-Swan catalysts to generate buildable prompt starting nodes.
          </p>
        </div>

      </div>
    </div>
  );
};
