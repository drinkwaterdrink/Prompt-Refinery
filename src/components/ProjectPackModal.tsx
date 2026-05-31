/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, FolderGit, Save } from 'lucide-react';
import { ProjectContextPack } from '../types';

interface ProjectPackModalProps {
  isOpen: boolean;
  onClose: () => void;
  packToEdit: ProjectContextPack | null;
  onSave: (packData: Omit<ProjectContextPack, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdate: (id: string, packData: Partial<ProjectContextPack>) => void;
}

export const ProjectPackModal: React.FC<ProjectPackModalProps> = ({
  isOpen,
  onClose,
  packToEdit,
  onSave,
  onUpdate
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [techStack, setTechStack] = useState('');
  const [currentStatus, setCurrentStatus] = useState('');
  const [designPreferences, setDesignPreferences] = useState('');
  const [knownIssues, setKnownIssues] = useState('');
  const [futureIdeas, setFutureIdeas] = useState('');
  const [importantFilesRaw, setImportantFilesRaw] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (packToEdit) {
      setName(packToEdit.name || '');
      setDescription(packToEdit.description || '');
      setRepoUrl(packToEdit.repoUrl || '');
      setTechStack(packToEdit.techStack || '');
      setCurrentStatus(packToEdit.currentStatus || '');
      setDesignPreferences(packToEdit.designPreferences || '');
      setKnownIssues(packToEdit.knownIssues || '');
      setFutureIdeas(packToEdit.futureIdeas || '');
      setImportantFilesRaw((packToEdit.importantFiles || []).join(', '));
      setCustomInstructions(packToEdit.customInstructions || '');
    } else {
      setName('');
      setDescription('');
      setRepoUrl('');
      setTechStack('');
      setCurrentStatus('');
      setDesignPreferences('');
      setKnownIssues('');
      setFutureIdeas('');
      setImportantFilesRaw('');
      setCustomInstructions('');
    }
    setErrorMsg('');
  }, [packToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Pack Name is required.');
      return;
    }

    const filesArray = importantFilesRaw
      .split(',')
      .map(f => f.trim())
      .filter(f => f.length > 0);

    const packData = {
      name: name.trim(),
      description: description.trim(),
      repoUrl: repoUrl.trim(),
      techStack: techStack.trim(),
      currentStatus: currentStatus.trim(),
      designPreferences: designPreferences.trim(),
      knownIssues: knownIssues.trim(),
      futureIdeas: futureIdeas.trim(),
      importantFiles: filesArray,
      customInstructions: customInstructions.trim()
    };

    if (packToEdit) {
      onUpdate(packToEdit.id, packData);
    } else {
      onSave(packData);
    }
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/75 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pack-modal-title"
    >
      <div className="absolute inset-0 cursor-pointer" onClick={onClose}></div>
      
      <div className="relative w-full max-w-2xl bg-[#0F0E0E] border border-[#222222] rounded-2xl shadow-3xl overflow-hidden flex flex-col mx-4 animate-scale-up max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-[#1F1F1F] flex items-center justify-between bg-[#161616]/50">
          <div className="flex items-center gap-2.5 text-[#D4AF37]">
            <FolderGit className="h-5 w-5 text-[#D4AF37]" />
            <h3 className="font-serif font-bold text-base italic" id="pack-modal-title">
              {packToEdit ? 'Edit Context Pack' : 'Create Context Pack'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-white transition p-1.5 hover:bg-[#222222] rounded-lg cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scroll Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 text-sm">
          
          {errorMsg && (
            <div className="bg-red-950/20 border border-red-900/35 rounded-xl p-3 text-red-400 font-medium text-xs">
              {errorMsg}
            </div>
          )}

          {/* Core Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Pack Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. CloudMetrics Monitor"
                className="bg-[#121212] border border-[#262626] rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-[#D4AF37] transition font-mono"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                GitHub Repo URL
              </label>
              <input
                type="url"
                value={repoUrl}
                onChange={e => setRepoUrl(e.target.value)}
                placeholder="https://github.com/username/repo"
                className="bg-[#121212] border border-[#262626] rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-[#D4AF37] transition font-mono"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Short Description
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Provide a quick overview of what this application does..."
              className="bg-[#121212] border border-[#262626] rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-[#D4AF37] transition font-sans"
            />
          </div>

          {/* Technical Specs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Tech Stack
              </label>
              <input
                type="text"
                value={techStack}
                onChange={e => setTechStack(e.target.value)}
                placeholder="e.g. React 19 + TypeScript + TailwindCSS"
                className="bg-[#121212] border border-[#262626] rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-[#D4AF37] transition font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Current Status
              </label>
              <input
                type="text"
                value={currentStatus}
                onChange={e => setCurrentStatus(e.target.value)}
                placeholder="e.g. Static layout completed, starting on database..."
                className="bg-[#121212] border border-[#262626] rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-[#D4AF37] transition font-sans"
              />
            </div>
          </div>

          {/* Design & UX */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Design Preferences
              </label>
              <textarea
                value={designPreferences}
                onChange={e => setDesignPreferences(e.target.value)}
                placeholder="e.g. Charcoal dark mode, 8px rounded corners, glassmorphism headers..."
                rows={3}
                className="bg-[#121212] border border-[#262626] rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-[#D4AF37] transition font-sans resize-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Known Issues & Tech Debt
              </label>
              <textarea
                value={knownIssues}
                onChange={e => setKnownIssues(e.target.value)}
                placeholder="e.g. Memory leak in charts, slow initial database connection..."
                rows={3}
                className="bg-[#121212] border border-[#262626] rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-[#D4AF37] transition font-sans resize-none"
              />
            </div>
          </div>

          {/* Roadmap & Files */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Future Roadmap / Feature Ideas
              </label>
              <textarea
                value={futureIdeas}
                onChange={e => setFutureIdeas(e.target.value)}
                placeholder="e.g. Offline support, multi-tenant workspace partitions..."
                rows={3}
                className="bg-[#121212] border border-[#262626] rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-[#D4AF37] transition font-sans resize-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Important Files (Comma-separated)
              </label>
              <textarea
                value={importantFilesRaw}
                onChange={e => setImportantFilesRaw(e.target.value)}
                placeholder="e.g. src/App.tsx, src/hooks/useTelemetry.ts"
                rows={3}
                className="bg-[#121212] border border-[#262626] rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-[#D4AF37] transition font-mono resize-none"
              />
            </div>
          </div>

          {/* System override rules */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Custom High-Priority Instructions
            </label>
            <textarea
              value={customInstructions}
              onChange={e => setCustomInstructions(e.target.value)}
              placeholder="e.g. Do NOT rewrite whole files. Always prefer modular components. Maintain 100% accessible outline borders on all focused inputs."
              rows={3}
              className="bg-[#121212] border border-[#262626] rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-[#D4AF37] transition font-sans resize-none"
            />
            <p className="text-[10px] text-slate-500 font-mono">
              These guidelines are injected directly into Gemini system prompts as high-priority constraints overriding all general conventions.
            </p>
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-[#1F1F1F] flex items-center justify-end gap-3 font-sans">
            <button
              type="button"
              onClick={onClose}
              className="bg-transparent text-slate-400 hover:text-white border border-[#262626] font-bold text-xs px-5 py-2.5 rounded-xl transition active:scale-98 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#D4AF37] text-black font-bold text-xs px-5 py-2.5 rounded-xl transition hover:opacity-90 active:scale-98 shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Save className="h-4 w-4" />
              {packToEdit ? 'Save Changes' : 'Create Context Pack'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
