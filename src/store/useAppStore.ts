import { create } from "zustand";

export interface ModelImage {
  id: string;
  url: string;
  selected: boolean;
  file?: File;
}

export interface GeneratedResult {
  id: string;
  originalModelId: string;
  resultUrl: string;
  status: "pending" | "processing" | "success" | "error";
  errorMessage?: string;
}

interface AppState {
  targetImage: string | null;
  targetFile: File | null;
  modelImages: ModelImage[];
  generatedResults: GeneratedResult[];
  isProcessingBatch: boolean;
  batchProgress: number;
  batchTotal: number;
  settingsOpen: boolean;
  refinementResult: GeneratedResult | null;
  darkMode: boolean;

  setTargetImage: (url: string | null, file?: File | null) => void;
  addModelImages: (images: ModelImage[]) => void;
  removeModelImage: (id: string) => void;
  toggleModelSelection: (id: string) => void;
  selectAllModels: () => void;
  deselectAllModels: () => void;
  setGeneratedResults: (results: GeneratedResult[]) => void;
  updateResult: (id: string, partial: Partial<GeneratedResult>) => void;
  addResult: (result: GeneratedResult) => void;
  setProcessing: (v: boolean) => void;
  setBatchProgress: (current: number, total: number) => void;
  setSettingsOpen: (v: boolean) => void;
  setRefinementResult: (r: GeneratedResult | null) => void;
  toggleDarkMode: () => void;
  clearResults: () => void;
}

const loadFromStorage = () => {
  try {
    const data = localStorage.getItem("ai-photo-studio");
    if (data) {
      const parsed = JSON.parse(data);
      return {
        generatedResults: parsed.generatedResults || [],
        darkMode: parsed.darkMode ?? true,
      };
    }
  } catch {}
  return { generatedResults: [], darkMode: true };
};

const saveToStorage = (state: Partial<AppState>) => {
  try {
    localStorage.setItem(
      "ai-photo-studio",
      JSON.stringify({
        generatedResults: state.generatedResults,
        darkMode: state.darkMode,
      })
    );
  } catch {}
};

const stored = loadFromStorage();

export const useAppStore = create<AppState>((set, get) => ({
  targetImage: null,
  targetFile: null,
  modelImages: [],
  generatedResults: stored.generatedResults,
  isProcessingBatch: false,
  batchProgress: 0,
  batchTotal: 0,
  settingsOpen: false,
  refinementResult: null,
  darkMode: stored.darkMode,

  setTargetImage: (url, file) => set({ targetImage: url, targetFile: file ?? null }),
  addModelImages: (images) =>
    set((s) => {
      const updated = { modelImages: [...s.modelImages, ...images] };
      return updated;
    }),
  removeModelImage: (id) =>
    set((s) => ({ modelImages: s.modelImages.filter((m) => m.id !== id) })),
  toggleModelSelection: (id) =>
    set((s) => ({
      modelImages: s.modelImages.map((m) =>
        m.id === id ? { ...m, selected: !m.selected } : m
      ),
    })),
  selectAllModels: () =>
    set((s) => ({
      modelImages: s.modelImages.map((m) => ({ ...m, selected: true })),
    })),
  deselectAllModels: () =>
    set((s) => ({
      modelImages: s.modelImages.map((m) => ({ ...m, selected: false })),
    })),
  setGeneratedResults: (results) => {
    set({ generatedResults: results });
    saveToStorage({ ...get(), generatedResults: results });
  },
  updateResult: (id, partial) => {
    set((s) => {
      const updated = s.generatedResults.map((r) =>
        r.id === id ? { ...r, ...partial } : r
      );
      saveToStorage({ ...s, generatedResults: updated });
      return { generatedResults: updated };
    });
  },
  addResult: (result) => {
    set((s) => {
      const updated = [...s.generatedResults, result];
      saveToStorage({ ...s, generatedResults: updated });
      return { generatedResults: updated };
    });
  },
  setProcessing: (v) => set({ isProcessingBatch: v }),
  setBatchProgress: (current, total) =>
    set({ batchProgress: current, batchTotal: total }),
  setSettingsOpen: (v) => set({ settingsOpen: v }),
  setRefinementResult: (r) => set({ refinementResult: r }),
  toggleDarkMode: () =>
    set((s) => {
      const next = !s.darkMode;
      saveToStorage({ ...s, darkMode: next });
      return { darkMode: next };
    }),
  clearResults: () => {
    set({ generatedResults: [] });
    saveToStorage({ ...get(), generatedResults: [] });
  },
}));