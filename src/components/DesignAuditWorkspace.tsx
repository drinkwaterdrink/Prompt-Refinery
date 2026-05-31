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
  Play, 
  ClipboardCheck,
  Zap,
  Info,
  Sliders,
  Sparkles
} from 'lucide-react';
import { DesignAuditResult, SuggestedIssue } from '../types';

interface DesignAuditWorkspaceProps {
  result: DesignAuditResult | null;
  isGeneratingAudit: boolean;
  auditError: string | null;
  onCopy: (text: string, label: string) => void;
  showToast: (msg: string) => void;
}

export const DesignAuditWorkspace: React.FC<DesignAuditWorkspaceProps> = ({
  result,
  isGeneratingAudit,
  auditError,
  onCopy,
  showToast
}) => {
  const [copied, setCopied] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    strengths: false,
    wins: false,
    deeper: true,
    issues: false
  });
  const [expandedCriteria, setExpandedCriteria] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleIssueDetail = (id: string) => {
    setExpandedCriteria(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyPrompt = () => {
    if (!result) return;
    onCopy(result.implementation_prompt, 'Design Audit Implementation Prompt');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportJSON = () => {
    if (!result) return;
    try {
      const dataStr = JSON.stringify(result, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${result.projectName.replace(/\s+/g, '_')}_design_audit.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Exported design audit JSON.');
    } catch (err) {
      console.error(err);
      showToast('JSON export failed.');
    }
  };

  const handleExportMarkdown = () => {
    if (!result) return;
    try {
      let mdText = `# Design Audit: ${result.projectName}\n`;
      mdText += `**Overall Score:** ${result.overall_score} / 10\n\n`;
      
      mdText += `## SUMMARY\n${result.summary}\n\n`;
      
      mdText += `## DIMENSION RATINGS\n`;
      mdText += `- **Layout & Spacing:** ${result.scores.layout}/10\n`;
      mdText += `- **Visual Hierarchy:** ${result.scores.visual_hierarchy}/10\n`;
      mdText += `- **Accessibility & contrast:** ${result.scores.accessibility}/10\n`;
      mdText += `- **Mobile Usability:** ${result.scores.mobile_usability}/10\n`;
      mdText += `- **Interaction Feedback:** ${result.scores.interaction_feedback}/10\n`;
      mdText += `- **Performance Feel:** ${result.scores.performance_feel}/10\n`;
      mdText += `- **Design Consistency:** ${result.scores.design_consistency}/10\n\n`;

      mdText += `## KEY STRENGTHS\n`;
      result.strengths.forEach(s => { mdText += `- ${s}\n`; });
      mdText += `\n`;

      mdText += `## QUICK UX WINS\n`;
      result.quick_wins.forEach(w => { mdText += `- [ ] ${w}\n`; });
      mdText += `\n`;

      mdText += `## DEEPER SYSTEM IMPROVEMENTS\n`;
      result.deeper_improvements.forEach(d => { mdText += `- [ ] ${d}\n`; });
      mdText += `\n`;

      mdText += `## IDENTIFIED DESIGN ISSUES\n\n`;
      result.issues.forEach((iss, idx) => {
        mdText += `### ISSUE ${idx + 1}: ${iss.problem} [${iss.severity.toUpperCase()}]\n`;
        mdText += `- **Category:** ${iss.category.toUpperCase()}\n`;
        mdText += `- **Why it matters:** ${iss.why_it_matters}\n`;
        mdText += `- **Recommended Fix:**\n\`\`\`\n${iss.recommended_fix}\n\`\`\`\n\n`;
      });

      mdText += `## MASTER IMPLEMENTATION PROMPT\n\`\`\`\n${result.implementation_prompt}\n\`\`\`\n`;

      const blob = new Blob([mdText], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${result.projectName.replace(/\s+/g, '_')}_design_audit.md`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Exported design audit Markdown.');
    } catch (err) {
      console.error(err);
      showToast('Markdown export failed.');
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'high': return 'bg-rose-950/40 border border-rose-900/30 text-rose-400';
      case 'medium': return 'bg-amber-950/40 border border-amber-900/30 text-[#D4AF37]';
      case 'low': return 'bg-slate-900/40 border border-[#262626] text-slate-400';
      default: return 'bg-slate-900/40 border border-[#262626] text-slate-400';
    }
  };

  const getRatingColor = (score: number) => {
    if (score >= 8) return 'text-emerald-400';
    if (score >= 5) return 'text-[#D4AF37]';
    return 'text-rose-400';
  };

  if (isGeneratingAudit) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[500px]" id="design-generating-state">
        <div className="relative mb-4">
          <div className="h-14 w-14 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin" />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-mono text-[#D4AF37] font-semibold animate-pulse">
            UX-AUD
          </span>
        </div>
        <div className="text-center max-w-sm">
          <h3 className="font-serif text-[#D4AF37] italic font-bold text-base leading-snug">Performing Design Audit</h3>
          <p className="text-[11px] text-slate-500 mt-2 font-mono leading-relaxed uppercase tracking-wider animate-pulse">
            Auditing layouts, typography, & accessibility
          </p>
          <p className="text-[10px] text-slate-600 mt-1 font-mono">
            Evaluating against WCAG AA, mobile-first breaks, and keyboard states
          </p>
        </div>
      </div>
    );
  }

  if (auditError) {
    return (
      <div className="flex-1 flex flex-col p-6 animate-fade-in" id="design-error-state">
        <div className="bg-[#1F1414] border border-rose-950/30 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-serif font-bold text-rose-300 text-sm">Design Audit Failed</h3>
            <p className="text-xs text-rose-400/80 mt-1 leading-relaxed">{auditError}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-fade-in" id="design-audit-workspace">
      
      {/* Overview Header Actions */}
      <div className="px-5 py-4 bg-slate-950/20 border-b border-[#1F1F1F] flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div>
          <h2 className="font-serif text-base font-bold text-[#D4AF37] italic">Design Principles Audit Workspace</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[9px] bg-[#161616] text-[#D4AF37] px-2 py-0.5 rounded border border-[#262626] font-mono uppercase font-semibold">
              Design Audit
            </span>
            <span className="text-slate-500 text-xs font-mono truncate max-w-[200px]">
              {result.projectName} (Score: {result.overall_score}/10)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
          <button
            type="button"
            onClick={handleExportMarkdown}
            className="text-[10px] bg-[#161616] hover:bg-[#222222] text-[#D4AF37] border border-[#262626] hover:border-[#D4AF37]/50 px-3 py-2 rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer font-bold font-mono uppercase tracking-wider justify-center"
            title="Download design principles audit plan as Markdown"
          >
            <Download className="h-3.5 w-3.5" /> Export Audit MD
          </button>
          <button
            type="button"
            onClick={handleExportJSON}
            className="text-[10px] bg-[#161616] hover:bg-[#222222] text-[#D4AF37] border border-[#262626] hover:border-[#D4AF37]/50 px-3 py-2 rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer font-bold font-mono uppercase tracking-wider justify-center"
            title="Download design principles audit plan data as JSON"
          >
            <Layers className="h-3.5 w-3.5" /> Export Audit JSON
          </button>
        </div>
      </div>

      {/* Viewport content */}
      <div className="flex-1 p-5 overflow-y-auto scroller-custom bg-[#0A0A0A] flex flex-col gap-6 max-h-[820px]">
        
        {/* Core summary & Circular Score gauge */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
          
          {/* Circular overall gauge card */}
          <div className="md:col-span-4 bg-[#111111] border border-[#1F1F1F] rounded-xl p-5 flex flex-col items-center justify-center gap-3">
            <span className="text-[10px] font-mono tracking-widest font-bold text-slate-500 uppercase">Overall UX Score</span>
            <div className="relative h-28 w-28 flex items-center justify-center">
              {/* Outer Golden Ring design */}
              <div className="absolute inset-0 rounded-full border-4 border-[#262626]" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#D4AF37] border-r-[#D4AF37] animate-spin-slow" />
              <div className="text-center z-10">
                <span className="text-3xl font-serif font-bold text-[#D4AF37] italic block">
                  {result.overall_score}
                </span>
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block mt-0.5">
                  of 10
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-[#D4AF37] uppercase font-bold tracking-wider">
              {result.overall_score >= 8 ? '🎖️ Excellent UI' : result.overall_score >= 6 ? '⚡ Fair Layout' : '⚠️ UX Overhaul'}
            </span>
          </div>

          <div className="md:col-span-8 bg-[#111111] border border-[#1F1F1F] rounded-xl p-5 flex flex-col gap-3 justify-center">
            <h3 className="text-[10px] font-mono tracking-widest font-bold text-[#D4AF37] uppercase">Audit Summary</h3>
            <p className="text-xs text-slate-350 leading-relaxed font-sans">{result.summary}</p>
          </div>

        </div>

        {/* Multi-Dimensional score rating sub-grid */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-mono tracking-widest font-bold text-slate-500 uppercase flex items-center gap-1.5">
            <Sliders className="h-4 w-4 text-[#D4AF37]" /> Dimension Rating Metrics
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {Object.entries(result.scores).map(([key, scoreVal]) => {
              const score = scoreVal as number;
              return (
                <div key={key} className="bg-[#111111] border border-[#1F1F1F] p-3 rounded-lg flex flex-col gap-1.5 text-center justify-between">
                  <span className="text-[9px] font-mono font-bold text-slate-400 capitalize block truncate">
                    {key.replace(/_/g, ' ')}
                  </span>
                  <div>
                    <span className={`text-base font-serif font-bold italic block ${getRatingColor(score)}`}>
                      {score}
                    </span>
                    {/* Subtle tiny progress bar */}
                    <div className="w-full bg-[#222222] h-1 rounded-full mt-1.5 overflow-hidden">
                      <div 
                        className="bg-[#D4AF37] h-full rounded-full" 
                        style={{ width: `${score * 10}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Collapsible Win and strengths sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Key Strengths */}
          <div className="bg-[#111111] border border-[#1F1F1F] rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('strengths')}
              className="w-full px-4 py-3 bg-black/30 hover:bg-black/50 border-b border-[#1F1F1F] flex items-center justify-between text-left transition"
            >
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" /> Visual Strengths ({result.strengths.length})
              </span>
              {collapsedSections.strengths ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronUp className="h-4 w-4 text-slate-500" />}
            </button>
            {!collapsedSections.strengths && (
              <div className="p-4 bg-black/10 flex flex-col gap-2 font-sans text-xs text-slate-305 leading-relaxed">
                {result.strengths.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-start bg-[#1F1C14] border border-[#D4AF37]/10 p-2.5 rounded-lg">
                    <span className="text-[#D4AF37] select-none font-bold font-mono">•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick wins checklist */}
          <div className="bg-[#111111] border border-[#1F1F1F] rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('wins')}
              className="w-full px-4 py-3 bg-black/30 hover:bg-black/50 border-b border-[#1F1F1F] flex items-center justify-between text-left transition"
            >
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Quick UX Wins ({result.quick_wins.length})
              </span>
              {collapsedSections.wins ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronUp className="h-4 w-4 text-slate-500" />}
            </button>
            {!collapsedSections.wins && (
              <div className="p-4 bg-black/10 flex flex-col gap-2 font-sans text-xs text-slate-305 leading-relaxed">
                {result.quick_wins.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-start bg-emerald-950/10 border border-emerald-950/10 p-2.5 rounded-lg">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Deeper improvements */}
          <div className="bg-[#111111] border border-[#1F1F1F] rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('deeper')}
              className="w-full px-4 py-3 bg-black/30 hover:bg-black/50 border-b border-[#1F1F1F] flex items-center justify-between text-left transition"
            >
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sliders className="h-4 w-4" /> Systemic Upgrades ({result.deeper_improvements.length})
              </span>
              {collapsedSections.deeper ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronUp className="h-4 w-4 text-slate-500" />}
            </button>
            {!collapsedSections.deeper && (
              <div className="p-4 bg-black/10 flex flex-col gap-2 font-sans text-xs text-slate-305 leading-relaxed">
                {result.deeper_improvements.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-start bg-slate-900/40 border border-[#262626]/40 p-2.5 rounded-lg">
                    <span className="text-slate-550 select-none font-bold font-mono">•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Identified Design Issues section */}
        <div className="flex flex-col gap-4">
          <h3 className="text-[10px] font-mono tracking-widest font-bold text-[#D4AF37] uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
            Identified Layout & Accessibility Issues
          </h3>

          <div className="grid grid-cols-1 gap-5">
            {result.issues.map((iss) => (
              <div key={iss.id} className="bg-[#111111] border border-[#1F1F1F] hover:border-[#D4AF37]/25 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col">
                
                {/* Header card with severity badges */}
                <div className="px-5 py-3.5 bg-black/30 border-b border-[#1F1F1F] flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-mono uppercase font-bold px-2 py-0.5 rounded ${getSeverityBadge(iss.severity)}`}>
                      {iss.severity} severity
                    </span>
                    <span className="text-[9px] font-mono uppercase text-slate-500 font-bold bg-[#161616] border border-[#262626] px-1.5 py-0.5 rounded">
                      Category: {iss.category}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-600">ID: {iss.id}</span>
                </div>

                {/* Body card */}
                <div className="p-5 flex flex-col gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 leading-normal">{iss.problem}</h4>
                    <p className="text-[11px] text-slate-500 mt-2 font-mono leading-relaxed leading-snug flex items-start gap-1">
                      <span className="text-[#D4AF37]">⚠️ Why it matters:</span> {iss.why_it_matters}
                    </p>
                  </div>

                  {/* Recommendation fix block */}
                  <div className="flex flex-col gap-1 border-t border-[#1F1F1F]/40 pt-3">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500 block">Recommended Fix Guidelines:</span>
                    <pre className="whitespace-pre-wrap break-words font-mono text-[11px] bg-black/55 border border-[#1F1F1F] p-3 rounded-lg text-slate-350 leading-relaxed max-h-[100px] overflow-y-auto scroller-custom select-all cursor-pointer">
                      {iss.recommended_fix}
                    </pre>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* Master Handoff Implementation Prompt card */}
        <div className="bg-[#111111] border border-gradient-to-r border-[#D4AF37]/20 rounded-2xl overflow-hidden shadow-xl mt-2 flex flex-col">
          <div className="px-5 py-4 bg-[#1F1A14]/30 border-b border-[#1F1F1F] flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-[#D4AF37] animate-pulse" />
              <div>
                <h3 className="text-xs font-bold font-mono uppercase text-[#D4AF37] tracking-wider">Master UI Implementation Prompt</h3>
                <p className="text-[10px] text-slate-450 mt-0.5">Copy directly to paste into Cursor, Antigravity, or other coding agents</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyPrompt}
              className="text-[10px] bg-[#161616] hover:bg-[#222222] text-[#D4AF37] border border-[#262626] px-3.5 py-2 rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer font-bold font-mono uppercase tracking-wider justify-center w-full sm:w-auto"
            >
              {copied ? (
                <>
                  <ClipboardCheck className="h-3.5 w-3.5 text-emerald-450" /> Prompt Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-[#D4AF37]" /> Copy Master Prompt
                </>
              )}
            </button>
          </div>

          <div className="p-5">
            <pre className="whitespace-pre-wrap break-words font-sans text-xs bg-black/60 border border-[#1F1F1F] p-4 rounded-xl text-slate-300 leading-relaxed max-h-[160px] overflow-y-auto scroller-custom select-all cursor-pointer">
              {result.implementation_prompt}
            </pre>
          </div>
        </div>

      </div>

    </div>
  );
};
