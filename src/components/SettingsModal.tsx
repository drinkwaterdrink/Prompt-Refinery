import React from 'react';
import { Settings, X, Trash2, Eye, EyeOff, ShieldAlert, Plus, Save } from 'lucide-react';
import { ConnectionProfile } from '../lib/providers/types';

const POPULAR_CUSTOM_MODELS = [
  'deepseek/deepseek-v3.2',
  'deepseek/deepseek-v4-flash',
  'deepseek/deepseek-v4-flash:thinking',
  'deepseek/deepseek-v4-pro',
  'deepseek/deepseek-v4-pro:thinking',
  'deepseek/deepseek-v4-pro-cheaper:thinking',
  'zai-org/glm-5.1',
  'zai-org/glm-5.1:thinking',
  'stepfun/step-3.7-flash:thinking'
];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  generationMode: 'mock' | 'gemini' | 'custom_openai';
  setGenerationMode: (mode: 'mock' | 'gemini' | 'custom_openai') => void;
  model: string;
  setModel: (val: string) => void;
  temperature: number;
  setTemperature: (val: number) => void;
  maxOutputTokens: number;
  setMaxOutputTokens: (val: number) => void;
  strictMode: boolean;
  setStrictMode: (val: boolean) => void;
  debugMode: boolean;
  setDebugMode: (val: boolean) => void;
  browserApiKey: string;
  setBrowserApiKey: (val: string) => void;
  showApiKey: boolean;
  setShowApiKey: (val: boolean) => void;
  showToast: (msg: string) => void;

  // Custom OpenAI compatible endpoint props
  customApiUrl: string;
  setCustomApiUrl: (val: string) => void;
  customApiKey: string;
  setCustomApiKey: (val: string) => void;
  customModel: string;
  setCustomModel: (val: string) => void;
  customHeadersJson: string;
  setCustomHeadersJson: (val: string) => void;
  customJsonMode: boolean;
  setCustomJsonMode: (val: boolean) => void;

  // Connection Profiles props
  connectionProfiles: ConnectionProfile[];
  setConnectionProfiles: React.Dispatch<React.SetStateAction<ConnectionProfile[]>>;
  activeProfileId: string;
  setActiveProfileId: (val: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  generationMode,
  setGenerationMode,
  model,
  setModel,
  temperature,
  setTemperature,
  maxOutputTokens,
  setMaxOutputTokens,
  strictMode,
  setStrictMode,
  debugMode,
  setDebugMode,
  browserApiKey,
  setBrowserApiKey,
  showApiKey,
  setShowApiKey,
  showToast,
  customApiUrl,
  setCustomApiUrl,
  customApiKey,
  setCustomApiKey,
  customModel,
  setCustomModel,
  customHeadersJson,
  setCustomHeadersJson,
  customJsonMode,
  setCustomJsonMode,
  connectionProfiles,
  setConnectionProfiles,
  activeProfileId,
  setActiveProfileId
}) => {
  const [isTesting, setIsTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<{ ok: boolean; message: string } | null>(null);
  const [headersError, setHeadersError] = React.useState<string | null>(null);
  const [showCustomApiKey, setShowCustomApiKey] = React.useState(false);
  const [profileName, setProfileName] = React.useState('');
  const [isCustomModelMode, setIsCustomModelMode] = React.useState(false);

  React.useEffect(() => {
    const isPopular = POPULAR_CUSTOM_MODELS.includes(customModel);
    setIsCustomModelMode(!isPopular && !!customModel);
  }, [customModel]);

  React.useEffect(() => {
    // Reset connection test status when custom config, browser API key, or mode changes
    setTestResult(null);
  }, [customApiUrl, customApiKey, customModel, customHeadersJson, customJsonMode, browserApiKey, generationMode]);

  React.useEffect(() => {
    const activeProf = connectionProfiles.find(p => p.id === activeProfileId);
    if (activeProf) {
      setProfileName(activeProf.name);
    }
  }, [activeProfileId, connectionProfiles]);

  const modalRef = React.useRef<HTMLDivElement>(null);

  const hasUnsavedChanges = React.useCallback(() => {
    const activeProf = connectionProfiles.find(p => p.id === activeProfileId);
    if (!activeProf) return false;
    if (profileName !== activeProf.name) return true;
    if (generationMode !== activeProf.provider) return true;
    if (generationMode === 'custom_openai') {
      if (customApiUrl !== activeProf.apiUrl) return true;
      if (customApiKey !== activeProf.apiKey) return true;
      if (customModel !== activeProf.model) return true;
      if (customHeadersJson !== activeProf.customHeadersJson) return true;
      if (customJsonMode !== activeProf.jsonMode) return true;
    } else if (generationMode === 'gemini') {
      if (browserApiKey !== activeProf.apiKey) return true;
      if (model !== activeProf.model) return true;
    }
    return false;
  }, [
    profileName,
    generationMode,
    customApiUrl,
    customApiKey,
    customModel,
    customHeadersJson,
    customJsonMode,
    browserApiKey,
    model,
    connectionProfiles,
    activeProfileId
  ]);

  // Focus Trapping and Keyboard Escape Listeners
  React.useEffect(() => {
    if (!isOpen) return;

    // Focus the first interactive element or the modal container
    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements && focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (hasUnsavedChanges()) {
          showToast("Unsaved profile changes. Save or apply changes before closing.");
          e.preventDefault();
          return;
        }
        onClose();
      }

      if (e.key === 'Tab') {
        if (!modalRef.current) return;
        const elements = Array.from(
          modalRef.current.querySelectorAll(
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
  }, [
    isOpen,
    hasUnsavedChanges,
    onClose,
    showToast
  ]);

  if (!isOpen) return null;

  const handleHeadersChange = (val: string) => {
    setCustomHeadersJson(val);
    if (!val.trim()) {
      setHeadersError(null);
      return;
    }
    try {
      JSON.parse(val);
      setHeadersError(null);
    } catch (e: any) {
      setHeadersError(`Invalid JSON: ${e.message}`);
    }
  };

  const handleCreateProfile = () => {
    const newId = `profile-${Date.now()}`;
    const newProfile: ConnectionProfile = {
      id: newId,
      name: 'New Connection Profile',
      provider: generationMode,
      apiUrl: generationMode === 'custom_openai' ? 'https://api.openrouter.ai/api/v1' : '',
      apiKey: '',
      model: generationMode === 'custom_openai' ? 'deepseek/deepseek-v4-flash' : 'gemini-3.5-flash',
      customHeadersJson: '{}',
      jsonMode: generationMode === 'custom_openai'
    };
    setConnectionProfiles(prev => [...prev, newProfile]);
    setActiveProfileId(newId);
    setProfileName(newProfile.name);
    showToast('Created new profile template. Customize and click Save.');
  };

  const handleSaveProfile = (silent = false) => {
    if (!activeProfileId) return;

    if (generationMode === 'custom_openai' && customHeadersJson && customHeadersJson.trim()) {
      try {
        JSON.parse(customHeadersJson);
      } catch (e: any) {
        if (!silent) {
          showToast("Cannot save: Invalid JSON in headers.");
        }
        return;
      }
    }

    setConnectionProfiles(prev => prev.map(p => {
      if (p.id === activeProfileId) {
        return {
          ...p,
          name: profileName || p.name,
          provider: generationMode,
          apiUrl: generationMode === 'custom_openai' ? customApiUrl : '',
          apiKey: generationMode === 'custom_openai' ? customApiKey : browserApiKey,
          model: generationMode === 'custom_openai' ? customModel : model,
          customHeadersJson: generationMode === 'custom_openai' ? customHeadersJson : '{}',
          jsonMode: generationMode === 'custom_openai' ? customJsonMode : false
        };
      }
      return p;
    }));

    if (!silent) {
      showToast(`Profile "${profileName || 'Default'}" saved to browser local registry.`);
    }
  };

  const handleCloseAndSave = () => {
    handleSaveProfile(true);
    onClose();
  };

  const handleApplyAndSave = () => {
    handleSaveProfile(false);
    onClose();
  };

  const handleDeleteProfile = () => {
    if (activeProfileId.startsWith('default')) {
      showToast('Cannot delete default system profiles.');
      return;
    }
    const filtered = connectionProfiles.filter(p => p.id !== activeProfileId);
    setConnectionProfiles(filtered);
    setActiveProfileId('default-openai');
    showToast('Connection profile deleted.');
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      let body: any = {};
      if (generationMode === 'gemini') {
        body = {
          mode: 'gemini',
          config: {
            browserApiKey: browserApiKey,
            model: model
          }
        };
      } else {
        if (customHeadersJson && customHeadersJson.trim()) {
          try {
            JSON.parse(customHeadersJson);
          } catch (e: any) {
            showToast("Please fix headers JSON first.");
            setIsTesting(false);
            return;
          }
        }
        body = {
          mode: 'custom_openai',
          config: {
            apiUrl: customApiUrl,
            apiKey: customApiKey,
            model: customModel,
            customHeadersJson,
            jsonMode: customJsonMode
          }
        };
      }

      const response = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await response.json();
      if (response.ok && result.ok) {
        setTestResult({ ok: true, message: `Connected! Latency: ${result.latencyMs}ms. Response: "${result.text}"` });
        showToast("Connection test successful!");
      } else {
        setTestResult({ ok: false, message: result.error || "Connection failed." });
        showToast("Connection test failed.");
      }
    } catch (err: any) {
      console.error(err);
      setTestResult({ ok: false, message: err.message || "Network error." });
      showToast("Network error testing connection.");
    } finally {
      setIsTesting(false);
    }
  };

  const handleBackdropClick = () => {
    if (hasUnsavedChanges()) {
      showToast("Unsaved profile changes. Save or apply changes before closing.");
      return;
    }
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/75 backdrop-blur-md animate-fade-in" 
      id="settings-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      {/* Overlay click catcher to close */}
      <div className="absolute inset-0 cursor-pointer" onClick={handleBackdropClick}></div>
      
      {/* Modal Box */}
      <div 
        ref={modalRef} 
        className="relative w-full max-w-lg bg-bg-panel border border-border-subtle rounded-2xl shadow-3xl overflow-hidden flex flex-col mx-4 animate-scale-up focus:outline-none"
        tabIndex={-1}
      >
        
        {/* Modal Header */}
        <div className="p-5 border-b border-border-subtle flex items-center justify-between bg-[#161616]/50">
          <div className="flex items-center gap-2.5 text-primary">
            <Settings className="h-5 w-5 text-primary" />
            <h3 className="font-sans font-extrabold text-sm tracking-wider uppercase" id="settings-modal-title">Engine Configuration</h3>
          </div>
          <button
            type="button"
            onClick={handleCloseAndSave}
            className="text-slate-500 hover:text-white transition p-1.5 hover:bg-[#222222] rounded-lg cursor-pointer"
            aria-label="Close settings dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Scroll Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh] flex flex-col gap-5 text-sm">
          
          {/* 1. Connection Profiles Section */}
          <div className="flex flex-col gap-3 bg-[#161616]/40 p-4 border border-[#222222] rounded-xl">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Connection Profile</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCreateProfile}
                  className="text-[10.5px] text-primary hover:text-primary-hover font-bold flex items-center gap-1 cursor-pointer transition"
                >
                  <Plus className="h-3 w-3" /> New Profile
                </button>
                {activeProfileId && !activeProfileId.startsWith('default') && (
                  <button
                    type="button"
                    onClick={handleDeleteProfile}
                    className="text-[10.5px] text-red-400 hover:text-red-300 font-bold flex items-center gap-1 cursor-pointer transition"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <select
                value={activeProfileId}
                onChange={(e) => setActiveProfileId(e.target.value)}
                className="col-span-3 bg-[#121212] border border-[#262626] rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-primary cursor-pointer"
              >
                {connectionProfiles.map(prof => (
                  <option key={prof.id} value={prof.id}>{prof.name} ({prof.provider === 'custom_openai' ? 'Custom API' : prof.provider === 'gemini' ? 'Gemini' : 'Mock'})</option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => handleSaveProfile(false)}
                className="bg-primary hover:bg-primary-hover text-black font-bold text-xs py-2 px-3 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" /> Save
              </button>
            </div>

            {/* Profile Name Input */}
            <div className="flex flex-col gap-1 mt-1">
              <label htmlFor="profile-display-name" className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Profile Display Name</label>
              <input
                type="text"
                id="profile-display-name"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="e.g. My OpenRouter Connection"
                className="bg-[#121212] border border-[#262626] rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-primary"
              />
            </div>

            {/* Provider Type Selector within Connection Profile */}
            <div className="flex flex-col gap-1 mt-1.5">
              <label htmlFor="profile-provider-type" className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Provider Type</label>
              <select
                id="profile-provider-type"
                value={generationMode}
                onChange={(e) => {
                  const val = e.target.value as 'mock' | 'gemini' | 'custom_openai';
                  setGenerationMode(val);
                  if (val === 'gemini') {
                    setModel('gemini-3.5-flash');
                  } else if (val === 'custom_openai') {
                    setCustomModel('deepseek/deepseek-v4-flash');
                    setCustomApiUrl('https://api.openrouter.ai/api/v1');
                  }
                }}
                disabled={activeProfileId.startsWith('default') || activeProfileId === 'nano-gpt'}
                className="bg-[#121212] border border-[#262626] rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="mock">🎭 Offline Mock (Simulation)</option>
                <option value="gemini">⚡ Gemini (Live API)</option>
                <option value="custom_openai">🔌 Custom OpenAI Compatible</option>
              </select>
            </div>

            <p className="text-[10px] text-slate-500 font-mono mt-0.5 leading-normal">
              {generationMode === 'mock' 
                ? '🎭 Runs compiler instantly in offline simulation mode.' 
                : generationMode === 'gemini'
                ? '⚡ Connects server-side to live Gemini intelligence. Requires configured API credentials.'
                : '🔌 Custom OpenAI compatible endpoint provider (e.g. OpenRouter, NanoGPT, local LLM).'}
            </p>
          </div>

          {/* Conditional provider settings */}
          {generationMode === 'mock' && (
            <div className="flex flex-col gap-3 bg-[#161616]/30 border border-[#222222] rounded-xl p-4">
              <span className="text-xs font-bold text-primary uppercase tracking-wider font-mono">🎭 Offline Simulation Mode</span>
              <p className="text-xs text-slate-400 leading-relaxed">
                The mock engine simulates live prompt engineering and blueprint compiler logic locally inside the browser. No network connectivity is required, and no API keys are charged. Ideal for testing UI, evaluating layout behaviors, or reviewing prompt flow architecture offline.
              </p>
            </div>
          )}

          {generationMode === 'gemini' && (
            <div className="flex flex-col gap-4 border-t border-border-subtle pt-4.5">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-primary font-mono">Live Gemini Settings</h4>

              <div className="flex flex-col gap-2">
                <label htmlFor="settings-model" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Gemini Model Selector
                </label>
                <select
                  id="settings-model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="bg-[#121212] border border-[#262626] rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-200 focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="gemini-3.5-flash">gemini-3.5-flash (Default / Smart & Fast)</option>
                  <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Complex / Reasoning & Code-aware)</option>
                  <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Ultra-quick / Low latency)</option>
                </select>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="settings-byok" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    Browser BYOK API Key <span className="text-[9px] text-slate-500 font-mono font-medium">(Optional)</span>
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
                    placeholder="Optional live key: AIzaSy..."
                    className="w-full bg-[#121212] border border-[#262626] hover:border-slate-800 focus:border-primary rounded-xl pl-3 pr-10 py-2.5 text-xs text-slate-200 placeholder-slate-600 font-mono outline-none transition"
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

                <div className="bg-red-950/20 border border-red-900/35 rounded-xl p-3.5 flex items-start gap-2.5 text-rose-300">
                  <ShieldAlert className="h-4.5 w-4.5 text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-[10.5px] leading-relaxed">
                    Browser-stored API keys are convenient for local/personal use but are not secure against malicious scripts or compromised devices. For production, use server-side environment variables or a secure backend key vault.
                  </p>
                </div>

                <div className="flex flex-col gap-2 bg-[#161616]/30 border border-[#262626] rounded-xl p-3.5 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-300">Connection Diagnostics</span>
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={isTesting}
                      className="bg-primary/10 hover:bg-primary/20 border border-primary/35 text-primary font-bold text-[10.5px] px-3.5 py-1.5 rounded-lg transition disabled:opacity-50 cursor-pointer"
                    >
                      {isTesting ? "Testing..." : "Test Connection"}
                    </button>
                  </div>
                  {testResult && (
                    <p className={`text-[10.5px] font-mono leading-relaxed p-2 rounded-lg ${testResult.ok ? 'bg-emerald-950/20 border border-emerald-900/35 text-emerald-400' : 'bg-red-950/20 border border-red-900/35 text-rose-300'}`}>
                      {testResult.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {generationMode === 'custom_openai' && (
            <div className="flex flex-col gap-4 border-t border-border-subtle pt-4.5">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-primary font-mono">Custom API settings</h4>
              
              <div className="flex flex-col gap-1.5">
                <label htmlFor="custom-apiurl" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">API URL</label>
                <input
                  type="text"
                  id="custom-apiurl"
                  value={customApiUrl}
                  onChange={(e) => setCustomApiUrl(e.target.value)}
                  placeholder="e.g. https://api.openrouter.ai/api/v1 or https://nano-gpt.com/api/v1"
                  className="bg-[#121212] border border-[#262626] rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-primary"
                />
                <span className="text-[10px] text-slate-500 font-mono mt-0.5 leading-normal">
                  Input the base API endpoint (e.g. https://nano-gpt.com/api/v1). Suffixes like /chat/completions are dynamically resolved under the hood.
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="custom-model-select" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Model Selector</label>
                <select
                  id="custom-model-select"
                  value={isCustomModelMode ? 'custom' : customModel}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'custom') {
                      setIsCustomModelMode(true);
                    } else {
                      setIsCustomModelMode(false);
                      setCustomModel(val);
                    }
                  }}
                  className="bg-[#121212] border border-[#262626] rounded-xl px-3 py-2 text-xs font-mono font-semibold text-slate-200 focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="" disabled>Select an API model...</option>
                  {POPULAR_CUSTOM_MODELS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                  <option value="custom">✏️ Custom Model ID...</option>
                </select>
              </div>

              {isCustomModelMode && (
                <div className="flex flex-col gap-1.5 animate-fade-in">
                  <label htmlFor="custom-model-input" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Custom Model Identifier</label>
                  <input
                    type="text"
                    id="custom-model-input"
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    placeholder="e.g. deepseek/deepseek-v4-flash or openai/gpt-4o"
                    className="bg-[#121212] border border-[#262626] rounded-xl px-3 py-2 text-xs font-mono text-slate-200 outline-none focus:border-primary"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label htmlFor="custom-apikey" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">API Key (Session Only)</label>
                  {customApiKey && (
                    <button
                      type="button"
                      onClick={() => setCustomApiKey('')}
                      className="text-[10px] text-red-400 hover:text-red-300 font-mono font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" /> Clear Key
                    </button>
                  )}
                </div>
                <div className="relative flex items-center">
                  <input
                    type={showCustomApiKey ? "text" : "password"}
                    id="custom-apikey"
                    value={customApiKey}
                    onChange={(e) => setCustomApiKey(e.target.value)}
                    placeholder="Enter compatible API Key (Never saved/logged)"
                    className="w-full bg-[#121212] border border-[#262626] rounded-xl pl-3 pr-10 py-2.5 text-xs text-slate-200 font-mono outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCustomApiKey(!showCustomApiKey)}
                    className="absolute right-3 text-slate-400 hover:text-white transition cursor-pointer p-0.5"
                  >
                    {showCustomApiKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label htmlFor="custom-headers" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Custom Headers (JSON)</label>
                  {headersError && <span className="text-[10px] text-rose-400 font-mono font-bold">{headersError}</span>}
                </div>
                <textarea
                  id="custom-headers"
                  value={customHeadersJson}
                  onChange={(e) => handleHeadersChange(e.target.value)}
                  placeholder='{"X-Title": "PromptRefinery"}'
                  rows={2}
                  className="w-full bg-[#121212] border border-[#262626] rounded-xl p-3 text-xs font-mono text-slate-200 outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="flex justify-between items-center border-b border-border-subtle pb-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-slate-300">Force JSON Mode</span>
                  <span className="text-[10px] text-slate-500">Injects response_format type: json_object into body</span>
                </div>
                <input
                  type="checkbox"
                  checked={customJsonMode}
                  onChange={(e) => setCustomJsonMode(e.target.checked)}
                  className="w-4 h-4 rounded text-primary bg-[#121212] border-[#262626] focus:ring-primary/50 cursor-pointer accent-primary"
                />
              </div>

              <div className="flex flex-col gap-2 bg-[#161616]/30 border border-[#262626] rounded-xl p-3.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-300">Connection Diagnostics</span>
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="bg-primary/10 hover:bg-primary/20 border border-primary/35 text-primary font-bold text-[10.5px] px-3.5 py-1.5 rounded-lg transition disabled:opacity-50 cursor-pointer"
                  >
                    {isTesting ? "Testing..." : "Test Connection"}
                  </button>
                </div>
                {testResult && (
                  <p className={`text-[10.5px] font-mono leading-relaxed p-2 rounded-lg ${testResult.ok ? 'bg-emerald-950/20 border border-emerald-900/35 text-emerald-400' : 'bg-red-950/20 border border-red-900/35 text-rose-300'}`}>
                    {testResult.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 3. Temperature Parameter Slider */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label htmlFor="settings-temp" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Creativity Temperature
              </label>
              <span className="text-xs font-mono text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded">
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
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0.0 (Strict / Schema focus)</span>
              <span className="text-primary">Recommended: 0.2 - 0.4</span>
              <span>1.0 (Highly diverse)</span>
            </div>
          </div>

          {/* 4. Max Output Tokens */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label htmlFor="settings-tokens" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Max Response Length (Tokens)
              </label>
              <span className="text-xs font-mono text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded">
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
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>1,000 (Fast)</span>
              <span className="text-primary">Recommended: 8,192</span>
              <span>50,000 (Max Depth)</span>
            </div>
          </div>

          {/* 5. Toggles: Schema Mode & Debug Mode */}
          <div className="grid grid-cols-2 gap-4 border-t border-border-subtle pt-4.5">
            
            {/* Toggle 1: Strict JSON */}
            {generationMode === 'gemini' ? (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="settings-strict"
                    checked={strictMode}
                    onChange={(e) => setStrictMode(e.target.checked)}
                    className="w-4 h-4 rounded text-primary bg-[#121212] border-[#262626] focus:ring-primary/50 cursor-pointer focus:ring-2 accent-primary"
                  />
                  <label htmlFor="settings-strict" className="text-xs font-bold text-slate-300 select-none cursor-pointer">
                    Strict Schema JSON
                  </label>
                </div>
                <p className="text-[10.5px] text-slate-500 leading-normal">
                  Forces live Gemini responses to map directly to OpenAPI parameters. Forces exact fields.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">Strict Schema JSON</span>
                </div>
                <p className="text-[10.5px] text-slate-600 leading-normal">
                  Only available for native Gemini provider. Use JSON Mode in Custom OpenAI settings instead.
                </p>
              </div>
            )}

            {/* Toggle 2: Debug Mode */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="settings-debug"
                  checked={debugMode}
                  onChange={(e) => setDebugMode(e.target.checked)}
                  className="w-4 h-4 rounded text-primary bg-[#121212] border-[#262626] focus:ring-primary/50 cursor-pointer focus:ring-2 accent-primary"
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

        </div>

        {/* Modal Bottom Buttons */}
        <div className="p-5 border-t border-border-subtle bg-[#161616]/30 flex items-center justify-end font-sans">
          <button
            type="button"
            id="close-settings-modal"
            onClick={handleApplyAndSave}
            className="bg-primary hover:bg-primary-hover text-black font-bold text-xs px-5 py-2 rounded-xl transition active:scale-98 shadow-md cursor-pointer"
          >
            Apply & Save Changes
          </button>
        </div>

      </div>
    </div>
  );
};
export type SettingsModalComponent = typeof SettingsModal;
