/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Layers, Sparkles } from 'lucide-react';

export const EmptyBlueprintState: React.FC = () => {
  return (
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
  );
};
