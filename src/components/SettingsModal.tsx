/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Settings, X, Sparkles, Trash2, Eye, EyeOff, ShieldAlert } from 'lucide-react';

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
  customBaseUrl: string;
  setCustomBaseUrl: (val: string) => void;
  customEndpointPath: string;
  setCustomEndpointPath: (val: string) => void;
  customApiKey: string;
  setCustomApiKey: (val: string) => void;
  customModel: string;
  setCustomModel: (val: string) => void;
  customHeadersJson: string;
  setCustomHeadersJson: (val: string) => void;
  customJsonMode: boolean;
  setCustomJsonMode: (val: boolean) => void;
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
  customBaseUrl,
  setCustomBaseUrl,
  customEndpointPath,
  setCustomEndpointPath,
  customApiKey,
  setCustomApiKey,
  customModel,
  setCustomModel,
  customHeadersJson,
  setCustomHeadersJson,
  customJsonMode,
  setCustomJsonMode
}) => {
  const [isTesting, setIsTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<{ ok: boolean; message: string } | null>(null);
  const [headersError, setHeadersError] = React.useState<string | null>(null);
  const [showCustomApiKey, setShowCustomApiKey] = React.useState(false);

  React.useEffect(() => {
    // Reset connection test status when custom config changes
    setTestResult(null);
  }, [customBaseUrl, customEndpointPath, customApiKey, customModel, customHeadersJson, customJsonMode]);

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

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      if (customHeadersJson && customHeadersJson.trim()) {
        try {
          JSON.parse(customHeadersJson);
        } catch (e: any) {
          showToast("Please fix headers JSON first.");
          setIsTesting(false);
          return;
        }
      }

      const response = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            baseUrl: customBaseUrl,
            endpointPath: customEndpointPath,
            apiKey: customApiKey,
            model: customModel,
            customHeadersJson,
            jsonMode: customJsonMode
          }
        })
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

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/75 backdrop-blur-md animate-fade-in" 
      id="settings-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      {/* Overlay click catcher to close */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose}></div>
      
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
            onClick={onClose}
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
            <p className="text-[10.5px] text-slate-500 font-mono mt-0.5">
              {generationMode === 'mock' 
                ? '🎭 Runs prompt refiners instantly in beautiful offline simulation mode.' 
                : generationMode === 'gemini'
                ? '⚡ Connects server-side to live Gemini intelligence. Requires configured API credentials.'
                : '🔌 Custom OpenAI compatible endpoint provider (e.g. OpenRouter, NanoGPT, local LLM).'}
            </p>
          </div>

          {/* Conditional provider settings */}
          {generationMode === 'gemini' && (
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
          )}

          {generationMode === 'custom_openai' && (
            <div className="flex flex-col gap-4 border-t border-[#1F1F1F] pt-4.5">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">Custom OpenAI Settings</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="custom-baseurl" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Base URL</label>
                  <input
                    type="text"
                    id="custom-baseurl"
                    value={customBaseUrl}
                    onChange={(e) => setCustomBaseUrl(e.target.value)}
                    placeholder="https://api.openrouter.ai"
                    className="bg-[#121212] border border-[#262626] rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="custom-endpoint" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Endpoint Path</label>
                  <input
                    type="text"
                    id="custom-endpoint"
                    value={customEndpointPath}
                    onChange={(e) => setCustomEndpointPath(e.target.value)}
                    placeholder="/v1/chat/completions"
                    className="bg-[#121212] border border-[#262626] rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="custom-model" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Model Identifier</label>
                <input
                  type="text"
                  id="custom-model"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  placeholder="e.g. openai/gpt-4o"
                  className="bg-[#121212] border border-[#262626] rounded-xl px-3 py-2 text-xs font-mono text-slate-200 outline-none focus:border-[#D4AF37]"
                />
              </div>

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
                    className="w-full bg-[#121212] border border-[#262626] rounded-xl pl-3 pr-10 py-2.5 text-xs text-slate-200 font-mono outline-none focus:border-[#D4AF37]"
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
                  className="w-full bg-[#121212] border border-[#262626] rounded-xl p-3 text-xs font-mono text-slate-200 outline-none focus:border-[#D4AF37] resize-none"
                />
              </div>

              <div className="flex justify-between items-center border-b border-[#1F1F1F] pb-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-slate-300">Force JSON Mode</span>
                  <span className="text-[10px] text-slate-500">Injects response_format type: json_object into body</span>
                </div>
                <input
                  type="checkbox"
                  checked={customJsonMode}
                  onChange={(e) => setCustomJsonMode(e.target.checked)}
                  className="w-4 h-4 rounded text-[#D4AF37] bg-[#121212] border-[#262626] focus:ring-[#D4AF37]/50 cursor-pointer accent-[#D4AF37]"
                />
              </div>

              <div className="flex flex-col gap-2 bg-[#161616]/30 border border-[#262626] rounded-xl p-3.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-300">Connection Diagnostics</span>
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/35 text-[#D4AF37] font-bold text-[10.5px] px-3.5 py-1.5 rounded-lg transition disabled:opacity-50 cursor-pointer"
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
            {generationMode === 'gemini' ? (
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
          {generationMode === 'gemini' && (
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
          )}

        </div>

        {/* Modal Bottom Buttons */}
        <div className="p-5 border-t border-[#1F1F1F] bg-[#161616]/30 flex items-center justify-end font-sans">
          <button
            type="button"
            id="close-settings-modal"
            onClick={() => {
              onClose();
              showToast('Configurations updated.');
            }}
            className="bg-[#D4AF37] text-black font-bold text-xs px-5 py-2 rounded-xl transition hover:opacity-90 active:scale-98 shadow-md cursor-pointer"
          >
            Apply & Save Changes
          </button>
        </div>

      </div>
    </div>
  );
};
export type SettingsModalComponent = typeof SettingsModal;
