import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  AlertTriangle, 
  Terminal, 
  FileText, 
  CheckCircle2, 
  Plus, 
  Trash2,
  Sliders,
  HelpCircle
} from 'lucide-react';
import { GoalContractData } from '../types';

interface GoalBuilderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Partial<GoalContractData> | null;
  showToast: (msg: string) => void;
}

const DEFAULT_CONSTRAINTS_PRESETS = [
  "Do not alter public function or API signatures.",
  "Do not install new npm dependencies without approval.",
  "Do not modify database schemas or seed files.",
  "All modified files must pass local linter rules.",
  "Do not use type assertion hacks like 'any' or 'as any' in TS."
];

const PRESETS = [
  {
    name: "TypeScript Compiler & Linting",
    command: "npm run build && npm run lint",
    metric: "Zero TypeScript compilation errors and zero linter warnings."
  },
  {
    name: "React / Vitest Unit Testing",
    command: "npm run test",
    metric: "100% test pass rate with zero flaky test failures."
  },
  {
    name: "Python / Pytest Coverage",
    command: "pytest --cov=src/",
    metric: "All tests pass successfully with code coverage >= 90%."
  }
];

export const GoalBuilderDrawer: React.FC<GoalBuilderDrawerProps> = ({
  isOpen,
  onClose,
  initialData,
  showToast
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState('');
  const [objective, setObjective] = useState('');
  const [includedAssets, setIncludedAssets] = useState('');
  const [excludedAssets, setExcludedAssets] = useState('node_modules/, dist/, build/, .git/');
  const [selectedConstraints, setSelectedConstraints] = useState<string[]>([]);
  const [customConstraints, setCustomConstraints] = useState<string[]>([]);
  const [newConstraint, setNewConstraint] = useState('');
  const [verificationCommand, setVerificationCommand] = useState('npm run test');
  const [successMetric, setSuccessMetric] = useState('All tests pass successfully.');
  const [interruptionConditions, setInterruptionConditions] = useState('Errors increase for 3 consecutive execution loops.');
  const [maxIterations, setMaxIterations] = useState(10);
  const [isCopied, setIsCopied] = useState(false);

  // Synchronize initial data from parent context triggers
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || 'Agent Refactoring Task');
      setObjective(initialData.objective || '');
      setIncludedAssets(initialData.includedAssets || '');
      setExcludedAssets(initialData.excludedAssets || 'node_modules/, dist/, build/, .git/');
      setVerificationCommand(initialData.verificationCommand || 'npm run test');
      setSuccessMetric(initialData.successMetric || 'All tests pass successfully.');
      setInterruptionConditions(initialData.interruptionConditions || 'Errors increase for 3 consecutive execution loops.');
      setMaxIterations(initialData.maxIterations || 10);
      setSelectedConstraints(DEFAULT_CONSTRAINTS_PRESETS.slice(0, 2));
      setCustomConstraints([]);
    }
  }, [initialData, isOpen]);

  // Focus Trapping and Escape listener inside the Drawer
  useEffect(() => {
    if (!isOpen) return;

    // Focus the title input when opened
    const firstInput = drawerRef.current?.querySelector('input');
    if (firstInput) {
      (firstInput as HTMLElement).focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }

      if (e.key === 'Tab') {
        if (!drawerRef.current) return;
        const elements = Array.from(
          drawerRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        )
          .map(el => el as HTMLElement)
          .filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);

        if (elements.length === 0) return;

        const firstEl = elements[0];
        const lastEl = elements[elements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            lastEl.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastEl) {
            firstEl.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Toggle default constraints
  const handleToggleDefaultConstraint = (text: string) => {
    if (selectedConstraints.includes(text)) {
      setSelectedConstraints(prev => prev.filter(c => c !== text));
    } else {
      setSelectedConstraints(prev => [...prev, text]);
    }
  };

  // Add custom constraint
  const handleAddConstraint = () => {
    if (newConstraint.trim()) {
      setCustomConstraints(prev => [...prev, newConstraint.trim()]);
      setNewConstraint('');
      showToast('Custom constraint added.');
    }
  };

  // Delete custom constraint
  const handleDeleteCustomConstraint = (index: number) => {
    setCustomConstraints(prev => prev.filter((_, i) => i !== index));
  };

  // Select test suite preset
  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setVerificationCommand(preset.command);
    setSuccessMetric(preset.metric);
    showToast(`Applied preset: ${preset.name}`);
  };

  // Format all options into the final machine-readable Markdown Codex contract
  const compileContract = () => {
    const constraintsList = [...selectedConstraints, ...customConstraints];
    const constraintsMarkdown = constraintsList.length > 0
      ? constraintsList.map(c => `- ${c}`).join('\n')
      : "- No strict guardrails specified.";

    const cleanIncluded = includedAssets.trim() 
      ? includedAssets.split('\n').map(line => `- Included Assets: \`${line}\``).join('\n')
      : "- Included Assets: All files under project workspace.";

    const cleanExcluded = excludedAssets.trim()
      ? excludedAssets.split(',').map(item => item.trim()).filter(Boolean).map(item => `\`${item}\``).join(', ')
      : "None";

    return `/goal # 🎯 SYSTEM CONTRACT: ${title.toUpperCase()}

## 1. OBJECTIVE
${objective.trim() || 'No explicit objective declared.'}

## 2. CONTEXT & SCOPE
${cleanIncluded}
- Excluded Assets: ${cleanExcluded}

## 3. CONSTRAINTS & GUARDRAILS
${constraintsMarkdown}

## 4. VERIFICATION GATE (THE TEST)
- Verification Command: \`${verificationCommand.trim()}\`
- Success Metric: ${successMetric.trim()}

## 5. INTERRUPTION/STOPPING CONDITIONS
- Pause and prompt human supervisor if:
  - ${interruptionConditions.trim()}
  - Total loop iteration exceeds max limit of ${maxIterations} cycles.`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(compileContract());
    setIsCopied(true);
    showToast('Codex /goal contract copied to clipboard.');
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end font-sans">
      {/* Backdrop Click Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in" 
        onClick={onClose}
      />

      {/* Drawer Body Panel */}
      <div 
        ref={drawerRef}
        className="relative w-full max-w-2xl bg-bg-panel border-l border-border-subtle h-full flex flex-col shadow-2xl overflow-hidden animate-slide-in focus:outline-none"
        tabIndex={-1}
      >
        {/* Drawer Header */}
        <div className="p-4.5 border-b border-border-subtle flex items-center justify-between bg-[#161616]/70 backdrop-blur">
          <div className="flex items-center gap-2 text-primary">
            <Sliders className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-extrabold tracking-wider uppercase">Codex /goal Builder</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-white transition p-1.5 hover:bg-[#222222] rounded-lg cursor-pointer"
            aria-label="Close goal builder drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Split view workspace layout */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border-subtle bg-[#0A0A0A]">
          
          {/* Left Panel: Form Settings */}
          <div className="p-5 flex flex-col gap-4.5 overflow-y-auto max-h-[85vh]">
            
            {/* Title Section */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Goal Contract Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. PATCH CHECKOUT RACE CONDITION"
                className="bg-[#121212] border border-[#262626] rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-primary font-bold uppercase tracking-wider"
              />
            </div>

            {/* Objective Section */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">1. Target Objective</label>
              <textarea
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                rows={4}
                placeholder="Describe the exact, unyielding target state..."
                className="bg-[#121212] border border-[#262626] rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-primary resize-none font-sans leading-relaxed"
              />
            </div>

            {/* Included Assets */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">2. Included Assets (One per line)</label>
              <textarea
                value={includedAssets}
                onChange={(e) => setIncludedAssets(e.target.value)}
                rows={2}
                placeholder="e.g. src/components/Checkout.tsx"
                className="bg-[#121212] border border-[#262626] rounded-xl p-3 text-xs text-slate-200 font-mono outline-none focus:border-primary resize-none"
              />
            </div>

            {/* Excluded Assets */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Excluded Folders (Comma-separated)</label>
              <input
                type="text"
                value={excludedAssets}
                onChange={(e) => setExcludedAssets(e.target.value)}
                className="bg-[#121212] border border-[#262626] rounded-xl px-3 py-2 text-xs text-slate-200 font-mono outline-none focus:border-primary"
              />
            </div>

            {/* Constraints & Guardrails */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">3. Constraints & Guardrails</label>
              
              <div className="flex flex-col gap-2">
                {DEFAULT_CONSTRAINTS_PRESETS.map((text, idx) => {
                  const isChecked = selectedConstraints.includes(text);
                  return (
                    <label 
                      key={idx} 
                      className={`flex items-start gap-2.5 p-2 rounded-lg border transition cursor-pointer text-xs ${
                        isChecked 
                          ? 'bg-primary/5 border-primary/20 text-slate-200' 
                          : 'bg-[#121212] border-[#222222] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleDefaultConstraint(text)}
                        className="w-3.5 h-3.5 mt-0.5 rounded text-primary bg-[#121212] border-[#262626] focus:ring-primary/50 accent-primary"
                      />
                      <span>{text}</span>
                    </label>
                  );
                })}
              </div>

              {/* Custom Constraint Inputs */}
              {customConstraints.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center bg-[#161616]/40 border border-[#222222] p-2 rounded-lg">
                  <span className="text-xs text-slate-350 flex-1 leading-normal">• {item}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteCustomConstraint(idx)}
                    className="text-red-400 hover:text-red-300 transition p-1 cursor-pointer"
                    title="Delete constraint"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newConstraint}
                  onChange={(e) => setNewConstraint(e.target.value)}
                  placeholder="Add custom rule constraint..."
                  className="flex-1 bg-[#121212] border border-[#262626] rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-primary"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddConstraint(); }}
                />
                <button
                  type="button"
                  onClick={handleAddConstraint}
                  className="bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary font-bold text-xs p-2 rounded-xl transition cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Verification Gate Settings */}
            <div className="flex flex-col gap-3 border-t border-[#1F1F1F] pt-4">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                4. Verification Gate <HelpCircle className="h-3.5 w-3.5 text-slate-500" title="Testing framework configuration presets" />
              </label>

              {/* Presets List */}
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="text-[9.5px] bg-[#161616] hover:bg-[#222222] border border-[#262626] text-slate-350 px-2 py-1 rounded-md transition font-medium cursor-pointer"
                  >
                    {p.name.split(' ')[0]} Preset
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-1.5 mt-1">
                <label htmlFor="gate-command" className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Verification Command</label>
                <div className="flex items-center gap-2 bg-[#121212] border border-[#262626] rounded-xl pl-3 pr-2.5 py-1.5 font-mono text-xs focus-within:border-primary">
                  <Terminal className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <input
                    type="text"
                    id="gate-command"
                    value={verificationCommand}
                    onChange={(e) => setVerificationCommand(e.target.value)}
                    placeholder="e.g. npm run test"
                    className="w-full bg-transparent border-none outline-none text-slate-200"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="gate-metric" className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Success Metric</label>
                <input
                  type="text"
                  id="gate-metric"
                  value={successMetric}
                  onChange={(e) => setSuccessMetric(e.target.value)}
                  placeholder="e.g. 100% test pass rate with 0 compile errors"
                  className="bg-[#121212] border border-[#262626] rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Interruption & Loops Settings */}
            <div className="flex flex-col gap-3 border-t border-[#1F1F1F] pt-4">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">5. Stopping Conditions & Loops</label>
              
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-500 uppercase tracking-wider font-bold">Max Execution Loop Limit</span>
                  <span className="font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{maxIterations} Cycles</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="30"
                  value={maxIterations}
                  onChange={(e) => setMaxIterations(parseInt(e.target.value, 10))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5 mt-1">
                <label htmlFor="stop-conditions" className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Interruption Criteria</label>
                <textarea
                  id="stop-conditions"
                  value={interruptionConditions}
                  onChange={(e) => setInterruptionConditions(e.target.value)}
                  rows={2}
                  placeholder="Describe failure thresholds..."
                  className="bg-[#121212] border border-[#262626] rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-primary resize-none"
                />
              </div>
            </div>

          </div>

          {/* Right Panel: Code compilation live preview */}
          <div className="p-5 flex flex-col gap-3 bg-[#0c0e14] h-full overflow-hidden max-h-[85vh]">
            <div className="flex justify-between items-center shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <FileText className="h-4 w-4 text-primary" /> Live Compiled Contract
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className={`text-[10px] uppercase font-mono font-bold px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                  isCopied 
                    ? 'bg-emerald-950/20 border-emerald-500/35 text-emerald-400' 
                    : 'bg-primary text-black border-primary hover:bg-primary-hover shadow-md shadow-primary/15'
                }`}
              >
                {isCopied ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copy Contract
                  </>
                )}
              </button>
            </div>

            {/* Live Markdown Codeblock View */}
            <div className="flex-1 bg-black/50 border border-border-subtle rounded-xl p-4.5 font-mono text-[11px] text-slate-300 overflow-y-auto whitespace-pre-wrap select-text leading-relaxed select-all">
              {compileContract()}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
