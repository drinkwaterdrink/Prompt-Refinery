/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { ProjectContextPack } from '../types';
import { 
  DEFAULT_PROJECT_PACKS, 
  validateProjectPack, 
  sanitizeProjectPack 
} from '../lib/projectPacks';
import { downloadJSON } from '../lib/exporters';

export function useProjectPacks(showToast: (msg: string) => void) {
  const [projectPacks, setProjectPacks] = useState<ProjectContextPack[]>([]);
  const [activePackId, setActivePackId] = useState<string | null>(null);

  // 1. Initial load from LocalStorage with fallback and corruption safety
  useEffect(() => {
    try {
      // Load packs
      const rawPacks = localStorage.getItem('prompt_refinery_project_packs');
      if (rawPacks) {
        const parsed = JSON.parse(rawPacks);
        if (Array.isArray(parsed)) {
          // Validate each pack
          const validPacks: ProjectContextPack[] = [];
          parsed.forEach((pack: any) => {
            const errs = validateProjectPack(pack);
            if (!errs) {
              validPacks.push(sanitizeProjectPack(pack));
            } else {
              console.warn(`Skipping invalid project pack on load: ${errs.join('; ')}`);
            }
          });
          setProjectPacks(validPacks);
        } else {
          // Fallback if not an array
          localStorage.setItem('prompt_refinery_project_packs', JSON.stringify(DEFAULT_PROJECT_PACKS));
          setProjectPacks(DEFAULT_PROJECT_PACKS);
        }
      } else {
        // Pre-fill with showcase default pack
        localStorage.setItem('prompt_refinery_project_packs', JSON.stringify(DEFAULT_PROJECT_PACKS));
        setProjectPacks(DEFAULT_PROJECT_PACKS);
      }

      // Load active pack ID
      const rawActiveId = localStorage.getItem('prompt_refinery_active_pack_id');
      if (rawActiveId) {
        setActivePackId(rawActiveId);
      }
    } catch (err) {
      console.error('Local storage project packs loading encountered a corruption error:', err);
      showToast('Could not load project context packs due to file corruption. Resetting storage.');
      // Reset safely
      localStorage.setItem('prompt_refinery_project_packs', JSON.stringify(DEFAULT_PROJECT_PACKS));
      setProjectPacks(DEFAULT_PROJECT_PACKS);
    }
  }, [showToast]);

  // Helper to persist list
  const persistPacks = useCallback((packsList: ProjectContextPack[]) => {
    try {
      const sanitized = packsList.map(p => sanitizeProjectPack(p));
      localStorage.setItem('prompt_refinery_project_packs', JSON.stringify(sanitized));
      setProjectPacks(sanitized);
    } catch (saveErr) {
      console.error('Failed to save project packs to LocalStorage:', saveErr);
      showToast('Error persisting project context packs.');
    }
  }, [showToast]);

  // Set active pack and persist
  const selectActivePack = useCallback((id: string | null) => {
    setActivePackId(id);
    try {
      if (id) {
        localStorage.setItem('prompt_refinery_active_pack_id', id);
      } else {
        localStorage.removeItem('prompt_refinery_active_pack_id');
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  // CRUD: Create
  const createPack = useCallback((packData: Omit<ProjectContextPack, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPack: ProjectContextPack = {
      ...packData,
      id: `pack_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toLocaleString(),
      updatedAt: new Date().toLocaleString()
    };

    setProjectPacks((prev) => {
      const next = [...prev, newPack];
      persistPacks(next);
      return next;
    });
    
    // Automatically select the newly created pack
    selectActivePack(newPack.id);
    showToast(`Project context pack "${newPack.name}" created.`);
    return newPack;
  }, [persistPacks, selectActivePack, showToast]);

  // CRUD: Update
  const updatePack = useCallback((id: string, packData: Partial<ProjectContextPack>) => {
    setProjectPacks((prev) => {
      const next = prev.map((pack) => {
        if (pack.id === id) {
          return {
            ...pack,
            ...packData,
            updatedAt: new Date().toLocaleString()
          };
        }
        return pack;
      });
      persistPacks(next);
      return next;
    });
    showToast('Project context pack updated.');
  }, [persistPacks, showToast]);

  // CRUD: Delete
  const deletePack = useCallback((id: string) => {
    setProjectPacks((prev) => {
      const next = prev.filter(pack => pack.id !== id);
      persistPacks(next);
      return next;
    });
    if (activePackId === id) {
      selectActivePack(null);
    }
    showToast('Project context pack removed.');
  }, [activePackId, persistPacks, selectActivePack, showToast]);

  // CRUD: Duplicate
  const duplicatePack = useCallback((id: string) => {
    const target = projectPacks.find(pack => pack.id === id);
    if (!target) return;

    const duplicated: ProjectContextPack = {
      ...target,
      id: `pack_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `${target.name} Copy`,
      createdAt: new Date().toLocaleString(),
      updatedAt: new Date().toLocaleString()
    };

    setProjectPacks((prev) => {
      const next = [...prev, duplicated];
      persistPacks(next);
      return next;
    });

    selectActivePack(duplicated.id);
    showToast(`Duplicated pack as "${duplicated.name}".`);
  }, [projectPacks, persistPacks, selectActivePack, showToast]);

  // Export Individual JSON Pack
  const exportPackJSON = useCallback((id: string) => {
    const target = projectPacks.find(pack => pack.id === id);
    if (!target) return;
    downloadJSON(target, `${target.name.toLowerCase().replace(/\s+/g, '_')}_context_pack.json`);
    showToast(`Exported "${target.name}" pack JSON.`);
  }, [projectPacks, showToast]);

  // Import JSON Pack
  const importPackJSON = useCallback((file: File): Promise<ProjectContextPack | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);
          
          const errs = validateProjectPack(parsed);
          if (errs) {
            showToast(`Import error: ${errs.join('; ')}`);
            resolve(null);
            return;
          }

          const importedPack: ProjectContextPack = {
            ...sanitizeProjectPack(parsed),
            id: `pack_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, // generate fresh ID to avoid overrides
            createdAt: new Date().toLocaleString(),
            updatedAt: new Date().toLocaleString()
          };

          setProjectPacks((prev) => {
            const next = [...prev, importedPack];
            persistPacks(next);
            return next;
          });

          selectActivePack(importedPack.id);
          showToast(`Imported project pack "${importedPack.name}".`);
          resolve(importedPack);
        } catch (err: any) {
          showToast(`Not a valid JSON project pack format: ${err.message}`);
          resolve(null);
        }
      };
      reader.readAsText(file);
    });
  }, [persistPacks, selectActivePack, showToast]);

  return {
    projectPacks,
    activePackId,
    activePack: projectPacks.find(p => p.id === activePackId) || null,
    selectActivePack,
    createPack,
    updatePack,
    deletePack,
    duplicatePack,
    exportPackJSON,
    importPackJSON
  };
}
export type UseProjectPacksReturn = ReturnType<typeof useProjectPacks>;
