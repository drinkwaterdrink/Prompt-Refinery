/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Layers,
  Code,
  ShieldAlert,
  Zap,
  RotateCcw,
  BookOpen,
  ClipboardCheck,
  Smartphone,
  Check,
  X,
  FolderOpen,
  Upload,
  History,
  Settings,
  Sliders,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  ConversationHistoryRow,
  PromptBlueprint,
  validateBlueprint,
  WorkflowHistoryItem
} from './types';
import {
  MOCK_BLUEPRINT_WORKOUTS,
  MOCK_BLUEPRINT_DASHBOARD,
  MOCK_MALFORMED_BLUEPRINT,
  generateBlueprintForPrompt
} from './mockData';

export default function App() {
  // Input states
  const [rawPrompt, setRawPrompt] = useState<string>('');
  const [projectContext, setProjectContext] = useState<string>('');
  const [historyRows, setHistoryRows] = useState<ConversationHistoryRow[]>([]);
  
  // Controls & App Settings
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState<boolean>(true);
  const [forceValidationError, setForceValidationError] = useState<boolean>(false);

  // System-level model configuration states (sessionStorage backing for fast refresh safety)
  const [model, setModel] = useState<string>(() => sessionStorage.getItem('prompt_refinery_model') || 'gemini-3.5-flash');
  const [temperature, setTemperature] = useState<number>(() => {
    const saved = sessionStorage.getItem('prompt_refinery_temperature');
    return saved ? parseFloat(saved) : 0.2;
  });
  const [maxOutputTokens, setMaxOutputTokens] = useState<number>(() => {
    const saved = sessionStorage.getItem('prompt_refinery_max_tokens');
    return saved ? parseInt(saved, 10) : 8192;
  });
  const [debugMode, setDebugMode] = useState<boolean>(() => sessionStorage.getItem('prompt_refinery_debug_mode') === 'true');
  const [strictMode, setStrictMode] = useState<boolean>(() => sessionStorage.getItem('prompt_refinery_strict_mode') !== 'false');
  const [browserApiKey, setBrowserApiKey] = useState<string>(() => sessionStorage.getItem('prompt_refinery_byok') || '');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [showApiKey, setShowApiKey] = useState<boolean>(false);

  useEffect(() => {
    sessionStorage.setItem('prompt_refinery_model', model);
  }, [model]);

  useEffect(() => {
    sessionStorage.setItem('prompt_refinery_temperature', temperature.toString());
  }, [temperature]);

  useEffect(() => {
    sessionStorage.setItem('prompt_refinery_max_tokens', maxOutputTokens.toString());
  }, [maxOutputTokens]);

  useEffect(() => {
    sessionStorage.setItem('prompt_refinery_debug_mode', debugMode.toString());
  }, [debugMode]);

  useEffect(() => {
    sessionStorage.setItem('prompt_refinery_strict_mode', strictMode.toString());
  }, [strictMode]);

  useEffect(() => {
    sessionStorage.setItem('prompt_refinery_byok', browserApiKey);
  }, [browserApiKey]);
  
  // Generator states
  const [generationMode, setGenerationMode] = useState<'mock' | 'gemini'>('mock');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<number>(0);
  const [blueprint, setBlueprint] = useState<PromptBlueprint | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[] | null>(null);
  const [geminiError, setGeminiError] = useState<string | null>(null);
  const [rawOutput, setRawOutput] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // UI Tabs inside Blueprint Explorer
  const [activeTab, setActiveTab] = useState<'overview' | 'requirements' | 'architecture' | 'data-ux' | 'reliability' | 'prompt' | 'json'>('overview');

  // Input states cache to hold context for refinement cycle adjustments
  const [originalRawPrompt, setOriginalRawPrompt] = useState<string>('');
  const [originalProjectContext, setOriginalProjectContext] = useState<string>('');
  const [originalConversationHistory, setOriginalConversationHistory] = useState<ConversationHistoryRow[]>([]);

  // Phase 5 refinement loop states
  const [rejectionStates, setRejectionStates] = useState<Record<string, { rejected: boolean; correction: string }>>({});
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [refinementError, setRefinementError] = useState<string | null>(null);
  const [revisionCount, setRevisionCount] = useState<number>(0);
  const [lastRefined, setLastRefined] = useState<string | null>(null);

  // Phase 6 persistent workflow history, import, and export states
  const [workflowHistory, setWorkflowHistory] = useState<WorkflowHistoryItem[]>([]);
  const [isWorkflowSidebarOpen, setIsWorkflowSidebarOpen] = useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Load workflow history once on mount (gracefully handles corruption)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('prompt_refinery_workflow_history');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setWorkflowHistory(parsed);
        }
      }
    } catch (err) {
      console.error("Local storage prompt runs history load was corrupted:", err);
      showToast("Could not load saving workflow history.");
    }
  }, []);

  // Trigger brief Toast alerts
  const showToast = (message: string) => {
    setToastMessage(message);
  };
  
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Loading animation simulation steps
  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setGenerationStep((prev) => {
          if (prev >= 3) {
            clearInterval(interval);
            return 3;
          }
          return prev + 1;
        });
      }, 450);
      return () => clearInterval(interval);
    } else {
      setGenerationStep(0);
    }
  }, [isGenerating]);

  // Quick-fill helper templates
  const applyPreset = (presetType: 'workout' | 'dashboard') => {
    if (presetType === 'workout') {
      setRawPrompt('build me an app to track my workouts');
      setProjectContext('Must support offline use with LocalStorage catalog, dark warm aesthetic, and an XP/level progress system.');
      setHistoryRows([
        { id: '1', role: 'user', content: 'I need a way to track dynamic sets and PRs.' },
        { id: '2', role: 'assistant', content: 'I can plan a client-first database structure storing workout templates on the client.' }
      ]);
      setIsHistoryCollapsed(false);
      showToast('Loaded Workout Presets.');
    } else if (presetType === 'dashboard') {
      setRawPrompt('add a dashboard for fleet telemetry status');
      setProjectContext('Existing app is static React. Need density, visual gauges, and action override buttons.');
      setHistoryRows([]);
      setIsHistoryCollapsed(true);
      showToast('Loaded Fleet Dashboard Presets.');
    }
  };

  // Conversation history helpers
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

  // Perform Generation Pipeline (Mock or Gemini route)
  const handleEnhancePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawPrompt.trim()) {
      showToast('Please enter a raw prompt first.');
      return;
    }

    setIsGenerating(true);
    setGenerationStep(0);
    setBlueprint(null);
    setValidationErrors(null);
    setGeminiError(null);
    setRawOutput(null);
    setRejectionStates({});
    setRefinementError(null);
    setRevisionCount(0);
    setLastRefined(null);

    if (generationMode === 'mock') {
      // Mock mode: locally handled with beautiful timed steps
      const interval = setInterval(() => {
        setGenerationStep((prev) => (prev < 3 ? prev + 1 : prev));
      }, 450);

      setTimeout(() => {
        clearInterval(interval);
        let candidateBlueprint: any;

        if (forceValidationError) {
          candidateBlueprint = MOCK_MALFORMED_BLUEPRINT;
        } else {
          candidateBlueprint = generateBlueprintForPrompt(rawPrompt, projectContext);
        }

        const errors = validateBlueprint(candidateBlueprint);
        if (errors) {
          setValidationErrors(errors);
          setBlueprint(null);
          showToast('Validation failed on generated blueprint structure.');
        } else {
          setBlueprint(candidateBlueprint);
          setValidationErrors(null);
          setOriginalRawPrompt(rawPrompt);
          setOriginalProjectContext(projectContext);
          setOriginalConversationHistory(historyRows);
          showToast('Blueprint generated and verified successfully.');
          saveToWorkflowHistory(rawPrompt, projectContext, historyRows, candidateBlueprint, 'mock');
        }
        setIsGenerating(false);
      }, 1800);
    } else {
      // Real Gemini API mode
      let intervalId: any;
      try {
        // Step ticker
        intervalId = setInterval(() => {
          setGenerationStep((prev) => (prev < 3 ? prev + 1 : prev));
        }, 500);

        const response = await fetch('/api/refine', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            rawPrompt,
            projectContext,
            conversationHistory: historyRows,
            mode: forceValidationError ? 'mock' : 'gemini',
            settings: {
              model,
              temperature,
              maxOutputTokens,
              strictMode,
              browserApiKey: browserApiKey?.trim() || undefined,
              debugMode
            }
          })
        });

        clearInterval(intervalId);

        const result = await response.json();
        if (response.ok && result.ok) {
          setBlueprint(result.blueprint);
          setValidationErrors(null);
          setGeminiError(null);
          setOriginalRawPrompt(rawPrompt);
          setOriginalProjectContext(projectContext);
          setOriginalConversationHistory(historyRows);
          showToast('Blueprint generated and verified via Gemini!');
          saveToWorkflowHistory(rawPrompt, projectContext, historyRows, result.blueprint, 'gemini');
        } else {
          setGeminiError(result.error || 'Server returned an error generating blueprint.');
          if (result.rawOutput) {
            setRawOutput(result.rawOutput);
          }
          if (result.error && (result.error.includes('Schema Validation Mismatch:') || result.error.includes('JSON Validation Error:'))) {
            const cleanErr = result.error.replace('Schema Validation Mismatch: ', '').replace('JSON Validation Error: ', '');
            const issues = cleanErr.split(' | ').join('; ').split('; ');
            setValidationErrors(issues);
          }
          showToast('Failed to refine blueprint.');
        }
      } catch (err: any) {
        if (intervalId) clearInterval(intervalId);
        console.error("Gemini API backend error:", err);
        setGeminiError(err.message || 'Network exception communicating with refinery engine.');
        showToast('Network error.');
      } finally {
        setIsGenerating(false);
      }
    }
  };

  // Phase 5: Refine Blueprint via assumption review loop
  const handleRefineBlueprint = async () => {
    if (!blueprint) return;

    setIsRefining(true);
    setRefinementError(null);

    // Filter kept vs. rejected / corrected assumptions
    const assumptions = blueprint.problem_clarification.assumptions || [];
    const kept = [];
    const rejected = [];

    for (const ass of assumptions) {
      const state = rejectionStates[ass.id];
      if (state && state.rejected) {
        rejected.push({
          id: ass.id,
          text: ass.text,
          correction: state.correction || ''
        });
      } else {
        kept.push({
          id: ass.id,
          text: ass.text,
          confidence: ass.confidence,
          source: ass.source
        });
      }
    }

    if (rejected.length === 0) {
      showToast('Please reject and correct at least one assumption to refine.');
      setIsRefining(false);
      return;
    }

    try {
      const payload = {
        originalRawPrompt: originalRawPrompt || rawPrompt,
        originalProjectContext: originalProjectContext || projectContext,
        originalConversationHistory: originalConversationHistory || historyRows,
        currentBlueprint: blueprint,
        keptAssumptions: kept,
        rejectedAssumptions: rejected,
        mode: generationMode,
        settings: {
          model,
          temperature,
          maxOutputTokens,
          strictMode,
          browserApiKey: browserApiKey?.trim() || undefined,
          debugMode
        }
      };

      const response = await fetch('/api/refine-loop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (response.ok && result?.ok) {
        setBlueprint(result.blueprint);
        setRevisionCount(prev => prev + 1);
        setLastRefined(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        setRejectionStates({}); // Reset review state since layout assumptions are redrawn
        setValidationErrors(null);
        setRefinementError(null);
        showToast(generationMode === 'mock' ? 'Blueprint refined locally!' : 'Blueprint revised successfully via Gemini!');
        saveToWorkflowHistory(
          originalRawPrompt || rawPrompt, 
          originalProjectContext || projectContext, 
          originalConversationHistory || historyRows, 
          result.blueprint, 
          generationMode
        );
      } else {
        setRefinementError(result?.error || 'Server refused requested refinement payload.');
        showToast('Failed to refine.');
      }
    } catch (err: any) {
      console.error("Refine API call failed:", err);
      setRefinementError(err.message || 'Connection exception occurred while adjusting blueprint.');
      showToast('Connection failed.');
    } finally {
      setIsRefining(false);
    }
  };

  // Reset all fields
  const handleClear = () => {
    setRawPrompt('');
    setProjectContext('');
    setHistoryRows([]);
    setBlueprint(null);
    setValidationErrors(null);
    setGeminiError(null);
    setRawOutput(null);
    setForceValidationError(false);
    setIsHistoryCollapsed(true);
    setOriginalRawPrompt('');
    setOriginalProjectContext('');
    setOriginalConversationHistory([]);
    setRejectionStates({});
    setIsRefining(false);
    setRefinementError(null);
    setRevisionCount(0);
    setLastRefined(null);
    showToast('Controls cleared.');
  };

  // Copy helper
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label} to clipboard!`);
  };

  // Export JSON helper
  const downloadJSON = (data: any, fileName: string) => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Exported JSON template.');
  };

  // Phase 6 Workflow Run History Managers
  const saveToWorkflowHistory = (
    prompt: string,
    context: string,
    history: ConversationHistoryRow[],
    bp: PromptBlueprint,
    mode: 'gemini' | 'mock'
  ) => {
    // Clean keys and secrets so they are never persisted
    const cleanPrompt = prompt.replace(/(AI_KEY|GEMINI_API_KEY|API_KEY|SECRET_KEY|token|password|auth)=["']?[a-zA-Z0-9_\-]+["']?/gi, "$1=[REDACTED]");
    const cleanContext = (context || "").replace(/(AI_KEY|GEMINI_API_KEY|API_KEY|SECRET_KEY|token|password|auth)=["']?[a-zA-Z0-9_\-]+["']?/gi, "$1=[REDACTED]");

    const title = bp.title?.trim() || `${cleanPrompt.substring(0, 30)}...`;
    const summary = bp.summary?.trim() || "No summary details successfully mapped.";

    const newItem: WorkflowHistoryItem = {
      id: `run_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title,
      timestamp: new Date().toLocaleString(),
      summary,
      provider: mode,
      rawPrompt: cleanPrompt,
      projectContext: cleanContext,
      conversationHistory: JSON.parse(JSON.stringify(history)),
      blueprint: JSON.parse(JSON.stringify(bp)),
      selectedTab: activeTab
    };

    setWorkflowHistory((prev) => {
      // Filter duplicate title runs to avoid visual run redundancy, then cap at 50 records
      const filtered = [newItem, ...prev.filter(item => item.title !== newItem.title)].slice(0, 50);
      try {
        localStorage.setItem('prompt_refinery_workflow_history', JSON.stringify(filtered));
      } catch (saveErr) {
        console.error("Local storage saving exception:", saveErr);
      }
      return filtered;
    });
  };

  const loadWorkflowHistoryItem = (item: WorkflowHistoryItem) => {
    setRawPrompt(item.rawPrompt);
    setProjectContext(item.projectContext || '');
    setHistoryRows(item.conversationHistory || []);
    setBlueprint(item.blueprint);

    // Synchronize current cache fields
    setOriginalRawPrompt(item.rawPrompt);
    setOriginalProjectContext(item.projectContext || '');
    setOriginalConversationHistory(item.conversationHistory || []);

    // Erase stale error indicators
    setValidationErrors(null);
    setGeminiError(null);
    setRawOutput(null);
    setRejectionStates({});
    setRefinementError(null);

    if (item.selectedTab) {
      setActiveTab(item.selectedTab as any);
    }
    showToast(`Restored: "${item.title}"`);
  };

  const deleteWorkflowHistoryItem = (id: string) => {
    setWorkflowHistory((prev) => {
      const next = prev.filter(item => item.id !== id);
      try {
        localStorage.setItem('prompt_refinery_workflow_history', JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
      return next;
    });
    showToast("Removed saved work record.");
  };

  const clearAllWorkflowHistory = () => {
    const confirmClear = window.confirm("Are you sure you want to delete all saved workflow runs? This action cannot be undone.");
    if (confirmClear) {
      setWorkflowHistory([]);
      try {
        localStorage.removeItem('prompt_refinery_workflow_history');
      } catch (err) {
        console.error(err);
      }
      showToast("Cleared run history.");
    }
  };

  // Specific Exports
  const handleExportJSONBlueprint = () => {
    if (!blueprint) return;
    downloadJSON(blueprint, `${blueprint.title.replace(/\s+/g, '_')}_blueprint.json`);
  };

  const handleExportFinalPromptMarkdown = () => {
    if (!blueprint) return;
    const content = blueprint.final_prompt;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${blueprint.title.replace(/\s+/g, '_')}_final_prompt.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Exported final prompt Markdown.");
  };

  const handleExportVibeCodingPacket = () => {
    if (!blueprint) return;

    const packet = {
      original_raw_prompt: originalRawPrompt,
      project_context: originalProjectContext,
      conversation_history: originalConversationHistory,
      reviewed_assumptions: blueprint.problem_clarification?.assumptions || [],
      functional_requirements_must_have: blueprint.functional_requirements?.must_have || [],
      functional_requirements_should_have: blueprint.functional_requirements?.should_have || [],
      developer_notes: blueprint.developer_notes || [],
      final_prompt: blueprint.final_prompt
    };

    downloadJSON(packet, `${blueprint.title.replace(/\s+/g, '_')}_vibe_coding_packet.json`);
    showToast("Exported complete Vibe Coding Packet.");
  };

  // Schema Validator Import Loop (Handles drag and drop vs manual selects)
  const handleImportJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);

        // Validate the shape structure against prompt blueprint schema contract
        const errors = validateBlueprint(parsed);
        if (errors) {
          setValidationErrors(errors);
          setBlueprint(null);
          showToast("Import error: file is not a valid prompt blueprint template structure.");
        } else {
          setBlueprint(parsed);
          setValidationErrors(null);
          setGeminiError(null);
          setRawOutput(null);
          setRejectionStates({});
          setRefinementError(null);

          // Sync fields gracefully
          setRawPrompt(parsed.final_prompt ? `Imported: ${parsed.title}` : "Imported Prompt");
          setProjectContext(parsed.summary || "");
          setHistoryRows([]);
          
          showToast("Imported and verified prompt blueprint successfully!");
        }
      } catch (parseErr: any) {
        showToast(`Import rejected: Not a valid JSON document format. Error: ${parseErr.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] font-sans text-slate-100 flex flex-col selection:bg-[#D4AF37]/30 selection:text-white" id="prompt-refinery-app">
      
      {/* Toast Alert Portal */}
      {toastMessage && (
        <div 
          className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-[#121212] border border-[#D4AF37]/30 text-[#D4AF37] px-4 py-3 rounded-lg shadow-2xl animate-bounce backdrop-blur"
          id="toast-alert"
        >
          <Zap className="h-4 w-4 text-[#D4AF37] fill-[#D4AF37]" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Primary Header Segment */}
      <header className="border-b border-[#1F1F1F] bg-[#0E0E0E]/90 backdrop-blur sticky top-0 z-40 py-3.5 px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#161616] border border-[#262626] p-2.5 rounded-xl shadow-lg shadow-black/50 text-[#D4AF37]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-serif text-lg md:text-xl font-bold tracking-tight text-[#D4AF37] italic">
              Prompt Refinery
            </h1>
            <p className="text-[9px] md:text-[10px] text-slate-500 font-mono tracking-widest uppercase">
              PRE-COMPILER FOR CODING AGENTS
            </p>
          </div>
        </div>

        {/* Demo Fast Presets Panel */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-center font-sans">
          
          {/* History Sidebar Toggle */}
          <button
            type="button"
            onClick={() => setIsWorkflowSidebarOpen(true)}
            className="relative text-xs bg-[#161616] hover:bg-[#222222] border border-[#262626] hover:border-[#D4AF37]/50 text-[#D4AF37] px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer"
            title="Open saved workflow runs history panel"
          >
            <History className="h-3.5 w-3.5 text-[#D4AF37]" />
            <span className="hidden md:inline">History</span>
            {workflowHistory.length > 0 && (
              <span className="bg-[#D4AF37] text-black text-[9px] font-bold px-1.5 py-0.2 rounded-full font-mono">
                {workflowHistory.length}
              </span>
            )}
          </button>

          {/* Import JSON file */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportJSON(file);
              e.target.value = ''; // Reset file input
            }} 
            accept=".json" 
            className="hidden" 
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs bg-[#161616] hover:bg-[#222222] border border-[#262626] text-slate-300 px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer"
            title="Import an existing blueprint JSON template"
          >
            <Upload className="h-3.5 w-3.5 text-[#D4AF37]" />
            <span className="hidden md:inline">Import</span>
          </button>

          {/* Settings Button (Phase 7 Modal Toggle) */}
          <button
            type="button"
            id="settings-gear-button"
            onClick={() => setIsSettingsOpen(true)}
            aria-label="Open model customization and API key settings dialog"
            className="text-xs bg-[#161616] hover:bg-[#222222] border border-[#262626] hover:border-[#D4AF37]/50 text-slate-300 hover:text-[#D4AF37] px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/75"
            title="Open engine settings & custom credentials"
          >
            <Settings className="h-3.5 w-3.5 text-[#D4AF37]" />
            <span className="hidden md:inline">Settings</span>
          </button>

          <span className="h-4 w-px bg-[#262626] mx-1 hidden md:block"></span>

          <span className="text-[10px] font-mono text-slate-500 mr-1 hidden md:inline uppercase tracking-wider">QUICK PREFILL:</span>
          <button
            type="button"
            onClick={() => applyPreset('workout')}
            className="text-xs bg-[#161616] hover:bg-[#222222] border border-[#262626] hover:border-[#D4AF37]/50 text-[#D4AF37] px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer"
          >
            💪 Workout PWA
          </button>
          <button
            type="button"
            onClick={() => applyPreset('dashboard')}
            className="text-xs bg-[#161616] hover:bg-[#222222] border border-[#262626] hover:border-[#D4AF37]/50 text-[#D4AF37] px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer"
          >
            📊 Telemetry Dashboard
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="text-xs bg-[#161616] hover:bg-[#222222] border border-[#262626] text-slate-400 p-1.5 rounded-lg transition hover:text-white"
            title="Reset All Inputs"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Work Split Grid */}
      <main className="flex-1 w-full max-w-[1700px] mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Parameters Form Column */}
        <section className="lg:col-span-5 flex flex-col gap-6" id="left-controls-panel">
          
          <form onSubmit={handleEnhancePrompt} className="bg-[#0E0E0E] border border-[#1F1F1F] rounded-2xl md:p-5 p-4 flex flex-col gap-5 shadow-2xl">
            
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

            {/* Error Injection Switch - Critical requirement check support */}
            <div className="bg-[#1F1414] border border-[#3A1E1E]/50 rounded-xl p-3 flex items-center justify-between">
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

            {/* Bottom Actions Frame */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClear}
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

        {/* Right Side: Generation Result / Output Column */}
        <section className="lg:col-span-7 flex flex-col" id="right-preview-panel">
          
          {/* Output Container */}
          <div className="flex-1 bg-[#0E0E0E] border border-[#1F1F1F] rounded-2xl flex flex-col overflow-hidden min-h-[500px] shadow-2xl">
            
            {/* 1. BEFORE GENERATION: Polished empty state */}
            {!isGenerating && !blueprint && !validationErrors && (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center" id="empty-preview-state">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-[#D4AF37]/5 blur-2xl rounded-full"></div>
                  <div className="bg-[#161616] border border-[#262626] p-5 rounded-full relative shadow-xl">
                    <Layers className="h-10 w-10 text-[#D4AF37]" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-[#D4AF37] p-1.5 rounded-full border-2 border-[#0A0A0A]">
                    <Sparkles className="h-3.5 w-3.5 text-black fill-black" />
                  </div>
                </div>
                <h3 className="font-serif text-lg font-bold text-white mb-2 italic">
                  No Active Refined Blueprint
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed mb-6">
                  Input a raw coding prompt, specify optionally relevant parameters or historical chats, and click **Enhance** to compile the prompt blueprint stack.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg text-left">
                  <div className="bg-[#161616]/40 border border-[#262626] p-3.5 rounded-xl flex items-start gap-2.5">
                    <span className="bg-[#0A0A0A] text-[#D4AF37] font-mono text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">1</span>
                    <div>
                      <h4 className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider font-mono">Expand Intent</h4>
                      <p className="text-[10px] text-slate-400 leading-normal">Categorizes constraints, edge cases, and architectural models.</p>
                    </div>
                  </div>
                  <div className="bg-[#161616]/40 border border-[#262626] p-3.5 rounded-xl flex items-start gap-2.5">
                    <span className="bg-[#0A0A0A] text-[#D4AF37] font-mono text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">2</span>
                    <div>
                      <h4 className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider font-mono">Must/Should Criteria</h4>
                      <p className="text-[10px] text-slate-400 leading-normal">Defines feature boundaries avoiding downstream scope creep.</p>
                    </div>
                  </div>
                  <div className="bg-[#161616]/40 border border-[#262626] p-3.5 rounded-xl flex items-start gap-2.5">
                    <span className="bg-[#0A0A0A] text-[#D4AF37] font-mono text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">3</span>
                    <div>
                      <h4 className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider font-mono">Data & UX Layers</h4>
                      <p className="text-[10px] text-slate-400 leading-normal">Assembles clear state loops, animations, and schemas.</p>
                    </div>
                  </div>
                  <div className="bg-[#161616]/40 border border-[#262626] p-3.5 rounded-xl flex items-start gap-2.5">
                    <span className="bg-[#0A0A0A] text-[#D4AF37] font-mono text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">4</span>
                    <div>
                      <h4 className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider font-mono">Refined Output</h4>
                      <p className="text-[10px] text-slate-400 leading-normal">Exports clean structured instructions copyable into any AI model.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. WHILE GENERATING: Loading pipeline animations */}
            {isGenerating && (
              <div className="flex-1 flex flex-col items-center justify-center p-6" id="loading-preview-state">
                <div className="flex flex-col items-center gap-6 max-w-sm w-full">
                  
                  {/* Glowing core pulse spinner */}
                  <div className="relative">
                    <div className="w-16 h-16 border-2 border-[#D4AF37]/10 rounded-full animate-ping absolute"></div>
                    <div className="w-16 h-16 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#D4AF37]">
                      <RefreshCw className="h-5 w-5 animate-spin duration-3000" />
                    </div>
                  </div>

                  <div className="text-center">
                    <h3 className="font-serif font-medium text-slate-200 text-sm tracking-wide italic">
                      Refining Prompt Architecture
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mt-1 uppercase tracking-wider">
                      Running local schema generation compiler
                    </p>
                  </div>

                  {/* High quality sequence pipeline visualizer */}
                  <div className="w-full bg-[#0A0A0A] border border-[#262626] rounded-xl p-4 flex flex-col gap-3 font-mono text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 tracking-wider">PIPELINE SEQUENCE:</span>
                      <span className="text-[#D4AF37] font-bold">{Math.round(((generationStep + 1) / 4) * 100)}%</span>
                    </div>
                    
                    <div className="flex flex-col gap-1.5 mt-1 text-left">
                      <div className="flex items-center gap-2">
                        {generationStep >= 0 ? (
                          <span className={`${generationStep > 0 ? 'text-[#D4AF37]' : 'text-amber-400 animate-pulse'} font-bold`}>✓</span>
                        ) : (
                          <span className="text-slate-700">○</span>
                        )}
                        <span className={generationStep === 0 ? 'text-slate-200 font-medium' : generationStep > 0 ? 'text-slate-500' : 'text-slate-600'}>
                          Classifying user intent & context
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {generationStep >= 1 ? (
                          <span className={`${generationStep > 1 ? 'text-[#D4AF37]' : 'text-amber-400 animate-pulse'} font-bold`}>✓</span>
                        ) : (
                          <span className="text-slate-700">○</span>
                        )}
                        <span className={generationStep === 1 ? 'text-slate-200 font-medium' : generationStep > 1 ? 'text-slate-500' : 'text-slate-600'}>
                          Delineating MoSCoW functionality
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {generationStep >= 2 ? (
                          <span className={`${generationStep > 2 ? 'text-[#D4AF37]' : 'text-amber-400 animate-pulse'} font-bold`}>✓</span>
                        ) : (
                          <span className="text-slate-700">○</span>
                        )}
                        <span className={generationStep === 2 ? 'text-slate-200 font-medium' : generationStep > 2 ? 'text-slate-500' : 'text-slate-600'}>
                          Structuring UX component schemas
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {generationStep >= 3 ? (
                          <span className="text-emerald-400 font-bold">✓</span>
                        ) : (
                          <span className="text-slate-700">○</span>
                        )}
                        <span className={generationStep === 3 ? 'text-slate-100 font-medium animate-pulse' : 'text-slate-600'}>
                          Verifying strict blueprint compliance
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* 3. ON VALIDATION ERROR STATE */}
            {!isGenerating && validationErrors && (
              <div className="flex-1 flex flex-col p-6 animate-fade-in" id="error-preview-state">
                <div className="bg-[#1F1414] border border-rose-905/30 p-4 rounded-xl flex items-start gap-3 mb-4">
                  <div className="p-1 px-1.5 bg-rose-500/10 text-rose-400 rounded-lg">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-rose-300 text-sm">
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
            )}

            {/* 3B. ON GEMINI ERROR STATE */}
            {!isGenerating && geminiError && !validationErrors && (
              <div className="flex-1 flex flex-col p-6 animate-fade-in" id="gemini-error-state">
                <div className="bg-[#1F1414] border border-rose-950/30 p-4 rounded-xl flex items-start gap-3 mb-4">
                  <div className="p-1 px-1.5 bg-rose-500/10 text-rose-400 rounded-lg">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-serif font-bold text-rose-300 text-sm">
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
                          showToast('Switched to Mock mode fallback.');
                        }}
                        className="text-[10px] font-mono uppercase bg-[#161616] hover:bg-[#222222] text-[#D4AF37] px-3 py-1.5 rounded-lg border border-[#262626] cursor-pointer transition font-bold"
                      >
                        🎭 Use Mock Fallback
                      </button>
                      <button
                        type="button"
                        onClick={handleEnhancePrompt}
                        className="text-[10px] font-mono uppercase bg-[#D4AF37] hover:bg-[#C09E32] text-black px-3 py-1.5 rounded-lg cursor-pointer transition font-bold"
                      >
                        🔄 Retry Pipeline
                      </button>
                    </div>
                  </div>
                </div>

                {rawOutput && (
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
            )}

            {/* 4. SUCCESS BLUEPRINT RENDERER */}
            {!isGenerating && blueprint && (
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
                      onClick={() => copyToClipboard(JSON.stringify(blueprint, null, 2), 'JSON Schema')}
                      className="text-[10px] bg-[#161616] hover:bg-[#222222] text-[#D4AF37] border border-[#262626] hover:border-[#D4AF37]/50 px-2 md:px-2.5 py-1.5 rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer font-bold font-mono uppercase tracking-wider"
                      title="Copy full parsed blueprint JSON code to clipboard"
                    >
                      <Copy className="h-3 w-3 text-[#D4AF37]" /> Copy JSON
                    </button>
                    <button
                      type="button"
                      onClick={handleExportJSONBlueprint}
                      className="text-[10px] bg-[#161616] hover:bg-[#222222] text-[#D4AF37] border border-[#262626] hover:border-[#D4AF37]/50 px-2 md:px-2.5 py-1.5 rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer font-bold font-mono uppercase tracking-wider"
                      title="Download full parsed template blueprint JSON file"
                    >
                      <Download className="h-3 w-3 text-[#D4AF37]" /> Export JSON
                    </button>
                    <button
                      type="button"
                      onClick={handleExportFinalPromptMarkdown}
                      className="text-[10px] bg-[#161616] hover:bg-[#222222] text-[#D4AF37] border border-[#262626] hover:border-[#D4AF37]/50 px-2 md:px-2.5 py-1.5 rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer font-bold font-mono uppercase tracking-wider"
                      title="Download final system enhancer prompt as TXT/Markdown (.md)"
                    >
                      <ClipboardCheck className="h-3 w-3 text-[#D4AF37]" /> Export Prompt
                    </button>
                    <button
                      type="button"
                      onClick={handleExportVibeCodingPacket}
                      className="text-[10px] bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 px-2 md:px-2.5 py-1.5 rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer font-bold font-mono uppercase tracking-wider"
                      title="Download the full conversation history, project context, raw prompts and requirements inside a single consolidated file"
                    >
                      <Sparkles className="h-3 text-[#D4AF37]" /> Vibe Packet
                    </button>
                  </div>
                </div>

                {/* Main output header */}
                <div className="p-5 border-b border-[#1F1F1F] bg-[#161616]/20">
                  <h2 className="font-serif text-lg md:text-xl font-bold text-[#D4AF37] italic flex items-center gap-2 leading-snug">
                    <Code className="h-4.5 w-4.5 text-[#D4AF37]" /> {blueprint.title}
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
                        : 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20'
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
                            ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/5'
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
                        <div className="text-[9px] text-[#D4AF37] font-mono uppercase tracking-widest mb-1.5 font-bold">REFINED TARGET</div>
                        <h3 className="font-serif text-base font-bold italic text-slate-100 mb-2">
                          {blueprint.title || "Not specified"}
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed mb-4">
                          {blueprint.summary || "Not specified"}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-[#262626]/60 pt-3">
                          <div className="bg-black/30 p-2.5 rounded-lg border border-[#262626]/40">
                            <span className="text-[9px] text-slate-500 font-mono uppercase block mb-0.5 tracking-wider">Request Type</span>
                            <span className="text-xs font-mono font-semibold capitalize text-[#D4AF37]">
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
                        <h3 className="text-[10px] font-mono font-bold text-[#D4AF37] uppercase tracking-widest">
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
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span> Core Objectives
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
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span> Target Demographics
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
                        <h3 className="text-[10px] font-mono font-bold text-[#D4AF37] uppercase tracking-widest">
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
                        <h3 className="text-[10px] font-mono font-bold text-[#D4AF37] uppercase tracking-widest">
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
                                            <span className={`text-[9px] font-mono uppercase tracking-wide font-bold ${assState.rejected ? 'text-rose-455' : 'text-slate-400 group-hover:text-slate-350'}`}>
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
                                          value={assState.correction}
                                          onChange={(e) => {
                                            setRejectionStates({
                                              ...rejectionStates,
                                              [ass.id]: {
                                                ...assState,
                                                correction: e.target.value
                                              }
                                            });
                                          }}
                                          placeholder="e.g. Reject default local state state; require Cloud Firestore backend."
                                          className="w-full text-xs bg-[#161616] border border-rose-950/50 focus:border-rose-900/80 rounded-lg p-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-0 font-sans"
                                          rows={2}
                                        />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Refinement Control Panel */}
                            <div className="mt-2 bg-[#161616]/30 border border-[#262626] rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                              <div className="text-left">
                                <h4 className="text-xs font-mono font-bold text-slate-300">
                                  Assumption Refinement Loop
                                </h4>
                                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                                  Mark assumptions above as rejected and optionally supply corrections. We will iteratively modify the requirements, database schemas, and final code prompt to match!
                                </p>
                                
                                {/* Revision count / timestamp indicators */}
                                {(revisionCount > 0 || lastRefined) && (
                                  <div className="flex gap-2.5 mt-2 flex-wrap">
                                    {revisionCount > 0 && (
                                      <span className="text-[9px] font-mono bg-violet-950/40 text-violet-400 border border-violet-900/30 px-1.5 py-0.5 rounded">
                                        REVISION: #{revisionCount}
                                      </span>
                                    )}
                                    {lastRefined && (
                                      <span className="text-[9px] font-mono bg-slate-900 text-slate-400 border border-slate-800 px-1.5 py-0.5 rounded">
                                        UPDATED AT: {lastRefined}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0 w-full sm:w-auto">
                                <button
                                  onClick={handleRefineBlueprint}
                                  disabled={isRefining || (Object.values(rejectionStates) as any[]).filter((s: any) => s.rejected).length === 0}
                                  className={`px-5 py-2 rounded-lg font-mono text-xs font-bold transition flex items-center justify-center gap-2 ${
                                    isRefining 
                                      ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 cursor-wait'
                                      : (Object.values(rejectionStates) as any[]).filter((s: any) => s.rejected).length > 0
                                      ? 'bg-rose-650 hover:bg-rose-700 text-white shadow-lg shadow-rose-950/20 active:scale-[0.98] cursor-pointer'
                                      : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                                  }`}
                                >
                                  {isRefining ? (
                                    <>
                                      <svg className="animate-spin h-3.5 w-3.5 text-rose-500" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                      </svg>
                                      Refining blueprint...
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3 3L22 4" />
                                      </svg>
                                      Adjust Blueprint
                                    </>
                                  )}
                                </button>

                                {(Object.values(rejectionStates) as any[]).filter((s: any) => s.rejected).length > 0 && !isRefining && (
                                  <span className="text-[10px] font-mono text-rose-455 text-center sm:text-right font-medium">
                                    {(Object.values(rejectionStates) as any[]).filter((s: any) => s.rejected).length} rejected instruction(s)
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Refinement error handler banner */}
                            {refinementError && (
                              <div className="mt-2 border border-rose-950/70 bg-rose-950/20 p-3 rounded-lg text-xs text-rose-400 animate-fade-in text-left">
                                <div className="font-mono font-bold uppercase text-[9px] mb-0.5 tracking-wider text-rose-350">Refinement Error</div>
                                <div>{refinementError}</div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic bg-[#161616]/40 border border-[#262626] p-3 rounded-lg">No assumptions registered</p>
                        )}
                      </div>

                    </div>
                  )}

                  {/* Tab 2: MoSCoW functionality */}
                  {activeTab === 'requirements' && (
                    <div className="flex flex-col gap-6 animate-fade-in" id="tab-reqs-view">
                      
                      <div className="flex flex-col gap-1.5">
                        <h3 className="text-[10px] font-mono font-bold text-[#D4AF37] uppercase tracking-widest">
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
                            <ul className="text-xs text-slate-350 flex flex-col gap-2.5 list-none">
                              {blueprint.functional_requirements.must_have.map((itm, i) => (
                                <li key={i} className="flex gap-2 items-start leading-relaxed animate-fade-in">
                                  <span className="text-emerald-500 font-bold select-none">✓</span>
                                  <span className="text-slate-300">{itm}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-slate-500 italic">Not specified</p>
                          )}
                        </div>

                        {/* Should Have */}
                        <div className="border border-[#D4AF37]/20 bg-[#D4AF37]/5 rounded-xl p-4">
                          <div className="flex items-center justify-between border-b border-[#D4AF37]/15 pb-2 mb-3">
                            <h4 className="text-[10px] font-mono font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span> Should Have
                            </h4>
                            <span className="text-[9px] text-[#D4AF37] font-mono uppercase bg-[#D4AF37]/10 border border-[#D4AF37]/25 px-1.5 py-0.5 rounded font-bold tracking-wider">Enhancement</span>
                          </div>
                          {blueprint.functional_requirements.should_have && blueprint.functional_requirements.should_have.length > 0 ? (
                            <ul className="text-xs text-slate-350 flex flex-col gap-2.5 list-none">
                              {blueprint.functional_requirements.should_have.map((itm, i) => (
                                <li key={i} className="flex gap-2 items-start leading-relaxed animate-fade-in">
                                  <span className="text-[#D4AF37] font-bold select-none">•</span>
                                  <span className="text-slate-300">{itm}</span>
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
                            <ul className="text-xs text-slate-350 flex flex-col gap-2.5 list-none">
                              {blueprint.functional_requirements.could_have.map((itm, i) => (
                                <li key={i} className="flex gap-2 items-start leading-relaxed animate-fade-in">
                                  <span className="text-slate-500 select-none">◦</span>
                                  <span className="text-slate-300">{itm}</span>
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
                                  <span className="text-slate-400">{itm}</span>
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
                        <h3 className="text-[10px] font-mono font-bold text-[#D4AF37] uppercase tracking-widest">
                          Tech Stack Allocations
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <div className="bg-[#161616]/45 border border-[#262626] p-3.5 rounded-xl flex flex-col gap-1.5 animate-fade-in">
                            <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Paradigm</span>
                            <span className="text-xs font-semibold font-mono text-[#D4AF37]">{blueprint.architecture.paradigm || "Not specified"}</span>
                          </div>
                          <div className="bg-[#161616]/45 border border-[#262626] p-3.5 rounded-xl flex flex-col gap-1.5 animate-fade-in">
                            <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Frontend Framework</span>
                            <span className="text-xs font-semibold font-mono text-[#D4AF37]">{blueprint.architecture.frontend || "Not specified"}</span>
                          </div>
                          <div className="bg-[#161616]/45 border border-[#262626] p-3.5 rounded-xl flex flex-col gap-1.5 animate-fade-in">
                            <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Backend Tier</span>
                            <span className="text-xs font-semibold font-mono text-[#D4AF37]">{blueprint.architecture.backend || "Not specified"}</span>
                          </div>
                          <div className="bg-[#161616]/45 border border-[#262626] p-3.5 rounded-xl flex flex-col gap-1.5 animate-fade-in">
                            <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Database Platform</span>
                            <span className="text-xs font-semibold font-mono text-[#D4AF37]">{blueprint.architecture.database || "Not specified"}</span>
                          </div>
                          <div className="bg-[#161616]/45 border border-[#262626] p-3.5 rounded-xl flex flex-col gap-1.5 animate-fade-in">
                            <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">APIs & Protocols</span>
                            <span className="text-xs font-semibold font-mono text-[#D4AF37]">{blueprint.architecture.apis || "Not specified"}</span>
                          </div>
                          <div className="bg-[#161616]/45 border border-[#262626] p-3.5 rounded-xl flex flex-col gap-1.5 animate-fade-in">
                            <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Infrastructure & Host</span>
                            <span className="text-xs font-semibold font-mono text-[#D4AF37]">{blueprint.architecture.infra || "Not specified"}</span>
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
                                <span className="text-[#D4AF37] text-xs font-bold shrink-0">⚙</span>
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
                        <h3 className="text-[10px] font-mono font-bold text-[#D4AF37] uppercase tracking-widest">
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
                            <h3 className="text-[10px] font-mono font-bold text-[#D4AF37] uppercase tracking-widest mb-1 animate-pulse">
                              Memory States & Entity Schemas
                            </h3>
                            <p className="text-[10px] text-slate-500">Persistent database models, schema contracts, and logic models.</p>
                          </div>

                          <div className="flex flex-col gap-2">
                            <span className="text-[9px] text-slate-500 font-bold font-mono tracking-wider">ENTITIES LAYER</span>
                            {blueprint.data_models.entities && blueprint.data_models.entities.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {blueprint.data_models.entities.map((ent, idx) => (
                                  <span key={idx} className="bg-[#0A0A0A] border border-[#262626] px-2.5 py-1 rounded text-xs text-slate-355 font-mono text-slate-300">
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
                            <h3 className="text-[10px] font-mono font-bold text-[#D4AF37] uppercase tracking-widest mb-1">
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
                          <h4 className="text-[10px] font-mono font-bold text-[#D4AF37] uppercase tracking-wider">Animations Guide</h4>
                          <p className="text-xs text-slate-300 leading-relaxed bg-[#0A0A0A]/40 border border-[#262626]/40 p-2.5 rounded-lg leading-normal">
                            {blueprint.user_experience.animations || "Not specified"}
                          </p>
                        </div>
                        <div className="bg-[#161616]/40 border border-[#262626] p-4 rounded-xl flex flex-col gap-2">
                          <h4 className="text-[10px] font-mono font-bold text-[#D4AF37] uppercase tracking-wider">Accessibility Standards</h4>
                          <p className="text-xs text-slate-300 leading-relaxed bg-[#0A0A0A]/40 border border-[#262626]/40 p-2.5 rounded-lg leading-normal">
                            {blueprint.user_experience.accessibility || "Not specified"}
                          </p>
                        </div>
                        <div className="bg-[#161616]/40 border border-[#262626] p-4 rounded-xl flex flex-col gap-2">
                          <h4 className="text-[10px] font-mono font-bold text-[#D4AF37] uppercase tracking-wider">UI Interaction States</h4>
                          {blueprint.user_experience.interaction_states && blueprint.user_experience.interaction_states.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {blueprint.user_experience.interaction_states.map((st, idx) => (
                                <span key={idx} className="bg-[#D4AF37]/15 border border-[#D4AF37]/25 text-[#D4AF37] text-[9px] font-mono px-2 py-0.5 rounded">
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
                              <span key={idx} className="bg-[#0A0A0A] hover:bg-[#111111] border border-[#262626] text-[#D4AF37] text-[10px] font-mono px-3 py-1.5 rounded-lg transition font-semibold">
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
                                <span className="bg-[#D4AF37]/15 text-[#D4AF37] font-mono text-[10px] w-6 h-6 rounded-full flex items-center justify-center font-bold border border-[#D4AF37]/25 shrink-0">
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
                          <h4 className="text-[10px] font-mono font-bold text-[#D4AF37] uppercase tracking-widest mb-1">
                            Security & Authorization Rules
                          </h4>
                          <p className="text-[10px] text-slate-500">Critical privacy gates, token algorithms, and payload hygiene.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed text-slate-350">
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
                          <h4 className="text-[10px] font-mono font-bold text-[#D4AF37] uppercase tracking-widest mb-1">
                            Performance & SLA Targets
                          </h4>
                          <p className="text-[10px] text-slate-500">Target latency, local machine bounds, and operational scales.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs leading-relaxed text-slate-350">
                          <div className="bg-[#0A0A0A] p-3 rounded-lg border border-[#262626]">
                            <span className="font-bold text-slate-500 text-[9px] block mb-1 tracking-wide font-mono uppercase">App Scalability Profile</span>
                            <p>{blueprint.performance_constraints.scalability || "Not specified"}</p>
                          </div>
                          <div className="bg-[#0A0A0A] p-3 rounded-lg border border-[#262626]">
                            <span className="font-bold text-slate-500 text-[9px] block mb-1 tracking-wide font-mono uppercase">Max Load Latency Bounds</span>
                            <p className="font-mono text-[11px] text-[#D4AF37] font-bold">{blueprint.performance_constraints.latency || "Not specified"}</p>
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
                                <span className="text-slate-350">{ec}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic">None specified</p>
                        )}
                      </div>

                      {/* Developer Notes / Complexity guides */}
                      <div className="bg-amber-950/5 border border-amber-900/15 rounded-xl p-4.5 flex flex-col gap-2.5">
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
                          <h3 className="text-[10px] font-mono font-bold text-[#D4AF37] uppercase tracking-widest animate-pulse">
                            Refined Execution Prompt
                          </h3>
                          <p className="text-[11px] text-slate-400 mt-1">Copy this detailed directive directly into secondary coding agents.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(blueprint.final_prompt, 'Refined Prompt')}
                          className="bg-[#D4AF37] hover:bg-[#C09E32] text-black text-[10px] font-mono uppercase font-bold px-3 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer shadow-lg shadow-[#D4AF37]/15"
                        >
                          <Copy className="h-3.5 w-3.5" /> Copy Prompt
                        </button>
                      </div>

                      {/* Stat summary counters */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#161616]/40 border border-[#262626] p-3 rounded-lg text-center font-mono">
                          <span className="text-[9px] text-slate-500 uppercase block tracking-wider">Total Characters</span>
                          <span className="text-sm font-semibold text-[#D4AF37]">{blueprint.final_prompt.length} CHR</span>
                        </div>
                        <div className="bg-[#161616]/40 border border-[#262626] p-3 rounded-lg text-center font-mono">
                          <span className="text-[9px] text-slate-500 uppercase block tracking-wider">Estimated Word Count</span>
                          <span className="text-sm font-semibold text-[#D4AF37]">
                            {blueprint.final_prompt.trim().split(' ').filter((w) => w.length > 0).length} WRD
                          </span>
                        </div>
                      </div>

                      <div className="bg-[#0A0A0A] border-2 border-[#D4AF37]/20 focus-within:border-[#D4AF37]/50 rounded-xl overflow-hidden shadow-2xl relative">
                        <div className="px-4 py-2 bg-[#111111] border-b border-[#262626] text-[10px] text-slate-500 flex items-center justify-between font-mono tracking-wider font-bold">
                          <span>AGENT DIRECTIVE PAYLOAD</span>
                          <span className="text-[#D4AF37]">PRESERVES RAW LAYOUT WHITESPACE</span>
                        </div>
                        <textarea
                          readOnly
                          rows={15}
                          value={blueprint.final_prompt}
                          className="w-full bg-transparent font-mono text-xs p-4 leading-relaxed text-slate-100 outline-none resize-none focus:ring-0 border-0 text-slate-200"
                          onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                        />
                      </div>

                      <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-xl p-4 text-xs text-[#D4AF37]/90 leading-relaxed flex items-start gap-3">
                        <div className="p-1 px-1.5 bg-[#D4AF37]/10 text-[#D4AF37] rounded">
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
                          <h3 className="text-[10px] font-mono font-bold text-[#D4AF37] uppercase tracking-widest">
                            Raw Blueprint JSON Spec
                          </h3>
                          <p className="text-[11px] text-slate-400 mt-1">Detailed metadata parsed matching Schema version '1.0' contract.</p>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(JSON.stringify(blueprint, null, 2), 'JSON Specification')}
                            className="bg-[#161616] hover:bg-[#222222] text-[#D4AF37] border border-[#262626] text-[10px] font-mono uppercase font-bold px-3 py-2.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <Copy className="h-3.5 w-3.5" /> Copy JSON
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadJSON(blueprint, `${blueprint.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-blueprint.json`)}
                            className="bg-[#D4AF37] hover:bg-[#C09E32] text-black text-[10px] font-mono uppercase font-bold px-3 py-2.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-[#D4AF37]/20"
                          >
                            <Download className="h-3.5 w-3.5" /> Download
                          </button>
                        </div>
                      </div>

                      <div className="bg-[#0A0A0A] border border-[#262626] rounded-xl overflow-hidden shadow-2xl relative">
                        <div className="px-4 py-2 bg-[#111111] border-b border-[#262626] text-[10px] text-slate-500 flex items-center justify-between font-mono tracking-wider font-bold">
                          <span>PARSED METADATA SPECIFICATION</span>
                          <span className="text-[#D4AF37]">SCHEMA_VERSION "1.0"</span>
                        </div>
                        <pre className="font-mono text-xs text-emerald-440/90 text-emerald-400 leading-relaxed p-4 max-h-[360px] overflow-y-auto block whitespace-pre bg-black">
                          {JSON.stringify(blueprint, null, 2)}
                        </pre>
                      </div>

                      {/* Display original model raw output if cached for debugging */}
                      {rawOutput && (
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
            )}

          </div>
        </section>

      </main>

      {/* Real-time Diagnostics HUD (Active in Debug Mode) */}
      {debugMode && (
        <div className="max-w-[1700px] w-full mx-auto px-4 md:px-6 mb-4 animate-fade-in" id="debug-diagnostics-hub">
          <div className="bg-[#121111] border border-amber-500/20 rounded-xl p-4 flex flex-col gap-3 font-mono text-xs text-slate-300">
            <div className="flex items-center justify-between border-b border-[#222222] pb-2 text-amber-400 font-bold">
              <span className="flex items-center gap-1.5 uppercase tracking-widest text-[10px]">
                ⚡ Debug Panel: Live Refinery State Diagnostics
              </span>
              <span className="bg-amber-500/10 text-amber-300 text-[9px] px-2 py-0.5 rounded font-mono uppercase">
                Active System HUD
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[11px] leading-relaxed">
              <div>
                <span className="text-slate-500 select-none block">Execution Mode:</span>
                <span className="font-bold text-[#D4AF37] uppercase">{generationMode}</span>
              </div>
              <div>
                <span className="text-slate-500 select-none block">Active ID:</span>
                <span className="font-bold">{model}</span>
              </div>
              <div>
                <span className="text-slate-500 select-none block">Creativity Temperature:</span>
                <span className="font-bold">{temperature}</span>
              </div>
              <div>
                <span className="text-slate-500 select-none block">Max Output Cap:</span>
                <span className="font-bold text-slate-400">{maxOutputTokens} Token Limit</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px] bg-black/35 p-3 rounded-lg border border-[#1F1F1F]">
              <div>
                <span className="text-slate-500 block mb-1">Raw API Secret Configured:</span>
                {browserApiKey ? (
                  <span className="text-emerald-400 font-mono font-bold">
                    [CLIENT SIDE BYOK DETECTED]
                  </span>
                ) : (
                  <span className="text-slate-600 font-mono italic">
                    [NO CLIENT BYOK - FALLING BACK TO SERVER SECRET / REALTIME OR MOCK ENGINES]
                  </span>
                )}
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Constraints & Verification Toggles:</span>
                <span className="text-slate-400 text-[10px]">
                  Strict Scheme Enforce: <strong className={strictMode ? "text-emerald-400" : "text-amber-400"}>{strictMode ? "ENABLED (BLUEPRINT_SCHEMA)" : "DISABLED"}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Primary Footer Section */}
      <footer className="border-t border-[#1F1F1F] bg-[#0A0A0A] mt-12 py-6 px-4 md:px-6">
        <div className="max-w-[1700px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Prompt Refinery v1.0 • Client Stage Sandbox</span>
            <span className="w-1 h-1 rounded-full bg-slate-800"></span>
            <span>All logs isolated on local domain</span>
          </div>
          <div className="text-[11px] text-slate-600 font-mono text-center md:text-right">
            <span>Designed for precision-crafted prompt generation inside Google AI Studio</span>
          </div>
        </div>
      </footer>

      {/* Sliding Workflow History Sidebar Overlay Drawer */}
      {isWorkflowSidebarOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex bg-black/60 backdrop-blur-xs animate-fade-in animate-duration-150" id="workflow-history-drawer">
          {/* Overlay Click-to-Dismiss */}
          <div className="absolute inset-0 cursor-pointer" onClick={() => setIsWorkflowSidebarOpen(false)}></div>
          
          {/* Drawer body */}
          <div className="relative w-full max-w-md bg-[#0F0E0E] h-full right-0 ml-auto border-l border-[#1F1F1F] flex flex-col shadow-2xl justify-between animate-slide-in">
            <div className="p-4 border-b border-[#1F1F1F] flex items-center justify-between bg-[#161616]/40">
              <div className="flex items-center gap-2 text-[#D4AF37]">
                <BookOpen className="h-4.5 w-4.5" />
                <h3 className="font-serif font-bold text-sm">Workflow Runs History</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsWorkflowSidebarOpen(false)}
                className="text-slate-500 hover:text-white transition p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {workflowHistory.length === 0 ? (
                <div className="text-center py-10 text-slate-500 border border-dashed border-[#262626] rounded-xl bg-[#0A0A0A] flex flex-col items-center justify-center">
                  <RotateCcw className="h-8 w-8 text-slate-700 mb-2" />
                  <p className="text-xs">No workflow runs saved yet.</p>
                  <p className="text-[10px] text-slate-600 mt-1 max-w-[220px]">
                    Successfully generate prompts using Mock or Gemini modes to automatically persist runs.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                      {workflowHistory.length} Saved Run{workflowHistory.length === 1 ? '' : 's'} (Limit 50)
                    </span>
                    <button
                      type="button"
                      onClick={clearAllWorkflowHistory}
                      className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium transition cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" /> Clear All
                    </button>
                  </div>
                  
                  {workflowHistory.map((item) => (
                    <div 
                      key={item.id}
                      className="group relative bg-[#161616]/60 hover:bg-[#1C1C1C] border border-[#262626] hover:border-[#D4AF37]/40 rounded-xl p-3.5 transition flex flex-col gap-2 cursor-pointer"
                      onClick={() => {
                        loadWorkflowHistoryItem(item);
                        setIsWorkflowSidebarOpen(false);
                      }}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <h4 className="font-serif font-semibold text-xs text-[#D4AF37] group-hover:underline text-ellipsis overflow-hidden whitespace-nowrap max-w-[220px]">
                          {item.title}
                        </h4>
                        <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold border shrink-0 ${
                          item.provider === 'gemini' 
                            ? 'bg-amber-950/20 text-amber-400 border-amber-900/30' 
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}>
                          {item.provider}
                        </span>
                      </div>
                      
                      <p className="text-[10.5px] text-slate-400 font-sans line-clamp-2 leading-relaxed">
                        {item.summary}
                      </p>
                      
                      <div className="bg-[#0A0A0A] p-2 rounded-lg border border-[#1F1F1F]/40 text-[10px] text-slate-500 font-mono italic truncate">
                        Prompt: "{item.rawPrompt.substring(0, 80)}{item.rawPrompt.length > 80 ? '...' : ''}"
                      </div>

                      <div className="flex items-center justify-between text-[8.5px] text-slate-600 font-mono mt-0.5">
                        <span>{item.timestamp}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteWorkflowHistoryItem(item.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-300 transition p-1 hover:bg-rose-950/20 rounded cursor-pointer"
                          title="Delete run record"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#1F1F1F] bg-[#0A0A0A] flex flex-col gap-2">
              <p className="text-[10px] text-slate-500 leading-normal text-center">
                Workflows are stored locally in sandbox browser storage. Sensitive security tags and keys are stripped.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Settings and Credentials Modal */}
      {isSettingsOpen && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/75 backdrop-blur-md animate-fade-in" 
          id="settings-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-modal-title"
        >
          {/* Overlay click catcher to close */}
          <div className="absolute inset-0 cursor-pointer" onClick={() => setIsSettingsOpen(false)}></div>
          
          {/* Modal Box */}
          <div className="relative w-full max-w-lg bg-[#0F0E0E] border border-[#222222] rounded-2xl shadow-3xl overflow-hidden flex flex-col mx-4 animate-scale-up">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-[#1F1F1F] flex items-center justify-between bg-[#161616]/50">
              <div className="flex items-center gap-2.5 text-[#D4AF37]">
                <Settings className="h-5 w-5 text-[#D4AF37]" />
                <h3 className="font-serif font-bold text-base italic" id="settings-modal-title">Engine Configuration</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-500 hover:text-white transition p-1.5 hover:bg-[#222222] rounded-lg cursor-pointer"
                aria-label="Close settings dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scroll Body */}
            <div className="p-6 overflow-y-auto max-h-[70vh] flex flex-col gap-5 text-sm">
              
              {/* 1. Mode/Provider Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Execution Provider
                </label>
                <div className="grid grid-cols-2 gap-2 bg-[#161616] p-1 rounded-xl border border-[#262626]">
                  <button
                    type="button"
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
                <p className="text-[10.5px] text-slate-500 font-mono mt-0.5">
                  {generationMode === 'mock' 
                    ? '🎭 Runs prompt refiners instantly in beautiful offline simulation mode.' 
                    : '⚡ Connects server-side to live Gemini intelligence. Requires configured API credentials.'}
                </p>
              </div>

              {/* 2. Model Dropdown Choice */}
              <div className="flex flex-col gap-2">
                <label htmlFor="settings-model" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  System LLM Model Whitelist
                </label>
                <select
                  id="settings-model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="bg-[#121212] border border-[#262626] rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-200 focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                >
                  <option value="gemini-3.5-flash">gemini-3.5-flash (Default / Smart & Fast)</option>
                  <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Complex / Reasoning & Code-aware)</option>
                  <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Ultra-quick / Low latency)</option>
                </select>
              </div>

              {/* 3. Temperature Parameter Slider */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="settings-temp" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Creativity Temperature
                  </label>
                  <span className="text-xs font-mono text-[#D4AF37] font-bold bg-[#D4AF37]/10 px-1.5 py-0.5 rounded">
                    {temperature}
                  </span>
                </div>
                <input
                  type="range"
                  id="settings-temp"
                  min="0.0"
                  max="1.0"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0.0 (Strict / Schema focus)</span>
                  <span className="text-[#D4AF37]">Recommended: 0.2 - 0.4</span>
                  <span>1.0 (Highly diverse)</span>
                </div>
              </div>

              {/* 4. Max Output Tokens */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="settings-tokens" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Max Response Length (Tokens)
                  </label>
                  <span className="text-xs font-mono text-[#D4AF37] font-bold bg-[#D4AF37]/10 px-1.5 py-0.5 rounded">
                    {maxOutputTokens.toLocaleString()} tokens
                  </span>
                </div>
                <input
                  type="range"
                  id="settings-tokens"
                  min="1000"
                  max="50000"
                  step="500"
                  value={maxOutputTokens}
                  onChange={(e) => setMaxOutputTokens(parseInt(e.target.value, 10))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>1,000 (Fast)</span>
                  <span className="text-[#D4AF37]">Recommended: 8,192</span>
                  <span>50,000 (Max Depth)</span>
                </div>
              </div>

              {/* 5. Toggles: Schema Mode & Debug Mode */}
              <div className="grid grid-cols-2 gap-4 border-t border-[#1F1F1F] pt-4.5">
                
                {/* Toggle 1: Strict JSON */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="settings-strict"
                      checked={strictMode}
                      onChange={(e) => setStrictMode(e.target.checked)}
                      className="w-4 h-4 rounded text-[#D4AF37] bg-[#121212] border-[#262626] focus:ring-[#D4AF37]/50 cursor-pointer focus:ring-2 accent-[#D4AF37]"
                    />
                    <label htmlFor="settings-strict" className="text-xs font-bold text-slate-300 select-none cursor-pointer">
                      Strict Schema JSON
                    </label>
                  </div>
                  <p className="text-[10.5px] text-slate-500 leading-normal">
                    Forces live Gemini responses to map directly to OpenAPI parameters. Forces exact fields.
                  </p>
                </div>

                {/* Toggle 2: Debug Mode */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="settings-debug"
                      checked={debugMode}
                      onChange={(e) => setDebugMode(e.target.checked)}
                      className="w-4 h-4 rounded text-[#D4AF37] bg-[#121212] border-[#262626] focus:ring-[#D4AF37]/50 cursor-pointer focus:ring-2 accent-[#D4AF37]"
                    />
                    <label htmlFor="settings-debug" className="text-xs font-bold text-slate-300 select-none cursor-pointer">
                      Activate Debug Mode
                    </label>
                  </div>
                  <p className="text-[10.5px] text-slate-500 leading-normal">
                    Shows raw model results, JSON syntax, and server stack traces on failure.
                  </p>
                </div>

              </div>

              {/* 6. Browser-stored API Keys Credentials */}
              <div className="border-t border-[#1F1F1F] pt-4.5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="settings-byok" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    Browser BYOK API Credentials <span className="text-[9px] text-slate-500 font-mono font-medium">(Optional)</span>
                  </label>
                  {browserApiKey && (
                    <button
                      type="button"
                      onClick={() => {
                        setBrowserApiKey('');
                        showToast('Saved custom key removed from session.');
                      }}
                      className="text-[10px] text-red-400 hover:text-red-300 font-mono font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" /> Clear Key
                    </button>
                  )}
                </div>

                <div className="relative flex items-center font-mono">
                  <input
                    type={showApiKey ? "text" : "password"}
                    id="settings-byok"
                    value={browserApiKey}
                    onChange={(e) => setBrowserApiKey(e.target.value)}
                    placeholder="Optional personal key: AIzaSy..."
                    className="w-full bg-[#121212] border border-[#262626] hover:border-slate-800 focus:border-[#D4AF37] rounded-xl pl-3 pr-10 py-2.5 text-xs text-slate-200 placeholder-slate-600 font-mono outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 text-slate-400 hover:text-white transition cursor-pointer p-0.5"
                    aria-label={showApiKey ? "Hide API key" : "Show API key"}
                  >
                    {showApiKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {/* Secure warning label block */}
                <div className="bg-red-950/20 border border-red-900/35 rounded-xl p-3.5 flex items-start gap-2.5 text-rose-300">
                  <ShieldAlert className="h-4.5 w-4.5 text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-[10.5px] leading-relaxed">
                    Browser-stored API keys are convenient for local/personal use but are not secure against malicious scripts or compromised devices. For production, use server-side environment variables or a secure backend key vault.
                  </p>
                </div>
              </div>

            </div>

            {/* Modal Bottom Buttons */}
            <div className="p-5 border-t border-[#1F1F1F] bg-[#161616]/30 flex items-center justify-end font-sans">
              <button
                type="button"
                id="close-settings-modal"
                onClick={() => {
                  setIsSettingsOpen(false);
                  showToast('Configurations updated.');
                }}
                className="bg-[#D4AF37] text-black font-bold text-xs px-5 py-2 rounded-xl transition hover:opacity-90 active:scale-98 shadow-md cursor-pointer"
              >
                Apply & Save Changes
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
