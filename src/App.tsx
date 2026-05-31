/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, History, Upload, Settings, RotateCcw } from 'lucide-react';

import { ConversationHistoryRow, WorkflowHistoryItem } from './types';
import { useToast } from './hooks/useToast';
import { useWorkflowHistory } from './hooks/useWorkflowHistory';
import { useBlueprintGeneration } from './hooks/useBlueprintGeneration';
import { copyToClipboardSafe } from './lib/clipboard';
import { detectAndParseImport } from './lib/json';
import { downloadJSON, downloadMarkdown } from './lib/exporters';

// Components
import { Toast } from './components/Toast';
import { EmptyBlueprintState } from './components/EmptyBlueprintState';
import { LoadingState } from './components/LoadingState';
import { SettingsModal } from './components/SettingsModal';
import { WorkflowHistorySidebar } from './components/WorkflowHistorySidebar';
import { InputPanel } from './components/InputPanel';
import { BlueprintExplorer } from './components/BlueprintExplorer';
import { CreativeSparkDrawer } from './components/CreativeSparkDrawer';
import { SparkIdea } from './types';

export default function App() {
  // Toast Alert hook
  const { toastMessage, showToast } = useToast();

  // Input states
  const [rawPrompt, setRawPrompt] = useState<string>('');
  const [projectContext, setProjectContext] = useState<string>('');
  const [historyRows, setHistoryRows] = useState<ConversationHistoryRow[]>([]);
  
  // UI toggles
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState<boolean>(true);
  const [forceValidationError, setForceValidationError] = useState<boolean>(false);

  // Settings states backed by sessionStorage
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

  // Sync settings to sessionStorage
  useEffect(() => { sessionStorage.setItem('prompt_refinery_model', model); }, [model]);
  useEffect(() => { sessionStorage.setItem('prompt_refinery_temperature', temperature.toString()); }, [temperature]);
  useEffect(() => { sessionStorage.setItem('prompt_refinery_max_tokens', maxOutputTokens.toString()); }, [maxOutputTokens]);
  useEffect(() => { sessionStorage.setItem('prompt_refinery_debug_mode', debugMode.toString()); }, [debugMode]);
  useEffect(() => { sessionStorage.setItem('prompt_refinery_strict_mode', strictMode.toString()); }, [strictMode]);
  useEffect(() => { sessionStorage.setItem('prompt_refinery_byok', browserApiKey); }, [browserApiKey]);

  // Provider engines state
  const [generationMode, setGenerationMode] = useState<'mock' | 'gemini'>('mock');

  // UI Tabs inside Blueprint Explorer
  const [activeTab, setActiveTab] = useState<'overview' | 'requirements' | 'architecture' | 'data-ux' | 'reliability' | 'prompt' | 'json'>('overview');

  // Spark Catalyst states
  const [isSparkDrawerOpen, setIsSparkDrawerOpen] = useState<boolean>(false);
  const [sparkIdeas, setSparkIdeas] = useState<SparkIdea[]>([]);
  const [sparkNovelty, setSparkNovelty] = useState<'practical' | 'unusual' | 'black-swan'>('practical');
  const [isGeneratingSparks, setIsGeneratingSparks] = useState<boolean>(false);
  const [activeSpark, setActiveSpark] = useState<SparkIdea | null>(null);
  const [geminiSparksError, setGeminiSparksError] = useState<string | null>(null);

  // Workflow history hook
  const {
    workflowHistory,
    isWorkflowSidebarOpen,
    setIsWorkflowSidebarOpen,
    saveToWorkflowHistory,
    deleteWorkflowHistoryItem,
    clearAllWorkflowHistory
  } = useWorkflowHistory(showToast);

  // Wrapper for saving to workflow runs history
  const handleSaveToWorkflowHistory = (
    prompt: string,
    context: string,
    history: ConversationHistoryRow[],
    bpOrResult: any,
    mode: 'gemini' | 'mock',
    tab: string,
    recipeId?: string
  ) => {
    const matchesSpark = activeSpark && prompt === activeSpark.rawPrompt;
    saveToWorkflowHistory(
      prompt,
      context,
      history,
      bpOrResult,
      mode,
      tab,
      recipeId,
      matchesSpark ? activeSpark.title : undefined,
      matchesSpark ? activeSpark.novelty : undefined,
      matchesSpark ? activeSpark.tags : undefined
    );
  };

  // Generation Hook
  const {
    isGenerating,
    generationStep,
    blueprint,
    setBlueprint,
    recipeResult,
    setRecipeResult,
    selectedRecipeId,
    setSelectedRecipeId,
    validationErrors,
    setValidationErrors,
    geminiError,
    setGeminiError,
    rawOutput,
    rejectionStates,
    setRejectionStates,
    isRefining,
    refinementError,
    revisionCount,
    lastRefined,
    enhancePrompt,
    refineBlueprint
  } = useBlueprintGeneration({
    generationMode,
    forceValidationError,
    model,
    temperature,
    maxOutputTokens,
    strictMode,
    browserApiKey,
    debugMode,
    showToast,
    saveToWorkflowHistory: handleSaveToWorkflowHistory
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-fill templates helper
  const applyPreset = (presetType: 'workout' | 'dashboard') => {
    // Reset to blueprint mode first for pre-fills
    setSelectedRecipeId('blueprint');
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

  // Spark Catalyst actions
  const fetchSparks = async (noveltyLevel: 'practical' | 'unusual' | 'black-swan') => {
    setIsGeneratingSparks(true);
    setGeminiSparksError(null);
    try {
      const response = await fetch('/api/sparks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: 4,
          novelty: noveltyLevel,
          mode: generationMode,
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
      const result = await response.json();
      if (response.ok && result.ok) {
        setSparkIdeas(result.ideas || []);
      } else {
        setGeminiSparksError(result.error || 'Server error generating spark ideas.');
        setSparkIdeas(result.ideas || []); // Fallback mock ideas
        showToast('Using local mock sparks.');
      }
    } catch (err: any) {
      console.error("Sparks fetch error:", err);
      setGeminiSparksError('Network exception communicating with sparks engine.');
      const { generateLocalSparks } = await import('./lib/sparksMockGenerator');
      setSparkIdeas(generateLocalSparks(4, noveltyLevel));
      showToast('Served local mock sparks.');
    } finally {
      setIsGeneratingSparks(false);
    }
  };

  useEffect(() => {
    if (isSparkDrawerOpen) {
      fetchSparks(sparkNovelty);
    }
  }, [isSparkDrawerOpen, sparkNovelty]);

  const handleUseSpark = (idea: SparkIdea) => {
    setRawPrompt(idea.rawPrompt);
    setProjectContext(idea.projectContext);
    setHistoryRows(idea.conversationHistory || []);
    if (idea.conversationHistory && idea.conversationHistory.length > 0) {
      setIsHistoryCollapsed(false);
    }
    setActiveSpark(idea);
    setIsSparkDrawerOpen(false);
    showToast(`Creative spark "${idea.title}" loaded.`);
  };

  const handleRefineSpark = (idea: SparkIdea) => {
    setRawPrompt(idea.rawPrompt);
    setProjectContext(idea.projectContext);
    setHistoryRows(idea.conversationHistory || []);
    if (idea.conversationHistory && idea.conversationHistory.length > 0) {
      setIsHistoryCollapsed(false);
    }
    setActiveSpark(idea);
    setSelectedRecipeId('idea_refinement');
    setIsSparkDrawerOpen(false);
    showToast(`Spark "${idea.title}" prepared for Idea Refinement recipe.`);
  };

  // Enhance Prompt wrapper
  const handleEnhancePrompt = (e: React.FormEvent) => {
    e.preventDefault();
    enhancePrompt(rawPrompt, projectContext, historyRows, activeTab);
  };

  // Refine Blueprint wrapper
  const handleRefineBlueprint = () => {
    handleRefineBlueprint();
  };

  // Clipboard Copier
  const handleCopy = async (text: string, label: string) => {
    const success = await copyToClipboardSafe(text);
    if (success) {
      showToast(`Copied ${label} to clipboard!`);
    } else {
      showToast(`Failed to copy ${label} to clipboard.`);
    }
  };

  // Exports
  const handleExportJSON = () => {
    if (!blueprint) return;
    downloadJSON(blueprint, `${blueprint.title.replace(/\s+/g, '_')}_blueprint.json`);
  };

  const handleExportMarkdown = () => {
    if (recipeResult) {
      downloadMarkdown(recipeResult.content, `${recipeResult.title.replace(/\s+/g, '_')}.md`);
      return;
    }
    if (!blueprint) return;
    downloadMarkdown(blueprint.final_prompt, `${blueprint.title.replace(/\s+/g, '_')}_final_prompt.md`);
  };

  const handleExportVibePacket = () => {
    if (!blueprint) return;
    const packet = {
      original_raw_prompt: rawPrompt,
      project_context: projectContext,
      conversation_history: historyRows,
      reviewed_assumptions: blueprint.problem_clarification?.assumptions || [],
      functional_requirements_must_have: blueprint.functional_requirements?.must_have || [],
      functional_requirements_should_have: blueprint.functional_requirements?.should_have || [],
      developer_notes: blueprint.developer_notes || [],
      final_prompt: blueprint.final_prompt
    };
    downloadJSON(packet, `${blueprint.title.replace(/\s+/g, '_')}_vibe_coding_packet.json`);
    showToast("Exported complete Vibe Coding Packet.");
  };

  // Import JSON Loader
  const handleImportJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const result = detectAndParseImport(content);

      if (result.type === 'blueprint') {
        setBlueprint(result.data);
        setRecipeResult(null);
        setSelectedRecipeId('blueprint');
        setValidationErrors(null);
        setGeminiError(null);
        // Sync inputs
        setRawPrompt(result.data.final_prompt ? `Imported: ${result.data.title}` : "Imported Prompt");
        setProjectContext(result.data.summary || "");
        setHistoryRows([]);
        showToast("Imported and verified prompt blueprint successfully!");
      } else if (result.type === 'vibe_packet') {
        // Load context fields into raw states
        if (result.data.original_raw_prompt) setRawPrompt(result.data.original_raw_prompt);
        if (result.data.project_context) setProjectContext(result.data.project_context);
        if (result.data.conversation_history) setHistoryRows(result.data.conversation_history);
        showToast("Vibe coding packet loaded as input context.");
      } else {
        // Show validation or syntax errors without wiping out active blueprint
        setValidationErrors(result.error.split('; '));
        showToast("Import error: Not a valid prompt blueprint or vibe coding packet.");
      }
    };
    reader.readAsText(file);
  };

  // Restore history run record
  const handleLoadHistoryItem = (item: WorkflowHistoryItem) => {
    setRawPrompt(item.rawPrompt);
    setProjectContext(item.projectContext || '');
    setHistoryRows(item.conversationHistory || []);
    setBlueprint(item.blueprint || null);
    setRecipeResult(item.recipeResult || null);
    setSelectedRecipeId((item.recipeId as any) || 'blueprint');
    setValidationErrors(null);
    setGeminiError(null);
    setRejectionStates({});
    if (item.selectedTab) {
      setActiveTab(item.selectedTab as any);
    }
    showToast(`Restored: "${item.title}"`);
  };

  // Clear workspace
  const handleClear = () => {
    setRawPrompt('');
    setProjectContext('');
    setHistoryRows([]);
    setBlueprint(null);
    setRecipeResult(null);
    setSelectedRecipeId('blueprint');
    setValidationErrors(null);
    setGeminiError(null);
    setForceValidationError(false);
    setIsHistoryCollapsed(true);
    setRejectionStates({});
    showToast('Controls cleared.');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] font-sans text-slate-100 flex flex-col selection:bg-[#D4AF37]/30 selection:text-white" id="prompt-refinery-app">
      
      {/* Toast Alert Portal */}
      <Toast message={toastMessage} />

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

          {/* Settings Button */}
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

          <button
            type="button"
            onClick={() => setIsSparkDrawerOpen(true)}
            className="text-xs bg-[#161616] hover:bg-[#222222] border border-[#262626] hover:border-[#D4AF37]/50 text-[#D4AF37] px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Open Creative Spark Catalyst app idea generator drawer"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
            <span>Creative Spark</span>
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
        
        {/* Left Side: Inputs and Controls Panel */}
        <InputPanel
          rawPrompt={rawPrompt}
          setRawPrompt={setRawPrompt}
          projectContext={projectContext}
          setProjectContext={setProjectContext}
          historyRows={historyRows}
          setHistoryRows={setHistoryRows}
          isHistoryCollapsed={isHistoryCollapsed}
          setIsHistoryCollapsed={setIsHistoryCollapsed}
          forceValidationError={forceValidationError}
          setForceValidationError={setForceValidationError}
          generationMode={generationMode}
          setGenerationMode={setGenerationMode}
          isGenerating={isGenerating}
          debugMode={debugMode}
          selectedRecipeId={selectedRecipeId}
          setSelectedRecipeId={setSelectedRecipeId}
          onClear={handleClear}
          onSubmit={handleEnhancePrompt}
          showToast={showToast}
        />

        {/* Right Side: Generation Result / Output Preview Column */}
        <section className="lg:col-span-7 flex flex-col" id="right-preview-panel">
          <div className="flex-1 bg-[#0E0E0E] border border-[#1F1F1F] rounded-2xl flex flex-col overflow-hidden min-h-[500px] shadow-2xl">
            
            {!isGenerating && !blueprint && !recipeResult && !validationErrors && !geminiError && (
              <EmptyBlueprintState />
            )}

            {isGenerating && (
              <LoadingState generationStep={generationStep} />
            )}

            {!isGenerating && (blueprint || recipeResult || validationErrors || geminiError) && (
              <BlueprintExplorer
                blueprint={blueprint}
                recipeResult={recipeResult}
                validationErrors={validationErrors}
                geminiError={geminiError}
                rawOutput={rawOutput}
                isGenerating={isGenerating}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                rejectionStates={rejectionStates}
                setRejectionStates={setRejectionStates}
                isRefining={isRefining}
                refinementError={refinementError}
                revisionCount={revisionCount}
                lastRefined={lastRefined}
                onEnhancePrompt={handleEnhancePrompt}
                onRefineBlueprint={handleRefineBlueprint}
                onCopy={handleCopy}
                onExportJSON={handleExportJSON}
                onExportMarkdown={handleExportMarkdown}
                onExportVibePacket={handleExportVibePacket}
                setGenerationMode={setGenerationMode}
                setGeminiError={setGeminiError}
                debugMode={debugMode}
              />
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
            <span>Prompt Refinery v1.02 • Client Stage Sandbox</span>
            <span className="w-1 h-1 rounded-full bg-slate-800"></span>
            <span>All logs isolated on local domain</span>
          </div>
          <div className="text-[11px] text-slate-600 font-mono text-center md:text-right">
            <span>Designed for precision-crafted prompt generation inside Google AI Studio</span>
          </div>
        </div>
      </footer>

      {/* Sliding Workflow History Sidebar Overlay Drawer */}
      <WorkflowHistorySidebar
        isOpen={isWorkflowSidebarOpen}
        onClose={() => setIsWorkflowSidebarOpen(false)}
        workflowHistory={workflowHistory}
        onLoadItem={handleLoadHistoryItem}
        onDeleteItem={deleteWorkflowHistoryItem}
        onClearAll={clearAllWorkflowHistory}
      />

      {/* Dynamic Settings and Credentials Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        generationMode={generationMode}
        setGenerationMode={setGenerationMode}
        model={model}
        setModel={setModel}
        temperature={temperature}
        setTemperature={setTemperature}
        maxOutputTokens={maxOutputTokens}
        setMaxOutputTokens={setMaxOutputTokens}
        strictMode={strictMode}
        setStrictMode={setStrictMode}
        debugMode={debugMode}
        setDebugMode={setDebugMode}
        browserApiKey={browserApiKey}
        setBrowserApiKey={setBrowserApiKey}
        showApiKey={showApiKey}
        setShowApiKey={setShowApiKey}
        showToast={showToast}
      />

      {/* Creative Spark Drawer Overlay */}
      <CreativeSparkDrawer
        isOpen={isSparkDrawerOpen}
        onClose={() => setIsSparkDrawerOpen(false)}
        sparkIdeas={sparkIdeas}
        isGeneratingSparks={isGeneratingSparks}
        selectedNovelty={sparkNovelty}
        onChangeNovelty={setSparkNovelty}
        onRefreshSparks={() => fetchSparks(sparkNovelty)}
        onUseSpark={handleUseSpark}
        onRefineSpark={handleRefineSpark}
        geminiError={geminiSparksError}
      />

    </div>
  );
}
