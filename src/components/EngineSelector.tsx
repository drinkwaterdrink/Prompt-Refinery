import React from 'react';
import { Sparkles } from 'lucide-react';

interface EngineSelectorProps {
  generationMode: 'mock' | 'gemini' | 'custom_openai';
  setGenerationMode: (mode: 'mock' | 'gemini' | 'custom_openai') => void;
}

export const EngineSelector: React.FC<EngineSelectorProps> = React.memo(({
  generationMode,
  setGenerationMode
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-3 gap-2 bg-[#161616] p-1 rounded-xl border border-[#262626]">
        <button
          type="button"
          onClick={() => setGenerationMode('mock')}
          className={`py-2 text-[10px] font-semibold rounded-lg font-mono tracking-wider transition cursor-pointer flex items-center justify-center gap-1 ${
            generationMode === 'mock'
              ? 'bg-primary text-black font-bold border border-primary'
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
              ? 'bg-primary text-black font-bold border border-primary'
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
              ? 'bg-primary text-black font-bold border border-primary'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#222222]/30 border border-transparent'
          }`}
        >
          🔌 Custom API
        </button>
      </div>
    </div>
  );
});
