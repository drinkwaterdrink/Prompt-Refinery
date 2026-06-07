/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RefreshCw } from 'lucide-react';

interface LoadingStateProps {
  generationStep: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ generationStep }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6" id="loading-preview-state">
      <div className="flex flex-col items-center gap-6 max-w-sm w-full">
        
        {/* Glowing core pulse spinner */}
        <div className="relative">
          <div className="w-16 h-16 border-2 border-primary/10 rounded-full animate-ping absolute"></div>
          <div className="w-16 h-16 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary">
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
            <span className="text-primary font-bold">{Math.round(((generationStep + 1) / 4) * 100)}%</span>
          </div>
          
          <div className="flex flex-col gap-1.5 mt-1 text-left">
            <div className="flex items-center gap-2">
              {generationStep >= 0 ? (
                <span className={`${generationStep > 0 ? 'text-primary' : 'text-amber-400 animate-pulse'} font-bold`}>✓</span>
              ) : (
                <span className="text-slate-700">○</span>
              )}
              <span className={generationStep === 0 ? 'text-slate-200 font-medium' : generationStep > 0 ? 'text-slate-500' : 'text-slate-600'}>
                Classifying user intent & context
              </span>
            </div>
            <div className="flex items-center gap-2">
              {generationStep >= 1 ? (
                <span className={`${generationStep > 1 ? 'text-primary' : 'text-amber-400 animate-pulse'} font-bold`}>✓</span>
              ) : (
                <span className="text-slate-700">○</span>
              )}
              <span className={generationStep === 1 ? 'text-slate-200 font-medium' : generationStep > 1 ? 'text-slate-500' : 'text-slate-600'}>
                Delineating MoSCoW functionality
              </span>
            </div>
            <div className="flex items-center gap-2">
              {generationStep >= 2 ? (
                <span className={`${generationStep > 2 ? 'text-primary' : 'text-amber-400 animate-pulse'} font-bold`}>✓</span>
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
  );
};
