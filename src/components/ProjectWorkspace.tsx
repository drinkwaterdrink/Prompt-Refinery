/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Copy, 
  Download, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck,
  ChevronDown, 
  ChevronUp, 
  ArrowRight,
  ClipboardCheck,
  Zap,
  Info,
  Sliders
} from 'lucide-react';
import { ProjectImprovementResult, SuggestedImprovement, GoalContractData } from '../types';

interface ProjectWorkspaceProps {
  result: ProjectImprovementResult | null;
  isGeneratingProject: boolean;
  projectError: string | null;
  onCopy: (text: string, label: string) => void;
  onUseAsRawPrompt: (phasePrompt: string, projectSummary: string) => void;
  onSendToPipeline: (phasePrompt: string, projectSummary: string) => void;
  showToast: (msg: string) => void;
  onOpenGoalBuilder?: (data: Partial<GoalContractData>) => void;
}

export const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = React.memo(({
  result,
  isGeneratingProject,
  projectError,
  onCopy,
  onUseAsRawPrompt,
  onSendToPipeline,
  showToast,
  onOpenGoalBuilder
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    assumptions: true,
    strengths: true,
    risks: false,
    context: true
  });
  const [expandedCriteriaCard, setExpandedCriteriaCard] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleCriteria = (id: string) => {
    setExpandedCriteriaCard(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyPrompt = (improvement: SuggestedImprovement) => {
    onCopy(improvement.phase_prompt, `${improvement.title} Phase Prompt`);
    setCopiedId(improvement.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportJSON = () => {
    if (!result) return;
    try {
      const dataStr = JSON.stringify(result, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${result.projectName.replace(/\s+/g, '_')}_optimization_plan.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Exported review plan JSON.');
    } catch (err) {
      console.error(err);
      showToast('JSON export failed.');
    }
  };

  const handleExportMarkdown = () => {
    if (!result) return;
    try {
      let combinedText = `# Optimization Plan: ${result.projectName}\n`;
      combinedText += `**Detected App Type:** ${result.detected_app_type}\n\n`;
      
      combinedText += `## PROJECT SUMMARY\n${result.project_summary}\n\n`;
      combinedText += `## RECOMMENDED NEXT DEV PHASE\n${result.recommended_next_phase}\n\n`;
      
      combinedText += `## KNOWN CONTEXT USED\n`;
      result.known_context_used.forEach(f => { combinedText += `- ${f}\n`; });
      combinedText += `\n`;

      combinedText += `## ASSUMPTIONS\n`;
      result.assumptions.forEach(ass => { combinedText += `- ${ass}\n`; });
      combinedText += `\n`;

      combinedText += `## STRENGTHS\n`;
      result.strengths.forEach(st => { combinedText += `- ${st}\n`; });
      combinedText += `\n`;

      combinedText += `## RISKS & GAPS\n`;
      result.risks_or_gaps.forEach(rg => { combinedText += `- ${rg}\n`; });
      combinedText += `\n`;

      combinedText += `## SUGGESTED ATOMIC IMPROVEMENTS\n\n`;
      result.suggested_improvements.forEach((st, idx) => {
        combinedText += `### ${idx + 1}. ${st.title} (${st.category.toUpperCase()})\n`;
        combinedText += `- **Summary:** ${st.summary}\n`;
        combinedText += `- **Why it matters:** ${st.why_it_matters}\n`;
        combinedText += `- **Impact:** ${st.impact.toUpperCase()} | **Effort:** ${st.effort.toUpperCase()} | **Risk:** ${st.risk.toUpperCase()}\n`;
        combinedText += `- **Phase Prompt:**\n\`\`\`\n${st.phase_prompt}\n\`\`\`\n`;
        combinedText += `- **Acceptance Criteria:**\n`;
        st.acceptance_criteria.forEach(ac => { combinedText += `  - ${ac}\n`; });
        combinedText += `\n-----------------------------------------\n\n`;
      });

      const blob = new Blob([combinedText], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${result.projectName.replace(/\s+/g, '_')}_optimization_plan.md`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Exported review plan Markdown.');
    } catch (err) {
      console.error(err);
      showToast('Markdown export failed.');
    }
  };

  const getCategoryStyles = (cat: string) => {
    switch (cat) {
      case 'feature': return 'bg-emerald-950/40 border border-emerald-900/30 text-emerald-400';
      case 'ux': return 'bg-amber-950/40 border border-amber-900/30 text-primary';
      case 'bugfix': return 'bg-rose-950/40 border border-rose-900/30 text-rose-400';
      case 'refactor': return 'bg-purple-950/40 border border-purple-900/30 text-purple-400';
      case 'performance': return 'bg-cyan-950/40 border border-cyan-900/30 text-cyan-400';
      case 'security': return 'bg-red-950/40 border border-red-900/30 text-red-400';
      case 'prompt-quality': return 'bg-indigo-950/40 border border-indigo-900/30 text-indigo-400';
      case 'mobile': return 'bg-teal-950/40 border border-teal-900/30 text-teal-400';
      case 'architecture': return 'bg-blue-950/40 border border-blue-900/30 text-blue-400';
      default: return 'bg-slate-900/50 border border-[#262626] text-slate-400';
    }
  };

  const getBadgeColor = (val: string) => {
    switch (val) {
      case 'low': return 'bg-emerald-950/20 text-emerald-500 border border-emerald-900/30';
      case 'medium': return 'bg-amber-950/20 text-amber-500 border border-amber-900/30';
      case 'high': return 'bg-rose-950/20 text-rose-500 border border-rose-900/30';
      default: return 'bg-slate-900/40 text-slate-400 border border-[#262626]';
    }
  };

  if (isGeneratingProject) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[500px]" id="project-generating-state">
        <div className="relative mb-4">
          <div className="h-14 w-14 rounded-full border-2 border-primary/20 border-t-[#00e5ff] animate-spin" />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-mono text-primary font-semibold animate-pulse">
            AUDIT
          </span>
        </div>
        <div className="text-center max-w-sm">
          <h3 className="font-sans text-primary font-bold text-sm tracking-wider uppercase leading-snug">Auditing Codebase Context</h3>
          <p className="text-[11px] text-slate-500 mt-2 font-mono leading-relaxed uppercase tracking-wider animate-pulse">
            Analyzing README, files list, & directions...
          </p>
          <p className="text-[10px] text-slate-600 mt-1 font-mono">
            Evaluating risks, scoping gaps, and structuring atomic dev phases
          </p>
        </div>
      </div>
    );
  }

  if (projectError) {
    return (
      <div className="flex-1 flex flex-col p-6 animate-fade-in" id="project-error-state">
        <div className="bg-[#1F1414] border border-rose-950/30 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-rose-300">Codebase Audit Failed</h3>
            <p className="text-xs text-rose-400/80 mt-1 leading-relaxed">{projectError}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-fade-in" id="project-review-workspace">
      
      {/* Overview Header Actions */}
      <div className="px-5 py-4 bg-slate-950/20 border-b border-[#1F1F1F] flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div>
          <h2 className="font-sans text-sm font-bold tracking-wider uppercase text-primary">Codebase Review & Optimization</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[9px] bg-[#161616] text-primary px-2 py-0.5 rounded border border-[#262626] font-mono uppercase font-semibold">
              Project Mode
            </span>
            <span className="text-slate-500 text-xs font-mono truncate max-w-[200px]">
              {result.projectName} ({result.suggested_improvements.length} Improvements)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
          <button
            type="button"
            onClick={handleExportMarkdown}
            className="text-[10px] bg-[#161616] hover:bg-[#222222] text-primary border border-[#262626] hover:border-primary/50 px-3 py-2 rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer font-bold font-mono uppercase tracking-wider justify-center"
            title="Download full project review plan as Markdown"
          >
            <Download className="h-3.5 w-3.5" /> Export Plan MD
          </button>
          <button
            type="button"
            onClick={handleExportJSON}
            className="text-[10px] bg-[#161616] hover:bg-[#222222] text-primary border border-[#262626] hover:border-primary/50 px-3 py-2 rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer font-bold font-mono uppercase tracking-wider justify-center"
            title="Download full project review plan data as JSON"
          >
            <Layers className="h-3.5 w-3.5" /> Export Plan JSON
          </button>
          <button
            type="button"
            onClick={() => {
              if (!result) return;
              onOpenGoalBuilder?.({
                title: `${result.projectName} - NEXT PHASE`,
                objective: `Recommended Next Phase:\n${result.recommended_next_phase}\n\nProject Context Summary:\n${result.project_summary}\n\nKey Tasks / Improvements:\n${result.suggested_improvements.map(i => `- ${i.title}: ${i.summary}`).join('\n')}`,
                includedAssets: '',
                verificationCommand: 'npm run build',
                successMetric: 'Build compiles successfully with zero errors.'
              });
            }}
            className="text-[10px] bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 px-3 py-2 rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer font-bold font-mono uppercase tracking-wider justify-center animate-pulse-subtle"
            title="Open the interactive /goal builder side-drawer to customize a system execution contract"
          >
            <Sliders className="h-3.5 w-3.5" /> /goal Builder
          </button>
        </div>
      </div>

      {/* Main content viewport */}
      <div className="flex-1 p-5 overflow-y-auto scroller-custom bg-[#0A0A0A] flex flex-col gap-6 max-h-[820px]">
        
        {/* Core summary and app type overview */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8 bg-[#111111] border border-[#1F1F1F] rounded-xl p-4 flex flex-col gap-2">
            <h3 className="text-[10px] font-mono tracking-widest font-bold text-primary uppercase">Project Summary</h3>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">{result.project_summary}</p>
          </div>
          <div className="md:col-span-4 bg-[#111111] border border-[#1F1F1F] rounded-xl p-4 flex flex-col gap-2 justify-center">
            <span className="text-[10px] font-mono tracking-widest font-bold text-slate-500 uppercase">Detected App Type</span>
            <span className="text-xs font-mono font-bold text-slate-200 block bg-[#161616] border border-[#262626] p-2.5 rounded-lg">
              🖥️ {result.detected_app_type}
            </span>
          </div>
        </div>

        {/* Recommended Next Dev Phase Gradient Highlight Card */}
        <div className="bg-gradient-to-r from-amber-950/20 via-black to-[#00e5ff]/5 border border-primary/20 p-4.5 rounded-xl flex items-start gap-3">
          <Zap className="h-5 w-5 text-primary shrink-0 mt-0.5 animate-pulse" />
          <div>
            <h3 className="text-xs font-bold font-mono uppercase text-primary tracking-wider">Recommended Next Development Phase</h3>
            <p className="text-xs text-slate-300 leading-relaxed mt-1 font-sans font-semibold tracking-wide uppercase text-secondary">{result.recommended_next_phase}</p>
          </div>
        </div>

        {/* Double Column Metadata Accordions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Risks & Gaps Column */}
          <div className="bg-[#111111] border border-[#1F1F1F] rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('risks')}
              className="w-full px-4 py-3 bg-black/30 hover:bg-black/50 border-b border-[#1F1F1F] flex items-center justify-between text-left transition"
            >
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" /> Risks & Technical Gaps ({result.risks_or_gaps.length})
              </span>
              {collapsedSections.risks ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronUp className="h-4 w-4 text-slate-500" />}
            </button>
            {!collapsedSections.risks && (
              <div className="p-4 bg-black/10 flex flex-col gap-2 font-sans text-xs text-slate-350 leading-relaxed">
                {result.risks_or_gaps.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-start bg-rose-950/10 border border-rose-950/10 p-2.5 rounded-lg">
                    <span className="text-rose-455 select-none font-bold font-mono">•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Codebase Strengths */}
          <div className="bg-[#111111] border border-[#1F1F1F] rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('strengths')}
              className="w-full px-4 py-3 bg-black/30 hover:bg-black/50 border-b border-[#1F1F1F] flex items-center justify-between text-left transition"
            >
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" /> Codebase Strengths ({result.strengths.length})
              </span>
              {collapsedSections.strengths ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronUp className="h-4 w-4 text-slate-500" />}
            </button>
            {!collapsedSections.strengths && (
              <div className="p-4 bg-black/10 flex flex-col gap-2 font-sans text-xs text-slate-350 leading-relaxed">
                {result.strengths.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-start bg-[#1F1C14] border border-primary/10 p-2.5 rounded-lg">
                    <span className="text-primary select-none font-bold font-mono">•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* System Assumptions */}
          <div className="bg-[#111111] border border-[#1F1F1F] rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('assumptions')}
              className="w-full px-4 py-3 bg-black/30 hover:bg-black/50 border-b border-[#1F1F1F] flex items-center justify-between text-left transition"
            >
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Info className="h-4 w-4" /> System Assumptions ({result.assumptions.length})
              </span>
              {collapsedSections.assumptions ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronUp className="h-4 w-4 text-slate-500" />}
            </button>
            {!collapsedSections.assumptions && (
              <div className="p-4 bg-black/10 flex flex-col gap-2 font-sans text-xs text-slate-350 leading-relaxed">
                {result.assumptions.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-start bg-slate-900/40 border border-[#262626]/40 p-2.5 rounded-lg">
                    <span className="text-slate-500 select-none font-bold font-mono">•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Context checked files */}
          <div className="bg-[#111111] border border-[#1F1F1F] rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('context')}
              className="w-full px-4 py-3 bg-black/30 hover:bg-black/50 border-b border-[#1F1F1F] flex items-center justify-between text-left transition"
            >
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="h-4 w-4" /> Context Sources Checked ({result.known_context_used.length})
              </span>
              {collapsedSections.context ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronUp className="h-4 w-4 text-slate-500" />}
            </button>
            {!collapsedSections.context && (
              <div className="p-4 bg-black/10 flex flex-wrap gap-2 font-sans text-xs text-slate-350 leading-relaxed">
                {result.known_context_used.length === 0 ? (
                  <p className="text-[10px] text-slate-550 font-mono italic">No file contexts extracted</p>
                ) : (
                  result.known_context_used.map(f => (
                    <span key={f} className="text-[10px] font-mono bg-[#161616] text-primary border border-[#262626] px-2 py-1 rounded-md font-semibold">
                      📄 {f}
                    </span>
                  ))
                )}
              </div>
            )}
          </div>

        </div>

        {/* Suggested Improvements Section */}
        <div className="flex flex-col gap-4 mt-2">
          <h3 className="text-[10px] font-mono tracking-widest font-bold text-primary uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Suggested Atomic Codebase Improvements
          </h3>

          <div className="grid grid-cols-1 gap-6">
            {result.suggested_improvements.map((st) => (
              <div key={st.id} className="bg-[#111111] border border-[#1F1F1F] hover:border-primary/25 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col">
                
                {/* Improvement Card Header */}
                <div className="px-5 py-4 bg-black/30 border-b border-[#1F1F1F] flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h4 className="text-sm font-bold text-slate-200">{st.title}</h4>
                    <span className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded ${getCategoryStyles(st.category)}`}>
                      {st.category}
                    </span>
                  </div>

                  {/* Impact / Effort / Risk Badges */}
                  <div className="flex items-center gap-1.5 w-full md:w-auto justify-end">
                    <span className={`text-[8px] font-mono uppercase font-bold px-1.5 py-0.5 rounded border ${getBadgeColor(st.impact)}`}>
                      Impact: {st.impact}
                    </span>
                    <span className={`text-[8px] font-mono uppercase font-bold px-1.5 py-0.5 rounded border ${getBadgeColor(st.effort)}`}>
                      Effort: {st.effort}
                    </span>
                    <span className={`text-[8px] font-mono uppercase font-bold px-1.5 py-0.5 rounded border ${getBadgeColor(st.risk)}`}>
                      Risk: {st.risk}
                    </span>
                  </div>
                </div>

                {/* Improvement Card Body */}
                <div className="p-5 flex flex-col gap-4 flex-1">
                  <div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">{st.summary}</p>
                    <p className="text-[11px] text-slate-500 mt-2 font-mono leading-relaxed leading-snug flex items-start gap-1">
                      <span className="text-primary">⚠️ Why it matters:</span> {st.why_it_matters}
                    </p>
                  </div>

                  {/* Collapsible Acceptance Criteria list */}
                  <div className="border border-[#1F1F1F]/60 rounded-xl bg-black/20">
                    <button
                      type="button"
                      onClick={() => toggleCriteria(st.id)}
                      className="w-full px-4 py-2.5 bg-black/40 hover:bg-black/60 flex items-center justify-between text-left text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 transition"
                    >
                      🎯 Target Acceptance Criteria ({st.acceptance_criteria.length})
                      {expandedCriteriaCard[st.id] ? <ChevronUp className="h-3.5 w-3.5 text-slate-500" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-500" />}
                    </button>
                    {expandedCriteriaCard[st.id] && (
                      <ul className="px-4 py-3 flex flex-col gap-1.5 text-xs text-slate-350 list-none leading-relaxed">
                        {st.acceptance_criteria.map((ac, idx) => (
                          <li key={idx} className="flex gap-2 items-start text-[11px]">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{ac}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Render preview of compiled Phase Prompt */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500 block">Compiled Agentic Prompt:</span>
                    <pre className="whitespace-pre-wrap break-words font-sans text-[11px] bg-black/55 border border-[#1F1F1F] p-3 rounded-lg text-slate-300 max-h-[120px] overflow-y-auto scroller-custom select-all cursor-pointer leading-relaxed" title="Triple-click to select all">
                      {st.phase_prompt}
                    </pre>
                  </div>

                  {/* Actions buttons panel */}
                  <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center justify-end border-t border-[#1F1F1F]/40 pt-4 mt-auto">
                    <button
                      type="button"
                      onClick={() => handleCopyPrompt(st)}
                      className="text-[10px] bg-[#161616] hover:bg-[#222222] text-primary border border-[#262626] px-3 py-2 rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer font-bold font-mono uppercase tracking-wider justify-center w-full sm:w-auto"
                    >
                      {copiedId === st.id ? (
                        <>
                          <ClipboardCheck className="h-3.5 w-3.5 text-emerald-400" /> Prompt Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-primary" /> Copy Phase Prompt
                        </>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => onUseAsRawPrompt(st.phase_prompt, result.project_summary)}
                      className="text-[10px] bg-[#161616] hover:bg-[#222222] text-primary border border-[#262626] px-3 py-2 rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer font-bold font-mono uppercase tracking-wider justify-center w-full sm:w-auto"
                      title="Load this prompt to Quick Blueprint config inputs and switch tabs"
                    >
                      <Zap className="h-3.5 w-3.5 text-primary" /> Use as Raw Prompt
                    </button>

                    <button
                      type="button"
                      onClick={() => onSendToPipeline(st.phase_prompt, result.project_summary)}
                      className="text-[10px] bg-primary hover:bg-primary-hover text-black px-3 py-2 rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer font-bold font-mono uppercase tracking-wider justify-center w-full sm:w-auto shadow-md"
                      title="Send this compiled prompt context directly to spawns a Refinery Pipeline timelines"
                    >
                      <ArrowRight className="h-3.5 w-3.5" /> Send to Pipeline
                    </button>
                  </div>

                </div>

              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
});
