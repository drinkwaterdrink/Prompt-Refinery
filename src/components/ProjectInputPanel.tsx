/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { Sparkles, RotateCcw, Upload, Trash2, Folder, BookOpen, AlertTriangle } from 'lucide-react';
import { ProjectContextPack } from '../types';
import { ProjectPackSelector } from './ProjectPackSelector';

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

export const ProjectInputPanel: React.FC<ProjectInputPanelProps> = ({
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

    // Size limit check: 200KB
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
          <span className="text-[10px] font-mono font-bold tracking-widest text-[#D4AF37] uppercase flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse"></span>
            Project Optimization Inputs
          </span>
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
            {generationMode === 'mock' ? '🎭 Mock Engine' : generationMode === 'gemini' ? '⚡ Gemini Engine' : '🔌 Custom Engine'}
          </span>
        </div>

        {/* Engine Selector */}
        <div className="flex flex-col gap-1.5">
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
        </div>

        {/* 1. Project Name */}
        <div className="flex flex-col gap-2">
          <label htmlFor="project-name" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            1. Project Name <span className="text-[#D4AF37]">*</span>
          </label>
          <input
            id="project-name"
            type="text"
            required
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="e.g. My Gym Tracker or Fleet Dashboard"
            className="w-full bg-[#161616] border border-[#262626] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 text-sm font-sans rounded-lg p-2.5 text-slate-200 placeholder-slate-600 focus:outline-none transition-all duration-150"
          />
        </div>

        {/* 2. GitHub URL URL */}
        <div className="flex flex-col gap-2">
          <label htmlFor="repo-url" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            2. Public GitHub Repository URL <span className="text-slate-600 font-normal italic">(Optional)</span>
          </label>
          <input
            id="repo-url"
            type="url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="e.g. https://github.com/username/repo"
            className="w-full bg-[#161616] border border-[#262626] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 text-sm font-sans rounded-lg p-2.5 text-slate-200 placeholder-slate-600 focus:outline-none transition-all duration-150"
          />
          <p className="text-[9px] text-slate-500 font-mono leading-relaxed leading-snug">
            💡 Analyzes core reference files (README.md, package.json, server.ts, App.tsx) raw from public GitHub.
          </p>
        </div>

        {/* 3. PDP / Context / Notes */}
        <div className="flex flex-col gap-2">
          <label htmlFor="notes-context" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            3. Project Context / PDP / pasted notes <span className="text-[#D4AF37]">*</span>
          </label>
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
            id="notes-context"
            rows={4}
            required
            value={projectContext}
            onChange={(e) => setProjectContext(e.target.value)}
            placeholder='Paste your application README, project plan, architecture specifications, file maps, bug list, or vibe packets here...'
            className="w-full bg-[#161616] border border-[#262626] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 text-xs font-sans rounded-lg p-3 text-slate-200 placeholder-slate-600 focus:outline-none transition-all resize-y duration-150 leading-relaxed"
          />
        </div>

        {/* 4. Goal / Direction */}
        <div className="flex flex-col gap-2">
          <label htmlFor="goal-direction" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            4. Current Optimization Goal / Direction <span className="text-[#D4AF37]">*</span>
          </label>
          <select
            id="goal-direction"
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
            className="w-full bg-[#161616] border border-[#262626] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 text-xs font-semibold rounded-lg p-2.5 text-[#D4AF37] cursor-pointer focus:outline-none transition font-mono"
          >
            {DIRECTIONS.map(dir => (
              <option key={dir} value={dir}>{dir}</option>
            ))}
          </select>
        </div>

        {/* 5. Optional Context File Upload */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            5. Upload Context File <span className="text-slate-655 font-normal italic">(Optional)</span>
          </label>

          {uploadedFileName ? (
            <div className="flex items-center justify-between bg-[#1F1914] border border-[#D4AF37]/25 p-3 rounded-xl animate-fade-in">
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4 text-[#D4AF37]" />
                <div>
                  <span className="text-xs font-mono font-bold text-slate-250 block truncate max-w-[200px]">
                    {uploadedFileName}
                  </span>
                  <span className="text-[9px] text-[#D4AF37] font-mono">
                    {Math.round(uploadedContextText.length / 102.4) / 10} KB • Loaded
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="text-slate-500 hover:text-rose-400 transition p-1.5 cursor-pointer"
                title="Remove file"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-350 ${
                isDragging 
                  ? 'border-[#D4AF37] bg-[#D4AF37]/5 shadow-[0_0_15px_rgba(212,175,55,0.05)]' 
                  : 'border-[#262626] bg-[#161616]/25 hover:border-[#D4AF37]/30 hover:bg-[#161616]/40'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept=".txt,.md,.json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) processFile(file);
                }}
                className="hidden"
              />
              <Upload className="h-5 w-5 text-slate-500" />
              <div className="text-center">
                <p className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Drag & Drop or Browser File
                </p>
                <p className="text-[9px] text-slate-600 mt-1 font-mono">
                  Supports .txt, .md, .json • Max 200KB size limit
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions Frame */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClear}
            className="flex-[1] bg-[#161616] hover:bg-[#222222] border border-[#262626] text-slate-350 text-[10px] font-mono tracking-widest uppercase font-bold rounded-lg py-3 justify-center transition flex items-center gap-1.5 cursor-pointer"
          >
            Clear
          </button>
          <button
            type="submit"
            disabled={isGeneratingProject || !projectName.trim() || !projectContext.trim()}
            className={`flex-[3] text-[10px] font-mono tracking-widest uppercase font-bold rounded-lg py-3 transition relative overflow-hidden flex items-center justify-center gap-1.5 cursor-pointer ${
              !projectName.trim() || !projectContext.trim()
                ? 'bg-[#1E1E1E]/50 text-slate-600 border border-[#262626] cursor-not-allowed'
                : 'bg-[#D4AF37] hover:bg-[#C09E32] text-black shadow-[0_0_20px_rgba(212,175,55,0.15)] font-semibold'
            }`}
          >
            {isGeneratingProject ? (
              <>
                <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                <span>Auditing Codebase plan...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-black fill-black" />
                <span>Suggest Review Improvements</span>
              </>
            )}
          </button>
        </div>

      </form>

      {/* Methodology Advice */}
      <div className="bg-[#0E0E0E]/50 border border-[#1F1F1F] rounded-xl p-4 text-xs text-slate-400 flex flex-col gap-2">
        <span className="font-bold text-slate-300 flex items-center gap-1 font-mono uppercase text-[10px] tracking-wider">
          <BookOpen className="h-3.5 w-3.5 text-[#D4AF37]" /> Optimization Planner
        </span>
        <p className="leading-relaxed text-[11px] text-slate-405">
          Vibe coding requires small, iterative steps. Iterative Project Mode audits your current codebase files and directions to formulate targeted, category-sorted improvement tasks and single-step coding prompts.
        </p>
      </div>

    </section>
  );
};
