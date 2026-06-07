/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { Sparkles, RotateCcw, Upload, Trash2, Folder, BookOpen } from 'lucide-react';
import { ProjectContextPack } from '../types';
import { ProjectPackSelector } from './ProjectPackSelector';
import { EngineSelector } from './EngineSelector';

interface ProjectInputPanelProps {
  projectName: string;
  setProjectName: (val: string) => void;
  repoUrl: string;
  setRepoUrl: (val: string) => void;
  projectContext: string;
  setProjectContext: (val: string) => void;
  uploadedFileName: string;
  setUploadedFileName: (val: string) => void;
  uploadedContextText: string;
  setUploadedContextText: (val: string) => void;
  direction: string;
  setDirection: (val: string) => void;
  isGeneratingProject: boolean;
  generationMode: 'mock' | 'gemini' | 'custom_openai';
  setGenerationMode: (mode: 'mock' | 'gemini' | 'custom_openai') => void;
  onClear: () => void;
  onSubmit: (e: React.FormEvent) => void;
  showToast: (msg: string) => void;

  // Project Context Packs Props
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

const DIRECTIONS = [
  "Find UI/UX improvements",
  "Suggest new features",
  "Optimize mobile",
  "Improve prompt quality",
  "Prepare for release",
  "Find likely bugs",
  "Suggest monetizable additions",
  "Create next dev phases",
  "Review architecture",
  "Improve security/secrets handling"
];

export const ProjectInputPanel: React.FC<ProjectInputPanelProps> = React.memo(({
  projectName,
  setProjectName,
  repoUrl,
  setRepoUrl,
  projectContext,
  setProjectContext,
  uploadedFileName,
  setUploadedFileName,
  uploadedContextText,
  setUploadedContextText,
  direction,
  setDirection,
  isGeneratingProject,
  generationMode,
  setGenerationMode,
  onClear,
  onSubmit,
  showToast,
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
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file: File) => {
    const validExtensions = ['.txt', '.md', '.json'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      showToast('Only .txt, .md, and .json files are accepted.');
      return;
    }

    const MAX_SIZE = 200 * 1024;
    if (file.size > MAX_SIZE) {
      showToast('Context files are restricted to 200KB to prevent prompt token bloat!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setUploadedFileName(file.name);
      setUploadedContextText(content);
      showToast(`Context file "${file.name}" loaded successfully.`);
    };
    reader.onerror = () => {
      showToast('Failed to read upload file.');
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFileName('');
    setUploadedContextText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    showToast('Context file removed.');
  };

  return (
    <section className="lg:col-span-5 flex flex-col gap-6" id="project-controls-panel">
      <form onSubmit={onSubmit} className="bg-[#0E0E0E] border border-[#1F1F1F] rounded-2xl md:p-5 p-4 flex flex-col gap-5 shadow-2xl">
        
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold tracking-widest text-primary uppercase flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            Project Optimization Inputs
          </span>
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
            {generationMode === 'mock' ? '🎭 Mock Engine' : generationMode === 'gemini' ? '⚡ Gemini Engine' : '🔌 Custom Engine'}
          </span>
        </div>

        <EngineSelector generationMode={generationMode} setGenerationMode={setGenerationMode} />

        <div className="flex flex-col gap-2">
          <label htmlFor="project-name" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            1. Project Name <span className="text-primary">*</span>
          </label>
          <input
            type="text"
            id="project-name"
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            placeholder="e.g. PromptRefinery or My Workout Tracker"
            className="bg-[#121212] border border-[#262626] rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-650 outline-none focus:border-primary transition font-sans"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="repo-url" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Git Repository URL <span className="text-slate-600 font-normal italic">(Optional)</span>
          </label>
          <input
            type="text"
            id="repo-url"
            value={repoUrl}
            onChange={e => setRepoUrl(e.target.value)}
            placeholder="e.g. https://github.com/username/project"
            className="bg-[#121212] border border-[#262626] rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-650 outline-none focus:border-primary transition font-mono"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <label htmlFor="project-context" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              2. Core Codebase Details & Context <span className="text-primary">*</span>
            </label>
          </div>
          
          <ProjectPackSelector
            projectPacks={projectPacks}
            activePackId={activePackId}
            selectActivePack={selectActivePack}
            onCreateClick={onCreateClick}
            onEditClick={onEditClick}
            onDuplicateClick={onDuplicateClick}
            onDeleteClick={onDeleteClick}
            onExportClick={onExportClick}
            onImportClick={onImportClick}
            onApplyContext={onApplyContext}
          />

          <textarea
            id="project-context"
            rows={5}
            value={projectContext}
            onChange={e => setProjectContext(e.target.value)}
            placeholder="Explain the tech stack, files, structure, or copy-paste repo snapshots here..."
            className="w-full bg-[#121212] border border-[#262626] focus:border-primary focus:ring-1 focus:ring-[#00e5ff]/30 text-xs font-sans rounded-xl p-3 text-slate-200 placeholder-slate-650 focus:outline-none transition-all resize-y duration-150"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Attach Schema / Spec Context File <span className="text-slate-600 font-normal italic">(Optional, max 200KB)</span>
          </label>
          
          {!uploadedFileName ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border border-dashed rounded-xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${
                isDragging 
                  ? 'border-primary bg-primary/5' 
                  : 'border-[#262626] bg-[#121212]/30 hover:border-primary/50 hover:bg-[#121212]/50'
              }`}
            >
              <Upload className="h-5 w-5 text-slate-500" />
              <div className="text-xs text-slate-300 font-medium">Drag spec file here or click to browse</div>
              <div className="text-[9px] text-slate-600 font-mono">Accepts: .txt, .md, .json</div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) processFile(file);
                }}
                className="hidden"
                accept=".txt,.md,.json"
              />
            </div>
          ) : (
            <div className="bg-[#161616] border border-[#262626] rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4 text-primary" />
                <span className="text-xs font-mono font-semibold text-slate-200 truncate max-w-[200px]">
                  {uploadedFileName}
                </span>
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-900/30">
                  ATTACHED
                </span>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="text-slate-500 hover:text-red-400 transition cursor-pointer p-1"
                title="Remove attached file context"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="review-direction" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            3. Optimization Focus & Direction <span className="text-primary">*</span>
          </label>
          <select
            id="review-direction"
            value={direction}
            onChange={e => setDirection(e.target.value)}
            className="w-full bg-[#121212] border border-[#262626] focus:border-primary text-xs font-semibold rounded-xl p-2.5 text-slate-200 cursor-pointer focus:outline-none transition appearance-none"
          >
            {DIRECTIONS.map(dir => (
              <option key={dir} value={dir}>{dir}</option>
            ))}
          </select>
        </div>

        <div className="border-t border-[#1F1F1F] pt-4.5 flex gap-3 items-center">
          <button
            type="button"
            onClick={onClear}
            className="text-xs bg-transparent border border-[#262626] text-slate-400 font-bold px-4 py-2.5 rounded-xl transition hover:text-white active:scale-98 cursor-pointer flex items-center gap-1.5 hover:bg-[#161616]"
            title="Reset All Inputs"
          >
            <RotateCcw className="h-4 w-4" /> Clear
          </button>
          <button
            type="submit"
            disabled={isGeneratingProject || !projectName.trim() || !projectContext.trim()}
            className="flex-1 bg-primary disabled:bg-slate-800 text-black disabled:text-slate-500 font-bold text-xs px-5 py-2.5 rounded-xl transition hover:opacity-90 active:scale-98 shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
          >
            {isGeneratingProject ? (
              <>
                <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                <span>Auditing Codebase plan...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>Suggest Review Improvements</span>
              </>
            )}
          </button>
        </div>

      </form>

      <div className="bg-[#0E0E0E]/50 border border-[#1F1F1F] rounded-xl p-4 text-xs text-slate-400 flex flex-col gap-2">
        <span className="font-bold text-slate-300 flex items-center gap-1 font-mono uppercase text-[10px] tracking-wider">
          <BookOpen className="h-3.5 w-3.5 text-primary" /> Optimization Planner
        </span>
        <p className="leading-relaxed text-[11px] text-slate-405">
          Vibe coding requires small, iterative steps. Iterative Project Mode audits your current codebase files and directions to formulate targeted, category-sorted improvement tasks and single-step coding prompts.
        </p>
      </div>

    </section>
  );
});
