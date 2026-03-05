import { create } from "zustand";

export interface QuickCalculationDraft {
  cash: string;
  goldValue: string;
  debt: string;
}

interface QuickCalculationDraftState {
  draft: QuickCalculationDraft | null;
  setDraft: (draft: QuickCalculationDraft) => void;
  clearDraft: () => void;
  consumeDraft: () => QuickCalculationDraft | null;
}

export const useQuickCalculationDraftStore = create<QuickCalculationDraftState>()((set, get) => ({
  draft: null,
  setDraft: (draft) => set({ draft }),
  clearDraft: () => set({ draft: null }),
  consumeDraft: () => {
    const draft = get().draft;
    if (draft) {
      set({ draft: null });
    }
    return draft;
  },
}));
