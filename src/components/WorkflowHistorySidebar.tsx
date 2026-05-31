/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, X, RotateCcw, Trash2 } from 'lucide-react';
import { WorkflowHistoryItem } from '../types';

interface WorkflowHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  workflowHistory: WorkflowHistoryItem[];
  onLoadItem: (item: WorkflowHistoryItem) => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
}

export const WorkflowHistorySidebar: React.FC<WorkflowHistorySidebarProps> = ({
  isOpen,
  onClose,
  workflowHistory,
  onLoadItem,
  onDeleteItem,
  onClearAll
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex bg-black/60 backdrop-blur-xs animate-fade-in animate-duration-150" id="workflow-history-drawer">
      {/* Overlay Click-to-Dismiss */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose}></div>
      
      {/* Drawer body */}
      <div className="relative w-full max-w-md bg-[#0F0E0E] h-full right-0 ml-auto border-l border-[#1F1F1F] flex flex-col shadow-2xl justify-between animate-slide-in">
        <div className="p-4 border-b border-[#1F1F1F] flex items-center justify-between bg-[#161616]/40">
          <div className="flex items-center gap-2 text-[#D4AF37]">
            <BookOpen className="h-4.5 w-4.5" />
            <h3 className="font-serif font-bold text-sm">Workflow Runs History</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
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
                  onClick={onClearAll}
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
                    onLoadItem(item);
                    onClose();
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
                        onDeleteItem(item.id);
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
  );
};
export type WorkflowHistorySidebarComponent = typeof WorkflowHistorySidebar;
