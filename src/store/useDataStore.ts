import { create } from 'zustand';

interface DataState {
  columns: string[];
  rows: Record<string, unknown>[];
  fileName: string | null;
  isImportModalOpen: boolean;
  uploadedPhotos: Record<string, string>;
  activeRowIndex: number | null;
  isGenerating: boolean;
  generationProgress: number;
  generationTotal: number;

  setImportData: (columns: string[], rows: Record<string, unknown>[], fileName: string) => void;
  clearData: () => void;
  setImportModalOpen: (isOpen: boolean) => void;
  addUploadedPhotos: (files: File[]) => void;
  clearPhotos: () => void;
  setActiveRowIndex: (index: number | null) => void;
  setGenerationState: (isGenerating: boolean, progress: number, total: number) => void;
}

export const useDataStore = create<DataState>((set) => ({
  columns: [],
  rows: [],
  fileName: null,
  isImportModalOpen: false,
  uploadedPhotos: {},
  activeRowIndex: null,
  isGenerating: false,
  generationProgress: 0,
  generationTotal: 0,

  setImportData: (columns, rows, fileName) => set({ columns, rows, fileName, activeRowIndex: rows.length > 0 ? 0 : null }),
  clearData: () => set({ columns: [], rows: [], fileName: null, uploadedPhotos: {}, activeRowIndex: null }),
  setImportModalOpen: (isOpen) => set({ isImportModalOpen: isOpen }),
  addUploadedPhotos: (files) => set((state) => {
    const newPhotos = { ...state.uploadedPhotos };
    files.forEach(file => {
      const parts = file.name.split('.');
      if (parts.length > 1) parts.pop();
      const baseName = parts.join('.').toLowerCase();
      newPhotos[baseName] = URL.createObjectURL(file);
    });
    return { uploadedPhotos: newPhotos };
  }),
  clearPhotos: () => set({ uploadedPhotos: {} }),
  setActiveRowIndex: (index) => set({ activeRowIndex: index }),
  setGenerationState: (isGenerating, progress, total) => set({ isGenerating, generationProgress: progress, generationTotal: total }),
}));
