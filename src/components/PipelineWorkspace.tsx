/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Copy, 
  Download, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Layers, 
  ClipboardCheck
} from 'lucide-react';
import { RefineryPipeline, PipelineStageResult, ConversationHistoryRow } from '../types';
import { StageKey } from '../hooks/usePipelineWorkflow';

interface PipelineWorkspaceProps {
  pipeline: RefineryPipeline | null;
  stageStatuses: Record<StageKey, 'empty' | 'generating' | 'complete' | 'error'>;
  stageErrors: Record<StageKey, string | null>;
  onGenerateStage: (stageKey: StageKey) => void;
  onCopy: (text: string, label: string) => void;
  rawPrompt: string;
  projectContext: string;
  conversationHistory: ConversationHistoryRow[];
  generationMode: 'mock' | 'gemini';
  showToast: (msg: string) => void;
}

interface StageConfig {
  key: StageKey;
  number: number;
  title: string;
  subtitle: string;
  recipeName: string;
  description: string;
}

const STAGES: StageConfig[] = [
  {
    key: 'projectRequest',
    number: 1,
    title: 'Project Request Spec',
    subtitle: 'Clarify target audience, desired features, & design request',
    recipeName: 'idea_refinement',
    description: 'Refines the rough prompt into a clean product request specification.'
  },
  {
    key: 'technicalSpec',
    number: 2,
    title: 'Technical Specification',
    subtitle: 'Synthesize architecture, database, models, & requirements',
    recipeName: 'technical_spec',
    description: 'Fleshes out technical architecture constraints and architectural stack.'
  },
  {
    key: 'implementationPlan',
    number: 3,
    title: 'Implementation Plan',
    subtitle: 'Develop actionable implementation plan with verification checks',
    recipeName: 'implementation_plan',
    description: 'Builds a step-by-step modular plan for incremental building.'
  },
  {
    key: 'finalVibePrompt',
    number: 4,
    title: 'Final Vibe Prompt',
    subtitle: 'Generate a high-fidelity copy-paste single-step prompt',
    recipeName: 'final_vibe',
    description: 'Fuses all stages into an optimized prompt for coding agents.'
  }
];
export const PipelineWorkspace: React.FC<PipelineWorkspaceProps> = React.memo(({
  pipeline,
  stageStatuses,
  stageErrors,
  onGenerateStage,
  onCopy,
  rawPrompt,
  projectContext,
  conversationHistory,
  generationMode,
  showToast
}) => {
  const [copiedStage, setCopiedStage] = useState<string | null>(null);
  const handleStageCopy = (text: string, label: string, stageKey: string) => {
    onCopy(text, label);
    setCopiedStage(stageKey);
    setTimeout(() => setCopiedStage(null), 2000);
  };

  const handleStageExport = (stage: PipelineStageResult, stageLabel: string) => {
    try {
      const blob = new Blob([stage.content], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${stage.recipeId}_${Date.now()}.md`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`Exported ${stageLabel} as Markdown file.`);
    } catch (err) {
      console.error(err);
      showToast('Export failed.');
    }
  };

  const handleExportWholePipelineJSON = () => {
    if (!pipeline) return;
    try {
      const dataStr = JSON.stringify(pipeline, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `refinery_pipeline_${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Exported complete pipeline JSON packet.');
    } catch (err) {
      console.error(err);
      showToast('Export failed.');
    }
  };

  const handleExportWholePipelineMarkdown = () => {
    if (!pipeline) return;
    try {
      let combinedText = `# Refinery Pipeline: ${pipeline.title || 'Untitled Project'}\n`;
      combinedText += `*Compiled on ${new Date(pipeline.updatedAt).toLocaleString()}*\n\n`;
      combinedText += `## ORIGINAL RAW PROMPT\n\`\`\`\n${pipeline.rawPrompt}\n\`\`\`\n\n`;
      if (pipeline.projectContext) {
        combinedText += `## ORIGINAL CONTEXT\n\`\`\`\n${pipeline.projectContext}\n\`\`\`\n\n`;
      }

      STAGES.forEach(st => {
        const result = pipeline.stages[st.key];
        if (result) {
          combinedText += `\n<!-- STAGE BREAK: ${st.title} -->\n\n`;
          combinedText += `=========================================\n`;
          combinedText += `## STAGE ${st.number}: ${st.title.toUpperCase()}\n`;
          combinedText += `=========================================\n\n`;
          combinedText += `${result.content}\n\n`;
        }
      });

      const blob = new Blob([combinedText], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `compiled_refinery_spec_${Date.now()}.md`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Exported combined pipeline specification document.');
    } catch (err) {
      console.error(err);
      showToast('Markdown export failed.');
    }
  };

  // Determine stage lock conditions
  const isStageUnlocked = (index: number): boolean => {
    if (index === 0) return true;
    const precedingKey = STAGES[index - 1].key;
    return stageStatuses[precedingKey] === 'complete';
  };

  const activeStagesCount = Object.values(stageStatuses).filter(s => s === 'complete').length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-fade-in" id="refinery-pipeline-workspace">
      
      {/* Top Banner with Stats & Bulk Actions */}
      <div className="px-5 py-4 bg-slate-950/20 border-b border-[#1F1F1F] flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-xl border border-primary/20">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-serif text-base font-bold text-primary italic">Multi-Stage Refinery Pipeline</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] bg-[#161616] text-primary px-2 py-0.5 rounded border border-[#262626] font-mono font-semibold uppercase">
                Pipeline Mode
              </span>
              <span className="text-slate-500 text-xs font-mono">
                {activeStagesCount}/4 Stages Compiled
              </span>
            </div>
          </div>
        </div>

        {pipeline && activeStagesCount > 0 && (
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              type="button"
              onClick={handleExportWholePipelineMarkdown}
              className="text-[10px] bg-[#161616] hover:bg-[#222222] text-primary border border-[#262626] hover:border-primary/50 px-3 py-2 rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer font-bold font-mono uppercase tracking-wider w-full sm:w-auto justify-center"
              title="Export complete pipeline spec as a combined Markdown document"
            >
              <Download className="h-3.5 w-3.5" /> Export Spec Doc
            </button>
            <button
              type="button"
              onClick={handleExportWholePipelineJSON}
              className="text-[10px] bg-[#161616] hover:bg-[#222222] text-primary border border-[#262626] hover:border-primary/50 px-3 py-2 rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer font-bold font-mono uppercase tracking-wider w-full sm:w-auto justify-center"
              title="Export entire pipeline history packet as JSON"
            >
              <Layers className="h-3.5 w-3.5" /> Export Pipeline JSON
            </button>
          </div>
        )}
      </div>

      {/* Main Timeline scrollable column */}
      <div className="flex-1 p-5 overflow-y-auto scroller-custom bg-[#0A0A0A] flex flex-col gap-6 max-h-[820px]">
        {STAGES.map((st, idx) => {
          const unlocked = isStageUnlocked(idx);
          const status = stageStatuses[st.key];
          const error = stageErrors[st.key];
          const result = pipeline?.stages[st.key];
          
          return (
            <div key={st.key} className="relative flex flex-col md:flex-row gap-4 items-start">
              
              {/* Left stage indicator sidebar */}
              <div className="flex md:flex-col items-center gap-2 w-full md:w-16 shrink-0 justify-between md:justify-start">
                <div className={`h-10 w-10 rounded-full border-2 flex items-center justify-center font-mono font-bold text-sm transition-all duration-300 ${
                  status === 'complete' 
                    ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400'
                    : status === 'generating'
                      ? 'bg-amber-950/40 border-primary text-primary animate-pulse'
                      : status === 'error'
                        ? 'bg-rose-950/40 border-rose-500 text-rose-400'
                        : unlocked
                          ? 'bg-[#161616] border-primary/35 text-slate-300 shadow-md'
                          : 'bg-[#111111] border-[#222222] text-slate-600 cursor-not-allowed'
                }`}>
                  {status === 'complete' ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <span>{st.number}</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 md:hidden">
                  <span className={`text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-md font-bold ${
                    status === 'complete' 
                      ? 'bg-emerald-950/45 text-emerald-400 border border-emerald-900/30'
                      : status === 'generating'
                        ? 'bg-amber-950/45 text-primary border border-amber-900/30'
                        : status === 'error'
                          ? 'bg-rose-950/45 text-rose-400 border border-rose-900/30'
                          : unlocked
                            ? 'bg-slate-900/50 text-slate-400 border border-[#262626]'
                            : 'bg-black text-slate-600 border border-slate-950'
                  }`}>
                    {status === 'complete' && 'Stage Complete'}
                    {status === 'generating' && 'Generating...'}
                    {status === 'error' && 'Error Occurred'}
                    {status === 'empty' && unlocked && 'Ready'}
                    {status === 'empty' && !unlocked && 'Locked'}
                  </span>
                </div>

                {/* Vertical timeline path connector */}
                {idx < STAGES.length - 1 && (
                  <div className={`hidden md:block w-0.5 h-16 transition-all duration-300 mt-2 ${
                    status === 'complete' ? 'bg-emerald-500/30' : 'bg-[#222222]'
                  }`} />
                )}
              </div>

              {/* Main Card */}
              <div className={`flex-1 w-full bg-[#111111] border rounded-xl overflow-hidden transition-all duration-300 ${
                status === 'generating' 
                  ? 'border-primary shadow-[0_0_12px_rgba(212,175,55,0.1)]'
                  : status === 'complete'
                    ? 'border-emerald-500/20'
                    : unlocked
                      ? 'border-[#262626] hover:border-primary/25'
                      : 'border-[#1A1A1A] opacity-50'
              }`}>
                
                {/* Card Header */}
                <div className="px-4 py-3.5 bg-black/40 border-b border-[#1F1F1F] flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                  <div>
                    <h3 className={`font-serif text-sm font-bold flex items-center gap-1.5 ${
                      status === 'complete' ? 'text-emerald-400' : 'text-primary'
                    }`}>
                      {st.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-normal mt-0.5">{st.subtitle}</p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                    
                    {/* Status light inside badge (Desktop) */}
                    <span className={`hidden sm:inline-flex items-center gap-1.5 text-[9px] font-mono tracking-widest uppercase px-2 py-1 rounded-md font-bold ${
                      status === 'complete' 
                        ? 'bg-emerald-950/45 text-emerald-400 border border-emerald-900/30'
                        : status === 'generating'
                          ? 'bg-amber-950/45 text-primary border border-amber-900/30'
                          : status === 'error'
                            ? 'bg-rose-950/45 text-rose-400 border border-rose-900/30'
                            : unlocked
                              ? 'bg-slate-900/50 text-slate-400 border border-[#262626]'
                              : 'bg-black text-slate-600 border border-slate-950'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        status === 'complete' 
                          ? 'bg-emerald-400 animate-pulse'
                          : status === 'generating'
                            ? 'bg-primary animate-ping'
                            : status === 'error'
                              ? 'bg-rose-500 animate-pulse'
                              : unlocked
                                ? 'bg-amber-400/40'
                                : 'bg-slate-700'
                      }`} />
                      {status === 'complete' && 'Complete'}
                      {status === 'generating' && 'Generating'}
                      {status === 'error' && 'Error'}
                      {status === 'empty' && unlocked && 'Ready'}
                      {status === 'empty' && !unlocked && 'Locked'}
                    </span>

                    {/* Stage generate button */}
                    {unlocked && (
                      <button
                        type="button"
                        onClick={() => onGenerateStage(st.key)}
                        disabled={status === 'generating'}
                        className={`text-[10px] border px-2.5 py-1.5 rounded-lg cursor-pointer transition-all duration-300 font-bold font-mono uppercase tracking-wider flex items-center gap-1 ${
                          status === 'complete'
                            ? 'bg-[#161616] text-primary border-[#262626] hover:bg-[#222222]'
                            : 'bg-primary text-black border-primary hover:bg-primary-hover'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {status === 'complete' ? (
                          <>
                            <RefreshCw className="h-3 w-3 animate-spin-slow" /> Regenerate
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3 fill-current" /> Generate
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 bg-black/10">
                  {status === 'generating' ? (
                    <div className="py-8 flex flex-col items-center justify-center gap-3">
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full border-2 border-primary/20 border-t-[#00e5ff] animate-spin" />
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-primary font-semibold">
                          PR
                        </span>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-mono font-semibold text-primary uppercase tracking-wider">
                          Refining Stage {st.number}...
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1 font-mono">
                          Mode: {generationMode.toUpperCase()} | Compiling progressive specs...
                        </p>
                      </div>
                    </div>
                  ) : error ? (
                    <div className="bg-[#1F1414] border border-rose-950/20 p-3 rounded-lg flex items-start gap-2.5">
                      <AlertTriangle className="h-4.5 w-4.5 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-rose-300 font-mono">Refinement Error</h4>
                        <p className="text-[11px] text-rose-400/90 leading-relaxed mt-0.5">{error}</p>
                      </div>
                    </div>
                  ) : result ? (
                    <div className="flex flex-col gap-3">
                      {/* Sub-controls for stage result */}
                      <div className="flex items-center justify-end gap-1.5 border-b border-[#1F1F1F]/40 pb-2">
                        <button
                          type="button"
                          onClick={() => handleStageCopy(result.content, st.title, st.key)}
                          className="text-[9px] bg-[#161616] hover:bg-[#222222] text-primary border border-[#262626] px-2.5 py-1 rounded-md transition inline-flex items-center gap-1 cursor-pointer font-bold font-mono uppercase tracking-wider"
                        >
                          {copiedStage === st.key ? (
                            <>
                              <ClipboardCheck className="h-3 w-3 text-emerald-400" /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3 text-primary" /> Copy Content
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStageExport(result, st.title)}
                          className="text-[9px] bg-[#161616] hover:bg-[#222222] text-primary border border-[#262626] px-2.5 py-1 rounded-md transition inline-flex items-center gap-1 cursor-pointer font-bold font-mono uppercase tracking-wider"
                        >
                          <Download className="h-3 w-3 text-primary" /> Export Markdown
                        </button>
                      </div>
                      
                      {/* Markdown scrollable viewport */}
                      <div className="max-h-[220px] overflow-y-auto scroller-custom rounded-lg border border-[#1F1F1F] bg-black/45">
                        <pre className="whitespace-pre-wrap break-words font-sans text-[11px] p-3 text-slate-300 leading-relaxed">
                          {result.content}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-500 text-xs">
                      {!unlocked ? (
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span>🔒 Locked</span>
                          <span className="text-[10px] text-slate-650 font-mono">
                            Please complete Stage {st.number - 1} first.
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span className="text-primary opacity-60">Ready to Refine</span>
                          <span className="text-[10px] text-slate-600 font-mono max-w-sm leading-normal">
                            {st.description}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
});
