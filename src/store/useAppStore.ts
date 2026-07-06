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
  createdAt?: number;
}

export interface HistoryEntry {
  id: string;
  resultUrl: string;
  createdAt: number;
}

interface AppState {
  targetImage: string | null;
  targetFile: File | null;
  modelImages: ModelImage[];
  generatedResults: GeneratedResult[];
  history: HistoryEntry[];
  isProcessingBatch: boolean;
  batchProgress: number;
  batchTotal: number;
  settingsOpen: boolean;
  historyOpen: boolean;
  refinementResult: GeneratedResult | null;
  darkMode: boolean;

  setTargetImage: (url: string | null, file?: File | null) => void;
  addModelImages: (images: ModelImage[]) => void;
  removeModelImage: (id: string) => void;
  toggleModelSelection: (id: string) => void;
  selectAllModels: () => void;
  deselectAllModels: () => void;
  updateResult: (id: string, partial: Partial<GeneratedResult>) => void;
  addResult: (result: GeneratedResult) => void;
  addToHistory: (entry: HistoryEntry) => void;
  clearHistory: () => void;
  setProcessing: (v: boolean) => void;
  setBatchProgress: (current: number, total: number) => void;
  setSettingsOpen: (v: boolean) => void;
  setHistoryOpen: (v: boolean) => void;
  setRefinementResult: (r: GeneratedResult | null) => void;
  toggleDarkMode: () => void;
  clearResults: () => void;
}

const STORAGE_KEY = "ai-photo-studio";

const loadFromStorage = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        generatedResults: parsed.generatedResults || [],
        history: parsed.history || [],
        darkMode: parsed.darkMode ?? true,
      };
    }
  } catch {}
  return { generatedResults: [], history: [], darkMode: true };
};

const persist = (partial: {
  generatedResults?: GeneratedResult[];
  history?: HistoryEntry[];
  darkMode?: boolean;
}) => {
  try {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...current, ...partial })
    );
  } catch {}
};

const stored = loadFromStorage();

export const useAppStore = create<AppState>((set) => ({
  targetImage: null,
  targetFile: null,
  modelImages: [],
  generatedResults: stored.generatedResults,
  history: stored.history,
  isProcessingBatch: false,
  batchProgress: 0,
  batchTotal: 0,
  settingsOpen: false,
  historyOpen: false,
  refinementResult: null,
  darkMode: stored.darkMode,

  setTargetImage: (url, file) => set({ targetImage: url, targetFile: file ?? null }),
  addModelImages: (images) => set((s) => ({ modelImages: [...s.modelImages, ...images] })),
  removeModelImage: (id) =>
    set((s) => ({ modelImages: s.modelImages.filter((m) => m.id !== id) })),
  toggleModelSelection: (id) =>
    set((s) => ({
      modelImages: s.modelImages.map((m) =>
        m.id === id ? { ...m, selected: !m.selected } : m
      ),
    })),
  selectAllModels: () =>
    set((s) => ({ modelImages: s.modelImages.map((m) => ({ ...m, selected: true })) })),
  deselectAllModels: () =>
    set((s) => ({ modelImages: s.modelImages.map((m) => ({ ...m, selected: false })) })),
  updateResult: (id, partial) => {
    set((s) => {
      const updated = s.generatedResults.map((r) =>
        r.id === id ? { ...r, ...partial } : r
      );
      let history = s.history;
      // Auto-add successful results to history
      if (partial.status === "success" && partial.resultUrl) {
        const already = history.find((h) => h.id === id);
        if (!already) {
          history = [
            { id, resultUrl: partial.resultUrl, createdAt: Date.now() },
            ...history,
          ];
        }
      }
      persist({ generatedResults: updated, history });
      return { generatedResults: updated, history };
    });
  },
  addResult: (result) => {
    set((s) => {
      const updated = [...s.generatedResults, { ...result, createdAt: Date.now() }];
      persist({ generatedResults: updated });
      return { generatedResults: updated };
    });
  },
  addToHistory: (entry) =>
    set((s) => {
      const history = [entry, ...s.history];
      persist({ history });
      return { history };
    }),
  clearHistory: () =>
    set(() => {
      persist({ history: [] });
      return { history: [] };
    }),
  setProcessing: (v) => set({ isProcessingBatch: v }),
  setBatchProgress: (current, total) => set({ batchProgress: current, batchTotal: total }),
  setSettingsOpen: (v) => set({ settingsOpen: v }),
  setHistoryOpen: (v) => set({ historyOpen: v }),
  setRefinementResult: (r) => set({ refinementResult: r }),
  toggleDarkMode: () =>
    set((s) => {
      const next = !s.darkMode;
      persist({ darkMode: next });
      return { darkMode: next };
    }),
  clearResults: () =>
    set(() => {
      persist({ generatedResults: [] });
      return { generatedResults: [] };
    }),
}));
