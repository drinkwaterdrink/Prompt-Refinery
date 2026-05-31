/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { 
  Plus, 
  Settings, 
  Copy, 
  Trash2, 
  FileDown, 
  Download, 
  Upload, 
  AlertTriangle,
  FolderGit
} from 'lucide-react';
import { ProjectContextPack } from '../types';
import { serializePackToMarkdown } from '../lib/projectPacks';

interface ProjectPackSelectorProps {
  projectPacks: ProjectContextPack[];
  activePackId: string | null;
  selectActivePack: (id: string | null) => void;
  onCreateClick: () => void;
  onEditClick: (id: string) => void;
  onDuplicateClick: (id: string) => void;
  onDeleteClick: (id: string) => void;
  onExportClick: (id: string) => void;
  onImportClick: (file: File) => void;
  onApplyContext: (id: string) => void;
}

export const ProjectPackSelector: React.FC<ProjectPackSelectorProps> = ({
  projectPacks,
  activePackId,
  selectActivePack,
  onCreateClick,
  onEditClick,
  onDuplicateClick,
  onDeleteClick,
  onExportClick,
  onImportClick,
  onApplyContext
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activePack = projectPacks.find(p => p.id === activePackId);
  
  // Calculate serialized size boundaries
  let serializedSize = 0;
  if (activePack) {
    serializedSize = serializePackToMarkdown(activePack).length;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImportClick(e.target.files[0]);
      // Reset input value to allow importing the same file again
      e.target.value = '';
    }
  };

  const triggerImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-2.5 bg-[#121212]/40 border border-[#222222] rounded-xl p-3.5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Pack Selection and Label */}
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <FolderGit className="h-4.5 w-4.5 text-[#D4AF37] shrink-0" />
          <div className="flex-1 flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active Project Context Pack
            </span>
            <select
              value={activePackId || ''}
              onChange={(e) => selectActivePack(e.target.value || null)}
              className="mt-1 w-full bg-[#121212] border border-[#262626] rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-200 focus:outline-none focus:border-[#D4AF37] cursor-pointer"
            >
              <option value="">None (Global Stack-Agnostic Mode)</option>
              {projectPacks.map((pack) => (
                <option key={pack.id} value={pack.id}>
                  📁 {pack.name} ({pack.techStack || 'Agnostic'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Create Button */}
          <button
            type="button"
            onClick={onCreateClick}
            className="p-2 text-slate-400 hover:text-white hover:bg-[#222222]/40 border border-[#262626]/60 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 text-[11px] font-semibold shrink-0"
            title="Create new context pack"
          >
            <Plus className="h-3.5 w-3.5 text-[#D4AF37]" />
            <span>New Pack</span>
          </button>

          {activePackId && (
            <>
              {/* Edit Button */}
              <button
                type="button"
                onClick={() => onEditClick(activePackId)}
                className="p-2 text-slate-400 hover:text-white hover:bg-[#222222]/40 border border-[#262626]/60 rounded-lg transition cursor-pointer flex items-center justify-center shrink-0"
                title="Edit active pack"
              >
                <Settings className="h-3.5 w-3.5 text-slate-400 hover:text-white" />
              </button>

              {/* Duplicate Button */}
              <button
                type="button"
                onClick={() => onDuplicateClick(activePackId)}
                className="p-2 text-slate-400 hover:text-white hover:bg-[#222222]/40 border border-[#262626]/60 rounded-lg transition cursor-pointer flex items-center justify-center shrink-0"
                title="Duplicate active pack"
              >
                <Copy className="h-3.5 w-3.5 text-slate-400 hover:text-white" />
              </button>

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete pack "${activePack?.name}"?`)) {
                    onDeleteClick(activePackId);
                  }
                }}
                className="p-2 text-red-400/80 hover:text-red-300 hover:bg-[#991b1b]/10 border border-[#262626]/60 rounded-lg transition cursor-pointer flex items-center justify-center shrink-0"
                title="Delete active pack"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>

              {/* Export Button */}
              <button
                type="button"
                onClick={() => onExportClick(activePackId)}
                className="p-2 text-slate-400 hover:text-white hover:bg-[#222222]/40 border border-[#262626]/60 rounded-lg transition cursor-pointer flex items-center justify-center shrink-0"
                title="Export pack JSON"
              >
                <Download className="h-3.5 w-3.5 text-slate-400 hover:text-white" />
              </button>

              {/* Apply Context Button */}
              <button
                type="button"
                onClick={() => onApplyContext(activePackId)}
                className="p-2 text-[#D4AF37] hover:text-[#e5c158] hover:bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 text-[11px] font-bold shrink-0 shadow-sm"
                title="Inject pack contents as formatted Markdown into context field"
              >
                <FileDown className="h-3.5 w-3.5" />
                <span>Apply Block</span>
              </button>
            </>
          )}

          {/* Import Button */}
          <button
            type="button"
            onClick={triggerImportClick}
            className="p-2 text-slate-400 hover:text-white hover:bg-[#222222]/40 border border-[#262626]/60 rounded-lg transition cursor-pointer flex items-center justify-center shrink-0"
            title="Import pack JSON"
          >
            <Upload className="h-3.5 w-3.5" />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
          </button>
        </div>

      </div>

      {/* Large Context Size Warning Badge if active pack > 10,000 characters */}
      {activePack && serializedSize > 10000 && (
        <div className="mt-2 bg-amber-950/20 border border-amber-900/35 rounded-lg p-2.5 flex items-start gap-2 text-amber-300">
          <AlertTriangle className="h-4.5 w-4.5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="text-[10.5px] leading-relaxed">
            <span className="font-bold">Caution: High Token Usage Risk.</span> This active context pack serialized size is <span className="font-mono font-bold">{serializedSize.toLocaleString()}</span> characters. Standard LLM workspace injection may consume high Gemini API tokens. Consider applying only critical source files or trimming custom rules.
          </div>
        </div>
      )}
    </div>
  );
};
